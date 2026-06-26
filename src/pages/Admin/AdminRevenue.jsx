import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, ShoppingBag, Package, TrendingUp,
  RefreshCw, ChevronDown,
} from "lucide-react";
import axios from "axios";
import { formatUSD } from "../../utils/currency";
import "./AdminRevenue.css";

const ADMIN_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin`;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// ── date helpers ──────────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().slice(0, 10);
const today = () => toDateStr(new Date());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d); };
const thisMonthStart = () => { const d = new Date(); d.setDate(1); return toDateStr(d); };
const thisYearStart  = () => { const d = new Date(); d.setMonth(0, 1); return toDateStr(d); };

const QUICK_FILTERS = [
  { label: "Today",       getRange: () => [today(),          today()] },
  { label: "Last 7 Days", getRange: () => [daysAgo(6),       today()] },
  { label: "Last 30 Days",getRange: () => [daysAgo(29),      today()] },
  { label: "This Month",  getRange: () => [thisMonthStart(), today()] },
  { label: "This Year",   getRange: () => [thisYearStart(),  today()] },
];

const fmtShort = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K`
  : String(n || 0);

// ── Line chart with hover tooltip ────────────────────────────────────────────
const RevenueChart = ({ points }) => {
  const [tip, setTip] = useState(null);
  const svgRef = useRef(null);

  if (!points.length) return <p className="rv-empty">No data for this period.</p>;

  const W = 620, H = 200, PAD = { t: 20, r: 16, b: 40, l: 64 };
  const maxV = Math.max(...points.map((p) => p.value), 1);
  const xs = points.map((_, i) =>
    PAD.l + (i / Math.max(points.length - 1, 1)) * (W - PAD.l - PAD.r)
  );
  const ys = points.map((p) =>
    PAD.t + (1 - p.value / maxV) * (H - PAD.t - PAD.b)
  );
  const path = points.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${xs[xs.length - 1].toFixed(1)},${H - PAD.b} L${xs[0].toFixed(1)},${H - PAD.b} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    v: maxV * f,
    y: PAD.t + (1 - f) * (H - PAD.t - PAD.b),
  }));

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0, minDist = Infinity;
    xs.forEach((x, i) => {
      const d = Math.abs(x - mouseX);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    setTip({ x: xs[nearest], y: ys[nearest], label: points[nearest].label, value: points[nearest].value });
  };

  const TIP_W = 130, TIP_H = 46;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="rv-linechart"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTip(null)}
    >
      <defs>
        <linearGradient id="rvGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* grid lines + y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y}
            stroke="var(--rv-grid)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={PAD.l - 8} y={t.y + 4} textAnchor="end"
            fill="var(--rv-muted)" fontSize={9}>{fmtShort(t.v)}</text>
        </g>
      ))}

      {/* x labels*/}
      {points.map((p, i) => {
        const step = Math.ceil(points.length / 10);
        if (i % step !== 0 && i !== points.length - 1) return null;
        return (
          <text key={i} x={xs[i]} y={H - PAD.b + 16} textAnchor="middle"
            fill="var(--rv-muted)" fontSize={9}>{p.label}</text>
        );
      })}

      <path d={area} fill="url(#rvGrad)" />
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />

      {/* data points */}
      {points.map((p, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r={tip?.label === p.label ? 5 : 3}
          fill={tip?.label === p.label ? "#2563eb" : "#3b82f6"}
          stroke="var(--rv-bg)" strokeWidth={1.5} />
      ))}

      {/* tooltip */}
      {tip && (() => {
        const tx = Math.min(Math.max(tip.x - TIP_W / 2, PAD.l), W - PAD.r - TIP_W);
        const ty = tip.y - TIP_H - 10 < PAD.t ? tip.y + 10 : tip.y - TIP_H - 10;
        return (
          <g>
            <rect x={tx} y={ty} width={TIP_W} height={TIP_H} rx={6}
              fill="var(--rv-tooltip-bg)" stroke="var(--rv-border)" strokeWidth={1} />
            <text x={tx + TIP_W / 2} y={ty + 16} textAnchor="middle"
              fill="var(--rv-muted)" fontSize={9}>{tip.label}</text>
            <text x={tx + TIP_W / 2} y={ty + 34} textAnchor="middle"
              fill="var(--rv-text)" fontSize={12} fontWeight={700}>{formatUSD(tip.value)}</text>
          </g>
        );
      })()}
    </svg>
  );
};

