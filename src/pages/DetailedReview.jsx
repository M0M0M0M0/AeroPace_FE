import React, { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Upload, X, CheckCircle, Trash2 } from "lucide-react";
import axios from "../api/axiosClient";
import { uploadImage } from "../api/uploadImage";
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
                const leftVal = star === 1 ? 1 : star - 0.5;
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

const ProductReviewCard = ({ item, reviewState, onChange, submitted }) => {
    const fileRef = useRef(null);
    const { rating, comment, tags, images } = reviewState;

    const toggleTag = (tag) => {
        const nextTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
        const nextComment = nextTags.join(", ");
        onChange({ tags: nextTags, comment: nextComment });
    };

    const handleFiles = (files) => {
        const arr = Array.from(files).slice(0, 3 - (images?.length ?? 0));
        const newImages = arr.map((file) => ({ url: URL.createObjectURL(file), file }));
        onChange({ images: [...(images ?? []), ...newImages] });
    };

    const removeImage = (idx) => {
        onChange({ images: images.filter((_, i) => i !== idx) });
    };

    return (
        <div className={`dr-card ${submitted ? "dr-card--done" : ""}`}>
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
                    <div className="dr-field">
                        <p className="dr-field-label">Your rating</p>
                        <StarRating value={rating} onChange={(v) => onChange({ rating: v })} />
                    </div>

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

                    <div className="dr-field">
                        <p className="dr-field-label">Photos <span className="dr-field-hint">(up to 3)</span></p>
                        <div className="dr-images">
                            {(images ?? []).map((img, idx) => (
                                <div key={idx} className="dr-img-preview">
                                    <img src={img.url} alt={`preview-${idx}`} />
                                    <button className="dr-img-remove" onClick={() => removeImage(idx)}>
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {(images ?? []).length < 3 && (
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

const DetailedReview = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const order = state?.order;
    const editMode = state?.editMode || false;
    const existingReviews = state?.existingReviews || [];

    const seen = new Set();
    const submitItems = (order?.items ?? []).filter((item) => {
        if (seen.has(item.productId)) return false;
        seen.add(item.productId);
        return true;
    });

    const editItems = existingReviews.map((rv) => {
        const orderItem = (order?.items ?? []).find((i) => i.productId === rv.productId);
        return {
            productId: rv.productId,
            productName: orderItem?.productName || `Product #${rv.productId}`,
            productImgUrl: orderItem?.productImgUrl,
            variantName: rv.variantName,
            reviewId: rv.id,
        };
    });

    const items = editMode ? editItems : submitItems;

    const buildInitState = () =>
        Object.fromEntries(
            items.map((item) => {
                if (editMode) {
                    const rv = existingReviews.find((r) => r.productId === item.productId);
                    return [
                        item.productId,
                        {
                            rating: parseFloat(rv?.rating ?? 0),
                            comment: rv?.comment ?? "",
                            tags: [],
                            images: (rv?.imageUrls ?? []).map((url) => ({ url, file: null })),
                        },
                    ];
                }
                return [
                    item.productId,
                    { rating: 0, comment: "", tags: [], images: [] },
                ];
            })
        );

    const [reviews, setReviews] = useState(buildInitState);
    const [initialSnapshot] = useState(buildInitState);
    const [submitted, setSubmitted] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [errors, setErrors] = useState({});
    const [allDone, setAllDone] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const isDirty = useMemo(() => {
        if (!editMode) return false;
        return items.some((item) => {
            const curr = reviews[item.productId];
            const init = initialSnapshot[item.productId];
            return curr?.rating !== init?.rating || curr?.comment !== init?.comment;
        });
    }, [editMode, reviews, initialSnapshot, items]);

    useEffect(() => {
        if (!editMode || !isDirty) return;
        const handler = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [editMode, isDirty]);

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
            const imageUrls = await Promise.all(
                (rv.images ?? []).map((img) =>
                    img.file ? uploadImage(img.file, "review-image") : img.url
                )
            );

            if (editMode) {
                await axios.put(`/reviews/${item.reviewId}`, {
                    rating: rv.rating,
                    comment: rv.comment,
                    imageUrls,
                });
            } else {
                await axios.post(
                    `/reviews/submit-order`,
                    { rating: rv.rating, comment: rv.comment, imageUrls },
                    { params: { orderCode: order.orderCode, productId: item.productId } }
                );
            }
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

    const handleDeleteConfirm = async () => {
        const item = items.find((i) => i.productId === deleteConfirm);
        if (!item) return;
        setDeleting(true);
        try {
            await axios.delete(`/reviews/${item.reviewId}`);
            setDeleteConfirm(null);
            navigate("/profile", { state: { tab: "orders" } });
        } catch (err) {
            setErrors((e) => ({
                ...e,
                [deleteConfirm]: err.response?.data?.message || "Delete failed.",
            }));
            setDeleteConfirm(null);
        } finally {
            setDeleting(false);
        }
    };

    const handleLeave = (shouldLeave) => {
        setShowLeaveConfirm(false);
        if (shouldLeave) {
            navigate("/profile", { state: { tab: "orders" } });
        }
    };

    const handleBack = () => {
        if (editMode && isDirty && !allDone) {
            setShowLeaveConfirm(true);
        } else {
            navigate("/profile", { state: { tab: "orders" } });
        }
    };

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
                <button className="dr-back-btn" onClick={handleBack}>
                    <ArrowLeft size={16} /> Back to orders
                </button>

                <div className="dr-page-header">
                    <div className="dr-page-title-row">
                        <h2 className="dr-page-title">
                            {editMode ? "Edit Review" : "Detailed Review"}
                        </h2>
                        {editMode && <span className="dr-edit-badge">Editing</span>}
                    </div>
                    <p className="dr-page-sub">
                        Order <strong>#{order.orderCode}</strong> · Rate each product individually
                    </p>
                </div>

                {allDone ? (
                    <div className="dr-all-done">
                        <div className="dr-all-done-icon"></div>
                        <h3>{editMode ? "Review updated!" : "All reviews submitted!"}</h3>
                        <p>
                            {editMode
                                ? "Your changes have been saved."
                                : "Thank you — your feedback means a lot."}
                        </p>
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
                                        <div className="dr-card-footer-actions">
                                            {editMode && (
                                                <button
                                                    className="dr-btn dr-btn--danger"
                                                    onClick={() => setDeleteConfirm(item.productId)}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete review
                                                </button>
                                            )}
                                            <button
                                                className="dr-btn dr-btn--primary"
                                                disabled={submitting[item.productId]}
                                                onClick={() => submitOne(item)}
                                            >
                                                {submitting[item.productId]
                                                    ? editMode ? "Saving..." : "Submitting..."
                                                    : editMode ? "Save changes" : "Submit review"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirm modal */}
            {deleteConfirm !== null && (
                <div className="dr-modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
                    <div className="dr-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Review</h3>
                        <p>Are you sure you want to delete this review? This action cannot be undone.</p>
                        <div className="dr-modal-actions">
                            <button
                                className="dr-modal-back"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="dr-modal-delete"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave confirm modal */}
            {showLeaveConfirm && (
                <div className="dr-modal-overlay">
                    <div className="dr-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Unsaved Changes</h3>
                        <p>You have unsaved changes. Are you sure you want to leave without saving?</p>
                        <div className="dr-modal-actions">
                            <button className="dr-modal-back" onClick={() => handleLeave(false)}>
                                Stay
                            </button>
                            <button className="dr-modal-delete" onClick={() => handleLeave(true)}>
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailedReview;
