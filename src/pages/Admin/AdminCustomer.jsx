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
  const [toastType, setToastType] = useState("success");

  // ── Confirm lock dialog state ─────────────────────────────────
  const [confirmTarget, setConfirmTarget] = useState(null); // { userId, currentStatus }

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
  const showToast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // ── Mở confirm dialog ─────────────────────────────────────────
  const handleLockClick = (userId, currentStatus, e) => {
    e.stopPropagation();
    setConfirmTarget({ userId, currentStatus });
  };

  // ── Xác nhận khoá / Mở khoá ──────────────────────────────────
  const handleConfirmLock = async () => {
    const { userId } = confirmTarget;
    setConfirmTarget(null);
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
        data.status === "ACTIVE" ? "Account unlocked successfully" : "Account locked successfully",
      );
    } catch (err) {
      console.error("Lỗi toggle lock:", err);
      showToast("Action failed. Please try again.", "error");
    }
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
      {toastMsg && (
        <div className={`ac-toast ${toastType === "error" ? "ac-toast--error" : ""}`}>
          {toastMsg}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmTarget && (
        <div className="ac-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="ac-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="ac-confirm-title">
              {confirmTarget.currentStatus === "ACTIVE"
                ? "Lock this account?"
                : "Unlock this account?"}
            </h3>
            <p className="ac-confirm-desc">
              {confirmTarget.currentStatus === "ACTIVE"
                ? "The customer will no longer be able to log in."
                : "The customer will regain access to their account."}
            </p>
            <div className="ac-confirm-actions">
              <button
                className="ac-btn-cancel"
                onClick={() => setConfirmTarget(null)}
              >
                Cancel
              </button>
              <button
                className={`ac-btn-confirm ${confirmTarget.currentStatus === "ACTIVE" ? "ac-btn-confirm--danger" : "ac-btn-confirm--success"}`}
                onClick={handleConfirmLock}
              >
                {confirmTarget.currentStatus === "ACTIVE" ? "Lock Account" : "Unlock Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ac-header">
        <div>
          <h1 className="ac-title">Customers</h1>
          <p className="ac-subtitle">Manage customer accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ac-stats">
        <div
          className={`ac-stat-card ${filterStatus === "ALL" ? "ac-stat-card--active" : ""}`}
          onClick={() => setFilterStatus("ALL")}
        >
          <span className="ac-stat-num">{customers.length}</span>
          <span className="ac-stat-label">Total Customers</span>
        </div>

        <div
          className={`ac-stat-card ${filterStatus === "ACTIVE" ? "ac-stat-card--active" : ""}`}
          onClick={() => setFilterStatus("ACTIVE")}
        >
          <span className="ac-stat-num">
            {customers.filter((c) => c.status === "ACTIVE").length}
          </span>
          <span className="ac-stat-label">Active</span>
        </div>

        <div
          className={`ac-stat-card ${filterStatus === "LOCKED" ? "ac-stat-card--active" : ""}`}
          onClick={() => setFilterStatus("LOCKED")}
        >
          <span className="ac-stat-num">
            {customers.filter((c) => c.status === "LOCKED").length}
          </span>
          <span className="ac-stat-label">Locked</span>
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
          placeholder="Full Name / Username"
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
          placeholder="Phone Number"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
        />
        <select
          className="ac-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="LOCKED">Locked</option>
        </select>
        {hasActiveFilter && (
          <button className="ac-filter-reset" onClick={handleResetFilters}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Result count */}
      {hasActiveFilter && (
        <p className="ac-filter-result">
          Found <strong>{filtered.length}</strong> / {customers.length} customers
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="ac-loading">Loading...</div>
      ) : (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ac-empty-row">
                    No customers found
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
                        <span className="ac-empty">Not updated</span>
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
                        {c.status === "ACTIVE" ? "Active" : "Locked"}
                      </span>
                    </td>
                    <td>
                      <div className="ac-actions">
                        <button
                          className={`ac-lock-btn ${c.status === "ACTIVE" ? "lock" : "unlock"}`}
                          onClick={(e) => handleLockClick(c.userId, c.status, e)}
                        >
                          {c.status === "ACTIVE" ? "Lock" : "Unlock"}
                        </button>
                        <button
                          className="ac-view-btn"
                          onClick={() => setSelected(c)}
                        >
                          View
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
        />
      )}
    </div>
  );
};

export default AdminCustomers;