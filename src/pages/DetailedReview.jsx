import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Upload, X, CheckCircle } from "lucide-react";
import axios from "../api/axiosClient";
import "./DetailedReview.css";

const QUICK_TAGS = [
    "Fast delivery",
    "Product as described",
    "Great quality",
    "Well packaged",
    "Great value",
];

const StarRating = ({ value, onChange, disabled }) => {
    const [hovered, setHovered] = useState(null);
    const display = hovered ?? value;

    return (
        <div
            className="dr-stars"
            onMouseLeave={() => setHovered(null)}
            style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.5 : 1 }}
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const leftVal = star - 0.5;
                const rightVal = star;
                const filledLeft = display >= leftVal;
                const filledRight = display >= rightVal;

                return (
                    <span key={star} className="dr-star-wrap">
                        <span
                            className="dr-star-half dr-star-half--left"
                            onMouseEnter={() => setHovered(leftVal)}
                            onClick={() => onChange(leftVal)}
                        >
                            <Star
                                size={28}
                                className="dr-star-svg"
                                style={{
                                    fill: filledLeft ? "#f59e0b" : "transparent",
                                    color: filledLeft ? "#f59e0b" : "var(--border-main)",
                                }}
                            />
                        </span>
                        <span
                            className="dr-star-half dr-star-half--right"
                            onMouseEnter={() => setHovered(rightVal)}
                            onClick={() => onChange(rightVal)}
                        >
                            <Star
                                size={28}
                                className="dr-star-svg"
                                style={{
                                    fill: filledRight ? "#f59e0b" : "transparent",
                                    color: filledRight ? "#f59e0b" : "var(--border-main)",
                                }}
                            />
                        </span>
                    </span>
                );
            })}
            <span className="dr-star-label">{value ? `${value} / 5` : "Tap to rate"}</span>
        </div>
    );
};

