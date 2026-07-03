import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import axiosRaw from "axios";
import QuickReviewModal from "../components/QuickReviewModal";
import { uploadImage } from "../api/uploadImage";
import { formatUSD } from "../utils/currency";
import {
  User,
  Package,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Save,
  ArrowRight,
  Camera,
} from "lucide-react";

import "./Profile.css";

// ── Vietnamese admin name → English ──────────────────────────────
const removeDiacritics = (str) =>
  str.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

const VI_PREFIXES = [
  ["Thành phố", "City"],
  ["Tỉnh", "Province"],
  ["Thị xã", "Town"],
  ["Thị trấn", "Township"],
  ["Quận", "District"],
  ["Huyện", "District"],
  ["Phường", "Ward"],
  ["Xã", "Commune"],
];

const toEnglishAdmin = (name) => {
  if (!name) return name;
  for (const [prefix, suffix] of VI_PREFIXES) {
    if (name.startsWith(prefix + " ") || name === prefix) {
      const rest = removeDiacritics(name.slice(prefix.length).trim());
      // Số (Quận 1, Phường 5) → "District 1", "Ward 5"
      return /^\d+$/.test(rest) ? `${suffix} ${rest}` : rest ? `${rest} ${suffix}` : suffix;
    }
  }
  return removeDiacritics(name);
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [activeTab, setActiveTab] = useState(location.state?.tab || "info");

  const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/customer-profiles`;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    dob: "",
    gender: "",
    address: "",
    ward: "",
    district: "",
    province: "",
    avatarUrl: "",
  });

  const [profileId, setProfileId] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [orderReviews, setOrderReviews] = useState({});

  // ── Review modal ──────────────────────────────────────────────
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    axiosRaw.get("https://esgoo.net/api-tinhthanh/1/0.htm").then((res) => {
      if (res.data.error === 0) setProvinces(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      axiosRaw
        .get(`https://esgoo.net/api-tinhthanh/2/${selectedProvince}.htm`)
        .then((res) => {
          if (res.data.error === 0) setDistricts(res.data.data);
        });
      setSelectedDistrict("");
      setWards([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      axiosRaw
        .get(`https://esgoo.net/api-tinhthanh/3/${selectedDistrict}.htm`)
        .then((res) => {
          if (res.data.error === 0) setWards(res.data.data);
        });
      setSelectedWard("");
    }
  }, [selectedDistrict]);

  // Auto-restore selectedProvince khi provinces load và đã có địa chỉ lưu
  useEffect(() => {
    if (!provinces.length || !formData.province || selectedProvince) return;
    const match = provinces.find(
      (p) => toEnglishAdmin(p.full_name) === formData.province
    );
    if (match) setSelectedProvince(match.id);
  }, [provinces, formData.province]);

  // Auto-restore selectedDistrict khi districts load
  useEffect(() => {
    if (!districts.length || !formData.district || selectedDistrict) return;
    const match = districts.find(
      (d) => toEnglishAdmin(d.full_name) === formData.district
    );
    if (match) setSelectedDistrict(match.id);
  }, [districts, formData.district]);

  // Auto-restore selectedWard khi wards load
  useEffect(() => {
    if (!wards.length || !formData.ward || selectedWard) return;
    const match = wards.find(
      (w) => toEnglishAdmin(w.full_name) === formData.ward
    );
    if (match) setSelectedWard(match.id);
  }, [wards, formData.ward]);

  const fetchOrders = useCallback(async (signal) => {
    try {
      if (!user?.id) return;
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/user/${user.id}`,
        { signal }
      );
      setOrders(res.data);

      const completed = res.data.filter((o) => o.status === "COMPLETED");
      if (completed.length > 0) {
        const map = {};
        await Promise.all(
          completed.map(async (o) => {
            try {
              const rv = await axios.get(`/reviews/my-order/${o.orderCode}`, {
                signal,
              });
              if (rv.data.length > 0) map[o.orderCode] = rv.data;
            } catch {}
          })
        );
        setOrderReviews(map);
      }
    } catch (err) {
      if (err.name !== "CanceledError") console.log("LOAD ORDERS ERROR:", err);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === "orders") {
      fetchOrders(controller.signal);
    }
    return () => controller.abort();
  }, [activeTab, fetchOrders]);

  // Refetch khi tab trình duyệt được focus lại (vd. admin vừa đổi trạng thái order ở tab khác)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && activeTab === "orders") {
        fetchOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.id) return;
        const res = await axios.get(`${API_URL}/user/${user.id}`);
        const data = res.data;
        setProfileId(data.id);
        setFormData({
          name: data.fullName || "",
          email: data.email || user?.email || "",
          phone_number: data.phoneNumber || "",
          dob: data.dob || "",
          gender: data.gender || "",
          address: data.address || "",
          ward: toEnglishAdmin(data.ward || ""),
          district: toEnglishAdmin(data.district || ""),
          province: toEnglishAdmin(data.province || ""),
          avatarUrl: data.avatarUrl || "",
        });
      } catch (err) {
        console.log("LOAD PROFILE ERROR:", err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const phoneRegex = /^[0-9]+$/;
    if (formData.phone_number && !phoneRegex.test(formData.phone_number)) {
      alert("Phone number must contain only digits!");
      return;
    }
    if (formData.dob) {
      const today = new Date();
      const inputDate = new Date(formData.dob);
      if (inputDate >= today) {
        alert("Date of birth must be in the past!");
        return;
      }
    }
    if (!profileId) {
      alert("No profile found to update!");
      return;
    }
    try {
      await axios.put(`${API_URL}/${profileId}`, {
        fullName: formData.name,
        phoneNumber: formData.phone_number,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        ward:
          toEnglishAdmin(wards.find((w) => w.id === selectedWard)?.full_name) || formData.ward,
        district:
          toEnglishAdmin(districts.find((d) => d.id === selectedDistrict)?.full_name) ||
          formData.district,
        province:
          toEnglishAdmin(provinces.find((p) => p.id === selectedProvince)?.full_name) ||
          formData.province,
        avatarUrl: formData.avatarUrl,
        userId: user.id,
      });
      alert("Update successful!");
    } catch (err) {
      console.log("UPDATE ERROR:", err.response?.data || err);
      alert("Update failed!");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profileId) return;

    setAvatarUploading(true);
    try {
      const avatarUrl = await uploadImage(file, "avatar");
      await axios.put(`${API_URL}/${profileId}`, {
        fullName: formData.name,
        phoneNumber: formData.phone_number,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        ward: formData.ward,
        district: formData.district,
        province: formData.province,
        avatarUrl,
        userId: user.id,
      });
      setFormData((prev) => ({ ...prev, avatarUrl }));
    } catch (err) {
      console.log("AVATAR UPLOAD ERROR:", err.response?.data || err);
      alert("Failed to update avatar!");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ── Confirm received → update local state → open review modal ─
  const handleConfirmReceived = async (orderCode) => {
    setConfirmingOrder(orderCode);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/${orderCode}/confirm`
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.orderCode === orderCode ? { ...o, status: "COMPLETED" } : o
        )
      );
      const completedOrder = orders.find((o) => o.orderCode === orderCode);
      if (completedOrder) setReviewOrder({ ...completedOrder, status: "COMPLETED" });
    } catch (err) {
      console.log("CONFIRM RECEIVED ERROR:", err.response || err);
      alert("Failed to confirm receipt, please try again.");
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleViewDetail = (order) => {
    navigate(`/order-detail/${order.orderCode}`, {
      state: { order, fromTab: "orders" },
    });
  };

  const getStatusLabel = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return "Waiting for refund";
    switch (order.status) {
      case "PENDING": return "Waiting for confirmation";
      case "PAID": return "Paid";
      case "SHIPPING": return "Shipping";
      case "DELIVERED": return "Delivered";
      case "COMPLETED": return "Completed";
      case "CANCELLED": return "Cancelled";
      default: return order.status;
    }
  };

  const getStatusColor = (order) => {
    if (order.paymentStatus === "REFUND_PENDING")
      return { bg: "rgba(251,146,60,0.2)", color: "#fb923c" };
    switch (order.status) {
      case "PAID": return { bg: "rgba(96,165,250,0.2)", color: "#60a5fa" };
      case "SHIPPING": return { bg: "rgba(251,146,60,0.2)", color: "#fb923c" };
      case "DELIVERED": return { bg: "rgba(74,222,128,0.2)", color: "#4ade80" };
      case "COMPLETED": return { bg: "rgba(74,222,128,0.2)", color: "#4ade80" };
      case "CANCELLED": return { bg: "rgba(248,113,113,0.2)", color: "#f87171" };
      case "PENDING": return { bg: "rgba(156,163,175,0.2)", color: "#9ca3af" };
      default: return { bg: "#333", color: "#e5e4e4" };
    }
  };

  const PREVIEW_LIMIT = 3;

  const truncateWords = (text, maxWords) => {
    if (!text) return "";
    const words = text.split(" ");
    return words.length <= maxWords ? text : words.slice(0, maxWords).join(" ") + "...";
  };

  const MiniStars = ({ rating }) => {
    const val = parseFloat(rating) || 0;
    return (
      <span className="profile-review-mini-stars">
        {[1, 2, 3, 4, 5].map((i) => {
          let cls = "profile-review-mini-star";
          if (val >= i) cls += " profile-review-mini-star--full";
          else if (val >= i - 0.5) cls += " profile-review-mini-star--half";
          else cls += " profile-review-mini-star--empty";
          return <span key={i} className={cls}>★</span>;
        })}
        <span className="profile-review-mini-rating">{val.toFixed(1)}</span>
      </span>
    );
  };

  const renderOrderCard = (order) => {
    const statusStyle = getStatusColor(order);
    const items = order.items || [];
    const previewItems = items.slice(0, PREVIEW_LIMIT);
    const extraCount = items.length - PREVIEW_LIMIT;

    return (
      <div key={order.orderCode} className="profile-order-card">
        {/* Header */}
        <div className="profile-order-card-header">
          <div className="profile-order-header-left">
            <span className="profile-order-id">#{order.orderCode}</span>
            <span className="profile-order-date">
              {new Date(order.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <span
            className="profile-order-status"
            style={{ background: statusStyle.bg, color: statusStyle.color }}
          >
            {getStatusLabel(order)}
          </span>
        </div>

        {/* Items preview */}
        {previewItems.length > 0 && (
          <div className="profile-order-items-preview">
            {previewItems.map((item, idx) => (
              <div key={idx} className="profile-order-preview-row">
                <div className="profile-order-preview-img-wrap">
                  {item.productImgUrl ? (
                    <img
                      src={item.productImgUrl}
                      alt={item.productName}
                      className="profile-order-preview-img"
                    />
                  ) : (
                    <div className="profile-order-preview-img-placeholder">
                      <Package size={16} color="#555" />
                    </div>
                  )}
                </div>
                <span className="profile-order-preview-name">{item.productName}</span>
                <span className="profile-order-preview-qty">x{item.quantity}</span>
                <span className="profile-order-preview-price">
                  {formatUSD(item.price)}
                </span>
              </div>
            ))}
            {extraCount > 0 && (
              <p className="profile-order-more">+{extraCount} other products...</p>
            )}
          </div>
        )}

        {/* Review snippet for COMPLETED orders */}
        {order.status === "COMPLETED" && orderReviews[order.orderCode]?.length > 0 && (
          <div className="profile-review-snippet">
            {orderReviews[order.orderCode].slice(0, 1).map((rv) => (
              <div key={rv.id} className="profile-review-snippet-row">
                <MiniStars rating={rv.rating} />
                {rv.comment && (
                  <span className="profile-review-snippet-text">
                    {truncateWords(rv.comment, 10)}
                  </span>
                )}
              </div>
            ))}
            {orderReviews[order.orderCode].length > 1 && (
              <p className="profile-review-snippet-more">
                +{orderReviews[order.orderCode].length - 1} more product reviews
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="profile-order-card-footer">
          <span className="profile-order-total">
            Total: {formatUSD(Number(order.totalPrice) || 0)}
          </span>

          <div className="profile-order-actions">
            {order.status === "DELIVERED" && (
              <button
                className="profile-confirm-received-btn"
                disabled={confirmingOrder === order.orderCode}
                onClick={() => handleConfirmReceived(order.orderCode)}
              >
                {confirmingOrder === order.orderCode
                  ? "Waiting for confirmation..."
                  : "Mark as received"}
              </button>
            )}
            {order.status === "COMPLETED" && !orderReviews[order.orderCode]?.length && (
              <button
                className="profile-confirm-received-btn"
                onClick={() => setReviewOrder(order)}
              >
                Write a Review
              </button>
            )}

            <button
              className="profile-view-detail-btn"
              onClick={() => handleViewDetail(order)}
            >
              View details
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* SIDEBAR */}
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div
              className="profile-avatar-circle"
              onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            >
              <div className="profile-avatar-img-wrap">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <User size={40} color="#888" />
                )}
              </div>
              <span className="profile-avatar-camera">
                <Camera size={14} />
              </span>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            {avatarUploading && <p className="profile-avatar-uploading">Uploading...</p>}
            <h3>{formData.name || "User"}</h3>
            <p>{user?.role === "admin" ? "Administrator" : "Standard User"}</p>
          </div>

          <div className="profile-nav">
            <button
              className={`profile-nav-btn ${activeTab === "info" ? "profile-nav-btn-active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <User size={18} />
              Personal Information
            </button>

            <button
              className={`profile-nav-btn ${activeTab === "orders" ? "profile-nav-btn-active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Package size={18} />
              Order History
            </button>

            <button
              className="profile-nav-btn profile-nav-btn-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="profile-content">
          {/* --- INFO TAB --- */}
          {activeTab === "info" && (
            <div className="profile-tab-pane profile-slide-up">
              <h2 className="profile-tab-title">Personal Information</h2>

              <form onSubmit={handleSaveInfo} className="profile-form">
                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label>Full Name</label>
                    <div className="profile-input-with-icon">
                      <User size={18} className="profile-input-icon" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label>Email</label>
                    <div className="profile-input-with-icon">
                      <Mail size={18} className="profile-input-icon" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Phone Number</label>
                  <div className="profile-input-with-icon">
                    <Phone size={18} className="profile-input-icon" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Date of Birth</label>
                  <div className="profile-input-with-icon">
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Gender</label>
                  <div className="profile-input-with-icon">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">-- Select --</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Address</label>
                  <div className="profile-address-dropdowns">
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setFormData((prev) => ({ ...prev, district: "", ward: "" }));
                      }}
                      className="profile-address-select"
                    >
                      <option value="">{formData.province || "Province/City"}</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{toEnglishAdmin(p.full_name)}</option>
                      ))}
                    </select>

                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setFormData((prev) => ({ ...prev, ward: "" }));
                      }}
                      disabled={!selectedProvince}
                      className="profile-address-select"
                    >
                      <option value="">{formData.district || "District/County"}</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>{toEnglishAdmin(d.full_name)}</option>
                      ))}
                    </select>

                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      disabled={!selectedDistrict}
                      className="profile-address-select"
                    >
                      <option value="">{formData.ward || "Ward/Commune"}</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>{toEnglishAdmin(w.full_name)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-input-with-icon profile-address-specific">
                    <MapPin size={18} className="profile-input-icon" />
                    <input
                      type="text"
                      name="address"
                      placeholder="House number, alley, street name..."
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button type="submit" className="profile-save-btn">
                  <Save size={18} />
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* --- ORDERS TAB --- */}
          {activeTab === "orders" && (
            <div className="profile-tab-pane profile-slide-up">
              <h2 className="profile-tab-title">Order History</h2>

              {orders.length === 0 ? (
                <div className="profile-empty-orders">
                  <Package size={50} color="#555" />
                  <p>No orders found</p>
                </div>
              ) : (
                <div className="profile-orders-list">
                  {[...orders]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(renderOrderCard)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Review Modal ── */}
      {reviewOrder && (
        <QuickReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmitted={async () => {
            const code = reviewOrder?.orderCode;
            setReviewOrder(null);
            if (code) {
              try {
                const rv = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/reviews/my-order/${code}`);
                setOrderReviews((prev) => ({ ...prev, [code]: rv.data }));
              } catch (_) {}
            }
          }}
        />
      )}
    </div>
  );
};

export default Profile;