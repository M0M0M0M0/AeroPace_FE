import React from "react";
import { useLocation, Link } from "react-router-dom";
import "./OrderSuccess.css"; // Nhớ import file CSS

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) return (
    <div className="os-empty">
      <p>Không có đơn hàng để hiển thị.</p>
      <Link to="/products" className="os-btn">
        Quay lại cửa hàng
      </Link>
    </div>
  );

  return (
    <div className="os-page">
      <div className="os-container">
        <h1 className="os-title">Cảm ơn bạn đã mua hàng!</h1>
        <p className="os-subtitle">Đơn hàng của bạn đã được ghi nhận:</p>

        <div className="os-card">
          <div className="os-items">
            {order.items.map(item => (
              <div
                key={item.cartItemId || item.id}
                className="os-item-row"
              >
                <p className="os-item-name">{item.productName || item.name} <span>x {item.quantity}</span></p>
                <p className="os-item-price">{(item.price * item.quantity).toLocaleString()} ₫</p>
              </div>
            ))}
          </div>
          
          <div className="os-total-row">
            <h3>Tổng tiền:</h3>
            <p>{order.total.toLocaleString()} ₫</p>
          </div>
        </div>

        <div className="os-actions">
          <Link to="/products" className="os-btn">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;