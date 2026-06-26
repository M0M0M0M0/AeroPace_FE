import React from "react";
import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import "./BottomNav.css";

const BottomNav = () => {
  const { cart } = useCart();
  const totalItems = cart?.items?.reduce((t, i) => t + i.quantity, 0) || 0;

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `bnav-item${isActive ? " bnav-item--active" : ""}`}
      >
        <Home size={22} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) => `bnav-item${isActive ? " bnav-item--active" : ""}`}
      >
        <LayoutGrid size={22} />
        <span>Products</span>
      </NavLink>

      <NavLink
        to="/cart"
        className={({ isActive }) => `bnav-item${isActive ? " bnav-item--active" : ""}`}
      >
        <span className="bnav-cart-wrap">
          <ShoppingCart size={22} />
          {totalItems > 0 && (
            <span className="bnav-badge">{totalItems > 99 ? "99+" : totalItems}</span>
          )}
        </span>
        <span>Cart</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `bnav-item${isActive ? " bnav-item--active" : ""}`}
      >
        <User size={22} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
