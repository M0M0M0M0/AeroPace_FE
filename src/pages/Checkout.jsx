import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import "./Checkout.css";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Nhận dữ liệu từ trang Cart (nếu có sử dụng luồng chọn sản phẩm trước đó)
  const selectedItemIds = location.state?.selectedItems || [];
  
  // Dùng logic cũ của bạn hoặc logic mới tùy dự án. Ở đây mình giữ theo code bạn gửi
  const cartItems = cart?.items || [];
  const totalPrice = cart?.totalAmount || 0;

  // --- THÊM STATE QUẢN LÝ ĐỊA CHỈ ---
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
    specificAddress: "", // Số nhà, ngõ, tên đường...
    paymentMethod: "cod",
  });

  // --- API LẤY ĐỊA GIỚI HÀNH CHÍNH VIỆT NAM ---
  // 1. Lấy danh sách Tỉnh/Thành phố
  useEffect(() => {
    axios.get("https://esgoo.net/api-tinhthanh/1/0.htm").then((res) => {
      if (res.data.error === 0) setProvinces(res.data.data);
    });
  }, []);

  // 2. Lấy Quận/Huyện khi Tỉnh/Thành thay đổi
  useEffect(() => {
    if (selectedProvince) {
      axios.get(`https://esgoo.net/api-tinhthanh/2/${selectedProvince}.htm`).then((res) => {
        if (res.data.error === 0) setDistricts(res.data.data);
      });
      setSelectedDistrict("");
      setWards([]);
    }
  }, [selectedProvince]);

  // 3. Lấy Phường/Xã khi Quận/Huyện thay đổi
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
        // Lưu ý: Vì địa chỉ từ DB là chuỗi dính liền, ta đưa tạm vào specificAddress
        specificAddress: data.address || "", 
      }));
      toast.success("Đã tải thông tin! Vui lòng chọn lại Tỉnh/Thành phố nếu cần.");
    } catch (err) {
      toast.error("Không lấy được thông tin khách hàng");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, specificAddress, paymentMethod } = form;

    // Kiểm tra đã nhập đủ chưa
    if (!name || !email || !phone || !specificAddress || !selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error("Vui lòng điền và chọn đầy đủ thông tin địa chỉ.");
      return;
    }

    // Lấy tên Tỉnh, Huyện, Xã từ ID để ghép thành chuỗi
    const provinceName = provinces.find(p => p.id === selectedProvince)?.full_name || "";
    const districtName = districts.find(d => d.id === selectedDistrict)?.full_name || "";
    const wardName = wards.find(w => w.id === selectedWard)?.full_name || "";

    // Ghép thành chuỗi địa chỉ hoàn chỉnh gửi xuống Backend
    const fullAddress = `${specificAddress}, ${wardName}, ${districtName}, ${provinceName}`;

    try {
      await axios.post(
        "http://localhost:8080/api/v1/orders/checkout",
        {
          userId: user.id,
          shippingAddress: fullAddress, // Gửi chuỗi đã ghép
          phoneNumber: phone,
          paymentMethod,
          receiverName: name,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      clearCart();
      navigate("/order-success", {
        state: {
          order: {
            customer: { name, email, phone, address: fullAddress },
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

            {/* Các trường cơ bản */}
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

            {/* KHU VỰC CHỌN ĐỊA CHỈ MỚI */}
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
                  value={selectedWard} 
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

            <button type="submit" className="checkout-submit-btn">
              Xác nhận đặt hàng
            </button>
          </form>

          {/* ORDER SUMMARY (Giữ nguyên của bạn) */}
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