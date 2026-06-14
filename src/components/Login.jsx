import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, LogIn, X, ShieldX, CheckCircle, AlertCircle, } from "lucide-react";
import axios from "axios";
import "./Login.css";

const LockedAccountModal = ({ onClose }) => (
  <div className="login-modal-overlay" onClick={onClose}>
    <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
      <button className="login-modal-close" onClick={onClose}>
        <X size={20} />
      </button>
      <div className="login-modal-icon">
        <ShieldX size={40} color="#e53e3e" />
      </div>
      <h3 className="login-modal-title">Account Locked</h3>
      <p className="login-modal-message">
        Your account is currently locked. Please contact staff for assistance.
      </p>
      <button className="login-modal-btn" onClick={onClose}>
        Understood
      </button>
    </div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLockedModal, setShowLockedModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`, {
        email,
        password,
      });

      const { id, token, username, role, status } = response.data;

      if (status === "LOCKED") {
        setShowLockedModal(true);
        return;
      }

      const userData = { id, username, email, role, token };
      login(userData);
      localStorage.setItem("token", token);

      if (role === "admin") {
        navigate("/admin");
      } else {
        const from = location.state?.from || "/";
        navigate(from);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Login failed!",
      });
    }
  };

  return (
    <div className="login-page">
      {showLockedModal && (
        <LockedAccountModal onClose={() => setShowLockedModal(false)} />
      )}

      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue your AEROPACE experience</p>
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
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
          <div className="form-options">
            {/* <label className="remember-me">
              <input type="checkbox" /> Ghi nhớ tôi
            </label> */}
            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
          </div>
          <button type="submit" className="login-submit-btn">
            <LogIn size={20} />
            <span>Sign In</span>
          </button>
        </form>
        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;