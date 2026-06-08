import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  UserCircle,
  Package,
  Sun,  
  Moon, 
} from "lucide-react";
import { useCart } from "../context/CartContext";
import logo from "../../public/favicon_io/LogoAero.png";
import { useAuth } from "../context/AuthContext";

import "./Navbar.css";

function Navbar() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = cart?.items || [];
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const [searchText, setSearchText] = useState("");
  const { pathname } = useLocation();
  const hideSearch = pathname.startsWith("/products");

  // ─── LOGIC LIGHT/DARK MODE ───────────────────────────────────────
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };
  // ─────────────────────────────────────────────────────────────────

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchText.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchText.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar-wrapper slide-down">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link 
            to="/" 
            className="navbar-logo" 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          >
            <img 
              src={logo} 
              alt="AeroPace Logo" 
              style={{ height: '40px', width: 'auto' }}
            />
            <span>AEROPACE</span>
          </Link>
        </div>

        {!hideSearch && (
          <div className="navbar-center">
            <div className="navbar-search">
              <input
                type="text"
                placeholder="Search for running shoes, workout gear..."
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
              Home
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "navlink active" : "navlink"
              }
            >
              Products
            </NavLink>
          </div>

          <div className="navbar-actions">
            <NavLink to="/cart" className="action-icon-link">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </NavLink>

            <button 
              type="button" 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              <div className="user-logged-in">
                <div className="user-info">
                  <User size={20} />
                  <span className="user-name">{user.name}</span>
                </div>

                {/* MENU DROP DOWN */}
                <div className="user-dropdown">
                  <Link
                    to="/profile"
                    state={{ tab: "info" }}
                    className="dropdown-item"
                  >
                    <UserCircle size={16} /> Personal Information
                  </Link>
                  <Link
                    to="/profile"
                    state={{ tab: "orders" }}
                    className="dropdown-item"
                  >
                    <Package size={16} /> Order History
                  </Link>

                  {user.role === "admin" && (
                    <Link to="/admin" className="dropdown-item">
                      <Settings size={16} /> Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-btn"
                  >
                    <LogOut size={16} /> Sign Out
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
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;