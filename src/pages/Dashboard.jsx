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
    steps: 0,
    sleepHours: 0,
    calories: 0,
    heartRate: 0,
    waterIntake: 0,
    bmi: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching dashboard stats & activity (replace with real data calls)
    const fakeStats = {
      steps: 7642,
      sleepHours: 7.3,
      calories: 542,
      heartRate: 68,
      waterIntake: 2.1,
      bmi: 23.6,
    };
    setStats(fakeStats);

    const fakeActivity = [
      { time: "Today 08:12", activity: "Morning Run", details: "3.2 km • 23 min" },
      { time: "Yesterday 19:05", activity: "Strength Training", details: "45 min • Upper Body" },
      { time: "Yesterday 07:50", activity: "Sleep", details: "7h 20m" },
      { time: "2 days ago 18:40", activity: "Yoga", details: "30 min • Flexibility" },
    ];
    setRecentActivity(fakeActivity);
  }, []);

  useEffect(() => {
    // Listen for auth state changes and fetch user profile from Firestore
    setLoadingProfile(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No user signed in — redirect to login
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
            fullName: data.fullName ?? user.displayName ?? "",
            fitnessGoal: data.fitnessGoal ?? "",
            age: data.age ?? "",
            height: data.height ?? "",
            weight: data.weight ?? "",
            email: data.email ?? user.email ?? "",
          });
        } else {
          // Document doesn't exist; use basic info from auth user where possible
          setUserData({
            fullName: user.displayName ?? "",
            fitnessGoal: "",
            age: "",
            height: "",
            weight: "",
            email: user.email ?? "",
          });
        }
      } catch (err) {
        console.error("Error fetching user document:", err);
        // Fallback to auth displayName/email if Firestore read fails
        setUserData({
          fullName: user.displayName ?? "",
          fitnessGoal: "",
          age: "",
          height: "",
          weight: "",
          email: user.email ?? "",
        });
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  // Updated logout to call authService.logoutUser, navigate, and alert on success/failure
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
    { id: "steps", title: "Steps", value: stats.steps.toLocaleString(), unit: "" },
    { id: "sleep", title: "Sleep Hours", value: stats.sleepHours, unit: "hrs" },
    { id: "calories", title: "Calories Burned", value: stats.calories, unit: "kcal" },
    { id: "heart", title: "Heart Rate", value: stats.heartRate, unit: "bpm" },
    { id: "water", title: "Water Intake", value: stats.waterIntake, unit: "L" },
    { id: "bmi", title: "BMI", value: stats.bmi, unit: "" },
  ];

  return (
    <div className="dashboard-root">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Sidebar navigation">
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
            <li className="nav-item active">
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </li>
            <li className="nav-item">
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </li>
            <li className="nav-item">
              <span className="nav-icon">📜</span>
              <span className="nav-text">History</span>
            </li>
            <li className="nav-item">
              <span className="nav-icon">🤖</span>
              <span className="nav-text">Recommendations</span>
            </li>

            {/* Logout button in sidebar */}
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

      <div className="main">
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
              {loadingProfile ? "Loading..." : userData?.fullName ? `Hi, ${userData.fullName}` : "Hi"}
            </div>
          </div>
        </header>

        <main className="content">
          <section className="welcome-card card">
            <div className="welcome-left">
              <h1>
                {loadingProfile ? "Welcome back" : `Welcome back, ${userData?.fullName ?? "Athlete"} 👋`}
              </h1>
              <p>Here's your summary for today. Keep up the great work!</p>

              {!loadingProfile && userData && (
                <div className="profile-overview" style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "var(--muted)" }}>
                    <div><strong>Goal:</strong> {userData.fitnessGoal || "—"}</div>
                    <div><strong>Age:</strong> {userData.age ?? "—"}</div>
                    <div><strong>Height:</strong> {userData.height ? `${userData.height} cm` : "—"}</div>
                    <div><strong>Weight:</strong> {userData.weight ? `${userData.weight} kg` : "—"}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="welcome-cta">
              <button className="btn primary">Start Workout</button>
            </div>
          </section>

          <section className="stats-grid">
            {statCards.map((s) => (
              <article key={s.id} className="stat-card card">
                <div className="stat-header">
                  <h3>{s.title}</h3>
                </div>
                <div className="stat-value">
                  <span className="value">{s.value}</span>
                  {s.unit && <span className="unit">{s.unit}</span>}
                </div>
                <div className="stat-footer">Today</div>
              </article>
            ))}
          </section>

          <section className="lower-grid">
            <div className="chart-card card">
              <div className="card-title">
                <h3>Weekly Progress</h3>
                <span className="muted">Steps & Activity</span>
              </div>
              <div className="chart-placeholder" role="img" aria-label="Weekly progress chart placeholder">
                <div className="chart-mock">[Weekly Progress Chart]</div>
              </div>
            </div>

            <div className="ai-card card">
              <div className="card-title">
                <h3>AI Recommendation</h3>
                <span className="muted">Personalized suggestion</span>
              </div>
              <div className="ai-content">
                <p>
                  Based on your recent activity, try a light cardio session tomorrow morning and increase
                  daily water intake by 500ml. Consider a protein-rich snack post-workout to support muscle recovery.
                </p>
                <div className="ai-actions">
                  <button className="btn">Save Recommendation</button>
                  <button className="btn subtle">Explore Plan</button>
                </div>
              </div>
            </div>

            <div className="activity-card card full-width">
              <div className="card-title">
                <h3>Recent Activity</h3>
                <span className="muted">Latest workouts & events</span>
              </div>
              <div className="table-wrap">
                <table className="activity-table" aria-label="Recent activity table">
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
                        <td colSpan="4" className="muted">No recent activity</td>
                      </tr>
                    ) : (
                      recentActivity.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.time}</td>
                          <td>{r.activity}</td>
                          <td>{r.details}</td>
                          <td>
                            <button className="btn tiny">View</button>
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

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
    </div>
  );
}