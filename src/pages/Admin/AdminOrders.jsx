import React, { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminOrders.css";

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchOrderCode, setSearchOrderCode] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [filterStatus, setFilterStatus] = useState("PENDING_ACTION");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [statOrders, setStatOrders] = useState([]);

  const fetchStatOrders = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(
        `http://localhost:8080/api/v1/admin/orders`,
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

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchOrderCode) params.append("orderCode", searchOrderCode);
      if (searchName) params.append("receiverName", searchName);
      if (searchPhone) params.append("phoneNumber", searchPhone);
      if (searchAddress) params.append("shippingAddress", searchAddress);
      if (filterDateFrom) params.append("dateFrom", filterDateFrom);
      if (filterDateTo) params.append("dateTo", filterDateTo);

      const beStatus = ["PENDING", "PAID", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED"];
      if (beStatus.includes(filterStatus)) params.append("status", filterStatus);

      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(
        `http://localhost:8080/api/v1/admin/orders?${params}`,
        { headers }
      );

      setAllOrders(res.data);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [
    searchOrderCode, searchName, searchPhone,
    searchAddress, filterDateFrom, filterDateTo,
    filterStatus,
  ]);

  const handleResetFilters = () => {
    setSearchOrderCode("");
    setSearchName("");
    setSearchPhone("");
    setSearchAddress("");
    setFilterStatus("PENDING_ACTION");
    setFilterDateFrom("");
    setFilterDateTo("");
  };


  const filteredOrders = orders
    .filter((o) => {
      let matchStatus = true;
      if (filterStatus === "PENDING_ACTION") {
        matchStatus = o.status === "PAID" || o.paymentStatus === "REFUND_PENDING";
      } else if (filterStatus === "REFUND_PENDING") {
        matchStatus = o.paymentStatus === "REFUND_PENDING";
      } else if (filterStatus !== "ALL") {
        matchStatus = o.status === filterStatus;
      }
      return matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const hasActiveFilter =
    searchOrderCode || searchName || searchPhone || searchAddress ||
    filterStatus !== "PENDING_ACTION" || filterDateFrom || filterDateTo;

  const getStatusLabel = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return "Chờ hoàn tiền";
    switch (order.status) {
      case "PENDING": return "Chờ thanh toán";
      case "PAID": return "Chờ giao hàng";
      case "SHIPPING": return "Đang giao";
      case "DELIVERED": return "Đã giao - Chờ khách hàng xác nhận";
      case "COMPLETED": return "Hoàn thành";
      case "CANCELLED": return "Đã hủy";
      default: return order.status;
    }
  };

  const getStatusClass = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return "ao-badge refund-pending";
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
    { key: "ALL", label: "Tổng đơn", count: statOrders.length },
    {
      key: "PENDING_ACTION",
      label: "Cần xử lý",
      count: statOrders.filter(o => o.status === "PAID" || o.paymentStatus === "REFUND_PENDING").length,
    },
    { key: "PAID", label: "Chờ giao hàng", count: statOrders.filter(o => o.status === "PAID").length },
    { key: "REFUND_PENDING", label: "Chờ hoàn tiền", count: statOrders.filter(o => o.paymentStatus === "REFUND_PENDING").length },
    { key: "SHIPPING", label: "Đang giao", count: statOrders.filter(o => o.status === "SHIPPING").length },
    { key: "DELIVERED", label: "Đã giao - Chờ xác nhận", count: statOrders.filter(o => o.status === "DELIVERED").length },
    { key: "CANCELLED", label: "Đã hủy", count: statOrders.filter(o => o.status === "CANCELLED").length },
  ];

  return (
    <div className="ao-page">
      <div className="ao-header">
        <div>
          <h1 className="ao-title">Đơn hàng</h1>
          <p className="ao-subtitle">Quản lý tất cả đơn hàng</p>
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
        <input className="ao-filter-input ao-filter-id" placeholder="Mã đơn hàng"
          value={searchOrderCode} onChange={(e) => setSearchOrderCode(e.target.value)} />
        <input className="ao-filter-input" placeholder="Người nhận"
          value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        <input className="ao-filter-input" placeholder="Số điện thoại"
          value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
        <input className="ao-filter-input" placeholder="Địa chỉ"
          value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} />

        <select className="ao-filter-select" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">Tất cả</option>
          <option value="PENDING_ACTION">Cần xử lý</option>
          <option value="PENDING">Chờ thanh toán</option>
          <option value="PAID">Chờ giao hàng</option>
          <option value="REFUND_PENDING">Chờ hoàn tiền</option>
          <option value="SHIPPING">Đang giao</option>
          <option value="DELIVERED">Đã giao - Chờ khách hàng xác nhận</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Date filter */}
      <div className="ao-filter-bar ao-filter-bar-date">
        <div className="ao-filter-date-group">
          <label className="ao-filter-date-label">Từ ngày</label>
          <input type="date" className="ao-filter-input ao-filter-date"
            value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
        </div>
        <span className="ao-filter-date-sep">→</span>
        <div className="ao-filter-date-group">
          <label className="ao-filter-date-label">Đến ngày</label>
          <input type="date" className="ao-filter-input ao-filter-date"
            value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
            min={filterDateFrom} />
        </div>
        {hasActiveFilter && (
          <button className="ao-filter-reset" onClick={handleResetFilters}>
            ✕ Xoá bộ lọc
          </button>
        )}
      </div>

      {hasActiveFilter && (
        <p className="ao-filter-result">
          Tìm thấy <strong>{filteredOrders.length}</strong> / {allOrders.length} đơn hàng
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
                <th>Mã đơn</th>
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
                  <tr key={order.orderCode} className="ao-row">
                    <td>{idx + 1}</td>
                    <td className="ao-id">#{order.orderCode}</td>
                    <td className="ao-name">{order.receiverName || "—"}</td>
                    <td>{order.phoneNumber}</td>
                    <td className="ao-address">{order.shippingAddress}</td>
                    <td className="ao-price">
                      {order.totalPrice?.toLocaleString("vi-VN")} ₫
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
                      <button
                        className="ao-view-btn"
                        onClick={() => navigate(`/admin/orders/details/${order.orderCode}`)}
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
    </div>
  );
};

export default AdminOrders;