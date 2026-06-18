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
import { useCart } from "../context/CartContext";
import logo from "../../public/favicon_io/LogoAero.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

// ── Mega menu data (hardcoded — API returns big + sub categories flat) ──────
const MEGA_MENU = [
  // Column 1
  [
    {
      id: 192, label: "Apparel",
      items: [
        { id: 25,  name: "Áo Chạy Bộ Nike" },
        { id: 43,  name: "Áo Chạy Bộ Adidas" },
        { id: 15,  name: "Áo Chạy Bộ T8" },
        { id: 130, name: "Áo Compressport" },
        { id: 114, name: "Quần Bó Cơ Motive" },
        { id: 82,  name: "Áo Khoác Athlet" },
      ],
    },
    {
      id: 195, label: "Hydration",
      items: [
        { id: 4,  name: "Vest Nước AONIJIE" },
        { id: 46, name: "Bình nước Map Brother" },
        { id: 58, name: "Vest Nước COMPRESSPORT" },
        { id: 59, name: "Đai Chạy Bộ AONIJIE" },
        { id: 85, name: "Bình nước AONIJIE" },
      ],
    },
  ],
  // Column 2
  [
    {
      id: 193, label: "Footwear",
      items: [
        { id: 27,  name: "Giày Chạy Bộ Nike" },
        { id: 9,   name: "Giày Chạy Bộ Adidas" },
        { id: 14,  name: "Giày Chạy Bộ Hoka" },
        { id: 28,  name: "Giày Chạy Bộ ASICS" },
        { id: 141, name: "Giày Chạy Trail Salomon" },
        { id: 133, name: "Giày Chạy Bộ New Balance" },
      ],
    },
    {
      id: 196, label: "Recovery",
      items: [
        { id: 56,  name: "Băng Bắp Chân Compressport" },
        { id: 84,  name: "Bó calf Aonijie" },
        { id: 171, name: "Dụng cụ massage" },
        { id: 20,  name: "Giảm đau Ligpro" },
        { id: 143, name: "Băng dán cơ thể thao" },
        { id: 180, name: "Bó gối AONIJIE" },
      ],
    },
  ],
  // Column 3
  [
    {
      id: 194, label: "Accessories",
      items: [
        { id: 1,  name: "Kính Chạy Bộ TIFOSI" },
        { id: 2,  name: "Tất chạy bộ Compressport" },
        { id: 3,  name: "Nón Compressport" },
        { id: 32, name: "Băng đô Compressport" },
        { id: 75, name: "Nón Nike" },
        { id: 36, name: "Khăn Đa Năng Buff" },
      ],
    },
    {
      id: 199, label: "Trail Equipment",
      items: [
        { id: 6,   name: "Gậy Chạy AONIJIE" },
        { id: 108, name: "Gậy Chạy Zenone" },
        { id: 152, name: "Gậy Leo Núi Husky" },
        { id: 8,   name: "Cốc Gấp Gọn Msquare" },
        { id: 145, name: "Túi sơ cứu 1Life" },
        { id: 189, name: "Gaiter AONIJIE" },
      ],
    },
  ],
  // Column 4
  [
    {
      id: 197, label: "Nutrition",
      items: [
        { id: 17,  name: "Gel Năng Lượng AB" },
        { id: 7,   name: "Thanh Protein AB" },
        { id: 42,  name: "Bột Điện Giải Pocari" },
        { id: 183, name: "Gel Năng Lượng GU" },
        { id: 135, name: "Whey Protein Royal-D" },
        { id: 88,  name: "Thanh Năng Lượng Naak" },
      ],
    },
    {
      id: null, label: "Pickleball",
      items: [
        { id: 200, name: "Paddles" },
        { id: 201, name: "Balls" },
        { id: 202, name: "Accessories" },
        { id: 203, name: "Bags" },
      ],
      noSeeAll: true,
    },
  ],
  // Column 5
  [
    {
      id: 198, label: "Electronics",
      items: [
        { id: 40, name: "Đồng Hồ Coros" },
        { id: 55, name: "Đồng Hồ Garmin" },
        { id: 65, name: "Đồng Hồ Suunto" },
        { id: 41, name: "Đèn Đội Đầu Nitecore" },
        { id: 81, name: "Tai Nghe Shokz" },
        { id: 49, name: "Tai Nghe Soundcore" },
      ],
    },
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
  const { pathname } = useLocation();
  const hideSearch = pathname.startsWith("/products");

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
                      {col.map((section) => (
                        <div key={section.label} className="mega-section">
                          {section.id ? (
                            <Link
                              to={`/products?category=${section.id}`}
                              className="mega-head"
                              onClick={() => setMegaOpen(false)}
                            >
                              {section.label}
                            </Link>
                          ) : (
                            <span className="mega-head mega-head--plain">
                              {section.label}
                            </span>
                          )}
                          <ul className="mega-list">
                            {section.items.map((item) => (
                              <li key={item.id}>
                                <Link
                                  to={`/products?category=${item.id}`}
                                  onClick={() => setMegaOpen(false)}
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                            {!section.noSeeAll && section.id && (
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
                      ))}
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
              {MEGA_MENU.flat().map((section) => (
                <Link
                  key={section.label}
                  to={section.id ? `/products?category=${section.id}` : "/products"}
                  className="mobile-category-link"
                  onClick={closeMobile}
                >
                  {section.label}
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