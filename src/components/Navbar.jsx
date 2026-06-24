import React, { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import logo from "../../public/favicon_io/LogoAero.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── Mega menu layout — IDs only, names resolved from DB at runtime ───────────
const MEGA_MENU = [
  // Column 1
  [
    { id: 192, items: [25, 43, 15, 130, 114, 82] },
    { id: 195, items: [4, 46, 58, 59, 85] },
  ],
  // Column 2
  [
    { id: 193, items: [27, 9, 14, 28, 141, 133] },
    { id: 196, items: [56, 84, 171, 20, 143, 180] },
  ],
  // Column 3
  [
    { id: 194, items: [1, 2, 3, 32, 75, 36] },
    { id: 199, items: [6, 108, 152, 8, 145, 189] },
  ],
  // Column 4
  [
    { id: 197, items: [17, 7, 42, 183, 135, 88] },
    { id: 200, items: [201, 202, 203, 204], noSeeAll: true },
  ],
  // Column 5
  [
    { id: 198, items: [40, 55, 65, 41, 81, 49] },
  ],
];

function Navbar() {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = cart?.items || [];
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const [searchText, setSearchText] = useState("");
  const [megaOpen, setMegaOpen] = useState(false);
  const megaCloseTimer = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [catNames, setCatNames] = useState({});
  const { pathname } = useLocation();
  const hideSearch = pathname.startsWith("/products");

  useEffect(() => {
    axios.get(`${API_BASE}/api/v1/categories`)
      .then(r => {
        const map = {};
        r.data.forEach(c => { map[c.id] = c.name; });
        setCatNames(map);
      })
      .catch(() => {});
  }, []);

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileProductsOpen(false);
  };

  useEffect(() => { closeMobile(); }, [pathname]);

  // ─── LOGIC LIGHT/DARK MODE ───────────────────────────────────────
  const { theme, toggleTheme } = useTheme();
  // ─────────────────────────────────────────────────────────────────

  const handleMegaEnter = () => {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
    setMegaOpen(true);
  };

  const handleMegaLeave = () => {
    megaCloseTimer.current = setTimeout(() => setMegaOpen(false), 200);
  };

  useEffect(() => () => { if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current); }, []);

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
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <div className="navbar-links">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "navlink active" : "navlink"
              }
            >
              Home
            </NavLink>

            {/* Products mega menu */}
            <div
              className="products-mega-wrap"
              onMouseEnter={handleMegaEnter}
              onMouseLeave={handleMegaLeave}
            >
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  isActive ? "navlink active mega-trigger" : "navlink mega-trigger"
                }
              >
                Products <ChevronDown size={12} className={`mega-chevron${megaOpen ? " mega-chevron--open" : ""}`} />
              </NavLink>

              <div className={`mega-panel${megaOpen ? " mega-panel--open" : ""}`}>
                <div className="mega-inner">
                  {MEGA_MENU.map((col, ci) => (
                    <div key={ci} className="mega-col">
                      {col.map((section) => {
                        const sectionName = catNames[section.id];
                        return (
                          <div key={section.id} className="mega-section">
                            {sectionName ? (
                              <Link
                                to={`/products?category=${section.id}`}
                                className="mega-head"
                                onClick={() => setMegaOpen(false)}
                              >
                                {sectionName}
                              </Link>
                            ) : (
                              <span className="mega-head mega-head--plain" />
                            )}
                            <ul className="mega-list">
                              {section.items
                                .filter(id => catNames[id])
                                .map(id => (
                                  <li key={id}>
                                    <Link
                                      to={`/products?category=${id}`}
                                      onClick={() => setMegaOpen(false)}
                                    >
                                      {catNames[id]}
                                    </Link>
                                  </li>
                                ))}
                              {!section.noSeeAll && sectionName && (
                                <li>
                                  <Link
                                    to={`/products?category=${section.id}`}
                                    className="mega-see-all"
                                    onClick={() => setMegaOpen(false)}
                                  >
                                    See all →
                                  </Link>
                                </li>
                              )}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
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

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay${mobileOpen ? " mobile-overlay--open" : ""}`}
        onClick={closeMobile}
      />

      {/* Mobile drawer */}
      <div className={`mobile-drawer${mobileOpen ? " mobile-drawer--open" : ""}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="mobile-drawer-logo" onClick={closeMobile}>
            <img src={logo} alt="AeroPace" style={{ height: 32, width: "auto" }} />
            <span>AEROPACE</span>
          </Link>
          <button className="mobile-drawer-close" onClick={closeMobile} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <div className="mobile-drawer-search">
          <Search size={16} className="mobile-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchText.trim()) {
                navigate(`/products?search=${encodeURIComponent(searchText.trim())}`);
                closeMobile();
              }
            }}
          />
        </div>

        <nav className="mobile-nav">
          <NavLink to="/" className={({ isActive }) => `mobile-nav-link${isActive ? " active" : ""}`} onClick={closeMobile}>
            Home
          </NavLink>

          <div className="mobile-nav-products">
            <button
              className="mobile-nav-products-toggle"
              onClick={() => setMobileProductsOpen((v) => !v)}
            >
              <NavLink
                to="/products"
                className={({ isActive }) => isActive ? "active" : ""}
                onClick={(e) => { e.preventDefault(); setMobileProductsOpen((v) => !v); }}
              >
                Products
              </NavLink>
              <ChevronDown size={16} className={`mobile-chevron${mobileProductsOpen ? " mobile-chevron--open" : ""}`} />
            </button>

            <div className={`mobile-categories${mobileProductsOpen ? " mobile-categories--open" : ""}`}>
              {MEGA_MENU.flat()
                .filter(section => catNames[section.id])
                .map((section) => (
                  <Link
                    key={section.id}
                    to={`/products?category=${section.id}`}
                    className="mobile-category-link"
                    onClick={closeMobile}
                  >
                    {catNames[section.id]}
                  </Link>
                ))}
            </div>
          </div>
        </nav>

        <div className="mobile-drawer-user">
          {user ? (
            <>
              <div className="mobile-user-name">
                <User size={16} />
                <span>{user.name}</span>
              </div>
              <Link to="/profile" state={{ tab: "info" }} className="mobile-user-link" onClick={closeMobile}>
                <UserCircle size={16} /> Personal Information
              </Link>
              <Link to="/profile" state={{ tab: "orders" }} className="mobile-user-link" onClick={closeMobile}>
                <Package size={16} /> Order History
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" className="mobile-user-link" onClick={closeMobile}>
                  <Settings size={16} /> Admin Dashboard
                </Link>
              )}
              <button className="mobile-user-link mobile-logout" onClick={() => { handleLogout(); closeMobile(); }}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-signin-btn" state={{ from: pathname }} onClick={closeMobile}>
              <User size={16} /> Sign In
            </Link>
          )}
        </div>

        <div className="mobile-drawer-footer">
          <button className="mobile-theme-btn" onClick={toggleTheme}>
            {theme === "light" ? <><Moon size={16} /> Dark mode</> : <><Sun size={16} /> Light mode</>}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;