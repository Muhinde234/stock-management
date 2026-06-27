"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart, Search, Eye, Ban, RefreshCw,
  TrendingUp, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, AlertCircle,
  CreditCard, Smartphone, Banknote, Package,
  X, Loader2, Receipt, CalendarDays, Filter,
  DollarSign, Hash,
} from "lucide-react";
import { salesApi } from "@/lib/api";
import type { SaleRead, SaleStatus, PaymentMethod } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function fmt(val: string | number | null | undefined): string {
  const n = typeof val === "number" ? val : parseFloat(val ?? "0") || 0;
  return n.toFixed(2);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const PM_LABEL: Record<PaymentMethod, string> = {
  cash:         "Cash",
  card:         "Card",
  mobile_money: "Mobile Money",
  other:        "Other",
};

const PM_ICON: Record<PaymentMethod, React.ElementType> = {
  cash:         Banknote,
  card:         CreditCard,
  mobile_money: Smartphone,
  other:        ShoppingCart,
};

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2, label: "Completed" },
  voided:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: XCircle,      label: "Voided"    },
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: Clock,        label: "Pending"   },
};

function StatusBadge({ status }: { status: SaleStatus }) {
  const cfg = STATUS_CFG[status] ?? { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: Clock, label: status };

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ── Payment badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ method }: { method: PaymentMethod }) {
  const Icon = PM_ICON[method] ?? ShoppingCart;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      <Icon className="w-3 h-3" /> {PM_LABEL[method] ?? method}
    </span>
  );
}

// ── Void confirm modal ────────────────────────────────────────────────────────

