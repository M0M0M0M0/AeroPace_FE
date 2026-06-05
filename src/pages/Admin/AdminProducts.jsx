import React, { useState, useEffect, useCallback, useRef } from "react";
import { Edit2, Plus, X, Search, Eye, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminProducts.css";

const BASE = "http://localhost:8080/api/v1/admin";
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  ACTIVE: { label: "Active", color: "#16a34a", bg: "#dcfce7" },
  DRAFT: { label: "Draft", color: "#ca8a04", bg: "#fef9c3" },
  ARCHIVED: { label: "Archived", color: "#6b7280", bg: "#f3f4f6" },
  DELETED: { label: "Deleted", color: "#dc2626", bg: "#fee2e2" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
};


// ── Best seller presets ───────────────────────────────────────
const PRESETS = [
  { label: "This Week", getValue: () => { const now = new Date(); const day = now.getDay() || 7; const mon = new Date(now); mon.setDate(now.getDate() - day + 1); return { dateFrom: mon.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) }; } },
  { label: "This Month", getValue: () => { const now = new Date(); return { dateFrom: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, dateTo: now.toISOString().slice(0, 10) }; } },
  { label: "30 Days", getValue: () => { const now = new Date(); const from = new Date(now); from.setDate(now.getDate() - 30); return { dateFrom: from.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) }; } },
  { label: "90 Days", getValue: () => { const now = new Date(); const from = new Date(now); from.setDate(now.getDate() - 90); return { dateFrom: from.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) }; } },
];

