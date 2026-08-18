
# train_model.py
# Train and compare classification models to predict "Sleep Disorder"
# using only records that have an actual Sleep Disorder label.

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

# ---------- Configuration ----------

CLEANED_CSV_PATH = os.path.join(
    "datasets",
    "processed",
    "sleep_health_cleaned.csv"
)

LABEL_ENCODER_PATH = os.path.join(
    "models",
    "label_encoders.pkl"
)

OUTPUT_MODEL_PATH = os.path.join(
    "models",
    "best_sleep_disorder_model.pkl"
)

RANDOM_STATE = 42
TEST_SIZE = 0.20

TARGET_COLUMN = "Sleep Disorder"


# ---------- Load cleaned dataset ----------

if not os.path.exists(CLEANED_CSV_PATH):
    raise FileNotFoundError(
        f"Cleaned dataset not found at {CLEANED_CSV_PATH}. "
        "Please run preprocessing.py first."
    )

df = pd.read_csv(CLEANED_CSV_PATH)

print("Loaded dataset:")
print("Shape:", df.shape)
print("Columns:", list(df.columns))
print()


# ---------- Check target column ----------

if TARGET_COLUMN not in df.columns:
    raise KeyError(
        f"Target column '{TARGET_COLUMN}' "
        "not found in dataset."
    )


# ---------- Remove rows without target labels ----------

print("Target value counts before filtering:")

print(
    df[TARGET_COLUMN].value_counts(dropna=False)
)

print()

rows_before = len(df)

df = df.dropna(
    subset=[TARGET_COLUMN]
).copy()

rows_after = len(df)

print(
    f"Removed {rows_before - rows_after} "
    "unlabeled rows."
)

print(
    f"Training dataset now contains "
    f"{rows_after} labeled rows."
)

print()


# ---------- Prepare X and y ----------

X = df.drop(
    columns=[TARGET_COLUMN]
).copy()

y = df[TARGET_COLUMN].astype(int)


# ---------- Display target distribution ----------

print("Target distribution:")

print(
    y.value_counts().sort_index()
)

print()

print(
    "Target classes from preprocessing:"
)

if os.path.exists(LABEL_ENCODER_PATH):

    label_encoders = joblib.load(
        LABEL_ENCODER_PATH
    )

    if TARGET_COLUMN in label_encoders:

        target_encoder = label_encoders[
            TARGET_COLUMN
        ]

        for number, class_name in enumerate(
            target_encoder.classes_
        ):
            print(
                f"{number} = {class_name}"
            )

    print()

else:

    label_encoders = {}

    print(
        "Warning: label_encoders.pkl "
        "was not found."
    )

    print()


# ---------- Verify features are numeric ----------

print("Feature data types:")

print(X.dtypes)

print()

non_numeric_columns = X.select_dtypes(
    exclude=["number"]
).columns.tolist()

if non_numeric_columns:

    raise ValueError(
        "The following features are still non-numeric: "
        f"{non_numeric_columns}. "
        "Run preprocessing.py again."
    )


# ---------- Train/Test Split ----------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=TEST_SIZE,
    random_state=RANDOM_STATE,
    stratify=y
)

print(
    f"Train shape: {X_train.shape}"
)

print(
    f"Test shape: {X_test.shape}"
)

print()


# ---------- Define Models ----------

models = {

    "Logistic Regression":
        LogisticRegression(
            max_iter=1000,
            random_state=RANDOM_STATE
        ),

    "Decision Tree":
        DecisionTreeClassifier(
            random_state=RANDOM_STATE
        ),

    "Random Forest":
        RandomForestClassifier(
            n_estimators=200,
            random_state=RANDOM_STATE
        )
}


# ---------- Train and Evaluate ----------

results = {}

for name, model in models.items():

    print("=" * 60)

    print(
        f"Training model: {name}"
    )

    print("=" * 60)

    # Train
    model.fit(
        X_train,
        y_train
    )

    # Predict
    y_pred = model.predict(
        X_test
    )

    # Accuracy
    accuracy = accuracy_score(
        y_test,
        y_pred
    )

    # Classification report
    report = classification_report(
        y_test,
        y_pred,
        zero_division=0
    )

    # Confusion matrix
    cm = confusion_matrix(
        y_test,
        y_pred
    )

    print(
        f"Accuracy: {accuracy:.4f}"
    )

    print()

    print(
        "Classification Report:"
    )

    print(report)

    print(
        "Confusion Matrix:"
    )

    print(cm)

    print()

    results[name] = {

        "model": model,

        "accuracy": accuracy,

        "classification_report": report,

        "confusion_matrix": cm
    }


# ---------- Select Best Model ----------

best_model_name = max(
    results,
    key=lambda name:
        results[name]["accuracy"]
)

best_model_info = results[
    best_model_name
]

best_model = best_model_info[
    "model"
]

best_accuracy = best_model_info[
    "accuracy"
]


print("=" * 60)

print(
    f"BEST MODEL: {best_model_name}"
)

print(
    f"Accuracy: {best_accuracy:.4f}"
)

print("=" * 60)

print()


# ---------- Save Model ----------

os.makedirs(
    "models",
    exist_ok=True
)

model_package = {

    "model": best_model,

    "feature_columns": list(
        X.columns
    ),

    "target_column": TARGET_COLUMN,

    "feature_label_encoders":
        label_encoders,

    "target_label_encoder":
        label_encoders.get(
            TARGET_COLUMN
        ),

    "best_model_name":
        best_model_name,

    "accuracy":
        best_accuracy
}


joblib.dump(
    model_package,
    OUTPUT_MODEL_PATH
)

print(
    f"Best model saved successfully to:"
)

print(
    OUTPUT_MODEL_PATH
)

print()

print(
    "Training completed successfully."
)

