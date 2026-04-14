import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

  if (!cart || !cart.items || cart.items.length === 0)
    return (
      <div className="cart-empty">
        <p>Giỏ hàng trống.</p>
        <button className="btn" onClick={() => navigate("/products")}>
          Quay lại cửa hàng
        </button>
      </div>
    );

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
                  if (img.naturalWidth / img.naturalHeight > 1.5)
                    img.style.objectFit = "contain";
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

              <div className="cart-quantity">
                <button
                  onClick={() =>
                    item.quantity === 1
                      ? removeFromCart(item.cartItemId)
                      : updateQuantity(item.cartItemId, item.quantity - 1)
                  }
                >
                  <Minus size={16} />
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.cartItemId, item.quantity + 1)
                  }
                  disabled={item.quantity >= item.stock}  
                  style={
                    item.quantity >= item.stock
                      ? { opacity: 0.4, cursor: "not-allowed" }
                      : {}
                  }
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                className="cart-remove"
                onClick={() => removeFromCart(item.cartItemId)}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          <div className="cart-total">
            <h2>Tổng tiền:</h2>
            <p>{cart.totalAmount.toLocaleString()} ₫</p>
          </div>

          <div className="cart-actions">
            <button className="btn" onClick={clearCart}>
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
