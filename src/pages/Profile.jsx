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
  Shield,
  X,
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

  const [activeTab, setActiveTab] = useState(
    location.state?.tab || "info",
  );

  const API_URL = "http://localhost:8080/api/v1/customer-profiles";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    dob: "",
    gender: "",
    address: "",
    ward: "", district: "", province: "",
  });

  const [profileId, setProfileId] = useState(null);
  const [orders, setOrders] = useState([]);

  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderCode: null,
    note: "",
  });

  const [cancelling, setCancelling] = useState(false);

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
      axiosRaw.get(`https://esgoo.net/api-tinhthanh/2/${selectedProvince}.htm`).then((res) => {
        if (res.data.error === 0) setDistricts(res.data.data);
      });
      setSelectedDistrict(""); setWards([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      axiosRaw.get(`https://esgoo.net/api-tinhthanh/3/${selectedDistrict}.htm`).then((res) => {
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
          `http://localhost:8080/api/v1/orders/user/${user.id}`,
        );

        setOrders(res.data);
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();

    const phoneRegex = /^[0-9]+$/;

    if (
      formData.phone_number &&
      !phoneRegex.test(formData.phone_number)
    ) {
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
        ward: wards.find(w => w.id === selectedWard)?.full_name || formData.ward,
        district: districts.find(d => d.id === selectedDistrict)?.full_name || formData.district,
        province: provinces.find(p => p.id === selectedProvince)?.full_name || formData.province,
        userId: user.id,
      });
      console.log("PAYLOAD:", {
        fullName: formData.name,
        phoneNumber: formData.phone_number,
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address,
        ward: wards.find(w => w.id === selectedWard)?.full_name || formData.ward,
        district: districts.find(d => d.id === selectedDistrict)?.full_name || formData.district,
        province: provinces.find(p => p.id === selectedProvince)?.full_name || formData.province,
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
    setCancelModal({
      open: true,
      orderCode,
    });
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
            : o,
        ),
      );

      setCancelModal({
        open: false,
        orderCode: null,
      });
    } catch (err) {
      console.log("CANCEL ORDER ERROR:", err.response || err);
      alert("Hủy đơn thất bại!");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusLabel = (status) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return {
          bg: "rgba(96, 165, 250, 0.2)",
          color: "#60a5fa",
        };

      case "SHIPPING":
        return {
          bg: "rgba(251, 146, 60, 0.2)",
          color: "#fb923c",
        };

      case "DELIVERED":
        return {
          bg: "rgba(74, 222, 128, 0.2)",
          color: "#4ade80",
        };

      case "CANCELLED":
        return {
          bg: "rgba(248, 113, 113, 0.2)",
          color: "#f87171",
        };
      case "PENDING": return { bg: "rgba(156, 163, 175, 0.2)", color: "#9ca3af" };
      case "COMPLETED": return { bg: "rgba(74, 222, 128, 0.2)", color: "#4ade80" };

      default:
        return {
          bg: "#333",
          color: "#fff",
        };
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar-circle">
              <User size={40} color="#888" />
            </div>

            <h3>{formData.name || "User"}</h3>

            <p>
              {user?.role === "admin"
                ? "Quản trị viên"
                : "Thành viên tiêu chuẩn"}
            </p>
          </div>

          <div className="profile-nav">
            <button
              className={`profile-nav-btn ${activeTab === "info"
                ? "profile-nav-btn-active"
                : ""
                }`}
              onClick={() => setActiveTab("info")}
            >
              <User size={18} />
              Thông tin cá nhân
            </button>

            <button
              className={`profile-nav-btn ${activeTab === "orders"
                ? "profile-nav-btn-active"
                : ""
                }`}
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

        <div className="profile-content">
          {activeTab === "info" && (
            <div className="profile-tab-pane profile-slide-up">
              <h2 className="profile-tab-title">
                Thông tin cá nhân
              </h2>

              <form
                onSubmit={handleSaveInfo}
                className="profile-form"
              >
                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label>Họ và tên</label>

                    <div className="profile-input-with-icon">
                      <User
                        size={18}
                        className="profile-input-icon"
                      />

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
                      <Mail
                        size={18}
                        className="profile-input-icon"
                      />

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
                    <Phone
                      size={18}
                      className="profile-input-icon"
                    />

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

                <button
                  type="submit"
                  className="profile-save-btn"
                >
                  <Save size={18} />
                  Lưu Thay Đổi
                </button>
              </form>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="profile-tab-pane profile-slide-up">
              <h2 className="profile-tab-title">
                Lịch sử mua hàng
              </h2>

              {orders.length === 0 ? (
                <div className="profile-empty-orders">
                  <Package size={50} color="#555" />
                  <p>Chưa có đơn hàng</p>
                </div>
              ) : (
                <div className="profile-orders-list">
                  {[...orders]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt),
                    )
                    .map((order) => {
                      const statusStyle = getStatusColor(
                        order.status,
                      );

                      return (
                        <div
                          key={order.orderCode}
                          className="profile-order-card"
                        >
                          <div className="profile-order-card-header">
                            <span className="profile-order-id">
                              Mã đơn: #{order.orderCode}
                            </span>

                            <span
                              className="profile-order-status"
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.color,
                              }}
                            >
                              Trạng thái:{" "}
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <div className="profile-order-card-body">
                            {order.receiverName && (
                              <p>
                                <User size={14} />
                                Tên người nhận:{" "}
                                {order.receiverName}
                              </p>
                            )}

                            <p>
                              <MapPin size={14} />
                              Địa chỉ giao hàng:{" "}
                              {[order.shippingAddress, order.ward, order.district, order.province]
                                .filter(Boolean).join(", ") || "—"}
                            </p>

                            <p>
                              <Phone size={14} />
                              Số điện thoại:{" "}
                              {order.phoneNumber}
                            </p>

                            <p>
                              Ngày đặt:{" "}
                              {new Date(
                                order.createdAt,
                              ).toLocaleString("vi-VN")}
                            </p>

                            {order.items &&
                              order.items.length > 0 && (
                                <div className="profile-order-items-list">
                                  <p className="profile-order-items-title">
                                    Danh sách sản phẩm:
                                  </p>

                                  {order.items.map(
                                    (item, idx) => (
                                      <div
                                        key={idx}
                                        className="profile-order-item-row"
                                      >
                                        <span className="profile-order-item-name">
                                          {
                                            item.productName
                                          }
                                        </span>

                                        <div className="profile-order-item-right">
                                          <span className="profile-order-item-qty">
                                            x
                                            {
                                              item.quantity
                                            }
                                          </span>

                                          <span className="profile-order-item-price">
                                            {item.price?.toLocaleString()} ₫
                                          </span>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                            {order.status === "CANCELLED" && order.cancelReason &&
                              (order.cancelReason === "USER_CANCELLED" || order.cancelReason === "ADMIN_CANCELLED") && (
                                <p style={{ color: "#f87171", fontSize: "0.85rem" }}>
                                  {order.cancelNote || (order.cancelReason === "ADMIN_CANCELLED" ? "Admin hủy đơn" : "Người dùng hủy đơn")}
                                </p>
                              )}
                            {order.status === "CANCELLED" && (
                              <p style={{ color: "#f87171", fontSize: "0.85rem" }}>
                                Lý do hủy: "{" "}
                                {order.cancelReason === "USER_CANCELLED"
                                  ? order.cancelNote || "Người dùng hủy đơn"
                                  : order.cancelReason === "ADMIN_CANCELLED"
                                    ? order.cancelNote || "Admin hủy đơn"
                                    : order.cancelReason === "PAYMENT_TIMEOUT"
                                      ? "Hết thời gian thanh toán"
                                      : order.cancelReason === "PAYMENT_REPLACED"
                                        ? "Người dùng khởi tạo thanh toán mới"
                                        : "—"} "
                              </p>
                            )}
                          </div>

                          <div className="profile-order-card-footer">
                            <span className="profile-order-total">
                              Tổng:{" "}
                              {order.totalPrice?.toLocaleString()} ₫
                            </span>

                            {canCancel(order.status) && (
                              <button
                                className="profile-cancel-order-btn"
                                onClick={() =>
                                  openCancelModal(order.orderCode)
                                }
                              >
                                <X size={15} />
                                Hủy đơn
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {cancelModal.open && (
        <div
          className="profile-cancel-modal-overlay"
          onClick={closeCancelModal}
        >
          <div
            className="profile-cancel-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Xác nhận hủy đơn</h3>

            <p>
              Bạn có chắc muốn hủy đơn hàng{" "}
              <strong>#{cancelModal.orderCode}</strong> không?
              <br />
              Hành động này không thể hoàn tác.
            </p>
            <textarea
              placeholder="Lý do hủy đơn (không bắt buộc)..."
              value={cancelModal.note}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, note: e.target.value }))}
              rows={3}
              style={{ width: "100%", marginTop: "0.75rem", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "8px", padding: "0.6rem", resize: "none" }}
            />
            <div className="profile-cancel-modal-actions">
              <button
                className="profile-cancel-modal-back"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Quay lại
              </button>

              <button
                className="profile-cancel-modal-confirm"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? "Đang hủy..."
                  : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;