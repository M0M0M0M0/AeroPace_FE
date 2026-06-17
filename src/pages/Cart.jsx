import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart, fetchCart } = useCart();
  const prevPricesRef = useRef({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch khi vào trang + visibilitychange
  useEffect(() => {
    if (user) fetchCart();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && user) fetchCart();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user]);

  // Detect thay đổi giá
  useEffect(() => {
    if (!cart?.items) return;

    cart.items.forEach((item) => {
      const prevPrice = prevPricesRef.current[item.cartItemId];
      if (prevPrice !== undefined && prevPrice !== item.price) {
        toast.warning(`Price of "${item.productName}" just changed`, {
          description: `${prevPrice.toLocaleString()} ₫ → ${item.price.toLocaleString()} ₫`,
        });
      }
      prevPricesRef.current[item.cartItemId] = item.price;
    });
  }, [cart]);

  // Tổng tiền toàn bộ cart
  const totalAmount = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // Có item nào invalid không (để block nút thanh toán)
  const hasInvalidItems = useMemo(() => {
    if (!cart?.items) return false;
    return cart.items.some(
      (item) => item.stockAvailable === 0 || item.quantity > item.stockAvailable || item.isAvailable === false
    );
  }, [cart]);

  // ─── SỬA LỖI HIỂN THỊ KHI GIỎ HÀNG TRỐNG TẠI ĐÂY ──────────────────
  if (!cart || !cart.items || cart.items.length === 0)
    return (
      <div className="cart-page"> {/* Bổ sung lớp bọc để ăn màu giao diện */}
        <div className="cart-empty">
          <p>Cart is empty.</p>
          {/* Đổi từ class "btn" sang "cart-page-btn" để lấy màu Gradient */}
          <button className="cart-page-btn" onClick={() => navigate("/products")}>
            Back to Store
          </button>
        </div>
      </div>
    );
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-section-title">Your Cart</h1>

        <div className="cart-items">
          {cart.items.map((item) => {
            const outOfStock = item.stockAvailable === 0;
            const exceedsStock = item.quantity > item.stockAvailable;
            const isUnavailable = item.isAvailable === false;

            return (
              <div
                key={item.cartItemId}
                className={`cart-card ${outOfStock || exceedsStock ? "cart-card--warning" : ""}`}
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.productName}
                  onClick={() => navigate(`/products/detail/${item.productId}`)}
                  className="cart-image"
                  onLoad={(e) => {
                    const img = e.target;
                    if (img.naturalWidth / img.naturalHeight > 1.5) {
                      img.style.objectFit = "contain";
                    }
                  }}
                  onError={(e) => { e.target.src = "/fallback.png"; }}
                />

                {/* Info */}
                <div className="cart-info">
                  <h2
                    onClick={() => navigate(`/products/detail/${item.productId}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.productName}
                  </h2>

                  <p className="cart-variant">
                    {item.option1Value}
                    {item.option2Value && ` - ${item.option2Value}`}
                    {item.option3Value && ` - ${item.option3Value}`}
                  </p>

                  <p className="cart-price">{item.price.toLocaleString()} ₫</p>

                  {outOfStock && (
                    <p className="cart-stock-warning">
                      <AlertTriangle size={13} />
                      Product is out of stock
                    </p>
                  )}
                  {!outOfStock && exceedsStock && (
                    <p className="cart-stock-warning">
                      <AlertTriangle size={13} />
                      Only {item.stockAvailable} items left in stock
                    </p>
                  )}
                  {isUnavailable && (
                    <p className="cart-stock-warning">
                      <AlertTriangle size={13} />
                      Product is no longer available
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="cart-quantity">
                  <button
                    onClick={() =>
                      item.quantity === 1
                        ? removeFromCart(item.cartItemId)
                        : updateQuantity(item.cartItemId, item.quantity - 1)
                    }
                    disabled={outOfStock || isUnavailable}
                  >
                    <Minus size={16} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    disabled={item.quantity >= item.stockAvailable || isUnavailable}
                    style={
                      item.quantity >= item.stockAvailable || isUnavailable
                        ? { opacity: 0.4, cursor: "not-allowed" }
                        : {}
                    }
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Remove */}
                <button
                  className="cart-remove"
                  onClick={() => removeFromCart(item.cartItemId)}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}

          {/* Total */}
          <div className="cart-total">
            <h2>Total (Estimated):</h2>
            <p className="total-price">{totalAmount.toLocaleString()} ₫</p>
          </div>

          {/* Global warning */}
          {hasInvalidItems && (
            <p className="cart-global-warning">
              <AlertTriangle size={14} />
              Some products exceed available stock, are out of stock, or may no longer be available. Please adjust your cart before checkout.            </p>
          )}

          {/* Actions */}
          <div className="cart-page-actions">
            <button
              className={`cart-page-btn ${hasInvalidItems ? "cart-page-btn-disabled" : ""}`}
              disabled={hasInvalidItems}
              onClick={() => {
                if (!user?.id) {
                  navigate("/login", { state: { from: "/cart" } });
                } else {
                  navigate("/checkout");
                }
              }}
            >
              Checkout ({cart.items.length})
            </button>
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {showConfirm && (
        <div className="cart-confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="cart-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete entire cart?</h3>
            <p>This action cannot be undone.</p>
            <div className="cart-confirm-actions">
              <button className="cart-confirm-btn-cancel" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button
                className="cart-confirm-btn-delete"
                onClick={() => { clearCart(); setShowConfirm(false); }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;