import React, { useState, useEffect } from "react";
import axios from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import axiosRaw from "axios";

import {
  User,
  Package,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Save,
  ArrowRight,
} from "lucide-react";

import "./Profile.css";

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

  const API_URL = "http://localhost:8080/api/v1/customer-profiles";

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
  });

  const [profileId, setProfileId] = useState(null);
  const [orders, setOrders] = useState([]);

  const [cancelModal, setCancelModal] = useState({ open: false, orderCode: null, note: "" });
  const [cancelling, setCancelling] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(null);

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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user?.id) return;
        const res = await axios.get(
          `http://localhost:8080/api/v1/orders/user/${user.id}`
        );
        setOrders(res.data);
        console.log("USER ORDERS:", res.data);
      } catch (err) {
        console.log("LOAD ORDERS ERROR:", err);
      }
    };
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, user]);

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
          ward: data.ward || "",
          district: data.district || "",
          province: data.province || "",
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
      alert("SĐT chỉ được chứa số!");
      return;
    }
    if (formData.dob) {
      const today = new Date();
      const inputDate = new Date(formData.dob);
      if (inputDate >= today) {
        alert("Ngày sinh phải là quá khứ!");
        return;
      }
    }
    if (!profileId) {
      alert("Chưa có profile để cập nhật!");
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
          wards.find((w) => w.id === selectedWard)?.full_name || formData.ward,
        district:
          districts.find((d) => d.id === selectedDistrict)?.full_name ||
          formData.district,
        province:
          provinces.find((p) => p.id === selectedProvince)?.full_name ||
          formData.province,
        userId: user.id,
      });
      alert("Cập nhật thành công!");
    } catch (err) {
      console.log("UPDATE ERROR:", err.response?.data || err);
      alert("Cập nhật thất bại!");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canCancel = (status) => status === "PENDING" || status === "PAID";

  const openCancelModal = (orderCode) => {
    setCancelModal({ open: true, orderCode, note: "" });
  };

  const closeCancelModal = () => {
    if (cancelling) return;
    setCancelModal({ open: false, orderCode: null, note: "" });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.orderCode) return;
    setCancelling(true);
    try {
      await axios.put(
        `http://localhost:8080/api/v1/orders/${cancelModal.orderCode}/cancel`,
        null,
        { params: { cancelNote: cancelModal.note || undefined } }
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.orderCode === cancelModal.orderCode
            ? { ...o, status: "CANCELLED" }
            : o
        )
      );
      setCancelModal({ open: false, orderCode: null, note: "" });
    } catch (err) {
      console.log("CANCEL ORDER ERROR:", err.response || err);
      alert("Hủy đơn thất bại!");
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmReceived = async (orderCode) => {
    setConfirmingOrder(orderCode);
    try {
      await axios.patch(
        `http://localhost:8080/api/v1/orders/${orderCode}/confirm`
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.orderCode === orderCode ? { ...o, status: "COMPLETED" } : o
        )
      );
    } catch (err) {
      console.log("CONFIRM RECEIVED ERROR:", err.response || err);
      alert("Xác nhận thất bại, vui lòng thử lại.");
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleViewDetail = (order) => {
    navigate(`/order-detail/${order.orderCode}`, { state: { order } });
  };

  const getStatusLabel = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return "Chờ hoàn tiền";
    const status = order.status;
    switch (status) {
      case "PENDING": return "Chờ xác nhận";
      case "PAID": return "Đã thanh toán";
      case "SHIPPING": return "Đang giao hàng";
      case "DELIVERED": return "Đã giao hàng";
      case "COMPLETED": return "Hoàn thành";
      case "CANCELLED": return "Đã hủy";

      default: return status;
    }
  };

  const getStatusColor = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return { bg: "rgba(251,146,60,0.2)", color: "#fb923c" };
    const status = order.status;
    switch (status) {
      case "PAID": return { bg: "rgba(96,165,250,0.2)", color: "#60a5fa" };
      case "SHIPPING": return { bg: "rgba(251,146,60,0.2)", color: "#fb923c" };
      case "DELIVERED": return { bg: "rgba(74,222,128,0.2)", color: "#4ade80" };
      case "COMPLETED": return { bg: "rgba(74,222,128,0.2)", color: "#4ade80" };
      case "CANCELLED": return { bg: "rgba(248,113,113,0.2)", color: "#f87171" };
      case "PENDING": return { bg: "rgba(156,163,175,0.2)", color: "#9ca3af" };
      default: return { bg: "#333", color: "#e5e4e4" };
    }
  };

  /* Compact order card — shows max 3 items then "..." */
  const PREVIEW_LIMIT = 3;

  const renderOrderCard = (order) => {
    const statusStyle = getStatusColor(order);
    const items = order.items || [];
    const previewItems = items.slice(0, PREVIEW_LIMIT);
    const extraCount = items.length - PREVIEW_LIMIT;

    return (
      <div key={order.orderCode} className="profile-order-card">
        {/* Header row */}
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
                <span className="profile-order-preview-name">
                  {item.productName}
                </span>
                <span className="profile-order-preview-qty">
                  x{item.quantity}
                </span>
                <span className="profile-order-preview-price">
                  {item.price?.toLocaleString()} ₫
                </span>
              </div>
            ))}
            {extraCount > 0 && (
              <p className="profile-order-more">+{extraCount} sản phẩm khác...</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="profile-order-card-footer">
          <span className="profile-order-total">
            Tổng: {order.totalPrice?.toLocaleString()} ₫
          </span>

          <div className="profile-order-actions">
            {order.status === "DELIVERED" && (
              <button
                className="profile-confirm-received-btn"
                disabled={confirmingOrder === order.orderCode}
                onClick={() => handleConfirmReceived(order.orderCode)}
              >
                {confirmingOrder === order.orderCode
                  ? "Đang xác nhận..."
                  : "Đã nhận hàng"}
              </button>
            )}

            <button
              className="profile-view-detail-btn"
              onClick={() => handleViewDetail(order)}
            >
              Xem chi tiết
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
            <div className="profile-avatar-circle">
              <User size={40} color="#888" />
            </div>
            <h3>{formData.name || "User"}</h3>
            <p>
              {user?.role === "admin" ? "Quản trị viên" : "Thành viên tiêu chuẩn"}
            </p>
          </div>

          <div className="profile-nav">
            <button
              className={`profile-nav-btn ${activeTab === "info" ? "profile-nav-btn-active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <User size={18} />
              Thông tin cá nhân
            </button>

            <button
              className={`profile-nav-btn ${activeTab === "orders" ? "profile-nav-btn-active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Package size={18} />
              Lịch sử mua hàng
            </button>

            <button
              className="profile-nav-btn profile-nav-btn-logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="profile-content">
          {/* --- INFO TAB --- */}
          {activeTab === "info" && (
            <div className="profile-tab-pane profile-slide-up">
              <h2 className="profile-tab-title">Thông tin cá nhân</h2>

              <form onSubmit={handleSaveInfo} className="profile-form">
                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label>Họ và tên</label>
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
                  <label>Số điện thoại</label>
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
                  <label>Ngày sinh</label>
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
                  <label>Giới tính</label>
                  <div className="profile-input-with-icon">
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn --</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label>Địa chỉ</label>
                  <div className="profile-address-dropdowns">
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="profile-address-select"
                    >
                      <option value="">{formData.province || "Tỉnh/Thành phố"}</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedProvince}
                      className="profile-address-select"
                    >
                      <option value="">{formData.district || "Quận/Huyện"}</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      disabled={!selectedDistrict}
                      className="profile-address-select"
                    >
                      <option value="">{formData.ward || "Phường/Xã"}</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>{w.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="profile-input-with-icon profile-address-specific">
                    <MapPin size={18} className="profile-input-icon" />
                    <input
                      type="text"
                      name="address"
                      placeholder="Số nhà, ngõ, tên đường..."
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button type="submit" className="profile-save-btn">
                  <Save size={18} />
                  Lưu Thay Đổi
                </button>
              </form>
            </div>
          )}

          {/* --- ORDERS TAB --- */}
          {activeTab === "orders" && (
            <div className="profile-tab-pane profile-slide-up">
              <h2 className="profile-tab-title">Lịch sử mua hàng</h2>

              {orders.length === 0 ? (
                <div className="profile-empty-orders">
                  <Package size={50} color="#555" />
                  <p>Chưa có đơn hàng</p>
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

    </div>
  );
};

export default Profile;