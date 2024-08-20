import cv2 as cv
import numpy as np
import mediapipe as mp
import math
import socket
import time
import csv
from datetime import datetime
import os

# Parameters Documentation

## User-Specific Measurements
# USER_FACE_WIDTH: The horizontal distance between the outer edges of the user's cheekbones in millimeters. 
# This measurement is used to scale the 3D model points for head pose estimation.
# Measure your face width and adjust the value accordingly.
USER_FACE_WIDTH = 140  # [mm]

## Camera Parameters (not currently used in calculations)
# NOSE_TO_CAMERA_DISTANCE: The distance from the tip of the nose to the camera lens in millimeters.
# Intended for future use where accurate physical distance measurements may be necessary.
NOSE_TO_CAMERA_DISTANCE = 600  # [mm]

## Configuration Parameters
# PRINT_DATA: Enable or disable the printing of data to the console for debugging.
PRINT_DATA = True

# SHOW_ALL_FEATURES: If True, display all facial landmarks on the video feed.
SHOW_ALL_FEATURES = True

# LOG_DATA: Enable or disable logging of data to a CSV file.
LOG_DATA = True

# LOG_ALL_FEATURES: If True, log all facial landmarks to the CSV file.
LOG_ALL_FEATURES = False

# ENABLE_HEAD_POSE: Enable the head position and orientation estimator.
ENABLE_HEAD_POSE = True

# TOTAL_BLINKS: Counter for the total number of blinks detected.
TOTAL_BLINKS = 0

# EYES_BLINK_FRAME_COUNTER: Counter for consecutive frames with detected potential blinks.
EYES_BLINK_FRAME_COUNTER = 0

# BLINK_THRESHOLD: Eye aspect ratio threshold below which a blink is registered.
BLINK_THRESHOLD = 0.51

# EYE_AR_CONSEC_FRAMES: Number of consecutive frames below the threshold required to confirm a blink.
EYE_AR_CONSEC_FRAMES = 2

## Head Pose Estimation Landmark Indices
# These indices correspond to the specific facial landmarks used for head pose estimation.
LEFT_EYE_IRIS = [474, 475, 476, 477]
RIGHT_EYE_IRIS = [469, 470, 471, 472]
LEFT_EYE_OUTER_CORNER = [33]
LEFT_EYE_INNER_CORNER = [133]
RIGHT_EYE_OUTER_CORNER = [362]
RIGHT_EYE_INNER_CORNER = [263]
RIGHT_EYE_POINTS = [33, 160, 159, 158, 133, 153, 145, 144]
LEFT_EYE_POINTS = [362, 385, 386, 387, 263, 373, 374, 380]
NOSE_TIP_INDEX = 4
CHIN_INDEX = 152
LEFT_EYE_LEFT_CORNER_INDEX = 33
RIGHT_EYE_RIGHT_CORNER_INDEX = 263
LEFT_MOUTH_CORNER_INDEX = 61
RIGHT_MOUTH_CORNER_INDEX = 291

## MediaPipe Model Confidence Parameters
# These thresholds determine how confidently the model must detect or track to consider the results valid.
MIN_DETECTION_CONFIDENCE = 0.8
MIN_TRACKING_CONFIDENCE = 0.8

## Angle Normalization Parameters
# MOVING_AVERAGE_WINDOW: The number of frames over which to calculate the moving average for smoothing angles.
MOVING_AVERAGE_WINDOW = 10

# Initial Calibration Flags
# initial_pitch, initial_yaw, initial_roll: Store the initial head pose angles for calibration purposes.
# calibrated: A flag indicating whether the initial calibration has been performed.
initial_pitch, initial_yaw, initial_roll = None, None, None
calibrated = False

# User-configurable parameters
PRINT_DATA = True  # Enable/disable data printing
SHOW_ALL_FEATURES = True  # Show all facial landmarks if True
LOG_ALL_FEATURES = True  # Log all facial landmarks if True
LOG_FOLDER = "logs"  # Folder to store log files

# eyes blinking variables
SHOW_BLINK_COUNT_ON_SCREEN = True  # Toggle to show the blink count on the video feed
TOTAL_FOCUS = 0
TOTAL_BLINKS = 0  # Tracks the total number of blinks detected
EYES_BLINK_FRAME_COUNTER = (
    0  # Counts the number of consecutive frames with a potential blink
)
BLINK_THRESHOLD = 0.51  # Threshold for the eye aspect ratio to trigger a blink
EYE_AR_CONSEC_FRAMES = (
    2  # Number of consecutive frames below the threshold to confirm a blink
)

# Iris and eye corners landmarks indices
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]
L_H_LEFT = [33]  # Left eye Left Corner
L_H_RIGHT = [133]  # Left eye Right Corner
R_H_LEFT = [362]  # Right eye Left Corner
R_H_RIGHT = [263]  # Right eye Right Corner

# Blinking Detection landmark's indices.
# P0, P3, P4, P5, P8, P11, P12, P13
RIGHT_EYE_POINTS = [33, 160, 159, 158, 133, 153, 145, 144]
LEFT_EYE_POINTS = [362, 385, 386, 387, 263, 373, 374, 380]

# Face Selected points indices for Head Pose Estimation
_indices_pose = [1, 33, 61, 199, 263, 291]

# Function to calculate vector position
def vector_position(point1, point2):
    x1, y1 = point1.ravel()
    x2, y2 = point2.ravel()
    return x2 - x1, y2 - y1

def euclidean_distance_3D(points):
    # Get the three points.
    P0, P3, P4, P5, P8, P11, P12, P13 = points

    # Calculate the numerator.
    numerator = (
        np.linalg.norm(P3 - P13) ** 3
        + np.linalg.norm(P4 - P12) ** 3
        + np.linalg.norm(P5 - P11) ** 3
    )

    # Calculate the denominator.
    denominator = 3 * np.linalg.norm(P0 - P8) ** 3

    # Calculate the distance.
    distance = numerator / denominator

    return distance

def estimate_head_pose(landmarks, image_size):
    # Scale factor based on user's face width (assumes model face width is 150mm)
    scale_factor = USER_FACE_WIDTH / 150.0
    # 3D model points.
    model_points = np.array([
        (0.0, 0.0, 0.0),             # Nose tip
        (0.0, -330.0 * scale_factor, -65.0 * scale_factor),        # Chin
        (-225.0 * scale_factor, 170.0 * scale_factor, -135.0 * scale_factor),     # Left eye left corner
        (225.0 * scale_factor, 170.0 * scale_factor, -135.0 * scale_factor),      # Right eye right corner
        (-150.0 * scale_factor, -150.0 * scale_factor, -125.0 * scale_factor),    # Left Mouth corner
        (150.0 * scale_factor, -150.0 * scale_factor, -125.0 * scale_factor)      # Right mouth corner
    ])
    

    # Camera internals
    focal_length = image_size[1]
    center = (image_size[1]/2, image_size[0]/2)
    camera_matrix = np.array(
        [[focal_length, 0, center[0]],
         [0, focal_length, center[1]],
         [0, 0, 1]], dtype = "double"
    )

    # Assuming no lens distortion
    dist_coeffs = np.zeros((4,1))

    # 2D image points from landmarks, using defined indices
    image_points = np.array([
        landmarks[NOSE_TIP_INDEX],            # Nose tip
        landmarks[CHIN_INDEX],                # Chin
        landmarks[LEFT_EYE_LEFT_CORNER_INDEX],  # Left eye left corner
        landmarks[RIGHT_EYE_RIGHT_CORNER_INDEX],  # Right eye right corner
        landmarks[LEFT_MOUTH_CORNER_INDEX],      # Left mouth corner
        landmarks[RIGHT_MOUTH_CORNER_INDEX]      # Right mouth corner
    ], dtype="double")


    # Solve for pose
    (success, rotation_vector, translation_vector) = cv.solvePnP(model_points, image_points, camera_matrix, dist_coeffs, flags=cv.SOLVEPNP_ITERATIVE)

    # Convert rotation vector to rotation matrix
    rotation_matrix, _ = cv.Rodrigues(rotation_vector)

    # Combine rotation matrix and translation vector to form a 3x4 projection matrix
    projection_matrix = np.hstack((rotation_matrix, translation_vector.reshape(-1, 1)))

    # Decompose the projection matrix to extract Euler angles
    _, _, _, _, _, _, euler_angles = cv.decomposeProjectionMatrix(projection_matrix)
    pitch, yaw, roll = euler_angles.flatten()[:3]


     # Normalize the pitch angle
    pitch = normalize_pitch(pitch)

    return pitch, yaw, roll

def normalize_pitch(pitch):
    # Map the pitch angle to the range [-180, 180]
    if pitch > 180:
        pitch -= 360

    # Invert the pitch angle for intuitive up/down movement
    pitch = -pitch

    # Ensure that the pitch is within the range of [-90, 90]
    if pitch < -90:
        pitch = -(180 + pitch)
    elif pitch > 90:
        pitch = 180 - pitch
        
    pitch = -pitch

    return pitch

# This function calculates the blinking ratio of a person.
def blinking_ratio(landmarks):
    # Get the right eye ratio.
    right_eye_ratio = euclidean_distance_3D(landmarks[RIGHT_EYE_POINTS])

    # Get the left eye ratio.
    left_eye_ratio = euclidean_distance_3D(landmarks[LEFT_EYE_POINTS])

    # Calculate the blinking ratio.
    ratio = (right_eye_ratio + left_eye_ratio + 1) / 2

    return ratio

mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=MIN_DETECTION_CONFIDENCE,
    min_tracking_confidence=MIN_TRACKING_CONFIDENCE,
)

# Preparing for CSV logging
csv_data = []
if not os.path.exists(LOG_FOLDER):
    os.makedirs(LOG_FOLDER)

# Column names for CSV file
column_names = [
    "Timestamp (ms)",
    "Total Blink Count",
    "Is Focusing Count"
]
    
#main function
def is_focus(decoded_img):    
    frame = decoded_img
    
    rgb_frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
    img_h, img_w = frame.shape[:2]
    results = mp_face_mesh.process(rgb_frame)
    
    if results.multi_face_landmarks:
        mesh_points = np.array(
            [
                np.multiply([p.x, p.y], [img_w, img_h]).astype(int)
                for p in results.multi_face_landmarks[0].landmark
            ]
        )

        # Get the 3D landmarks from facemesh x, y and z(z is distance from 0 points)
        # just normalize values
        mesh_points_3D = np.array(
            [[n.x, n.y, n.z] for n in results.multi_face_landmarks[0].landmark]
        )
        # getting the head pose estimation 3d points
        head_pose_points_3D = np.multiply(
            mesh_points_3D[_indices_pose], [img_w, img_h, 1]
        )
        head_pose_points_2D = mesh_points[_indices_pose]

        # collect nose three dimension and two dimension points
        nose_3D_point = np.multiply(head_pose_points_3D[0], [1, 1, 3000])
        nose_2D_point = head_pose_points_2D[0]

        # create the camera matrix
        focal_length = 1 * img_w

        cam_matrix = np.array(
            [[focal_length, 0, img_h / 2], [0, focal_length, img_w / 2], [0, 0, 1]]
        )

        # The distortion parameters
        dist_matrix = np.zeros((4, 1), dtype=np.float64)

        head_pose_points_2D = np.delete(head_pose_points_3D, 2, axis=1)
        head_pose_points_3D = head_pose_points_3D.astype(np.float64)
        head_pose_points_2D = head_pose_points_2D.astype(np.float64)
        # Solve PnP
        success, rot_vec, trans_vec = cv.solvePnP(
            head_pose_points_3D, head_pose_points_2D, cam_matrix, dist_matrix
        )
        # Get rotational matrix
        rotation_matrix, jac = cv.Rodrigues(rot_vec)

        # Get angles
        angles, mtxR, mtxQ, Qx, Qy, Qz = cv.RQDecomp3x3(rotation_matrix)

        # Get the y rotation degree
        angle_x = angles[0] * 360
        angle_y = angles[1] * 360
        z = angles[2] * 360

        # if angle cross the values then
        threshold_angle = 5
        # See where the user's head tilting
        lookat=""
        is_focus=0
        if angle_y < -threshold_angle:
            face_looks = "Right"
        elif angle_y > threshold_angle:
            face_looks = "Left"
        elif angle_x < -(threshold_angle-3):
            lookat = f"You are in {face_looks}"
            is_focus=1
        elif angle_x > threshold_angle:
            face_looks = "Up"
        else:
            lookat = f"You are looking {face_looks}"
            is_focus=1
        
        result = is_focus

        # getting the blinking ratio
        eyes_aspect_ratio = blinking_ratio(mesh_points_3D)
        # checking if ear less then or equal to required threshold if yes then
        # count the number of frame frame while eyes are closed.
        if eyes_aspect_ratio <= BLINK_THRESHOLD:
            EYES_BLINK_FRAME_COUNTER += 1
        # else check if eyes are closed is greater EYE_AR_CONSEC_FRAMES frame then
        # count the this as a blink
        # make frame counter equal to zero

        else:
            if EYES_BLINK_FRAME_COUNTER > EYE_AR_CONSEC_FRAMES:
                TOTAL_BLINKS += 1
            EYES_BLINK_FRAME_COUNTER = 0

        # Logging data
        if LOG_DATA:
            timestamp = int(time.time() * 1000)  # Current timestamp in milliseconds
            log_entry = [
                timestamp,
                TOTAL_BLINKS,
                TOTAL_FOCUS
            ]  # Include blink count in CSV
            log_entry = [timestamp, TOTAL_BLINKS, TOTAL_FOCUS]  # Include blink count in CSV
            
            # Append head pose data if enabled
            csv_data.append(log_entry)

        # Sending data through socket
        timestamp = int(time.time() * 1000)  # Current timestamp in milliseconds
        # Create a packet with mixed types (int64 for timestamp and int32 for the rest)
    
    return result