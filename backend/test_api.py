import requests

url = "http://127.0.0.1:5000/predict"

data = {
    "Gender": 0,
    "Age": 30,
    "Occupation": 3,
    "Sleep Duration": 7.5,
    "Quality of Sleep": 8,
    "Physical Activity Level": 60,
    "Stress Level": 3,
    "BMI Category": 0,
    "Heart Rate": 70,
    "Daily Steps": 8000,
    "Systolic_BP": 120,
    "Diastolic_BP": 80
}

response = requests.post(url, json=data)

print(response.json())