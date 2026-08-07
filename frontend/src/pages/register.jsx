import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { registerUser } from "../services/authService";

export default function Register() {
  // Individual state for every field
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  function validateFields() {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email.";

    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password) newErrors.confirmPassword = "Passwords do not match.";

    if (!age) newErrors.age = "Age is required.";
    else if (!/^\d+$/.test(String(age)) || Number(age) <= 0) newErrors.age = "Enter a valid age.";

    if (!gender) newErrors.gender = "Please select your gender.";

    if (!height) newErrors.height = "Height is required.";
    else if (isNaN(Number(height)) || Number(height) <= 0) newErrors.height = "Enter a valid height.";

    if (!weight) newErrors.weight = "Weight is required.";
    else if (isNaN(Number(weight)) || Number(weight) <= 0) newErrors.weight = "Enter a valid weight.";

    if (!fitnessGoal) newErrors.fitnessGoal = "Please select your fitness goal.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);

    const userData = {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      fitnessGoal,
    };

    try {
      await registerUser(userData);
      alert("Registration Successful");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card" role="region" aria-labelledby="register-heading">
        <h2 id="register-heading" className="brand-title">Create your account</h2>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <div className="grid">
            <div className="field">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {errors.fullName && <div id="fullName-error" className="error">{errors.fullName}</div>}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && <div id="email-error" className="error">{errors.email}</div>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  className="show-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <div id="password-error" className="error">{errors.password}</div>}
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && <div id="confirmPassword-error" className="error">{errors.confirmPassword}</div>}
            </div>

            <div className="field">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 28"
                min="1"
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "age-error" : undefined}
              />
              {errors.age && <div id="age-error" className="error">{errors.age}</div>}
            </div>

            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                aria-invalid={!!errors.gender}
                aria-describedby={errors.gender ? "gender-error" : undefined}
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not">Prefer not to say</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <div id="gender-error" className="error">{errors.gender}</div>}
            </div>

            <div className="field">
              <label htmlFor="height">Height (cm)</label>
              <input
                id="height"
                name="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 170"
                min="0"
                aria-invalid={!!errors.height}
                aria-describedby={errors.height ? "height-error" : undefined}
              />
              {errors.height && <div id="height-error" className="error">{errors.height}</div>}
            </div>

            <div className="field">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight"
                name="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 65"
                min="0"
                aria-invalid={!!errors.weight}
                aria-describedby={errors.weight ? "weight-error" : undefined}
              />
              {errors.weight && <div id="weight-error" className="error">{errors.weight}</div>}
            </div>

            <div className="field full-width">
              <label htmlFor="fitnessGoal">Fitness Goal</label>
              <select
                id="fitnessGoal"
                name="fitnessGoal"
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                aria-invalid={!!errors.fitnessGoal}
                aria-describedby={errors.fitnessGoal ? "fitnessGoal-error" : undefined}
              >
                <option value="">Select a goal</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="muscle-gain">Muscle Gain</option>
                <option value="maintain">Maintain Fitness</option>
              </select>
              {errors.fitnessGoal && <div id="fitnessGoal-error" className="error">{errors.fitnessGoal}</div>}
            </div>
          </div>

          <div className="actions">
            <button
              type="submit"
              className="btn primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
            <div className="login-redirect">
              Already have an account? <a href="/login">Login</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}