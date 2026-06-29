"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShoppingBag, ScanLine, Package, Boxes, Layers,
  Loader2, AlertCircle, Search, Trash2, RefreshCw,
  User, Phone, X, ChevronDown, ChevronUp,
  CalendarDays, BarChart3,
} from "lucide-react";
import { purchasesApi, type Purchase } from "@/lib/api/purchases";
import { ApiError } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-RW", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function fmtPrice(v?: number) {
  if (v == null) return "—";
  return v.toLocaleString() + " RWF";
}

function TypeBadge({ type }: { type?: string }) {
  if (type === "package") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
        <Boxes className="w-3 h-3" /> Package
      </span>
    );
  }
  if (type === "detail") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
        <Layers className="w-3 h-3" /> Detail
      </span>
    );
  }
  return <span className="text-gray-400 text-xs">—</span>;
}

// ── Purchase row (expandable) ─────────────────────────────────────────────────

function PurchaseRow({
  purchase,
  onDelete,
}: {
  purchase: Purchase;
  onDelete: (id: number) => void;
}) {
  const [open,     setOpen]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const total = (purchase.unit_price ?? 0) * (purchase.quantity ?? 0);

  async function handleDelete() {
    if (!confirm("Delete this purchase record?")) return;
    setDeleting(true);
    try {
      await purchasesApi.delete(purchase.id);
      onDelete(purchase.id);
    } catch {
      alert("Failed to delete purchase.");
      setDeleting(false);
    }
  }

  return (
    <>
      <tr
        className="hover:bg-violet-50/40 transition-colors cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          #{purchase.id}
        </td>
        <td className="px-4 py-3">
          <TypeBadge type={purchase.purchase_type} />
        </td>
        <td className="px-4 py-3">
          {purchase.scanned_code ? (
            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
              {purchase.scanned_code}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {purchase.sku
            ? <span className="font-mono">{purchase.sku}</span>
            : purchase.product_id
              ? <span className="text-gray-400">ID #{purchase.product_id}</span>
              : <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
          {purchase.quantity ?? "—"}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap">
          {fmtPrice(purchase.unit_price)}
        </td>
        <td className="px-4 py-3 text-sm font-bold text-emerald-700 text-right whitespace-nowrap">
          {fmtPrice(total || undefined)}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          {fmtDate(purchase.created_at)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              title="Details"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-violet-100 hover:text-violet-600 transition"
            >
              {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              {deleting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {open && (
        <tr className="bg-violet-50/60">
          <td colSpan={9} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {purchase.supplier_name && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Supplier</p>
                    <p className="font-medium">{purchase.supplier_name}</p>
                  </div>
                </div>
              )}
              {purchase.supplier_phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Phone</p>
                    <p className="font-medium">{purchase.supplier_phone}</p>
                  </div>
                </div>
              )}
              {purchase.notes && (
                <div className="flex items-start gap-2 text-gray-600 col-span-full">
                  <Package className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Notes</p>
                    <p className="text-xs leading-relaxed">{purchase.notes}</p>
                  </div>
                </div>
              )}
              {purchase.updated_at && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarDays className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Updated</p>
                    <p className="font-medium">{fmtDate(purchase.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "package" | "detail">("all");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await purchasesApi.getAll();
      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load purchases.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = purchases.filter(p => {
    if (typeFilter !== "all" && p.purchase_type !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.scanned_code?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.supplier_name?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  });

  // Stats
  const totalCost     = purchases.reduce((s, p) => s + (p.unit_price ?? 0) * (p.quantity ?? 0), 0);
  const packageCount  = purchases.filter(p => p.purchase_type === "package").length;
  const detailCount   = purchases.filter(p => p.purchase_type === "detail").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
            <p className="text-sm text-gray-500">All stock check-in records</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Records",   value: String(purchases.length), icon: ScanLine,    color: "bg-violet-50 text-violet-600"  },
          { label: "Packages",        value: String(packageCount),     icon: Boxes,       color: "bg-blue-50 text-blue-600"      },
          { label: "Details",         value: String(detailCount),      icon: Layers,      color: "bg-emerald-50 text-emerald-600" },
          { label: "Total Cost",      value: fmtPrice(totalCost),      icon: BarChart3,   color: "bg-amber-50 text-amber-600"    },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium">{label}</p>
              <p className="text-lg font-black text-gray-900 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by barcode, SKU, supplier…"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "package", "detail"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                typeFilter === t
                  ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t === "all" ? "All" : t === "package" ? "📦 Package" : "🔹 Detail"}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            <p className="text-sm">Loading purchases…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <ShoppingBag className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-medium">
              {search || typeFilter !== "all" ? "No records match your filter." : "No purchases yet. Use Check In to record stock."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["#", "Type", "Barcode / QR", "SKU / Product", "Qty", "Unit Price", "Total", "Date", ""].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${h === "Qty" || h === "Unit Price" || h === "Total" ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <PurchaseRow
                    key={p.id}
                    purchase={p}
                    onDelete={id => setPurchases(prev => prev.filter(x => x.id !== id))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 text-xs text-gray-400">
            Showing {filtered.length} of {purchases.length} record{purchases.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
