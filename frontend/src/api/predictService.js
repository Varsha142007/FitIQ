// frontend/src/api/predictService.js
import axios from "axios";


const API_BASE = "http://localhost:5000";
// Predict function: sends a single record to /predict and returns response data
export async function predictSleepDisorder(payload) {
  const url = `${API_BASE.replace(/\/$/, "")}/predict`;
  const res = await axios.post(url, payload);
  return res.data; // { prediction: 0|1, message: "..."}
}