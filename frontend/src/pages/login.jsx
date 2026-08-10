import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { loginUser, resetPassword } from "../services/authService";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function validate() {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email.";

    if (!form.password) newErrors.password = "Password is required.";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters.";

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }

  async function waitForAuthState() {
    // Wrap onAuthStateChanged to return a Promise that resolves with the user (or null)
    return new Promise((resolve, reject) => {
      try {
        const unsubscribe = onAuthStateChanged(
          auth,
          (u) => {
            unsubscribe();
            resolve(u);
          },
          (err) => {
            unsubscribe();
            reject(err);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    validate();

    if (!isValid) {
      setIsSubmitting(true);
      setTimeout(() => setIsSubmitting(false), 700);
      return;
    }

    setIsSubmitting(true);

    try {
      // Login with Firebase Authentication (your existing authService)
      await loginUser(form.email.trim(), form.password);

      // Wait for Firebase to provide the authenticated user reliably
      const user = await waitForAuthState();

      if (!user) {
        throw new Error("User login failed. Please try again.");
      }

      // Get user's document from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Decision logic per your requirements:
      // If no Firestore document -> initial assessment
      // If document exists and assessmentCompleted === true -> dashboard
      // Otherwise -> initial assessment
      if (!userSnap.exists()) {
        navigate("/initial-assessment");
      } else {
        const userData = userSnap.data();
        if (userData?.assessmentCompleted === true) {
          navigate("/dashboard");
        } else {
          navigate("/initial-assessment");
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert(error?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // New: handle forgot password using resetPassword from authService
  async function handleForgotPassword() {
    const email = form.email.trim();
    if (!email) {
      alert("Please enter your registered email.");
      return;
    }

    try {
      await resetPassword(email);
      alert("Password reset email sent successfully. Check your inbox.");
    } catch (error) {
      console.error("Password reset failed:", error);
      alert(error?.message || "Failed to send password reset email. Please try again.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card" role="region" aria-labelledby="login-heading">
        <div className="login-side">
          <h2 id="login-heading" className="login-title">Welcome back</h2>
          <p className="login-sub">Login to continue to your fitness dashboard.</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
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
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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

            <div className="form-row">
              <label className="remember">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={handleChange}
                />
                Remember me
              </label>

              {/* Replaced link with a button that looks identical to the original link */}
              <button
                type="button"
                className="forgot"
                onClick={handleForgotPassword}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  color: undefined,
                  cursor: "pointer",
                }}
              >
                Forgot Password?
              </button>
            </div>

            <div className="actions">
              <button type="submit" className="btn primary" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <div className="signup-redirect">
            Don't have an account? <a href="/register">Register</a>
          </div>
        </div>

        <aside className="login-visual" aria-hidden="true">
          <div className="visual-content">
            <h3>Track progress. Stay motivated.</h3>
            <p>Personalized plans, progress tracking, and insightful analytics to help you meet your fitness goals.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}