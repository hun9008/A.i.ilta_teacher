import cv2
import os
from image_processing import extract_features, find_best_match

def process_scene(scene_path, templates_dir, output_dir, step_size=50, min_match_count=10):
    scene_image = cv2.imread(scene_path)

    if scene_image is None:
        print(f"Error: Could not load scene image from {scene_path}")
        return

    template_files = os.listdir(templates_dir)
    for template_file in template_files:
        template_path = os.path.join(templates_dir, template_file)
        template_image = cv2.imread(template_path)
        
        if template_image is None:
            print(f"Error: Could not load template image from {template_path}")
            continue
        
        template_keypoints, template_descriptors = extract_features(template_image)

        best_match, bbox = find_best_match(scene_image, template_descriptors, step_size, min_match_count)

        if best_match is not None:
            output_filename = f"{os.path.basename(scene_path).split('.')[0]}_{template_file.split('.')[0]}.png"
            output_path = os.path.join(output_dir, output_filename)
            cv2.imwrite(output_path, best_match)
            print(f"Saved match to {output_path}")
        else:
            print(f"No match found for {template_file} in {scene_path}")

if __name__ == "__main__":
    templates_dir = 'src/templates/'
    scenes_dir = 'src/scenes/'
    output_dir = 'results/'
    
    os.makedirs(output_dir, exist_ok=True)

    specific_scene_file = 'prob_3.jpeg'
    scene_path = os.path.join(scenes_dir, specific_scene_file)
    
    process_scene(scene_path, templates_dir, output_dir)