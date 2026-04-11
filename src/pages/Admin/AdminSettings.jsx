import React, { useState } from "react";
import { Shield, User, Trash2 } from "lucide-react";

const AdminSettings = () => {
  // Giả lập danh sách User đăng ký
  const [users, setUsers] = useState([
    { id: 1, name: "Quản trị viên", email: "admin@gmail.com", phone: "0988111222", role: "ADMIN" },
    { id: 2, name: "Khách hàng 1", email: "user@gmail.com", phone: "0911222333", role: "USER" },
    { id: 3, name: "Khách hàng 2", email: "nguyenvana@gmail.com", phone: "0901234567", role: "USER" },
  ]);

  // Hàm chuyển đổi Role
  const toggleRole = (userId, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  return (
    <div>
      <h2 style={{ marginBottom: "5px" }}>Cài đặt hệ thống</h2>
      <p style={{ color: "#a3a3a3", marginBottom: "20px" }}>Quản lý danh sách tài khoản và phân quyền.</p>

      <div style={{ background: "#1a1a1a", borderRadius: "12px", border: "1px solid #333", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", color: "#fff" }}>
          <thead style={{ background: "#222", borderBottom: "1px solid #333" }}>
            <tr>
              <th style={{ padding: "15px" }}>Họ và Tên</th>
              <th style={{ padding: "15px" }}>Thông tin liên hệ</th>
              <th style={{ padding: "15px" }}>Vai trò (Role)</th>
              <th style={{ padding: "15px" }}>Cấp quyền Admin</th>
              <th style={{ padding: "15px" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "15px", fontWeight: "bold" }}>{user.name}</td>
                <td style={{ padding: "15px" }}>
                  <div>{user.email}</div>
                  <div style={{ fontSize: "0.85rem", color: "#a3a3a3" }}>{user.phone}</div>
                </td>
                <td style={{ padding: "15px" }}>
                  <span style={{ 
                    padding: "5px 10px", borderRadius: "20px", fontSize: "0.8rem",
                    background: user.role === "ADMIN" ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                    color: user.role === "ADMIN" ? "#ef4444" : "#3b82f6",
                    display: "inline-flex", alignItems: "center", gap: "5px"
                  }}>
                    {user.role === "ADMIN" ? <Shield size={14}/> : <User size={14}/>}
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: "15px" }}>
                   {/* Nút Toggle Quyền */}
                  <button 
                    onClick={() => toggleRole(user.id, user.role)}
                    style={{
                      background: user.role === "ADMIN" ? "#ef4444" : "#333",
                      color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "5px"
                    }}
                  >
                    {user.role === "ADMIN" ? "Gỡ quyền Admin" : "Lên Admin"}
                  </button>
                </td>
                <td style={{ padding: "15px" }}>
                  <button style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSettings;