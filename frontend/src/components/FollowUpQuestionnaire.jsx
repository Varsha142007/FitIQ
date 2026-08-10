
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";

import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import "./FollowUpQuestionnaire.css";


const API_URL = "http://127.0.0.1:5000";


const FollowUpQuestionnaire = () => {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [uid, setUid] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [currentRecommendations, setCurrentRecommendations] =
    useState(null);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);


  // ========================================================
  // PARSERS
  // ========================================================

  const parseSleepHours = (val) => {

    if (val == null) return null;

    if (typeof val === "number") {
      return val;
    }

    const s = String(val).trim();

    if (s === "lessThan6") return 5.5;
    if (s === "6-7") return 6.5;
    if (s === "7-8") return 7.5;
    if (s === "moreThan8") return 8.5;

    const range = s.match(
      /(\d+(\.\d+)?)\s*[-–]\s*(\d+(\.\d+)?)/
    );

    if (range) {

      const a = parseFloat(range[1]);
      const b = parseFloat(range[3]);

      return (a + b) / 2;
    }

    const m = s.match(
      /(\d+(\.\d+)?)/
    );

    return m ? parseFloat(m[1]) : null;
  };


  const parseDailySteps = (val) => {

    if (val == null) return null;

    if (typeof val === "number") {
      return val;
    }

    const s = String(val)
      .toLowerCase()
      .trim();

    if (
      s === "lessthan3000" ||
      s === "less than 3000"
    ) {
      return 2500;
    }

    if (s === "3000-5000") {
      return 4000;
    }

    if (s === "5000-8000") {
      return 6500;
    }

    if (s === "8000-10000") {
      return 9000;
    }

    if (
      s === "morethan10000" ||
      s === "more than 10000"
    ) {
      return 11000;
    }

    if (
      s === "notTracked" ||
      s.includes("not")
    ) {
      return null;
    }

    const range = s.match(
      /(\d+)\s*[-–]\s*(\d+)/
    );

    if (range) {

      return Math.round(
        (
          Number(range[1]) +
          Number(range[2])
        ) / 2
      );
    }

    const m = s.match(
      /(\d{3,})/
    );

    return m
      ? parseInt(m[1], 10)
      : null;
  };


  const parseExerciseDays = (val) => {

    if (!val) return 0;

    switch (val) {

      case "0 days":
        return 0;

      case "1-2 days":
        return 1.5;

      case "3-4 days":
        return 3.5;

      case "5-6 days":
        return 5.5;

      case "Everyday":
        return 7;

      default:
        return 3;
    }
  };


  const parseWater = (val) => {

    if (!val) return null;

    switch (val) {

      case "lessThan1":
        return 0.75;

      case "1-2":
        return 1.5;

      case "2-3":
        return 2.5;

      case "3-4":
        return 3.5;

      case "moreThan4":
        return 4.5;

      default:
        return null;
    }
  };


  const parseStress = (val) => {

    if (!val) return null;

    switch (val) {

      case "veryLow":
        return 1;

      case "low":
        return 2;

      case "moderate":
        return 3;

      case "high":
        return 4;

      case "veryHigh":
        return 5;

      default:
        return null;
    }
  };


  // ========================================================
  // LOAD DATA
  // ========================================================

  useEffect(() => {

    let mounted = true;

    const loadData = async () => {

      setLoading(true);
      setError(null);

      try {

        const currentUser = auth.currentUser;

        if (!currentUser) {

          setError(
            "No authenticated user found. Please sign in."
          );

          setLoading(false);

          return;
        }


        const currentUid = currentUser.uid;

        setUid(currentUid);


        // --------------------------------------------------
        // USER DOCUMENT
        // --------------------------------------------------

        const userRef = doc(
          db,
          "users",
          currentUid
        );

        const userSnap = await getDoc(
          userRef
        );

        const uDoc =
          userSnap.exists()
            ? userSnap.data()
            : {};


        if (!mounted) return;

        setUserDoc(uDoc);


        // --------------------------------------------------
        // LATEST PREDICTION DATA
        // --------------------------------------------------

        const latestPred = {

          sleepDuration:
            uDoc?.sleepDuration,

          dailySteps:
            uDoc?.dailySteps,

          exerciseDays:
            uDoc?.exerciseDays,

          workoutDuration:
            uDoc?.workoutDuration,

          heartRate:
            uDoc?.heartRate,

          bodyTemp:
            uDoc?.bodyTemp,

          caloriesBurned:
            uDoc?.latestCalories ??
            uDoc?.caloriesBurned,

          disorder:
            uDoc?.disorder,

          sleepPrediction:
            uDoc?.sleepPrediction

        };


        setLatestPrediction(
          latestPred
        );


        // --------------------------------------------------
        // RECOMMENDATIONS
        // --------------------------------------------------

        const recs =
          uDoc?.currentRecommendations ??
          null;

        setCurrentRecommendations(
          recs
        );


        // --------------------------------------------------
        // BUILD QUESTIONS
        // --------------------------------------------------

        const picks = [];


        // --------------------------------------------------
        // SLEEP
        // --------------------------------------------------

        const previousSleep =
          parseSleepHours(
            uDoc?.numericSleepDuration ??
            uDoc?.sleepDuration
          );


        if (
          previousSleep != null &&
          previousSleep < 7
        ) {

          picks.push({

            key: "sleepDuration",

            label:
              "How has your average sleep been recently?",

            options: [

              {
                value: "lessThan6",
                label: "Less than 6 hours"
              },

              {
                value: "6-7",
                label: "6–7 hours"
              },

              {
                value: "7-8",
                label: "7–8 hours"
              },

              {
                value: "moreThan8",
                label: "More than 8 hours"
              }

            ]

          });
        }


        // --------------------------------------------------
        // DAILY STEPS
        // --------------------------------------------------

        const previousSteps =
          parseDailySteps(
            uDoc?.numericDailySteps ??
            uDoc?.dailySteps
          );


        if (
          previousSteps != null &&
          previousSteps < 8000
        ) {

          picks.push({

            key: "dailySteps",

            label:
              "What is your current daily step range?",

            options: [

              {
                value: "lessThan3000",
                label: "Less than 3000"
              },

              {
                value: "3000-5000",
                label: "3000–5000"
              },

              {
                value: "5000-8000",
                label: "5000–8000"
              },

              {
                value: "8000-10000",
                label: "8000–10000"
              },

              {
                value: "moreThan10000",
                label: "More than 10000"
              },

              {
                value: "notTracked",
                label: "Not tracked"
              }

            ]

          });
        }


        // --------------------------------------------------
        // EXERCISE
        // --------------------------------------------------

        if (uDoc?.exerciseDays) {

          picks.push({

            key: "exerciseDays",

            label:
              "How many days per week are you exercising now?",

            options: [

              {
                value: "0 days",
                label: "0 days"
              },

              {
                value: "1-2 days",
                label: "1–2 days"
              },

              {
                value: "3-4 days",
                label: "3–4 days"
              },

              {
                value: "5-6 days",
                label: "5–6 days"
              },

              {
                value: "Everyday",
                label: "Every day"
              }

            ]

          });
        }


        // --------------------------------------------------
        // WATER
        // --------------------------------------------------

        picks.push({

          key: "waterIntake",

          label:
            "How much water are you drinking per day now?",

          options: [

            {
              value: "lessThan1",
              label: "Less than 1 litre"
            },

            {
              value: "1-2",
              label: "1–2 litres"
            },

            {
              value: "2-3",
              label: "2–3 litres"
            },

            {
              value: "3-4",
              label: "3–4 litres"
            },

            {
              value: "moreThan4",
              label: "More than 4 litres"
            }

          ]

        });


        // --------------------------------------------------
        // STRESS
        // --------------------------------------------------

        picks.push({

          key: "stressLevel",

          label:
            "How would you rate your current stress level?",

          options: [

            {
              value: "veryLow",
              label: "Very Low"
            },

            {
              value: "low",
              label: "Low"
            },

            {
              value: "moderate",
              label: "Moderate"
            },

            {
              value: "high",
              label: "High"
            },

            {
              value: "veryHigh",
              label: "Very High"
            }

          ]

        });


        // --------------------------------------------------
        // ENERGY
        // --------------------------------------------------

        picks.push({

          key: "energyLevel",

          label:
            "How is your energy level recently?",

          options: [

            {
              value: "veryLow",
              label: "Very Low"
            },

            {
              value: "low",
              label: "Low"
            },

            {
              value: "moderate",
              label: "Moderate"
            },

            {
              value: "high",
              label: "High"
            },

            {
              value: "veryHigh",
              label: "Very High"
            }

          ]

        });


        // --------------------------------------------------
        // SITTING
        // --------------------------------------------------

        picks.push({

          key: "sittingHours",

          label:
            "How many hours do you spend sitting each day now?",

          options: [

            {
              value: "lessThan3",
              label: "Less than 3 hours"
            },

            {
              value: "3-6",
              label: "3–6 hours"
            },

            {
              value: "6-9",
              label: "6–9 hours"
            },

            {
              value: "moreThan9",
              label: "More than 9 hours"
            }

          ]

        });


        // --------------------------------------------------
        // FALLBACK QUESTION
        // --------------------------------------------------

        if (picks.length === 0) {

          picks.push({

            key: "overallProgress",

            label:
              "How would you rate your overall progress since your last assessment?",

            options: [

              {
                value: "muchWorse",
                label: "Much worse"
              },

              {
                value: "slightlyWorse",
                label: "Slightly worse"
              },

              {
                value: "noMajorChange",
                label: "No major change"
              },

              {
                value: "slightlyBetter",
                label: "Slightly better"
              },

              {
                value: "muchBetter",
                label: "Much better"
              }

            ]

          });
        }


        setQuestions(
          picks
        );


        const initialAnswers = {};

        picks.forEach(
          (q) => {

            initialAnswers[q.key] = "";

          }
        );


        setAnswers(
          initialAnswers
        );


        setLoading(false);

      } catch (err) {

        console.error(
          "Follow-up load error:",
          err
        );

        setError(
          "Failed to load follow-up questionnaire."
        );

        setLoading(false);
      }
    };


    loadData();


    return () => {

      mounted = false;

    };

  }, []);


  // ========================================================
  // ANSWER
  // ========================================================

  const handleSelect = (
    key,
    value
  ) => {

    setAnswers(
      prev => ({
        ...prev,
        [key]: value
      })
    );
  };


  // ========================================================
  // NAVIGATION
  // ========================================================

  const goNext = () => {

    if (
      currentIndex <
      questions.length - 1
    ) {

      setCurrentIndex(
        i => i + 1
      );
    }
  };


  const goBack = () => {

    if (currentIndex > 0) {

      setCurrentIndex(
        i => i - 1
      );
    }
  };


  // ========================================================
  // CALORIE PREDICTION
  // ========================================================

  const generateCaloriesPrediction =
    async () => {

      if (!userDoc) {

        throw new Error(
          "User profile data is unavailable."
        );
      }


      const gender =
        userDoc.gender ||
        "Male";


      const age =
        Number(
          userDoc.age
        );


      const height =
        Number(
          userDoc.height
        );


      const weight =
        Number(
          userDoc.weight
        );


      if (
        !age ||
        !height ||
        !weight
      ) {

        throw new Error(
          "Age, height and weight are required for calorie prediction."
        );
      }


      // ----------------------------------------------------
      // WORKOUT DURATION
      // ----------------------------------------------------

      let duration =
        Number(
          userDoc.numericWorkoutDuration ??
          userDoc.duration ??
          userDoc.exerciseDuration ??
          30
        );


      if (
        !Number.isFinite(duration) ||
        duration < 0
      ) {

        duration = 30;

      }


      // ----------------------------------------------------
      // HEART RATE
      // ----------------------------------------------------

      let heartRate =
        Number(
          userDoc.heartRate ??
          70
        );


      if (
        !Number.isFinite(heartRate) ||
        heartRate <= 0
      ) {

        heartRate = 70;

      }


      // ----------------------------------------------------
      // BODY TEMPERATURE
      // ----------------------------------------------------

      let bodyTemp =
        Number(
          userDoc.bodyTemp ??
          37
        );


      if (
        !Number.isFinite(bodyTemp) ||
        bodyTemp <= 0
      ) {

        bodyTemp = 37;

      }


      // ----------------------------------------------------
      // IMPROVE DURATION USING EXERCISE FREQUENCY
      // ----------------------------------------------------

      if (answers.exerciseDays) {

        const days =
          parseExerciseDays(
            answers.exerciseDays
          );


        if (days >= 5) {

          duration =
            Math.max(
              duration,
              45
            );

        } else if (days >= 3) {

          duration =
            Math.max(
              duration,
              30
            );

        } else if (days >= 1) {

          duration =
            Math.max(
              duration,
              20
            );
        }
      }


      // ----------------------------------------------------
      // ADJUST HEART RATE USING DAILY STEPS
      // ----------------------------------------------------

      const steps =
        parseDailySteps(
          answers.dailySteps
        );


      if (steps != null) {

        if (steps >= 10000) {

          heartRate =
            Math.max(
              heartRate,
              85
            );

        } else if (steps >= 5000) {

          heartRate =
            Math.max(
              heartRate,
              78
            );
        }
      }


      // ----------------------------------------------------
      // FINAL CALORIE MODEL PAYLOAD
      // ----------------------------------------------------

      const payload = {

        Gender:
          gender,

        Age:
          age,

        Height:
          height,

        Weight:
          weight,

        Duration:
          duration,

        Heart_Rate:
          heartRate,

        Body_Temp:
          bodyTemp

      };


      console.log(
        "Calories prediction payload:",
        payload
      );


      const response =
        await fetch(
          `${API_URL}/predict-calories`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );


      const data =
        await response.json();


      console.log(
        "Calories API response:",
        data
      );


      if (!response.ok) {

        throw new Error(
          data?.error ||
          data?.details ||
          "Calories prediction failed."
        );
      }


      if (
        data?.calories == null
      ) {

        throw new Error(
          "Calories prediction returned no result."
        );
      }


      const calories =
        Number(
          data.calories
        );


      if (
        !Number.isFinite(calories)
      ) {

        throw new Error(
          "Invalid calorie prediction received."
        );
      }


      return {

        calories:
          calories,

        input:
          payload

      };
    };


  // ========================================================
  // SUBMIT
  // ========================================================

  const handleSubmit =
    async () => {

      const missing =
        questions.filter(
          q => !answers[q.key]
        );


      if (missing.length > 0) {

        setError(
          "Please answer all questions before submitting."
        );

        return;
      }


      setSaving(true);
      setError(null);


      try {

        if (!uid) {

          throw new Error(
            "No authenticated user found."
          );
        }


        // ==================================================
        // 1. SAVE ANSWERS
        // ==================================================

        const savedAnswers = {};


        questions.forEach(
          q => {

            if (answers[q.key]) {

              savedAnswers[q.key] =
                answers[q.key];

            }
          }
        );


        // ==================================================
        // 2. CALORIES PREDICTION
        // ==================================================

        let calorieResult = null;


        try {

          calorieResult =
            await generateCaloriesPrediction();


          console.log(
            "Follow-up calories:",
            calorieResult
          );

        } catch (calorieError) {

          console.error(
            "Calories prediction failed:",
            calorieError
          );

          /*
            We intentionally continue.

            The check-in should still be saved even
            if the calorie model is temporarily
            unavailable.
          */

          calorieResult = null;
        }


        // ==================================================
        // 3. SAVE CHECK-IN
        // ==================================================

        const checkInsCol =
          collection(
            db,
            "users",
            uid,
            "checkIns"
          );


        const checkInData = {

          createdAt:
            serverTimestamp(),

          answers:
            savedAnswers,

          basedOnRecommendations:
            !!currentRecommendations,

          basedOnPreviousAssessment:
            true,

          calories:
            calorieResult
              ? calorieResult.calories
              : null,

          caloriePredictionAvailable:
            !!calorieResult

        };


        const checkInRef =
          await addDoc(
            checkInsCol,
            checkInData
          );


        console.log(
          "Check-in saved:",
          checkInRef.id
        );


        // ==================================================
        // 4. SAVE CALORIE PREDICTION
        // ==================================================

        if (calorieResult) {

          const predictionsCol =
            collection(
              db,
              "users",
              uid,
              "predictions"
            );


          const predictionRef =
            await addDoc(
              predictionsCol,
              {

                type:
                  "calories",

                source:
                  "follow-up",

                calories:
                  calorieResult.calories,

                caloriesBurned:
                  calorieResult.calories,

                input:
                  calorieResult.input,

                checkInId:
                  checkInRef.id,

                createdAt:
                  serverTimestamp()

              }
            );


          console.log(
            "Calorie prediction saved:",
            predictionRef.id
          );


          // ------------------------------------------------
          // SAVE LATEST CALORIE RESULT
          // ------------------------------------------------

          await setDoc(

            doc(
              db,
              "users",
              uid
            ),

            {

              latestCalories:
                calorieResult.calories,

              caloriesBurned:
                calorieResult.calories,

              latestCaloriesSource:
                "follow-up",

              latestCaloriesUpdatedAt:
                serverTimestamp()

            },

            {
              merge: true
            }

          );


          console.log(
            "Latest calorie value updated in user document."
          );

        }


        // ==================================================
        // 5. RECOMMENDATIONS
        // ==================================================

        const updatedRecommendations = {

          sleep: [],

          activity: [],

          hydration: [],

          stress: [],

          energy: [],

          lifestyle: []

        };


        // --------------------------------------------------
        // SLEEP
        // --------------------------------------------------

        if (
          answers.sleepDuration
        ) {

          if (
            answers.sleepDuration ===
            "lessThan6"
          ) {

            updatedRecommendations.sleep.push({

              issue:
                "Low sleep duration",

              message:
                "Try to gradually increase your sleep and aim for around 7–9 hours each night."

            });

          } else if (
            answers.sleepDuration ===
            "6-7"
          ) {

            updatedRecommendations.sleep.push({

              issue:
                "Sleep duration could improve",

              message:
                "Try to maintain a consistent sleep schedule and gradually aim for 7–9 hours."

            });

          } else {

            updatedRecommendations.sleep.push({

              issue:
                "Good sleep duration",

              message:
                "Great! Continue maintaining a consistent and healthy sleep schedule."

            });

          }
        }


        // --------------------------------------------------
        // ACTIVITY
        // --------------------------------------------------

        if (
          answers.dailySteps
        ) {

          if (
            answers.dailySteps ===
              "lessThan3000" ||
            answers.dailySteps ===
              "3000-5000"
          ) {

            updatedRecommendations.activity.push({

              issue:
                "Low daily activity",

              message:
                "Try increasing your daily steps gradually. A short walk after meals can help."

            });

          } else {

            updatedRecommendations.activity.push({

              issue:
                "Good daily activity",

              message:
                "Great job maintaining a good level of daily movement. Keep it consistent."

            });

          }
        }


        // --------------------------------------------------
        // EXERCISE
        // --------------------------------------------------

        if (
          answers.exerciseDays
        ) {

          if (
            answers.exerciseDays ===
              "0 days" ||
            answers.exerciseDays ===
              "1-2 days"
          ) {

            updatedRecommendations.activity.push({

              issue:
                "Exercise frequency is low",

              message:
                "Try starting with 3 days of exercise per week and gradually increase your activity."

            });

          } else {

            updatedRecommendations.activity.push({

              issue:
                "Good exercise consistency",

              message:
                "Your exercise frequency is good. Continue maintaining a consistent routine."

            });

          }
        }


        // --------------------------------------------------
        // WATER
        // --------------------------------------------------

        if (
          answers.waterIntake
        ) {

          if (
            answers.waterIntake ===
            "lessThan1"
          ) {

            updatedRecommendations.hydration.push({

              issue:
                "Low water intake",

              message:
                "Try increasing your water intake gradually throughout the day."

            });

          } else {

            updatedRecommendations.hydration.push({

              issue:
                "Good hydration",

              message:
                "Good job maintaining your water intake. Continue staying hydrated throughout the day."

            });

          }
        }


        // --------------------------------------------------
        // STRESS
        // --------------------------------------------------

        if (
          answers.stressLevel
        ) {

          if (
            answers.stressLevel ===
              "high" ||
            answers.stressLevel ===
              "veryHigh"
          ) {

            updatedRecommendations.stress.push({

              issue:
                "High stress level",

              message:
                "Consider relaxation activities such as walking, breathing exercises, meditation, or taking regular breaks."

            });

          } else {

            updatedRecommendations.stress.push({

              issue:
                "Stress is under control",

              message:
                "Good job managing your stress. Continue maintaining healthy relaxation habits."

            });

          }
        }


        // --------------------------------------------------
        // ENERGY
        // --------------------------------------------------

        if (
          answers.energyLevel
        ) {

          if (
            answers.energyLevel ===
              "veryLow" ||
            answers.energyLevel ===
              "low"
          ) {

            updatedRecommendations.energy.push({

              issue:
                "Low energy level",

              message:
                "Focus on adequate sleep, regular meals, hydration, and moderate physical activity."

            });

          } else {

            updatedRecommendations.energy.push({

              issue:
                "Good energy level",

              message:
                "Your energy level looks good. Continue maintaining healthy sleep, nutrition, hydration, and activity habits."

            });

          }
        }


        // --------------------------------------------------
        // SITTING
        // --------------------------------------------------

        if (
          answers.sittingHours
        ) {

          if (
            answers.sittingHours ===
              "6-9" ||
            answers.sittingHours ===
              "moreThan9"
          ) {

            updatedRecommendations.lifestyle.push({

              issue:
                "High sitting time",

              message:
                "Try taking short movement breaks every 30–60 minutes and avoid sitting continuously for long periods."

            });

          } else {

            updatedRecommendations.lifestyle.push({

              issue:
                "Good sitting habits",

              message:
                "Keep taking regular movement breaks throughout the day."

            });

          }
        }


        // ==================================================
        // 6. SAVE RECOMMENDATIONS + CHECK-IN STATUS
        // ==================================================

        await setDoc(

          doc(
            db,
            "users",
            uid
          ),

          {

            currentRecommendations:
              updatedRecommendations,

            lastCheckInAt:
              serverTimestamp(),

            latestCheckInAnswers:
              savedAnswers,

            lastCheckInCompleted:
              true

          },

          {
            merge: true
          }

        );


        console.log(
          "Recommendations updated."
        );


        // ==================================================
        // 7. DASHBOARD
        // ==================================================

        navigate(
          "/dashboard"
        );


      } catch (err) {

        console.error(
          "Failed to save check-in:",
          err
        );

        setError(
          err?.message ||
          "Failed to save check-in. Please try again."
        );

        setSaving(false);
      }
    };


  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {

    return (

      <div className="followup-wrapper">

        <h2>
          Your Progress Check-In
        </h2>

        <p>
          Loading your follow-up questions…
        </p>

      </div>

    );
  }


  // ========================================================
  // NO QUESTIONS
  // ========================================================

  if (
    !questions ||
    questions.length === 0
  ) {

    return (

      <div className="followup-wrapper">

        <h2>
          No questions available
        </h2>

        <button
          className="btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Back to Dashboard
        </button>

      </div>

    );
  }


  const total =
    questions.length;


  const currentQuestion =
    questions[currentIndex];


  // ========================================================
  // UI
  // ========================================================

  return (

    <div className="followup-wrapper">

      <header className="followup-header">

        <h2>
          Your Progress Check-In
        </h2>

        <p className="muted">

          A quick follow-up based on your previous assessment.
          Your answers will also be used to update your calorie
          estimate and progress history.

        </p>

      </header>


      {error && (

        <div
          className="followup-error"
          style={{
            color:
              "var(--danger, #c0392b)",
            marginBottom: 12
          }}
        >

          {error}

        </div>

      )}


      <div className="followup-card">

        <div className="progress-indicator">

          Question{" "}
          {currentIndex + 1}
          {" "}of{" "}
          {total}

        </div>


        <div className="question-block">

          <h3 className="question-label">

            {currentQuestion.label}

          </h3>


          <div className="options-list">

            {currentQuestion.options.map(
              (opt) => {

                const checked =
                  answers[
                    currentQuestion.key
                  ] === opt.value;


                return (

                  <label
                    className="option-item"
                    key={opt.value}
                  >

                    <input
                      type="radio"
                      name={
                        currentQuestion.key
                      }
                      value={
                        opt.value
                      }
                      checked={
                        checked
                      }
                      onChange={() =>
                        handleSelect(
                          currentQuestion.key,
                          opt.value
                        )
                      }
                    />

                    <span className="option-label">

                      {opt.label}

                    </span>

                  </label>

                );

              }
            )}

          </div>

        </div>


        <div className="navigation">

          <button
            type="button"
            className="back-btn"
            onClick={goBack}
            disabled={
              currentIndex === 0 ||
              saving
            }
          >

            Back

          </button>


          {currentIndex <
          total - 1 ? (

            <button
              type="button"
              className="next-btn"
              onClick={goNext}
              disabled={
                !answers[
                  currentQuestion.key
                ] ||
                saving
              }
            >

              Next

            </button>

          ) : (

            <button
              type="button"
              className="submit-btn"
              onClick={handleSubmit}
              disabled={
                saving ||
                !answers[
                  currentQuestion.key
                ]
              }
            >

              {saving
                ? "Calculating & Saving…"
                : "Submit Check-In"}

            </button>

          )}

        </div>

      </div>


      <footer className="followup-footer">

        <small className="disclaimer">

          Your check-in updates your progress,
          recommendations and calorie estimate.
          It does not replace a medical assessment.

        </small>

      </footer>

    </div>

  );
};


export default FollowUpQuestionnaire;

