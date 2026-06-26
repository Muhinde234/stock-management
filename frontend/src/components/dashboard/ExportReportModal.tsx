"use client";

import { useState } from "react";
import { X, Download, FileText, FileSpreadsheet, Filter, Check, ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReportType = "sales" | "inventory" | "financial" | "customers";
type ExportFormat = "csv" | "excel" | "pdf";
type DatePreset = "today" | "week" | "month" | "quarter" | "custom";

// ── Column definitions per report type ───────────────────────────────────────

const REPORT_COLUMNS: Record<ReportType, { key: string; label: string }[]> = {
  sales: [
    { key: "date",       label: "Date"           },
    { key: "invoice",    label: "Invoice #"       },
    { key: "customer",   label: "Customer"        },
    { key: "products",   label: "Products"        },
    { key: "qty",        label: "Quantity"        },
    { key: "amount",     label: "Amount"          },
    { key: "discount",   label: "Discount"        },
    { key: "tax",        label: "Tax"             },
    { key: "status",     label: "Status"          },
    { key: "payment",    label: "Payment Method"  },
    { key: "cashier",    label: "Cashier"         },
    { key: "notes",      label: "Notes"           },
  ],
  inventory: [
    { key: "name",       label: "Product Name"    },
    { key: "sku",        label: "SKU"             },
    { key: "category",   label: "Category"        },
    { key: "brand",      label: "Brand"           },
    { key: "stock",      label: "Stock Level"     },
    { key: "unit",       label: "Unit"            },
    { key: "buyPrice",   label: "Buying Price"    },
    { key: "sellPrice",  label: "Selling Price"   },
    { key: "value",      label: "Total Value"     },
    { key: "warehouse",  label: "Warehouse"       },
    { key: "expiry",     label: "Expiry Date"     },
    { key: "status",     label: "Status"          },
  ],
  financial: [
    { key: "date",       label: "Date"            },
    { key: "ref",        label: "Reference"       },
    { key: "type",       label: "Type"            },
    { key: "description",label: "Description"     },
    { key: "category",   label: "Category"        },
    { key: "debit",      label: "Debit"           },
    { key: "credit",     label: "Credit"          },
    { key: "balance",    label: "Balance"         },
    { key: "account",    label: "Account"         },
    { key: "notes",      label: "Notes"           },
  ],
  customers: [
    { key: "name",       label: "Customer Name"   },
    { key: "email",      label: "Email"           },
    { key: "phone",      label: "Phone"           },
    { key: "address",    label: "Address"         },
    { key: "purchases",  label: "Total Purchases" },
    { key: "spent",      label: "Total Spent"     },
    { key: "debt",       label: "Debt Balance"    },
    { key: "loyalty",    label: "Loyalty Points"  },
    { key: "lastSeen",   label: "Last Purchase"   },
    { key: "joinedAt",   label: "Joined Date"     },
    { key: "status",     label: "Status"          },
  ],
};

const REPORT_FILTERS: Record<ReportType, { label: string; key: string; options: string[] }[]> = {
  sales: [
    { label: "Status",         key: "status",  options: ["All", "Completed", "Pending", "Cancelled", "Refunded"] },
    { label: "Payment Method", key: "payment", options: ["All", "Cash", "Mobile Money", "Card", "Credit"] },
  ],
  inventory: [
    { label: "Category",    key: "category", options: ["All", "Electronics", "Clothing", "Food", "Accessories"] },
    { label: "Stock Level", key: "stock",    options: ["All", "In Stock", "Low Stock", "Out of Stock"] },
    { label: "Warehouse",   key: "warehouse",options: ["All", "Main Warehouse", "Warehouse 2"] },
  ],
  financial: [
    { label: "Type",     key: "type",    options: ["All", "Income", "Expense", "Transfer"] },
    { label: "Account",  key: "account", options: ["All", "Cash", "Bank", "Mobile Money"] },
  ],
  customers: [
    { label: "Status",   key: "status",  options: ["All", "Active", "Inactive", "VIP"] },
    { label: "Has Debt", key: "debt",    options: ["All", "Yes", "No"] },
  ],
};

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today",   label: "Today"        },
  { key: "week",    label: "This Week"    },
  { key: "month",   label: "This Month"   },
  { key: "quarter", label: "Last 3 Months"},
  { key: "custom",  label: "Custom Range" },
];

