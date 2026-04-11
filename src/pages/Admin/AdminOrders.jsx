import React, { useState, useEffect } from "react";
import { Eye, Edit, Search, X } from "lucide-react";
import axios from "axios";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    orderId: null,
    targetStatus: "",
  });

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    order: null,
  });

  // ================= FETCH =================
  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/v1/orders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ================= CẬP NHẬT TRẠNG THÁI =================
  const handleConfirmStatusChange = async () => {
    try {
      await axios.put(
        `http://localhost:8080/api/v1/orders/${statusModal.orderId}/status?status=${statusModal.targetStatus}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );
      await fetchOrders();
      setStatusModal({ isOpen: false, orderId: null, targetStatus: "" });
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại!");
    }
  };

  // ================= LỌC =================
  const filteredOrders = orders
    .filter((o) => {
      if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
      const s = searchTerm.toLowerCase();
      return (
        String(o.id).includes(s) ||
        (o.receiverName || "").toLowerCase().includes(s) ||
        (o.phoneNumber || "").includes(s) ||
        (o.shippingAddress || "").toLowerCase().includes(s)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ================= HELPERS =================
  const getStatusLabel = (status) => {
    switch (status) {
      case "PAID": return "Đã thanh toán";
      case "SHIP_COD": return "Chờ giao (COD)";
      case "SHIPPING": return "Đang giao";
      case "DELIVERED": return "Đã giao";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "PAID": return { background: "rgba(96,165,250,0.2)", color: "#60a5fa" };
      case "SHIP_COD": return { background: "rgba(250,204,21,0.2)", color: "#facc15" };
      case "SHIPPING": return { background: "rgba(251,146,60,0.2)", color: "#fb923c" };
      case "DELIVERED": return { background: "rgba(74,222,128,0.2)", color: "#4ade80" };
      case "CANCELLED": return { background: "rgba(248,113,113,0.2)", color: "#f87171" };
      default: return { background: "#333", color: "#fff" };
    }
  };

  if (loading) return <div style={{ padding: "40px", color: "#aaa" }}>Đang tải...</div>;

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Quản lý Đơn hàng</h2>
        <span style={{ color: "#aaa", fontSize: "14px" }}>{filteredOrders.length} đơn hàng</span>
      </div>

      {/* TÌM KIẾM + LỌC */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", padding: "8px 12px", flex: 1 }}>
          <Search size={18} color="#888" />
          <input
            type="text"
            placeholder="Tìm theo ID, tên, SĐT, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", color: "#fff", outline: "none", marginLeft: "10px", width: "100%", fontSize: "14px" }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#888" }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* LỌC THEO TRẠNG THÁI */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "8px 12px", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "8px", outline: "none", fontSize: "14px", cursor: "pointer" }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="SHIP_COD">Chờ giao (COD)</option>
          <option value="SHIPPING">Đang giao</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* BẢNG */}
      <div style={{ background: "#1a1a1a", borderRadius: "12px", border: "1px solid #333", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", color: "#fff" }}>
          <thead style={{ background: "#222", borderBottom: "1px solid #333" }}>
            <tr>
              <th style={{ padding: "14px" }}>ID</th>
              <th style={{ padding: "14px" }}>Người nhận</th>
              <th style={{ padding: "14px" }}>SĐT</th>
              <th style={{ padding: "14px" }}>Địa chỉ</th>
              <th style={{ padding: "14px" }}>Tổng tiền</th>
              <th style={{ padding: "14px" }}>Trạng thái</th>
              <th style={{ padding: "14px" }}>Ngày đặt</th>
              <th style={{ padding: "14px" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const statusStyle = getStatusStyle(order.status);
                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid #2a2a2a" }}>
                    <td style={{ padding: "14px", fontWeight: "bold" }}>#{order.id}</td>
                    <td style={{ padding: "14px" }}>{order.receiverName || "—"}</td>
                    <td style={{ padding: "14px", color: "#aaa" }}>{order.phoneNumber}</td>
                    <td style={{ padding: "14px", color: "#aaa", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.shippingAddress}
                    </td>
                    <td style={{ padding: "14px", color: "#4ade80", fontWeight: "bold" }}>
                      {order.totalPrice?.toLocaleString("vi-VN")} ₫
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ ...statusStyle, padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                          {getStatusLabel(order.status)}
                        </span>
                        <button
                          onClick={() => setStatusModal({ isOpen: true, orderId: order.id, targetStatus: order.status })}
                          style={{ background: "transparent", color: "#a3a3a3", border: "none", cursor: "pointer" }}
                          title="Cập nhật trạng thái"
                        >
                          <Edit size={15} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "14px", color: "#aaa", fontSize: "13px" }}>
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <button
                        onClick={() => setDetailModal({ isOpen: true, order })}
                        style={{ background: "transparent", color: "#3b82f6", border: "none", cursor: "pointer" }}
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                  Không tìm thấy đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CẬP NHẬT TRẠNG THÁI */}
      {statusModal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "12px", width: "400px", border: "1px solid #333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Cập nhật trạng thái</h3>
              <button onClick={() => setStatusModal({ isOpen: false, orderId: null, targetStatus: "" })} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "#a3a3a3", marginBottom: "16px" }}>
              Đơn hàng: <strong style={{ color: "#fff" }}>#{statusModal.orderId}</strong>
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", color: "#888", marginBottom: "8px", fontSize: "13px" }}>Trạng thái mới</label>
              <select
                value={statusModal.targetStatus}
                onChange={(e) => setStatusModal({ ...statusModal, targetStatus: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#222", color: "#fff", border: "1px solid #444", outline: "none" }}
              >
                <option value="PAID">Đã thanh toán</option>
                <option value="SHIP_COD">Chờ giao (COD)</option>
                <option value="SHIPPING">Đang giao</option>
                <option value="DELIVERED">Đã giao</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setStatusModal({ isOpen: false, orderId: null, targetStatus: "" })} style={{ padding: "10px 16px", background: "#333", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                Hủy
              </button>
              <button onClick={handleConfirmStatusChange} style={{ padding: "10px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {detailModal.isOpen && detailModal.order && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a1a", padding: "25px", borderRadius: "12px", width: "500px", border: "1px solid #333", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0 }}>Chi tiết đơn hàng #{detailModal.order.id}</h3>
              <button onClick={() => setDetailModal({ isOpen: false, order: null })} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: "16px", padding: "14px", background: "#222", borderRadius: "8px" }}>
              <p style={{ margin: "0 0 6px 0", color: "#aaa", fontSize: "13px" }}>Thông tin người nhận</p>
              <p style={{ margin: "4px 0", color: "#fff" }}>{detailModal.order.receiverName || "—"}</p>
              <p style={{ margin: "4px 0", color: "#aaa" }}>{detailModal.order.phoneNumber}</p>
              <p style={{ margin: "4px 0", color: "#aaa" }}>{detailModal.order.shippingAddress}</p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "10px" }}>Sản phẩm</p>
              {detailModal.order.items?.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2a2a2a" }}>
                  <span style={{ color: "#ddd", flex: 1 }}>{item.productName}</span>
                  <span style={{ color: "#aaa", marginLeft: "12px" }}>x{item.quantity}</span>
                  <span style={{ color: "#fff", marginLeft: "16px", fontWeight: "bold" }}>{item.price?.toLocaleString("vi-VN")} ₫</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px", background: "#222", borderRadius: "8px" }}>
              <span style={{ color: "#aaa" }}>Tổng tiền</span>
              <span style={{ color: "#4ade80", fontWeight: "bold", fontSize: "16px" }}>
                {detailModal.order.totalPrice?.toLocaleString("vi-VN")} ₫
              </span>
            </div>

            <p style={{ color: "#666", fontSize: "12px", marginTop: "12px", textAlign: "right" }}>
              Đặt lúc: {new Date(detailModal.order.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;