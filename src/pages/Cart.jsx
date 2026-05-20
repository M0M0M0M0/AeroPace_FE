import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  
  // State lưu trữ các ID của sản phẩm được tick chọn
  const [selectedItems, setSelectedItems] = useState([]);

  // Hàm xử lý khi tick/bỏ tick 1 sản phẩm
  const handleSelectItem = (cartItemId) => {
    setSelectedItems((prev) =>
      prev.includes(cartItemId)
        ? prev.filter((id) => id !== cartItemId) // Bỏ chọn
        : [...prev, cartItemId] // Chọn thêm
    );
  };

  // Hàm xử lý chọn tất cả / bỏ chọn tất cả
  const handleSelectAll = () => {
    if (cart?.items?.length === selectedItems.length) {
      setSelectedItems([]); // Nếu đang chọn hết thì bỏ chọn hết
    } else {
      setSelectedItems(cart.items.map((item) => item.cartItemId)); // Chọn tất cả
    }
  };

  // Tự động tính toán lại tổng tiền CHỈ cho những sản phẩm được chọn
  const selectedTotalAmount = useMemo(() => {
    if (!cart || !cart.items) return 0;
    return cart.items
      .filter((item) => selectedItems.includes(item.cartItemId))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart, selectedItems]);

  if (!cart || !cart.items || cart.items.length === 0)
    return (
      <div className="cart-empty">
        <p>Giỏ hàng trống.</p>
        <button className="cart-btn" onClick={() => navigate("/products")}>
          Quay lại cửa hàng
        </button>
      </div>
    );

  const isAllSelected = cart.items.length > 0 && selectedItems.length === cart.items.length;

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-section-title">Giỏ hàng của bạn</h1>

        <div className="cart-items">
          {/* Khu vực Chọn tất cả */}
          <div className="cart-select-all">
            <input
              type="checkbox"
              id="selectAll"
              className="cart-checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />
            <label htmlFor="selectAll">
              Chọn tất cả ({cart.items.length} sản phẩm)
            </label>
          </div>

          {cart.items.map((item) => (
            <div key={item.cartItemId} className="cart-card">
              {/* Checkbox cho từng sản phẩm */}
              <input
                type="checkbox"
                className="cart-checkbox"
                checked={selectedItems.includes(item.cartItemId)}
                onChange={() => handleSelectItem(item.cartItemId)}
              />

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
                <h2 onClick={() => navigate(`/products/detail/${item.productId}`)} style={{cursor: 'pointer'}}>
                  {item.productName}
                </h2>
                <p className="cart-variant">
                  {item.option1Value}
                  {item.option2Value && ` - ${item.option2Value}`}
                  {item.option3Value && ` - ${item.option3Value}`}
                </p>
                <p className="cart-price">{item.price.toLocaleString()} ₫</p>
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
                onClick={() => {
                  removeFromCart(item.cartItemId);
                  // Xóa luôn khỏi danh sách đang chọn nếu lỡ xóa sản phẩm
                  setSelectedItems(prev => prev.filter(id => id !== item.cartItemId));
                }}
              > 
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          <div className="cart-total">
            <h2>Tổng tiền tạm tính:</h2>
            <p className="total-price">{selectedTotalAmount.toLocaleString()} ₫</p>
          </div>

          <div className="cart-page-actions">
            <button className="cart-page-btn" onClick={clearCart}>
              Xóa tất cả
            </button>
            <button
              className={`cart-page-btn ${selectedItems.length > 0 ? '' : 'cart-page-btn-disabled'}`}
              disabled={selectedItems.length === 0}
              onClick={() => {
                if (!user?.id) {
                  navigate("/login", { state: { from: "/cart" } });
                } else {
                  // Chuyển hướng sang trang checkout và GỬI KÈM danh sách ID sản phẩm đã chọn
                  navigate("/checkout", { state: { selectedItems } });
                }
              }}
            >
              Thanh toán {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;