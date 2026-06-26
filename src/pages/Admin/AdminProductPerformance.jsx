import React, { useState, useEffect, useCallback } from "react";
import {
  Package, Star, AlertTriangle, TrendingUp,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatUSD } from "../../utils/currency";
import "./AdminProductPerformance.css";

const ADMIN_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin`;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const toDateStr = (d) => d.toISOString().slice(0, 10);
const today = () => toDateStr(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d); };
const thisMonthStart = () => { const d = new Date(); d.setDate(1); return toDateStr(d); };
const thisYearStart = () => { const d = new Date(); d.setMonth(0, 1); return toDateStr(d); };

const QUICK_FILTERS = [
  { label: "Today",        getRange: () => [today(),          today()] },
  { label: "Last 7 Days",  getRange: () => [daysAgo(6),       today()] },
  { label: "Last 30 Days", getRange: () => [daysAgo(29),      today()] },
  { label: "This Month",   getRange: () => [thisMonthStart(), today()] },
  { label: "This Year",    getRange: () => [thisYearStart(),  today()] },
];

const LOW_STOCK_THRESHOLD = 5;
const MEDAL = { 0: "🥇", 1: "🥈", 2: "🥉" };

const getMinPrice = (product) => {
  const active = (product.variants || []).filter((v) => !v.isDeleted);
  if (!active.length) return 0;
  return Math.min(...active.map((v) => Number(v.price) || 0));
};

const getTotalStock = (product) =>
  (product.variants || []).filter((v) => !v.isDeleted).reduce((s, v) => s + (v.stock || 0), 0);

const StarRating = ({ rating }) => {
  const r = Number(rating) || 0;
  return (
    <span className="pp-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(r) ? "pp-star filled" : "pp-star"}> ★</span>
      ))}
      <span className="pp-star-num">{r > 0 ? r.toFixed(1) : "—"}</span>
    </span>
  );
};

const AdminProductPerformance = () => {
  const navigate = useNavigate();

  const [activeQuick, setActiveQuick] = useState("Last 30 Days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dateFrom, setDateFrom] = useState(daysAgo(29));
  const [dateTo, setDateTo] = useState(today());

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sellers");

  const [topSellers, setTopSellers] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const fetchAll = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const [sellersRes, ratedRes, stockRes] = await Promise.all([
        axios.get(`${ADMIN_BASE}/products/filter`, {
          params: { sortByBestSeller: true, dateFrom: from, dateTo: to, limit: 20 },
          headers: authHeader(),
        }),
        axios.get(`${ADMIN_BASE}/products/filter`, {
          params: { ratingMin: 1, statuses: "ACTIVE", limit: 30, page: 0 },
          headers: authHeader(),
        }),
        axios.get(`${ADMIN_BASE}/products/filter`, {
          params: { stockMax: LOW_STOCK_THRESHOLD, statuses: "ACTIVE", limit: 30, page: 0 },
          headers: authHeader(),
        }),
      ]);
      const sellers = (sellersRes.data.products || []).filter((p) => (p.totalSold || 0) > 0);
      setTopSellers(sellers);

      const rated = [...(ratedRes.data.products || [])]
        .filter((p) => (p.reviewCount || 0) > 0)
        .sort((a, b) => Number(b.averageRating) - Number(a.averageRating))
        .slice(0, 15);
      setTopRated(rated);

      setLowStock(stockRes.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(dateFrom, dateTo);
  }, [dateFrom, dateTo, fetchAll]);

  const handleQuick = (f) => {
    setActiveQuick(f.label);
    const [from, to] = f.getRange();
    setDateFrom(from);
    setDateTo(to);
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    setActiveQuick("");
    setDateFrom(customFrom);
    setDateTo(customTo);
  };

  const handleRefresh = () => fetchAll(dateFrom, dateTo);

  // KPIs
  const totalUnitsSold = topSellers.reduce((s, p) => s + (p.totalSold || 0), 0);
  const totalRevEst = topSellers.reduce(
    (s, p) => s + (p.totalSold || 0) * getMinPrice(p), 0
  );
  const productsWithSales = topSellers.length;
  const outOfStockVariants = lowStock.reduce(
    (s, p) => s + (p.variants || []).filter((v) => !v.isDeleted && v.stock === 0).length, 0
  );

  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <RefreshCw size={20} className="pp-spin" />
          Loading product performance data…
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      {/* Header */}
      <div className="pp-header">
        <div>
          <h1 className="pp-title">Product Performance</h1>
          <p className="pp-subtitle">Sales trends, ratings, and inventory health</p>
        </div>
        <button className="pp-refresh-btn" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? "pp-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="pp-filter-card">
        <div className="pp-quick-row">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.label}
              className={`pp-quick-btn${activeQuick === f.label ? " active" : ""}`}
              onClick={() => handleQuick(f)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="pp-custom-row">
          <span className="pp-custom-label">Custom:</span>
          <input type="date" className="pp-date-input" value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)} />
          <span className="pp-custom-label">→</span>
          <input type="date" className="pp-date-input" value={customTo}
            min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
          <button className="pp-apply-btn" onClick={handleCustomApply}
            disabled={!customFrom || !customTo}>
            Apply
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="pp-kpi-row">
        <KpiCard
          icon={<TrendingUp size={22} />}
          color="#3b82f6"
          bg="rgba(59,130,246,0.12)"
          label="Units Sold"
          value={totalUnitsSold.toLocaleString()}
          sub="Top 20 products in period"
        />
        <KpiCard
          icon={<span style={{ fontSize: 18, fontWeight: 700 }}>$</span>}
          color="#16a34a"
          bg="rgba(22,163,74,0.12)"
          label="Est. Revenue"
          value={formatUSD(totalRevEst)}
          sub="totalSold × min price"
        />
        <KpiCard
          icon={<Package size={22} />}
          color="#8b5cf6"
          bg="rgba(139,92,246,0.12)"
          label="Products with Sales"
          value={productsWithSales}
          sub={`Out of top 20 in period`}
        />
        <KpiCard
          icon={<AlertTriangle size={22} />}
          color="#f59e0b"
          bg="rgba(245,158,11,0.12)"
          label="Out-of-Stock SKUs"
          value={outOfStockVariants}
          sub={`Among low-stock products (≤${LOW_STOCK_THRESHOLD})`}
        />
      </div>

      {/* Main grid */}
      <div className="pp-main-grid">
        {/* Left: tabbed top sellers / top rated */}
        <div className="pp-card">
          <div className="pp-card-header">
            <div className="pp-tabs">
              <button
                className={`pp-tab${activeTab === "sellers" ? " pp-tab--active" : ""}`}
                onClick={() => setActiveTab("sellers")}
              >
                Top Sellers
              </button>
              <button
                className={`pp-tab${activeTab === "rated" ? " pp-tab--active" : ""}`}
                onClick={() => setActiveTab("rated")}
              >
                Top Rated
              </button>
            </div>
            <span className="pp-card-sub">
              {activeTab === "sellers"
                ? `${dateFrom} → ${dateTo}`
                : "All time · ACTIVE products"}
            </span>
          </div>

          {activeTab === "sellers" ? (
            <TopSellersTable data={topSellers} navigate={navigate} />
          ) : (
            <TopRatedTable data={topRated} navigate={navigate} />
          )}
        </div>

        {/* Right: low stock */}
        <div className="pp-card">
          <div className="pp-card-header">
            <h3 className="pp-card-title">
              <AlertTriangle size={15} style={{ color: "#f59e0b", marginRight: 6 }} />
              Low Stock Alerts
            </h3>
            <span className="pp-card-sub">Stock ≤ {LOW_STOCK_THRESHOLD} units</span>
          </div>
          <LowStockList data={lowStock} navigate={navigate} />
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const KpiCard = ({ icon, color, bg, label, value, sub }) => (
  <div className="pp-kpi-card">
    <div className="pp-kpi-icon" style={{ background: bg, color }}>
      {icon}
    </div>
    <div className="pp-kpi-body">
      <span className="pp-kpi-value">{value}</span>
      <span className="pp-kpi-label">{label}</span>
      {sub && <span className="pp-kpi-sub">{sub}</span>}
    </div>
  </div>
);

const TopSellersTable = ({ data, navigate }) => (
  <div className="pp-table-wrap">
    {data.length === 0 ? (
      <p className="pp-empty">No sales data for this period.</p>
    ) : (
      <table className="pp-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Brand</th>
            <th style={{ textAlign: "right" }}>Units Sold</th>
            <th style={{ textAlign: "right" }}>Est. Revenue</th>
            <th style={{ textAlign: "center" }}>Rating</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.id} className="pp-row"
              onClick={() => navigate(`/admin/products/${p.id}`)}
              style={{ cursor: "pointer" }}>
              <td>
                {MEDAL[i] ? (
                  <span className="pp-medal">{MEDAL[i]}</span>
                ) : (
                  <span className="pp-rank">{i + 1}</span>
                )}
              </td>
              <td>
                <div className="pp-product-cell">
                  {p.images?.[0]?.url && (
                    <img src={p.images[0].url} alt="" className="pp-thumb" />
                  )}
                  <span className="pp-product-name">{p.name}</span>
                </div>
              </td>
              <td className="pp-muted">{p.brand || "—"}</td>
              <td style={{ textAlign: "right" }} className="pp-bold">
                {(p.totalSold || 0).toLocaleString()}
              </td>
              <td style={{ textAlign: "right" }} className="pp-green">
                {formatUSD((p.totalSold || 0) * getMinPrice(p))}
              </td>
              <td style={{ textAlign: "center" }}>
                <StarRating rating={p.averageRating} />
              </td>
              <td>
                <ChevronRight size={15} className="pp-muted" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const TopRatedTable = ({ data, navigate }) => (
  <div className="pp-table-wrap">
    {data.length === 0 ? (
      <p className="pp-empty">No rated products found.</p>
    ) : (
      <table className="pp-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th>Brand</th>
            <th style={{ textAlign: "center" }}>Rating</th>
            <th style={{ textAlign: "right" }}>Reviews</th>
            <th style={{ textAlign: "right" }}>In Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.id} className="pp-row"
              onClick={() => navigate(`/admin/products/${p.id}`)}
              style={{ cursor: "pointer" }}>
              <td>
                {MEDAL[i] ? (
                  <span className="pp-medal">{MEDAL[i]}</span>
                ) : (
                  <span className="pp-rank">{i + 1}</span>
                )}
              </td>
              <td>
                <div className="pp-product-cell">
                  {p.images?.[0]?.url && (
                    <img src={p.images[0].url} alt="" className="pp-thumb" />
                  )}
                  <span className="pp-product-name">{p.name}</span>
                </div>
              </td>
              <td className="pp-muted">{p.brand || "—"}</td>
              <td style={{ textAlign: "center" }}>
                <StarRating rating={p.averageRating} />
              </td>
              <td style={{ textAlign: "right" }} className="pp-bold">
                {(p.reviewCount || 0).toLocaleString()}
              </td>
              <td style={{ textAlign: "right" }}>
                <span className={getTotalStock(p) === 0 ? "pp-red" : "pp-bold"}>
                  {getTotalStock(p).toLocaleString()}
                </span>
              </td>
              <td>
                <ChevronRight size={15} className="pp-muted" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const LowStockList = ({ data, navigate }) => {
  if (!data.length) {
    return <p className="pp-empty" style={{ color: "#16a34a" }}>All products are well stocked.</p>;
  }
  return (
    <div className="pp-stock-list">
      {data.map((p) => {
        const activeVariants = (p.variants || []).filter((v) => !v.isDeleted);
        const totalStock = activeVariants.reduce((s, v) => s + (v.stock || 0), 0);
        const outCount = activeVariants.filter((v) => v.stock === 0).length;
        const thumb = p.images?.[0]?.url;
        const isOut = totalStock === 0;
        return (
          <div
            key={p.id}
            className="pp-stock-row"
            onClick={() => navigate(`/admin/products/${p.id}`)}
          >
            <div className="pp-stock-left">
              {thumb && <img src={thumb} alt="" className="pp-stock-thumb" />}
              <div className="pp-stock-info">
                <span className="pp-stock-name">{p.name}</span>
                <span className="pp-stock-brand">{p.brand || "—"}</span>
              </div>
            </div>
            <div className="pp-stock-right">
              <span className={`pp-stock-badge ${isOut ? "pp-stock-badge--out" : "pp-stock-badge--low"}`}>
                {isOut ? "Out of stock" : `${totalStock} left`}
              </span>
              {outCount > 0 && !isOut && (
                <span className="pp-stock-sub">{outCount} SKU(s) empty</span>
              )}
            </div>
            <ChevronRight size={14} className="pp-muted" />
          </div>
        );
      })}
    </div>
  );
};

export default AdminProductPerformance;
