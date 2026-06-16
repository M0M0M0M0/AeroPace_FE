import React, { useState, useRef } from "react";
import { X, Star, ChevronRight, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosClient";
import { uploadImage } from "../api/uploadImage";
import "./QuickReviewModal.css";


const QUICK_TAGS = [
  "Fast delivery",
  "Product as described",
  "Great quality",
  "Well packaged",
  "Great value",
];

const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;

  return (
    <div className="qrm-stars" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const leftVal = star - 0.5;
        const rightVal = star;
        const filledLeft = display >= leftVal;
        const filledRight = display >= rightVal;

        return (
          <span key={star} className="qrm-star-wrap">
            {/* left */}
            <span
              className="qrm-star-half qrm-star-half--left"
              onMouseEnter={() => setHovered(leftVal)}
              onClick={() => onChange(leftVal)}
            >
              <Star
                size={32}
                className="qrm-star-svg"
                style={{
                  fill: filledLeft ? "#f59e0b" : "transparent",
                  color: filledLeft ? "#f59e0b" : "var(--border-main)",
                }}
              />
            </span>
            {/* right*/}
            <span
              className="qrm-star-half qrm-star-half--right"
              onMouseEnter={() => setHovered(rightVal)}
              onClick={() => onChange(rightVal)}
            >
              <Star
                size={32}
                className="qrm-star-svg"
                style={{
                  fill: filledRight ? "#f59e0b" : "transparent",
                  color: filledRight ? "#f59e0b" : "var(--border-main)",
                }}
              />
            </span>
          </span>
        );
      })}
      <span className="qrm-star-label">
        {value ? `${value} / 5` : "Tap to rate"}
      </span>
    </div>
  );
};


const QuickReviewModal = ({ order, onClose, onSubmitted }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const toggleTag = (tag) => {
    setActiveTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      setComment(next.join(", "));
      return next;
    });
  };

  const handleFiles = (files) => {
    const arr = Array.from(files).slice(0, 3 - images.length);
    setImages((prev) => [
      ...prev,
      ...arr.map((file) => ({ url: URL.createObjectURL(file), file })),
    ]);
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a rating."); return; }
    setError("");
    setSubmitting(true);

    const items = order?.items || [];
    const seen = new Set();
    const uniqueItems = items.filter((item) => {
      if (seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    });

    try {
      const imageUrls = await Promise.all(
        images.map((img) => uploadImage(img.file, "review-image"))
      );

      await Promise.all(
        uniqueItems.map((item) =>
          axios.post(`/reviews/submit-order`, {
            rating,
            comment,
            imageUrls,
          }, {
            params: { orderCode: order.orderCode, productId: item.productId },
          })
        )
      );
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      const msg = err.response?.data?.message || "Submission failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedReview = () => {
    onClose();
    navigate("/review/detail", { state: { order } });
  };

  return (
    <div className="qrm-overlay">
      <div className="qrm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="qrm-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {done ? (
          /* ── Success state ── */
          <div className="qrm-done">
            <div className="qrm-done-icon">⭐</div>
            <h3>Thank you for your review!</h3>
            <p>Your feedback helps other shoppers.</p>
            <button className="qrm-btn qrm-btn--primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="qrm-title">Rate your order</h3>
            <p className="qrm-subtitle">
              #{order?.orderCode} · {order?.items?.length ?? 0} product
              {(order?.items?.length ?? 0) !== 1 ? "s" : ""}
            </p>

            {/* Stars */}
            <div className="qrm-section">
              <StarRating value={rating} onChange={setRating} />
            </div>

            {/* Quick tags */}
            <div className="qrm-section">
              <p className="qrm-section-label">Quick feedback</p>
              <div className="qrm-tags">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`qrm-tag ${activeTags.includes(tag) ? "qrm-tag--active" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="qrm-section">
              <textarea
                className="qrm-textarea"
                placeholder="Add a comment (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Photos */}
            <div className="qrm-section">
              <p className="qrm-section-label">Photos <span className="qrm-hint">(up to 3)</span></p>
              <div className="qrm-images">
                {images.map((img, idx) => (
                  <div key={idx} className="qrm-img-preview">
                    <img src={img.url} alt={`preview-${idx}`} />
                    <button className="qrm-img-remove" onClick={() => removeImage(idx)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <button className="qrm-img-add" onClick={() => fileRef.current?.click()}>
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

            {error && <p className="qrm-error">{error}</p>}

            {/* Actions */}
            <div className="qrm-actions">
              <button className="qrm-btn qrm-btn--ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                className="qrm-btn qrm-btn--primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>

            {/* Detailed review CTA */}
            <button className="qrm-detailed-btn" onClick={handleDetailedReview}>
              <span>
                Write a detailed review
                <span className="qrm-detailed-hint">
                  — rate each product individually, add photos &amp; full comments
                </span>
              </span>
              <ChevronRight size={16} className="qrm-detailed-arrow" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickReviewModal;