import os
import joblib
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# -------------------------------------------------
# Load Model
# -------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "models",
    "best_sleep_disorder_model.pkl"
)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

model_bundle = joblib.load(MODEL_PATH)

MODEL = model_bundle["model"]
FEATURE_COLUMNS = model_bundle["feature_columns"]
TARGET_LABEL_ENCODER = model_bundle.get("target_label_encoder")
FEATURE_LABEL_ENCODERS = model_bundle.get("feature_label_encoders", {})

print("MODEL LOADED SUCCESSFULLY")
print(type(model_bundle))
print("MODEL OBJECT:", MODEL)
print("Model path:", MODEL_PATH)
print("Feature Encoders:", FEATURE_LABEL_ENCODERS.keys())

EXPECTED_INPUT_FIELDS = FEATURE_COLUMNS

CATEGORICAL_INPUT_FEATURES_TO_ENCODE = [
    "Gender",
    "Occupation",
    "BMI Category"
]


@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to FitIQ API"
    })


@app.route("/predict", methods=["POST"])
def predict():

    try:
        payload = request.get_json(force=True)
    except Exception as e:
        return jsonify({
            "error": "Invalid JSON",
            "details": str(e)
        }), 400

    if not isinstance(payload, dict):
        return jsonify({
            "error": "Payload must be JSON"
        }), 400

    feature_cols = FEATURE_COLUMNS if FEATURE_COLUMNS else EXPECTED_INPUT_FIELDS

    missing = [c for c in feature_cols if c not in payload]

    if missing:
        return jsonify({
            "error": "Missing fields",
            "missing_fields": missing
        }), 400

    row = {c: payload[c] for c in feature_cols}

    X = pd.DataFrame([row], columns=feature_cols)

    print("\nReceived DataFrame")
    print(X)

    numeric_fields = [
        "Age",
        "Sleep Duration",
        "Quality of Sleep",
        "Physical Activity Level",
        "Stress Level",
        "Heart Rate",
        "Daily Steps",
        "Systolic_BP",
        "Diastolic_BP"
    ]

    for col in numeric_fields:

        if col in X.columns:

            X[col] = pd.to_numeric(
                X[col],
                errors="coerce"
            )

            if X[col].isnull().any():

                return jsonify({
                    "error": f"Invalid numeric value for {col}"
                }), 400
                # ---------------------------------------------
    # Encode categorical columns
    # ---------------------------------------------
    for col in CATEGORICAL_INPUT_FEATURES_TO_ENCODE:

        if col not in X.columns:
            continue

        encoder = FEATURE_LABEL_ENCODERS.get(col)

        if encoder is None:
            return jsonify({
                "error": f"No encoder found for '{col}'"
            }), 500

        try:
            X[col] = encoder.transform(X[col].astype(str))
        except ValueError as e:
            return jsonify({
                "error": f"Unknown category in '{col}'",
                "details": str(e)
            }), 400

    print("\nEncoded DataFrame")
    print(X)
    print(X.dtypes)

    # ---------------------------------------------
    # Final validation
    # ---------------------------------------------
    non_numeric = X.select_dtypes(
        include=["object", "string", "category"]
    ).columns.tolist()

    if non_numeric:
        return jsonify({
            "error": "Non-numeric columns remain",
            "columns": non_numeric
        }), 400

    if X.isnull().any().any():
        return jsonify({
            "error": "Null values remain after preprocessing"
        }), 400

    # ---------------------------------------------
    # Prediction
    # ---------------------------------------------
    try:
        prediction = MODEL.predict(X)
        pred = int(prediction[0])
    except Exception as e:
        return jsonify({
            "error": "Prediction failed",
            "details": str(e)
        }), 500

    # ---------------------------------------------
    # Decode prediction
    # ---------------------------------------------
    if TARGET_LABEL_ENCODER is not None:
        try:
            decoded = TARGET_LABEL_ENCODER.inverse_transform([pred])[0]

            if str(decoded).lower() in [
                "none",
                "no sleep disorder",
                "no"
            ]:
                message = "No Sleep Disorder"
            else:
                message = f"Sleep Disorder Detected: {decoded}"

        except Exception:
            if pred == 0:
                message = "No Sleep Disorder"
            else:
                message = "Sleep Disorder Detected"

    else:
        if pred == 0:
            message = "No Sleep Disorder"
        else:
            message = "Sleep Disorder Detected"

    return jsonify({
        "prediction": pred,
        "message": message
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )