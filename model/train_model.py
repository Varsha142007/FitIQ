# train_model.py
# Train and compare classification models to predict "Sleep Disorder" using the cleaned Sleep Health dataset.
# - Loads cleaned data
# - Prepares features and target
# - Encodes categorical features if any remain
# - Trains Logistic Regression, Decision Tree, and Random Forest
# - Evaluates each model and prints metrics
# - Saves the best model to models/best_sleep_disorder_model.pkl

import os
import pandas as pd
import numpy as np
import joblib
LABEL_ENCODER_PATH = os.path.join("models", "label_encoders.pkl")
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder  # used if there are remaining non-numeric columns
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# ---------- Configuration ----------
CLEANED_CSV_PATH = os.path.join("datasets", "processed", "sleep_health_cleaned.csv")
OUTPUT_MODEL_PATH = os.path.join("models", "best_sleep_disorder_model.pkl")
RANDOM_STATE = 42
TEST_SIZE = 0.20  # 20% test set

# ---------- Load dataset ----------
if not os.path.exists(CLEANED_CSV_PATH):
    raise FileNotFoundError(f"Cleaned dataset not found at {CLEANED_CSV_PATH}. Please run preprocessing first.")

df = pd.read_csv(CLEANED_CSV_PATH)

# ---------- Basic dataset info ----------
print("Loaded dataset:")
print("Shape:", df.shape)
print("Columns:", list(df.columns))
print()

# ---------- Prepare features (X) and target (y) ----------
TARGET_COLUMN = "Sleep Disorder"
if TARGET_COLUMN not in df.columns:
    raise KeyError(f"Target column '{TARGET_COLUMN}' not found in dataset columns.")

# X: all columns except the target
X = df.drop(columns=[TARGET_COLUMN]).copy()
y = df[TARGET_COLUMN].copy()

# If target is non-numeric, label-encode it so models can train
target_label_encoder = None
if y.dtype == object or str(y.dtype).startswith("string") or not np.issubdtype(y.dtype, np.number):
    target_label_encoder = LabelEncoder()
    y = target_label_encoder.fit_transform(y.astype(str))
    print(f"Target '{TARGET_COLUMN}' label-encoded. Classes: {list(target_label_encoder.classes_)}\n")

# ---------- Handle non-numeric features in X ----------
# Some columns may still be non-numeric (object/string). Convert them to numeric using LabelEncoder.
# For a production system you might prefer OneHotEncoder, but LabelEncoder is simple and consistent with previous steps.
# Load encoders from preprocessing
if os.path.exists(LABEL_ENCODER_PATH):
    encoders = joblib.load(LABEL_ENCODER_PATH)
    print("Loaded Label Encoders")
else:
    encoders = {}  # store encoders for potential future inverse transforms


# ---------- Train/test split ----------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y if len(np.unique(y)) > 1 else None
)
print(f"Train shape: {X_train.shape}, Test shape: {X_test.shape}\n")

# ---------- Define models to train ----------
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
    "Decision Tree": DecisionTreeClassifier(random_state=RANDOM_STATE),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE)
}

# ---------- Train, evaluate, and compare models ----------
results = {}  # store accuracy and model object

for name, model in models.items():
    print(f"Training model: {name} ...")
    # Train
    model.fit(X_train, y_train)

    # Predict on test set
    y_pred = model.predict(X_test)

    # Evaluation metrics
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    # Print results
    print(f"--- {name} Results ---")
    print(f"Accuracy: {acc:.4f}\n")
    print("Classification Report:")
    print(report)
    print("Confusion Matrix:")
    print(cm)
    print("\n")

    # Store results
    results[name] = {
        "model": model,
        "accuracy": acc,
        "classification_report": report,
        "confusion_matrix": cm
    }

# ---------- Select best model ----------
best_model_name = max(results, key=lambda k: results[k]["accuracy"])
best_model_info = results[best_model_name]
best_model = best_model_info["model"]
best_accuracy = best_model_info["accuracy"]

print(f"Best model based on accuracy: {best_model_name} (Accuracy: {best_accuracy:.4f})")

# ---------- Ensure models directory exists and save best model ----------
models_dir = os.path.dirname(OUTPUT_MODEL_PATH)
if models_dir and not os.path.exists(models_dir):
    os.makedirs(models_dir, exist_ok=True)

# Save the best model using joblib
joblib.dump({
    "model": best_model,
    "feature_columns": list(X.columns),
    "target_column": TARGET_COLUMN,
    "target_label_encoder": target_label_encoder,
    "feature_label_encoders": encoders
}, OUTPUT_MODEL_PATH)

print("Best model saved successfully.")