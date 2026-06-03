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
        <p>No order data available for display.</p>
        <button className="btn" onClick={() => navigate("/products")}>
          Return to Store
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
        <h1>Thank you for your purchase!</h1>
        <p>
          Your order has been received on <strong>{order.date}</strong>.
        </p>
      </div>

      <div className="order-success-info">
        <h2>Recipient Information</h2>
        <div className="order-success-info-grid">
          <p><strong>Name:</strong> {order.customer.name}</p>
          <p><strong>Email:</strong> {order.customer.email}</p>
          <p><strong>Phone:</strong> {order.customer.phone}</p>
          <p><strong>Address:</strong> {order.customer.address}, {order.customer.city}, {order.customer.postal}</p>
          <p className="full-width"><strong>Payment Method:</strong> {order.paymentMethod.toUpperCase()}</p>
        </div>
      </div>

      {/* Chi tiết đơn hàng */}
      <div className="order-success-items-container">
        <h2>Order Details</h2>
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
            <span>Subtotal</span>
            <span>{order.subtotal?.toLocaleString()} ₫</span>
          </div>
          <div className="order-success-breakdown-row">
            <span>VAT (10%)</span>
            <span>{order.vat?.toLocaleString()} ₫</span>
          </div>
          <div className="order-success-breakdown-row">
            <span>
              Shipping Fee
              <br />
              <span style={{ fontSize: "0.82rem", color: "#888" }}>
                {order.shippingMethod || "—"}
              </span>
            </span>
            <span>{order.shippingFee?.toLocaleString()} ₫</span>
          </div>
        </div>

        <div className="order-total">
          <span>Total:</span>
          <span>{order.total?.toLocaleString()} ₫</span>
        </div>
      </div>

      {/*  Quay lại cửa hàng */}
      <div className="text-center mt-6">
        <Link to="/products" className="btn">
          Return to Store
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
