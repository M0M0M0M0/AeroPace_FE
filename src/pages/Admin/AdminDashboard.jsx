import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  DollarSign, ShoppingBag, Clock, Users, TrendingUp, TrendingDown,
  Package, AlertTriangle, Eye, Zap, BarChart2, RefreshCw,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
const ADMIN_BASE = `${BASE}/admin`;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// ── helpers ──────────────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().slice(0, 10);

const today = () => toDateStr(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toDateStr(d); };
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d); };

const fmtVND = (n) => `${(n || 0).toLocaleString("vi-VN")} ₫`;
const fmtM = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n || 0);

const pctChange = (curr, prev) => {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
};

const STATUS_CFG = {
  PENDING: { label: "Pending", color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  PAID: { label: "Paid", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  SHIPPING: { label: "Shipping", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  COMPLETED: { label: "Completed", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  CANCELLED: { label: "Cancelled", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, color: "#a3a3a3", bg: "rgba(163,163,163,0.12)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg
    }}>
      {cfg.label}
    </span>
  );
};

// ── Doughnut ─────────────────────────────────────────────────────────────────
const Doughnut = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const colors = { PENDING: "#facc15", PAID: "#60a5fa", SHIPPING: "#fb923c", COMPLETED: "#4ade80", CANCELLED: "#f87171" };
  let offset = 0;
  const R = 70, CX = 90, CY = 90, stroke = 28;
  const circ = 2 * Math.PI * R;
  const slices = data.map((d) => {
    const pct = d.count / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const slice = { ...d, dash, gap, offset, color: colors[d.status] || "#666" };
    offset += dash;
    return slice;
  });

  return (
    <div className="ad-doughnut-wrap">
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1f1f1f" strokeWidth={stroke} />
        {slices.map((s) => (
          <circle key={s.status} cx={CX} cy={CY} r={R} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray .4s" }}
          />
        ))}
        <text x={CX} y={CY - 8} textAnchor="middle" fill="#e5e5e5" fontSize={22} fontWeight={700}>{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="#666" fontSize={11}>orders</text>
      </svg>
      <div className="ad-doughnut-legend">
        {slices.map((s) => (
          <div key={s.status} className="ad-legend-row">
            <span className="ad-legend-dot" style={{ background: s.color }} />
            <span className="ad-legend-label">{STATUS_CFG[s.status]?.label || s.status}</span>
            <span className="ad-legend-val">{s.count}</span>
            <span className="ad-legend-pct">{Math.round((s.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Line Chart ────────────────────────────────────────────────────────────────
const LineChart = ({ points }) => {
  if (!points.length) return <p className="ad-empty">No data</p>;
  const W = 560, H = 160, PAD = { t: 16, r: 8, b: 32, l: 56 };
  const maxV = Math.max(...points.map((p) => p.value), 1);
  const xs = points.map((_, i) => PAD.l + (i / Math.max(points.length - 1, 1)) * (W - PAD.l - PAD.r));
  const ys = points.map((p) => PAD.t + (1 - p.value / maxV) * (H - PAD.t - PAD.b));
  const path = points.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i]},${ys[i]}`).join(" ");
  const area = `${path} L${xs[xs.length - 1]},${H - PAD.b} L${xs[0]},${H - PAD.b} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: maxV * f, y: PAD.t + (1 - f) * (H - PAD.t - PAD.b) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ad-linechart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#ffffff0a" strokeWidth={1} />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fill="#555" fontSize={9}>{fmtM(t.v)}</text>
        </g>
      ))}
      <path d={area} fill="url(#lineGrad)" />
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r={3} fill="#3b82f6" />
          <text x={xs[i]} y={H - PAD.b + 14} textAnchor="middle" fill="#555" fontSize={9}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, pct, iconClass }) => {
  const up = pct >= 0;
  return (
    <div className="ad-stat-card">
      <div className={`ad-stat-icon ${iconClass}`}><Icon size={20} /></div>
      <div className="ad-stat-body">
        <span className="ad-stat-label">{label}</span>
        <span className="ad-stat-value">{value}</span>
        <span className={`ad-stat-pct ${up ? "up" : "down"}`}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(pct)}% vs yesterday
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [orders7d, setOrders7d] = useState([]);
  const [orders30d, setOrders30d] = useState([]);
  const [ordersToday, setOrdersToday] = useState([]);
  const [ordersYest, setOrdersYest] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [newCustToday, setNewCustToday] = useState([]);
  const [newCustYest, setNewCustYest] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  const [revenueRange, setRevenueRange] = useState("7d");
  const [bsRange, setBsRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── fetch ───────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const td = today(), yd = yesterday();

      const [r7d, rToday, rYest, rLow, rCustToday, rCustYest] = await Promise.all([
        axios.get(`${ADMIN_BASE}/orders?dateFrom=${daysAgo(30)}&dateTo=${td}`, { headers: authHeader() }),
        axios.get(`${ADMIN_BASE}/orders?dateFrom=${td}&dateTo=${td}`, { headers: authHeader() }),
        axios.get(`${ADMIN_BASE}/orders?dateFrom=${yd}&dateTo=${yd}`, { headers: authHeader() }),
        axios.get(`${ADMIN_BASE}/dashboard/low-stock?threshold=5&limit=10`, { headers: authHeader() }),
        axios.get(`${BASE}/admin/dashboard/new-customers?dateFrom=${td}&dateTo=${td}`, { headers: authHeader() }),
        axios.get(`${BASE}/admin/dashboard/new-customers?dateFrom=${yd}&dateTo=${yd}`, { headers: authHeader() }),
      ]);

      setOrders7d(r7d.data.filter((o) => new Date(o.createdAt) >= new Date(daysAgo(7))));
      setOrders30d(r7d.data);
      setOrdersToday(rToday.data);
      setOrdersYest(rYest.data);
      setLowStock(rLow.data);
      setNewCustToday(rCustToday.data);
      setNewCustYest(rCustYest.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  // best sellers
  useEffect(() => {
    const days = bsRange === "7d" ? 7 : bsRange === "30d" ? 30 : 90;
    const df = daysAgo(days), dt = today();
    axios.get(`${ADMIN_BASE}/products/filter?sortByBestSeller=true&dateFrom=${df}&dateTo=${dt}&limit=5`, { headers: authHeader() })
      .then((r) => {
        setBestSellers(r.data?.products || []);
      })
      .catch(console.error);
  }, [bsRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ── derived ─────────────────────────────────────────────────────────────────
  const COMPLETED = "COMPLETED";

  const revToday = ordersToday.filter((o) => o.status === COMPLETED).reduce((s, o) => s + (o.totalPrice || 0), 0);
  const revYest = ordersYest.filter((o) => o.status === COMPLETED).reduce((s, o) => s + (o.totalPrice || 0), 0);

  const ordCountToday = ordersToday.length;
  const ordCountYest = ordersYest.length;

  const needActionToday = ordersToday.filter((o) => ["PENDING", "PAID", "SHIPPING"].includes(o.status)).length;
  const needActionYest = ordersYest.filter((o) => ["PENDING", "PAID", "SHIPPING"].includes(o.status)).length;

  const statusSummary = Object.entries(
    orders30d.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count }));

  // action cards
  const pendingCount = orders30d.filter((o) => o.status === "PENDING").length;
  const paidCount = orders30d.filter((o) => o.status === "PAID").length;
  const shippingCount = orders30d.filter((o) => o.status === "SHIPPING").length;

  // recent 10
  const recentOrders = [...orders30d].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  // line chart points
  const buildLinePoints = () => {
    const sourceOrders = revenueRange === "30d" ? orders30d : orders7d;
    if (revenueRange === "24h") {
      const hours = Array.from({ length: 24 }, (_, i) => {
        const h = new Date(); h.setHours(h.getHours() - (23 - i), 0, 0, 0);
        return h;
      });
      return hours.map((h) => {
        const label = `${String(h.getHours()).padStart(2, "0")}:00`;
        const value = sourceOrders
          .filter((o) => o.status === COMPLETED)
          .filter((o) => { const d = new Date(o.createdAt); return d.getHours() === h.getHours() && d.toDateString() === h.toDateString(); })
          .reduce((s, o) => s + (o.totalPrice || 0), 0);
        return { label, value };
      });
    }
    const days = revenueRange === "3d" ? 3 : revenueRange === "30d" ? 30 : 7;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const ds = toDateStr(d);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const value = sourceOrders
        .filter((o) => o.status === COMPLETED && o.createdAt?.slice(0, 10) === ds)
        .reduce((s, o) => s + (o.totalPrice || 0), 0);
      return { label, value };
    });
  };

  // perf growth
  const revGrowth = pctChange(revToday, revYest);
  const ordGrowth = pctChange(ordCountToday, ordCountYest);
  const custGrowth = pctChange(newCustToday.length, newCustYest.length);

  if (loading) return (
    <div className="ad-loading">
      <RefreshCw size={24} className="ad-spin" />
      <span>Loading dashboard…</span>
    </div>
  );

  const linePoints = buildLinePoints();

  return (
    <div className="ad-page">

      {/* HEADER */}
      <div className="ad-header">
        <div>
          <h1 className="ad-title">Dashboard</h1>
          <p className="ad-subtitle">Overview · {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button className="ad-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "ad-spin" : ""} /> Refresh
        </button>
      </div>

      {/*KPI */}
      <div className="ad-stats">
        <KpiCard icon={DollarSign} label="Revenue Today" value={fmtVND(revToday)} pct={revGrowth} iconClass="green" />
        <KpiCard icon={ShoppingBag} label="Orders Today" value={`${ordCountToday} orders`} pct={ordGrowth} iconClass="blue" />
        <KpiCard icon={Clock} label="Need Action" value={`${needActionToday} orders`} pct={pctChange(needActionToday, needActionYest)} iconClass="yellow" />
        <KpiCard icon={Users} label="New Customers" value={`${newCustToday.length} users`} pct={custGrowth} iconClass="purple" />
      </div>

      {/*Charts */}
      <div className="ad-charts-row">
        {/* Line chart */}
        <div className="ad-card ad-chart-card">
          <div className="ad-card-header">
            <h3 className="ad-card-title">Revenue</h3>
            <div className="ad-range-tabs">
              {[["24h", "24h"], ["3d", "3 days"], ["7d", "7 days"], ["30d", "30 days"]].map(([v, l]) => (
                <button key={v} className={`ad-range-tab ${revenueRange === v ? "active" : ""}`}
                  onClick={() => setRevenueRange(v)}>{l}</button>
              ))}
            </div>
          </div>
          <LineChart points={linePoints} />
        </div>

        {/* Doughnut */}
        <div className="ad-card ad-donut-card">
          <h3 className="ad-card-title">Order Status</h3>
          <Doughnut data={statusSummary} />
        </div>
      </div>

      {/* Action cards */}
      <div className="ad-action-row">
        {[
          { status: "PENDING", count: pendingCount, icon: Clock, color: "yellow", label: "Pending Orders" },
          { status: "PAID", count: paidCount, icon: DollarSign, color: "blue", label: "Paid Orders" },
          { status: "SHIPPING", count: shippingCount, icon: Package, color: "orange", label: "Shipping Orders" },
        ].map(({ status, count, icon: Icon, color, label }) => (
          <div key={status} className={`ad-action-card ad-action-card--${color}`}>
            <div className="ad-action-icon"><Icon size={22} /></div>
            <div className="ad-action-body">
              <span className="ad-action-label">{label}</span>
              <span className="ad-action-count">{count}</span>
            </div>
            <button className="ad-action-btn" onClick={() => navigate(`/admin/orders?status=${status}`)}>
              <Eye size={14} /> View
            </button>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="ad-card">
        <div className="ad-card-header">
          <h3 className="ad-card-title">Recent Orders</h3>
          <button className="ad-view-all" onClick={() => navigate("/admin/orders")}>View all →</button>
        </div>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Amount</th>
                <th>Payment</th><th>Status</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="ad-row">
                  <td className="ad-td-id">#{o.id}</td>
                  <td>{o.receiverName || "—"}</td>
                  <td className="ad-td-price">{fmtVND(o.totalPrice)}</td>
                  <td className="ad-td-muted">{o.paymentMethod || "—"}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="ad-td-muted">{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                  <td>
                    <button className="ad-detail-btn" onClick={() => navigate(`/admin/orders/details/${o.orderCode}`)}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best sellers */}
      <div className="ad-card">
        <div className="ad-card-header">
          <h3 className="ad-card-title"><BarChart2 size={16} style={{ marginRight: 6 }} />Top Products</h3>
          <div className="ad-range-tabs">
            {[["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"]].map(([v, l]) => (
              <button key={v} className={`ad-range-tab ${bsRange === v ? "active" : ""}`}
                onClick={() => setBsRange(v)}>{l}</button>
            ))}
          </div>
        </div>
        <table className="ad-table">
          <thead>
            <tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
          </thead>
          <tbody>
            {bestSellers.length === 0
              ? <tr><td colSpan={4} className="ad-empty-row">No data</td></tr>
              : bestSellers.map((p, i) => (
                <tr key={p.id} className="ad-row">
                  <td className="ad-td-rank">
                    <span className="ad-medal" data-rank={i + 1}>{i + 1}</span>
                  </td>
                  <td>{p.name}</td>
                  <td><strong>{p.totalSold?.toLocaleString("vi-VN") || "—"}</strong></td>
                  <td className="ad-td-price">{p.revenue ? fmtVND(p.revenue) : "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Low stock */}
      <div className="ad-card">
        <div className="ad-card-header">
          <h3 className="ad-card-title"><AlertTriangle size={16} style={{ marginRight: 6, color: "#f87171" }} />Low Stock Alert</h3>
          <span className="ad-badge-count">{lowStock.length} items</span>
        </div>
        <table className="ad-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Stock</th></tr>
          </thead>
          <tbody>
            {lowStock.length === 0
              ? <tr><td colSpan={3} className="ad-empty-row">All stock levels are healthy</td></tr>
              : lowStock.map((item) => (
                <tr key={item.variantId} className="ad-row">
                  <td>{item.productName}</td>
                  <td className="ad-td-muted">{item.sku || "—"}</td>
                  <td>
                    {item.stock === 0
                      ? <span className="ad-out-of-stock">Out of Stock</span>
                      : <span className="ad-low-stock">{item.stock} left</span>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/*Performance growth */}
      <div className="ad-perf-row">
        {[
          { label: "Revenue Growth", curr: fmtVND(revToday), pct: revGrowth, icon: DollarSign, color: "green" },
          { label: "Order Growth", curr: `${ordCountToday} orders`, pct: ordGrowth, icon: ShoppingBag, color: "blue" },
          { label: "New Customer Growth", curr: `${newCustToday.length} users`, pct: custGrowth, icon: Users, color: "purple" },
        ].map(({ label, curr, pct, icon: Icon, color }) => {
          const up = pct >= 0;
          return (
            <div key={label} className={`ad-perf-card ad-perf-card--${color}`}>
              <div className="ad-perf-icon"><Icon size={20} /></div>
              <div className="ad-perf-body">
                <span className="ad-perf-label">{label}</span>
                <span className="ad-perf-value">{curr}</span>
                <div className={`ad-perf-pct ${up ? "up" : "down"}`}>
                  {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  <span>{Math.abs(pct)}% vs yesterday</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div className="ad-card">
        <h3 className="ad-card-title"><Zap size={16} style={{ marginRight: 6 }} />Quick Actions</h3>
        <div className="ad-quick-actions">
          {[
            { label: "Create Product", path: "/admin/products/new" },
            { label: "Manage Orders", path: "/admin/orders" },
            { label: "Manage Customers", path: "/admin/customers" },
            { label: "Manage Categories", path: "/admin/categories" },
          ].map(({ label, path }) => (
            <button key={label} className="ad-quick-btn" onClick={() => navigate(path)}>{label}</button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;