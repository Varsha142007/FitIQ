# EDA script for cleaned Sleep Health dataset (FitIQ)
# - Loads cleaned CSV
# - Shows basic info
# - Creates correlation heatmap, histograms, boxplots, count plots, and distributions
# - All plots include titles and axis labels
# - Save or show plots as desired (this script displays them)

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Improve plot aesthetics
sns.set(style="whitegrid", palette="muted", context="talk")

# ---------- Configuration ----------
cleaned_path = os.path.join("datasets", "processed", "sleep_health_cleaned.csv")

# ---------- Load dataset ----------
if not os.path.exists(cleaned_path):
    raise FileNotFoundError(f"Cleaned dataset not found at {cleaned_path}. Please run preprocessing first.")

df = pd.read_csv(cleaned_path)
print(f"Loaded cleaned dataset from: {cleaned_path}\n")

# ---------- Display dataset shape and column names ----------
print("Dataset shape:", df.shape)
print("Columns:", list(df.columns), "\n")

# ---------- Prepare column lists ----------
# Numeric columns (for histograms, boxplots, correlations)
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

# Heuristic: categorical-like columns are numeric columns with relatively few unique values (<= 30)
# This captures encoded categorical columns (e.g., Gender, Occupation, BMI Category, Sleep Disorder)
categorical_like_cols = [c for c in numeric_cols if df[c].nunique() <= 30]

# Also try to include any non-numeric columns (rare after cleaning) as categorical
non_numeric_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
categorical_cols = categorical_like_cols + non_numeric_cols

# Remove duplicates in list while preserving order
seen = set()
categorical_cols = [x for x in categorical_cols if not (x in seen or seen.add(x))]

# ---------- 1) Correlation heatmap ----------
# Visualize pairwise correlations between numeric features to detect relationships
plt.figure(figsize=(12, 10))
corr = df[numeric_cols].corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm", square=False,
            cbar_kws={"shrink": .75}, linewidths=.5)
plt.title("Correlation Heatmap of Numerical Features", fontsize=16)
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
plt.show()

# ---------- 2) Histograms for all numerical columns ----------
# Histograms show distributions and can reveal skewness, multi-modality, and data ranges
num_plots = len(numeric_cols)
if num_plots:
    cols_per_row = 3
    rows = int(np.ceil(num_plots / cols_per_row))
    plt.figure(figsize=(cols_per_row * 6, rows * 4))
    for i, col in enumerate(numeric_cols, 1):
        ax = plt.subplot(rows, cols_per_row, i)
        sns.histplot(df[col].dropna(), bins=30, kde=True, color='steelblue')
        ax.set_title(f"Histogram of {col}")
        ax.set_xlabel(col)
        ax.set_ylabel("Count")
    plt.tight_layout()
    plt.show()
else:
    print("No numerical columns found to plot histograms.\n")

# ---------- 3) Boxplots for numerical columns to detect outliers ----------
# Boxplots summarize distribution and highlight potential outliers
if num_plots:
    cols_per_row = 3
    rows = int(np.ceil(num_plots / cols_per_row))
    plt.figure(figsize=(cols_per_row * 6, rows * 4))
    for i, col in enumerate(numeric_cols, 1):
        ax = plt.subplot(rows, cols_per_row, i)
        sns.boxplot(x=df[col], color='lightseagreen')
        ax.set_title(f"Boxplot of {col}")
        ax.set_xlabel(col)
    plt.tight_layout()
    plt.show()
else:
    print("No numerical columns found to plot boxplots.\n")

# ---------- 4) Count plots for important categorical columns ----------
# If original (non-encoded) categorical columns exist, they appear in non_numeric_cols.
# Otherwise, use encoded columns or any numeric columns with small cardinality detected above.
# We will limit the number of count plots to avoid overly large output.
max_countplots = 8
if categorical_cols:
    n_plots = min(len(categorical_cols), max_countplots)
    plt.figure(figsize=(12, n_plots * 4))
    for i, col in enumerate(categorical_cols[:n_plots], 1):
        ax = plt.subplot(n_plots, 1, i)
        # For numeric encoded categories, treat values as categories for plotting
        sns.countplot(x=df[col], order=df[col].value_counts().index, palette="Set2")
        ax.set_title(f"Count Plot of {col}")
        ax.set_xlabel(col)
        ax.set_ylabel("Count")
        # Rotate xticks if many categories
        if df[col].nunique() > 8:
            plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.show()
else:
    print("No categorical-like columns detected for count plots.\n")

# ---------- 5) Distribution of important numerical features ----------
# Define a prioritized list of domain-important features often relevant for sleep/fitness
priority_features = [
    "Sleep Duration", "Quality of Sleep", "Physical Activity Level", "Stress Level",
    "Heart Rate", "Daily Steps", "Systolic_BP", "Diastolic_BP", "Age", "BMI Category"
]

# Select features that exist in the dataset in the order of priority
important_numeric = [f for f in priority_features if f in df.columns and f in numeric_cols]

# If none of the priority features exist as numeric, choose top 6 numeric columns by variance
if not important_numeric:
    var_series = df[numeric_cols].var().sort_values(ascending=False)
    important_numeric = var_series.index[:6].tolist()

# Plot distributions (hist + KDE) for chosen important features
plt.figure(figsize=(12, len(important_numeric) * 4))
for i, col in enumerate(important_numeric, 1):
    ax = plt.subplot(len(important_numeric), 1, i)
    sns.histplot(df[col].dropna(), bins=40, kde=True, color='mediumpurple')
    ax.set_title(f"Distribution of {col}")
    ax.set_xlabel(col)
    ax.set_ylabel("Frequency")
plt.tight_layout()
plt.show()

# ---------- 6) Pairplot for a small set of numeric features (optional) ----------
# Useful for inspecting pairwise relationships and scatter patterns; limit to up to 6 variables
pairplot_vars = important_numeric[:6] if len(important_numeric) > 0 else numeric_cols[:6]
if len(pairplot_vars) >= 2:
    # Pairplot can be slow for many rows; sample if dataset is large
    sample_df = df[pairplot_vars].sample(n=min(1000, len(df)), random_state=42)
    sns.pairplot(sample_df, diag_kind='kde', plot_kws={'alpha': 0.6})
    plt.suptitle("Pairplot of Important Numeric Features (sampled)", y=1.02)
    plt.tight_layout()
    plt.show()
else:
    print("Not enough variables for pairplot.\n")

# ---------- 7) Summary statistics for quick reference ----------
print("\nSummary statistics (numerical):")
print(df[numeric_cols].describe().transpose())

print("\nValue counts for detected categorical-like columns (top 10):")
for col in categorical_cols[:max_countplots]:
    print(f"\nColumn: {col}")
    print(df[col].value_counts().head(10))

# End of EDA script. Adjust visualization selections or save figures as needed.