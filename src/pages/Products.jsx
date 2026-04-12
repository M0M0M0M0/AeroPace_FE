import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import "./Products.css";

const Products = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

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

  // ================= FETCH FILTER DATA =================
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

  // ================= FETCH PRODUCTS =================
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
          url = `http://localhost:8080/api/v1/products/filter?${params.toString()}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        setProducts(data.products || data.content || []);
        setTotalPages(data.totalPages || 1);
        console.log(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, [
    selectedBrands,
    selectedCategories,
    appliedMin,
    appliedMax,
    page,
    searchParams,
  ]);

  // ================= RESET PAGE =================
  useEffect(() => {
    setPage(1);
  }, [
    selectedCategories,
    selectedBrands,
    appliedMin,
    appliedMax,
    searchParams,
  ]);

  // ================= SCROLL TO TOP =================
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
  return (
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
            <button
              className="prd-clear-btn"
              onClick={() => setSelectedCategories([])}
            >
              Uncheck all
            </button>
          </div>
          <div className="prd-filter-list">
            {categories.map((cat) => (
              <label key={cat.id} className="prd-filter-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() =>
                    toggleCheckbox(
                      cat.id,
                      selectedCategories,
                      setSelectedCategories,
                    )
                  }
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="prd-filter-group">
          <div className="prd-filter-header">
            <p>Brand</p>
            <button
              className="prd-clear-btn"
              onClick={() => setSelectedBrands([])}
            >
              Uncheck all
            </button>
          </div>
          <div className="prd-filter-list">
            {brands.map((brand) => (
              <label key={brand.id} className="prd-filter-item">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() =>
                    toggleCheckbox(brand.id, selectedBrands, setSelectedBrands)
                  }
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
                <button
                  onClick={() =>
                    toggleCheckbox(id, selectedBrands, setSelectedBrands)
                  }
                >
                  ✕
                </button>
              </span>
            );
          })}
          {selectedCategories.map((id) => {
            const cat = categories.find((c) => c.id === id);
            return (
              <span key={id} className="prd-tag">
                {cat?.name}
                <button
                  onClick={() =>
                    toggleCheckbox(
                      id,
                      selectedCategories,
                      setSelectedCategories,
                    )
                  }
                >
                  ✕
                </button>
              </span>
            );
          })}
          {(appliedMin || appliedMax) && (
            <span className="prd-tag">
              {appliedMin ? `${Number(appliedMin).toLocaleString()}₫` : "0"} —{" "}
              {appliedMax ? `${Number(appliedMax).toLocaleString()}₫` : "∞"}
              <button
                onClick={() => {
                  setAppliedMin("");
                  setAppliedMax("");
                  setMinPrice("");
                  setMaxPrice("");
                }}
              >
                ✕
              </button>
            </span>
          )}
          {(selectedBrands.length > 0 ||
            selectedCategories.length > 0 ||
            appliedMin ||
            appliedMax) && (
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
              return (
                <div
                  key={item.id}
                  className="prd-card-wrapper"
                  onClick={() => navigate(`/products/detail/${item.id}`)}
                >
                  <div className="prd-card-container">
                    <div
                      className="prd-card-top"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                    <div
                      className={`prd-card-bottom ${activeId === item.id ? "prd-clicked" : ""}`}
                    >
                      <div className="prd-card-left">
                        <div className="prd-card-details">
                          <h1>{item.name}</h1>
                          <p>{price.toLocaleString()} ₫</p>
                        </div>
                        <div
                          className="prd-card-buy"
                          onClick={(e) => {
                            e.stopPropagation();
                            const defaultVariant = item.variants?.[0];
                            if (!defaultVariant) {
                              alert("Sản phẩm chưa có biến thể");
                              return;
                            }
                            addToCart(
                              { id: item.id, variantId: defaultVariant.id },
                              1,
                            );
                            setActiveId(item.id);
                            setTimeout(() => setActiveId(null), 1500);
                          }}
                        >
                          <ShoppingCart size={18} className="prd-cart-icon" />
                        </div>
                      </div>
                      <div className="prd-card-right">
                        <div className="prd-card-done">✔</div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="prd-card-inside"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="prd-card-icon">ℹ</div>
                    <div className="prd-card-contents">
                      <table>
                        <tbody>
                          <tr>
                            <th>Category</th>
                            <td>{item.categories?.[0]?.name || "N/A"}</td>
                          </tr>
                          <tr>
                            <th>Brand</th>
                            <td>{item.brand || "N/A"}</td>
                          </tr>
                          <tr>
                            <th>Price</th>
                            <td>{price.toLocaleString()} ₫</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="prd-pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span>{page}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;
