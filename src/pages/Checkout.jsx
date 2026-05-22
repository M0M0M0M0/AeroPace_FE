import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import "./Checkout.css";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API = "http://localhost:8080/api/v1";
const GEO = "https://esgoo.net/api-tinhthanh";

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = cart?.items || [];
  const totalPrice = cart?.totalAmount || 0;

  // ─── Geo data ───────────────────────────────────────────────────────────────
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  // ─── Profile & UI state ──────────────────────────────────────────────────────
  const [profileInfo, setProfileInfo] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [useOtherReceiver, setUseOtherReceiver] = useState(false);
  const [useOtherAddress, setUseOtherAddress] = useState(false);

  // ─── Form ────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specificAddress: "",
    paymentMethod: "cod",
  });
  // ─── Payment ────────────────────────────────────────────────────────────────────
  const [pendingOrderId, setPendingOrderId] = useState(null);

  // ─── 1. Load provinces once ──────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${GEO}/1/0.htm`).then((res) => {
      if (res.data.error === 0) setProvinces(res.data.data);
    });
  }, []);

  // ─── 2. Auto-fill profile AFTER provinces are ready ─────────────────────────
  // We split into two effects so we can react once provinces array is populated.
  useEffect(() => {
    if (!user?.id) { setLoadingProfile(false); return; }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/customer-profiles/user/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProfileInfo(res.data);
        setForm((prev) => ({
          ...prev,
          name: res.data.fullName || "",
          phone: res.data.phoneNumber || "",
          email: res.data.email || user.email || "",
          specificAddress: res.data.address || "",
        }));
      } catch {
        // no profile → leave form empty, user fills manually
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.id]); // eslint-disable-line

  // ─── 3. Match province name → id once both are ready ─────────────────────────
  useEffect(() => {
    if (!profileInfo?.province || !provinces.length || useOtherAddress) return;
    const matched = provinces.find(
      (p) => p.full_name.toLowerCase() === profileInfo.province.toLowerCase()
    );
    if (matched) setSelectedProvince(matched.id);
  }, [profileInfo, provinces, useOtherAddress]);

  // ─── 4. Load districts when province changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedProvince) { setDistricts([]); setSelectedDistrict(""); setWards([]); return; }
    axios.get(`${GEO}/2/${selectedProvince}.htm`).then((res) => {
      if (res.data.error === 0) setDistricts(res.data.data);
    });
    setSelectedDistrict("");
    setWards([]);
  }, [selectedProvince]);

  // ─── 5. Match district name → id once districts are ready ────────────────────
  useEffect(() => {
    if (!profileInfo?.district || !districts.length || useOtherAddress) return;
    const matched = districts.find(
      (d) => d.full_name.toLowerCase() === profileInfo.district.toLowerCase()
    );
    if (matched) setSelectedDistrict(matched.id);
  }, [profileInfo, districts, useOtherAddress]);

  // ─── 6. Load wards when district changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedDistrict) { setWards([]); setSelectedWard(""); return; }
    axios.get(`${GEO}/3/${selectedDistrict}.htm`).then((res) => {
      if (res.data.error === 0) setWards(res.data.data);
    });
    setSelectedWard("");
  }, [selectedDistrict]);

  // ─── 7. Match ward name → id once wards are ready ────────────────────────────
  useEffect(() => {
    if (!profileInfo?.ward || !wards.length || useOtherAddress) return;
    const matched = wards.find(
      (w) => w.full_name.toLowerCase() === profileInfo.ward.toLowerCase()
    );
    if (matched) setSelectedWard(matched.id);
  }, [profileInfo, wards, useOtherAddress]);

  // ─── Toggle: Receiver ────────────────────────────────────────────────────────
  const handleUseOtherReceiver = () => {
    setUseOtherReceiver(true);
    setForm((prev) => ({ ...prev, name: "", phone: "", email: "" }));
  };

  const handleRevertReceiver = () => {
    setUseOtherReceiver(false);
    if (profileInfo) {
      setForm((prev) => ({
        ...prev,
        name: profileInfo.fullName || "",
        phone: profileInfo.phoneNumber || "",
        email: profileInfo.email || user.email || "",
      }));
    }
  };

  // ─── Toggle: Address ─────────────────────────────────────────────────────────
  const handleUseOtherAddress = () => {
    setUseOtherAddress(true);
    setForm((prev) => ({ ...prev, specificAddress: "" }));
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedWard("");
  };

  const handleRevertAddress = () => {
    setUseOtherAddress(false);
    if (profileInfo) {
      setForm((prev) => ({ ...prev, specificAddress: profileInfo.address || "" }));
      // Re-trigger geo match chain by resetting; effects will re-run
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedWard("");
    }
  };

  // After revert, re-run province matching
  useEffect(() => {
    if (!useOtherAddress && profileInfo?.province && provinces.length) {
      const matched = provinces.find(
        (p) => p.full_name.toLowerCase() === profileInfo.province.toLowerCase()
      );
      if (matched) setSelectedProvince(matched.id);
    }
  }, [useOtherAddress]); // eslint-disable-line

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getFullAddress = useCallback(() => {
    const provinceName = provinces.find((p) => p.id === selectedProvince)?.full_name || profileInfo?.province || "";
    const districtName = districts.find((d) => d.id === selectedDistrict)?.full_name || profileInfo?.district || "";
    const wardName = wards.find((w) => w.id === selectedWard)?.full_name || profileInfo?.ward || "";
    return [form.specificAddress, wardName, districtName, provinceName].filter(Boolean).join(", ");
  }, [provinces, districts, wards, selectedProvince, selectedDistrict, selectedWard, form.specificAddress, profileInfo]);

  const validateForm = () => {
    const { name, email, phone, specificAddress } = form;
    if (!name || !email || !phone || !specificAddress) {
      toast.error("Vui lòng điền đầy đủ thông tin người nhận.");
      return false;
    }
    if (useOtherAddress && (!selectedProvince || !selectedDistrict || !selectedWard)) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh / Huyện / Xã.");
      return false;
    }
    return true;
  };

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

  const postOrder = (paymentMethod, paymentOrderId = null) =>
    axios.post(
      `${API}/orders/checkout`,
      {
        userId: user.id,
        shippingAddress: form.specificAddress,
        phoneNumber: form.phone,
        paymentMethod,
        receiverName: form.name,
        ward: selectedWard ? wards.find(w => w.id === selectedWard)?.full_name : profileInfo?.ward,
        district: selectedDistrict ? districts.find(d => d.id === selectedDistrict)?.full_name : profileInfo?.district,
        province: selectedProvince ? provinces.find(p => p.id === selectedProvince)?.full_name : profileInfo?.province,
        ...(paymentOrderId && { paymentOrderId }),
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await postOrder(form.paymentMethod);
      executeOrderSuccess(getFullAddress(), form.paymentMethod);
    } catch {
      toast.error("Đặt hàng thất bại.");
    }
  };

  // ─── PayPal ──────────────────────────────────────────────────────────────────
  const handleCreateOrder = async (_data, actions) => {
    const paypalOrderId = await actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: (totalPrice / 25000).toFixed(2)
        }
      }],
    });
    try {
      const res = await postOrder("paypal", paypalOrderId);
      setPendingOrderId(res.data.id); // lưu orderId be
    } catch {
      toast.error("Không thể tạo đơn hàng.");
      throw new Error("abort");
    }

    return paypalOrderId;
  };


  const handlePayPalApprove = async (_data, actions) => {
    const details = await actions.order.capture();

    const transactionId = details.purchase_units[0].payments.captures[0].id;
    const paypalOrderId = details.id;

    try {
      await axios.patch(
        `${API}/orders/${pendingOrderId}/payment`,
        {
          paymentOrderId: paypalOrderId,
          paymentTransactionId: transactionId,
          paymentStatus: "PAID",
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      executeOrderSuccess(getFullAddress(), "paypal");
    } catch {
      toast.error("Thanh toán thành công nhưng cập nhật đơn hàng thất bại.");
    }
  };

  // ─── Guard ───────────────────────────────────────────────────────────────────
  if (!cartItems.length)
    return (
      <div className="checkout-empty">
        <p>Giỏ hàng trống.</p>
        <button className="checkout-btn" onClick={() => navigate("/products")}>
          Quay lại cửa hàng
        </button>
      </div>
    );

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="section-title">Thanh toán</h1>

        <div className="checkout-grid">
          {/* ── FORM ─────────────────────────────────────────────────────── */}
          <form className="checkout-form" onSubmit={handleSubmit}>

            {/* ── THÔNG TIN NGƯỜI NHẬN ─────────────────────────────────── */}
            <div className="checkout-form-header">
              <h2>Thông tin người nhận</h2>
              {loadingProfile ? (
                <span className="checkout-loading-text">Đang tải...</span>
              ) : !useOtherReceiver ? (
                <button type="button" className="checkout-use-info-btn" onClick={handleUseOtherReceiver}>
                  Người nhận khác
                </button>
              ) : (
                <button type="button" className="checkout-use-info-btn" onClick={handleRevertReceiver}>
                  Dùng thông tin của tôi
                </button>
              )}
            </div>

            <div className="checkout-form-grid">
              <input
                type="text"
                placeholder="Họ và tên"
                value={form.name}
                readOnly={!useOtherReceiver}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`checkout-input${!useOtherReceiver ? " checkout-input--readonly" : ""}`}
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                readOnly={!useOtherReceiver}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`checkout-input${!useOtherReceiver ? " checkout-input--readonly" : ""}`}
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={form.phone}
                readOnly={!useOtherReceiver}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`checkout-input${!useOtherReceiver ? " checkout-input--readonly" : ""}`}
              />
            </div>

            {/* ── ĐỊA CHỈ NHẬN HÀNG ───────────────────────────────────── */}
            <div className="checkout-address-section">
              <div className="checkout-form-header">
                <h3>Địa chỉ nhận hàng</h3>
                {!useOtherAddress ? (
                  <button type="button" className="checkout-use-info-btn" onClick={handleUseOtherAddress}>
                    Địa chỉ khác
                  </button>
                ) : (
                  <button type="button" className="checkout-use-info-btn" onClick={handleRevertAddress}>
                    Dùng địa chỉ của tôi
                  </button>
                )}
              </div>

              {/* Dropdown chỉ hiện khi chọn địa chỉ khác */}
              {useOtherAddress && (
                <div className="checkout-address-grid">
                  <select
                    className="checkout-select"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                  >
                    <option value="">Tỉnh / Thành phố</option>
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
                    <option value="">Quận / Huyện</option>
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
                    <option value="">Phường / Xã</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Địa chỉ cụ thể: readonly khi dùng địa chỉ profile, editable khi chọn khác */}
              <input
                type="text"
                placeholder="Số nhà, ngõ, tên đường..."
                value={form.specificAddress}
                readOnly={!useOtherAddress}
                onChange={(e) => setForm({ ...form, specificAddress: e.target.value })}
                className={`checkout-input checkout-input-full${!useOtherAddress ? " checkout-input--readonly" : ""}`}
              />

              {/* Hiển thị địa chỉ đầy đủ từ profile (preview) */}
              {!useOtherAddress && profileInfo && (
                <p className="checkout-address-preview">
                  {[profileInfo.address, profileInfo.ward, profileInfo.district, profileInfo.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>

            {/* ── PHƯƠNG THỨC THANH TOÁN ────────────────────────────────── */}
            <div className="checkout-payment">
              <h3>Phương thức thanh toán</h3>
              <div className="checkout-payment-grid">
                {[
                  { id: "stripe", label: "Thanh toán qua Stripe" },
                  { id: "paypal", label: "Thanh toán qua PayPal" },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`checkout-payment-card${form.paymentMethod === m.id ? " active" : ""}`}
                    onClick={() => setForm({ ...form, paymentMethod: m.id })}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── NÚT XÁC NHẬN / PAYPAL ─────────────────────────────────── */}
            {form.paymentMethod === "paypal" ? (
              <div style={{ marginTop: "20px" }}>
                <PayPalScriptProvider
                  options={{
                    "client-id": "AbmysnbLGLU6VbeC4XPSpPOhxZ4ITh0DMOwhWDMdS54farre2EGHRsxswr_3R9ujfBiStBzgsrIP7qO5",
                    currency: "USD",
                    "disable-funding": "card",
                  }}
                >
                  <PayPalButtons
                    style={{ layout: "vertical" }}
                    onClick={(_data, actions) => {
                      if (!validateForm()) return actions.reject();
                    }}
                    createOrder={handleCreateOrder}
                    onApprove={handlePayPalApprove}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
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

          {/* ── ORDER SUMMARY ─────────────────────────────────────────────── */}
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