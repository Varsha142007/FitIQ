import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

# ---------- Configuration ----------
filename = "datasets/raw/Sleep_health_and_lifestyle_dataset.csv"

possible_paths = [
    filename,
    os.path.join("data", filename),
    os.path.join("datasets", filename),
    os.path.join("datasets", "raw", filename),
    os.path.join("data", "raw", filename)
]

output_path = os.path.join(
    "datasets",
    "processed",
    "sleep_health_cleaned.csv"
)

# ---------- Load dataset ----------
file_path = None

for p in possible_paths:
    if os.path.exists(p):
        file_path = p
        break

if file_path is None:
    raise FileNotFoundError(
        f"Dataset not found. Checked paths: {possible_paths}"
    )

df = pd.read_csv(file_path, low_memory=False)

print(f"Loaded dataset from: {file_path}\n")

# ---------- Initial inspection ----------
print("=== Initial preview ===\n")

print("Head:")
print(df.head(), "\n")

print("Tail:")
print(df.tail(), "\n")

print("Shape:", df.shape, "\n")

print("Columns:")
print(list(df.columns), "\n")

print("Info():")
df.info()

print("\nDescribe:")
print(df.describe(include="all"), "\n")

# ---------- Data quality checks ----------
print("=== Data quality checks ===\n")

print("Missing values per column:")
print(df.isnull().sum(), "\n")

print("Total duplicate rows:", df.duplicated().sum(), "\n")

print("Data types:")
print(df.dtypes, "\n")

# ---------- Remove duplicate rows ----------
rows_before = len(df)

df = df.drop_duplicates(ignore_index=True)

rows_after = len(df)

print(
    f"Removed {rows_before - rows_after} duplicate rows. "
    f"New shape: {df.shape}\n"
)

# ---------- Remove identifier columns ----------
id_candidates = [
    "Person ID",
    "Person_ID",
    "ID",
    "id",
    "person_id",
    "Subject_ID",
    "subject_id",
    "participant_id",
    "Participant ID",
    "participant id"
]

cols_to_drop = [
    c for c in id_candidates
    if c in df.columns
]

if cols_to_drop:
    df = df.drop(columns=cols_to_drop)
    print(f"Dropped identifier columns: {cols_to_drop}\n")
else:
    print("No common identifier columns found to drop.\n")

# ---------- Trim whitespace ----------
text_cols = df.select_dtypes(
    include=["object", "string"]
).columns

for col in text_cols:
    df[col] = df[col].apply(
        lambda x: x.strip() if isinstance(x, str) else x
    )

print("Trimmed whitespace from text columns.\n")

# ---------- Split Blood Pressure ----------
bp_candidates = [
    "Blood Pressure",
    "Blood_Pressure",
    "BP",
    "blood_pressure",
    "blood pressure",
    "BloodPressure",
    "Blood_Pressure_mmHg"
]

bp_col = next(
    (c for c in bp_candidates if c in df.columns),
    None
)

if bp_col:

    print(
        f"Found blood pressure column '{bp_col}' "
        " - attempting to split into Systolic_BP and Diastolic_BP."
    )

    bp_series = df[bp_col].astype(str).str.strip()

    extracted = bp_series.str.extract(
        r"(?P<Systolic>\d{2,3})\s*[\/\-]\s*(?P<Diastolic>\d{2,3})",
        expand=True
    )

    df["Systolic_BP"] = pd.to_numeric(
        extracted["Systolic"],
        errors="coerce"
    )

    df["Diastolic_BP"] = pd.to_numeric(
        extracted["Diastolic"],
        errors="coerce"
    )

    df = df.drop(columns=[bp_col])

    print("Split complete. Dropped original blood pressure column.\n")

else:
    print(
        "No blood pressure column found. "
        "Skipping BP split step.\n"
    )

# ---------- Handle missing BP values ----------
for bp in ["Systolic_BP", "Diastolic_BP"]:

    if bp in df.columns:

        missing_count = df[bp].isnull().sum()

        if missing_count > 0:

            if df[bp].dropna().size > 0:
                median_val = int(round(df[bp].median()))
            else:
                median_val = (
                    120
                    if "Systolic" in bp
                    else 80
                )

            df[bp] = df[bp].fillna(median_val)

            print(
                f"Filled {missing_count} missing values "
                f"in '{bp}' with {median_val}."
            )

        df[bp] = df[bp].round().astype(int)

        print(f"Converted '{bp}' to integer type.\n")

