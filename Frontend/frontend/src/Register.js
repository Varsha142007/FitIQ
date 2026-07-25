// Register.jsx
import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function Register() {
  const [formData, setFormData] = useState({
    name: "", age: "", gender: "", goal: "", email: "", password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const { name, age, gender, goal, email, password } = formData;
    if (!name || !age || !gender || !goal || !email || !password)
      return "All fields are required.";
    if (isNaN(age) || Number(age) < 10 || Number(age) > 100)
      return "Enter a valid age between 10 and 100.";
    if (password.length < 6)
      return "Password must be at least 6 characters.";
    return null; // no error
  };

  const register = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { name, age, gender, goal, email, password } = formData;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        age: Number(age),       // store as number, not string
        gender,
        goal,
        email,
        role: "user",           // useful later for admin dashboard
        createdAt: serverTimestamp(),
      });

      alert("Account created successfully!");
      // TODO: replace alert with navigation once you set up React Router
      // navigate("/dashboard");

    } catch (err) {
      // Firebase error codes are clearer than raw messages
      if (err.code === "auth/email-already-in-use")
        setError("This email is already registered. Try logging in.");
      else if (err.code === "auth/invalid-email")
        setError("Please enter a valid email address.");
      else
        setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name",     placeholder: "Full Name",      type: "text"     },
    { name: "age",      placeholder: "Age",            type: "number"   },
    { name: "gender",   placeholder: "Gender",         type: "text"     },
    { name: "goal",     placeholder: "Fitness Goal",   type: "text"     },
    { name: "email",    placeholder: "Email",          type: "email"    },
    { name: "password", placeholder: "Password (min 6 chars)", type: "password" },
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>Create Account</h2>

      {error && (
        <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>
      )}

      {fields.map((field) => (
        <div key={field.name} style={{ marginBottom: "12px" }}>
          <input
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
      ))}

      <button onClick={register} disabled={loading} style={{ padding: "10px 20px" }}>
        {loading ? "Creating account..." : "Register"}
      </button>
    </div>
  );
}

export default Register;