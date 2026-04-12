import React, { useEffect, useState } from "react";
import { Download, TrendingUp, DollarSign, ShoppingBag, Clock } from "lucide-react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/v1/orders", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Fetch orders error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // ================= THỐNG KÊ =================
  const totalRevenue = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const totalOrders    = orders.length;
  const pendingOrders  = orders.filter((o) => o.status === "PAID" || o.status === "SHIP_COD").length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;

  // ================= DOANH THU THEO THÁNG (sắp xếp tăng dần) =================
  const revenueByMonth = {};
  orders
    .filter((o) => o.status !== "CANCELLED")
    .forEach((o) => {
      const d     = new Date(o.createdAt);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const key   = `${year}-${String(month).padStart(2, "0")}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + (o.totalPrice || 0);
    });

  const sortedMonths = Object.keys(revenueByMonth).sort();
  const maxRevenue   = Math.max(...sortedMonths.map((k) => revenueByMonth[k]), 1);

  // ================= 10 ĐƠN GẦN NHẤT =================
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // ================= XUẤT EXCEL =================
  const handleExportData = () => {
    const ws = XLSX.utils.json_to_sheet(
      orders.map((o) => ({
        ID: o.id,
        "Người nhận": o.receiverName || "",
        "Địa chỉ": o.shippingAddress,
        SĐT: o.phoneNumber,
        "Tổng tiền": o.totalPrice,
        "Trạng thái": o.status,
        "Ngày đặt": new Date(o.createdAt).toLocaleString("vi-VN"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");
    XLSX.writeFile(wb, "Bao_Cao_Don_Hang_ShopRunner.xlsx");
  };

  // ================= HELPERS =================
  const getStatusLabel = (status) => {
    switch (status) {
      case "PAID":      return "Đã thanh toán";
      case "SHIP_COD":  return "Chờ giao (COD)";
      case "SHIPPING":  return "Đang giao";
      case "DELIVERED": return "Đã giao";
      case "CANCELLED": return "Đã hủy";
      default:          return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PAID":      return "ad-badge paid";
      case "SHIP_COD":  return "ad-badge ship-cod";
      case "SHIPPING":  return "ad-badge shipping";
      case "DELIVERED": return "ad-badge delivered";
      case "CANCELLED": return "ad-badge cancelled";
      default:          return "ad-badge";
    }
  };

  const formatMonthLabel = (key) => {
    const [year, month] = key.split("-");
    return `T${parseInt(month)}/${year}`;
  };

  if (loading) return <div className="ad-loading">Đang tải...</div>;

  return (
    <div className="ad-page">
      {/* HEADER */}
      <div className="ad-header">
        <div>
          <h1 className="ad-title">Tổng quan hệ thống</h1>
          <p className="ad-subtitle">Thống kê và báo cáo đơn hàng</p>
        </div>
        <button className="ad-export-btn" onClick={handleExportData}>
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="ad-stats">
        <div className="ad-stat-card">
          <div className="ad-stat-icon green"><DollarSign size={20} /></div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Tổng doanh thu</span>
            <span className="ad-stat-value">{totalRevenue.toLocaleString("vi-VN")} ₫</span>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="ad-stat-icon blue"><ShoppingBag size={20} /></div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Tổng đơn hàng</span>
            <span className="ad-stat-value">{totalOrders} đơn</span>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="ad-stat-icon yellow"><Clock size={20} /></div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Chờ xử lý</span>
            <span className="ad-stat-value">{pendingOrders} đơn</span>
          </div>
        </div>
        <div className="ad-stat-card">
          <div className="ad-stat-icon teal"><TrendingUp size={20} /></div>
          <div className="ad-stat-body">
            <span className="ad-stat-label">Đã giao thành công</span>
            <span className="ad-stat-value">{deliveredOrders} đơn</span>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ DOANH THU THEO THÁNG */}
      <div className="ad-card ad-chart-card">
        <h3 className="ad-card-title">Doanh thu theo tháng</h3>
        {sortedMonths.length === 0 ? (
          <p className="ad-empty">Chưa có dữ liệu</p>
        ) : (
          <div className="ad-chart">
            {sortedMonths.map((key) => {
              const revenue = revenueByMonth[key];
              const heightPct = (revenue / maxRevenue) * 100;
              return (
                <div key={key} className="ad-chart-col">
                  <div className="ad-chart-bar-wrap">
                    <span className="ad-chart-value">
                      {(revenue / 1000000).toFixed(0)}M
                    </span>
                    <div
                      className="ad-chart-bar"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="ad-chart-label">{formatMonthLabel(key)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BẢNG 10 ĐƠN GẦN NHẤT */}
      <div className="ad-card">
        <h3 className="ad-card-title">10 đơn hàng gần nhất</h3>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người nhận</th>
                <th>SĐT</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="ad-row">
                  <td className="ad-td-id">#{order.id}</td>
                  <td>{order.receiverName || "—"}</td>
                  <td className="ad-td-muted">{order.phoneNumber}</td>
                  <td className="ad-td-price">
                    {order.totalPrice?.toLocaleString("vi-VN")} ₫
                  </td>
                  <td>
                    <span className={getStatusClass(order.status)}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="ad-td-muted">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;