function VoidModal({
  sale, onClose, onVoided,
}: { sale: SaleRead; onClose: () => void; onVoided: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleVoid() {
    setLoading(true);
    setError("");
    try {
      await salesApi.void(sale.id);
      onVoided();
    } catch {
      setError("Failed to void this sale. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Void Sale</h3>
              <p className="text-xs text-gray-400 mt-0.5">{sale.sale_number}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Are you sure you want to void this sale of{" "}
            <span className="font-bold text-gray-900">${fmt(sale.grand_total)}</span>?
            This action cannot be undone.
          </p>

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="button" onClick={handleVoid} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              {loading ? "Voiding…" : "Void Sale"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sale detail panel ─────────────────────────────────────────────────────────

function SaleDetailPanel({
  sale, onClose, onVoid,
}: { sale: SaleRead; onClose: () => void; onVoid: () => void }) {
  const subtotal  = parseFloat(sale.subtotal)        || 0;
  const discount  = parseFloat(sale.discount_amount) || 0;
  const tax       = parseFloat(sale.tax_amount)       || 0;
  const grand     = parseFloat(sale.grand_total)      || 0;
  const change    = parseFloat(sale.change_due)       || 0;
  const received  = sale.cash_received ? parseFloat(sale.cash_received) : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{sale.sale_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(sale.sale_date)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} title="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status + payment */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={sale.status} />
            <PaymentBadge method={sale.payment_method} />
          </div>

          {/* Items */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Items ({sale.items.length})</p>
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {sale.items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No item details available</p>
              ) : sale.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Product #{item.product_id}
                      </p>
                      {item.barcode && (
                        <p className="text-[11px] font-mono text-gray-400">{item.barcode}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${fmt(item.total_price)}</p>
                    <p className="text-[11px] text-gray-400">
                      {item.quantity} × ${fmt(item.unit_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Breakdown</p>
            <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {[
                { label: "Subtotal",   value: `$${subtotal.toFixed(2)}`,  muted: false },
                { label: "Discount",   value: `-$${discount.toFixed(2)}`, muted: true  },
                { label: "Tax",        value: `+$${tax.toFixed(2)}`,      muted: true  },
              ].map(({ label, value, muted }) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className={muted ? "text-gray-400" : "text-gray-600 font-medium"}>{label}</span>
                  <span className={muted ? "text-gray-400" : "text-gray-700 font-semibold"}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3.5 bg-gray-50">
                <span className="text-sm font-bold text-gray-900">Grand Total</span>
                <span className="text-base font-bold text-emerald-600">${grand.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cash / change */}
          {received !== null && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Cash</p>
              <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-600">Received</span>
                  <span className="font-semibold text-gray-800">${received.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-600">Change due</span>
                  <span className="font-semibold text-gray-800">${change.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-col gap-2 text-xs text-gray-400">
            <span>Sale ID: <span className="font-mono text-gray-600">#{sale.id}</span></span>
            <span>Cashier ID: <span className="font-mono text-gray-600">#{sale.cashier_id}</span></span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Close
          </button>
          {sale.status !== "voided" && (
            <button type="button" onClick={onVoid}
              className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-semibold transition-all flex items-center justify-center gap-2">
              <Ban className="w-3.5 h-3.5" /> Void Sale
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [sales,       setSales]       = useState<SaleRead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "">("");
  const [pmFilter,    setPmFilter]    = useState<PaymentMethod | "">("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [viewSale,    setViewSale]    = useState<SaleRead | null>(null);
  const [voidSale,    setVoidSale]    = useState<SaleRead | null>(null);
  const [toast,       setToast]       = useState<{ message: string; type: "success" | "error" } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived stats (from current page — refresh gives all) ──────────────────
  const totalRevenue    = sales.reduce((s, r) => s + (parseFloat(r.grand_total) || 0), 0);
  const completedCount  = sales.filter(s => s.status === "completed").length;
  const voidedCount     = sales.filter(s => s.status === "voided").length;
  const pendingCount    = sales.filter(s => s.status === "pending").length;

  // ── Filtered list (client-side by search/status/pm/date) ──────────────────
  const filtered = sales.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (pmFilter     && s.payment_method !== pmFilter) return false;
    if (search && !s.sale_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(s.sale_date) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(s.sale_date) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const skip  = (page - 1) * PAGE_SIZE;
      const data  = await salesApi.getAll({ skip, limit: PAGE_SIZE });
      setSales(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadSales(); }, [loadSales]);

  // debounced search
  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 300);
  }

  function handleVoided() {
    setVoidSale(null);
    setViewSale(null);
    loadSales();
    showToast("Sale voided successfully");
  }

  const totalPages = page + (hasMore ? 1 : 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">

      {/* ── Modals / panels ── */}
      {voidSale && (
        <VoidModal
          sale={voidSale}
          onClose={() => setVoidSale(null)}
          onVoided={handleVoided}
        />
      )}
      {viewSale && (
        <SaleDetailPanel
          sale={viewSale}
          onClose={() => setViewSale(null)}
          onVoid={() => { setVoidSale(viewSale); }}
        />
      )}

      {/* ── Page header ── */}
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sales</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Transaction history &amp; receipts
            </p>
          </div>
          <button
            type="button"
            onClick={loadSales}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: `$${totalRevenue.toFixed(2)}`,
              icon: DollarSign,
              bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-600",
            },
            {
              label: "Completed",
              value: String(completedCount),
              icon: CheckCircle2,
              bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600",
            },
            {
              label: "Voided",
              value: String(voidedCount),
              icon: XCircle,
              bg: "bg-red-50", border: "border-red-100", text: "text-red-600",
            },
            {
              label: "Pending",
              value: String(pendingCount),
              icon: Clock,
              bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600",
            },
          ].map(({ label, value, icon: Icon, bg, border, text }) => (
            <div key={label} className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg}`}>
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className={`text-xs font-semibold ${text} mt-0.5`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters bar ── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search sale number…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as SaleStatus | ""); setPage(1); }}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none cursor-pointer"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="voided">Voided</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Payment method filter */}
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={pmFilter}
              onChange={(e) => { setPmFilter(e.target.value as PaymentMethod | ""); setPage(1); }}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none cursor-pointer"
            >
              <option value="">All payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                title="From date"
                className="pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              title="To date"
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Clear filters */}
          {(search || statusFilter || pmFilter || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearch(""); setSearchInput(""); setStatusFilter(""); setPmFilter("");
                setDateFrom(""); setDateTo(""); setPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button type="button" onClick={loadSales}
              className="ml-auto text-xs font-semibold underline underline-offset-2 hover:text-red-900">
              Retry
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading sales…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
              <Receipt className="w-12 h-12" />
              <p className="text-sm font-semibold text-gray-400">No sales found</p>
              <p className="text-xs text-gray-300">
                {search || statusFilter || pmFilter || dateFrom || dateTo
                  ? "Try adjusting your filters"
                  : "Sales will appear here once checkout is used"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Sale #", "Date & Time", "Items", "Payment", "Total", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((sale) => (
                      <tr key={sale.id} className="group hover:bg-gray-50/70 transition-colors">
                        {/* Sale number */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                              <Hash className="w-3.5 h-3.5 text-violet-500" />
                            </div>
                            <span className="font-mono text-xs font-semibold text-gray-800">{sale.sale_number}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-sm text-gray-700 font-medium">{fmtDateShort(sale.sale_date)}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(sale.sale_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>

                        {/* Items count */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                            <Package className="w-3 h-3" />
                            {sale.items.length} {sale.items.length === 1 ? "item" : "items"}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3.5">
                          <PaymentBadge method={sale.payment_method} />
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-bold text-gray-900">${fmt(sale.grand_total)}</p>
                          {parseFloat(sale.discount_amount) > 0 && (
                            <p className="text-[11px] text-emerald-600 mt-0.5">-${fmt(sale.discount_amount)} disc.</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={sale.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" title="View details"
                              onClick={() => setViewSale(sale)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {sale.status !== "voided" && (
                              <button type="button" title="Void sale"
                                onClick={() => setVoidSale(sale)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                  <span className="font-semibold text-gray-600">{sales.length}</span> loaded
                </p>
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-gray-600 px-2">Page {page}</span>
                  <button type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Summary footer ── */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span>
                <span className="font-bold text-gray-900">{filtered.filter(s => s.status === "completed").length}</span>{" "}
                completed sale{filtered.filter(s => s.status === "completed").length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              Revenue:{" "}
              <span className="text-emerald-600">
                ${filtered
                  .filter(s => s.status === "completed")
                  .reduce((sum, s) => sum + (parseFloat(s.grand_total) || 0), 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
