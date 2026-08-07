
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { logoutUser } from "../services/authService";

export default function Dashboard({ userName: propName, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({
    steps: "—",
    sleepHours: "—",
    calories: "—",
    heartRate: "—",
    waterIntake: "—",
    bmi: "—",
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const navigate = useNavigate();

  // Fetch logged-in user's profile + assessment data
  useEffect(() => {
    setLoadingProfile(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserData(null);
        setLoadingProfile(false);
        navigate("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          setUserData({
            ...data,
            fullName: data.fullName ?? user.displayName ?? "",
            email: data.email ?? user.email ?? "",
          });
        } else {
          setUserData({
            fullName: user.displayName ?? "",
            email: user.email ?? "",
          });
        }
      } catch (err) {
        console.error("Error fetching user document:", err);

        setUserData({
          fullName: user.displayName ?? "",
          email: user.email ?? "",
        });
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Convert assessment data into dashboard statistics
  useEffect(() => {
    if (!userData) return;

    // BMI calculation
    let bmi = "—";

    const height = Number(userData.height);
    const weight = Number(userData.weight);

    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    setStats({
      steps: userData.dailySteps || "—",
      sleepHours: userData.sleepDuration || "—",
      calories: "—",
      heartRate: "—",
      waterIntake: userData.waterIntake || "—",
      bmi,
    });

    // Assessment contains lifestyle information,
    // but not actual workout history.
    setRecentActivity([]);
  }, [userData]);

  // Logout
  async function handleLogout() {
    try {
      await logoutUser();
      alert("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert(err?.message || "Logout failed. Please try again.");
    }
  }

  const statCards = [
    {
      id: "steps",
      title: "Daily Steps",
      value: stats.steps,
      unit: "",
    },
    {
      id: "sleep",
      title: "Sleep Duration",
      value: stats.sleepHours,
      unit: "",
    },
    {
      id: "calories",
      title: "Calories Burned",
      value: stats.calories,
      unit: "",
    },
    {
      id: "heart",
      title: "Heart Rate",
      value: stats.heartRate,
      unit: "",
    },
    {
      id: "water",
      title: "Water Intake",
      value: stats.waterIntake,
      unit: "",
    },
    {
      id: "bmi",
      title: "BMI",
      value: stats.bmi,
      unit: "",
    },
  ];

  return (
    <div className="dashboard-root">

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Sidebar navigation"
      >
        <div className="sidebar-top">
          <div className="brand">
            <div className="logo">FitIQ</div>

            <button
              className="close-btn"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </button>
          </div>
        </div>

        <nav className="nav">
          <ul>

            <li
              className="nav-item"
              onClick={() => navigate("/predict")}
            >
              <span className="nav-icon">🩺</span>
              <span className="nav-text">Sleep Prediction</span>
            </li>

            <li className="nav-item">
              <span className="nav-icon">📜</span>
              <span className="nav-text">History</span>
            </li>

            <li className="nav-item">
              <span className="nav-icon">🤖</span>
              <span className="nav-text">Recommendations</span>
            </li>

            <li
              className="nav-item logout"
              onClick={handleLogout}
              role="button"
              tabIndex={0}
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-text">Logout</span>
            </li>

          </ul>
        </nav>
      </aside>

      {/* Main */}
      <div className="main">

        {/* Topbar */}
        <header className="topbar">
          <button
            className="menu-btn"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="topbar-right">
            <div className="user-greeting">
              {loadingProfile
                ? "Loading..."
                : userData?.fullName
                ? `Hi, ${userData.fullName}`
                : "Hi"}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content">

          {/* Welcome */}
          <section className="welcome-card card">

            <div className="welcome-left">

              <h1>
                {loadingProfile
                  ? "Welcome back"
                  : `Welcome back, ${userData?.fullName ?? "Athlete"} 👋`}
              </h1>

              <p>
                Here's your fitness and lifestyle summary.
              </p>

              {!loadingProfile && userData && (
                <div className="profile-overview">

                  <div className="profile-grid">

                    <div>
                      <strong>Goal:</strong>
                      <span>{userData.fitnessGoal || "—"}</span>
                    </div>

                    <div>
                      <strong>Age:</strong>
                      <span>{userData.age || "—"}</span>
                    </div>

                    <div>
                      <strong>Gender:</strong>
                      <span>{userData.gender || "—"}</span>
                    </div>

                    <div>
                      <strong>Height:</strong>
                      <span>
                        {userData.height
                          ? `${userData.height} cm`
                          : "—"}
                      </span>
                    </div>

                    <div>
                      <strong>Weight:</strong>
                      <span>
                        {userData.weight
                          ? `${userData.weight} kg`
                          : "—"}
                      </span>
                    </div>

                    <div>
                      <strong>Activity:</strong>
                      <span>{userData.activityLevel || "—"}</span>
                    </div>

                    <div>
                      <strong>Exercise:</strong>
                      <span>{userData.exerciseDays || "—"}</span>
                    </div>

                    <div>
                      <strong>Workout:</strong>
                      <span>{userData.workoutDuration || "—"}</span>
                    </div>

                    <div>
                      <strong>Sleep:</strong>
                      <span>{userData.sleepDuration || "—"}</span>
                    </div>

                    <div>
                      <strong>Daily Steps:</strong>
                      <span>{userData.dailySteps || "—"}</span>
                    </div>

                    <div>
                      <strong>Water:</strong>
                      <span>{userData.waterIntake || "—"}</span>
                    </div>

                    <div>
                      <strong>Diet:</strong>
                      <span>{userData.dietPreference || "—"}</span>
                    </div>

                    <div>
                      <strong>Fitness Level:</strong>
                      <span>{userData.fitnessLevel || "—"}</span>
                    </div>

                    <div>
                      <strong>Stress:</strong>
                      <span>{userData.stressLevel || "—"}</span>
                    </div>

                    <div>
                      <strong>Energy:</strong>
                      <span>{userData.energyLevel || "—"}</span>
                    </div>

                    <div>
                      <strong>Sitting:</strong>
                      <span>{userData.sittingHours || "—"}</span>
                    </div>

                  </div>

                </div>
              )}

            </div>

            <div className="welcome-cta">
              <button className="btn primary">
                Start Workout
              </button>
            </div>

          </section>

          {/* Statistics */}
          <section className="stats-grid">

            {statCards.map((s) => (
              <article
                key={s.id}
                className="stat-card card"
              >

                <div className="stat-header">
                  <h3>{s.title}</h3>
                </div>

                <div className="stat-value">
                  <span className="value">
                    {s.value}
                  </span>

                  {s.unit && (
                    <span className="unit">
                      {s.unit}
                    </span>
                  )}
                </div>

                <div className="stat-footer">
                  Based on available data
                </div>

              </article>
            ))}

          </section>

          {/* Lower Grid */}
          <section className="lower-grid">

            {/* Weekly Progress */}
            <div className="chart-card card">

              <div className="card-title">
                <h3>Weekly Progress</h3>
                <span className="muted">
                  Steps & Activity
                </span>
              </div>

              <div
                className="chart-placeholder"
                role="img"
                aria-label="Weekly progress chart placeholder"
              >
                <div className="chart-mock">
                  Weekly progress will appear here
                </div>
              </div>

            </div>

            {/* AI Recommendation */}
            <div className="ai-card card">

              <div className="card-title">
                <h3>AI Recommendation</h3>
                <span className="muted">
                  Personalized suggestion
                </span>
              </div>

              <div className="ai-content">

                <p>
                  AI recommendations will be generated
                  based on your fitness assessment and
                  prediction history.
                </p>

                <div className="ai-actions">

                  <button className="btn">
                    Save Recommendation
                  </button>

                  <button className="btn subtle">
                    Explore Plan
                  </button>

                </div>

              </div>

            </div>

            {/* Recent Activity */}
            <div className="activity-card card full-width">

              <div className="card-title">
                <h3>Recent Activity</h3>

                <span className="muted">
                  Latest workouts & events
                </span>
              </div>

              <div className="table-wrap">

                <table
                  className="activity-table"
                  aria-label="Recent activity table"
                >

                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Activity</th>
                      <th>Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {recentActivity.length === 0 ? (

                      <tr>
                        <td
                          colSpan="4"
                          className="muted"
                        >
                          No activity recorded yet
                        </td>
                      </tr>

                    ) : (

                      recentActivity.map((r, idx) => (
                        <tr key={idx}>

                          <td>{r.time}</td>
                          <td>{r.activity}</td>
                          <td>{r.details}</td>

                          <td>
                            <button className="btn tiny">
                              View
                            </button>
                          </td>

                        </tr>
                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>

        </main>

      </div>

      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

    </div>
  );
}

