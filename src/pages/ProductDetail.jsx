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

const getUniqueValues = (variants, key, optionKeys, selected) => {
  const currentIndex = optionKeys.indexOf(key);

  const filtered = variants.filter((v) => {
    for (let i = 0; i < currentIndex; i++) {
      const prevKey = optionKeys[i];
      if (selected[prevKey] && v[prevKey] !== selected[prevKey]) {
        return false;
      }
    }
    return true;
  });

  const values = filtered
    .map((v) => v[key])
    .filter((v) => v && v.trim() !== "");
  return [...new Set(values)];
};

const findMatchingVariant = (variants, selected, optionKeys) => {
  return variants.find((v) =>
    optionKeys.every((key) => !selected[key] || v[key] === selected[key]),
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, getCartQuantity, isOutOfStock } = useCart();

  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const images = product?.images
    ? [...product.images].sort((a, b) => a.position - b.position)
    : [];


  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/products/detail/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        const first = data.variants?.[0];
        if (first) {
          const init = {};
          if (data.option1Name) init.option1Value = first.option1Value;
          if (data.option2Name) init.option2Value = first.option2Value;
          if (data.option3Name) init.option3Value = first.option3Value;
          setSelected(init);
        }
      })
      .catch(console.error);
  }, [id]);

  // Reset quantity về 1 khi đổi variant
  useEffect(() => {
    setQuantity(1);
  }, [selected]);

  if (!product)
    return (
      <p style={{ textAlign: "center", marginTop: "5rem", color: "#aaa" }}>
        Loading...
      </p>
    );

  const variants = product.variants || [];

  const optionDefs = [
    { name: product.option1Name, key: "option1Value" },
    { name: product.option2Name, key: "option2Value" },
    { name: product.option3Name, key: "option3Value" },
  ].filter((o) => o.name);

  const optionKeys = optionDefs.map((o) => o.key);
  const selectedVariant = findMatchingVariant(variants, selected, optionKeys);

  const price = selectedVariant?.price || variants[0]?.price || 0;
  const maxStock = selectedVariant?.stock ?? 0;
  const category = product.categories?.[0]?.name || "";
  const image = images?.[0]?.imageUrl;

  // Số lượng variant này đang có trong giỏ
  const inCart = selectedVariant
    ? getCartQuantity(product.id, selectedVariant.id)
    : 0;

  // Số lượng tối đa còn có thể thêm vào giỏ
  const effectiveMax = Math.max(0, maxStock - inCart);

  const handleSelectOption = (key, value) => {
    const newSelected = { ...selected, [key]: value };
    const match = findMatchingVariant(variants, newSelected, optionKeys);
    if (!match) {
      const fallback = variants.find((v) => v[key] === value);
      if (fallback) {
        const filled = { ...newSelected };
        optionKeys.forEach((k) => {
          if (!filled[k] || !findMatchingVariant(variants, filled, optionKeys))
            filled[k] = fallback[k];
        });
        setSelected(filled);
        return;
      }
    }
    setSelected(newSelected);
  };

  const isAvailable = (key, value) => {
    return variants.some((variant) => {
      if (variant[key] !== value) return false;

      for (const optionKey of optionKeys) {
        if (optionKey === key) break;

        if (
          selected[optionKey] &&
          variant[optionKey] !== selected[optionKey]
        ) {
          return false;
        }
      }

      return variant.stock > 0;
    });
  };

  // Lấy số trong giỏ cho một variant cụ thể (dùng cho badge trên button)
  const getVariantInCart = (key, value) => {
    const test = { ...selected, [key]: value };
    const variant = findMatchingVariant(variants, test, optionKeys);
    if (!variant) return 0;
    return getCartQuantity(product.id, variant.id);
  };

  const clamp = (val) => Math.min(Math.max(1, val), effectiveMax);
  const decrement = () => setQuantity((q) => clamp(q - 1));
  const increment = () => setQuantity((q) => clamp(q + 1));
  const handleQtyInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return setQuantity(1);
    setQuantity(clamp(val));
  };

  const handleAddToCart = () => {
    if (!selectedVariant || effectiveMax === 0) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        image,
        variantId: selectedVariant.id,
        option: selectedVariant.option1Value,
      },
      quantity,
    );
    toast.success(`Add "${product.name}" to cart!`, {
      action: { label: "View Cart", onClick: () => navigate("/cart") },
    });
  };

  const handleBuyNow = () => {
    if (!selectedVariant || maxStock === 0) return;
    if (effectiveMax > 0) {
      addToCart(
        {
          id: product.id,
          name: product.name,
          price: selectedVariant.price,
          image,
          variantId: selectedVariant.id,
          option: selectedVariant.option1Value,
        },
        quantity,
      );
    }
    navigate("/cart");
  };

  const advantages = [
    { icon: <Package size={20} />, text: "Careful Packaging" },
    { icon: <Truck size={20} />, text: "Fast Shipping" },
    { icon: <ShieldCheck size={20} />, text: "Quality Guarantee" },
  ];

  return (
    <div className="pd-wrapper">
      <div className="pd-main">
        <div className="pd-image-section">
          <div className="pd-main-image-box">
            <img
              src={images[activeImage]?.imageUrl}
              alt={product.name}
              className="pd-main-image"
            />
          </div>
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

          {optionDefs.map(({ name, key }) => {
            const values = getUniqueValues(variants, key, optionKeys, selected);
            if (values.length === 0) return null;
            return (
              <div key={key} className="pd-variant">
                <p className="pd-variant-title">
                  {name}:{" "}
                  <span className="pd-variant-selected">{selected[key]}</span>
                </p>
                <div className="pd-variant-list">
                  {values.map((val) => {
                    const available = isAvailable(key, val);
                    const active = selected[key] === val;
                    const variantInCart = getVariantInCart(key, val);
                    return (
                      <button
                        key={val}
                        className={`pd-variant-item ${active ? "active" : ""} ${!available ? "disabled" : ""}`}
                        onClick={() =>
                          available && handleSelectOption(key, val)
                        }
                        disabled={!available}
                        style={{ position: "relative" }}
                      >
                        {val}
                        {variantInCart > 0 && (
                          <span className="pd-variant-in-cart-badge">
                            {variantInCart}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {selectedVariant && (
            <div className="pd-stock-row">
              <p className="pd-stock">
                {maxStock > 0 ? (
                  `In Stock: ${maxStock} items`
                ) : (
                  <span className="pd-out-of-stock">Out of Stock</span>
                )}
              </p>
              {inCart > 0 && (
                <p className="pd-in-cart-info">
                  <ShoppingCart size={14} />
                  Currently in cart: <strong>{inCart}</strong>
                  {effectiveMax === 0 && maxStock > 0 && (
                    <span className="pd-maxed-label"> · Maximum reached</span>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="pd-qty-row">
            <span>Quantity:</span>
            <div className="pd-qty-box">
              <button
                onClick={decrement}
                disabled={quantity <= 1 || effectiveMax === 0}
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min="1"
                max={effectiveMax}
                value={quantity}
                onChange={handleQtyInput}
                className="pd-qty-input"
                disabled={effectiveMax === 0}
              />
              <button
                onClick={increment}
                disabled={quantity >= effectiveMax || effectiveMax === 0}
              >
                <Plus size={16} />
              </button>
            </div>
            {effectiveMax > 0 && quantity >= effectiveMax && (
              <span className="pd-qty-max">Maximum available: {effectiveMax}</span>
            )}
          </div>

          <div className="pd-action-buttons">
            <button
              onClick={handleAddToCart}
              className="pd-add-btn"
              disabled={!selectedVariant || effectiveMax === 0}
            >
              <ShoppingCart size={20} /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="pd-buy-btn"
              disabled={!selectedVariant || maxStock === 0}
            >
              Buy Now
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
        <h2>Product Description</h2>
        <div
          dangerouslySetInnerHTML={{ __html: product.description }}
          className="pd-desc-content"
        />
      </div>
    </div>
  );
};

export default ProductDetail;