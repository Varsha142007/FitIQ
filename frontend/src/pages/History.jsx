import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./History.css";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const fetchHistory = async (user) => {
      try {
        console.log("Authenticated user:", user.uid);

        // ==========================================
        // 1. FETCH INITIAL ASSESSMENT PREDICTIONS
        // ==========================================

        const predictionsRef = collection(
          db,
          "users",
          user.uid,
          "predictions"
        );

        const predictionsQuery = query(
          predictionsRef,
          orderBy("createdAt", "desc")
        );

        const predictionsSnapshot = await getDocs(predictionsQuery);

        console.log(
          "Prediction documents found:",
          predictionsSnapshot.size
        );

        const predictionHistory = predictionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: "prediction",
          ...doc.data(),
        }));

        // ==========================================
        // 2. FETCH ALL FOLLOW-UP CHECK-INS
        // ==========================================

        const checkInsRef = collection(
          db,
          "users",
          user.uid,
          "checkIns"
        );

        const checkInsQuery = query(
          checkInsRef,
          orderBy("createdAt", "desc")
        );

        const checkInsSnapshot = await getDocs(checkInsQuery);

        console.log(
          "Check-in documents found:",
          checkInsSnapshot.size
        );

        const checkInHistory = checkInsSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: "checkIn",
          ...doc.data(),
        }));

        // ==========================================
        // 3. COMBINE BOTH HISTORIES
        // ==========================================

        const combinedHistory = [
          ...predictionHistory,
          ...checkInHistory,
        ];

        // ==========================================
        // 4. SORT NEWEST → OLDEST
        // ==========================================

        combinedHistory.sort((a, b) => {
          const dateA = getTimestampMilliseconds(a.createdAt);
          const dateB = getTimestampMilliseconds(b.createdAt);

          return dateB - dateA;
        });

        console.log("Combined history:", combinedHistory);

        setHistory(combinedHistory);

      } catch (error) {
        console.error("Error fetching history:", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    // Wait for Firebase authentication
    unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);

      if (user) {
        fetchHistory(user);
      } else {
        console.log("No authenticated user.");
        setHistory([]);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // ==========================================
  // FIREBASE TIMESTAMP → MILLISECONDS
  // ==========================================

  const getTimestampMilliseconds = (timestamp) => {
    if (!timestamp) return 0;

    try {
      if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().getTime();
      }

      if (timestamp instanceof Date) {
        return timestamp.getTime();
      }

      const date = new Date(timestamp);

      if (!Number.isNaN(date.getTime())) {
        return date.getTime();
      }
    } catch (error) {
      console.error("Timestamp conversion error:", error);
    }

    return 0;
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (timestamp) => {
    if (!timestamp) return "Date unavailable";

    try {
      if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleString();
      }

      const date = new Date(timestamp);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    } catch (error) {
      console.error("Date formatting error:", error);
    }

    return "Date unavailable";
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="history-page">
        <h1>History</h1>
        <p>Loading your history...</p>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="history-page">

      <h1>History</h1>

      <p className="history-subtitle">
        View your assessments, sleep predictions, and progress check-ins.
      </p>

      {history.length === 0 ? (
        <div className="empty-history">
          <h2>No History Yet</h2>

          <p>
            Complete your initial assessment or a progress check-in
            to see your history here.
          </p>
        </div>
      ) : (
        <div className="history-list">

          {history.map((item) => {

            // ========================================
            // INITIAL ASSESSMENT / PREDICTION
            // ========================================

            if (item.type === "prediction") {

              const input =
                item.predictionData ||
                item.inputData ||
                {};

              return (
                <div
                  className="history-card"
                  key={`prediction-${item.id}`}
                >

                  <div className="history-card-header">

                    <div>
                      <span className="history-type prediction-type">
                        Initial Assessment
                      </span>

                      <h2>
                        {item.prediction ||
                          "Prediction unavailable"}
                      </h2>
                    </div>

                    <span className="history-date">
                      {formatDate(item.createdAt)}
                    </span>

                  </div>

                  <div className="history-details">

                    <div>
                      <strong>Sleep Duration</strong>
                      <span>
                        {input["Sleep Duration"] ?? "—"} hours
                      </span>
                    </div>

                    <div>
                      <strong>Sleep Quality</strong>
                      <span>
                        {input["Quality of Sleep"] ?? "—"} / 10
                      </span>
                    </div>

                    <div>
                      <strong>Stress Level</strong>
                      <span>
                        {input["Stress Level"] ?? "—"}
                      </span>
                    </div>

                    <div>
                      <strong>Heart Rate</strong>
                      <span>
                        {input["Heart Rate"] ?? "—"} bpm
                      </span>
                    </div>

                    <div>
                      <strong>Daily Steps</strong>
                      <span>
                        {input["Daily Steps"] ?? "—"}
                      </span>
                    </div>

                    <div>
                      <strong>BMI Category</strong>
                      <span>
                        {input["BMI Category"] ?? "—"}
                      </span>
                    </div>

                  </div>

                </div>
              );
            }

            // ========================================
            // FOLLOW-UP CHECK-IN
            // ========================================

            if (item.type === "checkIn") {

              const answers = item.answers || {};

              return (
                <div
                  className="history-card checkin-history-card"
                  key={`checkin-${item.id}`}
                >

                  <div className="history-card-header">

                    <div>
                      <span className="history-type checkin-type">
                        Progress Check-In
                      </span>

                      <h2>
                        Your Progress Update
                      </h2>
                    </div>

                    <span className="history-date">
                      {formatDate(item.createdAt)}
                    </span>

                  </div>

                  <div className="history-details">

                    {answers.sleepDuration && (
                      <div>
                        <strong>Sleep Duration</strong>
                        <span>
                          {convertValue(
                            answers.sleepDuration
                          )}
                        </span>
                      </div>
                    )}

                    {answers.dailySteps && (
                      <div>
                        <strong>Daily Steps</strong>
                        <span>
                          {convertValue(
                            answers.dailySteps
                          )}
                        </span>
                      </div>
                    )}

                    {answers.exerciseDays && (
                      <div>
                        <strong>Exercise</strong>
                        <span>
                          {convertValue(
                            answers.exerciseDays
                          )}
                        </span>
                      </div>
                    )}

                    {answers.waterIntake && (
                      <div>
                        <strong>Water Intake</strong>
                        <span>
                          {convertValue(
                            answers.waterIntake
                          )}
                        </span>
                      </div>
                    )}

                    {answers.stressLevel && (
                      <div>
                        <strong>Stress Level</strong>
                        <span>
                          {convertValue(
                            answers.stressLevel
                          )}
                        </span>
                      </div>
                    )}

                    {answers.energyLevel && (
                      <div>
                        <strong>Energy Level</strong>
                        <span>
                          {convertValue(
                            answers.energyLevel
                          )}
                        </span>
                      </div>
                    )}

                    {answers.sittingHours && (
                      <div>
                        <strong>Sitting Hours</strong>
                        <span>
                          {convertValue(
                            answers.sittingHours
                          )}
                        </span>
                      </div>
                    )}

                    {answers.overallProgress && (
                      <div>
                        <strong>Overall Progress</strong>
                        <span>
                          {convertValue(
                            answers.overallProgress
                          )}
                        </span>
                      </div>
                    )}

                  </div>

                </div>
              );
            }

            return null;
          })}

        </div>
      )}
    </div>
  );
}

