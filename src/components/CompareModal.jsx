import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Thêm import này
import { X } from "lucide-react";

const CompareModal = ({ isOpen, onClose, compareItems }) => {
  const [detailedProducts, setDetailedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && compareItems.length > 0) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const query = compareItems.map((item) => `ids=${item.id}`).join("&");
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/products/by-ids?${query}`);
          const data = await res.json();
          setDetailedProducts(data);
        } catch (err) {
          console.error("Error retrieving comparison data:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, compareItems]);

  if (!isOpen) return null;

  // Sử dụng createPortal để đưa Modal ra lớp ngoài cùng của trình duyệt
  return createPortal(
    <div className="compare-modal-overlay" onClick={onClose}>
      <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal-header">
          <h2>Comparing Products</h2>
          <button className="close-modal-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="compare-modal-body">
          {loading ? (
            <div className="loading-spinner">Loading data...</div>
          ) : (
            <table className="compare-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "120px" }}>Features</th>
                  {detailedProducts.map((p) => (
                    <th key={p.id}>
                      <img src={p.images?.[0]?.imageUrl} alt={p.name} />
                      <p>{p.name}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Price</td>
                  {detailedProducts.map((p) => (
                    <td key={p.id} className="compare-price">
                      {p.variants?.[0]?.price?.toLocaleString()} ₫
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Brand</td>
                  {detailedProducts.map((p) => (
                    <td key={p.id}>{p.brand || "Updating"}</td>
                  ))}
                </tr>
                <tr>
                  <td>Category</td>
                  {detailedProducts.map((p) => (
                    <td key={p.id}>{p.categories?.[0]?.name || "N/A"}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body // Bắn code ra thẻ body
  );
};

export default CompareModal;