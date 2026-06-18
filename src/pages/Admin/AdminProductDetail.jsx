import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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

  const urlMode = id === "new" ? "add" : (searchParams.get("mode") || "edit");
  const [currentMode, setCurrentMode] = useState(urlMode);
  const isViewOnly = currentMode === "view";

  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(null);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(urlMode !== "add");

  const [brandSearch, setBrandSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveToView, setLeaveToView] = useState(false);
  const [deleteVariantIdx, setDeleteVariantIdx] = useState(null);

  // ── Load brands & categories ──────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      const [br, ca] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/brands`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/categories`),
      ]);
      setBrands(br.data);
      setCategories(ca.data);
      if (urlMode === "add" && br.data.length > 0) {
        setForm((prev) => ({ ...prev, brandId: br.data[0].id }));
      }
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
      } catch (err) {
        console.error(err);
        alert("Không thể tải sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]); // eslint-disable-line

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
      navigate("/admin/products");
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

  const addImage = () => setForm({ ...form, images: [...form.images, { imageUrl: "", position: form.images.length + 1 }] });
  const removeImage = (idx) => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  const updateImage = (idx, value) => { const u = [...form.images]; u[idx] = { ...u[idx], imageUrl: value }; setForm({ ...form, images: u }); };

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
    const missingFields = activeVariants.some(
      (v) => !v.price || v.stock === "" || v.stock === null || v.stock === undefined
    ); if (missingFields) {
      alert("Please fill in Price and Stock for all variants!");
      return;
    }
    const optionChecks = [
      { nameField: "option1Name", valueField: "option1Value", label: "Option 1" },
      { nameField: "option2Name", valueField: "option2Value", label: "Option 2" },
      { nameField: "option3Name", valueField: "option3Value", label: "Option 3" },
    ];

    for (const { nameField, valueField, label } of optionChecks) {
      const hasValue = form.variants.some((v) => !v.isDeleted && v[valueField] && v[valueField].trim() !== "");
      if (hasValue && !form[nameField]?.trim()) {
        alert(`You have entered a value for ${label} but haven't set a name!\nPlease enter a name for ${label} (e.g., "Color", "Size") before saving.`);
        return;
      }
    }

    setSaving(true);
    try {
      if (urlMode === "add") {
        const validVariants = form.variants.filter((v) => v.price);
        if (validVariants.length === 0) { alert("Please add at least 1 variant with a valid price!"); return; }
        if (validVariants.some((v) => Number(v.price) < 1500)) {
          alert("Product price must be at least 1,500 ₫ to be eligible for checkout."); return;
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
          images: form.images.filter((img) => img.imageUrl).map((img) => ({
            id: null, imageUrl: img.imageUrl, position: img.position || 1,
          })),
          categoryIds: form.categoryIds,
        }, { headers: authHeader() });

        navigate("/admin/products");

      } else {
        const invalidPrice = form.variants.filter((v) => !v.isDeleted && Number(v.price) < 1500);
        if (invalidPrice.length > 0) { alert("Product price must be at least 1,500 ₫ to be eligible for checkout."); return; }

        await axios.put(`${BASE}/products/${id}/full-update`, {
          name: form.name, description: form.description, brandId: Number(form.brandId),
          option1Name: form.option1Name || null, option2Name: form.option2Name || null, option3Name: form.option3Name || null,
          status: form.status,
          variants: form.variants.map((v) => ({
            id: v.id || null, option1Value: v.option1Value || "", option2Value: v.option2Value || "",
            option3Value: v.option3Value || "", price: Number(v.price), stock: Number(v.stock) || 0,
            sku: v.sku || "", isDeleted: v.isDeleted || false,
          })),
          images: form.images.map((img) => ({ id: img.id || null, imageUrl: img.imageUrl, position: img.position || 1 })),
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
                placeholder="Product Name" disabled={isViewOnly} />
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
                  placeholder="VD: ao-thun-nike (để trống tự generate)" disabled={isViewOnly} />
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
                  <option value="DELETED">Deleted</option>
                </select>
              ) : (
                <StatusBadge status={form.status} />
              )}
            </div>
          </div>

          {/* Options */}
          <div className="apd-card">
            <h2 className="apd-card-title">Option Names</h2>
            <div className="apd-form-grid-3">
              {["option1Name", "option2Name", "option3Name"].map((field, i) => (
                <div key={field} className="apd-form-row">
                  <label className="apd-form-label">Option {i + 1}</label>
                  <input className="apd-form-input" value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder="VD: Color" disabled={isViewOnly} />
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
              <div key={idx} className="apd-image-row">
                <input className="apd-form-input" value={img.imageUrl}
                  onChange={(e) => updateImage(idx, e.target.value)}
                  placeholder="Image URL" disabled={isViewOnly} />
                <span className="apd-image-pos">#{img.position}</span>
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
              return (
                <div key={idx} className="apd-variant-card">
                  {v.id && (
                    <div className="apd-variant-id">
                      Variant ID: <span>#{v.id}</span>
                    </div>
                  )}
                  <div className="apd-form-grid-3">
                    {["option1Value", "option2Value", "option3Value"].map((field, i) => (
                      <div key={field} className="apd-form-row">
                        <label className="apd-form-label">
                          {[form.option1Name, form.option2Name, form.option3Name][i] || `Option ${i + 1}`}
                        </label>
                        <input className="apd-form-input" value={v[field]}
                          onChange={(e) => updateVariant(idx, field, e.target.value)}
                          disabled={isViewOnly} />
                      </div>
                    ))}
                  </div>
                  <div className="apd-form-grid-3">
                    <div className="apd-form-row">
                      <label className="apd-form-label">Price <span className="apd-required">*</span></label>
                      <input className="apd-form-input" type="number" value={v.price}
                        onChange={(e) => updateVariant(idx, "price", e.target.value)}
                        placeholder="e.g., 500000" disabled={isViewOnly} />
                    </div>
                    <div className="apd-form-row">
                      <label className="apd-form-label">Stock <span className="apd-required">*</span></label>
                      <input className="apd-form-input" type="number" value={v.stock}
                        onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                        placeholder="e.g., 10" disabled={isViewOnly} />
                    </div>
                    <div className="apd-form-row">
                      <label className="apd-form-label">SKU</label>
                      <input className="apd-form-input" value={v.sku}
                        onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                        placeholder="e.g., NK-AIR-RED-40" disabled={isViewOnly} />
                    </div>
                  </div>
                  {!isViewOnly && form.variants.filter((x) => !x.isDeleted).length > 1 && (
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
                    navigate("/admin/products");
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