const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: React.ElementType; ext: string }[] = [
  { key: "csv",   label: "CSV",   icon: FileText,        ext: ".csv"  },
  { key: "excel", label: "Excel", icon: FileSpreadsheet, ext: ".xlsx" },
  { key: "pdf",   label: "PDF",   icon: FileText,        ext: ".pdf"  },
];

// ── Mock CSV export ───────────────────────────────────────────────────────────

function downloadCSV(reportType: ReportType, selectedCols: string[]) {
  const cols = REPORT_COLUMNS[reportType].filter((c) => selectedCols.includes(c.key));
  const header = cols.map((c) => c.label).join(",");
  const rows = Array.from({ length: 5 }, (_, i) =>
    cols.map((c) => `Sample ${c.key} ${i + 1}`).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `stockpro-${reportType}-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { onClose: () => void }

export default function ExportReportModal({ onClose }: Props) {
  const [reportType,   setReportType]   = useState<ReportType>("sales");
  const [datePreset,   setDatePreset]   = useState<DatePreset>("month");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [format,       setFormat]       = useState<ExportFormat>("csv");
  const [filters,      setFilters]      = useState<Record<string, string>>({});
  const [selectedCols, setSelectedCols] = useState<string[]>(
    REPORT_COLUMNS["sales"].map((c) => c.key)
  );
  const [exporting,    setExporting]    = useState(false);
  const [done,         setDone]         = useState(false);

  const columns  = REPORT_COLUMNS[reportType];
  const filterDefs = REPORT_FILTERS[reportType];
  const allSelected = selectedCols.length === columns.length;

  function switchType(t: ReportType) {
    setReportType(t);
    setSelectedCols(REPORT_COLUMNS[t].map((c) => c.key));
    setFilters({});
  }

  function toggleCol(key: string) {
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleAll() {
    setSelectedCols(allSelected ? [] : columns.map((c) => c.key));
  }

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      if (format === "csv") downloadCSV(reportType, selectedCols);
      setExporting(false);
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); }, 1200);
    }, 900);
  }

  const TABS: { key: ReportType; label: string }[] = [
    { key: "sales",     label: "Sales"     },
    { key: "inventory", label: "Inventory" },
    { key: "financial", label: "Financial" },
    { key: "customers", label: "Customers" },
  ];

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Download className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Export Report</h2>
              <p className="text-xs text-gray-400">Choose options and download your report</p>
            </div>
          </div>
          <button type="button" onClick={onClose} title="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Report Type Tabs */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report Type</p>
            <div className="flex gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchType(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    reportType === t.key
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Date Range</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setDatePreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    datePreset === p.key
                      ? "bg-violet-100 text-violet-700 border border-violet-300"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {datePreset === "custom" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="export-from" className="text-xs text-gray-400 mb-1 block">From</label>
                  <input
                    id="export-from"
                    type="date"
                    title="Start date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="export-to" className="text-xs text-gray-400 mb-1 block">To</label>
                  <input
                    id="export-to"
                    type="date"
                    title="End date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filterDefs.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                  <div className="relative">
                    <select
                      title={f.label}
                      value={filters[f.key] ?? "All"}
                      onChange={(e) => setFilter(f.key, e.target.value)}
                      className="w-full appearance-none px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white"
                    >
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Columns to Include
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-violet-600 font-medium hover:underline"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {columns.map((col) => {
                const active = selectedCols.includes(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleCol(col.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium text-left transition-all ${
                      active
                        ? "bg-violet-50 border-violet-300 text-violet-700"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      active ? "bg-violet-600 border-violet-600" : "border-gray-300 bg-white"
                    }`}>
                      {active && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    {col.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              {selectedCols.length} of {columns.length} columns selected
            </p>
          </div>

          {/* Format */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Export Format</p>
            <div className="flex gap-3">
              {FORMAT_OPTIONS.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFormat(f.key)}
                    className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      format === f.key
                        ? "bg-violet-50 border-violet-300 text-violet-700"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{f.label}</span>
                    <span className="ml-auto text-[10px] text-gray-400">{f.ext}</span>
                    {format === f.key && (
                      <span className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <p className="text-xs text-gray-400">
            {selectedCols.length === 0
              ? "Select at least one column to export"
              : `Ready to export ${selectedCols.length} columns as ${format.toUpperCase()}`}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || selectedCols.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-md shadow-violet-200"
            >
              {done ? (
                <>
                  <Check className="w-4 h-4" />
                  Exported!
                </>
              ) : exporting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
