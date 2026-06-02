import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axiosClient";
import { ArrowLeft, MapPin, Phone, User, Package, X } from "lucide-react";
import "./OrderDetail.css";

const getStatusLabel = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return "Chờ hoàn tiền";
    const status = order.status;
    switch (status) {
        case "PENDING": return "Chờ xác nhận";
        case "PAID": return "Đã thanh toán";
        case "SHIPPING": return "Đang giao hàng";
        case "DELIVERED": return "Đã giao hàng";
        case "COMPLETED": return "Hoàn thành";
        case "CANCELLED": return "Đã hủy";
        case "REFUND_PENDING": return "Chờ hoàn tiền";
        default: return status;
    }
};

const getStatusStyle = (order) => {
    if (order.paymentStatus === "REFUND_PENDING") return { bg: "rgba(251,146,60,0.15)", color: "#fb923c" };
    const status = order.status;
    switch (status) {
        case "PAID": return { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" };
        case "SHIPPING": return { bg: "rgba(251,146,60,0.15)", color: "#fb923c" };
        case "DELIVERED": return { bg: "rgba(74,222,128,0.15)", color: "#4ade80" };
        case "COMPLETED": return { bg: "rgba(74,222,128,0.15)", color: "#4ade80" };
        case "CANCELLED": return { bg: "rgba(248,113,113,0.15)", color: "#f87171" };
        case "REFUND_PENDING": return { bg: "rgba(251,146,60,0.15)", color: "#fb923c" };
        case "PENDING": return { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" };
        default: return { bg: "#333", color: "#e5e4e4" };
    }
};

const getCancelReason = (order) => {
    if (order.cancelType === "USER_CANCELLED")
        return "Người dùng hủy đơn" + (order.cancelNote ? `: ${order.cancelNote}` : "");
    if (order.cancelType === "ADMIN_CANCELLED")
        return "Admin hủy đơn" + (order.cancelNote ? `: ${order.cancelNote}` : "");

    return "—";
};

const canCancel = (order) => order.status === "PENDING" || order.status === "PAID";

const OrderDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [order, setOrder] = useState(state?.order || null);
    const [cancelModal, setCancelModal] = useState({ open: false, note: "" });
    const [cancelling, setCancelling] = useState(false);
    const [confirming, setConfirming] = useState(false);

    if (!order) {
        return (
            <div className="od-page">
                <div className="od-container">
                    <p style={{ color: "#888" }}>Không tìm thấy đơn hàng.</p>
                    <button className="od-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Quay lại
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

    const handleConfirmReceived = async () => {
        setConfirming(true);
        try {
            await axios.patch(
                `http://localhost:8080/api/v1/orders/${order.orderCode}/confirm`
            );
            setOrder((prev) => ({ ...prev, status: "COMPLETED" }));
        } catch (err) {
            console.log("CONFIRM RECEIVED ERROR:", err.response || err);
            alert("Xác nhận thất bại, vui lòng thử lại.");
        } finally {
            setConfirming(false);
        }
    };

    const handleConfirmCancel = async () => {
        setCancelling(true);
        try {
            await axios.put(
                `http://localhost:8080/api/v1/orders/${order.orderCode}/cancel`,
                null,
                { params: { cancelNote: cancelModal.note || undefined } }
            );
            setOrder((prev) => ({ ...prev, status: "CANCELLED" }));
            setCancelModal({ open: false, note: "" });
        } catch (err) {
            console.log("CANCEL ORDER ERROR:", err.response || err);
            alert("Hủy đơn thất bại!");
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="od-page">
            <div className="od-container">
                <button className="od-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Quay lại
                </button>

                <div className="od-card">
                    {/* Header */}
                    <div className="od-header">
                        <div className="od-header-left">
                            <h2 className="od-title">Chi tiết đơn hàng</h2>
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
                        <h3 className="od-section-title">Thông tin giao hàng</h3>
                        <div className="od-info-grid">
                            {order.receiverName && (
                                <div className="od-info-row">
                                    <User size={15} className="od-info-icon" />
                                    <span className="od-info-label">Người nhận</span>
                                    <span className="od-info-value">{order.receiverName}</span>
                                </div>
                            )}
                            <div className="od-info-row">
                                <Phone size={15} className="od-info-icon" />
                                <span className="od-info-label">Số điện thoại</span>
                                <span className="od-info-value">{order.phoneNumber || "—"}</span>
                            </div>
                            <div className="od-info-row">
                                <MapPin size={15} className="od-info-icon" />
                                <span className="od-info-label">Địa chỉ</span>
                                <span className="od-info-value">{shippingAddress || "—"}</span>
                            </div>
                            <div className="od-info-row">
                                <Package size={15} className="od-info-icon" />
                                <span className="od-info-label">Ngày đặt</span>
                                <span className="od-info-value">
                                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="od-divider" />

                    {/* Items — clickable, with image */}
                    <div className="od-section">
                        <h3 className="od-section-title">Danh sách sản phẩm</h3>
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
                                        title="Xem sản phẩm"
                                    >
                                        {/* Product image */}
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

                                        {/* Name */}
                                        <span className="od-item-name">{item.productName}</span>

                                        {/* Qty + price */}
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
                                Không có sản phẩm.
                            </p>
                        )}
                    </div>

                    <div className="od-divider" />

                    {/* Footer: total + cancel reason + cancel button */}
                    <div className="od-footer">
                        {order.status === "CANCELLED" && (
                            <p className="od-cancel-reason">
                                {getCancelReason(order)}
                            </p>
                        )}

                        <div className="od-footer-row">
                            <div className="od-footer-actions">
                                {canCancel(order) && (
                                    <button
                                        className="od-cancel-btn"
                                        onClick={() => setCancelModal({ open: true, note: "" })}
                                    >
                                        <X size={15} />
                                        Hủy đơn hàng
                                    </button>
                                )}
                                {order.status === "DELIVERED" && (
                                    <button
                                        className="od-confirm-received-btn"
                                        disabled={confirming}
                                        onClick={handleConfirmReceived}
                                    >
                                        {confirming ? "Đang xác nhận..." : "Đã nhận hàng"}
                                    </button>
                                )}
                            </div>
                            <div className="od-total-row">
                                <span className="od-total-label">Tổng cộng</span>
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
                        <h3>Xác nhận hủy đơn</h3>
                        <p>
                            Bạn có chắc muốn hủy đơn hàng{" "}
                            <strong>#{order.orderCode}</strong> không?
                            <br />
                            Hành động này không thể hoàn tác.
                        </p>
                        <textarea
                            placeholder="Lý do hủy đơn (không bắt buộc)..."
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
                                Quay lại
                            </button>
                            <button
                                className="od-modal-confirm"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;