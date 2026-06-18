import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Camera,
} from "lucide-react";
import axios from "axios";
import { uploadImage } from "../api/uploadImage";
import "./Login.css";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Confirm password does not match!" });
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = "";
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, "avatar");
      }

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/register`, {
        username: fullName,
        email,
        password,
        avatarUrl,
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
          <div className="register-avatar-picker">
            <div
              className="register-avatar-circle"
              onClick={() => avatarInputRef.current?.click()}
            >
              <div className="register-avatar-img-wrap">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <User size={32} color="#888" />
                )}
              </div>
              <span className="register-avatar-camera">
                <Camera size={14} />
              </span>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            <p className="register-avatar-hint">Add a profile photo (optional)</p>
          </div>

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
