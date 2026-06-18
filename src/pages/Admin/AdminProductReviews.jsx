import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star, Trash2, Search, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import "./AdminProductReviews.css";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const STATUS_LABEL = {
  ACTIVE: { label: "Active", color: "#16a34a", bg: "#dcfce7" },
  EDITED: { label: "Edited", color: "#2563eb", bg: "#dbeafe" },
  DELETED: { label: "Deleted", color: "#dc2626", bg: "#fee2e2" },
};

const StarRating = ({ value }) => {
  const full = Math.floor(value ?? 0);
  const half = (value ?? 0) - full >= 0.5;
  return (
    <span className="apr-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={`apr-star ${i <= full ? "apr-star--full" : half && i === full + 1 ? "apr-star--half" : "apr-star--empty"}`}
        />
      ))}
      <span className="apr-star-value">{value != null ? Number(value).toFixed(1) : "—"}</span>
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_LABEL[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span className="apr-status-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
      {cfg.label}
    </span>
  );
};

const AdminProductReviews = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromMode = location.state?.fromMode || "edit";

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");

  // filters
  const [filterRating, setFilterRating] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [sort, setSort] = useState("newest");
  const [searchUserId, setSearchUserId] = useState("");
  const [searchOrderCode, setSearchOrderCode] = useState("");

  // pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  // delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteNote, setDeleteNote] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReviews = useCallback(async (currentPage = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        page: currentPage,
        size: PAGE_SIZE,
        sort,
      });
      if (filterRating) params.append("rating", filterRating);
      if (filterStatus) params.append("status", filterStatus);
      if (searchUserId.trim()) params.append("userId", searchUserId.trim());
      if (searchOrderCode.trim()) params.append("orderCode", searchOrderCode.trim());

      const res = await axios.get(`${BASE}/admin/reviews?${params}`, { headers: authHeader() });
      const data = res.data;
      setReviews(data.content ?? []);
      setTotalPages(data.totalPages ?? data.page?.totalPages ?? 0);
      setTotalElements(data.totalElements ?? data.page?.totalElements ?? 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [productId, sort, filterRating, filterStatus, searchUserId, searchOrderCode]);

  useEffect(() => {
    setPage(0);
    fetchReviews(0);
  }, [sort, filterRating, filterStatus]);

  useEffect(() => {
    const fetchProductName = async () => {
      try {
        const params = new URLSearchParams({ productId, page: 0 });
        const res = await axios.get(`${BASE}/admin/products/filter?${params}`, { headers: authHeader() });
        const products = res.data.products || res.data.content || [];
        const product = products.find((p) => String(p.id) === String(productId));
        if (product) setProductName(product.name);
      } catch {
        // silently fail — name is cosmetic
      }
    };
    fetchProductName();
  }, [productId]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchReviews(0);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchReviews(newPage);
  };

  const openDeleteModal = (review) => {
    setDeleteTarget(review);
    setDeleteNote("");
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteNote("");
  };

  const handleDelete = async () => {
    if (!deleteNote.trim()) {
      toast.error("Please enter a reason for deletion.");
      return;
    }
    setDeleteLoading(true);
    try {
      await axios.delete(`${BASE}/admin/reviews/${deleteTarget.id}`, {
        headers: authHeader(),
        data: { note: deleteNote.trim() },
      });
      toast.success("Review deleted.");
      closeDeleteModal();
      fetchReviews(page);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete review.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchUserId("");
    setSearchOrderCode("");
    setPage(0);
    fetchReviews(0);
  };

  return (
    <div className="apr-page">
      {/* Topbar */}
      <div className="apr-topbar">
        <button className="apr-back-btn" onClick={() => navigate(`/admin/products/${productId}?mode=${fromMode}`)}>
          <ArrowLeft size={16} /> Back to Product
        </button>
        <div className="apr-topbar-info">
          <h1 className="apr-title">Product Reviews</h1>
          {productName && <span className="apr-product-name">{productName}</span>}
        </div>
        <span className="apr-total-count">{totalElements} review{totalElements !== 1 ? "s" : ""}</span>
      </div>

      {/* Filters */}
      <div className="apr-filters">
        <div className="apr-filter-row">
          {/* Rating filter */}
          <div className="apr-filter-group">
            <label className="apr-filter-label">Rating</label>
            <div className="apr-rating-pills">
              <button
                className={`apr-pill ${filterRating === "" ? "apr-pill--active" : ""}`}
                onClick={() => setFilterRating("")}
              >All</button>
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  className={`apr-pill ${filterRating === String(r) ? "apr-pill--active" : ""}`}
                  onClick={() => setFilterRating(String(r))}
                >
                  {r} <Star size={11} className="apr-pill-star" />
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="apr-filter-group">
            <label className="apr-filter-label">Status</label>
            <select className="apr-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="EDITED">Edited</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>

          {/* Sort */}
          <div className="apr-filter-group">
            <label className="apr-filter-label">Sort by</label>
            <select className="apr-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Rating: high → low</option>
              <option value="lowest">Rating: low → high</option>
            </select>
          </div>
        </div>

        {/* Search row */}
        <form className="apr-search-row" onSubmit={handleSearch}>
          <div className="apr-search-field">
            <label className="apr-filter-label">User ID</label>
            <div className="apr-input-wrap">
              <Search size={14} className="apr-input-icon" />
              <input
                className="apr-search-input"
                type="number"
                placeholder="e.g. 42"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
            </div>
          </div>
          <div className="apr-search-field">
            <label className="apr-filter-label">Order Code</label>
            <div className="apr-input-wrap">
              <Search size={14} className="apr-input-icon" />
              <input
                className="apr-search-input"
                placeholder="e.g. ORD-20250618-XXXX"
                value={searchOrderCode}
                onChange={(e) => setSearchOrderCode(e.target.value)}
              />
            </div>
          </div>
          <div className="apr-search-actions">
            <button type="submit" className="apr-btn-search">Search</button>
            {(searchUserId || searchOrderCode) && (
              <button type="button" className="apr-btn-clear" onClick={clearSearch}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="apr-table-wrap">
        {loading ? (
          <div className="apr-loading">Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="apr-empty">No reviews found matching the current filters.</div>
        ) : (
          <table className="apr-table">
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Order</th>
                <th>Variant</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Images</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className={r.status === "DELETED" ? "apr-row--deleted" : ""}>
                  <td>
                    <div className="apr-reviewer">
                      <span className="apr-reviewer-name">{r.userName || "—"}</span>
                      <span className="apr-reviewer-id">ID: {r.userId}</span>
                    </div>
                  </td>
                  <td>
                    {r.orderCode
                      ? <span className="apr-order-code">{r.orderCode}</span>
                      : <span className="apr-na">—</span>
                    }
                  </td>
                  <td>
                    <span className="apr-variant">{r.variantName || "—"}</span>
                  </td>
                  <td>
                    <StarRating value={r.rating} />
                  </td>
                  <td>
                    <p className="apr-comment">{r.comment || <span className="apr-na">No comment</span>}</p>
                  </td>
                  <td>
                    {r.imageUrls?.length > 0 ? (
                      <div className="apr-images">
                        {r.imageUrls.slice(0, 3).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img className="apr-thumb" src={url} alt="" />
                          </a>
                        ))}
                        {r.imageUrls.length > 3 && (
                          <span className="apr-img-more">+{r.imageUrls.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="apr-na">—</span>
                    )}
                  </td>
                  <td>
                    <span className="apr-date">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"
                      }
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.status !== "DELETED" && (
                      <button className="apr-btn-delete" onClick={() => openDeleteModal(r)} title="Delete review">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="apr-pagination">
          <button
            className="apr-page-btn"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
          >Previous</button>
          <span className="apr-page-info">Page {page + 1} of {totalPages}</span>
          <button
            className="apr-page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => handlePageChange(page + 1)}
          >Next</button>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="apr-modal-overlay" onClick={closeDeleteModal}>
          <div className="apr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="apr-modal-header">
              <h3 className="apr-modal-title">Delete Review</h3>
              <button className="apr-modal-close" onClick={closeDeleteModal}><X size={18} /></button>
            </div>
            <div className="apr-modal-body">
              <p className="apr-modal-info">
                Review by <strong>{deleteTarget.userName || `User #${deleteTarget.userId}`}</strong>
                {deleteTarget.orderCode && <> on order <strong>{deleteTarget.orderCode}</strong></>}
              </p>
              {deleteTarget.comment && (
                <blockquote className="apr-modal-quote">{deleteTarget.comment}</blockquote>
              )}
              <label className="apr-modal-label">
                Reason <span className="apr-required">*</span>
              </label>
              <textarea
                className="apr-modal-textarea"
                rows={3}
                placeholder="Enter the reason for deleting this review..."
                value={deleteNote}
                onChange={(e) => setDeleteNote(e.target.value)}
              />
            </div>
            <div className="apr-modal-footer">
              <button className="apr-modal-btn-cancel" onClick={closeDeleteModal} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="apr-modal-btn-confirm" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductReviews;
