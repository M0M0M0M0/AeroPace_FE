import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import axios from "../api/axiosClient";
import "./HistoricalProductDetail.css";

const getUniqueValues = (variants, key, optionKeys, selected) => {
  const currentIndex = optionKeys.indexOf(key);
  const filtered = variants.filter((v) => {
    for (let i = 0; i < currentIndex; i++) {
      const prevKey = optionKeys[i];
      if (selected[prevKey] && v[prevKey] !== selected[prevKey]) return false;
    }
    return true;
  });
  const values = filtered.map((v) => v[key]).filter((v) => v && v.trim() !== "");
  return [...new Set(values)];
};

const findMatchingVariant = (variants, selected, optionKeys) =>
  variants.find((v) => optionKeys.every((key) => !selected[key] || v[key] === selected[key]));

const HistoricalProductDetail = () => {
  const { orderCode, productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState({});
  const [activeImage, setActiveImage] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios
      .get(`/products/historical/${productId}`, { params: { orderCode } })
      .then((res) => {
        const data = res.data;
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
      .catch(() => setError(true));
  }, [productId, orderCode]);

  if (error)
    return (
      <div className="hpd-wrapper">
        <div style={{ textAlign: "center", marginTop: "5rem", color: "#aaa" }}>
          <p>Product snapshot not found.</p>
          <button className="hpd-back-btn" style={{ margin: "16px auto 0" }} onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Back to Order
          </button>
        </div>
      </div>
    );

  if (!product)
    return <p style={{ textAlign: "center", marginTop: "5rem", color: "#aaa" }}>Loading...</p>;

  const images = [...(product.images || [])].sort((a, b) => a.position - b.position);
  const variants = product.variants || [];
  const optionDefs = [
    { name: product.option1Name, key: "option1Value" },
    { name: product.option2Name, key: "option2Value" },
    { name: product.option3Name, key: "option3Value" },
  ].filter((o) => o.name);
  const optionKeys = optionDefs.map((o) => o.key);
  const selectedVariant = findMatchingVariant(variants, selected, optionKeys);
  const price = selectedVariant?.price ?? variants[0]?.price ?? 0;
  const comparePrice = selectedVariant?.comparePrice ?? variants[0]?.comparePrice;

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

  return (
    <div className="hpd-wrapper">
      <div className="hpd-banner">
        <Clock size={14} />
        <span>
          This is the product snapshot at the time you placed order{" "}
          <strong>#{orderCode}</strong> — may differ from the current product.
        </span>
        <button className="hpd-banner-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={13} /> Back to order
        </button>
      </div>

      <div className="hpd-main">
        <div className="hpd-image-section">
          <div className="hpd-main-image-box">
            <img
              src={images[activeImage]?.imageUrl}
              alt={product.name}
              className="hpd-main-image"
            />
          </div>
          <div className="hpd-thumb-list">
            {images.map((img, index) => (
              <div
                key={index}
                className={`hpd-thumb ${activeImage === index ? "active" : ""}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={img.imageUrl} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="hpd-info">
          <h1 className="hpd-title">{product.name}</h1>
          {product.brand && <p className="hpd-brand">{product.brand}</p>}

          <div className="hpd-price-row">
            <p className="hpd-price">{Number(price).toLocaleString()} ₫</p>
            {comparePrice && Number(comparePrice) > Number(price) && (
              <p className="hpd-compare-price">{Number(comparePrice).toLocaleString()} ₫</p>
            )}
          </div>

          {optionDefs.map(({ name, key }) => {
            const values = getUniqueValues(variants, key, optionKeys, selected);
            if (values.length === 0) return null;
            return (
              <div key={key} className="hpd-variant">
                <p className="hpd-variant-title">
                  {name}: <span className="hpd-variant-selected">{selected[key]}</span>
                </p>
                <div className="hpd-variant-list">
                  {values.map((val) => (
                    <button
                      key={val}
                      className={`hpd-variant-item ${selected[key] === val ? "active" : ""}`}
                      onClick={() => handleSelectOption(key, val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <button className="hpd-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to Order
          </button>
        </div>
      </div>

      {product.description && (
        <div className="hpd-desc">
          <h2>Product Description</h2>
          <div
            dangerouslySetInnerHTML={{ __html: product.description }}
            className={`hpd-desc-content ${descExpanded ? "hpd-desc-expanded" : "hpd-desc-collapsed"}`}
          />
          <button
            className="hpd-desc-toggle"
            onClick={() => setDescExpanded((v) => !v)}
          >
            {descExpanded ? "Show less ▲" : "Show more ▼"}
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoricalProductDetail;
