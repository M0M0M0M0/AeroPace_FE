import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, X, ChevronRight, Truck, CheckCircle, XCircle,
    User, Phone, MapPin, FileText, Clock, Package, ExternalLink,
    CreditCard, AlertTriangle, RefreshCw
} from "lucide-react";
import axios from "axios";
import "./AdminOrderDetail.css";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
const ADMIN = `${BASE}/admin`;
const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META = {
    PAID: { label: "Paid", cls: "paid", icon: <CheckCircle size={12} /> },
    PENDING: { label: "Pending", cls: "pending", icon: <Clock size={12} /> },
    SHIPPING: { label: "Shipping", cls: "shipping", icon: <Truck size={12} /> },
    DELIVERED: { label: "Delivered", cls: "delivered", icon: <CheckCircle size={12} /> },
    CANCELLED: { label: "Cancelled", cls: "cancelled", icon: <XCircle size={12} /> },
    COMPLETED: { label: "Completed", cls: "completed", icon: <CheckCircle size={12} /> },
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
const canRefund = (order) => order.status === "CANCELLED" && order.paymentStatus === "REFUND_PENDING";

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
                        <h3 className="aod-modal-title">Product Details</h3>
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
                        <span className="aod-field-label">Product Name</span>
                        <span className="aod-field-value">{product.productName}</span>
                    </div>
                    {product.variantName && (
                        <div className="aod-field-row">
                            <span className="aod-field-label">Variant</span>
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
                        <span className="aod-field-label">Unit Price</span>
                        <span className="aod-field-value aod-field-value--price">{fmt(product.price)}</span>
                    </div>
                    <div className="aod-field-row">
                        <span className="aod-field-label">Quantity</span>
                        <span className="aod-field-value">x{product.quantity}</span>
                    </div>
                    <div className="aod-field-row aod-field-row--total">
                        <span className="aod-field-label">Total</span>
                        <span className="aod-field-value aod-field-value--price">{fmt(product.price * product.quantity)}</span>
                    </div>
                </div>
                <div className="aod-modal-actions">
                    <button className="aod-btn-ghost" onClick={onClose}>Close</button>
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
                        <h3 className="aod-modal-title">Customer Information</h3>
                        <p className="aod-modal-sub">@{username}</p>
                    </div>
                    <button className="aod-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                {loading ? (
                    <div className="aod-modal-loading">Loading...</div>
                ) : !data ? (
                    <p style={{ color: "#555", fontSize: "0.875rem" }}>Failed to load information.</p>
                ) : (
                    <div className="aod-product-fields">
                        {[
                            ["Username", data.username],
                            ["Email", data.email],
                            ["Full Name", data.fullName],
                            ["Phone Number", data.phoneNumber],
                            ["Address", data.address],
                            ["Gender", data.gender === "male" ? "Male" : data.gender === "female" ? "Female" : null],
                            ["Date of Birth", data.dob],
                            ["Account Creation Date", data.createdAt ? new Date(data.createdAt).toLocaleString("vi-VN") : null],
                        ].map(([label, val]) => (
                            <div key={label} className="aod-field-row">
                                <span className="aod-field-label">{label}</span>
                                <span className="aod-field-value">{val || "—"}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="aod-modal-actions">
                    <button className="aod-btn-ghost" onClick={onClose}>Close</button>
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
        if (!reason.trim()) { setError("Please enter the reason for canceling the order."); return; }
        onConfirm(reason.trim());
    };

    return (
        <div className="aod-overlay" onClick={onClose}>
            <div className="aod-modal aod-modal--sm" onClick={(e) => e.stopPropagation()}>
                <div className="aod-modal-header">
                    <div>
                        <h3 className="aod-modal-title">Cancel Order</h3>
                        <p className="aod-modal-sub">Order #{orderCode}</p>
                    </div>
                    <button className="aod-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <p className="aod-cancel-desc">This action cannot be undone. Please enter the reason for canceling the order.</p>
                <div className="aod-form-row">
                    <label>Reason for Cancellation *</label>
                    <textarea
                        placeholder="E.g.: Customer requested cancellation, item out of stock..."
                        value={reason}
                        rows={3}
                        onChange={(e) => { setReason(e.target.value); setError(""); }}
                    />
                </div>
                {error && <p className="aod-form-error">{error}</p>}
                <div className="aod-modal-actions">
                    <button className="aod-btn-ghost" onClick={onClose}>Close</button>
                    <button className="aod-btn-danger" onClick={handleConfirm}>Confirm Cancellation</button>
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
                    </div>

                    <button
                        className="aod-modal-close"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="aod-confirm-desc">
                    Do you want to change order status from <strong>{currentStatus}</strong> to
                    <strong> {nextLabel}</strong>?
                </p>

                <div className="aod-modal-actions">
                    <button
                        className="aod-btn-ghost"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        className="aod-btn-confirm-status"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading
                            ? "Processing..."
                            : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Refund Modal ─────────────────────────────────────────────────────────────
const REFUND_QUICK_REASONS = [
    "Order cancelled",
    "Customer requested refund",
    "Product out of stock",
    "Duplicate order",
    "Payment error",
];

const RefundModal = ({ orderCode, onClose, onConfirm, loading }) => {
    const [reason, setReason] = useState("");
    const [activeTags, setActiveTags] = useState([]);
    const [error, setError] = useState("");

    const toggleTag = (tag) => {
        setActiveTags((prev) => {
            const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
            setReason(next.join(", "));
            return next;
        });
    };

    const handleConfirm = () => {
        if (!reason.trim()) { setError("Please enter the refund reason."); return; }
        onConfirm(reason.trim());
    };

    return (
        <div className="aod-overlay" onClick={() => !loading && onClose()}>
            <div className="aod-modal aod-modal--sm" onClick={(e) => e.stopPropagation()}>
                <div className="aod-modal-header">
                    <div>
                        <h3 className="aod-modal-title">Process Refund</h3>
                        <p className="aod-modal-sub">Order #{orderCode}</p>
                    </div>
                    <button className="aod-modal-close" onClick={onClose} disabled={loading}><X size={18} /></button>
                </div>
                <p className="aod-cancel-desc">This will initiate a refund to the customer's original payment method. This action cannot be undone.</p>
                <div className="aod-form-row">
                    <label>Quick fill</label>
                    <div className="aod-quick-tags">
                        {REFUND_QUICK_REASONS.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                className={`aod-quick-tag ${activeTags.includes(tag) ? "aod-quick-tag--active" : ""}`}
                                onClick={() => toggleTag(tag)}
                                disabled={loading}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="aod-form-row">
                    <label>Refund Reason *</label>
                    <textarea
                        placeholder="E.g.: Order cancelled, customer requested refund..."
                        value={reason}
                        rows={3}
                        onChange={(e) => { setReason(e.target.value); setError(""); }}
                    />
                </div>
                {error && <p className="aod-form-error">{error}</p>}
                <div className="aod-modal-actions">
                    <button className="aod-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="aod-btn-refund-confirm" onClick={handleConfirm} disabled={loading}>
                        {loading ? "Processing..." : <><RefreshCw size={14} /> Confirm Refund</>}
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
    const [refundModal, setRefundModal] = useState(false);


    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${ADMIN}/orders/details/${orderCode}`, { headers: authHeader() });
            setOrder(res.data);
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
            alert("Failed to update status!");
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
            alert("Failed to cancel order!");
        } finally {
            setUpdating(false);
        }
    };

    // ── Refund ──────────────────────────────────────────────────────────────
    const handleRefund = async (reason) => {
        setUpdating(true);
        try {
            const res = await axios.post(
                `${ADMIN}/orders/${orderCode}/refund`,
                { refundReason: reason },
                { headers: authHeader() }
            );
            if (res.data.success) {
                setRefundModal(false);
                await fetchOrder();
            } else {
                alert(res.data.message || "Refund failed!");
            }
        } catch (err) {
            console.error(err);
            alert("Refund failed!");
        } finally {
            setUpdating(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return <div className="aod-page"><div className="aod-loading">Loading order details...</div></div>;
    }
    if (!order) {
        return <div className="aod-page"><div className="aod-loading">Order not found.</div></div>;
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
                    <h1 className="aod-title">Order Details</h1>
                    <div className="aod-header-meta">
                        <span className="aod-order-code">⊕ {order.orderCode}</span>
                        <span className={`aod-badge aod-badge--${statusMeta.cls}`}>
                            {statusMeta.icon} {statusMeta.label}
                        </span>
                        <span className={`aod-badge aod-badge--payment aod-badge--${paymentMeta.cls}`}>
                            <CreditCard size={12} /> {paymentMeta.label}
                        </span>
                    </div>
                    <p className="aod-created">Ordered at: {fmtDate(order.createdAt)}</p>
                </div>
                <button className="aod-back-btn" onClick={() => navigate("/admin/orders")}>
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            {/* ── Content grid ───────────────────────────────────────────────── */}
            <div className="aod-grid">

                {/* LEFT ─────────────────────────────────────────────────────── */}
                <div className="aod-col-main">

                    {/* Sản phẩm */}
                    <div className="aod-card">
                        <h2 className="aod-card-title">
                            <Package size={14} /> PRODUCTS ({order.items?.length || 0})
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
                                <span>Subtotal</span>
                                <span>{fmt(subTotal)}</span>
                            </div>
                            {shipFee >= 0 && (
                                <div className="aod-pricing-row">
                                    <span>Shipping Fee</span>
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
                                <span>Total</span>
                                <span className="aod-total-price">{fmt(total + shipFee + vat)}</span>
                            </div>
                        </div>
                    </div>
                    {/* Thanh toán */}
                    <div className="aod-card">
                        <h2 className="aod-card-title">
                            <CreditCard size={14} /> PAYMENT
                        </h2>

                        <div className="aod-info-list">

                            <div className="aod-info-row">
                                <span className="aod-info-icon">
                                    <CreditCard size={13} />
                                </span>

                                <div className="aod-info-content">
                                    <span className="aod-info-label">
                                        PAYMENT STATUS
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
                            <FileText size={14} /> ORDER NOTE
                        </h2>

                        <p className="aod-note-text">
                            {order.note?.trim() || "No additional notes."}
                        </p>
                    </div>

                    {/* Lý do hủy / Hoàn tiền */}
                    {hasCancelSection && (
                        <div className="aod-card aod-card--cancel-info">
                            <h2 className="aod-card-title aod-card-title--warn">
                                <AlertTriangle size={14} /> CANCEL / REFUND REASON
                            </h2>

                            {order.cancelReason && (
                                <div className="aod-cancel-block">
                                    <p className="aod-cancel-block-label">CANCEL REASON</p>
                                    <div className="aod-cancel-tag aod-cancel-tag--red">
                                        {order.cancelReason}
                                    </div>
                                </div>
                            )}

                            {order.cancelNote && (
                                <div className="aod-cancel-block">
                                    <p className="aod-cancel-block-label">CANCEL NOTE</p>
                                    <div className="aod-cancel-tag aod-cancel-tag--red-soft">
                                        {order.cancelNote}
                                    </div>
                                </div>
                            )}

                            {order.refundReason && (
                                <div className="aod-cancel-block">
                                    <p className="aod-cancel-block-label">REFUND REASON</p>
                                    <div className="aod-cancel-tag aod-cancel-tag--yellow">
                                        {order.refundReason}
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
                        <h2 className="aod-card-title"><User size={14} /> RECEIVER</h2>
                        <div className="aod-info-list">
                            <div className="aod-info-row">
                                <span className="aod-info-icon"><User size={13} /></span>
                                <div className="aod-info-content">
                                    <span className="aod-info-label">RECEIVER NAME</span>
                                    <span className="aod-info-value">{order.receiverName || "—"}</span>
                                </div>
                            </div>
                            <div className="aod-info-row">
                                <span className="aod-info-icon"><Phone size={13} /></span>
                                <div className="aod-info-content">
                                    <span className="aod-info-label">PHONE NUMBER</span>
                                    <span className="aod-info-value">{order.phoneNumber || "—"}</span>
                                </div>
                            </div>
                            <div className="aod-info-row">
                                <span className="aod-info-icon"><MapPin size={13} /></span>
                                <div className="aod-info-content">
                                    <span className="aod-info-label">SHIPPING ADDRESS</span>
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
                            <User size={14} /> View Customer Information<ExternalLink size={13} />
                        </button>
                    </div>



                    {/* Thao tác */}
                    {(nextStatus || canCancel(order.status) || canRefund(order)) && (
                        <div className="aod-card aod-card--actions">
                            <h2 className="aod-card-title">ACTIONS</h2>
                            <div className="aod-action-btns">
                                {nextStatus && nextMeta && (
                                    <button
                                        className="aod-btn-next-status"
                                        onClick={() => setConfirmStatusModal(true)}
                                        disabled={updating}
                                    >
                                        {updating ? "Updating..." : (
                                            <>{nextMeta.icon} Change to: {nextMeta.label}</>
                                        )}
                                    </button>
                                )}
                                {canCancel(order.status) && (
                                    <button
                                        className="aod-btn-cancel-order"
                                        onClick={() => setCancelModal(true)}
                                        disabled={updating}
                                    >
                                        <XCircle size={14} /> Cancel Order
                                    </button>
                                )}
                                {canRefund(order) && (
                                    <button
                                        className="aod-btn-refund"
                                        onClick={() => setRefundModal(true)}
                                        disabled={updating}
                                    >
                                        <RefreshCw size={14} /> Process Refund
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
            {refundModal && (
                <RefundModal
                    orderCode={order.orderCode}
                    onClose={() => setRefundModal(false)}
                    onConfirm={handleRefund}
                    loading={updating}
                />
            )}
        </div>
    );
};

export default AdminOrderDetail;