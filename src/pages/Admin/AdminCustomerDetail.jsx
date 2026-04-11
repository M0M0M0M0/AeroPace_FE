import React, { useState } from "react";
import "./AdminCustomer.css";
import axios from "axios";

const API_BASE = "http://localhost:8080/api/v1/admin/customers";

const AdminCustomerDetail = ({ customer, onClose, onUpdateSuccess }) => {
  const [form, setForm] = useState({
    email: customer.email || "",
    fullName: customer.fullName || "",
    phoneNumber: customer.phoneNumber || "",
    address: customer.address || "",
    gender: customer.gender || "",
    dob: customer.dob || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  //
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      setError("Họ tên không được để trống.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE}/${customer.userId}`, form, {
        headers: getAuthHeaders(),
      });
      onUpdateSuccess(res.data);
    } catch (err) {
      console.error("Lỗi cập nhật:", err.response?.status, err.response?.data);
      const msg =
        err.response?.data?.message ||
        `Cập nhật thất bại (${err.response?.status ?? "Network Error"})`;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ac-modal-header">
          <div>
            <h2 className="ac-modal-title">Chi tiết khách hàng</h2>
            <p className="ac-modal-sub">
              ID: #{customer.userId} · {customer.username}
            </p>
          </div>
          <button className="ac-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Avatar + Status */}
        <div className="ac-modal-profile">
          <div className="ac-avatar">
            {(form.fullName || customer.username || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="ac-modal-name">
              {form.fullName || customer.username}
            </p>
            <span
              className={`ac-badge ${customer.status === "ACTIVE" ? "active" : "locked"}`}
            >
              {customer.status === "ACTIVE" ? "Hoạt động" : "Đã khoá"}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="ac-modal-form">
          <div className="ac-form-row">
            <label>Email</label>
            <input name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="ac-form-row">
            <label>
              Họ và tên <span className="ac-required">*</span>
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>
          <div className="ac-form-row">
            <label>Số điện thoại</label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
            />
          </div>
          <div className="ac-form-row">
            <label>Địa chỉ</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div className="ac-form-row">
            <label>Giới tính</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">-- Chọn --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div className="ac-form-row">
            <label>Ngày sinh</label>
            <input
              type="date"
              name="dob"
              value={form.dob || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="ac-error">{error}</p>}

        {/* Actions */}
        <div className="ac-modal-actions">
          <button className="ac-btn-cancel" onClick={onClose}>
            Huỷ
          </button>
          <button
            className="ac-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetail;
