import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, X, Search } from "lucide-react";
import axios from "axios";

const BASE = "http://localhost:8080/api/v1";
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    product: null,
  });
  const [saving, setSaving] = useState(false);

  // ================= FORM STATE =================
  const emptyForm = {
    name: "",
    description: "",
    brandId: "",
    option1Name: "",
    option2Name: "",
    option3Name: "",
    images: [], // [{ imageUrl, position }]
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

  // ================= FETCH =================
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BASE}/products/detail`);
      // console.log("RAW RESPONSE:", res.data);
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

  // ================= OPEN MODAL =================
  const openAdd = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: "add", product: null });
  };

  const openEdit = (product) => {
    // console.log("PRODUCT IMAGES:", product.images);
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
    setModal({ open: true, mode: "edit", product });
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!form.name || !form.brandId) {
      alert("Vui lòng điền tên sản phẩm và chọn thương hiệu!");
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === "add") {
        // 1. Tạo product
        const res = await axios.post(
          `${BASE}/products`,
          {
            name: form.name,
            description: form.description,
            brandId: Number(form.brandId),
          },
          { headers: authHeader() },
        );

        const productId = res.data.id;

        // 2. Tạo variants
        for (const v of form.variants) {
          if (v.option1Value && v.price) {
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
        }

        // 3. Tạo images
        for (const img of form.images) {
          if (img.imageUrl) {
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
        }

        // 4. Gán categories
        for (const catId of form.categoryIds) {
          await axios.post(
            `${BASE}/products/${productId}/categories/${catId}`,
            {},
            { headers: authHeader() },
          );
        }
      } else {
        // EDIT MODE
        const productId = modal.product.id;

        // 1. Update product info
        await axios.put(
          `${BASE}/products/${productId}`,
          {
            name: form.name,
            description: form.description,
            brandId: Number(form.brandId),
          },
          { headers: authHeader() },
        );

        // 2. Xử lý variants
        const oldVariantIds = modal.product.variants?.map((v) => v.id) || [];
        const newVariantIds = form.variants
          .filter((v) => v.id)
          .map((v) => v.id);

        // Xóa variants bị remove
        for (const oldId of oldVariantIds) {
          if (!newVariantIds.includes(oldId)) {
            await axios.delete(`${BASE}/products/variants/${oldId}`, {
              headers: authHeader(),
            });
          }
        }

        // Update hoặc tạo mới variants
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
          if (v.id) {
            await axios.put(`${BASE}/products/variants/${v.id}`, payload, {
              headers: authHeader(),
            });
          } else if (v.option1Value && v.price) {
            await axios.post(`${BASE}/products/variants`, payload, {
              headers: authHeader(),
            });
          }
        }

        // 3. Xử lý images
        const oldImageIds = modal.product.images?.map((i) => i.id) || [];
        const newImageIds = form.images.filter((i) => i.id).map((i) => i.id);

        // Xóa images bị remove
        for (const oldId of oldImageIds) {
          if (!newImageIds.includes(oldId)) {
            console.log("DELETE IMAGE ID:", oldId);
            await axios.delete(`${BASE}/products/images/${oldId}`, {
              headers: authHeader(),
            });
          }
        }

        // Thêm images mới
        for (const img of form.images) {
          if (!img.id && img.imageUrl) {
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
        }

        // 4. Xử lý categories
        const oldCatIds = modal.product.categories?.map((c) => c.id) || [];

        // Xóa categories bị remove
        for (const oldId of oldCatIds) {
          if (!form.categoryIds.includes(oldId)) {
            await axios.delete(
              `${BASE}/products/${productId}/categories/${oldId}`,
              { headers: authHeader() },
            );
          }
        }

        // Thêm categories mới
        for (const catId of form.categoryIds) {
          if (!oldCatIds.includes(catId)) {
            await axios.post(
              `${BASE}/products/${productId}/categories/${catId}`,
              {},
              { headers: authHeader() },
            );
          }
        }
      }

      await fetchProducts();
      setModal({ open: false, mode: "add", product: null });
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại! " + (err.response?.data?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      await axios.delete(`${BASE}/products/${id}`, { headers: authHeader() });
      await fetchProducts();
    } catch (err) {
      alert("Xóa thất bại!");
    }
  };

  // ================= VARIANT HANDLERS =================
  const addVariant = () => {
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
  };

  const removeVariant = (idx) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) });
  };

  const updateVariant = (idx, field, value) => {
    const updated = [...form.variants];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, variants: updated });
  };

  // ================= IMAGE HANDLERS =================
  const addImage = () => {
    const nextPosition = form.images.length + 1;
    setForm({
      ...form,
      images: [...form.images, { imageUrl: "", position: nextPosition }],
    });
  };

  const removeImage = (idx) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const updateImage = (idx, value) => {
    const updated = [...form.images];
    updated[idx] = { ...updated[idx], imageUrl: value };
    setForm({ ...form, images: updated });
  };

  // ================= CATEGORY HANDLERS =================
  const toggleCategory = (catId) => {
    const ids = form.categoryIds.includes(catId)
      ? form.categoryIds.filter((id) => id !== catId)
      : [...form.categoryIds, catId];
    setForm({ ...form, categoryIds: ids });
  };

  // ================= FILTER =================
  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ================= HELPERS =================
  const getMinPrice = (variants) => {
    if (!variants?.length) return "—";
    const prices = variants.map((v) => Number(v.price)).filter(Boolean);
    if (!prices.length) return "—";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? `${min.toLocaleString("vi-VN")} ₫`
      : `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} ₫`;
  };

  const getTotalStock = (variants) =>
    variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) || 0;

  if (loading)
    return <div style={{ padding: "40px", color: "#aaa" }}>Đang tải...</div>;

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    background: "#111",
    border: "1px solid #444",
    color: "#fff",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "14px",
  };
  const labelStyle = {
    color: "#a3a3a3",
    fontSize: "13px",
    display: "block",
    marginBottom: "5px",
  };

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>Quản lý Sản phẩm</h2>
        <button
          onClick={openAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {/* SEARCH */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "8px 12px",
          marginBottom: "20px",
        }}
      >
        <Search size={18} color="#888" />
        <input
          type="text"
          placeholder="Tìm theo tên, thương hiệu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            outline: "none",
            marginLeft: "10px",
            width: "100%",
            fontSize: "14px",
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#888",
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          border: "1px solid #333",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#fff",
            textAlign: "left",
          }}
        >
          <thead style={{ background: "#222", borderBottom: "1px solid #333" }}>
            <tr>
              <th style={{ padding: "14px" }}>Ảnh</th>
              <th style={{ padding: "14px" }}>Tên sản phẩm</th>
              <th style={{ padding: "14px" }}>Thương hiệu</th>
              <th style={{ padding: "14px" }}>Danh mục</th>
              <th style={{ padding: "14px" }}>Giá</th>
              <th style={{ padding: "14px" }}>Tồn kho</th>
              <th style={{ padding: "14px" }}>Variants</th>
              <th style={{ padding: "14px" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((product) => (
                <tr
                  key={product.id}
                  style={{ borderBottom: "1px solid #2a2a2a" }}
                >
                  <td style={{ padding: "14px" }}>
                    {product.images?.[0]?.imageUrl ? (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          border: "1px solid #444",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          background: "#333",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          color: "#888",
                        }}
                      >
                        No img
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "14px",
                      fontWeight: "500",
                      maxWidth: "200px",
                    }}
                  >
                    {product.name}
                  </td>
                  <td style={{ padding: "14px", color: "#a3a3a3" }}>
                    {product.brand}
                  </td>
                  <td style={{ padding: "14px" }}>
                    {product.categories?.map((c) => (
                      <span
                        key={c.id}
                        style={{
                          background: "#333",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          marginRight: "4px",
                        }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </td>
                  <td
                    style={{
                      padding: "14px",
                      color: "#4ade80",
                      fontSize: "13px",
                    }}
                  >
                    {getMinPrice(product.variants)}
                  </td>
                  <td style={{ padding: "14px" }}>
                    {getTotalStock(product.variants)}
                  </td>
                  <td
                    style={{
                      padding: "14px",
                      color: "#a3a3a3",
                      fontSize: "13px",
                    }}
                  >
                    {product.variants?.length || 0} phân loại
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() => openEdit(product)}
                        style={{
                          background: "transparent",
                          color: "#eab308",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{
                          background: "transparent",
                          color: "#ef4444",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#888",
                  }}
                >
                  Không tìm thấy sản phẩm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              padding: "28px",
              borderRadius: "12px",
              width: "750px",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid #333",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {modal.mode === "add"
                  ? "Thêm sản phẩm mới"
                  : "Chỉnh sửa sản phẩm"}
              </h3>
              <button
                onClick={() =>
                  setModal({ open: false, mode: "add", product: null })
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* THÔNG TIN CƠ BẢN */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Tên sản phẩm *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tên sản phẩm"
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Mô tả</label>
              <textarea
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Mô tả sản phẩm"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Thương hiệu *</label>
                <select
                  style={inputStyle}
                  value={form.brandId}
                  onChange={(e) =>
                    setForm({ ...form, brandId: e.target.value })
                  }
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Danh mục</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    padding: "8px",
                    background: "#111",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    minHeight: "40px",
                  }}
                >
                  {categories.map((c) => (
                    <span
                      key={c.id}
                      onClick={() => toggleCategory(c.id)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        cursor: "pointer",
                        background: form.categoryIds.includes(c.id)
                          ? "#3b82f6"
                          : "#333",
                        color: form.categoryIds.includes(c.id)
                          ? "#fff"
                          : "#aaa",
                      }}
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* OPTION NAMES */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {["option1Name", "option2Name", "option3Name"].map(
                (field, idx) => (
                  <div key={field}>
                    <label style={labelStyle}>
                      Tên option {idx + 1} (VD: Màu sắc)
                    </label>
                    <input
                      style={inputStyle}
                      value={form[field]}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                      placeholder={`Option ${idx + 1}`}
                    />
                  </div>
                ),
              )}
            </div>

            <hr style={{ borderColor: "#333", margin: "20px 0" }} />

            {/* IMAGES */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4 style={{ margin: 0 }}>Hình ảnh ({form.images.length})</h4>
              <button
                onClick={addImage}
                style={{
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Plus size={14} /> Thêm ảnh
              </button>
            </div>

            {form.images.map((img, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <input
                    style={inputStyle}
                    value={img.imageUrl}
                    onChange={(e) => updateImage(idx, e.target.value)}
                    placeholder="URL hình ảnh"
                  />
                </div>
                <span
                  style={{
                    color: "#a3a3a3",
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Vị trí: {img.position}
                </span>
                {img.imageUrl && (
                  <img
                    src={img.imageUrl}
                    alt=""
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #444",
                    }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
                <button
                  onClick={() => removeImage(idx)}
                  style={{
                    background: "transparent",
                    color: "#ef4444",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ))}

            <hr style={{ borderColor: "#333", margin: "20px 0" }} />

            {/* VARIANTS */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4 style={{ margin: 0 }}>
                Phân loại / Variants ({form.variants.length})
              </h4>
              <button
                onClick={addVariant}
                style={{
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Plus size={14} /> Thêm variant
              </button>
            </div>

            {form.variants.map((v, idx) => (
              <div
                key={idx}
                style={{
                  background: "#222",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Option 1 ({form.option1Name || "Option 1"})
                    </label>
                    <input
                      style={inputStyle}
                      value={v.option1Value}
                      onChange={(e) =>
                        updateVariant(idx, "option1Value", e.target.value)
                      }
                      placeholder="VD: Đỏ"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Option 2 ({form.option2Name || "Option 2"})
                    </label>
                    <input
                      style={inputStyle}
                      value={v.option2Value}
                      onChange={(e) =>
                        updateVariant(idx, "option2Value", e.target.value)
                      }
                      placeholder="VD: Size 40"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Option 3 ({form.option3Name || "Option 3"})
                    </label>
                    <input
                      style={inputStyle}
                      value={v.option3Value}
                      onChange={(e) =>
                        updateVariant(idx, "option3Value", e.target.value)
                      }
                      placeholder="VD: Cotton"
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Giá *</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={v.price}
                      onChange={(e) =>
                        updateVariant(idx, "price", e.target.value)
                      }
                      placeholder="VD: 500000"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tồn kho</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={v.stock}
                      onChange={(e) =>
                        updateVariant(idx, "stock", e.target.value)
                      }
                      placeholder="VD: 10"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU</label>
                    <input
                      style={inputStyle}
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
                    onClick={() => removeVariant(idx)}
                    style={{
                      marginTop: "10px",
                      background: "transparent",
                      color: "#ef4444",
                      border: "1px solid #ef4444",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Xóa variant này
                  </button>
                )}
              </div>
            ))}

            {/* FOOTER */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() =>
                  setModal({ open: false, mode: "add", product: null })
                }
                style={{
                  padding: "10px 16px",
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "10px 16px",
                  background: saving ? "#555" : "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
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
