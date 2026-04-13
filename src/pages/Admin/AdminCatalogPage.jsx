import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import "./AdminCatalogPage.css";

const BASE = "http://localhost:8080/api/v1";
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
      setBrandError("Tên brand không được để trống.");
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
      const msg = err.response?.data?.message || "Đã có lỗi xảy ra.";
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
      setCatError("Tên category không được để trống.");
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
      const msg = err.response?.data?.message || "Đã có lỗi xảy ra.";
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
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="cp-page">
      {/* Header */}
      <div className="cp-header">
        <div>
          <h1 className="cp-title">Danh mục & Thương hiệu</h1>
          <p className="cp-subtitle">Quản lý brand và category sản phẩm</p>
        </div>
      </div>

      {/* Stats */}
      <div className="cp-stats">
        <div className="cp-stat-card">
          <span className="cp-stat-num">{brands.length}</span>
          <span className="cp-stat-label">Tổng brand</span>
        </div>
        <div className="cp-stat-card">
          <span className="cp-stat-num">{categories.length}</span>
          <span className="cp-stat-label">Tổng category</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        <button
          className={`cp-tab ${tab === "brand" ? "active" : ""}`}
          onClick={() => setTab("brand")}
        >
          Thương hiệu
        </button>
        <button
          className={`cp-tab ${tab === "category" ? "active" : ""}`}
          onClick={() => setTab("category")}
        >
          Danh mục
        </button>
      </div>

      {/* ── BRAND TAB ──────────────────────────────────────────────────────── */}
      {tab === "brand" && (
        <>
          <div className="cp-toolbar">
            <input
              className="cp-search"
              placeholder="Tìm brand..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
            />
            <button className="cp-btn-add" onClick={openAddBrand}>
              <Plus size={16} /> Thêm brand
            </button>
          </div>

          {brandLoading ? (
            <div className="cp-loading">Đang tải...</div>
          ) : (
            <div className="cp-table-wrap">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Tên thương hiệu</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="cp-empty-row">
                        Không tìm thấy brand nào.
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
              placeholder="Tìm category..."
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
            />
            <button className="cp-btn-add" onClick={openAddCat}>
              <Plus size={16} /> Thêm category
            </button>
          </div>

          {catLoading ? (
            <div className="cp-loading">Đang tải...</div>
          ) : (
            <div className="cp-table-wrap">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Mô tả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="cp-empty-row">
                        Không tìm thấy category nào.
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
                  {brandModal.mode === "add" ? "Thêm brand mới" : "Chỉnh sửa brand"}
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
              <label>Tên thương hiệu *</label>
              <input
                type="text"
                placeholder="Nhập tên brand..."
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
                Hủy
              </button>
              <button className="cp-btn-save" onClick={handleBrandSubmit}>
                {brandModal.mode === "add" ? "Thêm mới" : "Lưu thay đổi"}
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
                  {catModal.mode === "add" ? "Thêm category mới" : "Chỉnh sửa category"}
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
              <label>Tên danh mục *</label>
              <input
                type="text"
                placeholder="Nhập tên category..."
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
              <label>Mô tả</label>
              <textarea
                placeholder="Nhập mô tả (tuỳ chọn)..."
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
                Hủy
              </button>
              <button className="cp-btn-save" onClick={handleCatSubmit}>
                {catModal.mode === "add" ? "Thêm mới" : "Lưu thay đổi"}
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
              <h3 className="cp-modal-title">Xác nhận xóa</h3>
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
              Bạn có chắc muốn xóa brand{" "}
              <strong>"{brandDeleteModal.name}"</strong>? Hành động này không
              thể hoàn tác.
            </p>
            <div className="cp-modal-actions">
              <button
                className="cp-btn-cancel"
                onClick={() =>
                  setBrandDeleteModal({ open: false, id: null, name: "" })
                }
              >
                Hủy
              </button>
              <button className="cp-btn-danger" onClick={handleBrandDelete}>
                Xóa
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
              <h3 className="cp-modal-title">Xác nhận xóa</h3>
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
              Bạn có chắc muốn xóa category{" "}
              <strong>"{catDeleteModal.name}"</strong>? Hành động này không thể
              hoàn tác.
            </p>
            <div className="cp-modal-actions">
              <button
                className="cp-btn-cancel"
                onClick={() =>
                  setCatDeleteModal({ open: false, id: null, name: "" })
                }
              >
                Hủy
              </button>
              <button className="cp-btn-danger" onClick={handleCatDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCatalogPage;