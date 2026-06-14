import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axiosClient";
import { ArrowLeft, MapPin, Phone, User, Package, X } from "lucide-react";
import QuickReviewModal from "../components/QuickReviewModal";

import "./OrderDetail.css";

const getStatusLabel = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return "Waiting for refund";
    switch (order.status) {
        case "PENDING": return "Pending";
        case "PAID": return "Paid";
        case "SHIPPING": return "In transit";
        case "DELIVERED": return "Delivered";
        case "COMPLETED": return "Completed";
        case "CANCELLED": return "Cancelled";
        default: return order.status;
    }
};

const getStatusStyle = (order) => {
    if (order.paymentStatus === "REFUND_PENDING")
        return { bg: "rgba(251,146,60,0.15)", color: "#fb923c" };
    switch (order.status) {
        case "PAID": return { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" };
        case "SHIPPING": return { bg: "rgba(251,146,60,0.15)", color: "#fb923c" };
        case "DELIVERED": return { bg: "rgba(74,222,128,0.15)", color: "#4ade80" };
        case "COMPLETED": return { bg: "rgba(74,222,128,0.15)", color: "#4ade80" };
        case "CANCELLED": return { bg: "rgba(248,113,113,0.15)", color: "#f87171" };
        case "PENDING": return { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" };
        default: return { bg: "#333", color: "#e5e4e4" };
    }
};

const getCancelReason = (order) => {
    if (order.cancelType === "USER_CANCELLED")
        return "User Cancelled" + (order.cancelNote ? `: ${order.cancelNote}` : "");
    if (order.cancelType === "ADMIN_CANCELLED")
        return "Admin Cancelled" + (order.cancelNote ? `: ${order.cancelNote}` : "");
    return "—";
};

const canCancel = (order) => order.status === "PENDING" || order.status === "PAID";

const OrderDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const fromTab = state?.fromTab;

    const [order, setOrder] = useState(state?.order || null);
    const [cancelModal, setCancelModal] = useState({ open: false, note: "" });
    const [cancelling, setCancelling] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // ── Review modal ──────────────────────────────────────────────
    const [reviewOrder, setReviewOrder] = useState(null);

    const handleBack = () => {
        if (fromTab) {
            navigate("/profile", { state: { tab: fromTab } });
        } else {
            navigate(-1);
        }
    };

    if (!order) {
        return (
            <div className="od-page">
                <div className="od-container">
                    <p style={{ color: "#888" }}>Cannot find the order.</p>
                    <button className="od-back-btn" onClick={handleBack}>
                        <ArrowLeft size={16} /> Return
                    </button>
                </div>
            </div>
        );
    }

    const statusStyle = getStatusStyle(order);
    const shippingAddress = [
        order.shippingAddress,
        order.ward,
        order.district,
        order.province,
    ]
        .filter(Boolean)
        .join(", ");

    // ── Confirm received → update status → open review modal ─────
    const handleConfirmReceived = async () => {
        setConfirming(true);
        try {
            await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/${order.orderCode}/confirm`
            );
            const completed = { ...order, status: "COMPLETED" };
            setOrder(completed);
            setReviewOrder(completed);
        } catch (err) {
            console.log("CONFIRM RECEIVED ERROR:", err.response || err);
            alert("Failed to confirm receipt, please try again.");
        } finally {
            setConfirming(false);
        }
    };

    const handleConfirmCancel = async () => {
        setCancelling(true);
        try {
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/orders/${order.orderCode}/cancel`,
                null,
                { params: { cancelNote: cancelModal.note || undefined } }
            );
            setOrder((prev) => ({ ...prev, status: "CANCELLED" }));
            setCancelModal({ open: false, note: "" });
        } catch (err) {
            console.log("CANCEL ORDER ERROR:", err.response || err);
            alert("Failed to cancel the order!");
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="od-page">
            <div className="od-container">
                <button className="od-back-btn" onClick={handleBack}>
                    <ArrowLeft size={16} /> Return
                </button>

                <div className="od-card">
                    {/* Header */}
                    <div className="od-header">
                        <div className="od-header-left">
                            <h2 className="od-title">Order Details</h2>
                            <span className="od-code">#{order.orderCode}</span>
                        </div>
                        <span
                            className="od-status-pill"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                            {getStatusLabel(order)}
                        </span>
                    </div>

                    <div className="od-divider" />

                    {/* Shipping info */}
                    <div className="od-section">
                        <h3 className="od-section-title">Shipping Information</h3>
                        <div className="od-info-grid">
                            {order.receiverName && (
                                <div className="od-info-row">
                                    <User size={15} className="od-info-icon" />
                                    <span className="od-info-label">Receiver</span>
                                    <span className="od-info-value">{order.receiverName}</span>
                                </div>
                            )}
                            <div className="od-info-row">
                                <Phone size={15} className="od-info-icon" />
                                <span className="od-info-label">Phone Number</span>
                                <span className="od-info-value">{order.phoneNumber || "—"}</span>
                            </div>
                            <div className="od-info-row">
                                <MapPin size={15} className="od-info-icon" />
                                <span className="od-info-label">Address</span>
                                <span className="od-info-value">{shippingAddress || "—"}</span>
                            </div>
                            <div className="od-info-row">
                                <Package size={15} className="od-info-icon" />
                                <span className="od-info-label">Order Date</span>
                                <span className="od-info-value">
                                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="od-divider" />

                    {/* Items */}
                    <div className="od-section">
                        <h3 className="od-section-title">Product List</h3>
                        {order.items && order.items.length > 0 ? (
                            <div className="od-items">
                                {order.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="od-item-row od-item-clickable"
                                        onClick={() =>
                                            item.productId
                                                ? navigate(`/products/detail/${item.productId}`)
                                                : item.productSlug
                                                    ? navigate(`/products/detail/${item.productSlug}`)
                                                    : null
                                        }
                                        title="View product"
                                    >
                                        <div className="od-item-img-wrap">
                                            {item.productImgUrl ? (
                                                <img
                                                    src={item.productImgUrl}
                                                    alt={item.productName}
                                                    className="od-item-img"
                                                />
                                            ) : (
                                                <div className="od-item-img-placeholder">
                                                    <Package size={18} color="#555" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="od-item-name">
                                            {item.productName} <br />
                                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                                Variant: {item.variantName}
                                            </span>
                                        </span>
                                        <div className="od-item-right">
                                            <span className="od-item-qty">x{item.quantity}</span>
                                            <span className="od-item-price">
                                                {item.price?.toLocaleString()} ₫
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "#666", fontSize: "0.9rem" }}>
                                No products available.
                            </p>
                        )}
                    </div>

                    <div className="od-divider" />

                    {/* Footer */}
                    <div className="od-footer">
                        {order.status === "CANCELLED" && (
                            <p className="od-cancel-reason">{getCancelReason(order)}</p>
                        )}

                        <div className="od-footer-row">
                            <div className="od-footer-actions">
                                {canCancel(order) && (
                                    <button
                                        className="od-cancel-btn"
                                        onClick={() => setCancelModal({ open: true, note: "" })}
                                    >
                                        <X size={15} />
                                        Cancel Order
                                    </button>
                                )}
                                {order.status === "DELIVERED" && (
                                    <button
                                        className="od-confirm-received-btn"
                                        disabled={confirming}
                                        onClick={handleConfirmReceived}
                                    >
                                        {confirming ? "Confirming receipt..." : "Mark as Received"}
                                    </button>
                                )}
                            </div>
                            <div className="od-total-row">
                                <span className="od-total-label">Total</span>
                                <span className="od-total-value">
                                    {order.totalPrice?.toLocaleString()} ₫
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel modal */}
            {cancelModal.open && (
                <div
                    className="od-modal-overlay"
                    onClick={() => { if (!cancelling) setCancelModal({ open: false, note: "" }); }}
                >
                    <div className="od-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirm Order Cancellation</h3>
                        <p>
                            Are you sure you want to cancel order{" "}
                            <strong>#{order.orderCode}</strong>?
                            <br />
                            This action cannot be undone.
                        </p>
                        <textarea
                            placeholder="Reason for cancellation (optional)..."
                            value={cancelModal.note}
                            onChange={(e) =>
                                setCancelModal((prev) => ({ ...prev, note: e.target.value }))
                            }
                            rows={3}
                            className="od-modal-textarea"
                        />
                        <div className="od-modal-actions">
                            <button
                                className="od-modal-back"
                                onClick={() => setCancelModal({ open: false, note: "" })}
                                disabled={cancelling}
                            >
                                Back
                            </button>
                            <button
                                className="od-modal-confirm"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Quick Review Modal ── */}
            {reviewOrder && (
                <QuickReviewModal
                    order={reviewOrder}
                    onClose={() => setReviewOrder(null)}
                    onSubmitted={() => setReviewOrder(null)}
                />
            )}
        </div>
    );
};

export default OrderDetail;