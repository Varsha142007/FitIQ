
import React, { useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

export default function SleepPrediction() {

  const [formData, setFormData] = useState({
    Gender: "",
    Age: "",
    Occupation: "",
    "Sleep Duration": "",
    "Quality of Sleep": "",
    "Physical Activity Level": "",
    "Stress Level": "",
    "BMI Category": "",
    "Heart Rate": "",
    "Daily Steps": "",
    Systolic_BP: "",
    Diastolic_BP: ""
  });

  const [prediction, setPrediction] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  // =====================================================
  // Handle Input Changes
  // =====================================================

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };


  // =====================================================
  // Validate Form
  // =====================================================

  const validateForm = () => {

    for (const [key, value] of Object.entries(formData)) {

      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {

        return `Please enter/select ${key}.`;

      }

    }

    return null;
  };


  // =====================================================
  // Submit Prediction
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setPrediction(null);
    setError("");


    // ---------------------------------------------------
    // Validation
    // ---------------------------------------------------

    const validationError = validateForm();

    if (validationError) {

      setError(validationError);

      return;

    }


    setLoading(true);


    // ---------------------------------------------------
    // Prepare data
    // ---------------------------------------------------

    const data = {

      Gender: formData.Gender,

      Age: Number(formData.Age),

      Occupation: formData.Occupation,

      "Sleep Duration":
        Number(formData["Sleep Duration"]),

      "Quality of Sleep":
        Number(formData["Quality of Sleep"]),

      "Physical Activity Level":
        Number(formData["Physical Activity Level"]),

      "Stress Level":
        Number(formData["Stress Level"]),

      "BMI Category":
        formData["BMI Category"],

      "Heart Rate":
        Number(formData["Heart Rate"]),

      "Daily Steps":
        Number(formData["Daily Steps"]),

      Systolic_BP:
        Number(formData.Systolic_BP),

      Diastolic_BP:
        Number(formData.Diastolic_BP)

    };


    console.log(
      "Sending prediction data:",
      data
    );


    try {

      // =================================================
      // Call Flask API
      // =================================================

      const response = await fetch(
        "http://127.0.0.1:5000/predict",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(data)
        }
      );


      const result =
        await response.json();


      console.log(
        "Backend response:",
        result
      );


      // =================================================
      // Handle Backend Error
      // =================================================

      if (!response.ok) {

        setError(
          result.error ||
          result.details ||
          "Prediction failed."
        );

        return;

      }


      // =================================================
      // Display Prediction
      // =================================================

      setPrediction({

        disorder:
          result.disorder,

        message:
          result.message,

        probabilities:
          result.probabilities || {}

      });


      // =================================================
      // Save Prediction to Firebase
      // =================================================

      const user =
        auth.currentUser;


      if (user) {

        try {

          await addDoc(

            collection(
              db,
              "users",
              user.uid,
              "predictions"
            ),

            {

              inputData: data,

              prediction:
                result.disorder,

              message:
                result.message,

              probabilities:
                result.probabilities || {},

              createdAt:
                serverTimestamp()

            }

          );


          console.log(
            "Prediction saved to Firebase."
          );

        } catch (firebaseError) {

          console.error(
            "Firebase save error:",
            firebaseError
          );

          setError(
            "Prediction completed, but the result could not be saved to history."
          );

        }

      } else {

        console.log(
          "User not logged in. Prediction was not saved."
        );

      }


    } catch (error) {

      console.error(
        "Backend connection error:",
        error
      );

      setError(
        "Cannot connect to the FitIQ prediction server. Make sure Flask is running."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="prediction-container">

      <h1>
        Sleep Disorder Prediction
      </h1>


      <form onSubmit={handleSubmit}>

        {/* Gender */}

        <select
          name="Gender"
          value={formData.Gender}
          onChange={handleChange}
        >

          <option value="">
            Select Gender
          </option>

          <option value="Male">
            Male
          </option>

          <option value="Female">
            Female
          </option>

        </select>


        {/* Age */}

        <input
          type="number"
          name="Age"
          placeholder="Age"
          value={formData.Age}
          onChange={handleChange}
        />


        {/* Occupation */}

    
<select
  name="Occupation"
  value={formData.Occupation}
  onChange={handleChange}
>
  <option value="">
    Select Occupation
  </option>

  <option value="Accountant">
    Accountant
  </option>

  <option value="Doctor">
    Doctor
  </option>

  <option value="Engineer">
    Engineer
  </option>

  <option value="Lawyer">
    Lawyer
  </option>

  <option value="Manager">
    Manager
  </option>

  <option value="Nurse">
    Nurse
  </option>

  <option value="Sales Representative">
    Sales Representative
  </option>

  <option value="Salesperson">
    Salesperson
  </option>

  <option value="Scientist">
    Scientist
  </option>

  <option value="Software Engineer">
    Software Engineer
  </option>

  <option value="Teacher">
    Teacher
  </option>
</select>



        {/* Sleep Duration */}

        <input
          type="number"
          step="0.1"
          name="Sleep Duration"
          placeholder="Sleep Duration"
          value={
            formData["Sleep Duration"]
          }
          onChange={handleChange}
        />


        {/* Quality of Sleep */}

        <input
          type="number"
          name="Quality of Sleep"
          placeholder="Quality of Sleep"
          value={
            formData["Quality of Sleep"]
          }
          onChange={handleChange}
        />


        {/* Physical Activity */}

        <input
          type="number"
          name="Physical Activity Level"
          placeholder="Physical Activity Level"
          value={
            formData[
              "Physical Activity Level"
            ]
          }
          onChange={handleChange}
        />


        {/* Stress */}

        <input
          type="number"
          name="Stress Level"
          placeholder="Stress Level"
          value={
            formData["Stress Level"]
          }
          onChange={handleChange}
        />


        {/* BMI */}

        <select
          name="BMI Category"
          value={
            formData["BMI Category"]
          }
          onChange={handleChange}
        >

          <option value="">
            Select BMI Category
          </option>

          <option value="Normal">
            Normal
          </option>

          <option value="Normal Weight">
            Normal Weight
          </option>

          <option value="Overweight">
            Overweight
          </option>

          <option value="Obese">
            Obese
          </option>

        </select>


        {/* Heart Rate */}

        <input
          type="number"
          name="Heart Rate"
          placeholder="Heart Rate"
          value={
            formData["Heart Rate"]
          }
          onChange={handleChange}
        />


        {/* Daily Steps */}

        <input
          type="number"
          name="Daily Steps"
          placeholder="Daily Steps"
          value={
            formData["Daily Steps"]
          }
          onChange={handleChange}
        />


        {/* Systolic BP */}

        <input
          type="number"
          name="Systolic_BP"
          placeholder="Systolic BP"
          value={
            formData.Systolic_BP
          }
          onChange={handleChange}
        />


        {/* Diastolic BP */}

        <input
          type="number"
          name="Diastolic_BP"
          placeholder="Diastolic BP"
          value={
            formData.Diastolic_BP
          }
          onChange={handleChange}
        />


        {/* Predict Button */}

        <button
          type="submit"
          disabled={loading}
        >

          {loading
            ? "Predicting..."
            : "Predict"}

        </button>

      </form>


      {/* =================================================
          Error
      ================================================= */}

      {error && (

        <div className="error-box">

          <p>
            {error}
          </p>

        </div>

      )}


      {/* =================================================
          Prediction Result
      ================================================= */}

      {prediction && (

        <div className="result-box">

          <h2>
            Prediction Result
          </h2>


          <h3>
            {prediction.disorder}
          </h3>


          <p>
            {prediction.message}
          </p>


          {/* Probabilities */}

          {Object.keys(
            prediction.probabilities
          ).length > 0 && (

            <div>

              <h4>
                Prediction Confidence
              </h4>


              {Object.entries(
                prediction.probabilities
              ).map(
                ([name, probability]) => (

                  <p key={name}>

                    {name}:{" "}

                    {(
                      probability * 100
                    ).toFixed(1)}
                    %

                  </p>

                )
              )}

            </div>

          )}

        </div>

      )}

    </div>

  );
}