// ==========================================
// MAKE FIREBASE VALUES USER-FRIENDLY
// ==========================================

function convertValue(value) {
  if (!value) return "—";

  const mappings = {
    lessThan6: "Less than 6 hours",
    "6-7": "6–7 hours",
    "7-8": "7–8 hours",
    moreThan8: "More than 8 hours",

    lessThan3000: "Less than 3000 steps",
    "3000-5000": "3000–5000 steps",
    "5000-8000": "5000–8000 steps",
    "8000-10000": "8000–10000 steps",
    moreThan10000: "More than 10000 steps",
    notTracked: "Not tracked",

    "0 days": "0 days",
    "1-2 days": "1–2 days",
    "3-4 days": "3–4 days",
    "5-6 days": "5–6 days",

    lessThan1: "Less than 1 litre",
    "1-2": "1–2 litres",
    "2-3": "2–3 litres",
    "3-4": "3–4 litres",
    moreThan4: "More than 4 litres",

    veryLow: "Very Low",
    low: "Low",
    moderate: "Moderate",
    high: "High",
    veryHigh: "Very High",

    lessThan3: "Less than 3 hours",
    "3-6": "3–6 hours",
    "6-9": "6–9 hours",
    moreThan9: "More than 9 hours",

    muchWorse: "Much worse",
    slightlyWorse: "Slightly worse",
    noMajorChange: "No major change",
    slightlyBetter: "Slightly better",
    muchBetter: "Much better",
  };

  return mappings[value] || value;
}