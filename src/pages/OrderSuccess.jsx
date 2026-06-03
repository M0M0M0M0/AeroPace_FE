import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import "./OrderSuccess.css";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;


  if (!order) {
    return (
      <div className="order-success-page-center">
        <p>Không có đơn hàng để hiển thị.</p>
        <button className="btn" onClick={() => navigate("/products")}>
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      {/* Dấu tích mua hàng thành công */}
      <div
        className="order-success-icon"
      >
        ✓
      </div>

      <div className="order-success-message">
        <h1>Cảm ơn bạn đã mua hàng!</h1>
        <p>
          Đơn hàng của bạn đã được ghi nhận vào <strong>{order.date}</strong>.
        </p>
      </div>

      <div className="order-success-info">
        <h2>Thông tin người nhận </h2>
        <div className="order-success-info-grid">
          <p><strong>Họ tên:</strong> {order.customer.name}</p>
          <p><strong>Email:</strong> {order.customer.email}</p>
          <p><strong>SĐT:</strong> {order.customer.phone}</p>
          <p><strong>Địa chỉ:</strong> {order.customer.address}, {order.customer.city}, {order.customer.postal}</p>
          <p className="full-width"><strong>Phương thức thanh toán:</strong> {order.paymentMethod.toUpperCase()}</p>
        </div>
      </div>

      {/* Chi tiết đơn hàng */}
      <div className="order-success-items-container">
        <h2>Chi tiết đơn hàng</h2>
        <div className="order-success-items">
          {order.items.map((item, idx) => (
            <div key={item.cartItemId || idx} className="order-success-item">
              <div className="order-success-order-left">
                <img src={item.image} alt={item.productName} />
                <div>
                  <p>{item.productName}</p>
                  <p>{item.quantity} x {item.price.toLocaleString()} ₫</p>
                </div>
              </div>
              <p className="order-success-price">{(item.quantity * item.price).toLocaleString()} ₫</p>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="order-success-breakdown">
          <div className="order-success-breakdown-row">
            <span>Tạm tính</span>
            <span>{order.subtotal?.toLocaleString()} ₫</span>
          </div>
          <div className="order-success-breakdown-row">
            <span>VAT (10%)</span>
            <span>{order.vat?.toLocaleString()} ₫</span>
          </div>
          <div className="order-success-breakdown-row">
            <span>
              Phí vận chuyển
              <br />
              <span style={{ fontSize: "0.82rem", color: "#888" }}>
                {order.shippingMethod || "—"}
              </span>
            </span>
            <span>{order.shippingFee?.toLocaleString()} ₫</span>
          </div>
        </div>

        <div className="order-success-total">
          <span>Tổng cộng:</span>
          <span>{order.total?.toLocaleString()} ₫</span>
        </div>
      </div>

      {/*  Quay lại cửa hàng */}
      <div className="text-center mt-6">
        <Link to="/products" className="btn">
          Quay lại cửa hàng
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
