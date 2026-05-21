// AdminShippingPage.jsx
import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import "./AdminCatalogPage.css";

const BASE = "http://localhost:8080/api/v1";
const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const EMPTY_SHIPPING = { name: "", fee: "" };

const AdminShippingPage = () => {
    const [shippings, setShippings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [idSearch, setIdSearch] = useState("");

    const [modal, setModal] = useState({
        open: false,
        mode: "add",
        data: EMPTY_SHIPPING,
        id: null,
    });
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        id: null,
        name: "",
    });
    const [error, setError] = useState("");

    // ── FETCH ────────────────────────────────────────────────────────────────
    const fetchShippings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE}/shipping-methods`, {
                headers: authHeader(),
            });
            setShippings(res.data);
            console.log("Fetched shippings:", res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShippings();
    }, []);

    // ── HANDLERS ─────────────────────────────────────────────────────────────
    const openAdd = () => {
        setError("");
        setModal({ open: true, mode: "add", data: EMPTY_SHIPPING, id: null });
    };

    const openEdit = (s) => {
        setError("");
        setModal({
            open: true,
            mode: "edit",
            data: { name: s.name, fee: String(s.fee), status: s.status },
            id: s.id,
        });
    };

    const closeModal = () =>
        setModal({ open: false, mode: "add", data: EMPTY_SHIPPING, id: null });

    const handleSubmit = async () => {
        setError("");
        if (!modal.data.name.trim()) {
            setError("Tên phương thức không được để trống.");
            return;
        }
        const feeNum = parseFloat(modal.data.fee);
        if (modal.data.fee === "" || isNaN(feeNum) || feeNum < 0) {
            setError("Phí vận chuyển phải là số không âm.");
            return;
        }
        const payload = modal.mode === "add"
            ? { name: modal.data.name.trim(), fee: feeNum }
            : { name: modal.data.name.trim(), fee: feeNum, status: modal.data.status };
        try {
            if (modal.mode === "add") {
                await axios.post(`${BASE}/shipping-methods`, payload, {
                    headers: authHeader(),
                });
            } else {
                await axios.put(`${BASE}/shipping-methods/${modal.id}`, payload, {
                    headers: authHeader(),
                });
            }
            await fetchShippings();
            closeModal();
        } catch (err) {
            const msg = err.response?.data?.message || "Đã có lỗi xảy ra.";
            setError(msg);
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${BASE}/shipping-methods/${deleteModal.id}`, {
                headers: authHeader(),
            });
            await fetchShippings();
            setDeleteModal({ open: false, id: null, name: "" });
        } catch (err) {
            console.error(err);
            alert("Xóa thất bại!");
        }
    };

    // ── FILTER ───────────────────────────────────────────────────────────────
    const filtered = shippings.filter((s) => {
        const matchName = s.name.toLowerCase().includes(search.toLowerCase());
        const matchId = idSearch ? String(s.id).includes(idSearch.trim()) : true;
        return matchName && matchId;
    });

    // ── FORMAT FEE ───────────────────────────────────────────────────────────
    const formatFee = (fee) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(fee);

    // ═════════════════════════════════════════════════════════════════════════
    return (
        <div className="cp-page">
            {/* Header */}
            <div className="cp-header">
                <div>
                    <h1 className="cp-title">Phương thức vận chuyển</h1>
                    <p className="cp-subtitle">Quản lý các hình thức giao hàng và phí vận chuyển</p>
                </div>
            </div>


            {/* Toolbar */}
            <div className="cp-toolbar">
                <input
                    className="cp-search"
                    placeholder="Tìm theo ID..."
                    value={idSearch}
                    onChange={(e) => setIdSearch(e.target.value)}
                    style={{ maxWidth: 140 }}
                />
                <input
                    className="cp-search"
                    placeholder="Tìm phương thức..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="cp-btn-add" onClick={openAdd}>
                    <Plus size={16} /> Thêm mới
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="cp-loading">Đang tải...</div>
            ) : (
                <div className="cp-table-wrap">
                    <table className="cp-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên phương thức</th>
                                <th>Phí vận chuyển</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="cp-empty-row">
                                        Không tìm thấy phương thức nào.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s, idx) => (
                                    <tr key={s.id} className="cp-row">
                                        <td>{idx + 1}</td>
                                        <td className="cp-name">{s.name}</td>
                                        <td style={{ color: "#4ade80", fontWeight: 600 }}>
                                            {formatFee(s.fee)}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: "3px 10px",
                                                borderRadius: "20px",
                                                fontSize: "0.78rem",
                                                fontWeight: 600,
                                                background: s.status === "ACTIVE" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                                                color: s.status === "ACTIVE" ? "#4ade80" : "#f87171",
                                                border: `1px solid ${s.status === "ACTIVE" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                                            }}>
                                                {s.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="cp-actions">
                                                <button
                                                    className="cp-action-btn cp-edit-btn"
                                                    onClick={() => openEdit(s)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    className="cp-action-btn cp-delete-btn"
                                                    onClick={() =>
                                                        setDeleteModal({ open: true, id: s.id, name: s.name })
                                                    }
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={15} />
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

            {/* ── MODAL ADD/EDIT ──────────────────────────────────────────────────── */}
            {modal.open && (
                <div className="cp-overlay" onClick={closeModal}>
                    <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cp-modal-header">
                            <div>
                                <h3 className="cp-modal-title">
                                    {modal.mode === "add"
                                        ? "Thêm phương thức mới"
                                        : "Chỉnh sửa phương thức"}
                                </h3>
                                <p className="cp-modal-sub">
                                    {modal.mode === "edit" && `ID: #${modal.id}`}
                                </p>
                            </div>
                            <button className="cp-modal-close" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="cp-form-row">
                            <label>Tên phương thức *</label>
                            <input
                                type="text"
                                placeholder="VD: Giao hàng tiêu chuẩn..."
                                value={modal.data.name}
                                onChange={(e) =>
                                    setModal({ ...modal, data: { ...modal.data, name: e.target.value } })
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                        </div>

                        <div className="cp-form-row">
                            <label>Phí vận chuyển (VNĐ) *</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="VD: 30000"
                                value={modal.data.fee}
                                onChange={(e) =>
                                    setModal({ ...modal, data: { ...modal.data, fee: e.target.value } })
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                        </div>
                        <div className="cp-form-row">
                            <label>Trạng thái</label>
                            <select
                                value={modal.data.status}
                                onChange={(e) =>
                                    setModal({ ...modal, data: { ...modal.data, status: e.target.value } })
                                }
                                style={{
                                    background: "#1a1a1a",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    padding: "10px 14px",
                                    fontSize: "0.9rem",
                                    outline: "none",
                                    width: "100%",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="DISABLE">Vô hiệu</option>
                            </select>
                        </div>

                        {error && <p className="cp-form-error">{error}</p>}

                        <div className="cp-modal-actions">
                            <button className="cp-btn-cancel" onClick={closeModal}>
                                Hủy
                            </button>
                            <button className="cp-btn-save" onClick={handleSubmit}>
                                {modal.mode === "add" ? "Thêm mới" : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL XÁC NHẬN XÓA ─────────────────────────────────────────────── */}
            {deleteModal.open && (
                <div
                    className="cp-overlay"
                    onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                >
                    <div
                        className="cp-modal cp-modal-delete"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cp-modal-header">
                            <h3 className="cp-modal-title">Xác nhận xóa</h3>
                            <button
                                className="cp-modal-close"
                                onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="cp-delete-msg">
                            Bạn có chắc muốn xóa phương thức{" "}
                            <strong>"{deleteModal.name}"</strong>? Hành động này không thể
                            hoàn tác.
                        </p>
                        <div className="cp-modal-actions">
                            <button
                                className="cp-btn-cancel"
                                onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                            >
                                Hủy
                            </button>
                            <button className="cp-btn-danger" onClick={handleDelete}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminShippingPage;