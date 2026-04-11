import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;
  const [scale, setScale] = useState(1);

  // Animation dấu tích
  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => (prev === 1 ? 1.2 : 1));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  if (!order) {
    return (
      <div className="page-center">
        <p>Không có đơn hàng để hiển thị.</p>
        <button className="btn" onClick={() => navigate("/products")}>
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      {/* ✅ Dấu tích mua hàng thành công */}
      <div
        className="success-icon"
        style={{ transform: `scale(${scale})` }}
      >
        ✓
      </div>

      {/* 🎉 Lời cảm ơn */}
      <div className="success-message">
        <h1>Cảm ơn bạn đã mua hàng!</h1>
        <p>
          Đơn hàng của bạn đã được ghi nhận vào <strong>{order.date}</strong>.
        </p>
      </div>

      {/* 🧾 Thông tin khách hàng */}
      <div className="order-info">
        <h2>Thông tin khách hàng</h2>
        <div className="info-grid">
          <p><strong>Họ tên:</strong> {order.customer.name}</p>
          <p><strong>Email:</strong> {order.customer.email}</p>
          <p><strong>SĐT:</strong> {order.customer.phone}</p>
          <p><strong>Địa chỉ:</strong> {order.customer.address}, {order.customer.city}, {order.customer.postal}</p>
          <p className="full-width"><strong>Phương thức thanh toán:</strong> {order.paymentMethod.toUpperCase()}</p>
        </div>
      </div>

      {/* 🛒 Chi tiết đơn hàng */}
      <div className="order-items-container">
        <h2>Chi tiết đơn hàng</h2>
        <div className="order-items">
          {order.items.map(item => (
            <div key={item.id} className="order-item">
              <div className="order-left">
                <img src={item.image} alt={item.name} />
                <div>
                  <p>{item.name}</p>
                  <p>{item.quantity} x {item.price.toLocaleString()} ₫</p>
                </div>
              </div>
              <p className="order-price">{(item.quantity*item.price).toLocaleString()} ₫</p>
            </div>
          ))}
        </div>
        <div className="order-total">
          <span>Tổng cộng:</span>
          <span>{order.total.toLocaleString()} ₫</span>
        </div>
      </div>

      {/* 🔗 Quay lại cửa hàng */}
      <div className="text-center mt-6">
        <Link to="/products" className="btn">
          Quay lại cửa hàng
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
