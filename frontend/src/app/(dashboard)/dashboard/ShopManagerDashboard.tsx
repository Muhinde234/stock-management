"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, ShoppingCart, PackagePlus, DollarSign,
  Store as StoreIcon, Users, Package, AlertTriangle, ArrowRight,
  Loader2, AlertCircle, RefreshCw, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { salesApi, productsApi, inventoryApi, parsePrice } from "@/lib/api";
import { storesApi, type Store } from "@/lib/api/stores";
import { stockKeepersApi } from "@/lib/api/stock-keepers";
import type { SaleRead, Product } from "@/lib/api";
import type { StockMovementRead } from "@/lib/api/inventory";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ── Store card ────────────────────────────────────────────────────────────────

function StoreCard({ store, keeperCount }: { store: Store; keeperCount: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <StoreIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{store.name}</h3>
            <span className={`inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              store.status === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>
              {store.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-900">{keeperCount}</p>
          <p className="text-[10px] text-gray-500">Keepers</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-[10px] text-gray-400 truncate">{store.address ?? "—"}</p>
          <p className="text-[10px] text-gray-500">Location</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400">
        ID #{store.id}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ShopManagerDashboard() {
  const [stores,    setStores]    = useState<Store[]>([]);
  const [sales,     setSales]     = useState<SaleRead[]>([]);
  const [movements, setMovements] = useState<StockMovementRead[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [keepers,   setKeepers]   = useState<{ store_id?: number }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [st, sl, mv, pr, kp] = await Promise.all([
        storesApi.getAll(),
        salesApi.getAll({ limit: 200 }),
        inventoryApi.getAll({ limit: 200 }),
        productsApi.getAll({ limit: 200 }),
        stockKeepersApi.getAll(),
      ]);
      setStores(Array.isArray(st) ? st : []);
      setSales(Array.isArray(sl) ? sl : []);
      setMovements(Array.isArray(mv) ? mv : []);
      setProducts(Array.isArray(pr) ? pr : []);
      setKeepers(Array.isArray(kp) ? kp : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const completedSales = sales.filter(s => s.status === "completed");

  const totalRevenue = completedSales.reduce(
    (sum, s) => sum + parseFloat(s.grand_total ?? "0"), 0
  );

  // Purchasing cost: sum of (buying_price × quantity) for all stock_in movements
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const totalPurchases = movements
    .filter(m => m.status === "stock_in")
    .reduce((sum, m) => {
      const prod = productMap[m.product_id];
      const cost = prod ? parsePrice(prod.productPrice) * m.quantity : 0;
      return sum + cost;
    }, 0);

  const grossProfit  = totalRevenue - totalPurchases;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Low stock alerts
  const lowStockProducts = products.filter(
    p => (p.initialQuantity ?? 0) <= p.minimumQuantity && (p.initialQuantity ?? 0) > 0
  );
  const outOfStock = products.filter(p => p.stock_status === "out_of_stock");

  // Keeper count per store
  const keepersByStore = Object.fromEntries(
    stores.map(s => [s.id, keepers.filter(k => k.store_id === s.id).length])
  );

  // Recent sales
  const recentSales = completedSales.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600">{error}</p>
        <button type="button" onClick={load}
          className="flex items-center gap-2 text-sm text-violet-600 hover:underline">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your branches, stock and financials at a glance</p>
        </div>
        <button type="button" onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`${totalRevenue.toLocaleString()} RWF`}
          sub={`${completedSales.length} completed sales`}
          color="bg-gradient-to-br from-violet-600 to-purple-700 text-white"
        />
        <StatCard
          icon={PackagePlus}
          label="Total Purchases"
          value={`${totalPurchases.toLocaleString()} RWF`}
          sub={`${movements.filter(m => m.status === "stock_in").length} stock-in records`}
          color="bg-gradient-to-br from-blue-500 to-blue-700 text-white"
        />
        <StatCard
          icon={TrendingUp}
          label="Gross Profit"
          value={`${grossProfit.toLocaleString()} RWF`}
          sub={`${profitMargin.toFixed(1)}% margin`}
          color={grossProfit >= 0
            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
            : "bg-gradient-to-br from-red-500 to-rose-600 text-white"}
        />
        <StatCard
          icon={ShoppingCart}
          label="Sales Count"
          value={String(completedSales.length)}
          sub={`${sales.length} total transactions`}
          color="bg-gradient-to-br from-orange-500 to-amber-600 text-white"
        />
      </div>

      {/* Quick metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: StoreIcon,     label: "Branches",     value: stores.length,        color: "bg-blue-50 text-blue-700"       },
          { icon: Users,         label: "Stock Keepers", value: keepers.length,      color: "bg-emerald-50 text-emerald-700" },
          { icon: Package,       label: "Products",     value: products.length,       color: "bg-violet-50 text-violet-700"   },
          { icon: AlertTriangle, label: "Low Stock",    value: lowStockProducts.length + outOfStock.length, color: lowStockProducts.length + outOfStock.length > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500" },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl p-4 ${c.color} flex items-center gap-3`}>
              <Icon className="w-5 h-5 shrink-0 opacity-80" />
              <div>
                <p className="text-xl font-bold">{c.value}</p>
                <p className="text-xs font-medium opacity-70">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Branches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Branches / Stores</h2>
            <Link href="/stores" className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {stores.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <StoreIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-3">No branches yet.</p>
              <Link href="/stores"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                Add First Branch
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stores.map(store => (
                <StoreCard
                  key={store.id}
                  store={store}
                  keeperCount={keepersByStore[store.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Recent sales */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Recent Sales</h2>
              <Link href="/sales" className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {recentSales.length === 0 ? (
                <div className="py-8 text-center">
                  <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No sales yet</p>
                </div>
              ) : recentSales.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{s.sale_number ?? `#${s.id}`}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(s.sale_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {parseFloat(s.grand_total ?? "0").toLocaleString()} RWF
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          {(lowStockProducts.length > 0 || outOfStock.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Stock Alerts
                </h2>
                <Link href="/products" className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {[...outOfStock.slice(0, 3), ...lowStockProducts.slice(0, 5)].map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.productName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                      p.stock_status === "out_of_stock"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {p.stock_status === "out_of_stock" ? "Out" : `${p.initialQuantity ?? 0} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Add Product",   href: "/products",      color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
                { label: "Add Branch",    href: "/stores",        color: "bg-blue-50 text-blue-700 hover:bg-blue-100"       },
                { label: "Add Keeper",    href: "/stock-keepers", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                { label: "View Sales",    href: "/sales",         color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition ${a.color}`}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
