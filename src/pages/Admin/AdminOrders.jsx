import React, { useState, useEffect } from "react";
import { Eye, RefreshCw, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { formatUSD } from "../../utils/currency";
import "./AdminOrders.css";

const REFUND_QUICK_REASONS = [
  "Order cancelled",
  "Customer requested refund",
  "Product out of stock",
  "Duplicate order",
  "Payment error",
];

const AdminOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [searchOrderCode, setSearchOrderCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchUserId, setSearchUserId] = useState(() => location.state?.userId ?? "");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [filterStatus, setFilterStatus] = useState(() => location.state?.userId ? "ALL" : "PENDING_ACTION");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [statOrders, setStatOrders] = useState([]);

  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundActiveTags, setRefundActiveTags] = useState([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState("");

  const closeRefundModal = () => {
    setRefundTarget(null);
    setRefundReason("");
    setRefundActiveTags([]);
    setRefundError("");
  };

  const toggleRefundTag = (tag) => {
    setRefundActiveTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      setRefundReason(next.join(", "));
      return next;
    });
    setRefundError("");
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) { setRefundError("Please enter the refund reason."); return; }
    setRefundLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/orders/${refundTarget}/refund`,
        { refundReason: refundReason.trim() },
        { headers }
      );
      if (res.data.success) {
        closeRefundModal();
        await Promise.all([fetchOrders(), fetchStatOrders()]);
      } else {
        setRefundError(res.data.message || "Refund failed!");
      }
    } catch (err) {
      console.error(err);
      setRefundError("An error occurred. Please try again.");
    } finally {
      setRefundLoading(false);
    }
  };

  const fetchStatOrders = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/orders`,
        { headers }
      );
      setStatOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatOrders();
  }, []);

  // Áp filter từ query string khi điều hướng từ Dashboard (quick action)
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get("status");
    const df = q.get("dateFrom");
    const dt = q.get("dateTo");
    if (s) setFilterStatus(s);
    if (df) setFilterDateFrom(df);
    if (dt) setFilterDateTo(dt);
  }, [location.search]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchOrderCode) params.append("orderCode", searchOrderCode);
      if (searchName) params.append("receiverName", searchName);
      if (searchUserId) params.append("userId", searchUserId);
      if (searchPhone) params.append("phoneNumber", searchPhone);
      if (searchAddress) params.append("shippingAddress", searchAddress);
      if (filterDateFrom) params.append("dateFrom", filterDateFrom);
      if (filterDateTo) params.append("dateTo", filterDateTo);
      if (filterStatus && filterStatus !== "ALL") params.append("status", filterStatus);
      params.append("page", page);
      params.append("size", 20);

      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/orders?${params}`,
        { headers }
      );

      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [
    page, searchOrderCode, searchName, searchUserId, searchPhone,
    searchAddress, filterDateFrom, filterDateTo,
    filterStatus,
  ]);

  const handleResetFilters = () => {
    setSearchOrderCode("");
    setSearchName("");
    setSearchUserId("");
    setSearchPhone("");
    setSearchAddress("");
    setFilterStatus("PENDING_ACTION");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(0);
  };

  const hasActiveFilter =
    searchOrderCode || searchName || searchUserId || searchPhone || searchAddress ||
    filterStatus !== "PENDING_ACTION" || filterDateFrom || filterDateTo;

  const getStatusLabel = (order) => {
    if (order.paymentStatus === "REFUNDED") return "REFUNDED";
    if (order.status === "CANCELLED" && order.paymentStatus === "REFUND_PENDING") return "REFUND PENDING";
    switch (order.status) {
      case "PENDING": return "PENDING";
      case "PAID": return "PAID";
      case "SHIPPING": return "SHIPPING";
      case "DELIVERED": return "DELIVERED";
      case "COMPLETED": return "COMPLETED";
      case "CANCELLED": return "CANCELLED";
      default: return order.status;
    }
  };

  const getStatusClass = (order) => {
    if (order.paymentStatus === "REFUNDED") return "ao-badge refunded";
    if (order.status === "CANCELLED" && order.paymentStatus === "REFUND_PENDING") return "ao-badge refund-pending";
    switch (order.status) {
      case "PENDING": return "ao-badge pending";
      case "PAID": return "ao-badge paid";
      case "SHIPPING": return "ao-badge shipping";
      case "DELIVERED": return "ao-badge delivered";
      case "COMPLETED": return "ao-badge completed";
      case "CANCELLED": return "ao-badge cancelled";
      default: return "ao-badge";
    }
  };

  const statCards = [
    { key: "ALL", label: "All", count: statOrders.length },
    {
      key: "PENDING_ACTION",
      label: "PENDING ACTION",
      count: statOrders.filter(o => o.status === "PAID").length,
    },
    { key: "SHIPPING", label: "SHIPPING", count: statOrders.filter(o => o.status === "SHIPPING").length },
    { key: "DELIVERED", label: "DELIVERED", count: statOrders.filter(o => o.status === "DELIVERED").length },
    { key: "COMPLETED", label: "COMPLETED", count: statOrders.filter(o => o.status === "COMPLETED").length },
    {
      key: "CANCELLED",
      label: (
        <>
          CANCELLED/
          <br />
          REFUND_PENDING
        </>
      ),
      count: statOrders.filter(
        o => (o.status === "CANCELLED" || o.paymentStatus === "REFUND_PENDING") && o.paymentStatus !== "REFUNDED"
      ).length,
    },
    { key: "REFUNDED", label: "REFUNDED", count: statOrders.filter(o => o.paymentStatus === "REFUNDED").length },
  ];

  return (
    <div className="ao-page">
      <div className="ao-header">
        <div>
          <h1 className="ao-title">Orders</h1>
          <p className="ao-subtitle">Manage all orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ao-stats">
        {statCards.map(({ key, label, count }) => (
          <div
            key={key}
            className={`ao-stat-card ${filterStatus === key ? "ao-stat-card--active" : ""}`}
            onClick={() => setFilterStatus(filterStatus === key ? "PENDING_ACTION" : key)}
            style={{ cursor: "pointer" }}
          >
            <span className="ao-stat-num">{count}</span>
            <span className="ao-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="ao-filter-bar">
        <input className="ao-filter-input ao-filter-id" placeholder="Order ID"
          value={searchOrderCode} onChange={(e) => { setSearchOrderCode(e.target.value); setPage(0); }} />
        <input className="ao-filter-input ao-filter-id" placeholder="User ID"
          type="number" min="1"
          value={searchUserId} onChange={(e) => { setSearchUserId(e.target.value); setPage(0); }} />
        <input className="ao-filter-input" placeholder="Receiver Name / Username"
          value={searchName} onChange={(e) => { setSearchName(e.target.value); setPage(0); }} />
        <input className="ao-filter-input" placeholder="Phone Number"
          value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); setPage(0); }} />
        <input className="ao-filter-input" placeholder="Shipping Address"
          value={searchAddress} onChange={(e) => { setSearchAddress(e.target.value); setPage(0); }} />

        <select className="ao-filter-select" value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="ALL">All</option>
          <option value="PENDING_ACTION">Pending Action</option>
          <option value="PENDING">Pending Payment</option>
          <option value="SHIPPING">Shipping</option>
          <option value="DELIVERED">Delivered - Awaiting Confirmation</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled - Awaiting Refund</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Date filter */}
      <div className="ao-filter-bar ao-filter-bar-date">
        <div className="ao-filter-date-group">
          <label className="ao-filter-date-label">From date</label>
          <input type="date" className="ao-filter-input ao-filter-date"
            value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0); }} />
        </div>
        <span className="ao-filter-date-sep">→</span>
        <div className="ao-filter-date-group">
          <label className="ao-filter-date-label">To date</label>
          <input type="date" className="ao-filter-input ao-filter-date"
            value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(0); }}
            min={filterDateFrom} />
        </div>
        {hasActiveFilter && (
          <button className="ao-filter-reset" onClick={handleResetFilters}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      {hasActiveFilter && (
        <p className="ao-filter-result">
          Found <strong>{totalElements}</strong> orders
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="ao-loading">Loading...</div>
      ) : (
        <div className="ao-table-wrap">
          <table className="ao-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Receiver</th>
                <th>Phone</th>
                <th>Shipping Address</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Order Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ao-empty-row">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={order.orderCode} className="ao-row">
                    <td>{page * 20 + idx + 1}</td>
                    <td className="ao-id">#{order.orderCode}</td>
                    <td className="ao-name">{order.receiverName || "—"}</td>
                    <td>{order.phoneNumber}</td>
                    <td className="ao-address">{order.shippingAddress}</td>
                    <td className="ao-price">
                      {formatUSD(Number(order.totalPrice) || 0)}
                    </td>
                    <td>
                      <span className={getStatusClass(order)}>
                        {getStatusLabel(order)}
                      </span>
                    </td>
                    <td className="ao-date">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td>
                      <div className="ao-actions">
                        <button
                          className="ao-view-btn"
                          onClick={() => navigate(`/admin/orders/details/${order.orderCode}`)}
                        >
                          <Eye size={16} /> View Details
                        </button>
                        {order.paymentStatus === "REFUND_PENDING" && (
                          <button
                            className="ao-refund-btn"
                            onClick={() => { setRefundTarget(order.orderCode); setRefundReason(""); setRefundError(""); }}
                          >
                            <RefreshCw size={14} /> Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="ao-pagination">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {refundTarget && (
        <div className="ao-overlay" onClick={() => !refundLoading && closeRefundModal()}>
          <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ao-modal-header">
              <div>
                <h3 className="ao-modal-title">Process Refund</h3>
                <p className="ao-modal-sub">Order #{refundTarget}</p>
              </div>
              <button className="ao-modal-close" onClick={closeRefundModal} disabled={refundLoading}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              This will initiate a refund to the customer's original payment method. This action cannot be undone.
            </p>
            <div className="ao-form-row">
              <label>Quick fill</label>
              <div className="ao-quick-tags">
                {REFUND_QUICK_REASONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`ao-quick-tag ${refundActiveTags.includes(tag) ? "ao-quick-tag--active" : ""}`}
                    onClick={() => toggleRefundTag(tag)}
                    disabled={refundLoading}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="ao-form-row">
              <label>Refund Reason *</label>
              <textarea
                placeholder="E.g.: Order cancelled, customer requested refund..."
                value={refundReason}
                rows={3}
                maxLength={1000}
                onChange={(e) => { setRefundReason(e.target.value); setRefundError(""); }}
              />
            </div>
            {refundError && <p className="ao-modal-error">{refundError}</p>}
            <div className="ao-modal-actions">
              <button className="ao-btn-cancel" onClick={closeRefundModal} disabled={refundLoading}>Cancel</button>
              <button className="ao-refund-confirm-btn" onClick={handleRefund} disabled={refundLoading}>
                {refundLoading ? "Processing..." : <><RefreshCw size={14} /> Confirm Refund</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;