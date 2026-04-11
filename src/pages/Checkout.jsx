import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart, fetchCart } = useCart();
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
    city: "",
    postal: "",
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
        },
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
      console.log(err);
      toast.error("Không lấy được thông tin khách hàng");
    } finally {
      setLoadingProfile(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, address, paymentMethod } = form;

    if (!name || !email || !phone || !address || !paymentMethod) {
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
          paymentMethod: paymentMethod,
          receiverName: name,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      clearCart();

      toast.success(`Đặt hàng thành công!`);
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
    } catch (err) {
      console.error(err);
      toast.error("Đặt hàng thất bại, vui lòng thử lại.");
    }
  };

  if (!cartItems || cartItems.length === 0)
    return (
      <div className="cart-empty">
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
          {/* Form khách hàng */}
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>Thông tin khách hàng</h2>

              <button
                type="button"
                className="use-info-btn"
                onClick={handleUseMyInfo}
                disabled={loadingProfile}
              >
                {loadingProfile ? "Đang tải..." : "Sử dụng thông tin của tôi"}
              </button>
            </div>
            <div className="form-grid">
              {["name", "email", "phone", "address"].map((field, idx) => (
                <input
                  key={idx}
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
                  className="form-input"
                />
              ))}
            </div>

            <div className="payment-methods">
              <h3>Phương thức thanh toán</h3>
              <div className="payment-grid">
                {[
                  { id: "cod", label: "COD" },
                  { id: "bank", label: "Chuyển khoản ngân hàng" },
                  { id: "card", label: "Thẻ tín dụng / Thẻ ghi nợ" },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`payment-card ${form.paymentMethod === m.id ? "active" : ""}`}
                    onClick={() => setForm({ ...form, paymentMethod: m.id })}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn mt-4">
              Thanh toán
            </button>
          </form>

          {/* Chi tiết đơn hàng */}
          <div className="order-summary">
            <h2>Đơn hàng của bạn</h2>
            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="order-item">
                  <div className="order-left">
                    <img src={item.image} alt={item.productName} />
                    <div>
                      <p>{item.productName}</p>
                      <p className="variant">
                        {item.option1Value}
                        {item.option2Value && ` - ${item.option2Value}`}
                        {item.option3Value && ` - ${item.option3Value}`}
                      </p>
                      <p>
                        {item.quantity} x {item.price.toLocaleString()} ₫
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total">
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
