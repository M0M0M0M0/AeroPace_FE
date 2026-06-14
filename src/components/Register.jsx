import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  UserPlus,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import "./Login.css";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // validate password
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Confirm password does not match!" });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/register`, {
        username: fullName,
        email,
        password,
      });

      setMessage({
        type: "success",
        text: "Registration successful! Redirecting...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {

      setMessage({
        type: "error",
        text: error.response?.data?.message || "Registration failed!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Create New Account</h2>
          <p>Join AEROPACE today</p>
        </div>

        {message.text && (
          <div className={`modern-alert alert-${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={5}
              maxLength={50}
            />
          </div>

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              minLength={5}
              maxLength={100}
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            <UserPlus size={20} />
            <span>{isLoading ? "Processing..." : "Sign Up"}</span>
          </button>
        </form>

        <div className="login-footer">
          <p>
            Already have an account? <Link to="/login">Log in now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
