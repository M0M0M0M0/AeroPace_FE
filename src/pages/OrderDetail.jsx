import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axiosClient";
import { ArrowLeft, MapPin, Phone, User, Package, X, Pencil, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import QuickReviewModal from "../components/QuickReviewModal";
import { useAuth } from "../context/AuthContext";
import { formatUSD } from "../utils/currency";

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

// ── Order progress stepper ────────────────────────────────────
const STEPPER_STEPS = [
    { label: "Order Placed" },
    { label: "Preparing Your Order" },
    { label: "In Transit" },
    { label: "Delivered" },
];

const getCompletedSteps = (status) => {
    switch (status) {
        case "PAID": return 1;
        case "SHIPPING": return 2;
        case "DELIVERED": return 3;
        case "COMPLETED": return 4;
        default: return 0;
    }
};

const OrderStepper = ({ status }) => {
    if (status === "CANCELLED" || status === "PENDING") return null;
    const done = getCompletedSteps(status);

    return (
        <div className="od-stepper">
            {STEPPER_STEPS.map((step, idx) => {
                const n = idx + 1;
                const isCompleted = n <= done;
                const isActive = n === done + 1 && done < STEPPER_STEPS.length;
                const cls = [
                    "od-step",
                    isCompleted && "od-step--done",
                    isActive && "od-step--active",
                ].filter(Boolean).join(" ");
                return (
                    <div key={n} className={cls}>
                        <div className="od-step-circle">
                            {isCompleted ? <Check size={14} strokeWidth={3} /> : n}
                        </div>
                        <p className="od-step-label">{step.label}</p>
                    </div>
                );
            })}
        </div>
    );
};

const OdMiniStars = ({ rating }) => {
    const val = parseFloat(rating) || 0;
    return (
        <span className="od-review-stars">
            {[1, 2, 3, 4, 5].map((i) => {
                let cls = "od-review-star";
                if (val >= i) cls += " od-review-star--full";
                else if (val >= i - 0.5) cls += " od-review-star--half";
                else cls += " od-review-star--empty";
                return <span key={i} className={cls}>★</span>;
            })}
            <span className="od-review-star-num">{val.toFixed(1)}</span>
        </span>
    );
};

const OrderDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fromTab = state?.fromTab;
    const orderCode = state?.order?.orderCode;

    const [order, setOrder] = useState(state?.order || null);
    const [cancelModal, setCancelModal] = useState({ open: false, note: "" });
    const [cancelling, setCancelling] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // ── Refetch từ server để lấy trạng thái mới nhất (vd. admin vừa đổi status ở tab khác) ─
    const refetchOrder = useCallback(async () => {
        if (!user?.id || !orderCode) return;
        try {
            const res = await axios.get(`/orders/user/${user.id}`);
            const updated = res.data.find((o) => o.orderCode === orderCode);
            if (updated) setOrder(updated);
        } catch (err) {
            console.error(err);
        }
    }, [user, orderCode]);

    useEffect(() => {
        refetchOrder();
        const handleVisibility = () => {
            if (document.visibilityState === "visible") refetchOrder();
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [refetchOrder]);

    // ── Review modal ──────────────────────────────────────────────
    const [reviewOrder, setReviewOrder] = useState(null);

    // ── Existing reviews for COMPLETED orders ─────────────────────
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        if (order?.status !== "COMPLETED") return;
        axios.get(`/reviews/my-order/${order.orderCode}`)
            .then((res) => setReviews(res.data))
            .catch(() => { });
    }, [order?.orderCode, order?.status]);

    const reviewByProductId = reviews.reduce((acc, rv) => {
        acc[rv.productId] = rv;
        return acc;
    }, {});

    const handleEditReview = () => {
        navigate("/review/detail", {
            state: { order, editMode: true, existingReviews: reviews },
        });
    };

    const handleProductClick = async (item) => {
        const id = item.productId;
        if (!id) return;
        try {
            await axios.get(`/products/detail/${id}`);
            navigate(`/products/detail/${id}`);
        } catch {
            toast.error("This product is no longer available.");
        }
    };

    const handleViewHistorical = async (item) => {
        if (!item.productId) return;
        try {
            await axios.get(`/products/historical/${item.productId}`, {
                params: { orderCode: order.orderCode },
            });
            navigate(`/order-detail/${order.orderCode}/product/${item.productId}/historical`);
        } catch {
            // No snapshot — product hasn't changed, navigate to current product page
            handleProductClick(item);
        }
    };

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

                    {/* Order progress stepper */}
                    <OrderStepper status={order.status} />

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
                                {(() => {
                                    const shownReviews = new Set();
                                    return order.items.map((item, idx) => {
                                        const review = reviewByProductId[item.productId];
                                        const showReview = !!review && !shownReviews.has(item.productId);
                                        if (showReview) shownReviews.add(item.productId);
                                        return (
                                            <div key={idx} className="od-item-wrapper">
                                                <div
                                                    className="od-item-row od-item-clickable"
                                                    onClick={() => handleProductClick(item)}
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
                                                        <br />
                                                        <button
                                                            className="od-hist-btn"
                                                            onClick={(e) => { e.stopPropagation(); handleViewHistorical(item); }}
                                                        >
                                                            <Clock size={11} />
                                                            View as ordered
                                                        </button>
                                                    </span>
                                                    <div className="od-item-right">
                                                        <span className="od-item-qty">x{item.quantity}</span>
                                                        <span className="od-item-price">
                                                            {formatUSD(item.price)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {showReview && (
                                                    <div className="od-review-block">
                                                        <OdMiniStars rating={review.rating} />
                                                        {review.comment && (
                                                            <p className="od-review-comment">{review.comment}</p>
                                                        )}
                                                        {review.canEdit && (
                                                            <button
                                                                className="od-review-edit-btn"
                                                                onClick={handleEditReview}
                                                            >
                                                                <Pencil size={13} />
                                                                Edit review
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
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

                        {/* Price breakdown */}
                        <div className="od-price-breakdown">
                            <div className="od-breakdown-row">
                                <span>Subtotal</span>
                                <span>
                                    {formatUSD(order.items?.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0))}
                                </span>
                            </div>
                            {order.shippingFee != null && (
                                <div className="od-breakdown-row">
                                    <span>Shipping fee</span>
                                    <span>{formatUSD(order.shippingFee)}</span>
                                </div>
                            )}
                            {order.vat != null && (
                                <div className="od-breakdown-row">
                                    <span>VAT (10%)</span>
                                    <span>{formatUSD(order.vat)}</span>
                                </div>
                            )}
                        </div>

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
                                {order.status === "COMPLETED" && reviews.length === 0 && (
                                    <button
                                        className="od-confirm-received-btn"
                                        onClick={() => setReviewOrder(order)}
                                    >
                                        Write a Review
                                    </button>
                                )}
                            </div>
                            <div className="od-total-row">
                                <span className="od-total-label">Total</span>
                                <span className="od-total-value">
                                    {formatUSD(Number(order.totalPrice) || 0)}
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