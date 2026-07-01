import React, { useState, useRef, useEffect } from "react";
import {
  Mail, Lock, LogIn, User, UserPlus, Camera, X,
  CheckCircle, AlertCircle, ShieldX,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { uploadImage } from "../api/uploadImage";
import "./Login.css";
import "./AuthModal.css";

const API = import.meta.env.VITE_API_BASE_URL;


const AuthModal = ({ onClose, onSuccess, initialMode = "login" }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showLocked, setShowLocked] = useState(false);

  // login + register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // register only
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const switchMode = (m) => {
    setMode(m);
    setMessage({ type: "", text: "" });
  };

  const doLogin = async (em, pw) => {
    const res = await axios.post(`${API}/api/v1/auth/login`, { email: em, password: pw });
    const { id, token, username, role, status } = res.data;
    if (status === "LOCKED") {
      setShowLocked(true);
      return false;
    }
    localStorage.setItem("token", token);
    await login({ id, username, email: em, role, token });
    return { role };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsLoading(true);
    try {
      const ok = await doLogin(email, password);
      if (ok) onSuccess(ok);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Login failed!" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Confirm password does not match!" });
      return;
    }
    setIsLoading(true);
    try {
      let avatarUrl = "";
      if (avatarFile) avatarUrl = await uploadImage(avatarFile, "avatar");
      await axios.post(`${API}/api/v1/auth/register`, {
        username: fullName, email, password, avatarUrl,
      });
      const ok = await doLogin(email, password);
      if (ok) onSuccess(ok);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Registration failed!" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const Alert = () =>
    message.text ? (
      <div className={`modern-alert alert-${message.type}`}>
        {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        <span>{message.text}</span>
      </div>
    ) : null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card login-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {showLocked ? (
          <div className="auth-modal-locked">
            <div className="login-modal-icon"><ShieldX size={40} color="#e53e3e" /></div>
            <h3 className="login-modal-title">Account Locked</h3>
            <p className="login-modal-message">
              Your account is currently locked. Please contact staff for assistance.
            </p>
            <button className="login-modal-btn" onClick={onClose}>Understood</button>
          </div>
        ) : mode === "login" ? (
          <>
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your AEROPACE experience</p>
            </div>
            <Alert />
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input type="email" placeholder="Your Email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input type="password" placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="login-submit-btn" disabled={isLoading}>
                <LogIn size={20} />
                <span>{isLoading ? "Signing in..." : "Sign In"}</span>
              </button>
            </form>
            <div className="login-footer">
              <p>
                Don't have an account?{" "}
                <button type="button" className="auth-link-btn" onClick={() => switchMode("register")}>
                  Sign up now
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h2>Create New Account</h2>
              <p>Join AEROPACE today</p>
            </div>
            <Alert />
            <form onSubmit={handleRegister} className="login-form">
              <div className="register-avatar-picker">
                <div className="register-avatar-circle" onClick={() => avatarInputRef.current?.click()}>
                  <div className="register-avatar-img-wrap">
                    {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : <User size={32} color="#888" />}
                  </div>
                  <span className="register-avatar-camera"><Camera size={14} /></span>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*"
                  style={{ display: "none" }} onChange={handleAvatarChange} />
                <p className="register-avatar-hint">Add a profile photo (optional)</p>
              </div>
              <div className="input-group">
                <User className="input-icon" size={20} />
                <input type="text" placeholder="Username" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} required minLength={5} maxLength={50} />
              </div>
              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input type="email" placeholder="Email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required minLength={5} maxLength={100} />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input type="password" placeholder="Password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input type="password" placeholder="Confirm Password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <button type="submit" className="login-submit-btn" disabled={isLoading}>
                <UserPlus size={20} />
                <span>{isLoading ? "Processing..." : "Sign Up"}</span>
              </button>
            </form>
            <div className="login-footer">
              <p>
                Already have an account?{" "}
                <button type="button" className="auth-link-btn" onClick={() => switchMode("login")}>
                  Log in now
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
