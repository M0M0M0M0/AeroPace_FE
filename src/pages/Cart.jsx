import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

  const hasStockIssue = cart?.items?.some(
    (item) => item.quantity > item.stockAvailable || item.stockAvailable === 0
  );

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
          {cart.items.map((item) => {
            const outOfStock = item.stockAvailable === 0;
            const exceedsStock = item.quantity > item.stockAvailable;

            return (
              <div
                key={item.cartItemId}
                className={`cart-card ${outOfStock || exceedsStock ? "cart-card--warning" : ""}`}
              >
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
                  onError={(e) => { e.target.src = "/fallback.png"; }}
                />

                <div className="cart-info">
                  <h2>{item.productName}</h2>
                  <p className="variant">
                    {item.option1Value}
                    {item.option2Value && ` - ${item.option2Value}`}
                    {item.option3Value && ` - ${item.option3Value}`}
                  </p>
                  <p className="price">{item.price.toLocaleString()} ₫</p>

                  {/* Thông báo tồn kho */}
                  {outOfStock && (
                    <p className="cart-stock-warning">
                      <AlertTriangle size={13} /> Sản phẩm đã hết hàng
                    </p>
                  )}
                  {!outOfStock && exceedsStock && (
                    <p className="cart-stock-warning">
                      <AlertTriangle size={13} /> Chỉ còn {item.stockAvailable} sản phẩm
                    </p>
                  )}
                </div>

                <div className="cart-quantity">
                  <button
                    onClick={() =>
                      item.quantity === 1
                        ? removeFromCart(item.cartItemId)
                        : updateQuantity(item.cartItemId, item.quantity - 1)
                    }
                    disabled={outOfStock}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.cartItemId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stockAvailable}
                    style={
                      item.quantity >= item.stockAvailable
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
            );
          })}

          <div className="cart-total">
            <h2>Tổng tiền:</h2>
            <p>{cart.totalAmount.toLocaleString()} ₫</p>
          </div>

          {/* Cảnh báo tổng nếu có lỗi tồn kho */}
          {hasStockIssue && (
            <p className="cart-global-warning">
              <AlertTriangle size={14} />
              Một số sản phẩm vượt quá tồn kho. Vui lòng điều chỉnh trước khi thanh toán.
            </p>
          )}

          <div className="cart-actions">
            <button className="btn" onClick={clearCart}>
              Xóa tất cả
            </button>
            <button
              className="btn"
              disabled={hasStockIssue}
              style={hasStockIssue ? { opacity: 0.5, cursor: "not-allowed", backgroundColor: "#ccc" } : {}}
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