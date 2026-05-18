import React, { useState, useEffect, useCallback } from "react";
import { Edit2, Trash2, Plus, X, Search, Eye, TrendingUp, Trophy } from "lucide-react";
import axios from "axios";
import "./AdminProducts.css";

const BASE = "http://localhost:8080/api/v1/admin";
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  ACTIVE: { label: "Đang bán", color: "#16a34a", bg: "#dcfce7" },
  DRAFT: { label: "Nháp", color: "#ca8a04", bg: "#fef9c3" },
  ARCHIVED: { label: "Lưu trữ", color: "#6b7280", bg: "#f3f4f6" },
  DELETED: { label: "Đã xóa", color: "#dc2626", bg: "#fee2e2" },
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
  { label: "Tuần này", getValue: () => { const now = new Date(); const day = now.getDay() || 7; const mon = new Date(now); mon.setDate(now.getDate() - day + 1); return { dateFrom: mon.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) }; } },
  { label: "Tháng này", getValue: () => { const now = new Date(); return { dateFrom: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, dateTo: now.toISOString().slice(0, 10) }; } },
  { label: "30 ngày", getValue: () => { const now = new Date(); const from = new Date(now); from.setDate(now.getDate() - 30); return { dateFrom: from.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) }; } },
  { label: "90 ngày", getValue: () => { const now = new Date(); const from = new Date(now); from.setDate(now.getDate() - 90); return { dateFrom: from.toISOString().slice(0, 10), dateTo: now.toISOString().slice(0, 10) }; } },
];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: "add", product: null });
  const [saving, setSaving] = useState(false);
  const [initialForm, setInitialForm] = useState(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

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

  // ── Modal search ─────────────────────────────────────────────
  const [modalBrandSearch, setModalBrandSearch] = useState("");
  const [modalCatSearch, setModalCatSearch] = useState("");

  // ── Form ─────────────────────────────────────────────────────
  const emptyForm = {
    name: "", description: "", brandId: "", slug: "", status: "DRAFT",
    option1Name: "", option2Name: "", option3Name: "",
    images: [],
    variants: [{ option1Value: "", option2Value: "", option3Value: "", price: "", stock: "", sku: "" }],
    categoryIds: [],
  };
  const [form, setForm] = useState(emptyForm);

  // ── Fetch products (API filter) ───────────────────────────────
  const fetchProducts = useCallback(async (currentPage = page) => {
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

      const res = await axios.get(`${BASE}/products/filter?${params}`, { headers: authHeader() });
      setProducts(res.data.products || res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      console.log("Fetched products with filters:", res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterName, filterProductId, filterVariantId, filterSku, filterBrand, filterCategory, filterPriceMin, filterPriceMax, filterStockMin, filterStockMax, filterStatus]);

  const fetchBrands = async () => { const r = await axios.get(`http://localhost:8080/api/v1/brands`); setBrands(r.data); };
  const fetchCategories = async () => { const r = await axios.get(`http://localhost:8080/api/v1/categories`); setCategories(r.data); };

  useEffect(() => { fetchBrands(); fetchCategories(); }, []);

  useEffect(() => {
    if (!bsMode) fetchProducts(page);
  }, [page, filterName, filterProductId, filterVariantId, filterSku, filterBrand, filterCategory,
    filterPriceMin, filterPriceMax, filterStockMin, filterStockMax, filterStatus, bsMode]);

  // ── Best sellers fetch ────────────────────────────────────────
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
      console.log("Fetched best sellers:", res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBsLoading(false);
    }
  }, []);

  const handlePresetClick = (preset) => {
    const { dateFrom, dateTo } = preset.getValue();
    setBsPreset(preset.label);
    setBsDateFrom(dateFrom);
    setBsDateTo(dateTo);
    setBsMode(true);
    fetchBestSellers(dateFrom, dateTo, bsLimit);
  };

  const handleBsCustomApply = () => {
    if (!bsDateFrom || !bsDateTo) return;
    setBsPreset(null);
    setBsMode(true);
    fetchBestSellers(bsDateFrom, bsDateTo, bsLimit);
  };

  const handleBsLimitChange = (newLimit) => {
    setBsLimit(newLimit);
    if (bsMode && bsDateFrom && bsDateTo) {
      fetchBestSellers(bsDateFrom, bsDateTo, newLimit);
    }
  };

  const clearBsMode = () => {
    setBsMode(false);
    setBsPreset(null);
    setBsDateFrom("");
    setBsDateTo("");
    setBsLimit(10);
    setBestSellers([]);
  };

  // ── Reset filters ─────────────────────────────────────────────
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

  // ── Toggle helpers ────────────────────────────────────────────
  const toggleFilter = (value, list, setList) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    setPage(0);
  };

  // ── Modal helpers ─────────────────────────────────────────────
  const openAdd = () => { setForm(emptyForm); setModalBrandSearch(""); setModalCatSearch(""); setModal({ open: true, mode: "add", product: null }); };

  const openView = (product) => {
    setForm({
      name: product.name || "", description: product.description || "",
      brandId: brands.find((b) => b.name === product.brand)?.id || "",
      status: product.status || "DELETED",
      option1Name: product.option1Name || "", option2Name: product.option2Name || "", option3Name: product.option3Name || "",
      images: product.images?.map((img) => ({ id: img.id, imageUrl: img.imageUrl, position: img.position })) || [],
      variants: product.variants?.map((v) => ({ id: v.id, option1Value: v.option1Value || "", option2Value: v.option2Value || "", option3Value: v.option3Value || "", price: v.price || "", stock: v.stock || "", sku: v.sku || "", isDeleted: v.isDeleted || false })) || [],
      categoryIds: product.categories?.map((c) => c.id) || [],
    });
    setModalBrandSearch(""); setModalCatSearch("");
    setModal({ open: true, mode: "view", product });
  };

  const openEdit = (product) => {
    const f = {
      name: product.name || "",
      description: product.description || "",
      brandId: brands.find((b) => b.name === product.brand)?.id || "",
      status: product.status || "DRAFT",
      option1Name: product.option1Name || "",
      option2Name: product.option2Name || "",
      option3Name: product.option3Name || "",
      images: product.images?.map((img) => ({ id: img.id, imageUrl: img.imageUrl, position: img.position })) || [],
      variants: product.variants?.map((v) => ({ id: v.id, option1Value: v.option1Value || "", option2Value: v.option2Value || "", option3Value: v.option3Value || "", price: v.price || "", stock: v.stock ?? "", sku: v.sku || "", isDeleted: v.isDeleted || false })) || [{ option1Value: "", option2Value: "", option3Value: "", price: "", stock: "", sku: "" }],
      categoryIds: product.categories?.map((c) => c.id) || [],
    };
    setForm(f);
    setInitialForm(JSON.stringify(f));
    setModalBrandSearch("");
    setModalCatSearch("");
    setModal({ open: true, mode: "edit", product });
  };
  const hasUnsavedChanges = () => {
    if (modal.mode !== "edit" || !initialForm) return false;
    return JSON.stringify(form) !== initialForm;
  };

  const handleOverlayClick = () => {
    if (hasUnsavedChanges()) {
      setShowEditConfirm(true);
    } else {
      closeModal();
    }
  };

  const handleCloseBtn = () => {
    if (hasUnsavedChanges()) {
      setShowEditConfirm(true);
    } else {
      closeModal();
    }
  };

  const closeModal = () => { setModal({ open: false, mode: "add", product: null }); setModalBrandSearch(""); setModalCatSearch(""); };

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.brandId) { alert("Vui lòng điền tên sản phẩm và chọn thương hiệu!"); return; }
    const optionChecks = [
      { nameField: "option1Name", valueField: "option1Value", label: "Option 1" },
      { nameField: "option2Name", valueField: "option2Value", label: "Option 2" },
      { nameField: "option3Name", valueField: "option3Value", label: "Option 3" },
    ];

    for (const { nameField, valueField, label } of optionChecks) {
      const hasValue = form.variants.some(
        (v) => !v.isDeleted && v[valueField] && v[valueField].trim() !== ""
      );
      if (hasValue && !form[nameField]?.trim()) {
        alert(`Bạn đã nhập giá trị cho ${label} nhưng chưa đặt tên cho option này!\nVui lòng điền tên ${label} (VD: "Màu sắc", "Size", "Loại") trước khi lưu.`);
        return;
      }
    }
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const res = await axios.post(`${BASE}/products`, {
          name: form.name, slug: form.slug || undefined, description: form.description, brandId: Number(form.brandId),
          option1Name: form.option1Name || null, option2Name: form.option2Name || null, option3Name: form.option3Name || null, status: form.status,
        }, { headers: authHeader() });
        const productId = res.data.id;
        if (form.status && form.status !== "DRAFT") await axios.patch(`${BASE}/products/${productId}/status?status=${form.status}`, {}, { headers: authHeader() });
        for (const v of form.variants) { if (v.option1Value && v.price) await axios.post(`${BASE}/products/variants`, { productId, option1Value: v.option1Value, option2Value: v.option2Value || "", option3Value: v.option3Value || "", price: Number(v.price), stock: Number(v.stock) || 0, sku: v.sku || "" }, { headers: authHeader() }); }
        for (const img of form.images) { if (img.imageUrl) await axios.post(`http://localhost:8080/api/v1/products/images`, { productId, imageUrl: img.imageUrl, position: img.position || 1 }, { headers: authHeader() }); }
        for (const catId of form.categoryIds) await axios.post(`${BASE}/products/${productId}/categories/${catId}`, {}, { headers: authHeader() });
      } else {
        const productId = modal.product.id;
        await axios.put(`${BASE}/products/${productId}`, { name: form.name, description: form.description, brandId: Number(form.brandId), option1Name: form.option1Name || null, option2Name: form.option2Name || null, option3Name: form.option3Name || null }, { headers: authHeader() });
        if (form.status !== (modal.product.status || "DRAFT")) await axios.patch(`${BASE}/products/${productId}/status?status=${form.status}`, {}, { headers: authHeader() });
        const activeFormVariants = form.variants.filter((v) => !v.isDeleted);
        const oldActiveVariantIds = modal.product.variants?.filter((v) => !v.isDeleted).map((v) => v.id) || [];
        const newVariantIds = activeFormVariants.filter((v) => v.id).map((v) => v.id);
        for (const oldId of oldActiveVariantIds) { if (!newVariantIds.includes(oldId)) await axios.delete(`${BASE}/products/variants/${oldId}`, { headers: authHeader() }); }
        for (const v of activeFormVariants) {
          const payload = { productId, option1Value: v.option1Value, option2Value: v.option2Value || "", option3Value: v.option3Value || "", price: Number(v.price), stock: Number(v.stock) || 0, sku: v.sku || "" };
          if (v.id) await axios.put(`${BASE}/products/variants/${v.id}`, payload, { headers: authHeader() });
          else if (v.option1Value && v.price) await axios.post(`${BASE}/products/variants`, payload, { headers: authHeader() });
        }
        const oldImageIds = modal.product.images?.map((i) => i.id) || [];
        const newImageIds = form.images.filter((i) => i.id).map((i) => i.id);
        for (const oldId of oldImageIds) { if (!newImageIds.includes(oldId)) await axios.delete(`http://localhost:8080/api/v1/products/images/${oldId}`, { headers: authHeader() }); }
        for (const img of form.images) { if (!img.id && img.imageUrl) await axios.post(`http://localhost:8080/api/v1/products/images`, { productId, imageUrl: img.imageUrl, position: img.position || 1 }, { headers: authHeader() }); }
        const oldCatIds = modal.product.categories?.map((c) => c.id) || [];
        for (const oldId of oldCatIds) { if (!form.categoryIds.includes(oldId)) await axios.delete(`${BASE}/products/${productId}/categories/${oldId}`, { headers: authHeader() }); }
        for (const catId of form.categoryIds) { if (!oldCatIds.includes(catId)) await axios.post(`${BASE}/products/${productId}/categories/${catId}`, {}, { headers: authHeader() }); }
      }
      await fetchProducts(0);
      setPage(0);
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại! " + (err.response?.data?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try { await axios.delete(`${BASE}/products/${id}`, { headers: authHeader() }); await fetchProducts(page); }
    catch { alert("Xóa thất bại!"); }
  };

  // ── Variant handlers ──────────────────────────────────────────
  const addVariant = () => setForm({ ...form, variants: [...form.variants, { option1Value: "", option2Value: "", option3Value: "", price: "", stock: "", sku: "", isDeleted: false }] });

  const removeVariant = async (idx) => {
    const v = form.variants[idx];
    if (v.id) {
      if (!window.confirm("Xóa variant này?")) return;
      try {
        await axios.delete(`${BASE}/products/variants/${v.id}`, { headers: authHeader() });
        const res = await axios.get(`${BASE}/products/filter?page=0`, { headers: authHeader() });
        const updatedProducts = res.data.products || res.data.content || [];
        setProducts(updatedProducts);
        const updatedProduct = updatedProducts.find((p) => p.id === modal.product.id);
        if (updatedProduct) openEdit(updatedProduct);
      } catch { alert("Xóa variant thất bại!"); }
    } else {
      setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) });
    }
  };

  const updateVariant = (idx, field, value) => { const u = [...form.variants]; u[idx] = { ...u[idx], [field]: value }; setForm({ ...form, variants: u }); };
  const addImage = () => setForm({ ...form, images: [...form.images, { imageUrl: "", position: form.images.length + 1 }] });
  const removeImage = (idx) => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  const updateImage = (idx, value) => { const u = [...form.images]; u[idx] = { ...u[idx], imageUrl: value }; setForm({ ...form, images: u }); };
  const toggleCategory = (catId) => setForm({ ...form, categoryIds: form.categoryIds.includes(catId) ? form.categoryIds.filter((id) => id !== catId) : [...form.categoryIds, catId] });

  // ── Display helpers ───────────────────────────────────────────
  const getMinPrice = (variants) => {
    if (!variants?.length) return "—";
    const prices = variants.filter((v) => !v.isDeleted).map((v) => Number(v.price)).filter(Boolean);
    if (!prices.length) return "—";
    const min = Math.min(...prices), max = Math.max(...prices);
    return min === max ? `${min.toLocaleString("vi-VN")} ₫` : `${min.toLocaleString("vi-VN")} – ${max.toLocaleString("vi-VN")} ₫`;
  };
  const getTotalStock = (variants) => variants?.filter((v) => !v.isDeleted).reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;

  const filteredModalBrands = brands.filter((b) => b.name.toLowerCase().includes(modalBrandSearch.toLowerCase()));
  const filteredModalCats = categories.filter((c) => c.name.toLowerCase().includes(modalCatSearch.toLowerCase()));
  const isViewOnly = modal.mode === "view";

  // ── Render data source ────────────────────────────────────────
  const displayProducts = bsMode ? bestSellers : products;
  const displayLoading = bsMode ? bsLoading : loading;

  return (
    <div className="adp-page">
      {/* HEADER */}
      <div className="adp-header">
        <div>
          <h2 className="adp-title">Quản lý Sản phẩm</h2>
          <p className="adp-subtitle">Quản lý toàn bộ sản phẩm trong hệ thống</p>
        </div>
        <button className="adp-btn-add" onClick={openAdd}>
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="adp-filter-wrap">
        <div className="adp-filter-bar">
          {/* Row 1: text filters */}
          <div className="adp-filter-field">
            <label className="adp-filter-label">Tên sản phẩm</label>
            <div className="adp-filter-input-wrap">
              <Search size={14} className="adp-filter-icon" />
              <input className="adp-filter-input" placeholder="Tìm tên..." value={filterName} onChange={(e) => { setFilterName(e.target.value); setPage(0); }} />
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">ID sản phẩm</label>
            <input className="adp-filter-input" placeholder="VD: 12" value={filterProductId} onChange={(e) => { setFilterProductId(e.target.value); setPage(0); }} />
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">ID biến thể</label>
            <input className="adp-filter-input" placeholder="VD: 5" value={filterVariantId} onChange={(e) => { setFilterVariantId(e.target.value); setPage(0); }} />
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">SKU</label>
            <input className="adp-filter-input" placeholder="VD: NK-001" value={filterSku} onChange={(e) => { setFilterSku(e.target.value); setPage(0); }} />
          </div>
          <div className="adp-filter-field">
            <label className="adp-filter-label">Thương hiệu</label>
            <select className="adp-filter-input" value="" onChange={(e) => { if (e.target.value) toggleFilter(Number(e.target.value), filterBrand, setFilterBrand); }}>
              <option value="">+ Thêm thương hiệu</option>
              {brands.filter((b) => !filterBrand.includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <div className="adp-filter-tags">
              {filterBrand.map((id) => { const b = brands.find((x) => x.id === id); return b ? <span key={id} className="adp-filter-tag">{b.name}<button onClick={() => toggleFilter(id, filterBrand, setFilterBrand)}>✕</button></span> : null; })}
            </div>
          </div>
          <div className="adp-filter-field">
            <label className="adp-filter-label">Danh mục</label>
            <select className="adp-filter-input" value="" onChange={(e) => { if (e.target.value) toggleFilter(Number(e.target.value), filterCategory, setFilterCategory); }}>
              <option value="">+ Thêm danh mục</option>
              {categories.filter((c) => !filterCategory.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="adp-filter-tags">
              {filterCategory.map((id) => { const c = categories.find((x) => x.id === id); return c ? <span key={id} className="adp-filter-tag">{c.name}<button onClick={() => toggleFilter(id, filterCategory, setFilterCategory)}>✕</button></span> : null; })}
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">Trạng thái</label>
            <select className="adp-filter-input" value="" onChange={(e) => { if (e.target.value) toggleFilter(e.target.value, filterStatus, setFilterStatus); }}>
              <option value="">+ Trạng thái</option>
              {["ACTIVE", "DRAFT", "ARCHIVED", "DELETED"].filter((s) => !filterStatus.includes(s)).map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
            </select>
            <div className="adp-filter-tags">
              {filterStatus.map((s) => <span key={s} className="adp-filter-tag">{STATUS_CONFIG[s]?.label}<button onClick={() => toggleFilter(s, filterStatus, setFilterStatus)}>✕</button></span>)}
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--range">
            <label className="adp-filter-label">Khoảng giá (₫)</label>
            <div className="adp-filter-range">
              <input className="adp-filter-input" type="number" placeholder="Từ" value={filterPriceMin} onChange={(e) => { setFilterPriceMin(e.target.value); setPage(0); }} />
              <span className="adp-filter-range-sep">—</span>
              <input className="adp-filter-input" type="number" placeholder="Đến" value={filterPriceMax} onChange={(e) => { setFilterPriceMax(e.target.value); setPage(0); }} />
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--range">
            <label className="adp-filter-label">Tồn kho</label>
            <div className="adp-filter-range">
              <input className="adp-filter-input" type="number" placeholder="Từ" value={filterStockMin} onChange={(e) => { setFilterStockMin(e.target.value); setPage(0); }} />
              <span className="adp-filter-range-sep">—</span>
              <input className="adp-filter-input" type="number" placeholder="Đến" value={filterStockMax} onChange={(e) => { setFilterStockMax(e.target.value); setPage(0); }} />
            </div>
          </div>
        </div>

        {/* ── Best Sellers section ── */}
        <div className="adp-bs-section">
          <div className="adp-bs-header">
            <span className="adp-filter-label">Bán chạy nhất</span>
            {bsMode && (
              <button className="adp-bs-clear" onClick={clearBsMode}>
                <X size={13} /> Tắt filter
              </button>
            )}
          </div>
          <div className="adp-bs-controls">
            {/* Presets */}
            <div className="adp-bs-presets">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={`adp-bs-preset-btn ${bsPreset === p.label ? "adp-bs-preset-btn--active" : ""}`}
                  onClick={() => handlePresetClick(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom date */}
            <div className="adp-bs-custom">
              <input type="date" className="adp-filter-input adp-filter-date" value={bsDateFrom} onChange={(e) => { setBsDateFrom(e.target.value); setBsPreset(null); }} />
              <span className="adp-filter-range-sep">→</span>
              <input type="date" className="adp-filter-input adp-filter-date" value={bsDateTo} min={bsDateFrom} onChange={(e) => { setBsDateTo(e.target.value); setBsPreset(null); }} />
              <button className="adp-bs-apply-btn" onClick={handleBsCustomApply} disabled={!bsDateFrom || !bsDateTo}>
                Áp dụng
              </button>
            </div>

            {/* Top N */}
            <div className="adp-bs-limit">
              <span className="adp-bs-limit-label">Top</span>
              {[10, 20, 30].map((n) => (
                <button
                  key={n}
                  className={`adp-bs-limit-btn ${bsLimit === n ? "adp-bs-limit-btn--active" : ""}`}
                  onClick={() => handleBsLimitChange(n)}
                >
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
                  Top <strong>{bestSellers.length}</strong> sản phẩm bán chạy nhất
                  {bsDateFrom && bsDateTo && ` (${bsDateFrom} → ${bsDateTo})`}
                </span>
              ) : (
                <span className="adp-filter-result">
                  Tìm thấy <strong>{products.length}</strong> sản phẩm
                </span>
              )}
              {hasActiveFilter && (
                <button className="adp-filter-reset" onClick={resetFilters}>
                  <X size={13} /> Xoá bộ lọc
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
              <th>Ảnh</th><th>ID</th><th>Tên sản phẩm</th>
              <th>Thương hiệu</th><th>Danh mục</th><th>Trạng thái</th>
              <th>Giá</th><th>Tồn kho</th>
              {bsMode && <th>Đã bán</th>}
              <th>Variants</th>
              {!bsMode && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {displayLoading ? (
              <tr><td colSpan={bsMode ? 10 : 10} className="adp-empty-row">Đang tải...</td></tr>
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
                    if (!active.length) return "0 phân loại";
                    return `${active.length} phân loại - ${active.map((v) => `#${v.id}`).join(", ")}`;
                  })()}
                </td>                {!bsMode && (
                  <td>
                    <div className="adp-actions">
                      {product.status === "DELETED" ? (
                        <button className="adp-btn-edit" onClick={() => openView(product)} title="Xem chi tiết" style={{ opacity: 0.7 }}><Eye size={16} /></button>
                      ) : (
                        <>
                          <button className="adp-btn-edit" onClick={() => openEdit(product)}><Edit2 size={16} /></button>
                          <button className="adp-btn-delete" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr><td colSpan={bsMode ? 9 : 10} className="adp-empty-row">
                {bsMode ? "Chưa có dữ liệu bán chạy. Chọn khoảng thời gian để xem." : "Không tìm thấy sản phẩm."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION - chỉ hiện ở mode thường */}
      {!bsMode && totalPages > 1 && (
        <div className="adp-pagination">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {/* MODAL */}
      {modal.open && (
        <div className="adp-overlay" onClick={handleOverlayClick}>
          <div className="adp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adp-modal-header">
              <h3 className="adp-modal-title">
                {modal.mode === "add" && "Thêm sản phẩm mới"}
                {modal.mode === "edit" && "Chỉnh sửa sản phẩm"}
                {modal.mode === "view" && "Chi tiết sản phẩm"}
              </h3>
              <button className="adp-modal-close" onClick={closeModal}><X size={22} /></button>
            </div>

            <div className="adp-form-row">
              <label className="adp-form-label">Tên sản phẩm *</label>
              <input className="adp-form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tên sản phẩm" disabled={isViewOnly} />
            </div>
            <div className="adp-form-row">
              <label className="adp-form-label">Mô tả</label>
              <textarea className="adp-form-input adp-form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả sản phẩm" disabled={isViewOnly} />
            </div>
            <div className="adp-form-row">
              <label className="adp-form-label">Slug</label>
              <input
                className="adp-form-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="VD: ao-thun-nike (để trống tự generate)"
                disabled={isViewOnly}
              />
            </div>
            {!isViewOnly ? (
              <div className="adp-form-row">
                <label className="adp-form-label">Trạng thái sản phẩm</label>
                <select className="adp-form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="DRAFT">Nháp</option>
                  <option value="ACTIVE">Đang bán</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              </div>
            ) : (
              <div className="adp-form-row">
                <label className="adp-form-label">Trạng thái sản phẩm</label>
                <StatusBadge status={form.status} />
              </div>
            )}

            <div className="adp-form-grid-2">
              <div className="adp-form-row">
                <label className="adp-form-label">Thương hiệu *</label>
                <div className="adp-modal-search-wrap">
                  <Search size={13} className="adp-modal-search-icon" />
                  <input className="adp-modal-search-input" placeholder="Tìm thương hiệu..." value={modalBrandSearch} onChange={(e) => setModalBrandSearch(e.target.value)} disabled={isViewOnly} />
                </div>
                <select className="adp-form-input adp-modal-select" size={5} value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} disabled={isViewOnly}>
                  {filteredModalBrands.length === 0 ? <option disabled>Không tìm thấy</option> : filteredModalBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {form.brandId && <p className="adp-modal-selected-hint">Đã chọn: <strong>{brands.find((b) => String(b.id) === String(form.brandId))?.name}</strong></p>}
              </div>
              <div className="adp-form-row">
                <label className="adp-form-label">Danh mục {form.categoryIds.length > 0 && <span className="adp-cat-count">({form.categoryIds.length} đã chọn)</span>}</label>
                <div className="adp-modal-search-wrap">
                  <Search size={13} className="adp-modal-search-icon" />
                  <input className="adp-modal-search-input" placeholder="Tìm danh mục..." value={modalCatSearch} onChange={(e) => setModalCatSearch(e.target.value)} disabled={isViewOnly} />
                </div>
                <div className="adp-cat-picker">
                  {filteredModalCats.length === 0 ? <span className="adp-cat-empty">Không tìm thấy</span> : filteredModalCats.map((c) => (
                    <span key={c.id} onClick={() => !isViewOnly && toggleCategory(c.id)} className={`adp-cat-chip ${form.categoryIds.includes(c.id) ? "adp-cat-chip--active" : ""}`} style={isViewOnly ? { pointerEvents: "none", opacity: 0.6 } : {}}>{c.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="adp-form-grid-3">
              {["option1Name", "option2Name", "option3Name"].map((field, idx) => (
                <div key={field} className="adp-form-row">
                  <label className="adp-form-label">Tên option {idx + 1}</label>
                  <input className="adp-form-input" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder="VD: Màu sắc" disabled={isViewOnly} />
                </div>
              ))}
            </div>

            <hr className="adp-divider" />

            <div className="adp-section-header">
              <h4 className="adp-section-title">Hình ảnh ({form.images.length})</h4>
              {!isViewOnly && <button className="adp-btn-add-sm" onClick={addImage}><Plus size={14} /> Thêm ảnh</button>}
            </div>
            {form.images.map((img, idx) => (
              <div key={idx} className="adp-image-row">
                <input className="adp-form-input" value={img.imageUrl} onChange={(e) => updateImage(idx, e.target.value)} placeholder="URL hình ảnh" disabled={isViewOnly} />
                <span className="adp-image-pos">Vị trí: {img.position}</span>
                {img.imageUrl && <img src={img.imageUrl} alt="" className="adp-image-preview" />}
                {!isViewOnly && <button className="adp-btn-remove" onClick={() => removeImage(idx)}><X size={16} /></button>}
              </div>
            ))}

            <hr className="adp-divider" />

            <div className="adp-section-header">
              <h4 className="adp-section-title">Variants ({form.variants.length})</h4>
              {!isViewOnly && <button className="adp-btn-add-sm" onClick={addVariant}><Plus size={14} /> Thêm variant</button>}
            </div>
            {form.variants.map((v, idx) => (
              <div key={idx} className="adp-variant-card">
                {v.id && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>
                    Variant ID: <span style={{ color: "#2563eb" }}>#{v.id}</span>
                  </div>
                )}
                <div className="adp-form-grid-3">
                  {["option1Value", "option2Value", "option3Value"].map((field, i) => (
                    <div key={field} className="adp-form-row">
                      <label className="adp-form-label">{[form.option1Name, form.option2Name, form.option3Name][i] || `Option ${i + 1}`}</label>
                      <input className="adp-form-input" value={v[field]} onChange={(e) => updateVariant(idx, field, e.target.value)} disabled={isViewOnly} />
                    </div>
                  ))}
                </div>
                <div className="adp-form-grid-3">
                  <div className="adp-form-row"><label className="adp-form-label">Giá *</label><input className="adp-form-input" type="number" value={v.price} onChange={(e) => updateVariant(idx, "price", e.target.value)} placeholder="VD: 500000" disabled={isViewOnly} /></div>
                  <div className="adp-form-row"><label className="adp-form-label">Tồn kho</label><input className="adp-form-input" type="number" value={v.stock} onChange={(e) => updateVariant(idx, "stock", e.target.value)} placeholder="VD: 10" disabled={isViewOnly} /></div>
                  <div className="adp-form-row"><label className="adp-form-label">SKU</label><input className="adp-form-input" value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} placeholder="VD: NK-AIR-RED-40" disabled={isViewOnly} /></div>
                </div>
                {!isViewOnly && form.variants.length > 1 && <button className="adp-btn-remove-variant" onClick={() => removeVariant(idx)}>Xóa variant này</button>}
              </div>
            ))}
            {!isViewOnly && <button className="adp-btn-add-sm" onClick={addVariant}><Plus size={14} /> Thêm variant</button>}

            <div className="adp-modal-footer">
              <button className="adp-btn-cancel" onClick={closeModal}>{isViewOnly ? "Đóng" : "Huỷ"}</button>
              {!isViewOnly && <button className="adp-btn-save" onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu sản phẩm"}</button>}
            </div>
          </div>
        </div>
      )}
      {showEditConfirm && (
        <div className="adp-confirm-overlay" onClick={() => setShowEditConfirm(false)}>
          <div className="adp-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="adp-confirm-title">Bạn có thay đổi chưa lưu</h3>
            <p className="adp-confirm-desc">Lưu lại trước khi thoát hay bỏ qua?</p>
            <div className="adp-confirm-actions">
              <button
                className="adp-confirm-btn-discard"
                onClick={() => {
                  setShowEditConfirm(false);
                  closeModal();
                }}
              >
                Bỏ thay đổi
              </button>
              <button
                className="adp-confirm-btn-save"
                onClick={() => {
                  setShowEditConfirm(false);
                  handleSave();
                }}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;