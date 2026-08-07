import os
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

# ---------- Configuration ----------
# Primary filename provided by the user
filename = "datasets/raw/Sleep_health_and_lifestyle_dataset.csv"

# Additional fallback paths you may want to check
possible_paths = [
    filename,
    os.path.join("data", filename),
    os.path.join("datasets", filename),
    os.path.join("datasets", "raw", filename),
    os.path.join("data", "raw", filename)
]

# Output path for cleaned dataset
output_path = os.path.join("datasets", "processed", "sleep_health_cleaned.csv")

# ---------- Load dataset ----------
file_path = None
for p in possible_paths:
    if os.path.exists(p):
        file_path = p
        break

if file_path is None:
    raise FileNotFoundError(
        f"Dataset not found. Checked paths: {possible_paths}\n"
        "Please place the CSV in one of those locations or update the script."
    )

# Read CSV with low_memory=False to let pandas better infer dtypes
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
# df.info() prints directly; do not wrap with print() to avoid printing None
df.info()
print("\nDescribe (including object columns):")
print(df.describe(include='all'), "\n")
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
print(f"Removed {rows_before - rows_after} duplicate rows. New shape: {df.shape}\n")

# ---------- Remove unnecessary identifier columns ----------
id_candidates = [
    "Person ID", "Person_ID", "ID", "id", "person_id", "Subject_ID", "subject_id",
    "participant_id", "Participant ID", "participant id"
]
cols_to_drop = [c for c in id_candidates if c in df.columns]
if cols_to_drop:
    df = df.drop(columns=cols_to_drop)
    print(f"Dropped identifier columns: {cols_to_drop}\n")
else:
    print("No common identifier columns found to drop.\n")

# ---------- Trim whitespace from text columns ----------
# Apply strip to string/object columns to remove leading/trailing spaces
text_cols = df.select_dtypes(include=['object', 'string']).columns
for col in text_cols:
    # Only apply strip to actual strings, leave NaNs untouched
    df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
print("Trimmed whitespace from text columns.\n")

# ---------- Split Blood Pressure column into Systolic_BP and Diastolic_BP ----------
bp_candidates = [
    "Blood Pressure", "Blood_Pressure", "BP", "blood_pressure", "blood pressure",
    "BloodPressure", "Blood_Pressure_mmHg"
]
bp_col = next((c for c in bp_candidates if c in df.columns), None)

if bp_col:
    print(f"Found blood pressure column '{bp_col}' - attempting to split into Systolic_BP and Diastolic_BP.")
    # Convert to string (to avoid errors) and extract two groups of 2-3 digits separated by / or -
    bp_series = df[bp_col].astype(str).str.strip()
    extracted = bp_series.str.extract(r'(?P<Systolic>\d{2,3})\s*[\/\-]\s*(?P<Diastolic>\d{2,3})', expand=True)
    df["Systolic_BP"] = pd.to_numeric(extracted["Systolic"], errors='coerce')
    df["Diastolic_BP"] = pd.to_numeric(extracted["Diastolic"], errors='coerce')
    # Drop the original BP column
    df = df.drop(columns=[bp_col])
    print("Split complete. Dropped original blood pressure column.\n")
else:
    print("No blood pressure column found. Skipping BP split step.\n")

# ---------- Convert BP columns to integers (impute then convert) ----------
for bp in ["Systolic_BP", "Diastolic_BP"]:
    if bp in df.columns:
        missing_count = df[bp].isnull().sum()
        if missing_count > 0:
            # Fill missing numeric BP values with median (if median exists), otherwise with a reasonable default
            if df[bp].dropna().size > 0:
                median_val = int(round(df[bp].median()))
            else:
                median_val = 120 if "Systolic" in bp else 80
            df[bp] = df[bp].fillna(median_val)
            print(f"Filled {missing_count} missing values in '{bp}' with median/default value {median_val}.")
        # Convert to integer dtype
        df[bp] = df[bp].round().astype(int)
        print(f"Converted '{bp}' to integer type.\n")

# ---------- Handle remaining missing values ----------
# Strategy:
# - Numerical columns: fill with median
# - Categorical/object columns: fill with mode (if exists) else 'Missing'
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
categorical_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()

print("Handling missing values for remaining columns...\n")

# Numeric columns: fill with median
for col in numeric_cols:
    missing_count = df[col].isnull().sum()
    if missing_count > 0:
        median_val = df[col].median()
        df[col] = df[col].fillna(median_val)
        print(f"Filled {missing_count} missing values in numeric column '{col}' with median {median_val}.")

# Categorical columns: fill with mode or 'Missing'
for col in categorical_cols:
    missing_count = df[col].isnull().sum()
    if missing_count > 0:
        mode_vals = df[col].mode(dropna=True)
        if len(mode_vals) > 0:
            fill_val = mode_vals[0]
        else:
            fill_val = "Missing"
        df[col] = df[col].fillna(fill_val)
        print(f"Filled {missing_count} missing values in categorical column '{col}' with '{fill_val}'.")

print("\nMissing values after imputation:")
print(df.isnull().sum(), "\n")

# ---------- Encode categorical columns using LabelEncoder ----------
# Recompute categorical columns after potential changes
categorical_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()
label_encoders = {}

if categorical_cols:
    print("Encoding categorical columns with LabelEncoder...\n")
    for col in categorical_cols:
        try:
            le = LabelEncoder()
            # Convert all values to string to ensure consistent encoding
            df[col] = df[col].astype(str)
            df[col] = le.fit_transform(df[col])
            label_encoders[col] = le
            print(f"Encoded '{col}' (unique classes: {len(le.classes_)})")
        except Exception as e:
            print(f"Warning: failed to encode column '{col}': {e}")
else:
    print("No categorical columns found to encode.\n")

# ---------- Final dataset information ----------
print("\n=== Processed dataset preview ===\n")
print("Shape:", df.shape, "\n")

print("Columns:")
print(list(df.columns), "\n")

print("Info():")
df.info()
print("\nHead():")
print(df.head(), "\n")

print("Describe:")
print(df.describe(include='all'), "\n")
out_dir = os.path.dirname(output_path)
if out_dir and not os.path.exists(out_dir):
    os.makedirs(out_dir, exist_ok=True)

df.to_csv(output_path, index=False)
print(f"Saved cleaned dataset to: {output_path}")
# Save LabelEncoders
os.makedirs("models", exist_ok=True)
joblib.dump(label_encoders, "models/label_encoders.pkl")
print("Label encoders saved successfully.")