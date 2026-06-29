"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, DollarSign, ShoppingCart, Package,
  RefreshCw, Loader2, AlertCircle, CheckCircle2,
  XCircle, CreditCard, Smartphone, Banknote,
} from "lucide-react";
import { salesApi, productsApi, parsePrice } from "@/lib/api";
import type { SaleRead, Product } from "@/lib/api";

const PIE_COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f97316"];

function fmt(n: number) { return n.toFixed(2); }

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-semibold text-violet-700">{p.name}: ${p.value.toLocaleString()}</p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [sales,    setSales]    = useState<SaleRead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [sls, prods] = await Promise.all([
        salesApi.getAll({ limit: 200 }),
        productsApi.getAll({ limit: 500 }),
      ]);
      setSales(sls);
      setProducts(prods);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const completed = useMemo(() => sales.filter(s => s.status === "completed"), [sales]);

  const totalRevenue = useMemo(
    () => completed.reduce((sum, s) => sum + (parseFloat(s.grand_total) || 0), 0),
    [completed]
  );
  const totalDiscount = useMemo(
    () => completed.reduce((sum, s) => sum + (parseFloat(s.discount_amount) || 0), 0),
    [completed]
  );
  const avgSale = completed.length > 0 ? totalRevenue / completed.length : 0;

  // Stock value
  const stockValue = useMemo(
    () => products.reduce((sum, p) => sum + parsePrice(p.productPrice) * (p.initialQuantity ?? 0), 0),
    [products]
  );
  const retailValue = useMemo(
    () => products.reduce((sum, p) => sum + parsePrice(p.sellingPrice) * (p.initialQuantity ?? 0), 0),
    [products]
  );

  // Sales by day (last 14 days)
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    completed.forEach(s => {
      const key = s.sale_date.slice(0, 10);
      if (key in map) map[key] += parseFloat(s.grand_total) || 0;
    });
    return Object.entries(map).map(([date, revenue]) => ({
      day: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Revenue: Math.round(revenue),
    }));
  }, [completed]);

  // Sales by payment method
  const pmData = useMemo(() => {
    const map: Record<string, number> = { cash: 0, card: 0, mobile_money: 0, other: 0 };
    completed.forEach(s => { map[s.payment_method] = (map[s.payment_method] ?? 0) + (parseFloat(s.grand_total) || 0); });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([method, value], i) => ({
        name:   method === "mobile_money" ? "Mobile Money" : method.charAt(0).toUpperCase() + method.slice(1),
        value:  Math.round(value),
        color:  PIE_COLORS[i] ?? "#a78bfa",
      }));
  }, [completed]);

  const pmTotal = pmData.reduce((s, d) => s + d.value, 0);

  // Top products by revenue from sale items
  const topProducts = useMemo(() => {
    const map: Record<number, { name: string; qty: number; revenue: number }> = {};
    completed.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.product_id);
        const name = prod?.productName ?? `#${item.product_id}`;
        if (!map[item.product_id]) map[item.product_id] = { name, qty: 0, revenue: 0 };
        map[item.product_id].qty     += item.quantity;
        map[item.product_id].revenue += parseFloat(item.total_price) || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [completed, products]);

  // Low stock products
  const lowStock = useMemo(() =>
    products.filter(p => (p.initialQuantity ?? 0) <= p.minimumQuantity)
      .sort((a, b) => (a.initialQuantity ?? 0) - (b.initialQuantity ?? 0))
      .slice(0, 8),
    [products]
  );

  const PM_ICONS: Record<string, React.ElementType> = {
    Cash: Banknote, Card: CreditCard, "Mobile Money": Smartphone, Other: ShoppingCart,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports &amp; Analytics</h1>
            <p className="text-sm text-gray-400 mt-0.5">Live data from sales &amp; inventory</p>
          </div>
          <button type="button" onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {error && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue",    value: `$${fmt(totalRevenue)}`, icon: DollarSign,  bg: "bg-violet-50",  border: "border-violet-100",  text: "text-violet-600"  },
            { label: "Completed Sales",  value: String(completed.length), icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
            { label: "Avg Sale Value",   value: `$${fmt(avgSale)}`,      icon: TrendingUp,  bg: "bg-blue-50",    border: "border-blue-100",    text: "text-blue-600"    },
            { label: "Voided Sales",     value: String(sales.filter(s => s.status === "voided").length), icon: XCircle, bg: "bg-red-50", border: "border-red-100", text: "text-red-600" },
          ].map(({ label, value, icon: Icon, bg, border, text }) => (
            <div key={label} className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg}`}>
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                {loading ? <div className="h-6 w-20 bg-gray-100 rounded animate-pulse mb-1" /> : <p className="text-xl font-bold text-gray-900">{value}</p>}
                <p className={`text-xs font-semibold ${text}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Inventory value cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Products",  value: String(products.length), icon: Package,    bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-600"    },
            { label: "Stock Value (Cost)",   value: `$${fmt(stockValue)}`,  icon: DollarSign, bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-600"   },
            { label: "Stock Value (Retail)", value: `$${fmt(retailValue)}`, icon: TrendingUp, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
            { label: "Total Discounts", value: `$${fmt(totalDiscount)}`, icon: XCircle,   bg: "bg-orange-50",  border: "border-orange-100",  text: "text-orange-600"  },
          ].map(({ label, value, icon: Icon, bg, border, text }) => (
            <div key={label} className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg}`}>
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                {loading ? <div className="h-6 w-20 bg-gray-100 rounded animate-pulse mb-1" /> : <p className="text-xl font-bold text-gray-900">{value}</p>}
                <p className={`text-xs font-semibold ${text}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Daily revenue bar chart */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Daily Revenue — Last 14 Days</h2>
            {loading ? (
              <div className="flex items-center justify-center h-56 text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData} barCategoryGap="36%">
                  <CartesianGrid vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `$${v}`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="Revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment method donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Revenue by Payment</h2>
            {loading ? (
              <div className="flex items-center justify-center h-44 text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : pmData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-gray-300 gap-2">
                <ShoppingCart className="w-10 h-10" />
                <p className="text-xs text-gray-400">No sales yet</p>
              </div>
            ) : (
              <>
                <div className="relative flex justify-center">
                  <PieChart width={160} height={160}>
                    <Pie data={pmData} cx={75} cy={75} innerRadius={45} outerRadius={72} dataKey="value" strokeWidth={2} stroke="#fff">
                      {pmData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] text-gray-400">Total</p>
                    <p className="text-sm font-bold text-gray-900">${pmTotal >= 1000 ? `${(pmTotal/1000).toFixed(1)}k` : fmt(pmTotal)}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {pmData.map((d, i) => {
                    const Icon = PM_ICONS[d.name] ?? ShoppingCart;
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" data-color={d.color}
                            ref={el => { if (el) el.style.background = d.color; }} />
                          <Icon className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{d.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800">${fmt(d.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Top Products by Revenue</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-300">
                <Package className="w-10 h-10" />
                <p className="text-xs text-gray-400">No sales data yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    {["Product", "Units Sold", "Revenue"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{p.qty}</td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-600">${fmt(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Low stock */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Low / Out of Stock</h2>
              {!loading && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-bold">{lowStock.length}</span>}
            </div>
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-300">
                <CheckCircle2 className="w-10 h-10" />
                <p className="text-xs text-gray-400">All products well-stocked</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    {["Product", "In Stock", "Min Stock", "Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStock.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800 max-w-[140px] truncate">{p.productName}</td>
                      <td className="px-5 py-3 text-sm font-bold text-red-500">{p.initialQuantity ?? 0}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{p.minimumQuantity}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          (p.initialQuantity ?? 0) === 0
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {(p.initialQuantity ?? 0) === 0 ? "Out of Stock" : "Low Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