# ==========================================================
# IMPORTANT:
# Do NOT impute Sleep Disorder.
# It is our TARGET variable.
# ==========================================================

target_column = "Sleep Disorder"

if target_column not in df.columns:
    raise ValueError(
        "Target column 'Sleep Disorder' was not found."
    )

print("=== Target variable check ===")

print(
    f"Rows with actual '{target_column}' labels:",
    df[target_column].notna().sum()
)

print(
    f"Rows with missing '{target_column}' labels:",
    df[target_column].isna().sum()
)

print(
    "\nMissing target values will NOT be filled "
    "because they cannot be safely guessed.\n"
)

# ---------- Handle missing values in FEATURE columns ----------
feature_columns = [
    col for col in df.columns
    if col != target_column
]

numeric_feature_cols = df[
    feature_columns
].select_dtypes(
    include=[np.number]
).columns.tolist()

categorical_feature_cols = df[
    feature_columns
].select_dtypes(
    include=["object", "category", "string"]
).columns.tolist()

print("Handling missing values in feature columns...\n")

# Numeric features
for col in numeric_feature_cols:

    missing_count = df[col].isnull().sum()

    if missing_count > 0:

        median_val = df[col].median()

        df[col] = df[col].fillna(median_val)

        print(
            f"Filled {missing_count} missing values "
            f"in numeric column '{col}' "
            f"with median {median_val}."
        )

# Categorical features
for col in categorical_feature_cols:

    missing_count = df[col].isnull().sum()

    if missing_count > 0:

        mode_vals = df[col].mode(dropna=True)

        if len(mode_vals) > 0:
            fill_val = mode_vals[0]
        else:
            fill_val = "Missing"

        df[col] = df[col].fillna(fill_val)

        print(
            f"Filled {missing_count} missing values "
            f"in categorical column '{col}' "
            f"with '{fill_val}'."
        )

print("\nMissing values after feature imputation:")

print(df.isnull().sum(), "\n")

# ---------- Encode categorical columns ----------
label_encoders = {}

print("Encoding categorical columns with LabelEncoder...\n")

# Feature categorical columns
categorical_feature_cols = df[
    feature_columns
].select_dtypes(
    include=["object", "category", "string"]
).columns.tolist()

for col in categorical_feature_cols:

    le = LabelEncoder()

    df[col] = df[col].astype(str)

    df[col] = le.fit_transform(df[col])

    label_encoders[col] = le

    print(
        f"Encoded '{col}' "
        f"(unique classes: {len(le.classes_)})"
    )

# ---------- Encode target separately ----------
# Only encode rows that actually have a target value.

target_encoder = LabelEncoder()

target_mask = df[target_column].notna()

# Create a numeric column first so encoded integers can be assigned safely
encoded_target = pd.Series(
    np.nan,
    index=df.index,
    dtype="float64"
)

encoded_target.loc[target_mask] = target_encoder.fit_transform(
    df.loc[target_mask, target_column].astype(str)
)

df[target_column] = encoded_target

label_encoders[target_column] = target_encoder

print(
    f"Encoded '{target_column}' "
    f"(unique classes: {len(target_encoder.classes_)})"
)

print(
    "Target classes:",
    list(target_encoder.classes_)
)

label_encoders[target_column] = target_encoder

print(
    f"Encoded '{target_column}' "
    f"(unique classes: {len(target_encoder.classes_)})"
)

print(
    "Target classes:",
    list(target_encoder.classes_)
)

# ---------- Final information ----------
print("\n=== Processed dataset preview ===\n")

print("Shape:", df.shape, "\n")

print("Columns:")
print(list(df.columns), "\n")

print("Info():")
df.info()

print("\nHead:")
print(df.head(), "\n")

print("Missing values:")
print(df.isnull().sum(), "\n")

# ---------- Save processed dataset ----------
out_dir = os.path.dirname(output_path)

if out_dir:
    os.makedirs(out_dir, exist_ok=True)

df.to_csv(
    output_path,
    index=False
)

print(
    f"Saved cleaned dataset to: {output_path}"
)

# ---------- Save encoders ----------
os.makedirs("models", exist_ok=True)

joblib.dump(
    label_encoders,
    "models/label_encoders.pkl"
)

print(
    "Label encoders saved successfully."
)