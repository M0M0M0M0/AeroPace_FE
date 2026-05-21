import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  // Auto select sản phẩm hợp lệ
  useEffect(() => {
    if (!cart?.items) return;

    const validItems = cart.items
      .filter(
        (item) =>
          item.stockAvailable > 0 &&
          item.quantity <= item.stockAvailable
      )
      .map((item) => item.cartItemId);

    setSelectedItems(validItems);
  }, [cart]);

  // Toggle select item
  const handleSelectItem = (cartItemId) => {
    setSelectedItems((prev) =>
      prev.includes(cartItemId)
        ? prev.filter((id) => id !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  // Select all chỉ chọn item hợp lệ
  const handleSelectAll = () => {
    const validItems = cart.items
      .filter(
        (item) =>
          item.stockAvailable > 0 &&
          item.quantity <= item.stockAvailable
      )
      .map((item) => item.cartItemId);

    const isAllValidSelected =
      validItems.length > 0 &&
      validItems.every((id) => selectedItems.includes(id));

    if (isAllValidSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(validItems);
    }
  };

  // Total selected
  const selectedTotalAmount = useMemo(() => {
    if (!cart || !cart.items) return 0;

    return cart.items
      .filter((item) => selectedItems.includes(item.cartItemId))
      .reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
  }, [cart, selectedItems]);

  // Các item invalid nhưng đang bị tick
  const hasSelectedInvalidItems = useMemo(() => {
    if (!cart?.items) return false;

    return cart.items.some((item) => {
      const isSelected = selectedItems.includes(item.cartItemId);

      const isInvalid =
        item.stockAvailable === 0 ||
        item.quantity > item.stockAvailable;

      return isSelected && isInvalid;
    });
  }, [cart, selectedItems]);

  // Số lượng item hợp lệ
  const validItemCount = useMemo(() => {
    if (!cart?.items) return 0;

    return cart.items.filter(
      (item) =>
        item.stockAvailable > 0 &&
        item.quantity <= item.stockAvailable
    ).length;
  }, [cart]);

  const isAllSelected =
    validItemCount > 0 &&
    cart.items
      .filter(
        (item) =>
          item.stockAvailable > 0 &&
          item.quantity <= item.stockAvailable
      )
      .every((item) =>
        selectedItems.includes(item.cartItemId)
      );

  if (!cart || !cart.items || cart.items.length === 0)
    return (
      <div className="cart-empty">
        <p>Giỏ hàng trống.</p>
        <button
          className="cart-btn"
          onClick={() => navigate("/products")}
        >
          Quay lại cửa hàng
        </button>
      </div>
    );

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-section-title">
          Giỏ hàng của bạn
        </h1>

        <div className="cart-items">

          {/* Select all */}
          <div className="cart-select-all">
            <input
              type="checkbox"
              id="selectAll"
              className="cart-checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />

            <label htmlFor="selectAll">
              Chọn tất cả ({validItemCount} sản phẩm hợp lệ)
            </label>
          </div>

          {cart.items.map((item) => {
            const outOfStock =
              item.stockAvailable === 0;

            const exceedsStock =
              item.quantity > item.stockAvailable;

            return (
              <div
                key={item.cartItemId}
                className={`cart-card ${outOfStock || exceedsStock
                    ? "cart-card--warning"
                    : ""
                  }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="cart-checkbox"
                  checked={selectedItems.includes(
                    item.cartItemId
                  )}
                  onChange={() =>
                    handleSelectItem(item.cartItemId)
                  }
                />

                {/* Image */}
                <img
                  src={item.image}
                  alt={item.productName}
                  onClick={() =>
                    navigate(
                      `/products/detail/${item.productId}`
                    )
                  }
                  className="cart-image"
                  onLoad={(e) => {
                    const img = e.target;

                    if (
                      img.naturalWidth /
                      img.naturalHeight >
                      1.5
                    ) {
                      img.style.objectFit =
                        "contain";
                    }
                  }}
                  onError={(e) => {
                    e.target.src = "/fallback.png";
                  }}
                />

                {/* Info */}
                <div className="cart-info">
                  <h2
                    onClick={() =>
                      navigate(
                        `/products/detail/${item.productId}`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {item.productName}
                  </h2>

                  <p className="cart-variant">
                    {item.option1Value}
                    {item.option2Value &&
                      ` - ${item.option2Value}`}
                    {item.option3Value &&
                      ` - ${item.option3Value}`}
                  </p>

                  <p className="cart-price">
                    {item.price.toLocaleString()} ₫
                  </p>

                  {/* Warning */}
                  {outOfStock && (
                    <p className="cart-stock-warning">
                      <AlertTriangle size={13} />
                      Sản phẩm đã hết hàng
                    </p>
                  )}

                  {!outOfStock &&
                    exceedsStock && (
                      <p className="cart-stock-warning">
                        <AlertTriangle size={13} />
                        Chỉ còn{" "}
                        {item.stockAvailable} sản phẩm
                      </p>
                    )}
                </div>

                {/* Quantity */}
                <div className="cart-quantity">
                  <button
                    onClick={() =>
                      item.quantity === 1
                        ? removeFromCart(
                          item.cartItemId
                        )
                        : updateQuantity(
                          item.cartItemId,
                          item.quantity - 1
                        )
                    }
                    disabled={outOfStock}
                  >
                    <Minus size={16} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.cartItemId,
                        item.quantity + 1
                      )
                    }
                    disabled={
                      item.quantity >=
                      item.stockAvailable
                    }
                    style={
                      item.quantity >=
                        item.stockAvailable
                        ? {
                          opacity: 0.4,
                          cursor: "not-allowed",
                        }
                        : {}
                    }
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Remove */}
                <button
                  className="cart-remove"
                  onClick={() => {
                    removeFromCart(item.cartItemId);

                    setSelectedItems((prev) =>
                      prev.filter(
                        (id) =>
                          id !== item.cartItemId
                      )
                    );
                  }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}

          {/* Total */}
          <div className="cart-total">
            <h2>Tổng tiền tạm tính:</h2>

            <p className="total-price">
              {selectedTotalAmount.toLocaleString()} ₫
            </p>
          </div>

          {/* Global warning */}
          {hasSelectedInvalidItems && (
            <p className="cart-global-warning">
              <AlertTriangle size={14} />
              Một số sản phẩm được chọn vượt quá tồn kho
              hoặc đã hết hàng. Vui lòng điều chỉnh trước
              khi thanh toán.
            </p>
          )}

          {/* Actions */}
          <div className="cart-page-actions">
            <button
              className="cart-page-btn"
              onClick={() => setShowConfirm(true)}
            >
              Xóa tất cả
            </button>

            <button
              className={`cart-page-btn ${selectedItems.length > 0 &&
                  !hasSelectedInvalidItems
                  ? ""
                  : "cart-page-btn-disabled"
                }`}
              disabled={
                selectedItems.length === 0 ||
                hasSelectedInvalidItems
              }
              onClick={() => {
                if (!user?.id) {
                  navigate("/login", {
                    state: { from: "/cart" },
                  });
                } else {
                  navigate("/checkout", {
                    state: { selectedItems },
                  });
                }
              }}
            >
              Thanh toán{" "}
              {selectedItems.length > 0
                ? `(${selectedItems.length})`
                : ""}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm delete modal */}
      {showConfirm && (
        <div
          className="cart-confirm-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="cart-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Xóa toàn bộ giỏ hàng?</h3>

            <p>
              Hành động này không thể hoàn tác.
            </p>

            <div className="cart-confirm-actions">
              <button
                className="cart-confirm-btn-cancel"
                onClick={() =>
                  setShowConfirm(false)
                }
              >
                Hủy
              </button>

              <button
                className="cart-confirm-btn-delete"
                onClick={() => {
                  clearCart();
                  setShowConfirm(false);
                }}
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;