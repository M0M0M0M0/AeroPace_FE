import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingProfile, setLoadingProfile] = useState(false);

  const cartItems = cart?.items || [];
  const totalPrice = cart?.totalAmount || 0;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
  });

  const handleUseMyInfo = async () => {
    if (!user?.id) return;

    try {
      setLoadingProfile(true);

      const res = await axios.get(
        `http://localhost:8080/api/v1/customer-profiles/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = res.data;

      setForm((prev) => ({
        ...prev,
        name: data.fullName || "",
        phone: data.phoneNumber || "",
        address: data.address || "",
        email: data.email || user.email || "",
      }));

      toast.success("Đã tải thông tin của bạn!");
    } catch (err) {
      toast.error("Không lấy được thông tin khách hàng");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, address, paymentMethod } = form;

    if (!name || !email || !phone || !address) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:8080/api/v1/orders/checkout",
        {
          userId: user.id,
          shippingAddress: address,
          phoneNumber: phone,
          paymentMethod,
          receiverName: name,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      clearCart();

      navigate("/order-success", {
        state: {
          order: {
            customer: { name, email, phone, address },
            items: cartItems,
            total: totalPrice,
            paymentMethod,
            date: new Date().toLocaleString(),
          },
        },
      });

      toast.success("Đặt hàng thành công!");
    } catch (err) {
      toast.error("Đặt hàng thất bại.");
    }
  };

  if (!cartItems.length)
    return (
      <div className="checkout-empty">
        <p>Giỏ hàng trống.</p>
        <button className="btn" onClick={() => navigate("/products")}>
          Quay lại cửa hàng
        </button>
      </div>
    );

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="section-title">Thanh toán</h1>

        <div className="checkout-grid">
          {/* FORM */}
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-form-header">
              <h2>Thông tin khách hàng</h2>

              <button
                type="button"
                className="checkout-use-info-btn"
                onClick={handleUseMyInfo}
                disabled={loadingProfile}
              >
                {loadingProfile ? "Đang tải..." : "Sử dụng thông tin của tôi"}
              </button>
            </div>

            <div className="checkout-form-grid">
              {["name", "email", "phone", "address"].map((field) => (
                <input
                  key={field}
                  type={field === "email" ? "email" : "text"}
                  placeholder={
                    field === "name"
                      ? "Họ và tên"
                      : field === "email"
                      ? "Email"
                      : field === "phone"
                      ? "Số điện thoại"
                      : "Địa chỉ"
                  }
                  value={form[field]}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  className="checkout-input"
                />
              ))}
            </div>

            <div className="checkout-payment">
              <h3>Phương thức thanh toán</h3>

              <div className="checkout-payment-grid">
                {[
                  { id: "cod", label: "COD" },
                  { id: "bank", label: "Chuyển khoản" },
                  { id: "card", label: "Thẻ" },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`checkout-payment-card ${
                      form.paymentMethod === m.id ? "active" : ""
                    }`}
                    onClick={() =>
                      setForm({ ...form, paymentMethod: m.id })
                    }
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn">
              Thanh toán
            </button>
          </form>

          {/* ORDER */}
          <div className="checkout-summary">
            <h2>Đơn hàng của bạn</h2>

            <div className="checkout-items">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="checkout-item">
                  <div className="checkout-item-left">
                    <img src={item.image} alt={item.productName} />
                    <div>
                      <p>{item.productName}</p>
                      <p className="checkout-variant">
                        {item.option1Value}
                      </p>
                      <p>
                        {item.quantity} x {item.price.toLocaleString()} ₫
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-total">
              <h3>Tổng tiền:</h3>
              <p>{totalPrice.toLocaleString()} ₫</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;