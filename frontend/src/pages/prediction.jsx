// frontend/src/pages/Prediction.jsx
import React, { useState } from "react";
import { predictSleepDisorder } from "../api/predictService";
// If you have Firebase auth and want to save history, import Firestore helpers (optional)
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Recommendations from "../components/Recommendations";

const Prediction = () => {
  // Controlled form fields with sensible defaults
  const [form, setForm] = useState({
    Gender: "Female",
    Age: 30,
    Occupation: "Doctor",
    "Sleep Duration": 7.0,
    "Quality of Sleep": 7,
    "Physical Activity Level": 60,
    "Stress Level": 5,
    "BMI Category": "Normal",
    "Heart Rate": 72,
    "Daily Steps": 8000,
    Systolic_BP: 120,
    Diastolic_BP: 80,
  });

  const [loading, setLoading] = useState(false);
 const [result, setResult] = useState("");
const [predictionCode, setPredictionCode] = useState(null);
  const [error, setError] = useState(null);

  // Update input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow numeric values to be parsed when appropriate
    const numericFields = [
      "Age",
      "Sleep Duration",
      "Quality of Sleep",
      "Physical Activity Level",
      "Stress Level",
      "Heart Rate",
      "Daily Steps",
      "Systolic_BP",
      "Diastolic_BP",
    ];
    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const saveToFirestore = async (payload, prediction, message) => {
    try {
      // Only save if user is authenticated
        const user = auth.currentUser;
      if (!user) return; // not signed in: skip saving
    
      await addDoc(collection(db, "predictions"), {
        uid: user.uid,
        input: payload,
        prediction,
        message,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // fail silently, not critical for prediction path
      console.error("Failed to save prediction to Firestore:", err);
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Build payload: keys must match backend expected feature names
    const payload = {
      Gender: form.Gender,
      Age: form.Age,
      Occupation: form.Occupation,
      "Sleep Duration": form["Sleep Duration"],
      "Quality of Sleep": form["Quality of Sleep"],
      "Physical Activity Level": form["Physical Activity Level"],
      "Stress Level": form["Stress Level"],
      "BMI Category": form["BMI Category"],
      "Heart Rate": form["Heart Rate"],
      "Daily Steps": form["Daily Steps"],
      Systolic_BP: form.Systolic_BP,
      Diastolic_BP: form.Diastolic_BP,
    };

    try {
      const data = await predictSleepDisorder(payload);

       setResult(data);
       setPredictionCode(data.prediction);
      // Optionally save to Firestore if user signed in
      saveToFirestore(payload, data.prediction, data.message);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError({ message: err.message || "Prediction failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2>FitIQ — Sleep Disorder Prediction</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Gender
            <select name="Gender" value={form.Gender} onChange={handleChange}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Age
            <input name="Age" type="number" value={form.Age} onChange={handleChange} min={10} max={100} />
          </label>

          <label>
            Occupation
            <input name="Occupation" value={form.Occupation} onChange={handleChange} />
          </label>

          <label>
            Sleep Duration (hours)
            <input name="Sleep Duration" type="number" step="0.1" value={form["Sleep Duration"]} onChange={handleChange} />
          </label>

          <label>
            Quality of Sleep (1-10)
            <input name="Quality of Sleep" type="number" min={1} max={10} value={form["Quality of Sleep"]} onChange={handleChange} />
          </label>

          <label>
            Physical Activity Level
            <input name="Physical Activity Level" type="number" value={form["Physical Activity Level"]} onChange={handleChange} />
          </label>

          <label>
            Stress Level (1-10)
            <input name="Stress Level" type="number" min={1} max={10} value={form["Stress Level"]} onChange={handleChange} />
          </label>

          <label>
            BMI Category
            <select name="BMI Category" value={form["BMI Category"]} onChange={handleChange}>
              <option>Normal</option>
              <option>Normal Weight</option>
              <option>Overweight</option>
              <option>Obese</option>
            </select>
          </label>

          <label>
            Heart Rate (bpm)
            <input name="Heart Rate" type="number" value={form["Heart Rate"]} onChange={handleChange} />
          </label>

          <label>
            Daily Steps
            <input name="Daily Steps" type="number" value={form["Daily Steps"]} onChange={handleChange} />
          </label>

          <label>
            Systolic BP
            <input name="Systolic_BP" type="number" value={form.Systolic_BP} onChange={handleChange} />
          </label>

          <label>
            Diastolic BP
            <input name="Diastolic_BP" type="number" value={form.Diastolic_BP} onChange={handleChange} />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Predicting..." : "Get Prediction"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: 20, color: "red" }}>
          <strong>Error:</strong> {error.message || JSON.stringify(error)}
        </div>
      )}

      {result && (
  <div
    style={{
      marginTop: 20,
      padding: 12,
      border: "1px solid #ddd",
      borderRadius: 6,
    }}
  >
    <h3>Prediction Result</h3>

    <p>
      <strong>Model message:</strong> {result.message}
    </p>

    <p>
      <strong>Prediction code:</strong> {result.prediction}
    </p>

    <div
      style={{
        padding: 12,
        background: result.prediction === 1 ? "#ffe3e3" : "#e8f7e8",
        borderRadius: 6,
      }}
    >
      {result.prediction === 1 ? (
        <>
          <h4 style={{ color: "#a33" }}>
            Sleep Disorder Detected
          </h4>
          <p>
            Consider following recommendations and consulting a healthcare professional.
          </p>
        </>
      ) : (
        <>
          <h4 style={{ color: "#196619" }}>
            No Sleep Disorder
          </h4>
          <p>
            Keep up healthy sleep habits.
          </p>
        </>
      )}
    </div>

    {predictionCode !== null && (
      <div style={{ marginTop: 20 }}>
        <Recommendations predictionCode={predictionCode} />
      </div>
    )}

  </div>
)}
          
    </div>
  );
};

export default Prediction;