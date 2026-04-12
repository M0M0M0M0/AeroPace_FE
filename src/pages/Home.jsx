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
  const { addToCart } = useCart();
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
        // console.log("API:", data);

        if (Array.isArray(data)) {
          setFeatured(data);
        } else {
          setFeatured([]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (item, e) => {
    e.stopPropagation();

    try {
      await addToCart(
        {
          id: item.id,
          variantId: item.variants?.[0]?.id || null,
        },
        1,
      );

      toast.success(`Đã thêm ${item.name} vào giỏ hàng!`, {
        action: {
          label: "Xem giỏ hàng",
          onClick: () => navigate("/cart"),
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Thêm vào giỏ hàng thất bại");
    }
  };

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero-section">
        <video
          className="hero-video"
          src="banner3.mp4"
          autoPlay
          loop
          muted
          playsInline
          type="video/mp4"
        />
        <div className="hero-overlay">
          <h1 className="hero-title">Just Feel The Power</h1>
          <p className="hero-subtitle">
            Phụ kiện chạy bộ cao cấp — tối ưu hiệu suất, thoải mái và sẵn sàng
            cho mọi cung đường.
          </p>
          <Link to="/products" className="btn">
            Khám phá ngay
          </Link>
        </div>
      </section>

      {/* SPORT */}
      <section className="sport-section sport-container">
        <h2 className="section-title">Shop by Sport</h2>

        <div className="sport-grid">
          {featured.slice(0, 5).map((item) => {
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
                    className={`card-bottom ${
                      activeId === item.id ? "clicked" : ""
                    }`}
                  >
                    <div className="card-left">
                      <div className="card-details">
                        <h1>{item.name}</h1>
                        <p>{price.toLocaleString()} ₫</p>
                      </div>

                      <div
                        className="card-buy"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item, e);
                          setActiveId(item.id);
                          setTimeout(() => setActiveId(null), 1500);
                        }}
                      >
                        <img src={addToCartIcon} alt="" />
                      </div>
                    </div>

                    <div className="card-right">
                      <div className="card-done">✔</div>
                    </div>
                  </div>
                </div>

                {/* INFO */}
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
          })}
        </div>
      </section>

      {/* FEATURED */}
      <section className="featured-section container">
        <h2 className="section-title">Outstanding product</h2>

        <div className="featured-grid">
          {featured.slice(5, 13).map((item) => {
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
                    className={`card-bottom ${
                      activeId === item.id ? "clicked" : ""
                    }`}
                  >
                    <div className="card-left">
                      <div className="card-details">
                        <h1>{item.name}</h1>
                        <p>{price.toLocaleString()} ₫</p>
                      </div>

                      <div
                        className="card-buy"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item, e);
                          setActiveId(item.id);
                          setTimeout(() => setActiveId(null), 1500);
                        }}
                      >
                        <img src={addToCartIcon} alt="" />
                      </div>
                    </div>

                    <div className="card-right">
                      <div className="card-done">✔</div>
                    </div>
                  </div>
                </div>

                {/* INFO */}
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
          })}
        </div>
      </section>

      {/* ICONS */}
      <section className="icons-section">
        <div className="container">
          <h2 className="section-title">Shop by Icons</h2>

          <div className="scroll-row">
            {[...featured, ...featured].map((item, index) => {
              const image = item.images?.[0]?.imageUrl;

              return (
                <div
                  key={index}
                  className="scroll-item"
                  onClick={() => navigate(`/products/detail/${item.id}`)}
                >
                  {image && (
                    <img
                      src={image}
                      alt={item.name}
                      className="icon-img"
                      onLoad={(e) => {
                        const img = e.target;
                        const ratio = img.naturalWidth / img.naturalHeight;

                        if (ratio > 1.5) {
                          img.style.objectFit = "contain";
                        }
                      }}
                    />
                  )}

                  <div className="scroll-overlay">
                    <p>{item.name}</p>

                    <div className="scroll-actions">
                      <button
                        onClick={(e) => handleAddToCart(item, e)}
                        className="scroll-btn"
                      >
                        <ShoppingCart size={16} />
                      </button>

                      <Link
                        to={`/products/detail/${item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="scroll-btn"
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
