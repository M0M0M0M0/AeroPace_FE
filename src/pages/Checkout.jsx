import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import "./Checkout.css";
// --- 1. IMPORT THƯ VIỆN PAYPAL ---
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingProfile, setLoadingProfile] = useState(false);

  const selectedItemIds = location.state?.selectedItems || [];
  const cartItems = cart?.items || [];
  const totalPrice = cart?.totalAmount || 0;

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specificAddress: "", 
    paymentMethod: "cod",
  });

  // API lấy địa giới hành chính
  useEffect(() => {
    axios.get("https://esgoo.net/api-tinhthanh/1/0.htm").then((res) => {
      if (res.data.error === 0) setProvinces(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      axios.get(`https://esgoo.net/api-tinhthanh/2/${selectedProvince}.htm`).then((res) => {
        if (res.data.error === 0) setDistricts(res.data.data);
      });
      setSelectedDistrict("");
      setWards([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      axios.get(`https://esgoo.net/api-tinhthanh/3/${selectedDistrict}.htm`).then((res) => {
        if (res.data.error === 0) setWards(res.data.data);
      });
      setSelectedWard("");
    }
  }, [selectedDistrict]);

  const handleUseMyInfo = async () => {
    if (!user?.id) return;
    try {
      setLoadingProfile(true);
      const res = await axios.get(
        `http://localhost:8080/api/v1/customer-profiles/user/${user.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = res.data;
      setForm((prev) => ({
        ...prev,
        name: data.fullName || "",
        phone: data.phoneNumber || "",
        email: data.email || user.email || "",
        specificAddress: data.address || "", 
      }));
      toast.success("Đã tải thông tin! Vui lòng chọn lại Tỉnh/Thành phố nếu cần.");
    } catch (err) {
      toast.error("Không lấy được thông tin khách hàng");
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- HÀM KIỂM TRA FORM HỢP LỆ ---
  const validateForm = () => {
    const { name, email, phone, specificAddress } = form;
    if (!name || !email || !phone || !specificAddress || !selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error("Vui lòng điền và chọn đầy đủ thông tin địa chỉ.");
      return false;
    }
    return true;
  };

  // --- HÀM GHÉP ĐỊA CHỈ HOÀN CHỈNH ---
  const getFullAddress = () => {
    const provinceName = provinces.find(p => p.id === selectedProvince)?.full_name || "";
    const districtName = districts.find(d => d.id === selectedDistrict)?.full_name || "";
    const wardName = wards.find(w => w.id === selectedWard)?.full_name || "";
    return `${form.specificAddress}, ${wardName}, ${districtName}, ${provinceName}`;
  };

  // --- XỬ LÝ ĐẶT HÀNG CHO COD HOẶC BANK (Form Submit truyền thống) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fullAddress = getFullAddress();

    try {
      await axios.post(
        "http://localhost:8080/api/v1/orders/checkout",
        {
          userId: user.id,
          shippingAddress: fullAddress, 
          phoneNumber: form.phone,
          paymentMethod: form.paymentMethod,
          receiverName: form.name,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      executeOrderSuccess(fullAddress, form.paymentMethod);
    } catch (err) {
      toast.error("Đặt hàng thất bại.");
    }
  };

  // --- CHUYỂN HƯỚNG KHI THÀNH CÔNG (Dùng chung cho cả 2 luồng) ---
  const executeOrderSuccess = (fullAddress, method) => {
    clearCart();
    navigate("/order-success", {
      state: {
        order: {
          customer: { name: form.name, email: form.email, phone: form.phone, address: fullAddress },
          items: cartItems,
          total: totalPrice,
          paymentMethod: method,
          date: new Date().toLocaleString(),
        },
      },
    });
    toast.success("Đặt hàng thành công!");
  };

  // --- LOGIC XỬ LÝ PAYPAL ---
  const handleCreateOrder = (data, actions) => {
    // PayPal tính theo USD, đổi tạm VND sang USD (ví dụ chia 25,000đ)
    const amountInUSD = (totalPrice / 25000).toFixed(2); 

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amountInUSD,
          },
        },
      ],
    });
  };

  const handlePayPalApprove = async (data, actions) => {
    return actions.order.capture().then(async (details) => {
      const fullAddress = getFullAddress();
      try {
        // Sau khi khách trả tiền trên PayPal thành công, tiến hành tạo đơn ở Backend
        await axios.post(
          "http://localhost:8080/api/v1/orders/checkout",
          {
            userId: user.id,
            shippingAddress: fullAddress,
            phoneNumber: form.phone,
            paymentMethod: "paypal", // Lưu phương thức là paypal
            receiverName: form.name,
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        executeOrderSuccess(fullAddress, "paypal");
      } catch (err) {
        toast.error("Thanh toán PayPal thành công nhưng không thể tạo đơn hàng trên hệ thống.");
      }
    });
  };

  if (!cartItems.length)
    return (
      <div className="checkout-empty">
        <p>Giỏ hàng trống.</p>
        <button className="checkout-btn" onClick={() => navigate("/products")}>
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
              <input
                type="text"
                placeholder="Họ và tên"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="checkout-input"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="checkout-input"
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="checkout-input"
              />
            </div>

            <div className="checkout-address-section">
              <h3>Địa chỉ nhận hàng</h3>
              <div className="checkout-address-grid">
                <select 
                  className="checkout-select" 
                  value={selectedProvince} 
                  onChange={(e) => setSelectedProvince(e.target.value)}
                >
                  <option value="">Tỉnh/Thành phố</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>

                <select 
                  className="checkout-select" 
                  value={selectedDistrict} 
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedProvince}
                >
                  <option value="">Quận/Huyện</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>

                <select 
                  className="checkout-select" 
                  value={selectedDistrict ? selectedWard : ""} 
                  onChange={(e) => setSelectedWard(e.target.value)}
                  disabled={!selectedDistrict}
                >
                  <option value="">Phường/Xã</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.full_name}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Số nhà, ngõ, tên đường..."
                value={form.specificAddress}
                onChange={(e) => setForm({ ...form, specificAddress: e.target.value })}
                className="checkout-input checkout-input-full"
              />
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="checkout-payment">
              <h3>Phương thức thanh toán</h3>
              <div className="checkout-payment-grid">
                {[
                  { id: "cod", label: "Thanh toán khi nhận hàng (COD)" },
                  { id: "bank", label: "Chuyển khoản ngân hàng" },
                  { id: "paypal", label: "Thanh toán qua PayPal (Giả lập)" }, // Đã thêm nút lựa chọn này
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`checkout-payment-card ${form.paymentMethod === m.id ? "active" : ""}`}
                    onClick={() => setForm({ ...form, paymentMethod: m.id })}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* --- 3. ĐIỀU KIỆN HIỂN THỊ NÚT BẤM THANH TOÁN --- */}
            {form.paymentMethod === "paypal" ? (
              <div style={{ marginTop: "20px" }}>
                <PayPalScriptProvider options={{ "client-id": "AbmysnbLGLU6VbeC4XPSpPOhxZ4ITh0DMOwhWDMdS54farre2EGHRsxswr_3R9ujfBiStBzgsrIP7qO5", currency: "USD" }}>
                  <PayPalButtons
                    style={{ layout: "vertical" }}
                    onClick={(data, actions) => {
                      // Bấm vào nút PayPal sẽ check form trước, nếu thiếu thông tin thì chặn không mở popup
                      if (!validateForm()) {
                        return actions.reject();
                      }
                    }}
                    createOrder={handleCreateOrder}
                    onApprove={handlePayPalApprove}
                    onError={(err) => {
                      console.error("PayPal Error: ", err);
                      toast.error("Lỗi trong quá trình xử lý PayPal.");
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            ) : (
              <button type="submit" className="checkout-submit-btn">
                Xác nhận đặt hàng
              </button>
            )}
          </form>

          {/* ORDER SUMMARY */}
          <div className="checkout-summary">
            <h2>Đơn hàng của bạn</h2>
            <div className="checkout-items">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="checkout-item">
                  <div className="checkout-item-left">
                    <img src={item.image} alt={item.productName} />
                    <div>
                      <p>{item.productName}</p>
                      <p className="checkout-variant">{item.option1Value}</p>
                      <p>{item.quantity} x {item.price.toLocaleString()} ₫</p>
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