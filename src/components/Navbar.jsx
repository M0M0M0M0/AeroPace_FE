import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  UserCircle,
  Package,
} from "lucide-react"; // Thêm UserCircle icon
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import "./Navbar.css";

function Navbar() {
  const { cart } = useCart();

  const cartItems = cart?.items || [];

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const [searchText, setSearchText] = useState("");
  const { pathname } = useLocation();
  const hideSearch = pathname.startsWith("/products");

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchText.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchText.trim())}`);
    }
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar-wrapper slide-down">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            SHOP RUNNER
          </Link>
        </div>

        {!hideSearch && (
          <div className="navbar-center">
            <div className="navbar-search">
              <input
                type="text"
                placeholder="Tìm giày chạy bộ, đồ tập..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearch}
              />
              <Search className="search-icon" size={20} />
            </div>
          </div>
        )}

        <div className="navbar-right">
          <div className="navbar-links">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "navlink active" : "navlink"
              }
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "navlink active" : "navlink"
              }
            >
              Sản phẩm
            </NavLink>
          </div>

          <div className="navbar-actions">
            <NavLink to="/cart" className="action-icon-link">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </NavLink>

            {user ? (
              <div className="user-logged-in">
                <div className="user-info">
                  <User size={20} />
                  <span className="user-name">{user.name}</span>
                </div>

                {/* MENU DROP DOWN */}
                <div className="user-dropdown">
                  {/* Trang thông tin cá nhân dành cho mọi tài khoản đăng nhập */}
                  <Link
                    to="/profile"
                    state={{ tab: "info" }}
                    className="dropdown-item"
                  >
                    <UserCircle size={16} /> Thông tin cá nhân
                  </Link>
                  <Link
                    to="/profile"
                    state={{ tab: "orders" }}
                    className="dropdown-item"
                  >
                    <Package size={16} /> Lịch sử đơn hàng
                  </Link>

                  {/* Nút quay lại trang quản trị chỉ dành cho Admin */}
                  {user.role === "admin" && (
                    <Link to="/admin" className="dropdown-item">
                      <Settings size={16} /> Trang quản trị
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-btn"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="login-button"
                state={{ from: location.pathname }}
              >
                <User size={20} />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