// ── KPI card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="rv-kpi-card">
    <div className="rv-kpi-icon" style={{ background: color + "18", color }}>
      <Icon size={20} />
    </div>
    <div className="rv-kpi-body">
      <span className="rv-kpi-value">{value}</span>
      <span className="rv-kpi-label">{label}</span>
      {sub && <span className="rv-kpi-sub">{sub}</span>}
    </div>
  </div>
);

// ── main page ─────────────────────────────────────────────────────────────────
const AdminRevenue = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeQuick, setActiveQuick] = useState("Last 30 Days");
  const [dateFrom, setDateFrom] = useState(daysAgo(29));
  const [dateTo,   setDateTo]   = useState(today());
  const [customFrom, setCustomFrom] = useState(daysAgo(29));
  const [customTo,   setCustomTo]   = useState(today());
  const [showCustom, setShowCustom] = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (from, to) => {
    try {
      const [rOrders, rProducts] = await Promise.all([
        axios.get(`${ADMIN_BASE}/orders?dateFrom=${from}&dateTo=${to}`, { headers: authHeader() }),
        axios.get(`${ADMIN_BASE}/products/filter?sortByBestSeller=true&dateFrom=${from}&dateTo=${to}&limit=10`, { headers: authHeader() }),
      ]);
      setOrders(rOrders.data || []);
      setProducts(rProducts.data?.products || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData(dateFrom, dateTo).finally(() => setLoading(false));
  }, [dateFrom, dateTo, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(dateFrom, dateTo);
    setRefreshing(false);
  };

  const applyQuick = (qf) => {
    const [from, to] = qf.getRange();
    setActiveQuick(qf.label);
    setDateFrom(from);
    setDateTo(to);
    setShowCustom(false);
  };

  const applyCustom = () => {
    setActiveQuick(null);
    setDateFrom(customFrom);
    setDateTo(customTo);
  };

  // ── derived — only COMPLETED orders count as revenue ─────────────────────
  const completed = orders.filter((o) => o.status === "COMPLETED");
  const refunded  = orders.filter((o) => o.paymentStatus === "REFUNDED");

  const totalRevenue  = completed.reduce((s, o) =>
    s + (Number(o.totalPrice) || 0) + (Number(o.shippingFee) || 0) + (Number(o.vat) || 0), 0);
  const totalOrders   = completed.length;
  const unitsSold     = completed.reduce((s, o) =>
    s + (o.items || []).reduce((si, i) => si + (i.quantity || 0), 0), 0);
  const aov           = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // breakdown
  const productRevenue  = completed.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
  const shippingRevenue = completed.reduce((s, o) => s + (Number(o.shippingFee) || 0), 0);
  const vatCollected    = completed.reduce((s, o) => s + (Number(o.vat) || 0), 0);
  const refundsIssued   = refunded.reduce((s, o) =>
    s + (Number(o.totalPrice) || 0) + (Number(o.shippingFee) || 0) + (Number(o.vat) || 0), 0);
  const finalCollected  = totalRevenue - refundsIssued;

  // ── line chart points ─────────────────────────────────────────────────────
  const buildChartPoints = () => {
    const from = new Date(dateFrom);
    const to   = new Date(dateTo);
    const diffDays = Math.round((to - from) / 86400000) + 1;

    if (diffDays <= 1) {
      // hourly for today
      return Array.from({ length: 24 }, (_, h) => {
        const label = `${String(h).padStart(2, "0")}:00`;
        const value = completed
          .filter((o) => {
            const d = new Date(o.createdAt);
            return d.getHours() === h && d.toDateString() === from.toDateString();
          })
          .reduce((s, o) =>
            s + (Number(o.totalPrice) || 0) + (Number(o.shippingFee) || 0) + (Number(o.vat) || 0), 0);
        return { label, value };
      });
    }

    return Array.from({ length: diffDays }, (_, i) => {
      const d = new Date(from); d.setDate(d.getDate() + i);
      const ds = toDateStr(d);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const value = completed
        .filter((o) => o.createdAt?.slice(0, 10) === ds)
        .reduce((s, o) =>
          s + (Number(o.totalPrice) || 0) + (Number(o.shippingFee) || 0) + (Number(o.vat) || 0), 0);
      return { label, value };
    });
  };

  const chartPoints = buildChartPoints();

  const dateLabel = activeQuick
    ? activeQuick
    : `${dateFrom} → ${dateTo}`;

  return (
    <div className="rv-page">

      {/* Header */}
      <div className="rv-header">
        <div>
          <h1 className="rv-title">Revenue</h1>
        </div>
        <button className="rv-refresh-btn" onClick={handleRefresh} disabled={refreshing || loading}>
          <RefreshCw size={15} className={refreshing ? "rv-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Date filter */}
      <div className="rv-filter-card">
        <div className="rv-quick-row">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.label}
              className={`rv-quick-btn${activeQuick === qf.label ? " active" : ""}`}
              onClick={() => applyQuick(qf)}
            >{qf.label}</button>
          ))}
          <button
            className={`rv-quick-btn${showCustom ? " active" : ""}`}
            onClick={() => setShowCustom((v) => !v)}
          >
            Custom <ChevronDown size={12} style={{ marginLeft: 2, transform: showCustom ? "rotate(180deg)" : "none", transition: ".2s" }} />
          </button>
          {loading && <RefreshCw size={15} className="rv-spin rv-inline-spin" />}
        </div>

        {showCustom && (
          <div className="rv-custom-row">
            <label className="rv-custom-label">From</label>
            <input type="date" className="rv-date-input" value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)} max={customTo} />
            <label className="rv-custom-label">To</label>
            <input type="date" className="rv-date-input" value={customTo}
              onChange={(e) => setCustomTo(e.target.value)} min={customFrom} max={today()} />
            <button className="rv-apply-btn" onClick={applyCustom}>Apply</button>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className={`rv-kpi-row${loading ? " rv-data--loading" : ""}`}>
        <KpiCard icon={DollarSign} label="Total Revenue" value={formatUSD(totalRevenue)} color="#22c55e" />
        <KpiCard icon={ShoppingBag} label="Total Orders" value={totalOrders.toLocaleString()} sub="completed" color="#3b82f6" />
        <KpiCard icon={Package} label="Units Sold" value={unitsSold.toLocaleString()} color="#f59e0b" />
        <KpiCard icon={TrendingUp} label="Avg. Order Value" value={formatUSD(aov)} sub="AOV" color="#a855f7" />
      </div>

      {/* Revenue trend */}
      <div className={`rv-card${loading ? " rv-data--loading" : ""}`}>
        <div className="rv-card-header">
          <h3 className="rv-card-title">Revenue Trend</h3>
          <span className="rv-card-sub">{dateLabel}</span>
        </div>
        <RevenueChart points={chartPoints} />
      </div>

      {/* Bottom row */}
      <div className={`rv-bottom-row${loading ? " rv-data--loading" : ""}`}>

        {/* Top selling products */}
        <div className="rv-card rv-card--products">
          <div className="rv-card-header">
            <h3 className="rv-card-title">Top Selling Products</h3>
            <span className="rv-card-sub">by revenue · {dateLabel}</span>
          </div>
          <div className="rv-table-wrap">
            <table className="rv-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0
                  ? <tr><td colSpan={4} className="rv-empty-row">No products data for this period.</td></tr>
                  : products.map((p, i) => (
                    <tr key={p.id} className="rv-row" style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/admin/products/${p.id}?mode=view`)}>
                      <td className="rv-rank">{i + 1}</td>
                      <td className="rv-product-name">{p.name}</td>
                      <td><strong>{p.totalSold?.toLocaleString() || "—"}</strong></td>
                      <td className="rv-green">{p.revenue ? formatUSD(p.revenue) : "—"}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminRevenue;
