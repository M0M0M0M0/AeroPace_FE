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
} from "lucide-react";
import "./AdminLayout.css";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
            <span className="a-nav-label">Tổng quan</span>
          </Link>
          <Link
            to="/admin/orders"
            className={`a-nav-item ${isActive("/admin/orders") ? "active" : ""}`}
          >
            <ShoppingCart size={20} />
            <span className="a-nav-label">Đơn hàng</span>
          </Link>
          <Link
            to="/admin/products"
            className={`a-nav-item ${isActive("/admin/products") ? "active" : ""}`}
          >
            <Package size={20} />
            <span className="a-nav-label">Sản phẩm</span>
          </Link>
          <Link
            to="/admin/catalog"
            className={`a-nav-item ${isActive("/admin/catalog") ? "active" : ""}`}
          >
            <Tag size={20} />
            <span className="a-nav-label">Danh mục & Brand</span>
          </Link>
          <Link
            to="/admin/customers"
            className={`a-nav-item ${isActive("/admin/customers") ? "active" : ""}`}
          >
            <Users size={20} />
            <span className="a-nav-label">Khách hàng</span>
          </Link>
          <Link
            to="/admin/shippings"
            className={`a-nav-item ${isActive("/admin/shippings") ? "active" : ""}`}
          >

            <span className="a-nav-label">Phương thức vận chuyển</span>
          </Link>

        </nav>
      </aside>
      {/* --- KẾT THÚC SIDEBAR --- */}

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
        {/* --- KẾT THÚC HEADER --- */}

        {/* --- MAIN CONTENT --- */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
