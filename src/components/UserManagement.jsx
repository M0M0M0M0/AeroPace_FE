import React, { useState } from "react";
import { Shield, User as UserIcon, Edit2, Trash2 } from "lucide-react";

const UserManagement = () => {
  // Giả lập dữ liệu fetch từ API GET /api/users
  const [users, setUsers] = useState([
    { id: 1, username: "admin_tong", email: "admin@shoprunner.com", role: "ADMIN", createdAt: "2023-10-01" },
    { id: 2, username: "hoang_runner", email: "hoang@gmail.com", role: "USER", createdAt: "2023-10-15" },
    { id: 3, username: "nhanvien_sale", email: "sale@shoprunner.com", role: "USER", createdAt: "2023-11-02" },
  ]);

  // Hàm thay đổi Role (Phân quyền)
  const handleToggleRole = (userId, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if(window.confirm(`Bạn có chắc muốn đổi quyền của người dùng này thành ${newRole}?`)) {
      // Gọi API PUT /api/users/{userId}/role ở đây
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  return (
    <div>
      <h2>Quản lý Người dùng & Phân quyền</h2>
      <div style={{ background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#222', color: '#a3a3a3', borderBottom: '1px solid #333' }}>
            <tr>
              <th style={{ padding: '15px' }}>ID</th>
              <th style={{ padding: '15px' }}>Tài khoản / Email</th>
              <th style={{ padding: '15px' }}>Quyền (Role)</th>
              <th style={{ padding: '15px' }}>Ngày đăng ký</th>
              <th style={{ padding: '15px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #333', color: '#fff' }}>
                <td style={{ padding: '15px' }}>#{user.id}</td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                  <div style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>{user.email}</div>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    padding: '5px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem',
                    background: user.role === "ADMIN" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: user.role === "ADMIN" ? '#ef4444' : '#3b82f6',
                    display: 'inline-flex', alignItems: 'center', gap: '5px'
                  }}>
                    {user.role === "ADMIN" ? <Shield size={14}/> : <UserIcon size={14}/>}
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '15px', color: '#a3a3a3' }}>{user.createdAt}</td>
                <td style={{ padding: '15px' }}>
                  <button 
                    onClick={() => handleToggleRole(user.id, user.role)}
                    style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '10px' }}
                  >
                    Đổi Quyền
                  </button>
                  <button style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;