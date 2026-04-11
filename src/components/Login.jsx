import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, LogIn } from "lucide-react";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:8080/auth/login", {
        email,
        password,
      });

      const { id, token, username, role } = response.data;

      const userData = {
        id,
        username,
        email,
        role,
        token,
      };

      login(userData);
      localStorage.setItem("token", token);

      // redirect
      if (role === "admin") {
        navigate("/admin");
      } else {
        const from = location.state?.from || "/";
        navigate(from);
      }
    } catch (error) {
      console.error(error);

      const message = error.response?.data?.message || "Đăng nhập thất bại!";

      alert(message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Chào mừng trở lại</h2>
          <p>Đăng nhập để tiếp tục trải nghiệm SHOP RUNNER</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" /> Ghi nhớ tôi
            </label>
            <a href="#" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="login-submit-btn">
            <LogIn size={20} />
            <span>Đăng nhập</span>
          </button>
        </form>

        <div className="login-footer">
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
