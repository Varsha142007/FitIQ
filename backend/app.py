import os
import joblib
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


# ==========================================================
# BASE DIRECTORY
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ==========================================================
# SLEEP DISORDER MODEL
# ==========================================================

MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "models",
    "best_sleep_disorder_model.pkl"
)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Sleep model not found: {MODEL_PATH}"
    )

model_bundle = joblib.load(MODEL_PATH)

MODEL = model_bundle["model"]

FEATURE_COLUMNS = model_bundle["feature_columns"]

TARGET_LABEL_ENCODER = model_bundle.get(
    "target_label_encoder"
)

FEATURE_LABEL_ENCODERS = model_bundle.get(
    "feature_label_encoders",
    {}
)


print("========================================")
print("SLEEP DISORDER MODEL LOADED")
print("========================================")
print("Model:", MODEL)
print("Features:", FEATURE_COLUMNS)
print(
    "Feature encoders:",
    FEATURE_LABEL_ENCODERS.keys()
)

if TARGET_LABEL_ENCODER is not None:
    print(
        "Target classes:",
        TARGET_LABEL_ENCODER.classes_
    )

print("========================================")


# ==========================================================
# CALORIES MODEL
# ==========================================================

CALORIES_MODEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "models",
    "best_calories_model.pkl"
)

if not os.path.exists(CALORIES_MODEL_PATH):
    raise FileNotFoundError(
        f"Calories model not found: {CALORIES_MODEL_PATH}"
    )

calories_bundle = joblib.load(
    CALORIES_MODEL_PATH
)

CALORIES_MODEL = calories_bundle["model"]

CALORIES_FEATURE_COLUMNS = calories_bundle[
    "feature_columns"
]

CALORIES_GENDER_ENCODER = calories_bundle[
    "gender_encoder"
]


print("========================================")
print("CALORIES MODEL LOADED")
print("========================================")
print("Model:", CALORIES_MODEL)
print(
    "Features:",
    CALORIES_FEATURE_COLUMNS
)
print(
    "Gender classes:",
    CALORIES_GENDER_ENCODER.classes_
)
print("========================================")


# ==========================================================
# SLEEP MODEL CONFIGURATION
# ==========================================================

CATEGORICAL_INPUT_FEATURES = [
    "Gender",
    "Occupation",
    "BMI Category"
]

NUMERIC_FIELDS = [
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


# ==========================================================
# HOME
# ==========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Welcome to FitIQ API",
        "status": "running",
        "endpoints": [
            "/predict",
            "/predict-calories"
        ]
    })


# ==========================================================
# SLEEP DISORDER PREDICTION
# ==========================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        payload = request.get_json(force=True)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": "Invalid JSON",
            "details": str(e)
        }), 400


    if not isinstance(payload, dict):

        return jsonify({
            "success": False,
            "error": "Payload must be a JSON object"
        }), 400


    print("\n========================================")
    print("NEW SLEEP PREDICTION")
    print("========================================")
    print(payload)


    # ------------------------------------------------------
    # Required fields
    # ------------------------------------------------------

    missing = [
        column
        for column in FEATURE_COLUMNS
        if column not in payload
    ]

    if missing:

        return jsonify({
            "success": False,
            "error": "Missing fields",
            "missing_fields": missing
        }), 400


    # ------------------------------------------------------
    # Create DataFrame
    # ------------------------------------------------------

    row = {
        column: payload[column]
        for column in FEATURE_COLUMNS
    }

    X = pd.DataFrame(
        [row],
        columns=FEATURE_COLUMNS
    )


    # ------------------------------------------------------
    # Numeric conversion
    # ------------------------------------------------------

    for col in NUMERIC_FIELDS:

        if col not in X.columns:
            continue

        X[col] = pd.to_numeric(
            X[col],
            errors="coerce"
        )

        if X[col].isnull().any():

            return jsonify({
                "success": False,
                "error": f"Invalid numeric value for {col}"
            }), 400


    # ------------------------------------------------------
    # Categorical encoding
    # ------------------------------------------------------

    for col in CATEGORICAL_INPUT_FEATURES:

        if col not in X.columns:
            continue

        encoder = FEATURE_LABEL_ENCODERS.get(col)

        if encoder is None:

            return jsonify({
                "success": False,
                "error": f"No encoder found for '{col}'"
            }), 500

        value = str(X[col].iloc[0])

        if value not in encoder.classes_:

            return jsonify({
                "success": False,
                "error": f"Unknown category in '{col}'",
                "received": value,
                "available_values":
                    list(encoder.classes_)
            }), 400

        X[col] = encoder.transform(
            X[col].astype(str)
        )


    # ------------------------------------------------------
    # Final validation
    # ------------------------------------------------------

    non_numeric = X.select_dtypes(
        include=[
            "object",
            "string",
            "category"
        ]
    ).columns.tolist()

    if non_numeric:

        return jsonify({
            "success": False,
            "error": "Non-numeric columns remain",
            "columns": non_numeric
        }), 400


    if X.isnull().any().any():

        return jsonify({
            "success": False,
            "error": "Null values remain"
        }), 400


    # ------------------------------------------------------
    # Prediction
    # ------------------------------------------------------

    try:

        prediction = MODEL.predict(X)

        pred = int(prediction[0])

    except Exception as e:

        return jsonify({
            "success": False,
            "error": "Prediction failed",
            "details": str(e)
        }), 500


    # ------------------------------------------------------
    # Decode prediction
    # ------------------------------------------------------

    if TARGET_LABEL_ENCODER is not None:

        try:

            decoded = TARGET_LABEL_ENCODER.inverse_transform(
                [pred]
            )[0]

            disorder = str(decoded)

        except Exception as e:

            return jsonify({
                "success": False,
                "error": "Could not decode prediction",
                "details": str(e)
            }), 500

    else:

        disorder = str(pred)


    # ------------------------------------------------------
    # Probabilities
    # ------------------------------------------------------

    probabilities = {}

    if hasattr(MODEL, "predict_proba"):

        try:

            probability_values = MODEL.predict_proba(X)[0]

            for class_number, probability in zip(
                MODEL.classes_,
                probability_values
            ):

                if TARGET_LABEL_ENCODER is not None:

                    class_name = (
                        TARGET_LABEL_ENCODER
                        .inverse_transform(
                            [int(class_number)]
                        )[0]
                    )

                else:

                    class_name = str(class_number)

                probabilities[str(class_name)] = round(
                    float(probability),
                    4
                )

        except Exception as e:

            print(
                "Warning: probability calculation failed:",
                e
            )


    response = {

        "success": True,

        "prediction": pred,

        "disorder": disorder,

        "message":
            f"Sleep Disorder Detected: {disorder}",

        "probabilities": probabilities
    }


    print("Sleep response:")
    print(response)

    return jsonify(response)


