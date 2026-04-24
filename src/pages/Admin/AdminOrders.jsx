import React, { useState, useEffect } from "react";
import { Eye, Edit, X } from "lucide-react";
import axios from "axios";
import "./AdminOrders.css";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filter states ─────────────────────────────────────────────
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // ── Modals ────────────────────────────────────────────────────
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    orderId: null,
    currentStatus: "",
    targetStatus: "",
  });
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    order: null,
  });
  const getNextValidStatuses = (currentStatus) => {
    switch (currentStatus) {
      case "PAID":
      case "SHIP_COD":
        return ["SHIPPING", "CANCELLED"];
      case "SHIPPING":
        return ["DELIVERED"];
      case "DELIVERED":
      case "CANCELLED":
        return [];
      default:
        return [];
    }
  };


  // ── Fetch ─────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchId) params.append("id", searchId);
      if (searchName) params.append("receiverName", searchName);
      if (searchPhone) params.append("phoneNumber", searchPhone);
      if (searchAddress) params.append("shippingAddress", searchAddress);
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (filterDateFrom) params.append("dateFrom", filterDateFrom);
      if (filterDateTo) params.append("dateTo", filterDateTo);

      const paramsAll = new URLSearchParams();
      if (searchId) paramsAll.append("id", searchId);
      if (searchName) paramsAll.append("receiverName", searchName);
      if (searchPhone) paramsAll.append("phoneNumber", searchPhone);
      if (searchAddress) paramsAll.append("shippingAddress", searchAddress);
      if (filterDateFrom) paramsAll.append("dateFrom", filterDateFrom);
      if (filterDateTo) paramsAll.append("dateTo", filterDateTo);

      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

      const [resFiltered, resAll] = await Promise.all([
        axios.get(`http://localhost:8080/api/v1/orders?${params}`, { headers }),
        axios.get(`http://localhost:8080/api/v1/orders?${paramsAll}`, { headers }),
      ]);

      setOrders(resFiltered.data);
      setAllOrders(resAll.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [
    searchId,
    searchName,
    searchPhone,
    searchAddress,
    filterStatus,
    filterDateFrom,
    filterDateTo,
  ]);

  // ── Cập nhật trạng thái ───────────────────────────────────────
  const handleConfirmStatusChange = async () => {
    try {
      await axios.put(
        `http://localhost:8080/api/v1/orders/${statusModal.orderId}/status?status=${statusModal.targetStatus}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      await fetchOrders();
      setStatusModal({ isOpen: false, orderId: null, targetStatus: "" });
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại!");
    }
  };

  // ── Reset filters ─────────────────────────────────────────────
  const handleResetFilters = () => {
    setSearchId("");
    setSearchName("");
    setSearchPhone("");
    setSearchAddress("");
    setFilterStatus("ALL");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // ── Filter + sort logic ───────────────────────────────────────
  const filteredOrders = orders
    .filter((o) => {
      const matchId = searchId ? String(o.id).includes(searchId.trim()) : true;
      const matchName = searchName
        ? (o.receiverName || "")
          .toLowerCase()
          .includes(searchName.toLowerCase())
        : true;
      const matchPhone = searchPhone
        ? (o.phoneNumber || "").includes(searchPhone.trim())
        : true;
      const matchAddress = searchAddress
        ? (o.shippingAddress || "")
          .toLowerCase()
          .includes(searchAddress.toLowerCase())
        : true;
      const matchStatus =
        filterStatus === "ALL" ? true : o.status === filterStatus;

      let matchDateFrom = true;
      if (filterDateFrom) {
        matchDateFrom =
          new Date(o.createdAt) >= new Date(filterDateFrom + "T00:00");
      }
      let matchDateTo = true;
      if (filterDateTo) {
        matchDateTo =
          new Date(o.createdAt) <= new Date(filterDateTo + "T23:59");
      }

      return (
        matchId &&
        matchName &&
        matchPhone &&
        matchAddress &&
        matchStatus &&
        matchDateFrom &&
        matchDateTo
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const hasActiveFilter =
    searchId ||
    searchName ||
    searchPhone ||
    searchAddress ||
    filterStatus !== "ALL" ||
    filterDateFrom ||
    filterDateTo;

  // ── Helpers ───────────────────────────────────────────────────
  const getStatusLabel = (status) => {
    switch (status) {
      case "PAID":
        return "Đã thanh toán";
      case "SHIP_COD":
        return "Chờ giao (COD)";
      case "SHIPPING":
        return "Đang giao";
      case "DELIVERED":
        return "Đã giao";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PAID":
        return "ao-badge paid";
      case "SHIP_COD":
        return "ao-badge ship-cod";
      case "SHIPPING":
        return "ao-badge shipping";
      case "DELIVERED":
        return "ao-badge delivered";
      case "CANCELLED":
        return "ao-badge cancelled";
      default:
        return "ao-badge";
    }
  };


  return (
    <div className="ao-page">
      {/* Header */}
      <div className="ao-header">
        <div>
          <h1 className="ao-title">Đơn hàng</h1>
          <p className="ao-subtitle">Quản lý tất cả đơn hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ao-stats">
        {[
          { key: "ALL", label: "Tổng đơn hàng", count: allOrders.length },
          { key: "PAID", label: "Đã thanh toán", count: allOrders.filter(o => o.status === "PAID").length },
          { key: "SHIP_COD", label: "Chờ giao (COD)", count: allOrders.filter(o => o.status === "SHIP_COD").length },
          { key: "SHIPPING", label: "Đang giao", count: allOrders.filter(o => o.status === "SHIPPING").length },
          { key: "DELIVERED", label: "Đã giao", count: allOrders.filter(o => o.status === "DELIVERED").length },
          { key: "CANCELLED", label: "Đã hủy", count: allOrders.filter(o => o.status === "CANCELLED").length },
        ].map(({ key, label, count }) => (
          <div
            key={key}
            className={`ao-stat-card ${filterStatus === key ? "ao-stat-card--active" : ""}`}
            onClick={() => setFilterStatus(filterStatus === key ? "ALL" : key)}
            style={{ cursor: "pointer" }}
          >
            <span className="ao-stat-num">{count}</span>
            <span className="ao-stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar — row 1: text inputs + status */}
      <div className="ao-filter-bar">
        <input
          className="ao-filter-input ao-filter-id"
          placeholder="ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <input
          className="ao-filter-input"
          placeholder="Người nhận"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          className="ao-filter-input"
          placeholder="Số điện thoại"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
        />
        <input
          className="ao-filter-input"
          placeholder="Địa chỉ"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />
        <select
          className="ao-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="SHIP_COD">Chờ giao (COD)</option>
          <option value="SHIPPING">Đang giao</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Filter bar — row 2: date range */}
      <div className="ao-filter-bar ao-filter-bar-date">
        <div className="ao-filter-date-group">
          <label className="ao-filter-date-label">Từ ngày</label>
          <input
            type="date"
            className="ao-filter-input ao-filter-date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>

        <span className="ao-filter-date-sep">→</span>

        <div className="ao-filter-date-group">
          <label className="ao-filter-date-label">Đến ngày</label>
          <input
            type="date"
            className="ao-filter-input ao-filter-date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            min={filterDateFrom}
          />
        </div>

        {hasActiveFilter && (
          <button className="ao-filter-reset" onClick={handleResetFilters}>
            ✕ Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Result count */}
      {hasActiveFilter && (
        <p className="ao-filter-result">
          Tìm thấy <strong>{filteredOrders.length}</strong> / {orders.length}{" "}
          đơn hàng
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="ao-loading">Đang tải...</div>
      ) : (
        <div className="ao-table-wrap">
          <table className="ao-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Người nhận</th>
                <th>SĐT</th>
                <th>Địa chỉ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="ao-empty-row">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => (
                  <tr key={order.id} className="ao-row">
                    <td>{idx + 1}</td>
                    <td className="ao-id">#{order.id}</td>
                    <td className="ao-name">{order.receiverName || "—"}</td>
                    <td>{order.phoneNumber}</td>
                    <td className="ao-address">{order.shippingAddress}</td>
                    <td className="ao-price">
                      {order.totalPrice?.toLocaleString("vi-VN")} ₫
                    </td>
                    <td>
                      <div className="ao-status-cell">
                        <span className={getStatusClass(order.status)}>
                          {getStatusLabel(order.status)}
                        </span>
                        {getNextValidStatuses(order.status).length > 0 && (
                          <button
                            className="ao-edit-status-btn"
                            title="Cập nhật trạng thái"
                            onClick={() =>
                              setStatusModal({
                                isOpen: true,
                                orderId: order.id,
                                currentStatus: order.status,
                                targetStatus: getNextValidStatuses(order.status)[0],
                              })
                            }
                          >
                            <Edit size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="ao-date">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td>
                      <button
                        className="ao-view-btn"
                        title="Xem chi tiết"
                        onClick={() => setDetailModal({ isOpen: true, order })}
                      >
                        <Eye size={16} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cập nhật trạng thái */}
      {statusModal.isOpen && (
        <div
          className="ao-overlay"
          onClick={() =>
            setStatusModal({ isOpen: false, orderId: null, targetStatus: "", currentStatus: "" })
          }
        >
          <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ao-modal-header">
              <div>
                <h3 className="ao-modal-title">Cập nhật trạng thái</h3>
                <p className="ao-modal-sub">Đơn hàng #{statusModal.orderId}</p>
              </div>
              <button
                className="ao-modal-close"
                onClick={() =>
                  setStatusModal({
                    isOpen: false,
                    orderId: null,
                    targetStatus: "",
                    currentStatus: "",
                  })
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="ao-form-row">
              <label>Trạng thái hiện tại</label>
              <span className={getStatusClass(statusModal.currentStatus)}
                style={{ display: "inline-block", marginTop: 4 }}>
                {getStatusLabel(statusModal.currentStatus)}
              </span>
            </div>

            <div className="ao-form-row">
              <label>Chuyển sang</label>
              <select
                value={statusModal.targetStatus}
                onChange={(e) =>
                  setStatusModal({ ...statusModal, targetStatus: e.target.value })
                }
              >
                {getNextValidStatuses(statusModal.currentStatus).map((s) => (
                  <option key={s} value={s}>
                    {getStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="ao-modal-actions">
              <button
                className="ao-btn-cancel"
                onClick={() =>
                  setStatusModal({
                    isOpen: false,
                    orderId: null,
                    targetStatus: "",
                    currentStatus: "",
                  })
                }
              >
                Hủy
              </button>
              <button
                className="ao-btn-save"
                onClick={handleConfirmStatusChange}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {detailModal.isOpen && detailModal.order && (
        <div
          className="ao-overlay"
          onClick={() => setDetailModal({ isOpen: false, order: null })}
        >
          <div
            className="ao-modal ao-modal-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ao-modal-header">
              <div>
                <h3 className="ao-modal-title">
                  Chi tiết đơn hàng #{detailModal.order.id}
                </h3>
                <p className="ao-modal-sub">
                  Đặt lúc:{" "}
                  {new Date(detailModal.order.createdAt).toLocaleString(
                    "vi-VN",
                  )}
                </p>
              </div>
              <button
                className="ao-modal-close"
                onClick={() => setDetailModal({ isOpen: false, order: null })}
              >
                <X size={18} />
              </button>
            </div>

            {/* Thông tin người nhận */}
            <div className="ao-detail-section">
              <p className="ao-detail-section-label">Thông tin người nhận</p>
              <p className="ao-detail-value">
                {detailModal.order.receiverName || "—"}
              </p>
              <p className="ao-detail-sub">{detailModal.order.phoneNumber}</p>
              <p className="ao-detail-sub">
                {detailModal.order.shippingAddress}
              </p>
            </div>

            {/* Sản phẩm */}
            <div className="ao-detail-section">
              <p className="ao-detail-section-label">Sản phẩm</p>
              {detailModal.order.items?.map((item, idx) => (
                <div key={idx} className="ao-detail-item">
                  <span className="ao-detail-item-name">
                    {item.productName}
                  </span>
                  <span className="ao-detail-item-qty">x{item.quantity}</span>
                  <span className="ao-detail-item-price">
                    {item.price?.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              ))}
            </div>

            {/* Tổng tiền */}
            <div className="ao-detail-total">
              <span>Tổng tiền</span>
              <span className="ao-detail-total-price">
                {detailModal.order.totalPrice?.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
