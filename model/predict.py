
# predict.py
# Test the saved Sleep Disorder classification model.
#
# This version:
# - Loads the trained model
# - Loads the LabelEncoders saved during preprocessing
# - Accepts human-readable categorical values
# - Converts them using the SAME encoders used during training
# - Keeps the exact feature order expected by the model
# - Converts the prediction back to the actual disorder name


import os
import joblib
import pandas as pd


# ==========================================================
# Configuration
# ==========================================================

MODEL_PATH = os.path.join(
    "models",
    "best_sleep_disorder_model.pkl"
)

ENCODER_PATH = os.path.join(
    "models",
    "label_encoders.pkl"
)


# ==========================================================
# Check files
# ==========================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found at: {MODEL_PATH}\n"
        "Please run train_model.py first."
    )

if not os.path.exists(ENCODER_PATH):
    raise FileNotFoundError(
        f"Label encoders not found at: {ENCODER_PATH}\n"
        "Please run preprocessing.py first."
    )


# ==========================================================
# Load model
# ==========================================================

model_bundle = joblib.load(
    MODEL_PATH
)

model = model_bundle["model"]

feature_columns = model_bundle[
    "feature_columns"
]

target_column = model_bundle[
    "target_column"
]


# ==========================================================
# Load encoders
# ==========================================================

label_encoders = joblib.load(
    ENCODER_PATH
)


# ==========================================================
# Display available categories
# ==========================================================

print("\nAvailable categorical values:")

for column in [
    "Gender",
    "Occupation",
    "BMI Category"
]:

    if column in label_encoders:

        print(
            f"\n{column}:"
        )

        print(
            list(
                label_encoders[
                    column
                ].classes_
            )
        )


# ==========================================================
# Sample human-readable input
# ==========================================================

sample_input = {

    "Gender": "Male",

    "Age": 30,

    "Occupation": "Engineer",

    "Sleep Duration": 7.5,

    "Quality of Sleep": 8,

    "Physical Activity Level": 60,

    "Stress Level": 4,

    "BMI Category": "Normal Weight",

    "Heart Rate": 70,

    "Daily Steps": 8000,

    "Systolic_BP": 120,

    "Diastolic_BP": 80
}


# ==========================================================
# Convert categorical values using saved encoders
# ==========================================================

processed_input = sample_input.copy()


categorical_columns = [
    "Gender",
    "Occupation",
    "BMI Category"
]


for column in categorical_columns:

    if column in label_encoders:

        encoder = label_encoders[
            column
        ]

        value = processed_input[
            column
        ]

        if value not in encoder.classes_:

            raise ValueError(
                f"Invalid value '{value}' "
                f"for {column}.\n"
                f"Available values: "
                f"{list(encoder.classes_)}"
            )

        processed_input[
            column
        ] = encoder.transform(
            [value]
        )[0]


# ==========================================================
# Create DataFrame
# ==========================================================

input_df = pd.DataFrame(
    [processed_input]
)


# ==========================================================
# Ensure correct feature order
# ==========================================================

input_df = input_df[
    feature_columns
]


# ==========================================================
# Display input
# ==========================================================

print("\n========================================")

print("Input Data:")

print("========================================")

print(input_df)

print()


# ==========================================================
# Prediction
# ==========================================================

prediction = model.predict(
    input_df
)[0]


# ==========================================================
# Convert prediction to human-readable label
# ==========================================================

target_encoder = label_encoders[
    target_column
]

prediction_label = target_encoder.inverse_transform(
    [int(prediction)]
)[0]


# ==========================================================
# Display result
# ==========================================================

print("========================================")

print("Prediction Result:")

print("========================================")

print(
    "Encoded prediction:",
    int(prediction)
)

print(
    "Sleep Disorder:",
    prediction_label
)

print()


# ==========================================================
# Prediction probability
# ==========================================================

if hasattr(model, "predict_proba"):

    probabilities = model.predict_proba(
        input_df
    )[0]

    print(
        "Prediction probabilities:"
    )

    for class_number, probability in zip(
        model.classes_,
        probabilities
    ):

        class_name = (
            target_encoder
            .inverse_transform(
                [int(class_number)]
            )[0]
        )

        print(
            f"{class_name}: "
            f"{probability * 100:.2f}%"
        )

print("========================================")

