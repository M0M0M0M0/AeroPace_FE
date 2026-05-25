import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronRight, Truck, CheckCircle, XCircle, User, Phone, MapPin, FileText, Clock, Package } from "lucide-react";
import axios from "axios";
import "./AdminOrderDetail.css";

const BASE = "http://localhost:8080/api/v1";
const ADMIN = `${BASE}/admin`;
const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META = {
    PAID: { label: "Đã thanh toán", cls: "paid", icon: <Clock size={14} /> },
    SHIP_COD: { label: "Chờ giao (COD)", cls: "ship-cod", icon: <Clock size={14} /> },
    SHIPPING: { label: "Đang giao", cls: "shipping", icon: <Truck size={14} /> },
    DELIVERED: { label: "Đã giao", cls: "delivered", icon: <CheckCircle size={14} /> },
    CANCELLED: { label: "Đã hủy", cls: "cancelled", icon: <XCircle size={14} /> },
};

const getNextStatus = (status) => {
    switch (status) {
        case "PAID":
        case "SHIP_COD": return "SHIPPING";
        case "SHIPPING": return "DELIVERED";
        default: return null;
    }
};

const canCancel = (status) => ["PAID", "SHIP_COD", "SHIPPING"].includes(status);

const fmt = (n) => n?.toLocaleString("vi-VN") + " ₫";
const fmtDate = (d) => d ? new Date(d).toLocaleString("vi-VN") : "—";

// ── Product Detail Modal (view-only, giống AdminProducts) ─────────────────────
const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;
    return (
        <div className="od-overlay" onClick={onClose}>
            <div className="od-modal od-modal--product" onClick={(e) => e.stopPropagation()}>
                <div className="od-modal-header">
                    <div>
                        <h3 className="od-modal-title">Chi tiết sản phẩm</h3>
                        <p className="od-modal-sub">#{product.productId} · {product.productName}</p>
                    </div>
                    <button className="od-modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* Ảnh */}
                {product.imageUrl && (
                    <div className="od-product-image-wrap">
                        <img src={product.imageUrl} alt={product.productName} className="od-product-image" />
                    </div>
                )}

                <div className="od-product-fields">
                    <div className="od-field-row">
                        <span className="od-field-label">Tên sản phẩm</span>
                        <span className="od-field-value">{product.productName}</span>
                    </div>
                    {product.variantName && (
                        <div className="od-field-row">
                            <span className="od-field-label">Phân loại</span>
                            <span className="od-field-value">{product.variantName}</span>
                        </div>
                    )}
                    {product.sku && (
                        <div className="od-field-row">
                            <span className="od-field-label">SKU</span>
                            <span className="od-field-value od-field-value--mono">{product.sku}</span>
                        </div>
                    )}
                    <div className="od-field-row">
                        <span className="od-field-label">Đơn giá</span>
                        <span className="od-field-value od-field-value--price">{fmt(product.price)}</span>
                    </div>
                    <div className="od-field-row">
                        <span className="od-field-label">Số lượng</span>
                        <span className="od-field-value">x{product.quantity}</span>
                    </div>
                    <div className="od-field-row od-field-row--total">
                        <span className="od-field-label">Thành tiền</span>
                        <span className="od-field-value od-field-value--price">{fmt(product.price * product.quantity)}</span>
                    </div>
                </div>

                <div className="od-modal-actions">
                    <button className="od-btn-cancel" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

// ── Customer Info Modal ───────────────────────────────────────────────────────
const CustomerModal = ({ userId, username, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${ADMIN}/customers/${userId}`, {
                    headers: authHeader(),
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [userId]);

    return (
        <div className="od-overlay" onClick={onClose}>
            <div className="od-modal" onClick={(e) => e.stopPropagation()}>
                <div className="od-modal-header">
                    <div>
                        <h3 className="od-modal-title">Thông tin khách hàng</h3>
                        <p className="od-modal-sub">@{username}</p>
                    </div>
                    <button className="od-modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                {loading ? (
                    <div className="od-modal-loading">Đang tải...</div>
                ) : !data ? (
                    <p style={{ color: "#555", fontSize: "0.875rem" }}>Không tải được thông tin.</p>
                ) : (
                    <div className="od-product-fields">
                        <div className="od-field-row">
                            <span className="od-field-label">Username</span>
                            <span className="od-field-value">{data.username || "—"}</span>
                        </div>
                        <div className="od-field-row">
                            <span className="od-field-label">Email</span>
                            <span className="od-field-value">{data.email || "—"}</span>
                        </div>
                        <div className="od-field-row">
                            <span className="od-field-label">Họ tên</span>
                            <span className="od-field-value">{data.fullName || "—"}</span>
                        </div>
                        <div className="od-field-row">
                            <span className="od-field-label">Số điện thoại</span>
                            <span className="od-field-value">{data.phoneNumber || "—"}</span>
                        </div>
                        <div className="od-field-row">
                            <span className="od-field-label">Địa chỉ</span>
                            <span className="od-field-value">{data.address || "—"}</span>
                        </div>
                        <div className="od-field-row">
                            <span className="od-field-label">Giới tính</span>
                            <span className="od-field-value">
                                {data.gender === "male"
                                    ? "Nam"
                                    : data.gender === "female"
                                        ? "Nữ"
                                        : "—"}
                            </span>
                        </div>
                        <div className="od-field-row">
                            <span className="od-field-label">Ngày sinh</span>
                            <span className="od-field-value">{data.dob || "—"}</span>
                        </div>
                        <div className="od-field-row">
                            <span className="od-field-label">Ngày tạo TK</span>
                            <span className="od-field-value">{data.createdAt ? new Date(data.createdAt).toLocaleString("vi-VN") : "—"}</span>
                        </div>
                    </div>
                )}

                <div className="od-modal-actions">
                    <button className="od-btn-cancel" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

// ── Cancel Modal ──────────────────────────────────────────────────────────────
const CancelModal = ({ orderCode, onClose, onConfirm }) => {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError("Vui lòng nhập lý do hủy đơn.");
            return;
        }
        onConfirm(reason.trim());
    };

    return (
        <div className="od-overlay" onClick={onClose}>
            <div className="od-modal od-modal--sm" onClick={(e) => e.stopPropagation()}>
                <div className="od-modal-header">
                    <div>
                        <h3 className="od-modal-title">Hủy đơn hàng</h3>
                        <p className="od-modal-sub">Đơn hàng #{orderCode}</p>
                    </div>
                    <button className="od-modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <p className="od-cancel-desc">
                    Hành động này không thể hoàn tác. Vui lòng nhập lý do hủy đơn.
                </p>

                <div className="od-form-row">
                    <label>Lý do hủy *</label>
                    <textarea
                        placeholder="VD: Khách yêu cầu hủy, hàng hết hàng..."
                        value={reason}
                        rows={3}
                        onChange={(e) => { setReason(e.target.value); setError(""); }}
                    />
                </div>

                {error && <p className="od-form-error">{error}</p>}

                <div className="od-modal-actions">
                    <button className="od-btn-cancel" onClick={onClose}>Bỏ qua</button>
                    <button className="od-btn-danger" onClick={handleConfirm}>Xác nhận hủy</button>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const AdminOrderDetail = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [productModal, setProductModal] = useState(null);  
    const [customerModal, setCustomerModal] = useState(false);
    const [cancelModal, setCancelModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${ADMIN}/orders/details/${orderCode}`, { headers: authHeader() });
            setOrder(res.data);
            console.log("Order details:", res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrder(); }, [orderCode]);

    // ── Update status ────────────────────────────────────────────────────────
    const handleNextStatus = async () => {
        const next = getNextStatus(order.status);
        if (!next) return;
        setUpdating(true);
        try {
            await axios.put(
                `${ADMIN}/orders/${orderCode}/status?status=${next}`, {},
                { headers: authHeader() }
            );
            await fetchOrder();
        } catch (err) {
            console.error(err);
            alert("Cập nhật thất bại!");
        } finally {
            setUpdating(false);
        }
    };

    // ── Cancel ───────────────────────────────────────────────────────────────
    const handleCancel = async (reason) => {
        setUpdating(true);
        try {
            await axios.put(
                `${ADMIN}/orders/${orderCode}/status?status=CANCELLED`,
                { reason },
                { headers: authHeader() }
            );
            setCancelModal(false);
            await fetchOrder();
        } catch (err) {
            console.error(err);
            alert("Hủy thất bại!");
        } finally {
            setUpdating(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="od-page">
                <div className="od-loading">Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="od-page">
                <div className="od-loading">Không tìm thấy đơn hàng.</div>
            </div>
        );
    }

    const meta = STATUS_META[order.status] || {};
    const nextStatus = getNextStatus(order.status);
    const nextMeta = nextStatus ? STATUS_META[nextStatus] : null;

    return (
        <div className="od-page">
            {/* ── Back + Title ───────────────────────────────────────────────── */}
            <div className="od-topbar">
                <button className="od-back-btn" onClick={() => navigate("/admin/orders")}>
                    <ArrowLeft size={18} /> Quay lại
                </button>
                <div className="od-topbar-info">
                    <h1 className="od-title">Đơn hàng <span className="od-title-id">#{order.orderCode}</span></h1>
                    <span className={`od-badge od-badge--${meta.cls}`}>
                        {meta.icon} {meta.label}
                    </span>
                </div>
                <p className="od-created">Đặt lúc: {fmtDate(order.createdAt)}</p>
            </div>

            {/* ── Content grid ───────────────────────────────────────────────── */}
            <div className="od-grid">

                {/* LEFT: Items + Tổng tiền */}
                <div className="od-col-main">
                    <div className="od-card">
                        <h2 className="od-card-title">
                            <Package size={16} /> Sản phẩm ({order.items?.length || 0})
                        </h2>
                        <div className="od-items">
                            {order.items?.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="od-item od-item--clickable"
                                    onClick={() => setProductModal(item)}
                                    title="Xem chi tiết sản phẩm"
                                >
                                    <div className="od-item-img-wrap">
                                        {item.productImgUrl
                                            ? <img src={item.productImgUrl} alt={item.productName} className="od-item-img" />
                                            : <div className="od-item-img od-item-img--empty"><Package size={18} /></div>
                                        }
                                    </div>
                                    <div className="od-item-info">
                                        <span className="od-item-name">{item.productName}</span>
                                        {item.variantName && <span className="od-item-variant">{item.variantName}</span>}
                                        {item.sku && <span className="od-item-sku">SKU: {item.sku}</span>}
                                    </div>
                                    <div className="od-item-right">
                                        <span className="od-item-qty">x{item.quantity}</span>
                                        <span className="od-item-price">{fmt(item.price)}</span>
                                        <ChevronRight size={14} className="od-item-arrow" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="od-total-row">
                            <span>Tổng cộng</span>
                            <span className="od-total-price">{fmt(order.totalPrice)}</span>
                        </div>
                    </div>

                    {/* Ghi chú */}
                    {order.note && (
                        <div className="od-card od-card--note">
                            <h2 className="od-card-title"><FileText size={16} /> Ghi chú</h2>
                            <p className="od-note-text">{order.note}</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Thông tin + Actions */}
                <div className="od-col-side">

                    {/* Thông tin người nhận */}
                    <div className="od-card">
                        <h2 className="od-card-title"><User size={16} /> Thông tin người nhận</h2>
                        <div className="od-info-list">
                            {/* Username — clickable */}
                            <div className="od-info-row od-info-row--username" onClick={() => setCustomerModal(true)} title="Xem thông tin tài khoản">
                                <span className="od-info-icon"><User size={14} /></span>
                                <div className="od-info-content">
                                    <span className="od-info-label">Địa chỉ giao hàng</span>
                                    <span className="od-info-value">
                                        {[order.shippingAddress, order.ward, order.district, order.province]
                                            .filter(Boolean)
                                            .join(", ") || "—"}
                                    </span>
                                </div>
                            </div>

                            <div className="od-info-row">
                                <span className="od-info-icon"><User size={14} /></span>
                                <div className="od-info-content">
                                    <span className="od-info-label">Người nhận</span>
                                    <span className="od-info-value">{order.receiverName || "—"}</span>
                                </div>
                            </div>

                            <div className="od-info-row">
                                <span className="od-info-icon"><Phone size={14} /></span>
                                <div className="od-info-content">
                                    <span className="od-info-label">Số điện thoại</span>
                                    <span className="od-info-value">{order.phoneNumber || "—"}</span>
                                </div>
                            </div>

                            <div className="od-info-row">
                                <span className="od-info-icon"><MapPin size={14} /></span>
                                <div className="od-info-content">
                                    <span className="od-info-label">Địa chỉ giao hàng</span>
                                    <span className="od-info-value">{order.shippingAddress || "—"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {(nextStatus || canCancel(order.status)) && (
                        <div className="od-card od-card--actions">
                            <h2 className="od-card-title">Thao tác</h2>
                            <div className="od-action-btns">
                                {canCancel(order.status) && (
                                    <button
                                        className="od-btn-cancel-order"
                                        onClick={() => setCancelModal(true)}
                                        disabled={updating}
                                    >
                                        <XCircle size={16} /> Hủy đơn hàng
                                    </button>
                                )}
                                {nextStatus && nextMeta && (
                                    <button
                                        className="od-btn-next-status"
                                        onClick={handleNextStatus}
                                        disabled={updating}
                                    >
                                        {updating ? "Đang cập nhật..." : (
                                            <>
                                                {nextMeta.icon}
                                                Chuyển sang: {nextMeta.label}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── Modals ─────────────────────────────────────────────────────── */}
            {productModal && (
                <ProductDetailModal
                    product={productModal}
                    onClose={() => setProductModal(null)}
                />
            )}

            {customerModal && (
                <CustomerModal
                    userId={order.userId}
                    username={order.username || `user_${order.userId}`}
                    onClose={() => setCustomerModal(false)}
                />
            )}

            {cancelModal && (
                <CancelModal
                    orderCode={order.orderCode}
                    onClose={() => setCancelModal(false)}
                    onConfirm={handleCancel}
                />
            )}
        </div>
    );
};

export default AdminOrderDetail;