# ==========================================================
# CALORIES PREDICTION
# ==========================================================

@app.route("/predict-calories", methods=["POST"])
def predict_calories():

    try:

        payload = request.get_json(force=True)

    except Exception as e:

        return jsonify({
            "success": False,
            "error": "Invalid JSON",
            "details": str(e)
        }), 400


    if not isinstance(payload, dict):

        return jsonify({
            "success": False,
            "error": "Payload must be a JSON object"
        }), 400


    print("\n========================================")
    print("NEW CALORIES PREDICTION")
    print("========================================")
    print(payload)


    # ------------------------------------------------------
    # Required fields
    # ------------------------------------------------------

    missing = [
        column
        for column in CALORIES_FEATURE_COLUMNS
        if column not in payload
    ]

    if missing:

        return jsonify({
            "success": False,
            "error": "Missing calories fields",
            "missing_fields": missing
        }), 400


    # ------------------------------------------------------
    # Create DataFrame
    # ------------------------------------------------------

    row = {
        column: payload[column]
        for column in CALORIES_FEATURE_COLUMNS
    }

    X = pd.DataFrame(
        [row],
        columns=CALORIES_FEATURE_COLUMNS
    )


    # ------------------------------------------------------
    # Numeric fields
    # ------------------------------------------------------

    calories_numeric_fields = [
        "Age",
        "Height",
        "Weight",
        "Duration",
        "Heart_Rate",
        "Body_Temp"
    ]

    for col in calories_numeric_fields:

        if col not in X.columns:
            continue

        X[col] = pd.to_numeric(
            X[col],
            errors="coerce"
        )

        if X[col].isnull().any():

            return jsonify({
                "success": False,
                "error":
                    f"Invalid numeric value for {col}"
            }), 400


    # ------------------------------------------------------
    # Gender
    # ------------------------------------------------------

    X["Gender"] = (
        X["Gender"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    gender_value = X["Gender"].iloc[0]

    encoder_classes = [
        str(x).lower()
        for x in CALORIES_GENDER_ENCODER.classes_
    ]

    if gender_value not in encoder_classes:

        return jsonify({
            "success": False,
            "error": "Unknown Gender",
            "received": gender_value,
            "available_values":
                list(CALORIES_GENDER_ENCODER.classes_)
        }), 400


    # Transform using original encoder values
    original_gender = next(
        x
        for x in CALORIES_GENDER_ENCODER.classes_
        if str(x).lower() == gender_value
    )

    X["Gender"] = CALORIES_GENDER_ENCODER.transform(
        [original_gender]
    )


    # ------------------------------------------------------
    # Correct feature order
    # ------------------------------------------------------

    X = X[
        CALORIES_FEATURE_COLUMNS
    ]


    print("Calories DataFrame:")
    print(X)

    print("Data types:")
    print(X.dtypes)


    # ------------------------------------------------------
    # Prediction
    # ------------------------------------------------------

    try:

        prediction = CALORIES_MODEL.predict(X)

        calories = float(prediction[0])

    except Exception as e:

        return jsonify({
            "success": False,
            "error": "Calories prediction failed",
            "details": str(e)
        }), 500


    # ------------------------------------------------------
    # Response
    # ------------------------------------------------------

    response = {

        "success": True,

        "calories": round(
            calories,
            2
        )
    }


    print("Calories response:")
    print(response)

    print("========================================")

    return jsonify(response)


# ==========================================================
# RUN SERVER
# ==========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )