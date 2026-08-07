import React, { useState } from 'react';
import './InitialAssessment.css';
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const InitialAssessment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    sleepDuration: '',
    dailySteps: '',
    exerciseDays: '',
    workoutDuration: '',
    activityLevel: '',
    waterIntake: '',
    mealsPerDay: '',
    dietPreference: '',
    junkFoodFrequency: '',
    proteinIntake: '',
    stressLevel: '',
    energyLevel: '',
    fitnessGoal: '',
    fitnessLevel: '',
    routineConsistency: '',
    sittingHours: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        ...formData,
        assessmentCompleted: true,
        assessmentCompletedAt: new Date(),
      },
      { merge: true }
    );

    console.log("Assessment saved successfully:", formData);

    setSubmitted(true);

    // Go to dashboard after saving
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);

  } catch (error) {
    console.error("Error saving assessment:", error);
    alert("Failed to save assessment. Please try again.");
  }
};
  
  return (
    <div className="assessment-wrapper">
      <header className="assessment-header">
        <h1>Initial Fitness & Lifestyle Assessment</h1>
        <p>Help us understand your current habits so we can tailor recommendations to you.</p>
      </header>

      {submitted ? (
        <div className="success-card">
          <h2>Assessment Submitted</h2>
          <p>Thanks! Your initial assessment has been recorded. You can update this later in your profile.</p>
        </div>
      ) : (
        <form className="assessment-form" onSubmit={handleSubmit} noValidate>
          <section className="form-section">
            <h3>Personal Information</h3>
            <div className="field-row">
              <label htmlFor="age">Age *</label>
              <input
                id="age"
                name="age"
                type="number"
                min="10"
                max="120"
                value={formData.age}
                onChange={handleChange}
                required
                placeholder="e.g., 28"
              />
            </div>

            <div className="field-row">
              <label>Gender *</label>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === 'Male'}
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
                    checked={formData.gender === 'Female'}
                    onChange={handleChange}
                  />
                  Female
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="gender"
                    value="Others"
                    checked={formData.gender === 'Others'}
                    onChange={handleChange}
                  />
                  Others
                </label>
              </div>
            </div>

            <div className="field-row">
              <label htmlFor="height">Height (cm) *</label>
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
              <label htmlFor="weight">Weight (kg) *</label>
              <input
                id="weight"
                name="weight"
                type="number"
                min="20"
                max="500"
                value={formData.weight}
                onChange={handleChange}
                required
                placeholder="e.g., 70"
              />
            </div>
          </section>

          <section className="form-section">
            <h3>Sleep & Daily Activity</h3>

            <div className="field-row">
              <label htmlFor="sleepDuration">Sleep Duration *</label>
              <select
                id="sleepDuration"
                name="sleepDuration"
                value={formData.sleepDuration}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Less than 5 hours">Less than 5 hours</option>
                <option value="5-6 hours">5-6 hours</option>
                <option value="6-7 hours">6-7 hours</option>
                <option value="7-8 hours">7-8 hours</option>
                <option value="More than 8 hours">More than 8 hours</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="dailySteps">Daily Steps *</label>
              <select
                id="dailySteps"
                name="dailySteps"
                value={formData.dailySteps}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Less than 3000">Less than 3000</option>
                <option value="3000-5000">3000-5000</option>
                <option value="5000-8000">5000-8000</option>
                <option value="8000-10000">8000-10000</option>
                <option value="More than 10000">More than 10000</option>
                <option value="Not tracked">Not tracked</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="sittingHours">Sitting Hours *</label>
              <select
                id="sittingHours"
                name="sittingHours"
                value={formData.sittingHours}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Less than 3 hours">Less than 3 hours</option>
                <option value="3-6 hours">3-6 hours</option>
                <option value="6-9 hours">6-9 hours</option>
                <option value="More than 9 hours">More than 9 hours</option>
              </select>
            </div>
          </section>

          <section className="form-section">
            <h3>Exercise</h3>

            <div className="field-row">
              <label htmlFor="exerciseDays">Exercise Days per Week *</label>
              <select
                id="exerciseDays"
                name="exerciseDays"
                value={formData.exerciseDays}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="0 days">0 days</option>
                <option value="1-2 days">1-2 days</option>
                <option value="3-4 days">3-4 days</option>
                <option value="5-6 days">5-6 days</option>
                <option value="Everyday">Everyday</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="workoutDuration">Typical Workout Duration *</label>
              <select
                id="workoutDuration"
                name="workoutDuration"
                value={formData.workoutDuration}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="No workout">No workout</option>
                <option value="Less than 30 mins">Less than 30 mins</option>
                <option value="30-60 mins">30-60 mins</option>
                <option value="1-2 hours">1-2 hours</option>
                <option value="More than 2 hours">More than 2 hours</option>
              </select>
            </div>

            <div className="field-row">
              <label>Activity Level *</label>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="activityLevel"
                    value="Low"
                    checked={formData.activityLevel === 'Low'}
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
                    checked={formData.activityLevel === 'Moderate'}
                    onChange={handleChange}
                  />
                  Moderate
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="activityLevel"
                    value="High"
                    checked={formData.activityLevel === 'High'}
                    onChange={handleChange}
                  />
                  High
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="activityLevel"
                    value="Very High"
                    checked={formData.activityLevel === 'Very High'}
                    onChange={handleChange}
                  />
                  Very High
                </label>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3>Nutrition</h3>

            <div className="field-row">
              <label htmlFor="waterIntake">Daily Water Intake *</label>
              <select
                id="waterIntake"
                name="waterIntake"
                value={formData.waterIntake}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Less than 1 litre">Less than 1 litre</option>
                <option value="1-2 litres">1-2 litres</option>
                <option value="2-3 litres">2-3 litres</option>
                <option value="3-4 litres">3-4 litres</option>
                <option value="More than 4 litres">More than 4 litres</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="mealsPerDay">Meals Per Day *</label>
              <select
                id="mealsPerDay"
                name="mealsPerDay"
                value={formData.mealsPerDay}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5 or more">5 or more</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="dietPreference">Diet Preference *</label>
              <select
                id="dietPreference"
                name="dietPreference"
                value={formData.dietPreference}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="junkFoodFrequency">Junk Food Frequency *</label>
              <select
                id="junkFoodFrequency"
                name="junkFoodFrequency"
                value={formData.junkFoodFrequency}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Never">Never</option>
                <option value="1-2 times per week">1-2 times per week</option>
                <option value="3-4 times per week">3-4 times per week</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="proteinIntake">Protein Intake *</label>
              <select
                id="proteinIntake"
                name="proteinIntake"
                value={formData.proteinIntake}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
          </section>

          <section className="form-section">
            <h3>Wellbeing & Goals</h3>

            <div className="field-row">
              <label htmlFor="stressLevel">Stress Level *</label>
              <select
                id="stressLevel"
                name="stressLevel"
                value={formData.stressLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Very low">Very low</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="Very high">Very high</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="energyLevel">Energy Level *</label>
              <select
                id="energyLevel"
                name="energyLevel"
                value={formData.energyLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Very low">Very low</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="Very High">Very High</option>
              </select>
            </div>

            <div className="field-row">
              <label>Fitness Goal *</label>
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    name="fitnessGoal"
                    value="Weight Loss"
                    checked={formData.fitnessGoal === 'Weight Loss'}
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
                    checked={formData.fitnessGoal === 'Weight Gain'}
                    onChange={handleChange}
                  />
                  Weight Gain
                </label>
                <label className="radio-item">
                  <input
                    type="radio"
                    name="fitnessGoal"
                    value="Maintain Fitness"
                    checked={formData.fitnessGoal === 'Maintain Fitness'}
                    onChange={handleChange}
                  />
                  Maintain Fitness
                </label>
              </div>
            </div>

            <div className="field-row">
              <label htmlFor="fitnessLevel">Fitness Level *</label>
              <select
                id="fitnessLevel"
                name="fitnessLevel"
                value={formData.fitnessLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Poor">Poor</option>
                <option value="Average">Average</option>
                <option value="Good">Good</option>
                <option value="Excellent">Excellent</option>
              </select>
            </div>

            <div className="field-row">
              <label htmlFor="routineConsistency">Routine Consistency *</label>
              <select
                id="routineConsistency"
                name="routineConsistency"
                value={formData.routineConsistency}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Not consistent">Not consistent</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="Highly consistent">Highly consistent</option>
              </select>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="submit-btn">Submit Assessment</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InitialAssessment;