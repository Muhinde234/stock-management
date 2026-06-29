"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart, Search, Eye, Ban, RefreshCw,
  TrendingUp, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, AlertCircle,
  CreditCard, Smartphone, Banknote, Package,
  X, Loader2, Receipt, CalendarDays, Filter,
  Download, FileText, Hash,
} from "lucide-react";
import { salesApi } from "@/lib/api";
import type { SaleRead, SaleStatus, PaymentMethod } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function fmtRwf(val: string | number | null | undefined): string {
  const n = typeof val === "number" ? val : parseFloat(String(val ?? "0")) || 0;
  return n.toLocaleString("en-RW") + " RWF";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-RW", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const PM_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash", card: "Card", mobile_money: "Mobile Money", other: "Other",
};
const PM_ICON: Record<PaymentMethod, React.ElementType> = {
  cash: Banknote, card: CreditCard, mobile_money: Smartphone, other: ShoppingCart,
};
const STATUS_CFG: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2, label: "Completed" },
  voided:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     icon: XCircle,      label: "Voided"    },
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   icon: Clock,        label: "Pending"   },
};

function StatusBadge({ status }: { status: SaleStatus }) {
  const cfg = STATUS_CFG[status] ?? { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: Clock, label: status };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function PaymentBadge({ method }: { method: PaymentMethod }) {
  const Icon = PM_ICON[method] ?? ShoppingCart;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      <Icon className="w-3 h-3" /> {PM_LABEL[method] ?? method}
    </span>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function exportCSV(sales: SaleRead[]) {
  const headers = [
    "Sale Number", "Date", "Items", "Payment Method",
    "Subtotal (RWF)", "Discount (RWF)", "Tax (RWF)", "Grand Total (RWF)",
    "Cash Received (RWF)", "Change Due (RWF)", "Status",
  ];
  const rows = sales.map(s => [
    s.sale_number,
    fmtDate(s.sale_date).replace(/,/g, ""),
    s.items.length,
    PM_LABEL[s.payment_method] ?? s.payment_method,
    parseFloat(s.subtotal        || "0").toFixed(0),
    parseFloat(s.discount_amount || "0").toFixed(0),
    parseFloat(s.tax_amount      || "0").toFixed(0),
    parseFloat(s.grand_total     || "0").toFixed(0),
    parseFloat(s.cash_received   || "0").toFixed(0),
    parseFloat(s.change_due      || "0").toFixed(0),
    s.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), {
    href:     url,
    download: `sales-report-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── Void confirm modal ────────────────────────────────────────────────────────

function VoidModal({ sale, onClose, onVoided }: { sale: SaleRead; onClose: () => void; onVoided: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleVoid() {
    setLoading(true); setError("");
    try { await salesApi.void(sale.id); onVoided(); }
    catch { setError("Failed to void this sale. Please try again."); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Void Sale</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{sale.sale_number}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Are you sure you want to void this sale of{" "}
          <span className="font-bold text-gray-900">{fmtRwf(sale.grand_total)}</span>? This cannot be undone.
        </p>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="button" onClick={handleVoid} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            {loading ? "Voiding…" : "Void Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sale detail panel ─────────────────────────────────────────────────────────

function SaleDetailPanel({ sale, onClose, onVoid }: { sale: SaleRead; onClose: () => void; onVoid: () => void }) {
  const grand    = parseFloat(sale.grand_total)      || 0;
  const subtotal = parseFloat(sale.subtotal)         || 0;
  const discount = parseFloat(sale.discount_amount)  || 0;
  const tax      = parseFloat(sale.tax_amount)       || 0;
  const change   = parseFloat(sale.change_due)       || 0;
  const received = sale.cash_received ? parseFloat(sale.cash_received) : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-gray-900 font-mono">{sale.sale_number}</p>
                <StatusBadge status={sale.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(sale.sale_date)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} title="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Payment method */}
          <div className="flex items-center gap-2">
            <PaymentBadge method={sale.payment_method} />
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Items ({sale.items.length})
            </p>
            <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {sale.items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No item details available</p>
              ) : sale.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Product #{item.product_id}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {item.quantity} × {fmtRwf(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{fmtRwf(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Breakdown</p>
            <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {[
                { label: "Subtotal",  value: fmtRwf(subtotal), muted: false },
                { label: "Discount",  value: `- ${fmtRwf(discount)}`, muted: true  },
                { label: "Tax",       value: `+ ${fmtRwf(tax)}`,      muted: true  },
              ].map(({ label, value, muted }) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className={muted ? "text-gray-400" : "text-gray-600 font-medium"}>{label}</span>
                  <span className={muted ? "text-gray-400" : "text-gray-700 font-semibold"}>{value}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3.5 bg-violet-50">
                <span className="text-sm font-bold text-gray-900">Grand Total</span>
                <span className="text-base font-black text-violet-700">{fmtRwf(grand)}</span>
              </div>
            </div>
          </div>

          {/* Cash */}
          {received !== null && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cash</p>
              <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-600">Received</span>
                  <span className="font-semibold text-gray-800">{fmtRwf(received)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-600">Change Due</span>
                  <span className="font-bold text-emerald-700">{fmtRwf(change)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="px-4 py-3 bg-gray-50 rounded-xl text-xs text-gray-400 space-y-1 font-mono">
            <p>Receipt No. : <span className="text-gray-700 font-bold">{sale.sale_number}</span></p>
            <p>System ID   : <span className="text-gray-600">#{sale.id}</span></p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Close
          </button>
          {sale.status !== "voided" && (
            <button type="button" onClick={onVoid}
              className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-semibold transition flex items-center justify-center gap-2">
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
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [sales,        setSales]        = useState<SaleRead[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [exporting,    setExporting]    = useState(false);
  const [error,        setError]        = useState("");
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [searchInput,  setSearchInput]  = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "">("");
  const [pmFilter,     setPmFilter]     = useState<PaymentMethod | "">("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [viewSale,     setViewSale]     = useState<SaleRead | null>(null);
  const [voidSale,     setVoidSale]     = useState<SaleRead | null>(null);
  const [toast,        setToast]        = useState<{ message: string; type: "success" | "error" } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = sales.filter(s => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (pmFilter     && s.payment_method !== pmFilter) return false;
    if (dateFrom && new Date(s.sale_date) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(s.sale_date) > new Date(dateTo + "T23:59:59")) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.sale_number.toLowerCase().includes(q);
    }
    return true;
  });

  const completedSales = filtered.filter(s => s.status === "completed");
  const totalRevenue   = completedSales.reduce((s, r) => s + (parseFloat(r.grand_total) || 0), 0);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  const loadSales = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await salesApi.getAll({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE });
      setSales(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales.");
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadSales(); }, [loadSales]);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 300);
  }

  function handleVoided() {
    setVoidSale(null); setViewSale(null);
    loadSales();
    showToast("Sale voided successfully");
  }

  async function handleExportAll() {
    setExporting(true);
    try {
      // Fetch all sales (high limit) for full export
      const all = await salesApi.getAll({ skip: 0, limit: 10000 });
      const toExport = all.filter(s => {
        if (statusFilter && s.status !== statusFilter) return false;
        if (pmFilter     && s.payment_method !== pmFilter) return false;
        return true;
      });
      exportCSV(toExport);
      showToast(`Exported ${toExport.length} sales to CSV`);
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally { setExporting(false); }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">

      {voidSale && <VoidModal sale={voidSale} onClose={() => setVoidSale(null)} onVoided={handleVoided} />}
      {viewSale && (
        <SaleDetailPanel
          sale={viewSale}
          onClose={() => setViewSale(null)}
          onVoid={() => { setVoidSale(viewSale); }}
        />
      )}

      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sales</h1>
              <p className="text-sm text-gray-400">Transaction history &amp; receipts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadSales} disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button type="button" onClick={handleExportAll} disabled={exporting || loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-200">
              {exporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue",  value: fmtRwf(totalRevenue),                     icon: TrendingUp,  bg: "bg-violet-50",  border: "border-violet-100",  text: "text-violet-700"  },
            { label: "Completed",      value: String(filteredCount("completed")),         icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700" },
            { label: "Voided",         value: String(filteredCount("voided")),            icon: XCircle,     bg: "bg-red-50",     border: "border-red-100",     text: "text-red-700"     },
            { label: "Pending",        value: String(filteredCount("pending")),           icon: Clock,       bg: "bg-amber-50",   border: "border-amber-100",   text: "text-amber-700"   },
          ].map(({ label, value, icon: Icon, bg, border, text }) => (
            <div key={label} className={`flex items-center gap-3 p-4 rounded-2xl border ${border} ${bg}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} border ${border}`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
                <p className={`text-xs font-semibold ${text} mt-1`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="text" value={searchInput} onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by receipt number…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition" />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as SaleStatus | ""); setPage(1); }}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none cursor-pointer">
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="voided">Voided</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select value={pmFilter} onChange={e => { setPmFilter(e.target.value as PaymentMethod | ""); setPage(1); }}
              className="pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none cursor-pointer">
              <option value="">All payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input type="date" value={dateFrom} title="From date"
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <span className="text-gray-400 text-sm">—</span>
            <input type="date" value={dateTo} title="To date"
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>

          {(search || statusFilter || pmFilter || dateFrom || dateTo) && (
            <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setPmFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button type="button" onClick={loadSales} className="ml-auto text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              <span className="text-sm">Loading sales…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
              <FileText className="w-12 h-12" />
              <p className="text-sm font-semibold text-gray-400">No sales found</p>
              <p className="text-xs text-gray-300">
                {search || statusFilter || pmFilter || dateFrom || dateTo
                  ? "Try adjusting your filters"
                  : "Sales will appear here once checkout is completed"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {["Receipt No.", "Date & Time", "Items", "Payment", "Grand Total", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(sale => (
                      <tr key={sale.id} className="group hover:bg-violet-50/30 transition-colors cursor-pointer"
                        onClick={() => setViewSale(sale)}>

                        {/* Receipt number */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                              <Hash className="w-3.5 h-3.5 text-violet-500" />
                            </div>
                            <span className="font-mono text-xs font-bold text-gray-900">{sale.sale_number}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-sm text-gray-700 font-medium">{fmtDateShort(sale.sale_date)}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {new Date(sale.sale_date).toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                            <Package className="w-3 h-3" />
                            {sale.items.length}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="px-4 py-3.5"><PaymentBadge method={sale.payment_method} /></td>

                        {/* Total */}
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-bold text-gray-900 tabular-nums">{fmtRwf(sale.grand_total)}</p>
                          {parseFloat(sale.discount_amount) > 0 && (
                            <p className="text-[11px] text-emerald-600 mt-0.5">- {fmtRwf(sale.discount_amount)} disc.</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5"><StatusBadge status={sale.status} /></td>

                        {/* Actions */}
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button type="button" title="View details" onClick={() => setViewSale(sale)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {sale.status !== "voided" && (
                              <button type="button" title="Void sale" onClick={() => setVoidSale(sale)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
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

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/50">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">{filtered.length}</span> sale{filtered.length !== 1 ? "s" : ""}
                  {completedSales.length > 0 && (
                    <span className="ml-3 text-emerald-700 font-semibold">· {fmtRwf(totalRevenue)} revenue</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-gray-600 px-2">Page {page}</span>
                  <button type="button" onClick={() => setPage(p => p + 1)} disabled={!hasMore}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
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

  function filteredCount(status: string) {
    return filtered.filter(s => s.status === status).length;
  }
}
