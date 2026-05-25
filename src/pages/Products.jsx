import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingCart, Heart, ArrowLeftRight, X } from "lucide-react"; // Import thêm các icon
import { useCart } from "../context/CartContext";
import { usePreferences } from "../components/UsePreferences"; // Import hook quản lý yêu thích/so sánh
import "./Products.css";
import CompareModal from "../components/CompareModal"; // Modal hiển thị khi nhấn so sánh


const Products = () => {
  const navigate = useNavigate();
  const { isOutOfStock, isMaxedOut, getCartQuantity, addItemToCart } = useCart();
  
  // Lấy dữ liệu và hàm từ hook usePreferences

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const {  compareList,  toggleCompare, removeCompare } = usePreferences();
  
  const [activeId, setActiveId] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedMin, setAppliedMin] = useState("");
  const [appliedMax, setAppliedMax] = useState("");

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [brandRes, categoryRes] = await Promise.all([
          fetch("http://localhost:8080/api/v1/brands"),
          fetch("http://localhost:8080/api/v1/categories"),
        ]);
        setBrands((await brandRes.json()) || []);
        setCategories((await categoryRes.json()) || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const search = searchParams.get("search") || "";

        const hasFilter =
          selectedBrands.length > 0 ||
          selectedCategories.length > 0 ||
          appliedMin ||
          appliedMax ||
          search;
          sortBy !== "";

        let url = "";

        if (!hasFilter) {
          url = `http://localhost:8080/api/v1/products/detail?page=${page - 1}`;
        } else {
          const params = new URLSearchParams();
          if (search) params.append("name", search);
          selectedBrands.forEach((id) => params.append("brands", id));
          selectedCategories.forEach((id) => params.append("categories", id));
          if (appliedMin) params.append("minPrice", appliedMin);
          if (appliedMax) params.append("maxPrice", appliedMax);
          params.append("page", page - 1);

          if (sortBy) {
            if (sortBy === "asc") params.append("sort", "price,asc"); 
            else if (sortBy === "desc") params.append("sort", "price,desc"); 
            else if (sortBy === "newest") params.append("sort", "createdAt,desc"); 
            else if (sortBy === "bestseller") params.append("sort", "sold,desc"); 
        }

          url = `http://localhost:8080/api/v1/products/filter?${params.toString()}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        setProducts(data.products || data.content || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, [selectedBrands, selectedCategories, appliedMin, appliedMax, page, searchParams, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedBrands, appliedMin, appliedMax, searchParams, sortBy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const toggleCheckbox = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const applyPrice = () => {
    setAppliedMin(minPrice);
    setAppliedMax(maxPrice);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setSearchParams(searchText.trim() ? { search: searchText.trim() } : {});
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchParams({});
  };

  const handleAddToCart = (item, e) => {
    e.stopPropagation();
    if (isMaxedOut(item)) return;
    addItemToCart(item, navigate);
    setActiveId(item.id);
    setTimeout(() => setActiveId(null), 1500);
  };

  return (
    <>
      <div className="prd-layout">
        <div className="prd-sidebar">
          <div className="prd-sidebar-search">
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <h3 className="prd-filter-title">Filter</h3>

          <div className="prd-filter-group">
            <div className="prd-filter-header">
              <p>Category</p>
              <button className="prd-clear-btn" onClick={() => setSelectedCategories([])}>
                Uncheck all
              </button>
            </div>
            <div className="prd-filter-list">
              {categories.map((cat) => (
                <label key={cat.id} className="prd-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCheckbox(cat.id, selectedCategories, setSelectedCategories)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="prd-filter-group">
            <div className="prd-filter-header">
              <p>Brand</p>
              <button className="prd-clear-btn" onClick={() => setSelectedBrands([])}>
                Uncheck all
              </button>
            </div>
            <div className="prd-filter-list">
              {brands.map((brand) => (
                <label key={brand.id} className="prd-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={() => toggleCheckbox(brand.id, selectedBrands, setSelectedBrands)}
                  />
                  <span>{brand.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="prd-filter-group">
            <p>Price (VND)</p>
            <div className="prd-price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <button className="prd-apply-btn" onClick={applyPrice}>
              Apply
            </button>
          </div>
        </div>

        <div className="prd-content">
          <div className="prd-header-top">
            <h2 className="prd-main-title">Tất cả sản phẩm</h2>
              <div className="prd-sort-options">
              <button 
                className={`prd-sort-btn ${sortBy === 'asc' ? 'active' : ''}`} 
                onClick={() => setSortBy(sortBy === 'asc' ? '' : 'asc')}
              >
               Giá tăng dần
              </button>
            <button 
              className={`prd-sort-btn ${sortBy === 'desc' ? 'active' : ''}`} 
              onClick={() => setSortBy(sortBy === 'desc' ? '' : 'desc')}
            >
              Giá giảm dần
            </button>
            <button 
              className={`prd-sort-btn ${sortBy === 'newest' ? 'active' : ''}`} 
              onClick={() => setSortBy(sortBy === 'newest' ? '' : 'newest')}
            >
              Mới nhất
            </button>
            <button 
              className={`prd-sort-btn ${sortBy === 'bestseller' ? 'active' : ''}`} 
              onClick={() => setSortBy(sortBy === 'bestseller' ? '' : 'bestseller')}
            >
              Bán chạy nhất
            </button>
            </div>
            </div>
          <div className="prd-tags-row">
            {searchParams.get("search") && (
              <span className="prd-tag prd-tag--search">
                🔍 "{searchParams.get("search")}"
                <button onClick={clearSearch}>✕</button>
              </span>
            )}
            {selectedBrands.map((id) => {
              const brand = brands.find((b) => b.id === id);
              return (
                <span key={id} className="prd-tag">
                  {brand?.name}
                  <button onClick={() => toggleCheckbox(id, selectedBrands, setSelectedBrands)}>✕</button>
                </span>
              );
            })}
            {selectedCategories.map((id) => {
              const cat = categories.find((c) => c.id === id);
              return (
                <span key={id} className="prd-tag">
                  {cat?.name}
                  <button onClick={() => toggleCheckbox(id, selectedCategories, setSelectedCategories)}>✕</button>
                </span>
              );
            })}
            {(appliedMin || appliedMax) && (
              <span className="prd-tag">
                {appliedMin ? `${Number(appliedMin).toLocaleString()}₫` : "0"} —{" "}
                {appliedMax ? `${Number(appliedMax).toLocaleString()}₫` : "∞"}
                <button onClick={() => { setAppliedMin(""); setAppliedMax(""); setMinPrice(""); setMaxPrice(""); }}>✕</button>
              </span>
            )}
            {(selectedBrands.length > 0 || selectedCategories.length > 0 || appliedMin || appliedMax) && (
              <button
                className="prd-clear-all-btn"
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedCategories([]);
                  setAppliedMin("");
                  setAppliedMax("");
                  setMinPrice("");
                  setMaxPrice("");
                }}
              >
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="prd-grid">
            {products.length === 0 ? (
              <div className="prd-empty">Không có sản phẩm phù hợp</div>
            ) : (
              products.map((item) => {
                const image = item.images?.[0]?.imageUrl;
                const price = item.variants?.[0]?.price || 0;
                const outOfStock = isOutOfStock(item);
                const maxed = isMaxedOut(item);
                const cartQty = item.variants
                  ?.filter((v) => v.stock && v.stock > 0)
                  .reduce((sum, v) => sum + getCartQuantity(item.id, v.id), 0);

                // KIỂM TRA TRẠNG THÁI YÊU THÍCH VÀ SO SÁNH
                
                const isCompared = compareList.some((c) => c.id === item.id);

                return (
                  <div
                    key={item.id}
                    className="prd-card-wrapper"
                    onClick={() => navigate(`/products/detail/${item.id}`)}
                  >
                    <div className="prd-card-container">
                      {/* KHỐI NÚT YÊU THÍCH VÀ SO SÁNH */}
                      <div className="card-actions-overlay">
                        <button 
                          className="action-icon-btn" 
                          onClick={(e) => toggleCompare(item, e)}
                          title="So sánh"
                        >
                          <ArrowLeftRight 
                            size={18} 
                            color={isCompared ? "#2563eb" : "#333"} 
                          />
                        </button>
                      </div>

                      {/* Các badge hiện tại */}
                      
                      {!outOfStock && maxed && <div className="prd-out-of-stock-badge">Đã đạt giới hạn</div>}
                      {cartQty > 0 && <div className="prd-in-cart-badge">Trong giỏ: {cartQty}</div>}
                      
                      <div className="prd-card-top" style={{ backgroundImage: `url(${image})` }} />
                      <div className={`prd-card-bottom ${activeId === item.id ? "prd-clicked" : ""}`}>
                        <div className="prd-card-left">
                          <div className="prd-card-details">
                            <h1>{item.name}</h1>
                            <p>{price.toLocaleString()} ₫</p>
                          </div>
                          <div
                            className={`prd-card-buy ${maxed ? "prd-card-buy--disabled" : ""}`}
                            onClick={(e) => handleAddToCart(item, e)}
                          >
                            <ShoppingCart size={18} className="prd-cart-icon" />
                          </div>
                        </div>
                        <div className="prd-card-right">
                          <div className="prd-card-done">✔</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="prd-pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>{page}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* THANH SO SÁNH (COMPARE BAR) ĐƯỢC ĐẶT NGOÀI DIV LAYOUT CHÍNH (dưới dạng fixed bottom) */}
      <div className={`compare-sticky-bar ${compareList.length > 0 ? "visible" : ""}`}>
        <div className="compare-items-container">
          {compareList.map((item) => (
            <div key={item.id} className="compare-item-mini">
              <img src={item.images?.[0]?.imageUrl} alt="" />
              <p>{item.name}</p>
              <button className="compare-remove-btn" onClick={() => removeCompare(item.id)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="compare-actions">
          <button className="btn-compare-now" onClick={() => setIsCompareModalOpen(true)}>
            So sánh ngay ({compareList.length})
          </button>
        </div>
        <CompareModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        compareItems={compareList}
      />
      </div>
    </>
  );
};

export default Products;