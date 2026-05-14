import React, { useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom"; // Thêm useLocation
import { toast } from "sonner";
import axios from "axios";
import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Lấy data từ route navigation
  const [loadingProfile, setLoadingProfile] = useState(false);

  // 1. Nhận danh sách ID sản phẩm đã chọn từ trang Cart
  const selectedItemIds = location.state?.selectedItems || [];

  // 2. Lọc ra các sản phẩm nằm trong danh sách được chọn
  const checkoutItems = useMemo(() => {
    if (!cart?.items) return [];
    return cart.items.filter((item) => selectedItemIds.includes(item.cartItemId));
  }, [cart?.items, selectedItemIds]);

  // 3. Tính lại tổng tiền cho các sản phẩm này
  const totalPrice = useMemo(() => {
    return checkoutItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [checkoutItems]);

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
          // QUAN TRỌNG: Gửi kèm danh sách các cartItemId lên BE để BE biết chỉ tạo đơn cho những item này
          cartItemIds: selectedItemIds 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // LƯU Ý: Nếu trước đây clearCart() xóa TOÀN BỘ giỏ hàng ở Frontend, 
      // bạn có thể cần tạo thêm 1 hàm removeSelectedItems(selectedItemIds) trong CartContext 
      // hoặc đơn giản là gọi hàm fetch lại giỏ hàng từ BE (vì BE đã trừ đi những item vừa mua).
      // Tạm thời giữ nguyên logic của bạn:
      clearCart(); 

      navigate("/order-success", {
        state: {
          order: {
            customer: { name, email, phone, address },
            items: checkoutItems, // Truyền các item ĐÃ MUA sang trang success
            total: totalPrice, // Truyền TỔNG TIỀN MỚI
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

  // Nếu không có sản phẩm nào được chọn (người dùng cố tình vào link /checkout)
  if (!checkoutItems.length)
    return (
      <div className="checkout-empty">
        <p>Không có sản phẩm nào để thanh toán.</p>
        <button className="cart-page-btn" onClick={() => navigate("/cart")}>
          Quay lại giỏ hàng
        </button>
      </div>
    );

  return (
    <div className="checkout-page">
      <div className="cart-container">
        <h1 className="cart-section-title">Thanh toán</h1>

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

            <button type="submit" className="cart-checkout-btn">
              Xác nhận thanh toán
            </button>
          </form>

          {/* ORDER */}
          <div className="checkout-summary">
            <h2>Đơn hàng của bạn</h2>

            <div className="checkout-items">
              {checkoutItems.map((item) => ( // Render danh sách đã lọc
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