const AdminProducts = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Delay api call ───────────────────────────────────────
  const debounceRef = useRef(null);

  const setFilterDebounced = (setter) => (e) => {
    const val = e.target.value;
    setter(val);
    setPage(0);
  };

  // ── Pagination ────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Filter states ─────────────────────────────────────────────
  const [filterName, setFilterName] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [filterVariantId, setFilterVariantId] = useState("");
  const [filterSku, setFilterSku] = useState("");
  const [filterBrand, setFilterBrand] = useState([]);
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterStockMin, setFilterStockMin] = useState("");
  const [filterStockMax, setFilterStockMax] = useState("");
  const [filterStatus, setFilterStatus] = useState([]);

  // ── Best sellers mode ─────────────────────────────────────────
  const [bsMode, setBsMode] = useState(false);
  const [bsPreset, setBsPreset] = useState(null);
  const [bsDateFrom, setBsDateFrom] = useState("");
  const [bsDateTo, setBsDateTo] = useState("");
  const [bsLimit, setBsLimit] = useState(10);
  const [bsLoading, setBsLoading] = useState(false);
  const [bestSellers, setBestSellers] = useState([]);

  // ── Fetch products ────────────────────────────────────────────
  const abortRef = useRef(null);
  const fetchProducts = useCallback(async (currentPage = page) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      if (filterName) params.append("name", filterName);
      if (filterProductId) params.append("productId", filterProductId);
      if (filterVariantId) params.append("variantId", filterVariantId);
      if (filterSku) params.append("sku", filterSku);
      filterBrand.forEach((id) => params.append("brands", id));
      filterCategory.forEach((id) => params.append("categories", id));
      if (filterPriceMin) params.append("minPrice", filterPriceMin);
      if (filterPriceMax) params.append("maxPrice", filterPriceMax);
      if (filterStockMin) params.append("stockMin", filterStockMin);
      if (filterStockMax) params.append("stockMax", filterStockMax);
      filterStatus.forEach((s) => params.append("statuses", s));
      console.log("Fetching products with params:", params.toString());

      const res = await axios.get(`${BASE}/products/filter?${params}`, { headers: authHeader(), signal: abortRef.current.signal });
      setProducts(res.data.products || res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      console.log(res.data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterName, filterProductId, filterVariantId, filterSku, filterBrand, filterCategory,
    filterPriceMin, filterPriceMax, filterStockMin, filterStockMax, filterStatus]);

  const fetchBrands = async () => { const r = await axios.get(`http://localhost:8080/api/v1/brands`); setBrands(r.data); };
  const fetchCategories = async () => { const r = await axios.get(`http://localhost:8080/api/v1/categories`); setCategories(r.data); };

  useEffect(() => { fetchBrands(); fetchCategories(); }, []);
  useEffect(() => {
    if (bsMode) return;

    const timer = setTimeout(() => {
      fetchProducts(page);
    }, 500); // chờ 500ms

    return () => clearTimeout(timer);
  }, [page, filterName, filterProductId, filterVariantId, filterSku, filterBrand, filterCategory,
    filterPriceMin, filterPriceMax, filterStockMin, filterStockMax, filterStatus, bsMode]);

  // ── Best sellers ──────────────────────────────────────────────
  const fetchBestSellers = useCallback(async (dateFrom, dateTo, limit) => {
    if (!dateFrom || !dateTo) return;
    setBsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("dateFrom", dateFrom);
      params.append("dateTo", dateTo);
      params.append("limit", limit);
      const res = await axios.get(`${BASE}/products/best-sellers?${params}`, { headers: authHeader() });
      setBestSellers(res.data || []);
    } catch (err) { console.error(err); }
    finally { setBsLoading(false); }
  }, []);

  const handlePresetClick = (preset) => {
    const { dateFrom, dateTo } = preset.getValue();
    setBsPreset(preset.label); setBsDateFrom(dateFrom); setBsDateTo(dateTo);
    setBsMode(true);
    fetchBestSellers(dateFrom, dateTo, bsLimit);
  };

  const handleBsCustomApply = () => {
    if (!bsDateFrom || !bsDateTo) return;
    setBsPreset(null); setBsMode(true);
    fetchBestSellers(bsDateFrom, bsDateTo, bsLimit);
  };

  const handleBsLimitChange = (newLimit) => {
    setBsLimit(newLimit);
    if (bsMode && bsDateFrom && bsDateTo) fetchBestSellers(bsDateFrom, bsDateTo, newLimit);
  };

  const clearBsMode = () => {
    setBsMode(false); setBsPreset(null); setBsDateFrom(""); setBsDateTo(""); setBsLimit(10); setBestSellers([]);
  };

  // ── Filters ───────────────────────────────────────────────────
  const resetFilters = () => {
    setFilterName(""); setFilterProductId(""); setFilterVariantId("");
    setFilterSku(""); setFilterBrand([]); setFilterCategory([]);
    setFilterPriceMin(""); setFilterPriceMax("");
    setFilterStockMin(""); setFilterStockMax(""); setFilterStatus([]);
    setPage(0);
  };

  const hasActiveFilter = filterName || filterProductId || filterVariantId || filterSku ||
    filterBrand.length > 0 || filterCategory.length > 0 || filterPriceMin || filterPriceMax ||
    filterStockMin || filterStockMax || filterStatus.length > 0;

  const toggleFilter = (value, list, setList) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setPage(0);
  };

  // ── Display helpers ───────────────────────────────────────────
  const getMinPrice = (variants) => {
    if (!variants?.length) return "—";
    const prices = variants.filter((v) => !v.isDeleted).map((v) => Number(v.price)).filter(Boolean);
    if (!prices.length) return "—";
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max
      ? `${min.toLocaleString("vi-VN")} ₫`
      : `${min.toLocaleString("vi-VN")} – ${max.toLocaleString("vi-VN")} ₫`;
  };

  const getTotalStock = (variants) =>
    variants?.filter((v) => !v.isDeleted).reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;

  const displayProducts = bsMode ? bestSellers : products;
  const displayLoading = bsMode ? bsLoading : loading;

  return (
    <div className="adp-page">
      {/* HEADER */}
      <div className="adp-header">
        <div>
          <h2 className="adp-title">Product Management</h2>
          <p className="adp-subtitle">Manage all products in the system</p>
        </div>
        <button className="adp-btn-add" onClick={() => navigate("/admin/products/new")}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="adp-filter-wrap">
        <div className="adp-filter-bar">
          <div className="adp-filter-field">
            <label className="adp-filter-label">Product Name</label>
            <div className="adp-filter-input-wrap">
              <Search size={14} className="adp-filter-icon" />
              <input className="adp-filter-input" placeholder="Search name..." value={filterName}
                onChange={(e) => { setFilterName(e.target.value); setPage(0); }} />
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">Product ID</label>
            <input className="adp-filter-input" placeholder="e.g., 12" value={filterProductId}
              onChange={(e) => { setFilterProductId(e.target.value); setPage(0); }} />
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">Variant ID</label>
            <input className="adp-filter-input" placeholder="e.g., 5" value={filterVariantId}
              onChange={(e) => { setFilterVariantId(e.target.value); setPage(0); }} />
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">SKU</label>
            <input className="adp-filter-input" placeholder="e.g., NK-001" value={filterSku}
              onChange={(e) => { setFilterSku(e.target.value); setPage(0); }} />
          </div>
          <div className="adp-filter-field">
            <label className="adp-filter-label">Brand</label>
            <select className="adp-filter-input" value=""
              onChange={(e) => { if (e.target.value) toggleFilter(Number(e.target.value), filterBrand, setFilterBrand); }}>
              <option value="">Brand</option>
              {brands.filter((b) => !filterBrand.includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <div className="adp-filter-tags">
              {filterBrand.map((id) => {
                const b = brands.find((x) => x.id === id); return b ? (
                  <span key={id} className="adp-filter-tag">{b.name}
                    <button onClick={() => toggleFilter(id, filterBrand, setFilterBrand)}>✕</button>
                  </span>) : null;
              })}
            </div>
          </div>
          <div className="adp-filter-field">
            <label className="adp-filter-label">Category</label>
            <select className="adp-filter-input" value=""
              onChange={(e) => { if (e.target.value) toggleFilter(Number(e.target.value), filterCategory, setFilterCategory); }}>
              <option value="">Category</option>
              {categories.filter((c) => !filterCategory.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="adp-filter-tags">
              {filterCategory.map((id) => {
                const c = categories.find((x) => x.id === id); return c ? (
                  <span key={id} className="adp-filter-tag">{c.name}
                    <button onClick={() => toggleFilter(id, filterCategory, setFilterCategory)}>✕</button>
                  </span>) : null;
              })}
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">Status</label>
            <select className="adp-filter-input" value=""
              onChange={(e) => { if (e.target.value) toggleFilter(e.target.value, filterStatus, setFilterStatus); }}>
              <option value="">Status</option>
              {["ACTIVE", "DRAFT", "ARCHIVED", "DELETED"].filter((s) => !filterStatus.includes(s))
                .map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
            </select>
            <div className="adp-filter-tags">
              {filterStatus.map((s) => (
                <span key={s} className="adp-filter-tag">{STATUS_CONFIG[s]?.label}
                  <button onClick={() => toggleFilter(s, filterStatus, setFilterStatus)}>✕</button>
                </span>))}
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--range">
            <label className="adp-filter-label">Price Range (₫)</label>
            <div className="adp-filter-range">
              <input className="adp-filter-input" type="number" placeholder="From" value={filterPriceMin}
                onChange={(e) => { setFilterPriceMin(e.target.value); setPage(0); }} />
              <span className="adp-filter-range-sep">—</span>
              <input className="adp-filter-input" type="number" placeholder="To" value={filterPriceMax}
                onChange={(e) => { setFilterPriceMax(e.target.value); setPage(0); }} />
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--range">
            <label className="adp-filter-label">Stock Level</label>
            <div className="adp-filter-range">
              <input className="adp-filter-input" type="number" placeholder="From" value={filterStockMin}
                onChange={(e) => { setFilterStockMin(e.target.value); setPage(0); }} />
              <span className="adp-filter-range-sep">—</span>
              <input className="adp-filter-input" type="number" placeholder="To" value={filterStockMax}
                onChange={(e) => { setFilterStockMax(e.target.value); setPage(0); }} />
            </div>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="adp-bs-section">
          <div className="adp-bs-header">
            <span className="adp-filter-label">Best Sellers</span>
            {bsMode && (
              <button className="adp-bs-clear" onClick={clearBsMode}>
                <X size={13} /> Disable filter
              </button>
            )}
          </div>
          <div className="adp-bs-controls">
            <div className="adp-bs-presets">
              {PRESETS.map((p) => (
                <button key={p.label}
                  className={`adp-bs-preset-btn ${bsPreset === p.label ? "adp-bs-preset-btn--active" : ""}`}
                  onClick={() => handlePresetClick(p)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="adp-bs-custom">
              <input type="date" className="adp-filter-input adp-filter-date" value={bsDateFrom}
                onChange={(e) => { setBsDateFrom(e.target.value); setBsPreset(null); }} />
              <span className="adp-filter-range-sep">→</span>
              <input type="date" className="adp-filter-input adp-filter-date" value={bsDateTo} min={bsDateFrom}
                onChange={(e) => { setBsDateTo(e.target.value); setBsPreset(null); }} />
              <button className="adp-bs-apply-btn" onClick={handleBsCustomApply} disabled={!bsDateFrom || !bsDateTo}>
                Apply
              </button>
            </div>
            <div className="adp-bs-limit">
              <span className="adp-bs-limit-label">Top</span>
              {[10, 20, 30].map((n) => (
                <button key={n}
                  className={`adp-bs-limit-btn ${bsLimit === n ? "adp-bs-limit-btn--active" : ""}`}
                  onClick={() => handleBsLimitChange(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="adp-filter-footer">
          {(hasActiveFilter || bsMode) && (
            <>
              {bsMode ? (
                <span className="adp-filter-result">
                  <Trophy size={13} style={{ marginRight: 4 }} />
                  Top <strong>{bestSellers.length}</strong> Best Sellers
                  {bsDateFrom && bsDateTo && ` (${bsDateFrom} → ${bsDateTo})`}
                </span>
              ) : (
                <span className="adp-filter-result">
                  Found <strong>{products.length}</strong> products
                </span>
              )}
              {hasActiveFilter && (
                <button className="adp-filter-reset" onClick={resetFilters}>
                  <X size={13} /> Clear filters
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="adp-table-wrap">
        <table className="adp-table">
          <thead>
            <tr>
              <th>Images</th><th>ID</th><th>Name</th>
              <th>Brand</th><th>Category</th><th>Status</th>
              <th>Price</th><th>Stock</th>
              {bsMode && <th>Sold</th>}
              <th>Variants</th>
              {!bsMode && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayLoading ? (
              <tr><td colSpan={10} className="adp-empty-row">Loading...</td></tr>
            ) : displayProducts.length > 0 ? displayProducts.map((product, idx) => (
              <tr key={product.id} className="adp-row">
                <td>
                  {product.images?.[0]?.imageUrl
                    ? <img className="adp-thumb" src={product.images[0].imageUrl} alt={product.name} />
                    : <div className="adp-thumb adp-thumb--empty">No img</div>}
                </td>
                <td className="adp-id">
                  {bsMode && idx < 3 && <span className="adp-rank-badge">#{idx + 1}</span>}
                  #{product.id}
                </td>
                <td className="adp-name">{product.name}</td>
                <td className="adp-brand">{product.brand}</td>
                <td>
                  <div className="adp-cats">
                    {product.categories?.map((c) => <span key={c.id} className="adp-cat-tag">{c.name}</span>)}
                  </div>
                </td>
                <td><StatusBadge status={product.status} /></td>
                <td className="adp-price">{getMinPrice(product.variants)}</td>
                <td className="adp-stock">{getTotalStock(product.variants)}</td>
                {bsMode && <td className="adp-sold"><strong>{product.totalSold?.toLocaleString("vi-VN") || "—"}</strong></td>}
                <td className="adp-variant-count">
                  {(() => {
                    const active = product.variants?.filter((v) => !v.isDeleted) || [];
                    if (!active.length) return "0 classify";
                    return `${active.length} classify - ${active.map((v) => `#${v.id}`).join(", ")}`;
                  })()}
                </td>
                {!bsMode && (
                  <td>
                    <div className="adp-actions">
                      {product.status === "DELETED" ? (
                        <button className="adp-btn-edit"
                          onClick={() => navigate(`/admin/products/${product.id}?mode=view`)}
                          title="Xem chi tiết" style={{ opacity: 0.7 }}>
                          <Eye size={16} />
                        </button>
                      ) : (
                        <button className="adp-btn-edit"
                          onClick={() => navigate(`/admin/products/${product.id}?mode=edit`)}
                          title="Chỉnh sửa">
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr><td colSpan={bsMode ? 9 : 10} className="adp-empty-row">
                {bsMode ? "No data available for best sellers. Choose a time range to view." : "No products found."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!bsMode && totalPages > 1 && (
        <div className="adp-pagination">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;