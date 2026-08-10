
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    fitnessGoal: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          navigate("/login");
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setUserData(data);

          setFormData({
            fullName: data.fullName || "",
            email: data.email || currentUser.email || "",
            age: data.age || "",
            gender: data.gender || "",
            height: data.height || "",
            weight: data.weight || "",
            fitnessGoal: data.fitnessGoal || "",
          });
        } else {
          setError("Profile data not found.");
        }
      } catch (err) {
        console.error("Profile loading error:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        navigate("/login");
        return;
      }

      setSaving(true);
      setMessage("");
      setError("");

      const userRef = doc(db, "users", currentUser.uid);

      await updateDoc(userRef, {
        fullName: formData.fullName,
        age: formData.age,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        fitnessGoal: formData.fitnessGoal,
      });

      setUserData((prev) => ({
        ...prev,
        ...formData,
      }));

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to logout.");
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">

      <aside className="profile-sidebar">
        <div className="sidebar-header">
          <h2>FitIQ</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            Dashboard
          </Link>

          <Link to="/history" className="nav-item">
            History
          </Link>

          <Link to="/recommendations" className="nav-item">
            Recommendations
          </Link>

          <Link to="/profile" className="nav-item active">
            Profile
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="profile-main">

        <header className="profile-header">
          <div>
            <h1>My Profile</h1>
            <p>View and update your personal information.</p>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </header>

        {message && (
          <div className="profile-success">
            {message}
          </div>
        )}

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        <section className="profile-card">

          <div className="profile-avatar">
            {formData.fullName
              ? formData.fullName.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="profile-info">
            <h2>{formData.fullName || "User"}</h2>
            <p>{formData.email}</p>
          </div>

        </section>

        <section className="profile-form-card">

          <h2>Personal Information</h2>

          <div className="profile-form-grid">

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
              />
              <small>Email cannot be changed here.</small>
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age"
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="Enter height"
              />
            </div>

            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Enter weight"
              />
            </div>

            <div className="form-group full-width">
              <label>Fitness Goal</label>
              <select
                name="fitnessGoal"
                value={formData.fitnessGoal}
                onChange={handleChange}
              >
                <option value="">Select fitness goal</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Weight Gain">Weight Gain</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Improve Fitness">Improve Fitness</option>
                <option value="Maintain Fitness">Maintain Fitness</option>
              </select>
            </div>

          </div>

          <div className="profile-actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </section>

        <section className="profile-summary-card">

          <h2>Account Summary</h2>

          <div className="summary-grid">

            <div>
              <span>Account</span>
              <strong>Active</strong>
            </div>

            <div>
              <span>Fitness Goal</span>
              <strong>{formData.fitnessGoal || "Not set"}</strong>
            </div>

            <div>
              <span>Height</span>
              <strong>
                {formData.height ? `${formData.height} cm` : "Not set"}
              </strong>
            </div>

            <div>
              <span>Weight</span>
              <strong>
                {formData.weight ? `${formData.weight} kg` : "Not set"}
              </strong>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
};

export default Profile;

