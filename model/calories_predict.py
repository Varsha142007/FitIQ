import os
import joblib
import pandas as pd

# ============================================================
# Step 8: Test Saved Calories Prediction Model
# ============================================================

# Get FitIQ project directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Correct model path
model_path = os.path.join(
    BASE_DIR,
    "models",
    "best_calories_model.pkl"
)

# Load saved model
model_data = joblib.load(model_path)

model = model_data["model"]
feature_columns = model_data["feature_columns"]
gender_encoder = model_data["gender_encoder"]

print("Model loaded successfully!")

print("\nExpected features:")
print(feature_columns)

print("\nSaved Gender classes:")
print(gender_encoder.classes_)


# ============================================================
# Sample input
# ============================================================

sample_data = {
    "Gender": "male",
    "Age": 25,
    "Height": 175,
    "Weight": 70,
    "Duration": 30,
    "Heart_Rate": 100,
    "Body_Temp": 38.0
}

input_df = pd.DataFrame([sample_data])

print("\nOriginal input:")
print(input_df)


# ============================================================
# Encode Gender
# ============================================================

input_df["Gender"] = gender_encoder.transform(
    input_df["Gender"]
)

# Make sure feature order is correct
input_df = input_df[feature_columns]

print("\nEncoded input:")
print(input_df)


# ============================================================
# Prediction
# ============================================================

prediction = model.predict(input_df)

print("\nPredicted Calories:")
print(f"{prediction[0]:.2f}")