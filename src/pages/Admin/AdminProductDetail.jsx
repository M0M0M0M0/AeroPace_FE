import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Plus, X, Search, ArrowLeft, MessageSquare, Edit2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import "./AdminProductDetail.css";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin`;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

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
      display: "inline-block", padding: "3px 12px", borderRadius: 99,
      fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
};

const emptyForm = {
  name: "", description: "", brandId: "", slug: "", status: "DRAFT",
  option1Name: "", option2Name: "", option3Name: "",
  images: [],
  variants: [{ option1Value: "", option2Value: "", option3Value: "", price: "", stock: "", sku: "" }],
  categoryIds: [],
};

const AdminProductDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/admin/products");
  };

  const urlMode = id === "new" ? "add" : (searchParams.get("mode") || "edit");
  const [currentMode, setCurrentMode] = useState(urlMode);
  const isViewOnly = currentMode === "view";

  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(null);

  const savedStatus = initialForm ? JSON.parse(initialForm).status : null;
  const canSelectDeleted = savedStatus === "ARCHIVED" || savedStatus === "DELETED";
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(urlMode !== "add");

  const [brandSearch, setBrandSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveToView, setLeaveToView] = useState(false);
  const [deleteVariantIdx, setDeleteVariantIdx] = useState(null);


  const [optionPool, setOptionPool] = useState({ 1: [], 2: [], 3: [] });

  const [addValueModal, setAddValueModal] = useState(null); // { axis: 1|2|3, variantIdx, field }
  const [addValueInput, setAddValueInput] = useState("");

  const confirmAddValue = () => {
    if (!addValueModal) return;
    const val = addValueInput.trim();
    if (!val) return;
    const { axis, variantIdx, field } = addValueModal;
    setOptionPool((prev) => ({
      ...prev,
      [axis]: prev[axis].includes(val) ? prev[axis] : [...prev[axis], val],
    }));
    updateVariant(variantIdx, field, val);
    setAddValueModal(null);
    setAddValueInput("");
  };

  // ── Load brands & categories ──────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      const [br, ca] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/brands`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/categories`),
      ]);
      setBrands(br.data);
      setCategories(ca.data);

    };
    fetchMeta();
  }, []);

  // ── Load product if edit/view ─────────────────────────────────
  useEffect(() => {
    if (urlMode === "add") return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ productId: id, page: 0 });
        if (urlMode === "view") {
          ["ACTIVE", "DRAFT", "ARCHIVED", "DELETED"].forEach((s) => params.append("statuses", s));
        }
        const res = await axios.get(`${BASE}/products/filter?${params}`, { headers: authHeader() });
        const products = res.data.products || res.data.content || [];
        const product = products.find((p) => String(p.id) === String(id));
        if (!product) { alert("Không tìm thấy sản phẩm."); navigate("/admin/products"); return; }

        const brRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/brands`);
        const allBrands = brRes.data;

        const f = {
          name: product.name || "",
          description: product.description || "",
          brandId: allBrands.find((b) => b.name === product.brand)?.id || "",
          slug: product.slug || "",
          status: product.status || "DRAFT",
          option1Name: product.option1Name || "",
          option2Name: product.option2Name || "",
          option3Name: product.option3Name || "",
          images: product.images?.map((img) => ({ id: img.id, imageUrl: img.imageUrl, position: img.position })) || [],
          variants: product.variants?.map((v) => ({
            id: v.id, option1Value: v.option1Value || "", option2Value: v.option2Value || "",
            option3Value: v.option3Value || "", price: v.price || "", stock: v.stock ?? "",
            sku: v.sku || "", isDeleted: v.isDeleted || false,
          })) || [{ option1Value: "", option2Value: "", option3Value: "", price: "", stock: "", sku: "" }],
          categoryIds: product.categories?.map((c) => c.id) || [],
        };
        setForm(f);
        setInitialForm(JSON.stringify(f));
        const activeVars = (product.variants || []).filter((v) => !v.isDeleted);
        setOptionPool({
          1: [...new Set(activeVars.map((v) => v.option1Value).filter(Boolean))],
          2: [...new Set(activeVars.map((v) => v.option2Value).filter(Boolean))],
          3: [...new Set(activeVars.map((v) => v.option3Value).filter(Boolean))],
        });
      } catch (err) {
        console.error(err);
        alert("Không thể tải sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]); 

  // ── Unsaved changes check ─────────────────────────────────────
  const hasUnsavedChanges = () => {
    if (currentMode !== "edit" || !initialForm) return false;
    return JSON.stringify(form) !== initialForm;
  };

  const handleEnterEdit = () => setCurrentMode("edit");

  const handleCancelEdit = () => {
    if (hasUnsavedChanges()) {
      setLeaveToView(true);
      setShowLeaveConfirm(true);
    } else {
      setForm(JSON.parse(initialForm));
      setCurrentMode("view");
    }
  };

  const handleBack = () => {
    if (currentMode === "edit" && urlMode === "view") {
      handleCancelEdit();
    } else if (hasUnsavedChanges()) {
      setShowLeaveConfirm(true);
    } else {
      goBack();
    }
  };

  // ── Variant / image helpers ───────────────────────────────────
  const addVariant = () => setForm({ ...form, variants: [...form.variants, { option1Value: "", option2Value: "", option3Value: "", price: "", stock: "", sku: "", isDeleted: false }] });
  const updateVariant = (idx, field, value) => { const u = [...form.variants]; u[idx] = { ...u[idx], [field]: value }; setForm({ ...form, variants: u }); };
  const removeVariant = (idx) => {
    const v = form.variants[idx];
    if (v.id) {
      setDeleteVariantIdx(idx);
    } else {
      setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) });
    }
  };

  const confirmDeleteVariant = () => {
    const updated = [...form.variants];
    updated[deleteVariantIdx] = { ...updated[deleteVariantIdx], isDeleted: true };
    setForm({ ...form, variants: updated });
    setDeleteVariantIdx(null);
  };

  const [dragImageIdx, setDragImageIdx] = useState(null);

  const addImage = () => setForm({ ...form, images: [...form.images, { imageUrl: "", position: form.images.length + 1 }] });
  const removeImage = (idx) => {
    const filtered = form.images.filter((_, i) => i !== idx);
    setForm({ ...form, images: filtered.map((img, i) => ({ ...img, position: i + 1 })) });
  };
  const updateImage = (idx, value) => { const u = [...form.images]; u[idx] = { ...u[idx], imageUrl: value }; setForm({ ...form, images: u }); };
  const moveImage = (fromIdx, toIdx) => {
    const imgs = [...form.images];
    const [moved] = imgs.splice(fromIdx, 1);
    imgs.splice(toIdx, 0, moved);
    setForm({ ...form, images: imgs.map((img, i) => ({ ...img, position: i + 1 })) });
  };

  const toggleCategory = (catId) => setForm({
    ...form,
    categoryIds: form.categoryIds.includes(catId)
      ? form.categoryIds.filter((id) => id !== catId)
      : [...form.categoryIds, catId],
  });

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.brandId) { alert("Please fill in the product name and select a brand!"); return; }
    const activeVariants = form.variants.filter((v) => !v.isDeleted);

    const seen = new Set();
    for (const v of activeVariants) {
      const key = `${v.option1Value}|${v.option2Value}|${v.option3Value}`;
      if (seen.has(key)) {
        const label = [v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(" / ") || "Default";
        toast.error(`Duplicate variant: "${label}". Each variant must have a unique option combination.`);
        return;
      }
      seen.add(key);
    }
    const missingFields = activeVariants.some(
      (v) => !v.price || v.stock === "" || v.stock === null || v.stock === undefined
    );
    if (missingFields) {
      toast.error("Please fill in Price and Stock for all variants.");
      return;
    }
    const negativeStock = activeVariants.some((v) => Number(v.stock) < 0);
    if (negativeStock) {
      toast.error("Stock cannot be negative.");
      return;
    }
    const optionNames = [form.option1Name, form.option2Name, form.option3Name];
    for (let i = 0; i < 3; i++) {
      const valueField = `option${i + 1}Value`;
      const hasValue = form.variants.some((v) => !v.isDeleted && v[valueField]?.trim());
      if (hasValue && !optionNames[i]?.trim()) {
        alert(`Option ${i + 1} has values but no name. Please set a name (e.g., "Color", "Size").`);
        return;
      }
    }

    setSaving(true);
    try {
      if (urlMode === "add") {
        const validVariants = form.variants.filter((v) => v.price);
        if (validVariants.length === 0) { alert("Please add at least 1 variant with a valid price!"); return; }
        if (validVariants.some((v) => Number(v.price) < 1)) {
          alert("Product price must be at least $1.00 to be eligible for checkout."); return;
        }

        await axios.post(`${BASE}/products/full-create`, {
          name: form.name, description: form.description, brandId: Number(form.brandId),
          slug: form.slug || undefined,
          option1Name: form.option1Name || null, option2Name: form.option2Name || null, option3Name: form.option3Name || null,
          status: form.status,
          variants: validVariants.map((v) => ({
            id: null, option1Value: v.option1Value || "", option2Value: v.option2Value || "",
            option3Value: v.option3Value || "", price: Number(v.price), stock: Number(v.stock) || 0, sku: v.sku || "",
          })),
          images: form.images.filter((img) => img.imageUrl).map((img, i) => ({
            id: null, imageUrl: img.imageUrl, position: i + 1,
          })),
          categoryIds: form.categoryIds,
        }, { headers: authHeader() });

        navigate("/admin/products");

      } else {
        const invalidPrice = form.variants.filter((v) => !v.isDeleted && Number(v.price) < 1);
        if (invalidPrice.length > 0) { alert("Product price must be at least $1.00 to be eligible for checkout."); return; }

        await axios.put(`${BASE}/products/${id}/full-update`, {
          name: form.name, description: form.description, brandId: Number(form.brandId),
          option1Name: form.option1Name || null, option2Name: form.option2Name || null, option3Name: form.option3Name || null,
          status: form.status,
          variants: form.variants.map((v) => ({
            id: v.id || null, option1Value: v.option1Value || "", option2Value: v.option2Value || "",
            option3Value: v.option3Value || "", price: Number(v.price), stock: Number(v.stock) || 0,
            sku: v.sku || "", isDeleted: v.isDeleted || false,
          })),
          images: form.images.map((img, i) => ({ id: img.id || null, imageUrl: img.imageUrl, position: i + 1 })),
          categoryIds: form.categoryIds,
        }, { headers: authHeader() });

        toast.success("Product saved successfully.");
        setInitialForm(JSON.stringify(form));
        setCurrentMode("view");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save! " + (err.response?.data?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const filteredBrands = brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
  const filteredCats = categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="apd-page">
        <div className="apd-loading">Loading product...</div>
      </div>
    );
  }

  const pageTitle = urlMode === "add" ? "Add New Product" : currentMode === "edit" ? "Edit Product" : "Product Details";

  return (
    <div className="apd-page">
      {/* ── Topbar ─────────────────────────────────────────────── */}
      <div className="apd-topbar">
        <button className="apd-back-btn" onClick={handleBack}>
          <ArrowLeft size={16} /> Return
        </button>
        <div className="apd-topbar-info">
          <h1 className="apd-page-title">{pageTitle}</h1>
          {urlMode !== "add" && <StatusBadge status={form.status} />}
        </div>
        {urlMode !== "add" && (
          <button
            className="apd-reviews-btn"
            onClick={() => navigate(`/admin/products/${id}/reviews`, { state: { fromMode: currentMode } })}
          >
            <MessageSquare size={15} /> Reviews
          </button>
        )}
        {currentMode === "view" ? (
          <button className="apd-cancel-btn" onClick={handleEnterEdit}>
            <Edit2 size={15} style={{ marginRight: 5 }} /> Edit
          </button>
        ) : (
          <div className="apd-topbar-actions">
            <button className="apd-cancel-btn" onClick={urlMode === "view" ? handleCancelEdit : handleBack}>Cancel</button>
            <button className="apd-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        )}
      </div>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <div className="apd-grid">

        {/* LEFT COLUMN */}
        <div className="apd-col-main">

          {/* Thông tin cơ bản */}
          <div className="apd-card">
            <h2 className="apd-card-title">Basic Information</h2>

            <div className="apd-form-row">
              <label className="apd-form-label">Product Name <span className="apd-required">*</span></label>
              <input className="apd-form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Product Name" disabled={isViewOnly} maxLength={200} />
            </div>

            <div className="apd-form-row">
              <label className="apd-form-label">Description</label>
              <textarea className="apd-form-input apd-form-textarea" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Product Description" disabled={isViewOnly} />
            </div>

            {urlMode === "add" && (
              <div className="apd-form-row">
                <label className="apd-form-label">Slug</label>
                <input className="apd-form-input" value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="" disabled={isViewOnly} />
              </div>
            )}

            <div className="apd-form-row">
              <label className="apd-form-label">Status</label>
              {!isViewOnly ? (
                <select className="apd-form-input" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                  {canSelectDeleted && <option value="DELETED">Deleted</option>}
                </select>
              ) : (
                <StatusBadge status={form.status} />
              )}
              {!isViewOnly && !canSelectDeleted && (
                <span className="apd-form-hint">Archive the product before it can be deleted.</span>
              )}
            </div>
          </div>

          {/* Option Names */}
          <div className="apd-card">
            <h2 className="apd-card-title">Option Names</h2>
            <div className="apd-form-grid-3">
              {[
                { field: "option1Name", placeholder: "e.g., Color" },
                { field: "option2Name", placeholder: "e.g., Size" },
                { field: "option3Name", placeholder: "e.g., Material" },
              ].map(({ field, placeholder }, i) => (
                <div key={field} className="apd-form-row">
                  <label className="apd-form-label">Option {i + 1}</label>
                  <input className="apd-form-input" value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={placeholder} disabled={isViewOnly} maxLength={50} />
                </div>
              ))}
            </div>
          </div>

          {/* Hình ảnh */}
          <div className="apd-card">
            <div className="apd-card-header">
              <h2 className="apd-card-title">Images ({form.images.length})</h2>
              {!isViewOnly && (
                <button className="apd-btn-add-sm" onClick={addImage}>
                  <Plus size={14} /> Add Image
                </button>
              )}
            </div>
            {form.images.length === 0 && (
              <p className="apd-empty-hint">No images available.</p>
            )}
            {form.images.map((img, idx) => (
              <div
                key={idx}
                className={`apd-image-row${dragImageIdx === idx ? " apd-image-row--dragging" : ""}`}
                draggable={!isViewOnly}
                onDragStart={() => setDragImageIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); if (dragImageIdx !== null && dragImageIdx !== idx) moveImage(dragImageIdx, idx); setDragImageIdx(null); }}
                onDragEnd={() => setDragImageIdx(null)}
              >
                {!isViewOnly && <span className="apd-image-drag-handle" title="Drag to reorder">⠿</span>}
                <input className="apd-form-input" value={img.imageUrl}
                  onChange={(e) => updateImage(idx, e.target.value)}
                  placeholder="Image URL" disabled={isViewOnly} maxLength={500} />
                <span className="apd-image-pos">#{idx + 1}</span>
                {img.imageUrl && <img src={img.imageUrl} alt="" className="apd-image-preview" />}
                {!isViewOnly && (
                  <button className="apd-btn-remove" onClick={() => removeImage(idx)}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Variants */}
          <div className="apd-card">
            <div className="apd-card-header">
              <h2 className="apd-card-title">Variants ({form.variants.filter((v) => !v.isDeleted).length})</h2>
              {!isViewOnly && (
                <button className="apd-btn-add-sm" onClick={addVariant}>
                  <Plus size={14} /> Add Variant
                </button>
              )}
            </div>

            {form.variants.map((v, idx) => {
              if (v.isDeleted) return null;
              const activeCount = form.variants.filter((x) => !x.isDeleted).length;
              const optionFields = [
                { field: "option1Value", axis: 1, label: form.option1Name || "Option 1" },
                { field: "option2Value", axis: 2, label: form.option2Name || "Option 2" },
                { field: "option3Value", axis: 3, label: form.option3Name || "Option 3" },
              ];
              return (
                <div key={idx} className="apd-variant-card">
                  {v.id && <div className="apd-variant-id">Variant ID: <span>#{v.id}</span></div>}
                  <div className="apd-form-grid-3">
                    {optionFields.map(({ field, axis, label }) => (
                      <div key={field} className="apd-form-row">
                        <label className="apd-form-label">{label}</label>
                        {isViewOnly ? (
                          <input className="apd-form-input" value={v[field]} disabled />
                        ) : (
                          <select
                            className="apd-form-input"
                            value={v[field]}
                            onChange={(e) => {
                              if (e.target.value === "__add_new__") {
                                setAddValueModal({ axis, variantIdx: idx, field });
                                setAddValueInput("");
                              } else {
                                updateVariant(idx, field, e.target.value);
                              }
                            }}
                          >
                            <option value="" disabled hidden>-- Select --</option>
                            <option value="__add_new__">+ Add new value...</option>
                            {optionPool[axis].map((val) => (
                              <option key={val} value={val}>{val}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="apd-form-grid-3">
                    <div className="apd-form-row">
                      <label className="apd-form-label">Price <span className="apd-required">*</span></label>
                      <input className="apd-form-input" type="number" min="1" step="0.01" value={v.price}
                        onChange={(e) => updateVariant(idx, "price", e.target.value)}
                        placeholder="e.g., 99.99" disabled={isViewOnly} />
                    </div>
                    <div className="apd-form-row">
                      <label className="apd-form-label">Stock <span className="apd-required">*</span></label>
                      <input className="apd-form-input" type="number" min="0" value={v.stock}
                        onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                        placeholder="e.g., 10" disabled={isViewOnly} />
                    </div>
                    <div className="apd-form-row">
                      <label className="apd-form-label">SKU</label>
                      <input className="apd-form-input" value={v.sku}
                        onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                        placeholder="Sku" disabled={isViewOnly} maxLength={100} />
                    </div>
                  </div>
                  {!isViewOnly && activeCount > 1 && (
                    <button className="apd-btn-remove-variant" onClick={() => removeVariant(idx)}>
                      Remove this variant
                    </button>
                  )}
                </div>
              );
            })}

            {!isViewOnly && (
              <button className="apd-btn-add-sm apd-btn-add-variant-bottom" onClick={addVariant}>
                <Plus size={14} /> Add Variant
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="apd-col-side">

          {/* Thương hiệu */}
          <div className="apd-card">
            <h2 className="apd-card-title">Brand *</h2>
            <div className="apd-search-wrap">
              <Search size={13} className="apd-search-icon" />
              <input className="apd-search-input" placeholder="Find brand..."
                value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)}
                disabled={isViewOnly} />
            </div>
            <select className="apd-form-input apd-select-list" size={6}
              value={form.brandId}
              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              disabled={isViewOnly}>
              <option value="">-- Select brand --</option>
              {filteredBrands.length === 0
                ? <option disabled>Brand not found</option>
                : filteredBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {form.brandId && (
              <p className="apd-selected-hint">
                Selected: <strong>{brands.find((b) => String(b.id) === String(form.brandId))?.name}</strong>
              </p>
            )}
          </div>

          {/* Danh mục */}
          <div className="apd-card">
            <h2 className="apd-card-title">
              Category
              {form.categoryIds.length > 0 && (
                <span className="apd-cat-count"> ({form.categoryIds.length} selected)</span>
              )}
            </h2>
            <div className="apd-search-wrap">
              <Search size={13} className="apd-search-icon" />
              <input className="apd-search-input" placeholder="Find category..."
                value={catSearch} onChange={(e) => setCatSearch(e.target.value)}
                disabled={isViewOnly} />
            </div>
            <div className="apd-cat-picker">
              {filteredCats.length === 0
                ? <span className="apd-cat-empty">Category not found</span>
                : filteredCats.map((c) => (
                  <span key={c.id}
                    onClick={() => !isViewOnly && toggleCategory(c.id)}
                    className={`apd-cat-chip ${form.categoryIds.includes(c.id) ? "apd-cat-chip--active" : ""}`}
                    style={isViewOnly ? { pointerEvents: "none", opacity: 0.6 } : {}}>
                    {c.name}
                  </span>
                ))}
            </div>
            {form.categoryIds.length > 0 && (
              <p className="apd-selected-hint">
                Selected: <strong>
                  {form.categoryIds
                    .map((cid) => categories.find((c) => c.id === cid)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </strong>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ── Add new option value modal ─────────────────────────── */}
      {addValueModal && (
        <div className="apd-confirm-overlay" onClick={() => setAddValueModal(null)}>
          <div className="apd-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="apd-confirm-title">Add New Value</h3>
            <p className="apd-confirm-desc">
              New value for <strong>Option {addValueModal.axis}</strong>
              {[form.option1Name, form.option2Name, form.option3Name][addValueModal.axis - 1]
                ? ` (${[form.option1Name, form.option2Name, form.option3Name][addValueModal.axis - 1]})`
                : ""}
            </p>
            <input
              className="apd-form-input"
              value={addValueInput}
              onChange={(e) => setAddValueInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmAddValue(); }}
              placeholder="e.g., Red"
              maxLength={50}
              autoFocus
            />
            <div className="apd-confirm-actions" style={{ marginTop: 12 }}>
              <button className="apd-confirm-btn-discard" onClick={() => setAddValueModal(null)}>
                Cancel
              </button>
              <button className="apd-confirm-btn-save" onClick={confirmAddValue}
                disabled={!addValueInput.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete variant confirm dialog ──────────────────────── */}
      {deleteVariantIdx !== null && (
        <div className="apd-confirm-overlay" onClick={() => setDeleteVariantIdx(null)}>
          <div className="apd-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="apd-confirm-title">Remove this variant?</h3>
            <p className="apd-confirm-desc">
              Variant <strong>#{form.variants[deleteVariantIdx]?.id}</strong> will be removed and
              will no longer be available for purchase.
            </p>
            <div className="apd-confirm-actions">
              <button className="apd-confirm-btn-discard" onClick={() => setDeleteVariantIdx(null)}>
                Cancel
              </button>
              <button className="apd-confirm-btn-save" onClick={confirmDeleteVariant}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Leave confirm dialog ────────────────────────────────── */}
      {showLeaveConfirm && (
        <div className="apd-confirm-overlay" onClick={() => setShowLeaveConfirm(false)}>
          <div className="apd-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="apd-confirm-title">You have unsaved changes</h3>
            <p className="apd-confirm-desc">Exiting will lose your unsaved changes.</p>
            <div className="apd-confirm-actions">
              <button className="apd-confirm-btn-discard"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  if (leaveToView) {
                    setLeaveToView(false);
                    setForm(JSON.parse(initialForm));
                    setCurrentMode("view");
                  } else {
                    goBack();
                  }
                }}>
                Discard Changes
              </button>
              <button className="apd-confirm-btn-save"
                onClick={() => { setShowLeaveConfirm(false); handleSave(); }}
                disabled={saving}>
                {saving ? "Saving..." : leaveToView ? "Save" : "Save & Exit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductDetail;