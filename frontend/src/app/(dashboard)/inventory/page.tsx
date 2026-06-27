"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, Search, RefreshCw,
  Loader2, AlertCircle, CheckCircle2, X, Plus,
  ChevronLeft, ChevronRight, Barcode, ScanLine,
  ArrowRight, Package, TrendingDown, TrendingUp,
  Filter,
} from "lucide-react";
import { inventoryApi, productsApi, getCashierIdFromToken } from "@/lib/api";
import type { StockMovementRead, StockMovementStatus, Product } from "@/lib/api";

const PAGE_SIZE = 15;

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Add Movement Modal ────────────────────────────────────────────────────────

type ModalStep = "scan" | "details";

function AddMovementModal({
  onClose, onSaved,
}: { onClose: () => void; onSaved: (m: StockMovementRead) => void }) {
  const [step,     setStep]     = useState<ModalStep>("scan");
  const [barcode,  setBarcode]  = useState("");
  const [product,  setProduct]  = useState<Product | null>(null);
  const [status,   setStatus]   = useState<StockMovementStatus>("stock_in");
  const [quantity, setQuantity] = useState("1");
  const [scanning, setScanning] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "scan") setTimeout(() => barcodeRef.current?.focus(), 80);
  }, [step]);

  async function handleScan(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !barcode.trim()) return;
    e.preventDefault();
    setScanning(true);
    setError("");
    try {
      const p = await productsApi.getByBarcode(barcode.trim());
      setProduct(p);
      setStep("details");
    } catch {
      setError("No product found for this barcode.");
    } finally {
      setScanning(false);
    }
  }

  async function handleSave() {
    if (!product || !barcode.trim()) return;
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) { setError("Enter a valid quantity (≥ 1)."); return; }
    setSaving(true);
    setError("");
    try {
      const result = await inventoryApi.create({ barcode: barcode.trim(), status, quantity: qty });
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to record movement.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {step === "scan" ? "Scan Product" : "Record Movement"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === "scan" ? "Scan or type barcode, then press Enter" : product?.name}
              </p>
            </div>
          </div>
          <button type="button" title="Close" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Step: Scan */}
          {step === "scan" && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 border-2 border-violet-200 flex items-center justify-center">
                  <ScanLine className="w-8 h-8 text-violet-500" />
                </div>
                <div className="relative w-full">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={barcode}
                    onChange={e => { setBarcode(e.target.value); setError(""); }}
                    onKeyDown={handleScan}
                    placeholder="Barcode…"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm font-mono text-center tracking-widest text-gray-800 outline-none transition-all"
                  />
                  {scanning && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />}
                </div>
                {error && (
                  <div className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                  </div>
                )}
                <button type="button"
                  onClick={() => { if (barcode.trim()) handleScan({ key: "Enter", preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>); }}
                  disabled={!barcode.trim() || scanning}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-200">
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {scanning ? "Looking up…" : "Look Up Product"}
                </button>
              </div>
            </>
          )}

          {/* Step: Details */}
          {step === "details" && product && (
            <>
              {/* Product card */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{product.sku} · {product.quantity_in_stock} in stock</p>
                </div>
              </div>

              {/* Movement type */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Movement Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "stock_in",  label: "Stock In",  icon: ArrowDownToLine, active: "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200" },
                    { value: "stock_out", label: "Stock Out", icon: ArrowUpFromLine,  active: "bg-red-600 border-red-600 text-white shadow-md shadow-red-200" },
                  ] as const).map(({ value, label, icon: Icon, active }) => (
                    <button key={value} type="button" onClick={() => setStatus(value)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all
                        ${status === value ? active : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  title="Quantity"
                  placeholder="1"
                  onChange={e => { setQuantity(e.target.value); setError(""); }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm text-gray-800 font-semibold outline-none transition-all text-center text-lg"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setStep("scan"); setProduct(null); setError(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                  Re-scan
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {saving ? "Saving…" : "Record Movement"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [movements, setMovements] = useState<StockMovementRead[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(false);
  const [filter,    setFilter]    = useState<StockMovementStatus | "">("");
  const [search,    setSearch]    = useState("");
  const [addOpen,   setAddOpen]   = useState(false);
  const [toast,     setToast]     = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [movs, prods] = await Promise.all([
        inventoryApi.getAll({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
        productsApi.getAll({ limit: 500 }),
      ]);
      setMovements(movs);
      setHasMore(movs.length === PAGE_SIZE);
      setProducts(prods);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  const cashierId = getCashierIdFromToken();

  const filtered = movements.filter(m => {
    if (filter && m.status !== filter) return false;
    if (search) {
      const p = productMap[m.product_id];
      const name = p?.name ?? "";
      const sku  = p?.sku  ?? "";
      if (!name.toLowerCase().includes(search.toLowerCase()) && !sku.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const stockInCount  = movements.filter(m => m.status === "stock_in").length;
  const stockOutCount = movements.filter(m => m.status === "stock_out").length;

  function handleSaved(m: StockMovementRead) {
    setAddOpen(false);
    setMovements(prev => [m, ...prev]);
    showToast("Stock movement recorded");
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">
      {addOpen && <AddMovementModal onClose={() => setAddOpen(false)} onSaved={handleSaved} />}

      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-400 mt-0.5">Stock movements &amp; adjustments</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" title="Refresh" onClick={load}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-200">
              <Plus className="w-4 h-4" /> Add Movement
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Movements", value: movements.length, icon: Package,        bg: "bg-violet-50",  border: "border-violet-100", text: "text-violet-600" },
            { label: "Stock In",        value: stockInCount,     icon: TrendingUp,     bg: "bg-emerald-50", border: "border-emerald-100",text: "text-emerald-600" },
            { label: "Stock Out",       value: stockOutCount,    icon: TrendingDown,   bg: "bg-red-50",     border: "border-red-100",    text: "text-red-600" },
          ].map(({ label, value, icon: Icon, bg, border, text }) => (
            <div key={label} className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg}`}>
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{loading ? "—" : value}</p>
                <p className={`text-xs font-semibold ${text} mt-0.5`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search product name or SKU…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select title="Filter by type" value={filter} onChange={e => setFilter(e.target.value as StockMovementStatus | "")}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none cursor-pointer">
              <option value="">All types</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline underline-offset-2">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading movements…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
              <Package className="w-12 h-12" />
              <p className="text-sm font-semibold text-gray-400">No movements found</p>
              <button type="button" onClick={() => setAddOpen(true)}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add First Movement
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Product", "SKU", "Type", "Quantity", "Performed By", "Date"].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(m => {
                      const prod = productMap[m.product_id];
                      const isIn = m.status === "stock_in";
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isIn ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
                                {isIn
                                  ? <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                                  : <ArrowUpFromLine  className="w-3.5 h-3.5 text-red-600" />}
                              </div>
                              <span className="font-semibold text-gray-800">{prod?.name ?? `Product #${m.product_id}`}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-gray-400">{prod?.sku ?? "—"}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
                              ${isIn
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"}`}>
                              {isIn ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {isIn ? "Stock In" : "Stock Out"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-sm font-bold ${isIn ? "text-emerald-600" : "text-red-600"}`}>
                              {isIn ? "+" : "-"}{m.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500">
                            {m.performed_by_id === cashierId ? "You" : `Cashier #${m.performed_by_id}`}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            <span className="text-xs text-gray-400 ml-1.5">
                              {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filtered.length}</span> movements
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" title="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-gray-600 px-2">Page {page}</span>
                  <button type="button" title="Next page" onClick={() => setPage(p => p + 1)} disabled={!hasMore}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
