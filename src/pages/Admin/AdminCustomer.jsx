import React, { useState, useEffect } from "react";
import AdminCustomerDetail from "./AdminCustomerDetail";
import "./AdminCustomer.css";
import axios from "axios";

const API_BASE = "http://localhost:8080/api/v1/admin/customers";

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelected] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  // ── Filter states ─────────────────────────────────────────────
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ── Fetch danh sách ──────────────────────────────────────────
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCustomers(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ── Toast helper ─────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // ── Khoá / Mở khoá ───────────────────────────────────────────
  const handleToggleLock = async (userId, e) => {
    e.stopPropagation();
    try {
      const res = await axios.patch(`${API_BASE}/${userId}/toggle-lock`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = res.data;
      setCustomers((prev) =>
        prev.map((c) =>
          c.userId === userId ? { ...c, status: data.status } : c,
        ),
      );
      showToast(
        data.status === "ACTIVE" ? "Đã mở khoá tài khoản" : "Đã khoá tài khoản",
      );
    } catch (err) {
      console.error("Lỗi toggle lock:", err);
    }
  };

  // ── Sau khi update từ modal ───────────────────────────────────
  const handleUpdateSuccess = (updatedCustomer) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.userId === updatedCustomer.userId ? updatedCustomer : c,
      ),
    );
    setSelected(null);
    showToast("Cập nhật thông tin thành công");
  };

  // ── Reset filters ─────────────────────────────────────────────
  const handleResetFilters = () => {
    setSearchId("");
    setSearchName("");
    setSearchEmail("");
    setSearchPhone("");
    setFilterStatus("ALL");
  };

  // ── Filter logic ──────────────────────────────────────────────
  const filtered = customers.filter((c) => {
    const matchId = searchId
      ? String(c.userId).includes(searchId.trim())
      : true;
    const matchName = searchName
      ? (c.fullName || c.username || "")
          .toLowerCase()
          .includes(searchName.toLowerCase())
      : true;
    const matchEmail = searchEmail
      ? (c.email || "").toLowerCase().includes(searchEmail.toLowerCase())
      : true;
    const matchPhone = searchPhone
      ? (c.phoneNumber || "").includes(searchPhone.trim())
      : true;
    const matchStatus =
      filterStatus === "ALL" ? true : c.status === filterStatus;

    return matchId && matchName && matchEmail && matchPhone && matchStatus;
  });

  const hasActiveFilter =
    searchId ||
    searchName ||
    searchEmail ||
    searchPhone ||
    filterStatus !== "ALL";

  return (
    <div className="ac-page">
      {/* Toast */}
      {toastMsg && <div className="ac-toast">{toastMsg}</div>}

      {/* Header */}
      <div className="ac-header">
        <div>
          <h1 className="ac-title">Khách hàng</h1>
          <p className="ac-subtitle">Quản lý tài khoản khách hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ac-stats">
        <div className="ac-stat-card">
          <span className="ac-stat-num">{customers.length}</span>
          <span className="ac-stat-label">Tổng khách hàng</span>
        </div>
        <div className="ac-stat-card">
          <span className="ac-stat-num">
            {customers.filter((c) => c.status === "ACTIVE").length}
          </span>
          <span className="ac-stat-label">Đang hoạt động</span>
        </div>
        <div className="ac-stat-card">
          <span className="ac-stat-num">
            {customers.filter((c) => c.status === "LOCKED").length}
          </span>
          <span className="ac-stat-label">Đã khoá</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="ac-filter-bar">
        <input
          className="ac-filter-input ac-filter-id"
          placeholder="ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <input
          className="ac-filter-input"
          placeholder="Họ tên"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          className="ac-filter-input"
          placeholder="Email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <input
          className="ac-filter-input"
          placeholder="Số điện thoại"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
        />
        <select
          className="ac-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="LOCKED">Đã khoá</option>
        </select>
        {hasActiveFilter && (
          <button className="ac-filter-reset" onClick={handleResetFilters}>
            ✕ Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Result count */}
      {hasActiveFilter && (
        <p className="ac-filter-result">
          Tìm thấy <strong>{filtered.length}</strong> / {customers.length} khách
          hàng
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="ac-loading">Đang tải...</div>
      ) : (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Username</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ac-empty-row">
                    Không tìm thấy khách hàng
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c.userId} className="ac-row">
                    <td>{idx + 1}</td>
                    <td className="ac-id">{c.userId}</td>
                    <td className="ac-username">{c.username}</td>
                    <td>
                      {c.fullName || (
                        <span className="ac-empty">Chưa cập nhật</span>
                      )}
                    </td>
                    <td>{c.email}</td>
                    <td>
                      {c.phoneNumber || <span className="ac-empty">—</span>}
                    </td>
                    <td>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`ac-badge ${c.status === "ACTIVE" ? "active" : "locked"}`}
                      >
                        {c.status === "ACTIVE" ? "Hoạt động" : "Đã khoá"}
                      </span>
                    </td>
                    <td>
                      <div className="ac-actions">
                        <button
                          className={`ac-lock-btn ${c.status === "ACTIVE" ? "lock" : "unlock"}`}
                          onClick={(e) => handleToggleLock(c.userId, e)}
                        >
                          {c.status === "ACTIVE" ? "Khoá" : "Mở khoá"}
                        </button>
                        <button
                          className="ac-edit-btn"
                          onClick={() => setSelected(c)}
                        >
                          ✏️ Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCustomer && (
        <AdminCustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelected(null)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default AdminCustomers;
