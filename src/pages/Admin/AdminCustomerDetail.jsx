import React, { useState, useEffect } from "react";
import "./AdminCustomer.css";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/customers`;

const AdminCustomerDetail = ({ customer, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`${API_BASE}/${customer.userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setDetail(res.data);
      } catch (err) {
        console.error("Fetch detail error:", err);
        setError("Failed to load customer details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [customer.userId]);

  const formatDate = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleString("vi-VN");
  };

  const getInitial = (name, username) =>
    ((name || username || "?")[0]).toUpperCase();

  const buildAddress = (d) => {
    if (!d) return "—";
    const parts = [d.address, d.ward, d.district, d.province].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal ac-modal--view" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ac-modal-header">
          <div>
            <h2 className="ac-modal-title">Customer Details</h2>
            <p className="ac-modal-sub">
              ID: #{customer.userId} · {customer.username}
            </p>
          </div>
          <button className="ac-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="ac-modal-loading">Loading...</div>
        ) : error ? (
          <div className="ac-modal-error">{error}</div>
        ) : (
          <>
            {/* Avatar + Status */}
            <div className="ac-modal-profile">
              <div className="ac-avatar">
                {getInitial(detail.fullName, detail.username)}
              </div>
              <div>
                <p className="ac-modal-name">
                  {detail.fullName || detail.username}
                </p>
                <span
                  className={`ac-badge ${detail.status === "ACTIVE" ? "active" : "locked"}`}
                >
                  {detail.status === "ACTIVE" ? "Active" : "Locked"}
                </span>
              </div>
            </div>

            {/* Info Sections */}
            <div className="ac-detail-sections">

              {/* Account Info */}
              <div className="ac-detail-section">
                <p className="ac-detail-section-title">Account</p>
                <div className="ac-detail-grid">
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Username</span>
                    <span className="ac-detail-value">{detail.username || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Email</span>
                    <span className="ac-detail-value">{detail.email || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Status</span>
                    <span className="ac-detail-value">
                      <span className={`ac-badge ${detail.status === "ACTIVE" ? "active" : "locked"}`}>
                        {detail.status === "ACTIVE" ? "Active" : "Locked"}
                      </span>
                    </span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Registered</span>
                    <span className="ac-detail-value">{formatDateTime(detail.createdAt)}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Last Updated</span>
                    <span className="ac-detail-value">{formatDateTime(detail.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="ac-detail-section">
                <p className="ac-detail-section-title">Personal Info</p>
                <div className="ac-detail-grid">
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Full Name</span>
                    <span className="ac-detail-value">{detail.fullName || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Phone</span>
                    <span className="ac-detail-value">{detail.phoneNumber || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Gender</span>
                    <span className="ac-detail-value">{detail.gender || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Date of Birth</span>
                    <span className="ac-detail-value">{formatDate(detail.dob)}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="ac-detail-section">
                <p className="ac-detail-section-title">Address</p>
                <div className="ac-detail-grid">
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Street</span>
                    <span className="ac-detail-value">{detail.address || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Ward</span>
                    <span className="ac-detail-value">{detail.ward || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">District</span>
                    <span className="ac-detail-value">{detail.district || "—"}</span>
                  </div>
                  <div className="ac-detail-row">
                    <span className="ac-detail-label">Province</span>
                    <span className="ac-detail-value">{detail.province || "—"}</span>
                  </div>
                  <div className="ac-detail-row ac-detail-row--full">
                    <span className="ac-detail-label">Full Address</span>
                    <span className="ac-detail-value">{buildAddress(detail)}</span>
                  </div>
                </div>
              </div>

              {/* Profile Timestamps */}
              {(detail.profileCreatedAt || detail.profileUpdatedAt) && (
                <div className="ac-detail-section">
                  <p className="ac-detail-section-title">Profile Activity</p>
                  <div className="ac-detail-grid">
                    <div className="ac-detail-row">
                      <span className="ac-detail-label">Profile Created</span>
                      <span className="ac-detail-value">{formatDateTime(detail.profileCreatedAt)}</span>
                    </div>
                    <div className="ac-detail-row">
                      <span className="ac-detail-label">Profile Updated</span>
                      <span className="ac-detail-value">{formatDateTime(detail.profileUpdatedAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="ac-modal-actions">
          <button className="ac-btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetail;