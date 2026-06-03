import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, X, ChevronRight, Truck, CheckCircle, XCircle,
    User, Phone, MapPin, FileText, Clock, Package, ExternalLink,
    CreditCard, AlertTriangle, RefreshCw
} from "lucide-react";
import axios from "axios";
import "./AdminOrderDetail.css";

const BASE = "http://localhost:8080/api/v1";
const ADMIN = `${BASE}/admin`;
const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META = {
    PAID: { label: "Đã thanh toán", cls: "paid", icon: <CheckCircle size={12} /> },
    PENDING: { label: "Chờ xử lý", cls: "pending", icon: <Clock size={12} /> },
    SHIPPING: { label: "Đang giao", cls: "shipping", icon: <Truck size={12} /> },
    DELIVERED: { label: "Đã giao - Chờ khách hàng xác nhận", cls: "delivered", icon: <CheckCircle size={12} /> },
    CANCELLED: { label: "Đã hủy", cls: "cancelled", icon: <XCircle size={12} /> },
    COMPLETED: { label: "Hoàn tất", cls: "completed", icon: <CheckCircle size={12} /> },
};

const PAYMENT_META = {
    STRIPE: { label: "Stripe", cls: "stripe" },
    COD: { label: "PayPal", cls: "paypal" },
};
const getNextStatus = (status) => {
    switch (status) {
        case "PENDING":
            return "PAID";

        case "PAID":
            return "SHIPPING";

        case "SHIPPING":
            return "DELIVERED";

        default:
            return null;
    }
};

const canCancel = (status) => ["PAID", "PENDING"].includes(status);

const fmt = (n) => n?.toLocaleString("vi-VN") + " ₫";
const fmtDate = (d) => d ? new Date(d).toLocaleString("vi-VN") : "—";

// ── Product Detail Modal ──────────────────────────────────────────────────────
const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;
    return (
        <div className="aod-overlay" onClick={onClose}>
            <div className="aod-modal aod-modal--product" onClick={(e) => e.stopPropagation()}>
                <div className="aod-modal-header">
                    <div>
                        <h3 className="aod-modal-title">Chi tiết sản phẩm</h3>
                        <p className="aod-modal-sub">#{product.productId} · {product.productName}</p>
                    </div>
                    <button className="aod-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                {product.imageUrl && (
                    <div className="aod-product-image-wrap">
                        <img src={product.imageUrl} alt={product.productName} className="aod-product-image" />
                    </div>
                )}
                <div className="aod-product-fields">
                    <div className="aod-field-row">
                        <span className="aod-field-label">Tên sản phẩm</span>
                        <span className="aod-field-value">{product.productName}</span>
                    </div>
                    {product.variantName && (
                        <div className="aod-field-row">
                            <span className="aod-field-label">Phân loại</span>
                            <span className="aod-field-value">{product.variantName}</span>
                        </div>
                    )}
                    {product.sku && (
                        <div className="aod-field-row">
                            <span className="aod-field-label">SKU</span>
                            <span className="aod-field-value aod-field-value--mono">{product.sku}</span>
                        </div>
                    )}
                    <div className="aod-field-row">
                        <span className="aod-field-label">Đơn giá</span>
                        <span className="aod-field-value aod-field-value--price">{fmt(product.price)}</span>
                    </div>
                    <div className="aod-field-row">
                        <span className="aod-field-label">Số lượng</span>
                        <span className="aod-field-value">x{product.quantity}</span>
                    </div>
                    <div className="aod-field-row aod-field-row--total">
                        <span className="aod-field-label">Thành tiền</span>
                        <span className="aod-field-value aod-field-value--price">{fmt(product.price * product.quantity)}</span>
                    </div>
                </div>
                <div className="aod-modal-actions">
                    <button className="aod-btn-ghost" onClick={onClose}>Đóng</button>
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
                const res = await axios.get(`${ADMIN}/customers/${userId}`, { headers: authHeader() });
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
        <div className="aod-overlay" onClick={onClose}>
            <div className="aod-modal" onClick={(e) => e.stopPropagation()}>
                <div className="aod-modal-header">
                    <div>
                        <h3 className="aod-modal-title">Thông tin khách hàng</h3>
                        <p className="aod-modal-sub">@{username}</p>
                    </div>
                    <button className="aod-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                {loading ? (
                    <div className="aod-modal-loading">Đang tải...</div>
                ) : !data ? (
                    <p style={{ color: "#555", fontSize: "0.875rem" }}>Không tải được thông tin.</p>
                ) : (
                    <div className="aod-product-fields">
                        {[
                            ["Username", data.username],
                            ["Email", data.email],
                            ["Họ tên", data.fullName],
                            ["Số điện thoại", data.phoneNumber],
                            ["Địa chỉ", data.address],
                            ["Giới tính", data.gender === "male" ? "Nam" : data.gender === "female" ? "Nữ" : null],
                            ["Ngày sinh", data.dob],
                            ["Ngày tạo TK", data.createdAt ? new Date(data.createdAt).toLocaleString("vi-VN") : null],
                        ].map(([label, val]) => (
                            <div key={label} className="aod-field-row">
                                <span className="aod-field-label">{label}</span>
                                <span className="aod-field-value">{val || "—"}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="aod-modal-actions">
                    <button className="aod-btn-ghost" onClick={onClose}>Đóng</button>
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
        if (!reason.trim()) { setError("Vui lòng nhập lý do hủy đơn."); return; }
        onConfirm(reason.trim());
    };

    return (
        <div className="aod-overlay" onClick={onClose}>
            <div className="aod-modal aod-modal--sm" onClick={(e) => e.stopPropagation()}>
                <div className="aod-modal-header">
                    <div>
                        <h3 className="aod-modal-title">Hủy đơn hàng</h3>
                        <p className="aod-modal-sub">Đơn hàng #{orderCode}</p>
                    </div>
                    <button className="aod-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <p className="aod-cancel-desc">Hành động này không thể hoàn tác. Vui lòng nhập lý do hủy đơn.</p>
                <div className="aod-form-row">
                    <label>Lý do hủy *</label>
                    <textarea
                        placeholder="VD: Khách yêu cầu hủy, hàng hết hàng..."
                        value={reason}
                        rows={3}
                        onChange={(e) => { setReason(e.target.value); setError(""); }}
                    />
                </div>
                {error && <p className="aod-form-error">{error}</p>}
                <div className="aod-modal-actions">
                    <button className="aod-btn-ghost" onClick={onClose}>Bỏ qua</button>
                    <button className="aod-btn-danger" onClick={handleConfirm}>Xác nhận hủy</button>
                </div>
            </div>
        </div>
    );
};
// confirm modal khi chuyển trạng thái đơn hàng 
const ConfirmStatusModal = ({
    currentStatus,
    nextStatus,
    nextLabel,
    onClose,
    onConfirm,
    loading
}) => {
    return (
        <div className="aod-overlay" onClick={onClose}>
            <div
                className="aod-modal aod-modal--sm"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="aod-modal-header">
                    <div>
                        <h3 className="aod-modal-title">
                            Xác nhận chuyển trạng thái
                        </h3>

                        <p className="aod-modal-sub">
                            {currentStatus} → {nextStatus}
                        </p>
                    </div>

                    <button
                        className="aod-modal-close"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="aod-confirm-desc">
                    Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái
                    <strong> {nextLabel}</strong>?
                </p>

                <div className="aod-modal-actions">
                    <button
                        className="aod-btn-ghost"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>

                    <button
                        className="aod-btn-confirm-status"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading
                            ? "Đang cập nhật..."
                            : "Xác nhận"}
                    </button>
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

    const [productModal, setProductModal] = useState(null);
    const [customerModal, setCustomerModal] = useState(false);
    const [cancelModal, setCancelModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [confirmStatusModal, setConfirmStatusModal] = useState(false);


    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${ADMIN}/orders/details/${orderCode}`, { headers: authHeader() });
            setOrder(res.data);
            console.log("Fetched order:", res.data);
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
                `${ADMIN}/orders/${orderCode}/status?status=${next}`,
                {},
                { headers: authHeader() }
            );

            setConfirmStatusModal(false);
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
        return <div className="aod-page"><div className="aod-loading">Đang tải chi tiết đơn hàng...</div></div>;
    }
    if (!order) {
        return <div className="aod-page"><div className="aod-loading">Không tìm thấy đơn hàng.</div></div>;
    }

    const statusMeta = STATUS_META[order.status] || {};
    const paymentMeta = PAYMENT_META[order.paymentMethod] || { label: order.paymentMethod, cls: "default" };
    const nextStatus = getNextStatus(order.status);
    const nextMeta = nextStatus ? STATUS_META[nextStatus] : null;

    // Tính phí ship và VAT từ order (hoặc fallback về 0)
    const subTotal = order.subTotal ?? order.items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
    const shipFee = order.shippingFee ?? 0;
    const vat = order.vat ?? 0;
    const total = order.totalPrice ?? (subTotal + shipFee + vat);

    // Lý do hủy / hoàn tiền
    const hasCancelSection = order.status === "CANCELLED" && (order.cancelReason || order.cancelNote || order.refundReason);

    return (
        <div className="aod-page">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="aod-header">
                <div className="aod-header-left">
                    <h1 className="aod-title">Chi tiết đơn hàng</h1>
                    <div className="aod-header-meta">
                        <span className="aod-order-code">⊕ {order.orderCode}</span>
                        <span className={`aod-badge aod-badge--${statusMeta.cls}`}>
                            {statusMeta.icon} {statusMeta.label}
                        </span>
                        <span className={`aod-badge aod-badge--payment aod-badge--${paymentMeta.cls}`}>
                            <CreditCard size={12} /> {paymentMeta.label}
                        </span>
                    </div>
                    <p className="aod-created">Đặt lúc: {fmtDate(order.createdAt)}</p>
                </div>
                <button className="aod-back-btn" onClick={() => navigate("/admin/orders")}>
                    <ArrowLeft size={16} /> Quay lại
                </button>
            </div>

            {/* ── Content grid ───────────────────────────────────────────────── */}
            <div className="aod-grid">

                {/* LEFT ─────────────────────────────────────────────────────── */}
                <div className="aod-col-main">

                    {/* Sản phẩm */}
                    <div className="aod-card">
                        <h2 className="aod-card-title">
                            <Package size={14} /> SẢN PHẨM ({order.items?.length || 0})
                        </h2>
                        <div className="aod-items">
                            {order.items?.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="aod-item aod-item--clickable"
                                    onClick={() => setProductModal(item)}
                                >
                                    <div className="aod-item-img-wrap">
                                        {item.productImgUrl
                                            ? <img src={item.productImgUrl} alt={item.productName} className="aod-item-img" />
                                            : <div className="aod-item-img aod-item-img--empty"><Package size={18} /></div>
                                        }
                                    </div>
                                    <div className="aod-item-info">
                                        <span className="aod-item-name">{item.productName}</span>
                                        {item.variantName && <span className="aod-item-variant">{item.variantName}</span>}
                                        {item.sku && <span className="aod-item-sku">SKU: {item.sku}</span>}
                                    </div>
                                    <div className="aod-item-right">
                                        <span className="aod-item-qty">x{item.quantity}</span>
                                        <span className="aod-item-price">{fmt(item.price)}</span>
                                        <ChevronRight size={14} className="aod-item-arrow" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pricing summary */}
                        <div className="aod-pricing">
                            <div className="aod-pricing-row">
                                <span>Tạm tính</span>
                                <span>{fmt(subTotal)}</span>
                            </div>
                            {shipFee >= 0 && (
                                <div className="aod-pricing-row">
                                    <span>Phí ship</span>
                                    <span>{fmt(shipFee)}</span>
                                </div>
                            )}
                            {vat > 0 && (
                                <div className="aod-pricing-row">
                                    <span>VAT (10%)</span>
                                    <span>{fmt(vat)}</span>
                                </div>
                            )}
                            <div className="aod-pricing-row aod-pricing-row--total">
                                <span>Tổng cộng</span>
                                <span className="aod-total-price">{fmt(total)}</span>
                            </div>
                        </div>
                    </div>
                    {/* Thanh toán */}
                    <div className="aod-card">
                        <h2 className="aod-card-title">
                            <CreditCard size={14} /> THANH TOÁN
                        </h2>

                        <div className="aod-info-list">

                            <div className="aod-info-row">
                                <span className="aod-info-icon">
                                    <CreditCard size={13} />
                                </span>

                                <div className="aod-info-content">
                                    <span className="aod-info-label">
                                        TRẠNG THÁI THANH TOÁN
                                    </span>

                                    <span className="aod-info-value">
                                        {order.paymentStatus || "—"}
                                    </span>
                                </div>
                            </div>

                            <div className="aod-info-row">
                                <span className="aod-info-icon">
                                    <FileText size={13} />
                                </span>

                                <div className="aod-info-content">
                                    <span className="aod-info-label">
                                        PAYMENT ORDER ID
                                    </span>

                                    <span className="aod-info-value aod-info-value--mono">
                                        {order.paymentOrderId || "—"}
                                    </span>
                                </div>
                            </div>

                            <div className="aod-info-row">
                                <span className="aod-info-icon">
                                    <FileText size={13} />
                                </span>

                                <div className="aod-info-content">
                                    <span className="aod-info-label">
                                        PAYMENT TRANSACTION ID
                                    </span>

                                    <span className="aod-info-value aod-info-value--mono">
                                        {order.paymentTransactionId || "—"}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div className="aod-card aod-card--note">
                        <h2 className="aod-card-title">
                            <FileText size={14} /> GHI CHÚ ĐƠN HÀNG
                        </h2>

                        <p className="aod-note-text">
                            {order.note?.trim() || "Không có ghi chú"}
                        </p>
                    </div>

                    {/* Lý do hủy / Hoàn tiền */}
                    {hasCancelSection && (
                        <div className="aod-card aod-card--cancel-info">
                            <h2 className="aod-card-title aod-card-title--warn">
                                <AlertTriangle size={14} /> LÝ DO HỦY / HOÀN TIỀN
                            </h2>

                            {order.cancelReason && (
                                <div className="aod-cancel-block">
                                    <p className="aod-cancel-block-label">LÝ DO HỦY</p>
                                    <div className="aod-cancel-tag aod-cancel-tag--red">
                                        <XCircle size={13} /> {order.cancelReason}
                                    </div>
                                </div>
                            )}

                            {order.cancelNote && (
                                <div className="aod-cancel-block">
                                    <p className="aod-cancel-block-label">GHI CHÚ HỦY</p>
                                    <div className="aod-cancel-tag aod-cancel-tag--red-soft">
                                        {order.cancelNote}
                                    </div>
                                </div>
                            )}

                            {order.refundReason && (
                                <div className="aod-cancel-block">
                                    <p className="aod-cancel-block-label">LÝ DO HOÀN TIỀN</p>
                                    <div className="aod-cancel-tag aod-cancel-tag--yellow">
                                        <RefreshCw size={13} /> {order.refundReason}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT ────────────────────────────────────────────────────── */}
                <div className="aod-col-side">

                    {/* Người nhận */}
                    <div className="aod-card">
                        <h2 className="aod-card-title"><User size={14} /> NGƯỜI NHẬN</h2>
                        <div className="aod-info-list">
                            <div className="aod-info-row">
                                <span className="aod-info-icon"><User size={13} /></span>
                                <div className="aod-info-content">
                                    <span className="aod-info-label">TÊN NGƯỜI NHẬN</span>
                                    <span className="aod-info-value">{order.receiverName || "—"}</span>
                                </div>
                            </div>
                            <div className="aod-info-row">
                                <span className="aod-info-icon"><Phone size={13} /></span>
                                <div className="aod-info-content">
                                    <span className="aod-info-label">SỐ ĐIỆN THOẠI</span>
                                    <span className="aod-info-value">{order.phoneNumber || "—"}</span>
                                </div>
                            </div>
                            <div className="aod-info-row">
                                <span className="aod-info-icon"><MapPin size={13} /></span>
                                <div className="aod-info-content">
                                    <span className="aod-info-label">ĐỊA CHỈ GIAO HÀNG</span>
                                    <span className="aod-info-value">
                                        {[order.shippingAddress, order.ward, order.district, order.province]
                                            .filter(Boolean).join(", ") || "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Xem tài khoản */}
                        <button
                            className="aod-btn-view-account"
                            onClick={() => setCustomerModal(true)}
                        >
                            <User size={14} /> Xem thông tin người đặt<ExternalLink size={13} />
                        </button>
                    </div>



                    {/* Thao tác */}
                    {(nextStatus || canCancel(order.status)) && (
                        <div className="aod-card aod-card--actions">
                            <h2 className="aod-card-title">THAO TÁC</h2>
                            <div className="aod-action-btns">
                                {nextStatus && nextMeta && (
                                    <button
                                        className="aod-btn-next-status"
                                        onClick={() => setConfirmStatusModal(true)}
                                        disabled={updating}
                                    >
                                        {updating ? "Đang cập nhật..." : (
                                            <>{nextMeta.icon} Chuyển sang: {nextMeta.label}</>
                                        )}
                                    </button>
                                )}
                                {canCancel(order.status) && (
                                    <button
                                        className="aod-btn-cancel-order"
                                        onClick={() => setCancelModal(true)}
                                        disabled={updating}
                                    >
                                        <XCircle size={14} /> Hủy đơn hàng
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ─────────────────────────────────────────────────────── */}
            {productModal && (
                <ProductDetailModal product={productModal} onClose={() => setProductModal(null)} />
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
            {confirmStatusModal && nextMeta && (
                <ConfirmStatusModal
                    currentStatus={statusMeta.label}
                    nextStatus={nextStatus}
                    nextLabel={nextMeta.label}
                    loading={updating}
                    onClose={() => setConfirmStatusModal(false)}
                    onConfirm={handleNextStatus}
                />
            )}
        </div>
    );
};

export default AdminOrderDetail;