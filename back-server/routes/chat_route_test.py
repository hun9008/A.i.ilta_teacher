from hand_test_example import origin_image, solutions_storage, concepts_storage, ocrs_storage
import re

step_elements = []

for solution in solutions_storage:
    steps = re.split(r'\*\*Step \d+:\*\*|\*\*Answer:\*\*', solution)
    steps_array = [step.strip() for step in steps[1:] if step.strip()]

    if len(steps_array) > 0:
        steps_array[-1] = f"Answer: {steps_array[-1]}"

    step_elements.extend(steps_array)


for step in step_elements:
    print(step)
    print("=====================================")
    print("\n")