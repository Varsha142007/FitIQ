import React, { useState } from "react";


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


  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);



  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setPrediction("");

    const data = {
      Gender: formData.Gender,
      Age: Number(formData.Age),
      Occupation: formData.Occupation,
      "Sleep Duration": Number(formData["Sleep Duration"]),
      "Quality of Sleep": Number(formData["Quality of Sleep"]),
      "Physical Activity Level": Number(formData["Physical Activity Level"]),
      "Stress Level": Number(formData["Stress Level"]),
      "BMI Category": formData["BMI Category"],
      "Heart Rate": Number(formData["Heart Rate"]),
      "Daily Steps": Number(formData["Daily Steps"]),
      Systolic_BP: Number(formData.Systolic_BP),
      Diastolic_BP: Number(formData.Diastolic_BP)
    };


    console.log("Sending data:", data);



    try {

      const response = await fetch(
        "http://127.0.0.1:5000/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );


      const result = await response.json();

      console.log("Backend response:", result);


      if(response.ok){
        setPrediction(result.message);
      }
      else{
        setPrediction(
          "Error: " + result.details
        );
      }


    } catch(error){

      console.error("Error:", error);
      setPrediction("Cannot connect to backend");

    }


    setLoading(false);

  };




  return (

    <div className="prediction-container">


      <h1>
        Sleep Disorder Prediction
      </h1>



      <form onSubmit={handleSubmit}>


        <select
          name="Gender"
          value={formData.Gender}
          onChange={handleChange}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>



        <input
          type="number"
          name="Age"
          placeholder="Age"
          value={formData.Age}
          onChange={handleChange}
        />



        <input
          name="Occupation"
          placeholder="Occupation"
          value={formData.Occupation}
          onChange={handleChange}
        />



        <input
          type="number"
          step="0.1"
          name="Sleep Duration"
          placeholder="Sleep Duration"
          value={formData["Sleep Duration"]}
          onChange={handleChange}
        />



        <input
          type="number"
          name="Quality of Sleep"
          placeholder="Quality of Sleep"
          value={formData["Quality of Sleep"]}
          onChange={handleChange}
        />



        <input
          type="number"
          name="Physical Activity Level"
          placeholder="Physical Activity Level"
          value={formData["Physical Activity Level"]}
          onChange={handleChange}
        />



        <input
          type="number"
          name="Stress Level"
          placeholder="Stress Level"
          value={formData["Stress Level"]}
          onChange={handleChange}
        />



        <select
          name="BMI Category"
          value={formData["BMI Category"]}
          onChange={handleChange}
        >

          <option value="">
            Select BMI Category
          </option>

          <option value="Normal">
            Normal
          </option>

          <option value="Overweight">
            Overweight
          </option>

          <option value="Obese">
            Obese
          </option>

        </select>



        <input
          type="number"
          name="Heart Rate"
          placeholder="Heart Rate"
          value={formData["Heart Rate"]}
          onChange={handleChange}
        />



        <input
          type="number"
          name="Daily Steps"
          placeholder="Daily Steps"
          value={formData["Daily Steps"]}
          onChange={handleChange}
        />



        <input
          type="number"
          name="Systolic_BP"
          placeholder="Systolic BP"
          value={formData.Systolic_BP}
          onChange={handleChange}
        />



        <input
          type="number"
          name="Diastolic_BP"
          placeholder="Diastolic BP"
          value={formData.Diastolic_BP}
          onChange={handleChange}
        />



        <button type="submit">
          {
            loading 
            ? "Predicting..."
            : "Predict"
          }
        </button>


      </form>



      {
        prediction &&

        <div className="result-box">

          <h2>
            Result
          </h2>

          <p>
            {prediction}
          </p>

        </div>

      }



    </div>

  );
}