import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing import image as keras_image
from tensorflow.keras.applications.resnet50 import preprocess_input
import numpy as np
import cv2
import os
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm
import matplotlib.pyplot as plt

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

def save_problem_features(problem_images_dir, model, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    file_list = os.listdir(problem_images_dir)

    for filename in tqdm(file_list, desc="Extracting Features", unit="file"):
        img_path = os.path.join(problem_images_dir, filename)
        img = cv2.imread(img_path)
        if img is not None:
            features = extract_features(img, model)
            np.save(os.path.join(output_dir, filename.split('.')[0] + '_features.npy'), features)

def find_similar_regions(scene_image, problem_features_dir, model, output_dir, step_size=50, min_similarity=0.6):
    scene_h, scene_w, _ = scene_image.shape
    window_size = 224  

    os.makedirs(output_dir, exist_ok=True)  

    total_windows = ((scene_h - window_size) // step_size + 1) * ((scene_w - window_size) // step_size + 1)
    
    with tqdm(total=total_windows, desc="Processing Windows") as pbar:
        for y in range(0, scene_h - window_size, step_size):
            for x in range(0, scene_w - window_size, step_size):
                window = scene_image[y:y+window_size, x:x+window_size]
                window_features = extract_features(window, model)

                for feature_file in os.listdir(problem_features_dir):
                    if not feature_file.endswith('.npy'):
                        continue 
                    
                    problem_features = np.load(os.path.join(problem_features_dir, feature_file), allow_pickle=True)
                    similarity = cosine_similarity(window_features, problem_features)[0][0]

                    if similarity > min_similarity: 
                        problem_name = os.path.basename(feature_file).split('_')[0]
                        output_filename = f"{similarity:.2f}_{problem_name}_x{x}_y{y}.png"
                        cv2.imwrite(os.path.join(output_dir, output_filename), window)
                        print(f"Saved match to {output_filename} with similarity {similarity}")
                
                pbar.update(1) 

def calculate_similarity_distribution(scene_image, problem_features_dir, model, step_size=50):
    scene_h, scene_w, _ = scene_image.shape
    window_size = 224 

    similarities = []  


    total_windows = ((scene_h - window_size) // step_size + 1) * ((scene_w - window_size) // step_size + 1)

    progress_bar = tqdm(total=total_windows, desc="Calculating Similarities") 

    for y in range(0, scene_h - window_size, step_size):
        for x in range(0, scene_w - window_size, step_size):
            window = scene_image[y:y+window_size, x:x+window_size]
            window_features = extract_features(window, model)

            for feature_file in os.listdir(problem_features_dir):
                if not feature_file.endswith('.npy'):
                    continue 

                problem_features = np.load(os.path.join(problem_features_dir, feature_file), allow_pickle=True)
                similarity = cosine_similarity(window_features, problem_features)[0][0]
                

                similarities.append(similarity)

            progress_bar.update(1)

    progress_bar.close() 

    return similarities  

def plot_similarity_distribution(similarities, bins=50):
    plt.hist(similarities, bins=bins, alpha=0.75, color='blue')
    plt.title('Similarity Distribution')
    plt.xlabel('Similarity')
    plt.ylabel('Frequency')
    plt.grid(True)
    plt.show()

if __name__ == "__main__":
    templates_dir = 'src/templates/'
    scenes_dir = 'src/scenes/'
    output_dir = 'src/results/'


    model = load_feature_extractor()

    # save_problem_features(templates_dir, model, 'problem_features')

    scene_image = cv2.imread('src/scenes/prob_3.jpeg')  
    find_similar_regions(scene_image, 'problem_features', model, output_dir)
    # scores = calculate_similarity_distribution(scene_image, 'problem_features', model)
    # plot_similarity_distribution(scores)