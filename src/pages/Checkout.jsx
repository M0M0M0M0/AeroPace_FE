import React, { useState, useEffect, useCallback, useRef } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import "./Checkout.css";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
const GEO = "https://esgoo.net/api-tinhthanh";
const VAT_RATE = 0.1;
const stripePromise = loadStripe("pk_test_51TZrIzCOSfqKuHsnETgOAQYMnaJrRIOOxiwiuQ8GzZWXrCxZI7wnySO0jmwxkCqxSLEmJqClgWYqgD3CjwMsXRRN00mUzZnt6j");

const CheckoutForm = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stripe = useStripe();
  const elements = useElements();

  const [isDarkMode, setIsDarkMode] = React.useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

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

  // ─── Shipping Methods ────────────────────────────────────────────────────────
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(true);

  // ─── Form ────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specificAddress: "",
    paymentMethod: "stripe",
  });

  // ─── Payment ────────────────────────────────────────────────────────────────
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [isCardComplete, setIsCardComplete] = useState(false);

  // ─── Computed pricing ────────────────────────────────────────────────────────
  const shippingFee = selectedShipping ? Number(selectedShipping.fee) : 0;
  const vatAmount = Math.round(totalPrice * VAT_RATE);
  const grandTotal = totalPrice + vatAmount + shippingFee;

  // ─── Prevent double click ────────────────────────────────────────────────────────
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── 1. Load provinces once ──────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${GEO}/1/0.htm`).then((res) => {
      if (res.data.error === 0) setProvinces(res.data.data);
    });
  }, []);

  // ─── 2. Load shipping methods ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const res = await axios.get(`${API}/shipping-methods`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const active = res.data.filter((m) => m.status !== "INACTIVE");
        setShippingMethods(active);
        if (active.length > 0) setSelectedShipping(active[0]);
      } catch {
        toast.error("Không thể tải phương thức vận chuyển.");
      } finally {
        setLoadingShipping(false);
      }
    };
    fetchShipping();
  }, []);

  // ─── 3. Auto-fill profile AFTER provinces are ready ─────────────────────────
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
        // no profile → leave form empty
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user?.id]); // eslint-disable-line

  // ─── 4. Match province name → id once both are ready ─────────────────────────
  useEffect(() => {
    if (!profileInfo?.province || !provinces.length || useOtherAddress) return;
    const matched = provinces.find(
      (p) => p.full_name.toLowerCase() === profileInfo.province.toLowerCase()
    );
    if (matched) setSelectedProvince(matched.id);
  }, [profileInfo, provinces, useOtherAddress]);

  // ─── 5. Load districts when province changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedProvince) { setDistricts([]); setSelectedDistrict(""); setWards([]); return; }
    axios.get(`${GEO}/2/${selectedProvince}.htm`).then((res) => {
      if (res.data.error === 0) setDistricts(res.data.data);
    });
    setSelectedDistrict("");
    setWards([]);
  }, [selectedProvince]);

  // ─── 6. Match district name → id once districts are ready ────────────────────
  useEffect(() => {
    if (!profileInfo?.district || !districts.length || useOtherAddress) return;
    const matched = districts.find(
      (d) => d.full_name.toLowerCase() === profileInfo.district.toLowerCase()
    );
    if (matched) setSelectedDistrict(matched.id);
  }, [profileInfo, districts, useOtherAddress]);

  // ─── 7. Load wards when district changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedDistrict) { setWards([]); setSelectedWard(""); return; }
    axios.get(`${GEO}/3/${selectedDistrict}.htm`).then((res) => {
      if (res.data.error === 0) setWards(res.data.data);
    });
    setSelectedWard("");
  }, [selectedDistrict]);

  // ─── 8. Match ward name → id once wards are ready ────────────────────────────
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
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedWard("");
    }
  };

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
      toast.error("Please fill in all required fields.");
      return false;
    }
    if (useOtherAddress && (!selectedProvince || !selectedDistrict || !selectedWard)) {
      toast.error("Please select the full address details.");
      return false;
    }
    if (!selectedShipping) {
      toast.error("Please select a shipping method.");
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
          subtotal: totalPrice,
          vat: vatAmount,
          shippingFee,
          total: grandTotal,
          paymentMethod: method,
          shippingMethod: selectedShipping?.name,
          date: new Date().toLocaleString(),
        },
      },
    });
  };

  const buildOrderPayload = (paymentMethod, paymentOrderId = null) => ({
    userId: user.id,
    shippingAddress: form.specificAddress,
    phoneNumber: form.phone,
    paymentMethod,
    receiverName: form.name,
    ward: selectedWard ? wards.find((w) => w.id === selectedWard)?.full_name : profileInfo?.ward,
    district: selectedDistrict ? districts.find((d) => d.id === selectedDistrict)?.full_name : profileInfo?.district,
    province: selectedProvince ? provinces.find((p) => p.id === selectedProvince)?.full_name : profileInfo?.province,
    vat: vatAmount,
    shippingMethodId: selectedShipping?.id,
    ...(paymentOrderId && { paymentOrderId }),
  });

  const postOrder = (paymentMethod, paymentOrderId = null) =>
    axios.post(
      `${API}/orders/checkout`,
      buildOrderPayload(paymentMethod, paymentOrderId),
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

  const handleCardChange = (event) => {
  setIsCardComplete(event.complete);
  
  if (event.error) {
    console.log(event.error.message);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (form.paymentMethod === "stripe") {
        if (!stripe || !elements) {
          toast.error("Payment system Stripe is not ready.");
          return;
        }


        const intentRes = await axios.post(
          `${API}/orders/create-payment-intent`,
          {
            userId: user.id,
            shippingAddress: form.specificAddress,
            phoneNumber: form.phone,
            paymentMethod: "stripe",
            receiverName: form.name,
            ward: selectedWard ? wards.find(w => w.id === selectedWard)?.full_name : profileInfo?.ward,
            district: selectedDistrict ? districts.find(d => d.id === selectedDistrict)?.full_name : profileInfo?.district,
            province: selectedProvince ? provinces.find(p => p.id === selectedProvince)?.full_name : profileInfo?.province,
            vat: vatAmount,
            shippingMethodId: selectedShipping?.id,
            grandTotal: grandTotal,
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        const { clientSecret, orderId } = intentRes.data;

        // Xác nhận thẻ với Stripe
        const cardElement = elements.getElement(CardElement);
        const paymentResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: form.name,
              email: form.email,
              phone: form.phone,
            },
          },
        });

        if (paymentResult.error) {
          toast.error(`Payment failed: ${paymentResult.error.message}`);
          return;
        }

        if (paymentResult.paymentIntent.status !== "succeeded") {
          toast.error("Transaction via Stripe was not successful.");
          return;
        }

        // 
        await axios.patch(
          `${API}/orders/${orderId}/payment`,
          {
            paymentOrderId: paymentResult.paymentIntent.id,
            paymentTransactionId: paymentResult.paymentIntent.latest_charge, // ch_xxx
            paymentStatus: "PAID",
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        executeOrderSuccess(getFullAddress(), "stripe");
      }
    } catch (err) {
      toast.error("Failed to place the order.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // ─── PayPal ──────────────────────────────────────────────────────────────────
  const handleCreateOrder = async (_data, actions) => {
    const paypalOrderId = await actions.order.create({
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: (grandTotal / 25000).toFixed(2),
        },
      }],
    });
    try {
      const res = await postOrder("paypal", paypalOrderId);
      setPendingOrderId(res.data.id);
    } catch {
      toast.error("Failed to create order.");
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
      toast.error("Payment successful but failed to update order.");
    }
  };



  // ─── Guard ───────────────────────────────────────────────────────────────────
  if (!cartItems.length)
    return (
      <div className="checkout-empty">
        <p>Your cart is empty.</p>
      </div>
    );

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-section-title">Checkout</h1>

        <div className="checkout-grid">
          {/* ── FORM ─────────────────────────────────────────────────────── */}
          <form className="checkout-form" onSubmit={handleSubmit}>

            {/* ── THÔNG TIN NGƯỜI NHẬN ─────────────────────────────────── */}
            <div className="checkout-form-header">
              <h2>Receiver Information</h2>
              {loadingProfile ? (
                <span className="checkout-loading-text">Loading...</span>
              ) : !useOtherReceiver ? (
                <button type="button" className="checkout-use-info-btn" onClick={handleUseOtherReceiver}>
                  Other Receiver
                </button>
              ) : (
                <button type="button" className="checkout-use-info-btn" onClick={handleRevertReceiver}>
                  Use My Information
                </button>
              )}
            </div>

            <div className="checkout-form-grid">
              <input
                type="text"
                placeholder="Full Name"
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
                placeholder="Phone Number"
                value={form.phone}
                readOnly={!useOtherReceiver}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`checkout-input${!useOtherReceiver ? " checkout-input--readonly" : ""}`}
              />
            </div>

            {/* ── ĐỊA CHỈ NHẬN HÀNG ───────────────────────────────────── */}
            <div className="checkout-address-section">
              <div className="checkout-form-header">
                <h3>Delivery Address</h3>
                {!useOtherAddress ? (
                  <button type="button" className="checkout-use-info-btn" onClick={handleUseOtherAddress}>
                    Other Address
                  </button>
                ) : (
                  <button type="button" className="checkout-use-info-btn" onClick={handleRevertAddress}>
                    Use My Address
                  </button>
                )}
              </div>

              {useOtherAddress && (
                <div className="checkout-address-grid">
                  <select
                    className="checkout-select"
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                  >
                    <option value="">Province / City</option>
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
                    <option value="">District / Town</option>
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
                    <option value="">Ward / Commune</option>
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>{w.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                placeholder="House number, alley, street name..."
                value={form.specificAddress}
                readOnly={!useOtherAddress}
                onChange={(e) => setForm({ ...form, specificAddress: e.target.value })}
                className={`checkout-input checkout-input-full${!useOtherAddress ? " checkout-input--readonly" : ""}`}
              />

              {!useOtherAddress && profileInfo && (
                <p className="checkout-address-preview">
                  {[profileInfo.address, profileInfo.ward, profileInfo.district, profileInfo.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>

            {/* ── PHƯƠNG THỨC VẬN CHUYỂN ───────────────────────────────── */}
            <div className="checkout-shipping">
              <h3>Delivery Method</h3>
              {loadingShipping ? (
                <span className="checkout-loading-text">Loading...</span>
              ) : shippingMethods.length === 0 ? (
                <p className="checkout-no-shipping">No available delivery methods.</p>
              ) : (
                <div className="checkout-shipping-list">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`checkout-shipping-card${selectedShipping?.id === method.id ? " active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={selectedShipping?.id === method.id}
                        onChange={() => setSelectedShipping(method)}
                        className="checkout-shipping-radio"
                      />
                      <div className="checkout-shipping-info">
                        <span className="checkout-shipping-name">{method.name}</span>
                        <span className="checkout-shipping-fee">
                          {Number(method.fee) === 0 ? "Free" : `${Number(method.fee).toLocaleString()} ₫`}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── PHƯƠNG THỨC THANH TOÁN ────────────────────────────────── */}
            <div className="checkout-payment">
              <h3>Payment Method</h3>
              <div className="checkout-payment-grid">
                {[
                  { id: "stripe", label: "Pay with Stripe" },
                  { id: "paypal", label: "Pay with PayPal" },
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
            {/* ── NÚT XÁC NHẬN / STRIPE ─────────────────────────────────── */}
            {form.paymentMethod === "stripe" && (
              <div className="stripe-card-container">
                <label>Credit or debit card information</label>
                <CardElement
                onChange={handleCardChange}
                  options={{
                    style: {
                      base: {
                        color: isDarkMode ? "#e5e4e4" : "#111111", 
                        fontFamily: '"Inter", "Helvetica Neue", Helvetica, sans-serif', 
                        fontSize: "16px",
                        lineHeight: "32px",
                        letterSpacing: "0.025em",
                        "::placeholder": {
                          color: isDarkMode ? "#888888" : "#64748b"
                        },
                      },
                      invalid: {
                        color: "#ff4a4a",
                        iconColor: "#ff4a4a",
                      },
                    },
                  }}
                />
              </div>
            )}

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
                      toast.error("Error processing PayPal payment.");
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            ) : (
              <button
                type="submit"
                className="checkout-submit-btn"
                disabled={isSubmitting || (form.paymentMethod === "stripe" && !isCardComplete)}
                title={
                form.paymentMethod === "stripe" && !isCardComplete 
                ? "Please complete your Stripe card information." 
                : ""
                }
              >
                {isSubmitting ? "Processing..." : "Confirm Order"}
              </button>
            )}
          </form>

          {/* ── ORDER SUMMARY ─────────────────────────────────────────────── */}
          <div className="checkout-summary">
            <h2>Your Order</h2>
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

            {/* ── PRICE BREAKDOWN ───────────────────────────────────────── */}
            <div className="checkout-price-breakdown">
              <div className="checkout-price-row">
                <span>Subtotal</span>
                <span>{totalPrice.toLocaleString()} ₫</span>
              </div>
              <div className="checkout-price-row">
                <span>Shipping Fee</span>
                <span>
                  {shippingFee === 0
                    ? <span className="checkout-free-tag">Free</span>
                    : `${shippingFee.toLocaleString()} ₫`}
                </span>
              </div>
              <div className="checkout-price-row">
                <span>VAT (10%)</span>
                <span>{vatAmount.toLocaleString()} ₫</span>
              </div>
              <div className="checkout-price-divider" />
              <div className="checkout-total">
                <h3>Grand Total</h3>
                <p className="checkout-grand-total">{grandTotal.toLocaleString()} ₫</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout;