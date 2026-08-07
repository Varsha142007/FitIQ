# predict.py
# Test the saved sleep disorder classification model with a sample input.
# - Loads the trained model artifact saved by train_model.py
# - Prepares a realistic single-sample input using the same feature names/order used during training
# - Applies any saved LabelEncoders for categorical features
# - Runs prediction and prints a human-friendly interpretation

import os
import joblib
import pandas as pd

# ----------------------------
# Load Model
# ----------------------------

MODEL_PATH = os.path.join("models", "best_sleep_disorder_model.pkl")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("Model not found!")

model_bundle = joblib.load(MODEL_PATH)

model = model_bundle["model"]
feature_columns = model_bundle["feature_columns"]

# ----------------------------
# Sample Input
# (Use encoded values exactly like the training dataset)
# ----------------------------

sample_input = pd.DataFrame([{
    "Gender": 0,
    "Age": 30,
    "Occupation": 3,
    "Sleep Duration": 7.5,
    "Quality of Sleep": 8,
    "Physical Activity Level": 60,
    "Stress Level": 4,
    "BMI Category": 0,
    "Heart Rate": 70,
    "Daily Steps": 8000,
    "Systolic_BP": 120,
    "Diastolic_BP": 80
}])

# Keep feature order exactly the same
sample_input = sample_input[feature_columns]

print("\nInput Data:")
print(sample_input)

# ----------------------------
# Prediction
# ----------------------------

prediction = model.predict(sample_input)[0]

print("\nPrediction:", prediction)

if prediction == 0:
    print("No Sleep Disorder")
else:
    print("Sleep Disorder Detected")