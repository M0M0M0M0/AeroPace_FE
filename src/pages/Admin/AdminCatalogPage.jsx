import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import "./AdminCatalogPage.css";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── EMPTY FORMS ───────────────────────────────────────────────────────────────
const EMPTY_BRAND = { name: "" };
const EMPTY_CAT = { name: "", description: "" };

// ═════════════════════════════════════════════════════════════════════════════
const AdminCatalogPage = () => {
  const [tab, setTab] = useState("brand"); // "brand" | "category"

  // ── BRAND state ───────────────────────────────────────────────────────────
  const [brands, setBrands] = useState([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandIdSearch, setBrandIdSearch] = useState("");
  const [brandModal, setBrandModal] = useState({
    open: false,
    mode: "add", // "add" | "edit"
    data: EMPTY_BRAND,
    id: null,
  });
  const [brandDeleteModal, setBrandDeleteModal] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [brandError, setBrandError] = useState("");

  // ── CATEGORY state ────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catSearch, setCatSearch] = useState("");
  const [catIdSearch, setCatIdSearch] = useState("");
  const [catModal, setCatModal] = useState({
    open: false,
    mode: "add",
    data: EMPTY_CAT,
    id: null,
  });
  const [catDeleteModal, setCatDeleteModal] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [catError, setCatError] = useState("");

  // ── FETCH ─────────────────────────────────────────────────────────────────
  const fetchBrands = async () => {
    setBrandLoading(true);
    try {
      const res = await axios.get(`${BASE}/brands`, { headers: authHeader() });
      setBrands(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBrandLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await axios.get(`${BASE}/categories`, {
        headers: authHeader(),
      });
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  // ── BRAND handlers ────────────────────────────────────────────────────────
  const openAddBrand = () => {
    setBrandError("");
    setBrandModal({ open: true, mode: "add", data: EMPTY_BRAND, id: null });
  };

  const openEditBrand = (b) => {
    setBrandError("");
    setBrandModal({ open: true, mode: "edit", data: { name: b.name }, id: b.id });
  };

  const closeBrandModal = () =>
    setBrandModal({ open: false, mode: "add", data: EMPTY_BRAND, id: null });

  const handleBrandSubmit = async () => {
    setBrandError("");
    if (!brandModal.data.name.trim()) {
      setBrandError("Brand name is required.");
      return;
    }
    try {
      if (brandModal.mode === "add") {
        await axios.post(`${BASE}/brands`, brandModal.data, {
          headers: authHeader(),
        });
      } else {
        await axios.put(`${BASE}/brands/${brandModal.id}`, brandModal.data, {
          headers: authHeader(),
        });
      }
      await fetchBrands();
      closeBrandModal();
    } catch (err) {
      const msg = err.response?.data?.message || "An error occurred.";
      setBrandError(msg);
    }
  };

  const handleBrandDelete = async () => {
    try {
      await axios.delete(`${BASE}/brands/${brandDeleteModal.id}`, {
        headers: authHeader(),
      });
      await fetchBrands();
      setBrandDeleteModal({ open: false, id: null, name: "" });
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại!");
    }
  };

  // ── CATEGORY handlers ─────────────────────────────────────────────────────
  const openAddCat = () => {
    setCatError("");
    setCatModal({ open: true, mode: "add", data: EMPTY_CAT, id: null });
  };

  const openEditCat = (c) => {
    setCatError("");
    setCatModal({
      open: true,
      mode: "edit",
      data: { name: c.name, description: c.description || "" },
      id: c.id,
    });
  };

  const closeCatModal = () =>
    setCatModal({ open: false, mode: "add", data: EMPTY_CAT, id: null });

  const handleCatSubmit = async () => {
    setCatError("");
    if (!catModal.data.name.trim()) {
      setCatError("Category name is required.");
      return;
    }
    try {
      if (catModal.mode === "add") {
        await axios.post(`${BASE}/categories`, catModal.data, {
          headers: authHeader(),
        });
      } else {
        await axios.put(`${BASE}/categories/${catModal.id}`, catModal.data, {
          headers: authHeader(),
        });
      }
      await fetchCategories();
      closeCatModal();
    } catch (err) {
      const msg = err.response?.data?.message || "An error occurred.";
      setCatError(msg);
    }
  };

  const handleCatDelete = async () => {
    try {
      await axios.delete(`${BASE}/categories/${catDeleteModal.id}`, {
        headers: authHeader(),
      });
      await fetchCategories();
      setCatDeleteModal({ open: false, id: null, name: "" });
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại!");
    }
  };

  // ── FILTERED lists ────────────────────────────────────────────────────────
  const filteredBrands = brands.filter((b) => {
    const matchName = b.name.toLowerCase().includes(brandSearch.toLowerCase());
    const matchId = brandIdSearch ? String(b.id).includes(brandIdSearch.trim()) : true;
    return matchName && matchId;
  });

  const filteredCats = categories.filter((c) => {
    const matchName = c.name.toLowerCase().includes(catSearch.toLowerCase());
    const matchId = catIdSearch ? String(c.id).includes(catIdSearch.trim()) : true;
    return matchName && matchId;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="cp-page">
      {/* Header */}
      <div className="cp-header">
        <div>
          <h1 className="cp-title">Categories & Brands</h1>
          <p className="cp-subtitle">Manage product brands and categories</p>
        </div>
      </div>

      {/* Stats */}
      <div className="cp-stats">
        <div
          className={`cp-stat-card cp-stat-card--clickable ${tab === "brand" ? "cp-stat-card--active" : ""}`}
          onClick={() => setTab("brand")}
          title="Chuyển sang tab Thương hiệu"
        >
          <span className="cp-stat-num">{brands.length}</span>
          <span className="cp-stat-label">Total Brands</span>
        </div>
        <div
          className={`cp-stat-card cp-stat-card--clickable ${tab === "category" ? "cp-stat-card--active" : ""}`}
          onClick={() => setTab("category")}
          title="Chuyển sang tab Danh mục"
        >
          <span className="cp-stat-num">{categories.length}</span>
          <span className="cp-stat-label">Total Categories</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        <button
          className={`cp-tab ${tab === "brand" ? "active" : ""}`}
          onClick={() => setTab("brand")}
        >
          Brand
        </button>
        <button
          className={`cp-tab ${tab === "category" ? "active" : ""}`}
          onClick={() => setTab("category")}
        >
          Category
        </button>
      </div>

      {/* ── BRAND TAB ──────────────────────────────────────────────────────── */}
      {tab === "brand" && (
        <>
          <div className="cp-toolbar">
            <input
              className="cp-search"
              placeholder="Search by ID..."
              value={brandIdSearch}
              onChange={(e) => setBrandIdSearch(e.target.value)}
              style={{ maxWidth: 140 }}
            />
            <input
              className="cp-search"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
            />
            <button className="cp-btn-add" onClick={openAddBrand}>
              <Plus size={16} /> Add Brand
            </button>
          </div>

          {brandLoading ? (
            <div className="cp-loading">Loading...</div>
          ) : (
            <div className="cp-table-wrap">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Brand Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="cp-empty-row">
                        No brands found.
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((b, idx) => (
                      <tr key={b.id} className="cp-row">
                        <td>{idx + 1}</td>
                        <td className="cp-id">#{b.id}</td>
                        <td className="cp-name">{b.name}</td>
                        <td>
                          <div className="cp-actions">
                            <button
                              className="cp-action-btn cp-edit-btn"
                              onClick={() => openEditBrand(b)}
                              title="Chỉnh sửa"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="cp-action-btn cp-delete-btn"
                              onClick={() =>
                                setBrandDeleteModal({
                                  open: true,
                                  id: b.id,
                                  name: b.name,
                                })
                              }
                              title="Xóa"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── CATEGORY TAB ───────────────────────────────────────────────────── */}
      {tab === "category" && (
        <>
          <div className="cp-toolbar">
            <input
              className="cp-search"
              placeholder="Search by ID..."
              value={catIdSearch}
              onChange={(e) => setCatIdSearch(e.target.value)}
              style={{ maxWidth: 140 }}
            />
            <input
              className="cp-search"
              placeholder="Search categories..."
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
            <button className="cp-btn-add" onClick={openAddCat}>
              <Plus size={16} /> Add Category
            </button>
          </div>

          {catLoading ? (
            <div className="cp-loading">Loading...</div>
          ) : (
            <div className="cp-table-wrap">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="cp-empty-row">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCats.map((c, idx) => (
                      <tr key={c.id} className="cp-row">
                        <td>{idx + 1}</td>
                        <td className="cp-id">#{c.id}</td>
                        <td className="cp-name">{c.name}</td>
                        <td className="cp-desc">
                          {c.description || <span className="cp-no-desc">—</span>}
                        </td>
                        <td>
                          <div className="cp-actions">
                            <button
                              className="cp-action-btn cp-edit-btn"
                              onClick={() => openEditCat(c)}
                              title="Chỉnh sửa"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="cp-action-btn cp-delete-btn"
                              onClick={() =>
                                setCatDeleteModal({
                                  open: true,
                                  id: c.id,
                                  name: c.name,
                                })
                              }
                              title="Xóa"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── MODAL BRAND ADD/EDIT ────────────────────────────────────────────── */}
      {brandModal.open && (
        <div className="cp-overlay" onClick={closeBrandModal}>
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <div>
                <h3 className="cp-modal-title">
                  {brandModal.mode === "add" ? "Add New Brand" : "Edit Brand"}
                </h3>
                <p className="cp-modal-sub">
                  {brandModal.mode === "edit" && `ID: #${brandModal.id}`}
                </p>
              </div>
              <button className="cp-modal-close" onClick={closeBrandModal}>
                <X size={18} />
              </button>
            </div>

            <div className="cp-form-row">
              <label>Brand Name *</label>
              <input
                type="text"
                placeholder="Enter brand name..."
                value={brandModal.data.name}
                onChange={(e) =>
                  setBrandModal({
                    ...brandModal,
                    data: { ...brandModal.data, name: e.target.value },
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && handleBrandSubmit()}
              />
            </div>

            {brandError && <p className="cp-form-error">{brandError}</p>}

            <div className="cp-modal-actions">
              <button className="cp-btn-cancel" onClick={closeBrandModal}>
                Cancel
              </button>
              <button className="cp-btn-save" onClick={handleBrandSubmit}>
                {brandModal.mode === "add" ? "Add New" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CATEGORY ADD/EDIT ─────────────────────────────────────────── */}
      {catModal.open && (
        <div className="cp-overlay" onClick={closeCatModal}>
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <div>
                <h3 className="cp-modal-title">
                  {catModal.mode === "add" ? "Add New Category" : "Edit Category"}
                </h3>
                <p className="cp-modal-sub">
                  {catModal.mode === "edit" && `ID: #${catModal.id}`}
                </p>
              </div>
              <button className="cp-modal-close" onClick={closeCatModal}>
                <X size={18} />
              </button>
            </div>

            <div className="cp-form-row">
              <label>Category Name *</label>
              <input
                type="text"
                placeholder="Enter category name..."
                value={catModal.data.name}
                onChange={(e) =>
                  setCatModal({
                    ...catModal,
                    data: { ...catModal.data, name: e.target.value },
                  })
                }
              />
            </div>

            <div className="cp-form-row">
              <label>Description</label>
              <textarea
                placeholder="Enter description (optional)..."
                value={catModal.data.description}
                rows={3}
                onChange={(e) =>
                  setCatModal({
                    ...catModal,
                    data: { ...catModal.data, description: e.target.value },
                  })
                }
              />
            </div>

            {catError && <p className="cp-form-error">{catError}</p>}

            <div className="cp-modal-actions">
              <button className="cp-btn-cancel" onClick={closeCatModal}>
                Cancel
              </button>
              <button className="cp-btn-save" onClick={handleCatSubmit}>
                {catModal.mode === "add" ? "Add New" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA BRAND ───────────────────────────────────────── */}
      {brandDeleteModal.open && (
        <div
          className="cp-overlay"
          onClick={() =>
            setBrandDeleteModal({ open: false, id: null, name: "" })
          }
        >
          <div className="cp-modal cp-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">Confirm Deletion</h3>
              <button
                className="cp-modal-close"
                onClick={() =>
                  setBrandDeleteModal({ open: false, id: null, name: "" })
                }
              >
                <X size={18} />
              </button>
            </div>
            <p className="cp-delete-msg">
              Are you sure you want to delete the brand{" "}
              <strong>"{brandDeleteModal.name}"</strong>? This action cannot be undone.
            </p>
            <div className="cp-modal-actions">
              <button
                className="cp-btn-cancel"
                onClick={() =>
                  setBrandDeleteModal({ open: false, id: null, name: "" })
                }
              >
                Cancel
              </button>
              <button className="cp-btn-danger" onClick={handleBrandDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA CATEGORY ────────────────────────────────────── */}
      {catDeleteModal.open && (
        <div
          className="cp-overlay"
          onClick={() =>
            setCatDeleteModal({ open: false, id: null, name: "" })
          }
        >
          <div className="cp-modal cp-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">Confirm Deletion</h3>
              <button
                className="cp-modal-close"
                onClick={() =>
                  setCatDeleteModal({ open: false, id: null, name: "" })
                }
              >
                <X size={18} />
              </button>
            </div>
            <p className="cp-delete-msg">
              Are you sure you want to delete the category{" "}
              <strong>"{catDeleteModal.name}"</strong>? This action cannot be undone.
            </p>
            <div className="cp-modal-actions">
              <button
                className="cp-btn-cancel"
                onClick={() =>
                  setCatDeleteModal({ open: false, id: null, name: "" })
                }
              >
                Cancel
              </button>
              <button className="cp-btn-danger" onClick={handleCatDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCatalogPage;