import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import "./Home.css";
import addToCartIcon from "../../assets/icons/cart.png";

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();
  const { cart, isOutOfStock, isMaxedOut, addItemToCart, getCartQuantity } =
    useCart();
  const [activeId, setActiveId] = useState(null);

  const productIds = [50, 51, 52, 64, 72, 73, 74, 75, 76, 77, 78, 79, 180];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const query = productIds.map((id) => `ids=${id}`).join("&");
        const res = await fetch(
          `http://localhost:8080/api/v1/products/by-ids?${query}`,
        );
        const data = await res.json();
        if (Array.isArray(data)) setFeatured(data);
        else setFeatured([]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (item, e) => {
    e.stopPropagation();
    if (isMaxedOut(item)) return;
    addItemToCart(item, navigate);
    setActiveId(item.id);
    setTimeout(() => setActiveId(null), 1500);
  };

  const renderCard = (item) => {
    const image = item.images?.[0]?.imageUrl;
    const price = item.variants?.[0]?.price || 0;
    const outOfStock = isOutOfStock(item);
    const maxed = isMaxedOut(item);

    return (
      <div
        key={item.id}
        className="home-card-wrapper"
        onClick={() => navigate(`/products/detail/${item.id}`)}
      >
        <div className="home-card-container">
          {outOfStock && (
            <div className="home-out-of-stock-badge">Hết hàng</div>
          )}
          {!outOfStock && maxed && (
            <div className="home-out-of-stock-badge">
              Đã đạt giới hạn tồn kho
            </div>
          )}
          {(() => {
            const qty = item.variants
              ?.filter((v) => v.stock && v.stock > 0)
              .reduce((sum, v) => sum + getCartQuantity(item.id, v.id), 0);
            return qty > 0 ? (
              <div className="home-in-cart-badge">Trong giỏ: {qty}</div>
            ) : null;
          })()}
          <div
            className="home-card-top"
            style={{ backgroundImage: `url(${image})` }}
          />
          <div
            className={`home-card-bottom ${activeId === item.id ? "home-clicked" : ""}`}
          >
            <div className="home-card-left">
              <div className="home-card-details">
                <h1>{item.name}</h1>
                <p>{price.toLocaleString()} ₫</p>
              </div>
              <div
                className={`home-card-buy ${maxed ? "home-card-buy--disabled" : ""}`}
                onClick={(e) => handleAddToCart(item, e)}
              >
                <img src={addToCartIcon} alt="" />
              </div>
            </div>
            <div className="home-card-right">
              <div className="home-card-done">✔</div>
            </div>
          </div>
        </div>
        <div className="home-card-inside" onClick={(e) => e.stopPropagation()}>
          <div className="home-card-icon">ℹ</div>
          <div className="home-card-contents">
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
                {/* <tr>
                  <th>Tồn kho</th>
                  <td style={{ color: outOfStock ? "red" : "inherit" }}>
                    {outOfStock ? "Hết hàng" : item.variants?.[0]?.stock}
                  </td>
                </tr> */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <section className="home-hero-section">
        <video
          className="home-hero-video"
          src="banner3.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="home-hero-overlay">
          <h1 className="home-hero-title">Just Feel The Power</h1>
          <p className="home-hero-subtitle">
            Phụ kiện chạy bộ cao cấp — tối ưu hiệu suất, thoải mái và sẵn sàng
            cho mọi cung đường.
          </p>
          <Link to="/products" className="home-btn">
            Khám phá ngay
          </Link>
        </div>
      </section>

      <section className="home-sport-section">
        <h2 className="home-section-title">Shop by Sport</h2>
        <div className="home-sport-grid">
          {featured.slice(0, 5).map(renderCard)}
        </div>
      </section>

      <section className="home-featured-section">
        <h2 className="home-section-title">Outstanding product</h2>
        <div className="home-featured-grid">
          {featured.slice(5, 13).map(renderCard)}
        </div>
      </section>

      <section className="home-icons-section">
        <div className="home-container">
          <h2 className="home-section-title">Shop by Icons</h2>
          <div className="home-scroll-row">
            {[...featured, ...featured].map((item, index) => {
              const image = item.images?.[0]?.imageUrl;
              const outOfStock = isOutOfStock(item);
              const maxed = isMaxedOut(item);
              return (
                <div
                  key={index}
                  className="home-scroll-item"
                  onClick={() => navigate(`/products/detail/${item.id}`)}
                >
                  {image && (
                    <img
                      src={image}
                      alt={item.name}
                      className="home-icon-img"
                      onLoad={(e) => {
                        const img = e.target;
                        const ratio = img.naturalWidth / img.naturalHeight;
                        if (ratio > 1.5) img.style.objectFit = "contain";
                      }}
                    />
                  )}
                  {outOfStock && (
                    <div className="home-out-of-stock-badge">Hết hàng</div>
                  )}
                  {!outOfStock && maxed && (
                    <div className="home-out-of-stock-badge">Đã đủ hàng</div>
                  )}
                  <div className="home-scroll-overlay">
                    <p>{item.name}</p>
                    <div className="home-scroll-actions">
                      <button
                        onClick={(e) => !maxed && handleAddToCart(item, e)}
                        className={`home-scroll-btn ${maxed ? "home-scroll-btn--disabled" : ""}`}
                        disabled={maxed}
                      >
                        <ShoppingCart size={16} />
                      </button>
                      <Link
                        to={`/products/detail/${item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="home-scroll-btn"
                      >
                        Mua ngay
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
