import joblib

model = joblib.load("models/best_sleep_disorder_model.pkl")

print(type(model))

if isinstance(model, dict):
    print(model.keys())