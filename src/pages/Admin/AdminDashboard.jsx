import React, { useEffect, useState } from "react";
import {
  Download,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
} from "lucide-react";
import * as XLSX from "xlsx";
import axios from "axios";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/v1/orders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "PAID" || o.status === "SHIP_COD",
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;

  // ================= DOANH THU THEO THÁNG =================
  const revenueByMonth = {};
  orders
    .filter((o) => o.status !== "CANCELLED")
    .forEach((o) => {
      const month = new Date(o.createdAt).getMonth() + 1;
      const key = `Tháng ${month}`;
      revenueByMonth[key] = (revenueByMonth[key] || 0) + (o.totalPrice || 0);
    });
  const maxRevenue = Math.max(...Object.values(revenueByMonth), 1);

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
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");
    XLSX.writeFile(wb, "Bao_Cao_Don_Hang_ShopRunner.xlsx");
  };

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

  const getStatusStyle = (status) => {
    switch (status) {
      case "PAID":
        return { background: "rgba(96,165,250,0.2)", color: "#60a5fa" };
      case "SHIP_COD":
        return { background: "rgba(250,204,21,0.2)", color: "#facc15" };
      case "SHIPPING":
        return { background: "rgba(251,146,60,0.2)", color: "#fb923c" };
      case "DELIVERED":
        return { background: "rgba(74,222,128,0.2)", color: "#4ade80" };
      case "CANCELLED":
        return { background: "rgba(248,113,113,0.2)", color: "#f87171" };
      default:
        return { background: "#333", color: "#fff" };
    }
  };

  if (loading)
    return <div style={{ padding: "40px", color: "#aaa" }}>Đang tải...</div>;

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2>Tổng quan hệ thống</h2>
        <button
          onClick={handleExportData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <Download size={18} /> Xuất Excel
        </button>
      </div>

      {/* THỐNG KÊ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {[
          {
            icon: <DollarSign size={20} color="#22c55e" />,
            label: "Tổng doanh thu",
            value: totalRevenue.toLocaleString("vi-VN") + " ₫",
          },
          {
            icon: <ShoppingBag size={20} color="#3b82f6" />,
            label: "Tổng đơn hàng",
            value: totalOrders + " đơn",
          },
          {
            icon: <Clock size={20} color="#facc15" />,
            label: "Chờ xử lý",
            value: pendingOrders + " đơn",
          },
          {
            icon: <TrendingUp size={20} color="#4ade80" />,
            label: "Đã giao thành công",
            value: deliveredOrders + " đơn",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: "#1a1a1a",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #333",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#a3a3a3",
                fontSize: "13px",
              }}
            >
              {card.icon} {card.label}
            </div>
            <h3
              style={{ fontSize: "22px", margin: "10px 0 0 0", color: "#fff" }}
            >
              {card.value}
            </h3>
          </div>
        ))}
      </div>

      {/* BIỂU ĐỒ DOANH THU THEO THÁNG */}
      <div
        style={{
          background: "#1a1a1a",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #333",
          marginBottom: "28px",
        }}
      >
        <h3 style={{ marginBottom: "20px" }}>Doanh thu theo tháng</h3>
        {Object.keys(revenueByMonth).length === 0 ? (
          <p style={{ color: "#aaa" }}>Chưa có dữ liệu</p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "16px",
                height: "200px",
                padding: "0 8px",
              }}
            >
              {Object.entries(revenueByMonth).map(([month, revenue], idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#a3a3a3",
                        marginBottom: "4px",
                      }}
                    >
                      {(revenue / 1000000).toFixed(0)}M
                    </span>
                    <div
                      style={{
                        width: "60%",
                        height: `${(revenue / maxRevenue) * 100}%`,
                        background: "#3b82f6",
                        borderRadius: "4px 4px 0 0",
                        minHeight: "4px",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#a3a3a3",
                      marginTop: "6px",
                    }}
                  >
                    {month}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* BẢNG ĐƠN HÀNG GẦN ĐÂY */}
      <div
        style={{
          background: "#1a1a1a",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #333",
        }}
      >
        <h3 style={{ marginBottom: "16px" }}>10 đơn hàng gần nhất</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ color: "#a3a3a3", borderBottom: "1px solid #333" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>ID</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Người nhận</th>
              <th style={{ padding: "10px", textAlign: "left" }}>SĐT</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Tổng tiền</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Trạng thái</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Ngày đặt</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => {
              const style = getStatusStyle(order.status);
              return (
                <tr key={order.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "10px", color: "#fff" }}>
                    #{order.id}
                  </td>
                  <td style={{ padding: "10px", color: "#fff" }}>
                    {order.receiverName || "—"}
                  </td>
                  <td style={{ padding: "10px", color: "#aaa" }}>
                    {order.phoneNumber}
                  </td>
                  <td style={{ padding: "10px", color: "#fff" }}>
                    {order.totalPrice?.toLocaleString("vi-VN")} ₫
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        ...style,
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                      }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ padding: "10px", color: "#aaa" }}>
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