//product review card
const ProductReviewCard = ({ item, reviewState, onChange, submitted }) => {
    const fileRef = useRef(null);
    const { rating, comment, tags, previewUrls } = reviewState;

    const toggleTag = (tag) => {
        const nextTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
        const nextComment = nextTags.join(", ");
        onChange({ tags: nextTags, comment: nextComment });
    };

    const handleFiles = (files) => {
        const arr = Array.from(files).slice(0, 3 - (previewUrls?.length ?? 0));
        arr.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                onChange({
                    previewUrls: [...(reviewState.previewUrls ?? []), e.target.result],
                    imageFiles: [...(reviewState.imageFiles ?? []), file],
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (idx) => {
        onChange({
            previewUrls: previewUrls.filter((_, i) => i !== idx),
            imageFiles: (reviewState.imageFiles ?? []).filter((_, i) => i !== idx),
        });
    };

    return (
        <div className={`dr-card ${submitted ? "dr-card--done" : ""}`}>
            {/* Product identity */}
            <div className="dr-card-header">
                <div className="dr-card-img-wrap">
                    {item.productImgUrl ? (
                        <img src={item.productImgUrl} alt={item.productName} className="dr-card-img" />
                    ) : (
                        <div className="dr-card-img-placeholder" />
                    )}
                </div>
                <div className="dr-card-info">
                    <p className="dr-card-name">{item.productName}</p>
                    {item.variantName && (
                        <p className="dr-card-variant">Variant: {item.variantName}</p>
                    )}
                </div>
                {submitted && (
                    <div className="dr-card-done-badge">
                        <CheckCircle size={18} />
                        Reviewed
                    </div>
                )}
            </div>

            {submitted ? null : (
                <>
                    {/* Stars */}
                    <div className="dr-field">
                        <p className="dr-field-label">Your rating</p>
                        <StarRating value={rating} onChange={(v) => onChange({ rating: v })} />
                    </div>

                    {/* Quick tags */}
                    <div className="dr-field">
                        <p className="dr-field-label">Quick feedback</p>
                        <div className="dr-tags">
                            {QUICK_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    className={`dr-tag ${tags.includes(tag) ? "dr-tag--active" : ""}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="dr-field">
                        <p className="dr-field-label">Comment</p>
                        <textarea
                            className="dr-textarea"
                            placeholder="Share your experience with this product..."
                            value={comment}
                            rows={3}
                            onChange={(e) => onChange({ comment: e.target.value })}
                        />
                    </div>

                    {/* Image upload */}
                    <div className="dr-field">
                        <p className="dr-field-label">Photos <span className="dr-field-hint">(up to 3)</span></p>
                        <div className="dr-images">
                            {(previewUrls ?? []).map((url, idx) => (
                                <div key={idx} className="dr-img-preview">
                                    <img src={url} alt={`preview-${idx}`} />
                                    <button className="dr-img-remove" onClick={() => removeImage(idx)}>
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {(previewUrls ?? []).length < 3 && (
                                <button
                                    className="dr-img-add"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <Upload size={18} />
                                    <span>Add photo</span>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: "none" }}
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Main
const DetailedReview = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const order = state?.order;

    const seen = new Set();
    const items = (order?.items ?? []).filter((item) => {
        if (seen.has(item.productId)) return false;
        seen.add(item.productId);
        return true;
    });

    const initState = () =>
        Object.fromEntries(
            items.map((item) => [
                item.productId,
                { rating: 0, comment: "", tags: [], previewUrls: [], imageFiles: [] },
            ])
        );

    const [reviews, setReviews] = useState(initState);
    const [submitted, setSubmitted] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [errors, setErrors] = useState({});
    const [allDone, setAllDone] = useState(false);

    const updateReview = (productId, patch) => {
        setReviews((prev) => ({
            ...prev,
            [productId]: { ...prev[productId], ...patch },
        }));
    };

    const submitOne = async (item) => {
        const rv = reviews[item.productId];
        if (!rv.rating) {
            setErrors((e) => ({ ...e, [item.productId]: "Please select a rating." }));
            return;
        }
        setErrors((e) => ({ ...e, [item.productId]: "" }));
        setSubmitting((s) => ({ ...s, [item.productId]: true }));

        try {
            await axios.post(
                `/reviews/submit-order`,
                { rating: rv.rating, comment: rv.comment, imageUrls: [] },
                { params: { orderCode: order.orderCode, productId: item.productId } }
            );
            setSubmitted((s) => {
                const next = { ...s, [item.productId]: true };
                if (items.every((i) => next[i.productId])) setAllDone(true);
                return next;
            });
        } catch (err) {
            const msg = err.response?.data?.message || "Submission failed.";
            setErrors((e) => ({ ...e, [item.productId]: msg }));
        } finally {
            setSubmitting((s) => ({ ...s, [item.productId]: false }));
        }
    };

    const handleBack = () => navigate("/profile", { state: { tab: "orders" } });

    if (!order) {
        return (
            <div className="dr-page">
                <div className="dr-container">
                    <p style={{ color: "var(--text-muted)" }}>Order not found.</p>
                    <button className="dr-back-btn" onClick={handleBack}>
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dr-page">
            <div className="dr-container">
                {/* Back */}
                <button className="dr-back-btn" onClick={handleBack}>
                    <ArrowLeft size={16} /> Back to orders
                </button>

                {/* Page header */}
                <div className="dr-page-header">
                    <h2 className="dr-page-title">Detailed Review</h2>
                    <p className="dr-page-sub">
                        Order <strong>#{order.orderCode}</strong> · Rate each product individually
                    </p>
                </div>

                {allDone ? (
                    <div className="dr-all-done">
                        <div className="dr-all-done-icon"></div>
                        <h3>All reviews submitted!</h3>
                        <p>Thank you — your feedback means a lot.</p>
                        <button className="dr-btn dr-btn--primary" onClick={handleBack}>
                            Back to orders
                        </button>
                    </div>
                ) : (
                    <div className="dr-cards">
                        {items.map((item) => (
                            <div key={item.productId}>
                                <ProductReviewCard
                                    item={item}
                                    reviewState={reviews[item.productId]}
                                    onChange={(patch) => updateReview(item.productId, patch)}
                                    submitted={!!submitted[item.productId]}
                                />
                                {!submitted[item.productId] && (
                                    <div className="dr-card-footer">
                                        {errors[item.productId] && (
                                            <p className="dr-error">{errors[item.productId]}</p>
                                        )}
                                        <button
                                            className="dr-btn dr-btn--primary"
                                            disabled={submitting[item.productId]}
                                            onClick={() => submitOne(item)}
                                        >
                                            {submitting[item.productId] ? "Submitting..." : "Submit review"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailedReview;