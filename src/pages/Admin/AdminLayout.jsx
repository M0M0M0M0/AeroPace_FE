import React, { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  Tag,
  Truck,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./AdminLayout.css";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-container">
      {/* --- SIDEBAR --- */}
      <aside className={`admin-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-logo">
          <Link to="/" style={{ textDecoration: "none", color: "#e5e4e4" }}>
            <h2>{isSidebarOpen ? "AERO PACE" : "AP"}</h2>
          </Link>
        </div>
        <nav className="sidebar-nav">
          <Link
            to="/admin"
            className={`a-nav-item ${isActive("/admin") ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            <span className="a-nav-label">Dashboard</span>
          </Link>
          <Link
            to="/admin/orders"
            className={`a-nav-item ${isActive("/admin/orders") ? "active" : ""}`}
          >
            <ShoppingCart size={20} />
            <span className="a-nav-label">Orders</span>
          </Link>
          <Link
            to="/admin/products"
            className={`a-nav-item ${isActive("/admin/products") ? "active" : ""}`}
          >
            <Package size={20} />
            <span className="a-nav-label">Products</span>
          </Link>
          <Link
            to="/admin/catalog"
            className={`a-nav-item ${isActive("/admin/catalog") ? "active" : ""}`}
          >
            <Tag size={20} />
            <span className="a-nav-label">Categories & Brands</span>
          </Link>
          <Link
            to="/admin/customers"
            className={`a-nav-item ${isActive("/admin/customers") ? "active" : ""}`}
          >
            <Users size={20} />
            <span className="a-nav-label">Customers</span>
          </Link>
          <Link
            to="/admin/shippings"
            className={`a-nav-item ${isActive("/admin/shippings") ? "active" : ""}`}
          >
            <Truck size={20} />
            <span className="a-nav-label">Shipping Methods</span>
          </Link>
    
        </nav>
      </aside>

      <div className="admin-main">
        {/* --- HEADER --- */}
        <header className="admin-header">
          <div className="header-left">
            <button
              className="menu-toggle-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
          <div className="header-right">

          <button 
              type="button" 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="admin-profile">
              <img
                src="https://ui-avatars.com/api/?name=Admin&background=e5e4e4&color=000"
                alt="Admin"
                className="avatar"
              />
              <span className="admin-name">Admin</span>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
