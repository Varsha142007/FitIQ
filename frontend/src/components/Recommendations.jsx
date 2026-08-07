import React from "react";

const Recommendations = ({ predictionCode }) => {
  const generalSleepTips = [
    "Keep a consistent sleep schedule.",
    "Create a relaxing bedtime routine.",
    "Limit caffeine and large meals before bedtime.",
    "Keep your bedroom cool, dark, and quiet.",
  ];

  const foodTips = [
    "Avoid heavy meals 2-3 hours before bed.",
    "Include magnesium-rich foods (leafy greens, nuts).",
    "Stay hydrated throughout the day.",
  ];

  const workoutTips = [
    "Engage in regular moderate-intensity exercise (30 mins most days).",
    "Avoid vigorous exercise close to bedtime.",
    "Try relaxing exercises (yoga, stretching) in the evening.",
  ];

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>Recommendations</h3>

      {predictionCode === 1 ? (
        <div>
          <h4 style={{ color: "#a33" }}>
            Personalized Recommendations (Detected Sleep Disorder)
          </h4>
          <p>
            Please consult a healthcare professional for diagnosis and treatment
            suggestions. Below are general lifestyle tips:
          </p>
        </div>
      ) : (
        <div>
          <h4 style={{ color: "#196619" }}>
            General Sleep Health Tips
          </h4>
          <p>
            Keep up the good habits and consider the following improvements:
          </p>
        </div>
      )}

      <h5>Sleep Recommendations</h5>
      <ul>
        {generalSleepTips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <h5>Food Recommendations</h5>
      <ul>
        {foodTips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <h5>Workout Recommendations</h5>
      <ul>
        {workoutTips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
};

export default Recommendations;