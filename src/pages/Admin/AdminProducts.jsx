import React, { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import axios from "axios";
import "./AdminProducts.css";

const BASE = "http://localhost:8080/api/v1";
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    product: null,
  });
  const [saving, setSaving] = useState(false);

  // ── Filter states (bảng ngoài) ─────────────────────────────
  const [filterName, setFilterName] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [filterVariantId, setFilterVariantId] = useState("");
  const [filterSku, setFilterSku] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterStockMin, setFilterStockMin] = useState("");
  const [filterStockMax, setFilterStockMax] = useState("");

  // ── Search trong modal ──────────────────────────────────────
  const [modalBrandSearch, setModalBrandSearch] = useState("");
  const [modalCatSearch, setModalCatSearch] = useState("");

  // ── Form state ──────────────────────────────────────────────
  const emptyForm = {
    name: "",
    description: "",
    brandId: "",
    option1Name: "",
    option2Name: "",
    option3Name: "",
    images: [],
    variants: [
      {
        option1Value: "",
        option2Value: "",
        option3Value: "",
        price: "",
        stock: "",
        sku: "",
      },
    ],
    categoryIds: [],
  };
  const [form, setForm] = useState(emptyForm);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE}/products/detail`);
      setProducts(res.data.products || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchBrands = async () => {
    const res = await axios.get(`${BASE}/brands`);
    setBrands(res.data);
  };
  const fetchCategories = async () => {
    const res = await axios.get(`${BASE}/categories`);
    setCategories(res.data);
  };

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
  }, []);

  // ── Modal helpers ───────────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm);
    setModalBrandSearch("");
    setModalCatSearch("");
    setModal({ open: true, mode: "add", product: null });
  };

  const openEdit = (product) => {
    setForm({
      name: product.name || "",
      description: product.description || "",
      brandId: brands.find((b) => b.name === product.brand)?.id || "",
      option1Name: product.option1Name || "",
      option2Name: product.option2Name || "",
      option3Name: product.option3Name || "",
      images:
        product.images?.map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          position: img.position,
        })) || [],
      variants: product.variants?.map((v) => ({
        id: v.id,
        option1Value: v.option1Value || "",
        option2Value: v.option2Value || "",
        option3Value: v.option3Value || "",
        price: v.price || "",
        stock: v.stock || "",
        sku: v.sku || "",
      })) || [
        {
          option1Value: "",
          option2Value: "",
          option3Value: "",
          price: "",
          stock: "",
          sku: "",
        },
      ],
      categoryIds: product.categories?.map((c) => c.id) || [],
    });
    setModalBrandSearch("");
    setModalCatSearch("");
    setModal({ open: true, mode: "edit", product });
  };

  const closeModal = () => {
    setModal({ open: false, mode: "add", product: null });
    setModalBrandSearch("");
    setModalCatSearch("");
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.brandId) {
      alert("Vui lòng điền tên sản phẩm và chọn thương hiệu!");
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const res = await axios.post(
          `${BASE}/products`,
          {
            name: form.name,
            description: form.description,
            brandId: Number(form.brandId),
            option1Name: form.option1Name || null,
            option2Name: form.option2Name || null,
            option3Name: form.option3Name || null,
          },
          { headers: authHeader() },
        );
        const productId = res.data.id;
        for (const v of form.variants) {
          if (v.option1Value && v.price)
            await axios.post(
              `${BASE}/products/variants`,
              {
                productId,
                option1Value: v.option1Value,
                option2Value: v.option2Value || "",
                option3Value: v.option3Value || "",
                price: Number(v.price),
                stock: Number(v.stock) || 0,
                sku: v.sku || "",
              },
              { headers: authHeader() },
            );
        }
        for (const img of form.images) {
          if (img.imageUrl)
            await axios.post(
              `${BASE}/products/images`,
              {
                productId,
                imageUrl: img.imageUrl,
                position: img.position || 1,
              },
              { headers: authHeader() },
            );
        }
        for (const catId of form.categoryIds)
          await axios.post(
            `${BASE}/products/${productId}/categories/${catId}`,
            {},
            { headers: authHeader() },
          );
      } else {
        const productId = modal.product.id;
        await axios.put(
          `${BASE}/products/${productId}`,
          {
            name: form.name,
            description: form.description,
            brandId: Number(form.brandId),
            option1Name: form.option1Name || null,
            option2Name: form.option2Name || null,
            option3Name: form.option3Name || null,
          },
          { headers: authHeader() },
        );
        const oldVariantIds = modal.product.variants?.map((v) => v.id) || [];
        const newVariantIds = form.variants
          .filter((v) => v.id)
          .map((v) => v.id);
        for (const oldId of oldVariantIds) {
          if (!newVariantIds.includes(oldId))
            await axios.delete(`${BASE}/products/variants/${oldId}`, {
              headers: authHeader(),
            });
        }
        for (const v of form.variants) {
          const payload = {
            productId,
            option1Value: v.option1Value,
            option2Value: v.option2Value || "",
            option3Value: v.option3Value || "",
            price: Number(v.price),
            stock: Number(v.stock) || 0,
            sku: v.sku || "",
          };
          if (v.id)
            await axios.put(`${BASE}/products/variants/${v.id}`, payload, {
              headers: authHeader(),
            });
          else if (v.option1Value && v.price)
            await axios.post(`${BASE}/products/variants`, payload, {
              headers: authHeader(),
            });
        }
        const oldImageIds = modal.product.images?.map((i) => i.id) || [];
        const newImageIds = form.images.filter((i) => i.id).map((i) => i.id);
        for (const oldId of oldImageIds) {
          if (!newImageIds.includes(oldId))
            await axios.delete(`${BASE}/products/images/${oldId}`, {
              headers: authHeader(),
            });
        }
        for (const img of form.images) {
          if (!img.id && img.imageUrl)
            await axios.post(
              `${BASE}/products/images`,
              {
                productId,
                imageUrl: img.imageUrl,
                position: img.position || 1,
              },
              { headers: authHeader() },
            );
        }
        const oldCatIds = modal.product.categories?.map((c) => c.id) || [];
        for (const oldId of oldCatIds) {
          if (!form.categoryIds.includes(oldId))
            await axios.delete(
              `${BASE}/products/${productId}/categories/${oldId}`,
              { headers: authHeader() },
            );
        }
        for (const catId of form.categoryIds) {
          if (!oldCatIds.includes(catId))
            await axios.post(
              `${BASE}/products/${productId}/categories/${catId}`,
              {},
              { headers: authHeader() },
            );
        }
      }
      await fetchProducts();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại! " + (err.response?.data?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      await axios.delete(`${BASE}/products/${id}`, { headers: authHeader() });
      await fetchProducts();
    } catch {
      alert("Xóa thất bại!");
    }
  };

  // ── Variant handlers ────────────────────────────────────────
  const addVariant = () =>
    setForm({
      ...form,
      variants: [
        ...form.variants,
        {
          option1Value: "",
          option2Value: "",
          option3Value: "",
          price: "",
          stock: "",
          sku: "",
        },
      ],
    });
  const removeVariant = (idx) =>
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) });
  const updateVariant = (idx, field, value) => {
    const u = [...form.variants];
    u[idx] = { ...u[idx], [field]: value };
    setForm({ ...form, variants: u });
  };

  // ── Image handlers ──────────────────────────────────────────
  const addImage = () =>
    setForm({
      ...form,
      images: [
        ...form.images,
        { imageUrl: "", position: form.images.length + 1 },
      ],
    });
  const removeImage = (idx) =>
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  const updateImage = (idx, value) => {
    const u = [...form.images];
    u[idx] = { ...u[idx], imageUrl: value };
    setForm({ ...form, images: u });
  };

  // ── Category toggle ─────────────────────────────────────────
  const toggleCategory = (catId) => {
    const ids = form.categoryIds.includes(catId)
      ? form.categoryIds.filter((id) => id !== catId)
      : [...form.categoryIds, catId];
    setForm({ ...form, categoryIds: ids });
  };

  // ── Helpers ─────────────────────────────────────────────────
  const getMinPrice = (variants) => {
    if (!variants?.length) return "—";
    const prices = variants.map((v) => Number(v.price)).filter(Boolean);
    if (!prices.length) return "—";
    const min = Math.min(...prices),
      max = Math.max(...prices);
    return min === max
      ? `${min.toLocaleString("vi-VN")} ₫`
      : `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} ₫`;
  };
  const getTotalStock = (variants) =>
    variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;

  // ── Filter logic (bảng ngoài) ───────────────────────────────
  const hasActiveFilter =
    filterName ||
    filterProductId ||
    filterVariantId ||
    filterSku ||
    filterBrand ||
    filterCategory ||
    filterPriceMin ||
    filterPriceMax ||
    filterStockMin ||
    filterStockMax;

  const resetFilters = () => {
    setFilterName("");
    setFilterProductId("");
    setFilterVariantId("");
    setFilterSku("");
    setFilterBrand("");
    setFilterCategory("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterStockMin("");
    setFilterStockMax("");
  };

  const filtered = products.filter((p) => {
    if (filterName && !p.name?.toLowerCase().includes(filterName.toLowerCase()))
      return false;
    if (filterProductId && !String(p.id).includes(filterProductId.trim()))
      return false;
    if (
      filterBrand &&
      !p.brand?.toLowerCase().includes(filterBrand.toLowerCase())
    )
      return false;
    if (
      filterCategory &&
      !p.categories?.some((c) =>
        c.name.toLowerCase().includes(filterCategory.toLowerCase()),
      )
    )
      return false;

    const variants = p.variants || [];

    if (
      filterVariantId &&
      !variants.some((v) => String(v.id).includes(filterVariantId.trim()))
    )
      return false;
    if (
      filterSku &&
      !variants.some((v) =>
        (v.sku || "").toLowerCase().includes(filterSku.toLowerCase()),
      )
    )
      return false;

    const prices = variants.map((v) => Number(v.price)).filter(Boolean);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    if (filterPriceMin && minPrice < Number(filterPriceMin)) return false;
    if (filterPriceMax && minPrice > Number(filterPriceMax)) return false;

    const totalStock = getTotalStock(variants);
    if (filterStockMin && totalStock < Number(filterStockMin)) return false;
    if (filterStockMax && totalStock > Number(filterStockMax)) return false;

    return true;
  });

  // ── Filtered lists trong modal ──────────────────────────────
  const filteredModalBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(modalBrandSearch.toLowerCase()),
  );
  const filteredModalCats = categories.filter((c) =>
    c.name.toLowerCase().includes(modalCatSearch.toLowerCase()),
  );

  if (loading) return <div className="adp-loading">Đang tải...</div>;

  return (
    <div className="adp-page">
      {/* HEADER */}
      <div className="adp-header">
        <div>
          <h2 className="adp-title">Quản lý Sản phẩm</h2>
          <p className="adp-subtitle">
            Quản lý toàn bộ sản phẩm trong hệ thống
          </p>
        </div>
        <button className="adp-btn-add" onClick={openAdd}>
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="adp-filter-wrap">
        <div className="adp-filter-bar">
          <div className="adp-filter-field">
            <label className="adp-filter-label">Tên sản phẩm</label>
            <div className="adp-filter-input-wrap">
              <Search size={14} className="adp-filter-icon" />
              <input
                className="adp-filter-input"
                placeholder="Tìm tên..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">ID sản phẩm</label>
            <input
              className="adp-filter-input"
              placeholder="VD: 12"
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
            />
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">ID biến thể</label>
            <input
              className="adp-filter-input"
              placeholder="VD: 5"
              value={filterVariantId}
              onChange={(e) => setFilterVariantId(e.target.value)}
            />
          </div>
          <div className="adp-filter-field adp-filter-field--sm">
            <label className="adp-filter-label">SKU</label>
            <input
              className="adp-filter-input"
              placeholder="VD: NK-001"
              value={filterSku}
              onChange={(e) => setFilterSku(e.target.value)}
            />
          </div>
          <div className="adp-filter-field">
            <label className="adp-filter-label">Thương hiệu</label>
            <select
              className="adp-filter-input"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
            >
              <option value="">Tất cả</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="adp-filter-field">
            <label className="adp-filter-label">Danh mục</label>
            <select
              className="adp-filter-input"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="adp-filter-field adp-filter-field--range">
            <label className="adp-filter-label">Khoảng giá (₫)</label>
            <div className="adp-filter-range">
              <input
                className="adp-filter-input"
                type="number"
                placeholder="Từ"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
              />
              <span className="adp-filter-range-sep">—</span>
              <input
                className="adp-filter-input"
                type="number"
                placeholder="Đến"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
              />
            </div>
          </div>
          <div className="adp-filter-field adp-filter-field--range">
            <label className="adp-filter-label">Tồn kho</label>
            <div className="adp-filter-range">
              <input
                className="adp-filter-input"
                type="number"
                placeholder="Từ"
                value={filterStockMin}
                onChange={(e) => setFilterStockMin(e.target.value)}
              />
              <span className="adp-filter-range-sep">—</span>
              <input
                className="adp-filter-input"
                type="number"
                placeholder="Đến"
                value={filterStockMax}
                onChange={(e) => setFilterStockMax(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="adp-filter-footer">
          {hasActiveFilter && (
            <>
              <span className="adp-filter-result">
                Tìm thấy <strong>{filtered.length}</strong> / {products.length}{" "}
                sản phẩm
              </span>
              <button className="adp-filter-reset" onClick={resetFilters}>
                <X size={13} /> Xoá bộ lọc
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="adp-table-wrap">
        <table className="adp-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>ID</th>
              <th>Tên sản phẩm</th>
              <th>Thương hiệu</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Variants</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((product) => (
                <tr key={product.id} className="adp-row">
                  <td>
                    {product.images?.[0]?.imageUrl ? (
                      <img
                        className="adp-thumb"
                        src={product.images[0].imageUrl}
                        alt={product.name}
                      />
                    ) : (
                      <div className="adp-thumb adp-thumb--empty">No img</div>
                    )}
                  </td>
                  <td className="adp-id">#{product.id}</td>
                  <td className="adp-name">{product.name}</td>
                  <td className="adp-brand">{product.brand}</td>
                  <td>
                    <div className="adp-cats">
                      {product.categories?.map((c) => (
                        <span key={c.id} className="adp-cat-tag">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="adp-price">{getMinPrice(product.variants)}</td>
                  <td className="adp-stock">
                    {getTotalStock(product.variants)}
                  </td>
                  <td className="adp-variant-count">
                    {product.variants?.length || 0} phân loại
                  </td>
                  <td>
                    <div className="adp-actions">
                      <button
                        className="adp-btn-edit"
                        onClick={() => openEdit(product)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="adp-btn-delete"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="adp-empty-row">
                  Không tìm thấy sản phẩm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modal.open && (
        <div className="adp-overlay">
          <div className="adp-modal">
            {/* Modal Header */}
            <div className="adp-modal-header">
              <h3 className="adp-modal-title">
                {modal.mode === "add"
                  ? "Thêm sản phẩm mới"
                  : "Chỉnh sửa sản phẩm"}
              </h3>
              <button className="adp-modal-close" onClick={closeModal}>
                <X size={22} />
              </button>
            </div>

            {/* Thông tin cơ bản */}
            <div className="adp-form-row">
              <label className="adp-form-label">Tên sản phẩm *</label>
              <input
                className="adp-form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tên sản phẩm"
              />
            </div>
            <div className="adp-form-row">
              <label className="adp-form-label">Mô tả</label>
              <textarea
                className="adp-form-input adp-form-textarea"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Mô tả sản phẩm"
              />
            </div>

            <div className="adp-form-grid-2">
              {/* ── BRAND với search ── */}
              <div className="adp-form-row">
                <label className="adp-form-label">Thương hiệu *</label>
                <div className="adp-modal-search-wrap">
                  <Search size={13} className="adp-modal-search-icon" />
                  <input
                    className="adp-modal-search-input"
                    placeholder="Tìm thương hiệu..."
                    value={modalBrandSearch}
                    onChange={(e) => setModalBrandSearch(e.target.value)}
                  />
                </div>
                <select
                  className="adp-form-input adp-modal-select"
                  size={5}
                  value={form.brandId}
                  onChange={(e) =>
                    setForm({ ...form, brandId: e.target.value })
                  }
                >
                  {filteredModalBrands.length === 0 ? (
                    <option disabled>Không tìm thấy</option>
                  ) : (
                    filteredModalBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  )}
                </select>
                {form.brandId && (
                  <p className="adp-modal-selected-hint">
                    Đã chọn:{" "}
                    <strong>
                      {brands.find((b) => String(b.id) === String(form.brandId))?.name}
                    </strong>
                  </p>
                )}
              </div>

              {/* ── CATEGORY với search + scroll ── */}
              <div className="adp-form-row">
                <label className="adp-form-label">
                  Danh mục{" "}
                  {form.categoryIds.length > 0 && (
                    <span className="adp-cat-count">
                      ({form.categoryIds.length} đã chọn)
                    </span>
                  )}
                </label>
                <div className="adp-modal-search-wrap">
                  <Search size={13} className="adp-modal-search-icon" />
                  <input
                    className="adp-modal-search-input"
                    placeholder="Tìm danh mục..."
                    value={modalCatSearch}
                    onChange={(e) => setModalCatSearch(e.target.value)}
                  />
                </div>
                <div className="adp-cat-picker">
                  {filteredModalCats.length === 0 ? (
                    <span className="adp-cat-empty">Không tìm thấy</span>
                  ) : (
                    filteredModalCats.map((c) => (
                      <span
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
                        className={`adp-cat-chip ${
                          form.categoryIds.includes(c.id)
                            ? "adp-cat-chip--active"
                            : ""
                        }`}
                      >
                        {c.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="adp-form-grid-3">
              {["option1Name", "option2Name", "option3Name"].map(
                (field, idx) => (
                  <div key={field} className="adp-form-row">
                    <label className="adp-form-label">
                      Tên option {idx + 1}
                    </label>
                    <input
                      className="adp-form-input"
                      value={form[field]}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                      placeholder="VD: Màu sắc"
                    />
                  </div>
                ),
              )}
            </div>

            <hr className="adp-divider" />

            {/* Images */}
            <div className="adp-section-header">
              <h4 className="adp-section-title">
                Hình ảnh ({form.images.length})
              </h4>
              <button className="adp-btn-add-sm" onClick={addImage}>
                <Plus size={14} /> Thêm ảnh
              </button>
            </div>
            {form.images.map((img, idx) => (
              <div key={idx} className="adp-image-row">
                <input
                  className="adp-form-input"
                  value={img.imageUrl}
                  onChange={(e) => updateImage(idx, e.target.value)}
                  placeholder="URL hình ảnh"
                />
                <span className="adp-image-pos">Vị trí: {img.position}</span>
                {img.imageUrl && (
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="adp-image-preview"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
                <button
                  className="adp-btn-remove"
                  onClick={() => removeImage(idx)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <hr className="adp-divider" />

            {/* Variants */}
            <div className="adp-section-header">
              <h4 className="adp-section-title">
                Phân loại / Variants ({form.variants.length})
              </h4>
              <button className="adp-btn-add-sm" onClick={addVariant}>
                <Plus size={14} /> Thêm variant
              </button>
            </div>
            {form.variants.map((v, idx) => (
              <div key={idx} className="adp-variant-card">
                <div className="adp-form-grid-3">
                  {["option1Value", "option2Value", "option3Value"].map(
                    (field, i) => (
                      <div key={field} className="adp-form-row">
                        <label className="adp-form-label">
                          {[
                            form.option1Name,
                            form.option2Name,
                            form.option3Name,
                          ][i] || `Option ${i + 1}`}
                        </label>
                        <input
                          className="adp-form-input"
                          value={v[field]}
                          onChange={(e) =>
                            updateVariant(idx, field, e.target.value)
                          }
                          placeholder={
                            ["VD: Đỏ", "VD: Size 40", "VD: Cotton"][i]
                          }
                        />
                      </div>
                    ),
                  )}
                </div>
                <div className="adp-form-grid-3">
                  <div className="adp-form-row">
                    <label className="adp-form-label">Giá *</label>
                    <input
                      className="adp-form-input"
                      type="number"
                      value={v.price}
                      onChange={(e) =>
                        updateVariant(idx, "price", e.target.value)
                      }
                      placeholder="VD: 500000"
                    />
                  </div>
                  <div className="adp-form-row">
                    <label className="adp-form-label">Tồn kho</label>
                    <input
                      className="adp-form-input"
                      type="number"
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(idx, "stock", e.target.value)
                      }
                      placeholder="VD: 10"
                    />
                  </div>
                  <div className="adp-form-row">
                    <label className="adp-form-label">SKU</label>
                    <input
                      className="adp-form-input"
                      value={v.sku}
                      onChange={(e) =>
                        updateVariant(idx, "sku", e.target.value)
                      }
                      placeholder="VD: NK-AIR-RED-40"
                    />
                  </div>
                </div>
                {form.variants.length > 1 && (
                  <button
                    className="adp-btn-remove-variant"
                    onClick={() => removeVariant(idx)}
                  >
                    Xóa variant này
                  </button>
                )}
              </div>
            ))}

            {/* Footer */}
            <div className="adp-modal-footer">
              <button className="adp-btn-cancel" onClick={closeModal}>
                Huỷ
              </button>
              <button
                className="adp-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;