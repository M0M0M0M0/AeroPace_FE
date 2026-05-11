import React, { useState, useEffect } from "react";
import axios from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

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
  });

  const [profileId, setProfileId] = useState(null);
  const [orders, setOrders] = useState([]);

  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: null,
  });

  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

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
        userId: user.id,
      });

      alert("Cập nhật thành công!");
    } catch (err) {
      console.log("UPDATE ERROR:", err.response || err);
      alert("Cập nhật thất bại!");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canCancel = (status) => {
    return status === "PAID" || status === "SHIP_COD";
  };

  const openCancelModal = (orderId) => {
    setCancelModal({
      open: true,
      orderId,
    });
  };

  const closeCancelModal = () => {
    if (cancelling) return;

    setCancelModal({
      open: false,
      orderId: null,
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.orderId) return;

    setCancelling(true);

    try {
      await axios.put(
        `http://localhost:8080/api/v1/orders/${cancelModal.orderId}/status?status=CANCELLED`,
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelModal.orderId
            ? { ...o, status: "CANCELLED" }
            : o,
        ),
      );

      setCancelModal({
        open: false,
        orderId: null,
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
      case "PAID":
        return "Đã thanh toán";

      case "SHIP_COD":
        return "Chờ giao hàng (COD) - Thanh toán khi nhận hàng";

      case "SHIPPING":
        return "Chờ giao hàng";

      case "DELIVERED":
        return "Đã giao hàng";

      case "CANCELLED":
        return "Đã hủy";

      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return {
          bg: "rgba(96, 165, 250, 0.2)",
          color: "#60a5fa",
        };

      case "SHIP_COD":
        return {
          bg: "rgba(250, 204, 21, 0.2)",
          color: "#facc15",
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

            {user?.role === "admin" && (
              <button
                className="profile-nav-btn"
                onClick={() => navigate("/admin")}
              >
                <Shield size={18} />
                Admin
              </button>
            )}

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

                  <div className="profile-input-with-icon">
                    <MapPin
                      size={18}
                      className="profile-input-icon"
                    />

                    <input
                      type="text"
                      name="address"
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
                          key={order.id}
                          className="profile-order-card"
                        >
                          <div className="profile-order-card-header">
                            <span className="profile-order-id">
                              ID đơn hàng: {order.id} 
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
                              {order.shippingAddress}
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
                                  openCancelModal(order.id)
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
              <strong>#{cancelModal.orderId}</strong> không?
              <br />
              Hành động này không thể hoàn tác.
            </p>

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