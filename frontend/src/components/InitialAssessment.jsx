import React, { useState } from "react";
import "./InitialAssessment.css";

import { auth, db } from "../firebase/firebase";

import {
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";


const InitialAssessment = () => {

  const navigate = useNavigate();


  // ==========================================================
  // Form Data
  // ==========================================================

  const [formData, setFormData] = useState({

    age: "",
    gender: "",
    height: "",
    weight: "",

    occupation: "",

    qualityOfSleep: "",
    heartRate: "",

    systolicBP: "",
    diastolicBP: "",

    sleepDuration: "",
    dailySteps: "",

    exerciseDays: "",
    workoutDuration: "",
    activityLevel: "",

    waterIntake: "",
    mealsPerDay: "",
    dietPreference: "",
    junkFoodFrequency: "",
    proteinIntake: "",

    stressLevel: "",
    energyLevel: "",

    fitnessGoal: "",
    fitnessLevel: "",

    routineConsistency: "",
    sittingHours: ""
  });


  const [submitted, setSubmitted] = useState(false);


  // ==========================================================
  // Handle Input Changes
  // ==========================================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

  };


  // ==========================================================
  // Submit Assessment
  // ==========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      // ======================================================
      // Check User
      // ======================================================

      const user = auth.currentUser;

      console.log(
        "Assessment current user:",
        user
      );

      console.log(
        "Assessment UID:",
        user?.uid
      );


      if (!user) {

        alert("Please login first.");

        navigate("/login");

        return;
      }


      // ======================================================
      // BMI Calculation
      // ======================================================

      const heightInMeters =
        Number(formData.height) / 100;

      const weight =
        Number(formData.weight);


      const bmi =
        weight /
        (heightInMeters * heightInMeters);


      let bmiCategory = "";


      if (bmi < 18.5) {

        bmiCategory = "Underweight";

      } else if (bmi < 25) {

        bmiCategory = "Normal";

      } else if (bmi < 30) {

        bmiCategory = "Overweight";

      } else {

        bmiCategory = "Obese";

      }


      // ======================================================
      // Sleep Duration Conversion
      // ======================================================

      let sleepDuration = 0;


      if (
        formData.sleepDuration ===
        "Less than 5 hours"
      ) {

        sleepDuration = 4;

      } else if (
        formData.sleepDuration ===
        "5-6 hours"
      ) {

        sleepDuration = 5.5;

      } else if (
        formData.sleepDuration ===
        "6-7 hours"
      ) {

        sleepDuration = 6.5;

      } else if (
        formData.sleepDuration ===
        "7-8 hours"
      ) {

        sleepDuration = 7.5;

      } else if (
        formData.sleepDuration ===
        "More than 8 hours"
      ) {

        sleepDuration = 9;

      }


      // ======================================================
      // Daily Steps Conversion
      // ======================================================

      let dailySteps = 0;


      if (
        formData.dailySteps ===
        "Less than 3000"
      ) {

        dailySteps = 2500;

      } else if (
        formData.dailySteps ===
        "3000-5000"
      ) {

        dailySteps = 4000;

      } else if (
        formData.dailySteps ===
        "5000-8000"
      ) {

        dailySteps = 6500;

      } else if (
        formData.dailySteps ===
        "8000-10000"
      ) {

        dailySteps = 9000;

      } else if (
        formData.dailySteps ===
        "More than 10000"
      ) {

        dailySteps = 11000;

      } else if (
        formData.dailySteps ===
        "Not tracked"
      ) {

        dailySteps = 0;

      }


      // ======================================================
      // Physical Activity Level
      // ======================================================

      let physicalActivityLevel = 0;


      if (
        formData.activityLevel ===
        "Low"
      ) {

        physicalActivityLevel = 30;

      } else if (
        formData.activityLevel ===
        "Moderate"
      ) {

        physicalActivityLevel = 50;

      } else if (
        formData.activityLevel ===
        "High"
      ) {

        physicalActivityLevel = 70;

      } else if (
        formData.activityLevel ===
        "Very High"
      ) {

        physicalActivityLevel = 90;

      }


      // ======================================================
      // Stress Level
      // ======================================================

      let stressLevel =
        Number(formData.stressLevel);


      if (
        formData.stressLevel ===
        "Very low"
      ) {

        stressLevel = 1;

      } else if (
        formData.stressLevel ===
        "Very high"
      ) {

        stressLevel = 5;

      }


      // ======================================================
      // SLEEP MODEL DATA
      // ======================================================

      const predictionData = {

        Gender:
          formData.gender,

        Age:
          Number(formData.age),

        Occupation:
          formData.occupation,

        "Sleep Duration":
          sleepDuration,

        "Quality of Sleep":
          Number(formData.qualityOfSleep),

        "Physical Activity Level":
          physicalActivityLevel,

        "Stress Level":
          stressLevel,

        "BMI Category":
          bmiCategory,

        "Heart Rate":
          Number(formData.heartRate),

        "Daily Steps":
          dailySteps,

        Systolic_BP:
          Number(formData.systolicBP),

        Diastolic_BP:
          Number(formData.diastolicBP)

      };


      console.log(
        "Sleep prediction data:",
        predictionData
      );


      // ======================================================
      // CALORIES MODEL DATA
      // ======================================================

      let workoutDuration = 0;


      if (
        formData.workoutDuration ===
        "No workout"
      ) {

        workoutDuration = 0;

      } else if (
        formData.workoutDuration ===
        "Less than 30 mins"
      ) {

        workoutDuration = 20;

      } else if (
        formData.workoutDuration ===
        "30-60 mins"
      ) {

        workoutDuration = 45;

      } else if (
        formData.workoutDuration ===
        "1-2 hours"
      ) {

        workoutDuration = 90;

      } else if (
        formData.workoutDuration ===
        "More than 2 hours"
      ) {

        workoutDuration = 150;

      }


      const bodyTemperature = 37.0;


      const caloriesData = {

        Gender:
          formData.gender,

        Age:
          Number(formData.age),

        Height:
          Number(formData.height),

        Weight:
          Number(formData.weight),

        Duration:
          workoutDuration,

        Heart_Rate:
          Number(formData.heartRate),

        Body_Temp:
          bodyTemperature

      };


      console.log(
        "Calories prediction data:",
        caloriesData
      );


      // ======================================================
      // CALL SLEEP PREDICTION API
      // ======================================================

      const sleepResponse =
        await fetch(
          "http://127.0.0.1:5000/predict",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                predictionData
              )
          }
        );


      const sleepResult =
        await sleepResponse.json();


      console.log(
        "Sleep prediction response:",
        sleepResult
      );


      if (!sleepResponse.ok) {

        throw new Error(
          sleepResult.details ||
          sleepResult.error ||
          "Sleep prediction failed"
        );

      }


      // ======================================================
      // CALL CALORIES PREDICTION API
      // ======================================================

      const caloriesResponse =
        await fetch(
          "http://127.0.0.1:5000/predict-calories",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                caloriesData
              )
          }
        );


      const caloriesResult =
        await caloriesResponse.json();


      console.log(
        "Calories prediction response:",
        caloriesResult
      );


      if (!caloriesResponse.ok) {

        throw new Error(
          caloriesResult.details ||
          caloriesResult.error ||
          "Calories prediction failed"
        );

      }


      // ======================================================
      // COMBINED RESULT
      // ======================================================

      const caloriesBurned =
        Number(
          caloriesResult.calories
        );


      const disorder =
        sleepResult.disorder;


      const sleepPrediction =
        sleepResult.prediction;


      // ======================================================
      // SAVE LATEST DATA TO USER DOCUMENT
      // ======================================================

      await setDoc(

        doc(
          db,
          "users",
          user.uid
        ),

        {

          // Original assessment
          ...formData,


          // BMI
          bmi:
            Number(
              bmi.toFixed(2)
            ),

          bmiCategory:
            bmiCategory,


          // Sleep prediction
          prediction:
            sleepResult.message,

          disorder:
            disorder,

          sleepPrediction:
            sleepPrediction,

          sleepProbabilities:
            sleepResult.probabilities ||
            {},


          // Calories
          caloriesBurned:
            caloriesBurned,

          // IMPORTANT:
          // Also save latestCalories so Dashboard
          // can directly read it.
          latestCalories:
            caloriesBurned,


          // ML input data
          predictionData:
            predictionData,

          caloriesData:
            caloriesData,


          // Status
          assessmentCompleted:
            true,

          assessmentCompletedAt:
            serverTimestamp()

        },

        {
          merge: true
        }

      );


      // ======================================================
      // SAVE PREDICTION HISTORY
      // ======================================================

      await addDoc(

        collection(
          db,
          "users",
          user.uid,
          "predictions"
        ),

        {

          // Original assessment
          ...formData,


          // BMI
          bmi:
            Number(
              bmi.toFixed(2)
            ),

          bmiCategory:
            bmiCategory,


          // Sleep prediction
          prediction:
            sleepResult.message,

          disorder:
            disorder,

          sleepPrediction:
            sleepPrediction,

          sleepProbabilities:
            sleepResult.probabilities ||
            {},


          // Calories
          caloriesBurned:
            caloriesBurned,

          // Also store these formats for compatibility
          type:
            "assessment",

          calories:
            caloriesBurned,


          // Model inputs
          predictionData:
            predictionData,

          caloriesData:
            caloriesData,


          // Timestamp
          createdAt:
            serverTimestamp()

        }

      );


      console.log(
        "Assessment, sleep prediction, calories prediction and history saved successfully."
      );


      // ======================================================
      // SUCCESS
      // ======================================================

      setSubmitted(true);


      /*
        IMPORTANT:

        This flag tells Dashboard:

        "The user has JUST completed the initial
        assessment."

        Therefore Dashboard should NOT immediately
        show the follow-up check-in popup.

        The flag is consumed by Dashboard only once.
      */

      localStorage.setItem(
        "fitiq_initial_assessment_completed",
        "true"
      );


      // ======================================================
      // NAVIGATE DASHBOARD
      // ======================================================

      setTimeout(() => {

        navigate("/dashboard");

      }, 1000);


    } catch (error) {

      console.error(
        "Assessment submission failed:",
        error
      );


      alert(
        error?.message ||
        "Failed to submit assessment. Please try again."
      );

    }

  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="assessment-wrapper">

      <header className="assessment-header">

        <h1>
          Initial Fitness & Lifestyle Assessment
        </h1>

        <p>
          Help us understand your current habits
          so we can tailor recommendations to you.
        </p>

      </header>


      {submitted ? (

        <div className="success-card">

          <h2>
            Assessment Submitted
          </h2>

          <p>
            Your fitness assessment,
            sleep analysis and calorie prediction
            have been completed successfully.
          </p>

          <p>
            Redirecting to dashboard...
          </p>

        </div>

      ) : (

        <form
          className="assessment-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <section className="form-section">

            <h3>
              Personal Information
            </h3>


            <div className="field-row">

              <label htmlFor="age">
                Age *
              </label>

              <input
                id="age"
                name="age"
                type="number"
                min="10"
                max="120"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="e.g., 25"
              />

            </div>


            <div className="field-row">

              <label>
                Gender *
              </label>

              <div className="radio-group">

                <label className="radio-item">

                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={
                      formData.gender === "Male"
                    }
                    onChange={handleChange}
                    required
                  />

                  Male

                </label>


                <label className="radio-item">

                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={
                      formData.gender === "Female"
                    }
                    onChange={handleChange}
                  />

                  Female

                </label>

              </div>

            </div>


            <div className="field-row">

              <label htmlFor="height">
                Height (cm) *
              </label>

              <input
                id="height"
                name="height"
                type="number"
                min="50"
                max="300"
                value={formData.height}
                onChange={handleChange}
                required
                placeholder="e.g., 170"
              />

            </div>


            <div className="field-row">

              <label htmlFor="weight">
                Weight (kg) *
              </label>

              <input
                id="weight"
                name="weight"
                type="number"
                min="20"
                max="500"
                value={formData.weight}
                onChange={handleChange}
                required
                placeholder="e.g., 65"
              />

            </div>


            <div className="field-row">

              <label htmlFor="occupation">
                Occupation *
              </label>

              <input
                id="occupation"
                name="occupation"
                type="text"
                value={formData.occupation}
                onChange={handleChange}
                required
                placeholder="e.g., Engineer"
              />

            </div>


            <div className="field-row">

              <label htmlFor="qualityOfSleep">
                Quality of Sleep (1-10) *
              </label>

              <input
                id="qualityOfSleep"
                name="qualityOfSleep"
                type="number"
                min="1"
                max="10"
                value={
                  formData.qualityOfSleep
                }
                onChange={handleChange}
                required
                placeholder="e.g., 8"
              />

            </div>


            <div className="field-row">

              <label htmlFor="heartRate">
                Heart Rate (BPM) *
              </label>

              <input
                id="heartRate"
                name="heartRate"
                type="number"
                min="30"
                max="220"
                value={
                  formData.heartRate
                }
                onChange={handleChange}
                required
                placeholder="e.g., 75"
              />

            </div>


            <div className="field-row">

              <label htmlFor="systolicBP">
                Systolic Blood Pressure *
              </label>

              <input
                id="systolicBP"
                name="systolicBP"
                type="number"
                value={
                  formData.systolicBP
                }
                onChange={handleChange}
                required
                placeholder="e.g., 120"
              />

            </div>


            <div className="field-row">

              <label htmlFor="diastolicBP">
                Diastolic Blood Pressure *
              </label>

              <input
                id="diastolicBP"
                name="diastolicBP"
                type="number"
                value={
                  formData.diastolicBP
                }
                onChange={handleChange}
                required
                placeholder="e.g., 80"
              />

            </div>

          </section>


          {/* ==================================================
              SLEEP & DAILY ACTIVITY
          ================================================== */}

          <section className="form-section">

            <h3>
              Sleep & Daily Activity
            </h3>


            <div className="field-row">

              <label htmlFor="sleepDuration">
                Sleep Duration *
              </label>

              <select
                id="sleepDuration"
                name="sleepDuration"
                value={
                  formData.sleepDuration
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Less than 5 hours">
                  Less than 5 hours
                </option>

                <option value="5-6 hours">
                  5-6 hours
                </option>

                <option value="6-7 hours">
                  6-7 hours
                </option>

                <option value="7-8 hours">
                  7-8 hours
                </option>

                <option value="More than 8 hours">
                  More than 8 hours
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="dailySteps">
                Daily Steps *
              </label>

              <select
                id="dailySteps"
                name="dailySteps"
                value={
                  formData.dailySteps
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Less than 3000">
                  Less than 3000
                </option>

                <option value="3000-5000">
                  3000-5000
                </option>

                <option value="5000-8000">
                  5000-8000
                </option>

                <option value="8000-10000">
                  8000-10000
                </option>

                <option value="More than 10000">
                  More than 10000
                </option>

                <option value="Not tracked">
                  Not tracked
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="sittingHours">
                Sitting Hours *
              </label>

              <select
                id="sittingHours"
                name="sittingHours"
                value={
                  formData.sittingHours
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Less than 3 hours">
                  Less than 3 hours
                </option>

                <option value="3-6 hours">
                  3-6 hours
                </option>

                <option value="6-9 hours">
                  6-9 hours
                </option>

                <option value="More than 9 hours">
                  More than 9 hours
                </option>

              </select>

            </div>

          </section>


          {/* ==================================================
              EXERCISE
          ================================================== */}

          <section className="form-section">

            <h3>
              Exercise
            </h3>


            <div className="field-row">

              <label htmlFor="exerciseDays">
                Exercise Days per Week *
              </label>

              <select
                id="exerciseDays"
                name="exerciseDays"
                value={
                  formData.exerciseDays
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="0 days">
                  0 days
                </option>

                <option value="1-2 days">
                  1-2 days
                </option>

                <option value="3-4 days">
                  3-4 days
                </option>

                <option value="5-6 days">
                  5-6 days
                </option>

                <option value="Everyday">
                  Everyday
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="workoutDuration">
                Typical Workout Duration *
              </label>

              <select
                id="workoutDuration"
                name="workoutDuration"
                value={
                  formData.workoutDuration
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="No workout">
                  No workout
                </option>

                <option value="Less than 30 mins">
                  Less than 30 mins
                </option>

                <option value="30-60 mins">
                  30-60 mins
                </option>

                <option value="1-2 hours">
                  1-2 hours
                </option>

                <option value="More than 2 hours">
                  More than 2 hours
                </option>

              </select>

            </div>


            <div className="field-row">

              <label>
                Activity Level *
              </label>

              <div className="radio-group">

                <label className="radio-item">

                  <input
                    type="radio"
                    name="activityLevel"
                    value="Low"
                    checked={
                      formData.activityLevel ===
                      "Low"
                    }
                    onChange={handleChange}
                    required
                  />

                  Low

                </label>


                <label className="radio-item">

                  <input
                    type="radio"
                    name="activityLevel"
                    value="Moderate"
                    checked={
                      formData.activityLevel ===
                      "Moderate"
                    }
                    onChange={handleChange}
                  />

                  Moderate

                </label>


                <label className="radio-item">

                  <input
                    type="radio"
                    name="activityLevel"
                    value="High"
                    checked={
                      formData.activityLevel ===
                      "High"
                    }
                    onChange={handleChange}
                  />

                  High

                </label>


                <label className="radio-item">

                  <input
                    type="radio"
                    name="activityLevel"
                    value="Very High"
                    checked={
                      formData.activityLevel ===
                      "Very High"
                    }
                    onChange={handleChange}
                  />

                  Very High

                </label>

              </div>

            </div>

          </section>


          {/* ==================================================
              NUTRITION
          ================================================== */}

          <section className="form-section">

            <h3>
              Nutrition
            </h3>


            <div className="field-row">

              <label htmlFor="waterIntake">
                Daily Water Intake *
              </label>

              <select
                id="waterIntake"
                name="waterIntake"
                value={
                  formData.waterIntake
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Less than 1 litre">
                  Less than 1 litre
                </option>

                <option value="1-2 litres">
                  1-2 litres
                </option>

                <option value="2-3 litres">
                  2-3 litres
                </option>

                <option value="3-4 litres">
                  3-4 litres
                </option>

                <option value="More than 4 litres">
                  More than 4 litres
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="mealsPerDay">
                Meals Per Day *
              </label>

              <select
                id="mealsPerDay"
                name="mealsPerDay"
                value={
                  formData.mealsPerDay
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="1">
                  1
                </option>

                <option value="2">
                  2
                </option>

                <option value="3">
                  3
                </option>

                <option value="4">
                  4
                </option>

                <option value="5 or more">
                  5 or more
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="dietPreference">
                Diet Preference *
              </label>

              <select
                id="dietPreference"
                name="dietPreference"
                value={
                  formData.dietPreference
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Vegetarian">
                  Vegetarian
                </option>

                <option value="Non-Vegetarian">
                  Non-Vegetarian
                </option>

                <option value="Vegan">
                  Vegan
                </option>

                <option value="Mixed">
                  Mixed
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="junkFoodFrequency">
                Junk Food Frequency *
              </label>

              <select
                id="junkFoodFrequency"
                name="junkFoodFrequency"
                value={
                  formData.junkFoodFrequency
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Never">
                  Never
                </option>

                <option value="1-2 times per week">
                  1-2 times per week
                </option>

                <option value="3-4 times per week">
                  3-4 times per week
                </option>

                <option value="Daily">
                  Daily
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="proteinIntake">
                Protein Intake *
              </label>

              <select
                id="proteinIntake"
                name="proteinIntake"
                value={
                  formData.proteinIntake
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Low">
                  Low
                </option>

                <option value="Moderate">
                  Moderate
                </option>

                <option value="High">
                  High
                </option>

                <option value="Not sure">
                  Not sure
                </option>

              </select>

            </div>

          </section>


          {/* ==================================================
              WELLBEING & GOALS
          ================================================== */}

          <section className="form-section">

            <h3>
              Wellbeing & Goals
            </h3>


            <div className="field-row">

              <label htmlFor="stressLevel">
                Stress Level *
              </label>

              <select
                id="stressLevel"
                name="stressLevel"
                value={
                  formData.stressLevel
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Very low">
                  Very low
                </option>

                <option value="1">
                  1
                </option>

                <option value="2">
                  2
                </option>

                <option value="3">
                  3
                </option>

                <option value="4">
                  4
                </option>

                <option value="5">
                  5
                </option>

                <option value="Very high">
                  Very high
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="energyLevel">
                Energy Level *
              </label>

              <select
                id="energyLevel"
                name="energyLevel"
                value={
                  formData.energyLevel
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Very low">
                  Very low
                </option>

                <option value="1">
                  1
                </option>

                <option value="2">
                  2
                </option>

                <option value="3">
                  3
                </option>

                <option value="4">
                  4
                </option>

                <option value="5">
                  5
                </option>

                <option value="Very High">
                  Very High
                </option>

              </select>

            </div>


            <div className="field-row">

              <label>
                Fitness Goal *
              </label>

              <div className="radio-group">

                <label className="radio-item">

                  <input
                    type="radio"
                    name="fitnessGoal"
                    value="Weight Loss"
                    checked={
                      formData.fitnessGoal ===
                      "Weight Loss"
                    }
                    onChange={handleChange}
                    required
                  />

                  Weight Loss

                </label>


                <label className="radio-item">

                  <input
                    type="radio"
                    name="fitnessGoal"
                    value="Weight Gain"
                    checked={
                      formData.fitnessGoal ===
                      "Weight Gain"
                    }
                    onChange={handleChange}
                  />

                  Weight Gain

                </label>


                <label className="radio-item">

                  <input
                    type="radio"
                    name="fitnessGoal"
                    value="Maintain Fitness"
                    checked={
                      formData.fitnessGoal ===
                      "Maintain Fitness"
                    }
                    onChange={handleChange}
                  />

                  Maintain Fitness

                </label>

              </div>

            </div>


            <div className="field-row">

              <label htmlFor="fitnessLevel">
                Fitness Level *
              </label>

              <select
                id="fitnessLevel"
                name="fitnessLevel"
                value={
                  formData.fitnessLevel
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Poor">
                  Poor
                </option>

                <option value="Average">
                  Average
                </option>

                <option value="Good">
                  Good
                </option>

                <option value="Excellent">
                  Excellent
                </option>

              </select>

            </div>


            <div className="field-row">

              <label htmlFor="routineConsistency">
                Routine Consistency *
              </label>

              <select
                id="routineConsistency"
                name="routineConsistency"
                value={
                  formData.routineConsistency
                }
                onChange={handleChange}
                required
              >

                <option value="">
                  Select
                </option>

                <option value="Not consistent">
                  Not consistent
                </option>

                <option value="1">
                  1
                </option>

                <option value="2">
                  2
                </option>

                <option value="3">
                  3
                </option>

                <option value="4">
                  4
                </option>

                <option value="5">
                  5
                </option>

                <option value="Highly consistent">
                  Highly consistent
                </option>

              </select>

            </div>

          </section>


          {/* ==================================================
              SUBMIT
          ================================================== */}

          <div className="form-actions">

            <button
              type="submit"
              className="submit-btn"
            >
              Submit Assessment
            </button>

          </div>

        </form>

      )}

    </div>

  );

};


export default InitialAssessment;