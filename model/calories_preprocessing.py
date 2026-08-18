import pandas as pd

filename = "../datasets/raw/calories.csv"

df = pd.read_csv(filename)

print("First 5 rows:")
print(df.head())

print("\nShape:")
print(df.shape)

print("\nColumns:")
print(df.columns)

print("\nData types:")
print(df.dtypes)

print("\nMissing values:")
print(df.isnull().sum())

print("\nDuplicate rows:")
print(df.duplicated().sum())

print("\nStatistical Summary:")
print(df.describe())

print("\nUnique Gender values:")
print(df["Gender"].unique())

print("\nGender distribution:")
print(df["Gender"].value_counts())

# Step 3: Remove User_ID
df = df.drop(columns=["User_ID"])


print("\nAfter preprocessing:")
print(df.head())

print("\nData types:")
print(df.dtypes)

print("\nColumns:")
print(df.columns)

# Step 4: EDA

import matplotlib.pyplot as plt
import seaborn as sns

# Correlation matrix
print("\nCorrelation with Calories:")
print(df.corr(numeric_only=True)["Calories"].sort_values(ascending=False))

# Histograms
df.hist(figsize=(12, 8))
plt.tight_layout()
plt.show()

# Correlation heatmap
plt.figure(figsize=(10, 6))
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")
plt.title("Correlation Heatmap - Calories Dataset")
plt.tight_layout()
plt.show()

# Calories distribution
plt.figure(figsize=(8, 5))
sns.histplot(df["Calories"], kde=True)
plt.title("Calories Distribution")
plt.xlabel("Calories Burned")
plt.show()


# ============================================================
# Step 5: Prepare data for regression
# ============================================================

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# ---------- Encode Gender ----------

# Preserve original Gender values
original_gender = df["Gender"].copy()

# Create encoder
gender_encoder = LabelEncoder()

# Fit encoder on ORIGINAL Gender values
gender_encoder.fit(original_gender)

# Encode Gender for model training
df["Gender"] = gender_encoder.transform(original_gender)

print("\nGender after encoding:")
print(df["Gender"].value_counts())

print("\nGender classes:")
print(gender_encoder.classes_)

# ---------- Separate features and target ----------

X = df.drop("Calories", axis=1)
y = df["Calories"]

print("\nFeatures:")
print(X.columns)

print("\nTarget:")
print(y.name)

# ---------- Train-Test Split ----------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining data shape:")
print(X_train.shape)

print("\nTesting data shape:")
print(X_test.shape)
# ============================================================
# Step 6: Train and Compare Regression Models
# ============================================================

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# ---------- Define models ----------

models = {
    "Linear Regression": LinearRegression(),
    "Decision Tree": DecisionTreeRegressor(random_state=42),
    "Random Forest": RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    )
}

# ---------- Train and evaluate ----------

results = {}

for name, model in models.items():

    print(f"\nTraining {name}...")

    # Train
    model.fit(X_train, y_train)

    # Predict
    y_pred = model.predict(X_test)

    # Evaluation
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    results[name] = {
        "MAE": mae,
        "R2": r2
    }

    print(f"{name} MAE: {mae:.2f}")
    print(f"{name} R²: {r2:.4f}")


# ---------- Compare results ----------

results_df = pd.DataFrame(results).T

print("\n========== MODEL COMPARISON ==========")
print(results_df)

# ============================================================
# Step 7: Save Best Calories Prediction Model
# ============================================================
# ============================================================
# Step 7: Save Best Calories Prediction Model
# ============================================================

import os
import joblib

# Get FitIQ project root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Create models directory
models_dir = os.path.join(BASE_DIR, "models")
os.makedirs(models_dir, exist_ok=True)

# Best model
best_model = models["Random Forest"]

# Store model + preprocessing information
model_data = {
    "model": best_model,
    "feature_columns": X.columns.tolist(),
    "target_column": "Calories",
    "gender_encoder": gender_encoder
}

# Save Calories model
model_path = os.path.join(
    models_dir,
    "best_calories_model.pkl"
)

joblib.dump(model_data, model_path)

print("\nBest Calories model saved successfully!")
print("Model path:", model_path)

print("\nFeature columns:")
print(X.columns.tolist())

print("\nSaved Gender classes:")
print(gender_encoder.classes_)