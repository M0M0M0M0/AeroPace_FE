import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  // ================= FETCH FILTER DATA =================
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [brandRes, categoryRes] = await Promise.all([
          fetch("http://localhost:8080/api/v1/brands"),
          fetch("http://localhost:8080/api/v1/categories"),
        ]);

        const brandData = await brandRes.json();
        const categoryData = await categoryRes.json();

        setBrands(brandData || []);
        setCategories(categoryData || []);
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
        const hasFilter =
          selectedBrands.length > 0 ||
          selectedCategories.length > 0 ||
          appliedMin ||
          appliedMax;

        let url = "";

        if (!hasFilter) {
          url = `http://localhost:8080/api/v1/products/detail?page=${page - 1}`;
        } else {
          const params = new URLSearchParams();

          if (selectedBrands.length > 0) {
            selectedBrands.forEach((id) => params.append("brands", id));
          }

          if (selectedCategories.length > 0) {
            selectedCategories.forEach((id) => params.append("categories", id));
          }

          if (appliedMin) params.append("minPrice", appliedMin);
          if (appliedMax) params.append("maxPrice", appliedMax);

          params.append("page", page - 1);

          url = `http://localhost:8080/api/v1/products/filter?${params.toString()}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        const productList = data.products || data.content || [];

        setProducts(productList);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, [selectedBrands, selectedCategories, appliedMin, appliedMax, page]);

  // ================= RESET PAGE =================
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, selectedBrands, appliedMin, appliedMax]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

  return (
    <div className="products-layout">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h3 className="filter-title">Filter</h3>

        {/* CATEGORY */}
        <div className="filter-group">
          <div className="filter-header">
            <p>Category</p>
            <button
              className="clear-btn"
              onClick={() => setSelectedCategories([])}
            >
              Uncheck all
            </button>
          </div>

          <div className="filter-list">
            {categories.map((cat) => (
              <label key={cat.id} className="filter-item">
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

        {/* BRAND */}
        <div className="filter-group">
          <div className="filter-header">
            <p>Brand</p>
            <button className="clear-btn" onClick={() => setSelectedBrands([])}>
              Uncheck all
            </button>
          </div>

          <div className="filter-list">
            {brands.map((brand) => (
              <label key={brand.id} className="filter-item">
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

        {/* PRICE */}
        <div className="filter-group">
          <p>Price (VND)</p>
          <div className="price-inputs">
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

          <button
            onClick={applyPrice}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "6px",
              borderRadius: "6px",
              border: "none",
              background: "#fff",
              color: "#000",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="products-content">
        <div className="featured-grid">
          {products.length === 0 ? (
            <div className="no-product">Không có sản phẩm phù hợp</div>
          ) : (
            products.map((item) => {
              const image = item.images?.[0]?.imageUrl;
              const price = item.variants?.[0]?.price || 0;

              return (
                <div
                  key={item.id}
                  className="card-wrapper"
                  onClick={() => navigate(`/products/detail/${item.id}`)}
                >
                  <div className="card-container">
                    <div
                      className="card-top"
                      style={{ backgroundImage: `url(${image})` }}
                    />

                    <div
                      className={`card-bottom ${activeId === item.id ? "clicked" : ""}`}
                    >
                      <div className="card-left">
                        <div className="card-details">
                          <h1>{item.name}</h1>
                          <p>{price.toLocaleString()} ₫</p>
                        </div>

                        {/* ADD TO CART */}
                        <div
                          className="card-buy"
                          onClick={(e) => {
                            e.stopPropagation();

                            const defaultVariant = item.variants?.[0];

                            if (!defaultVariant) {
                              alert("Sản phẩm chưa có biến thể");
                              return;
                            }

                            addToCart(
                              {
                                id: item.id,
                                variantId: defaultVariant.id,
                              },
                              1,
                            );

                            setActiveId(item.id);
                            setTimeout(() => setActiveId(null), 1500);
                          }}
                        >
                          <ShoppingCart size={18} className="product-cart-icon"/>
                        </div>
                      </div>

                      <div className="card-right">
                        <div className="card-done">✔</div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="card-inside"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="card-icon">ℹ</div>

                    <div className="card-contents">
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

        {/* PAGINATION */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>

          <span>{page}</span>

          <button onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default Products;
