import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Truck,
  ShieldCheck,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const images = product?.images
    ? [...product.images].sort((a, b) => a.position - b.position)
    : [];

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/products/detail/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setSelectedVariant(data.variants?.[0]);
      })
      .catch(console.error);
  }, [id]);

  if (!product)
    return (
      <p style={{ textAlign: "center", marginTop: "5rem", color: "#aaa" }}>
        Loading...
      </p>
    );

  const image = images?.[0]?.imageUrl;
  const price = selectedVariant?.price || 0;
  const category = product.categories?.[0]?.name || "";
  const optionName = product.option1Name;
  const variants = product.variants || [];

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const cartItem = {
      id: product.id,
      name: product.name,
      price: selectedVariant.price,
      image: image,
      variantId: selectedVariant.id,
      option: selectedVariant.option1Value,
    };

    addToCart(cartItem, quantity);

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`, {
      action: {
        label: "Xem giỏ hàng",
        onClick: () => navigate("/cart"),
      },
    });
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;

    const cartItem = {
      id: product.id,
      name: product.name,
      price: selectedVariant.price,
      image: image,
      variantId: selectedVariant.id,
      option: selectedVariant.option1Value,
    };

    addToCart(cartItem, quantity);
    navigate("/cart");
  };

  const advantages = [
    { icon: <Package size={20} />, text: "Đóng gói cẩn thận" },
    { icon: <Truck size={20} />, text: "Giao hàng nhanh" },
    { icon: <ShieldCheck size={20} />, text: "Đảm bảo chất lượng" },
  ];

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  return (
    <div className="pd-wrapper">
      <div className="pd-main">
        <div className="pd-image-section">
          {image && (
            <div className="pd-main-image-box">
              <img
                src={images[activeImage]?.imageUrl}
                alt={product.name}
                className="pd-main-image"
              />
            </div>
          )}

          <div className="pd-thumb-list">
            {images.map((img, index) => (
              <div
                key={index}
                className={`pd-thumb ${activeImage === index ? "active" : ""}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={img.imageUrl} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="pd-info">
          <h1 className="pd-title">{product.name}</h1>

          <p className="pd-price">{price.toLocaleString()} ₫</p>

          <p className="pd-category">{category}</p>

          {optionName && (
            <div className="pd-variant">
              <p className="pd-variant-title">{optionName}:</p>

              <div className="pd-variant-list">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    className={`pd-variant-item ${
                      selectedVariant?.id === v.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.option1Value}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pd-qty-row">
            <span>Số lượng:</span>

            <div className="pd-qty-box">
              <button onClick={decrement}>
                <Minus size={16} />
              </button>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="pd-qty-input"
              />

              <button onClick={increment}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="pd-action-buttons">
            <button onClick={handleAddToCart} className="pd-add-btn">
              <ShoppingCart size={20} /> Thêm vào giỏ
            </button>

            <button onClick={handleBuyNow} className="pd-buy-btn">
              Mua ngay
            </button>
          </div>

          <div className="pd-advantages">
            {advantages.map((adv, idx) => (
              <div key={idx} className="pd-adv-item">
                {adv.icon}
                <span>{adv.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pd-desc">
        <h2>Mô tả sản phẩm</h2>

        <div
          dangerouslySetInnerHTML={{ __html: product.description }}
          className="pd-desc-content"
        />
      </div>
    </div>
  );
};

export default ProductDetail;