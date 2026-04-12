import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import axios from "axios";
import "./Cart.css";

const getSessionId = () => {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
};

const Cart = () => {
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, fetchCart, updateQuantity, removeFromCart, clearCart } = useCart(); 
  const sessionId = user?.id ? null : getSessionId();

  useEffect(() => {
    if (user === undefined) return;
    fetchCart();
  }, [user]);

  // ================= CLEAR CART =================
  const handleClearCart = async () => {
    try {
      if (user?.id) {
        await axios.delete(
          `http://localhost:8080/api/v1/cart/clear/user?userId=${user.id}`,
        );
      } else {
        await axios.delete(
          `http://localhost:8080/api/v1/cart/clear/session?sessionId=${sessionId}`,
        );
      }
      fetchCart(); 
    } catch (err) {
      console.error(err);
    }
  };

  // ================= EMPTY =================
  if (!cart || !cart.items || cart.items.length === 0)
    return (
      <div className="cart-empty">
        <p>Giỏ hàng trống.</p>
        <button className="btn" onClick={() => navigate("/products")}>
          Quay lại cửa hàng
        </button>
      </div>
    );

  const totalPrice = cart.totalAmount;

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="section-title">Giỏ hàng của bạn</h1>

        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.cartItemId} className="cart-card">
              <img
                src={item.image}
                alt={item.productName}
                onClick={() => navigate(`/products/detail/${item.productId}`)}
                className="cart-image"
                onLoad={(e) => {
                  const img = e.target;
                  const ratio = img.naturalWidth / img.naturalHeight;
                  if (ratio > 1.5) img.style.objectFit = "contain";
                }}
                onError={(e) => {
                  e.target.src = "/fallback.png";
                }}
              />

              <div className="cart-info">
                <h2>{item.productName}</h2>
                <p className="variant">
                  {item.option1Value}
                  {item.option2Value && ` - ${item.option2Value}`}
                  {item.option3Value && ` - ${item.option3Value}`}
                </p>
                <p className="price">{item.price.toLocaleString()} ₫</p>
              </div>

              {/* QUANTITY */}
              <div className="cart-quantity">
                <button
                  onClick={() => {
                    if (item.quantity === 1) {
                      removeFromCart(item.cartItemId); 
                    } else {
                      updateQuantity(item.cartItemId, item.quantity - 1); 
                    }
                  }}
                >
                  <Minus size={16} />
                </button>

                <span>{item.quantity}</span>

                <button
                  onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} 
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* REMOVE */}
              <button
                className="cart-remove"
                onClick={() => removeFromCart(item.cartItemId)} 
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          {/* TOTAL */}
          <div className="cart-total">
            <h2>Tổng tiền:</h2>
            <p>{totalPrice.toLocaleString()} ₫</p>
          </div>

          {/* ACTION */}
          <div className="cart-actions">
            <button className="btn" onClick={handleClearCart}>
              Xóa tất cả
            </button>
            <button
              className="btn"
              onClick={() => {
                if (!user?.id) {
                  navigate("/login", { state: { from: "/cart" } });
                } else {
                  navigate("/checkout");
                }
              }}
            >
              Thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;