import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, ArrowLeftRight, X } from "lucide-react"; 
import { usePreferences } from "../components/UsePreferences";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import "./Home.css";
import addToCartIcon from "../../assets/icons/cart.png";
import CompareModal from "../components/CompareModal";  

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();
  const { cart, isOutOfStock, isMaxedOut, addItemToCart, getCartQuantity } =
    useCart();
  const [activeId, setActiveId] = useState(null);

  const productIds = [50, 51, 52, 64, 72, 180,448,449,450,451,1482,10,210,211,212,213,184,185,186,187,188];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const query = productIds.map((id) => `ids=${id}`).join("&");
        const res = await fetch(
          `http://localhost:8080/api/v1/products/by-ids?${query}`,
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = productIds
            .map((id) => data.find((p) => p.id === id))
            .filter(Boolean);
          setFeatured(sorted);
        }
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
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const { compareList, toggleCompare, removeCompare, clearCompare } = usePreferences();

  const renderCard = (item) => {
    const defaultImage = item.images?.[0]?.imageUrl;
    const hoverImage = item.images?.[1]?.imageUrl || defaultImage;
    const price = item.variants?.[0]?.price || 0;
    const outOfStock = isOutOfStock(item);
    const maxed = isMaxedOut(item);
    
   
    const isCompared = compareList.some((c) => c.id === item.id);

    return (
      <div
        key={item.id}
        className="home-card-wrapper"
        onClick={() => navigate(`/products/detail/${item.id}`)}
      >
        <div className="home-card-container">
          
          {(() => {
            const qty = item.variants
              ?.filter((v) => v.stock && v.stock > 0)
              .reduce((sum, v) => sum + getCartQuantity(item.id, v.id), 0);
            return qty > 0 ? (
              <div className="home-in-cart-badge">Trong giỏ: {qty}</div>
            ) : null;
          })()}
          
          {/* 2. THAY THẾ PHẦN div.home-card-top CŨ BẰNG ĐOẠN NÀY */}
          <div className="home-card-top">
            {/* THÊM KHỐI NÚT ACTION VÀO ĐÂY */}
            <div className="card-actions-overlay">
              <button className="action-icon-btn" onClick={(e) => toggleCompare(item, e)}>
                <ArrowLeftRight size={18} color={isCompared ? "#2563eb" : "#333"} />
              </button>
            </div>

            <div className="home-img-default" style={{ backgroundImage: `url(${defaultImage})` }} />
            <div className="home-img-hover" style={{ backgroundImage: `url(${hoverImage})` }} />
          </div>
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
            High-end running equipment — optimized performance, comfort, and ready
            for any trail.
          </p>
          <Link to="/products" className="home-btn">
            Explore Now
          </Link>
        </div>
      </section>

      <section className="home-sport-section">
        <h2 className="home-section-title">Running Shoes</h2>
        <div className="home-sport-grid">
          {featured.slice(0, 5).map(renderCard)}
        </div>
      </section>

      <section className="home-sport-section">
        <h2 className="home-section-title">Running Sandals</h2>
        <div className="home-sport-grid">
          {featured.slice(6, 11).map(renderCard)}
        </div>
      </section>

      <section className="home-sport-section">
        <h2 className="home-section-title">Sports Glasses</h2>
        <div className="home-sport-grid">
          {featured.slice(11, 16).map(renderCard)}
        </div>
      </section>

      <section className="home-sport-section">
        <h2 className="home-section-title">Sports Watches</h2>
        <div className="home-sport-grid">
          {featured.slice(16, 22).map(renderCard)}
        </div>
      </section>

      {/* <section className="home-featured-section">
        <h2 className="home-section-title">Outstanding product</h2>
        <div className="home-featured-grid">
          {featured.slice(5, 13).map(renderCard)}
        </div>
      </section> */}

      

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
                    <div className="home-out-of-stock-badge">Out of Stock</div>
                  )}
                  {!outOfStock && maxed && (
                    <div className="home-out-of-stock-badge">Maxed Out</div>
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
                        Buy Now
                      </Link>
                    </div>
                  </div>
                </div>
                
              );
            })}
          </div>
        </div>
      </section>
      <div className={`compare-sticky-bar ${compareList.length > 0 ? "visible" : ""}`}>
        <div className="compare-items-container">
          {compareList.map((item) => (
            <div key={item.id} className="compare-item-mini">
              <img src={item.images?.[0]?.imageUrl} alt="" />
              <p>{item.name}</p>
              <button className="compare-remove-btn" onClick={() => removeCompare(item.id)}><X size={12} /></button>
            </div>
          ))}
        </div>
        <div className="compare-actions">
          <button className="btn-clear-all" onClick={clearCompare}>
            Clear All
          </button>
          <button className="btn-compare-now" onClick={() => setIsCompareModalOpen(true)}>
            Compare Now ({compareList.length})
          </button>
        </div>
      </div>
      <CompareModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        compareItems={compareList}
      />
    </div>
      
  );
};

export default Home;
