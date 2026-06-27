"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, ShoppingCart, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight,
  Package, AlertTriangle,
  Search, X, Plus, PackagePlus, UserPlus,
  Download, BarChart3, ArrowRight, ChevronDown,
  Loader2, RefreshCw, CheckCircle2, XCircle,
} from "lucide-react";
import ExportReportModal from "@/components/dashboard/ExportReportModal";
import { productsApi, salesApi, categoriesApi, parsePrice } from "@/lib/api";
import type { Product, SaleRead } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toFixed(2); }

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return dayLabel(iso);
}

const PIE_COLORS = ["#6d28d9","#3b82f6","#10b981","#f97316","#ec4899","#a78bfa"];
const PIE_DOTS   = ["bg-violet-700","bg-blue-500","bg-emerald-500","bg-orange-500","bg-pink-500","bg-violet-400"];

// ── Custom chart tooltip ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={`font-semibold ${p.name === "Sales" ? "text-violet-700" : "text-violet-400"}`}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className ?? ""}`} />;
}

// ── Quick actions ──────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "New Sale",     icon: ShoppingCart, color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", href: "/sales"     },
  { label: "Add Product",  icon: Plus,         color: "bg-blue-50 text-blue-600 hover:bg-blue-100",          href: "/products"  },
  { label: "Add Customer", icon: UserPlus,     color: "bg-violet-50 text-violet-600 hover:bg-violet-100",    href: "/customers" },
  { label: "Stock In",     icon: PackagePlus,  color: "bg-amber-50 text-amber-600 hover:bg-amber-100",       href: "/inventory" },
  { label: "View Reports", icon: BarChart3,    color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",    href: "/reports"   },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [showExport, setShowExport] = useState(false);
  const [query,      setQuery]      = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [products,  setProducts]  = useState<Product[]>([]);
  const [sales,     setSales]     = useState<SaleRead[]>([]);
  const [catCount,  setCatCount]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [prods, sls, cats] = await Promise.all([
        productsApi.getAll({ limit: 200 }),
        salesApi.getAll({ limit: 100 }),
        categoriesApi.getAll(),
      ]);
      setProducts(prods);
      setSales(sls);
      setCatCount(cats.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const completedSales = useMemo(() => sales.filter(s => s.status === "completed"), [sales]);
  const voidedSales    = useMemo(() => sales.filter(s => s.status === "voided"),    [sales]);

  const totalRevenue = useMemo(
    () => completedSales.reduce((sum, s) => sum + (parseFloat(s.grand_total) || 0), 0),
    [completedSales]
  );

  const totalProducts  = products.length;
  const lowStockItems  = products.filter(p => p.quantity_in_stock > 0 && p.quantity_in_stock <= p.minimum_stock).length;
  const outOfStockItems= products.filter(p => p.quantity_in_stock === 0).length;
  const inStockItems   = products.filter(p => p.quantity_in_stock > p.minimum_stock).length;

  // ── Stats cards config (built from real data) ──────────────────────────────

  const STATS = useMemo(() => [
    {
      label:    "Total Revenue",
      value:    `$${fmt(totalRevenue)}`,
      sub:      `${completedSales.length} completed sale${completedSales.length !== 1 ? "s" : ""}`,
      icon:     DollarSign,
      iconBg:   "bg-violet-100",
      iconColor:"text-violet-600",
      stroke:   "#7c3aed",
      up:       true,
    },
    {
      label:    "Total Sales",
      value:    String(sales.length),
      sub:      `${voidedSales.length} voided`,
      icon:     ShoppingCart,
      iconBg:   "bg-blue-100",
      iconColor:"text-blue-600",
      stroke:   "#3b82f6",
      up:       true,
    },
    {
      label:    "Total Products",
      value:    String(totalProducts),
      sub:      `${inStockItems} in stock`,
      icon:     Package,
      iconBg:   "bg-slate-100",
      iconColor:"text-slate-600",
      stroke:   "#94a3b8",
      up:       null,
    },
    {
      label:    "Categories",
      value:    String(catCount),
      sub:      "active categories",
      icon:     TrendingUp,
      iconBg:   "bg-orange-100",
      iconColor:"text-orange-600",
      stroke:   "#f97316",
      up:       null,
    },
  ], [totalRevenue, completedSales, voidedSales, sales, totalProducts, inStockItems, catCount]);

  // ── Bar chart: sales by day (last 7 days) ─────────────────────────────────

  const barData = useMemo(() => {
    const days: Record<string, number> = {};
    // Build last-7-day keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    completedSales.forEach(s => {
      const key = s.sale_date.slice(0, 10);
      if (key in days) days[key] += parseFloat(s.grand_total) || 0;
    });
    return Object.entries(days).map(([date, sales]) => ({
      day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.round(sales),
    }));
  }, [completedSales]);

  // ── Donut chart: top products by revenue ──────────────────────────────────

  const pieData = useMemo(() => {
    const byProduct: Record<number, { name: string; revenue: number }> = {};
    completedSales.forEach(sale => {
      sale.items.forEach(item => {
        const total = parseFloat(item.total_price) || 0;
        const prod  = products.find(p => p.id === item.product_id);
        const name  = prod?.name ?? `Product #${item.product_id}`;
        if (!byProduct[item.product_id]) byProduct[item.product_id] = { name, revenue: 0 };
        byProduct[item.product_id].revenue += total;
      });
    });
    const sorted = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    const grandTotal = sorted.reduce((s, p) => s + p.revenue, 0);
    return sorted.map((p, i) => ({
      name:   p.name,
      value:  grandTotal > 0 ? Math.round((p.revenue / grandTotal) * 100) : 0,
      amount: `$${fmt(p.revenue)}`,
      color:  PIE_COLORS[i] ?? "#a78bfa",
      dot:    PIE_DOTS[i]   ?? "bg-violet-400",
    }));
  }, [completedSales, products]);

  const pieTotal = useMemo(
    () => completedSales.reduce((s, sale) => s + (parseFloat(sale.grand_total) || 0), 0),
    [completedSales]
  );

  // ── Stock alerts ───────────────────────────────────────────────────────────

  const stockAlerts = useMemo(() =>
    products
      .filter(p => p.quantity_in_stock <= p.minimum_stock)
      .sort((a, b) => a.quantity_in_stock - b.quantity_in_stock)
      .slice(0, 8)
      .map(p => ({
        product: p.name,
        sku:     p.sku,
        stock:   p.quantity_in_stock,
        level:   p.quantity_in_stock === 0 ? "Critical" : "Low Stock" as "Critical" | "Low Stock",
      })),
    [products]
  );

  // ── Recent transactions (last 5 sales) ────────────────────────────────────

  const recentTx = useMemo(() => sales.slice(0, 5), [sales]);

  // ── Quick search (products + sales) ───────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const res: { type: string; label: string; sub: string; href: string }[] = [];
    products.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ).slice(0, 3).forEach(p => {
      res.push({
        type:  "Product",
        label: p.name,
        sub:   `${p.sku} · ${p.quantity_in_stock} in stock`,
        href:  "/products",
      });
    });
    sales.filter(s =>
      s.sale_number.toLowerCase().includes(q)
    ).slice(0, 3).forEach(s => {
      res.push({
        type:  "Sale",
        label: s.sale_number,
        sub:   `$${fmt(parseFloat(s.grand_total))} · ${s.status}`,
        href:  "/sales",
      });
    });
    return res.slice(0, 6);
  }, [query, products, sales]);

  const TYPE_COLOR: Record<string, string> = {
    Product: "bg-violet-100 text-violet-700",
    Sale:    "bg-emerald-100 text-emerald-700",
  };

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-full">

      {showExport && <ExportReportModal onClose={() => setShowExport(false)} />}

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Admin
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Here&apos;s what&apos;s happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 shadow-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline underline-offset-2 hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* ── Quick Search + Actions ── */}
      <div className="flex items-center gap-4">
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search products, sales…"
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm transition-all"
          />
          {query && (
            <button type="button" title="Clear" onClick={() => { setQuery(""); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          {searchOpen && query.length >= 1 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 overflow-hidden">
              {searchResults.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400 text-center">No results for &quot;{query}&quot;</p>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {searchResults.map((r, i) => (
                    <a key={i} href={r.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      onClick={() => setSearchOpen(false)}
                    >
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_COLOR[r.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{r.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{r.sub}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </a>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color, href }) => (
            <a key={label} href={href}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${color}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:block">{label}</span>
            </a>
          ))}
          <button type="button" onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md shadow-violet-200">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xl:block">Export Report</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))
          : STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${s.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${s.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-400 truncate">{s.label}</p>
                        {s.up !== null && (
                          <span className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                            {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{s.value}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3">{s.sub}</p>
                </div>
              );
            })}
      </div>

      {/* ── Quick stats row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "In Stock",      value: inStockItems,    icon: CheckCircle2,  bg: "bg-emerald-100", color: "text-emerald-600" },
          { label: "Low Stock",     value: lowStockItems,   icon: AlertTriangle, bg: "bg-amber-100",   color: "text-amber-600"   },
          { label: "Out of Stock",  value: outOfStockItems, icon: XCircle,       bg: "bg-red-100",     color: "text-red-600"     },
          { label: "Total Txns",    value: sales.length,    icon: ShoppingCart,  bg: "bg-violet-100",  color: "text-violet-600"  },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              {loading
                ? <Skeleton className="h-6 w-10 mb-1" />
                : <p className="text-xl font-bold text-gray-900">{value}</p>}
              <p className={`text-xs font-semibold ${color}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Bar Chart — sales last 7 days */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Sales Revenue — Last 7 Days</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" />
              <span className="text-xs text-gray-500">Revenue</span>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-56 text-gray-300 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData} barCategoryGap="32%">
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day"   tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `$${v}`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
                <Bar dataKey="sales" name="Sales" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut — Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Products <span className="text-gray-400 font-normal text-sm">by Revenue</span></h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-44 text-gray-300">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-gray-300 gap-2">
              <Package className="w-10 h-10" />
              <p className="text-xs text-gray-400">No sales data yet</p>
            </div>
          ) : (
            <>
              <div className="relative flex justify-center">
                <PieChart width={180} height={180}>
                  <Pie data={pieData} cx={85} cy={85}
                    innerRadius={52} outerRadius={82}
                    dataKey="value" strokeWidth={2} stroke="#fff">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-gray-400">Revenue</p>
                  <p className="text-sm font-bold text-gray-900">${pieTotal >= 1000 ? `${(pieTotal/1000).toFixed(1)}k` : fmt(pieTotal)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.dot}`} />
                      <span className="text-xs text-gray-600 truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-xs font-semibold text-gray-800">{p.amount}</span>
                      <span className="text-[10px] text-gray-400 w-7 text-right">{p.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stock Alerts + Recent Sales ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Stock Alerts */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Stock Alerts</h2>
              {!loading && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-bold">
                  {stockAlerts.length}
                </span>
              )}
            </div>
            <a href="/products" className="text-xs text-violet-600 font-medium hover:underline">
              View All Products
            </a>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : stockAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-300">
              <CheckCircle2 className="w-10 h-10" />
              <p className="text-sm font-semibold text-gray-400">All products are well-stocked</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {["Product", "SKU", "Stock", "Alert Level"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stockAlerts.map((row) => (
                  <tr key={row.sku} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{row.product}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-400">{row.sku}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-red-500">{row.stock} pcs</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        row.level === "Critical"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {row.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Sales</h2>
            <a href="/sales" className="text-xs text-violet-600 font-medium hover:underline">View All</a>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-300">
              <ShoppingCart className="w-10 h-10" />
              <p className="text-xs text-gray-400">No sales recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTx.map((s) => {
                const statusColor =
                  s.status === "completed" ? "bg-emerald-100 text-emerald-600" :
                  s.status === "voided"    ? "bg-red-100 text-red-600" :
                                             "bg-amber-100 text-amber-600";
                return (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${statusColor}`}>
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate font-mono">{s.sale_number}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                        {s.payment_method.replace("_", " ")} · {s.status}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">${fmt(parseFloat(s.grand_total))}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(s.sale_date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
