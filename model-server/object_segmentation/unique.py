import os
import cv2
import numpy as np
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing import image as keras_image
from tensorflow.keras.applications.resnet50 import preprocess_input
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm

def load_feature_extractor():
    base_model = ResNet50(weights='imagenet', include_top=False, pooling='avg')
    return base_model

def preprocess_image(image, target_size=(224, 224)):
    img = cv2.resize(image, target_size)
    img = keras_image.img_to_array(img)
    img = np.expand_dims(img, axis=0)
    img = preprocess_input(img)
    return img

def extract_features(image, model):
    preprocessed_img = preprocess_image(image)
    features = model.predict(preprocessed_img)
    return features

def save_unique_images(input_dir, output_dir, model, similarity_threshold=0.8):
    os.makedirs(output_dir, exist_ok=True)
    unique_images = []  

    for filename in tqdm(os.listdir(input_dir), desc="Processing Images", unit="file"):
        img_path = os.path.join(input_dir, filename)
        img = cv2.imread(img_path)
        if img is not None:
            current_features = extract_features(img, model)
            
            is_unique = True
            for saved_features in unique_images:
                similarity = cosine_similarity(current_features, saved_features)[0][0]
                if similarity >= similarity_threshold:
                    is_unique = False
                    break
            
            if is_unique:
                unique_images.append(current_features)
                output_path = os.path.join(output_dir, filename)
                cv2.imwrite(output_path, img)
                print(f"Saved unique image: {filename}")

if __name__ == "__main__":
    input_dir = 'src/results/' 
    output_dir = 'src/unique_results/' 
    model = load_feature_extractor()

    save_unique_images(input_dir, output_dir, model, similarity_threshold=0.7)