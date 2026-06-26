"use client";

import { useState, useRef, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, ShoppingCart, Clock, TrendingUp,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Package, Users, AlertTriangle, Warehouse,
  Search, X, Plus, PackagePlus, UserPlus,
  Download, BarChart3, ArrowRight, ChevronDown,
} from "lucide-react";
import ExportReportModal from "@/components/dashboard/ExportReportModal";

// ── Stat card data ────────────────────────────────────────────────────────────

const STATS = [
  {
    label:    "Total Revenue",
    value:    "$24,780.00",
    prev:     "$22,018.00",
    change:   "12.5%",
    up:       true,
    icon:     DollarSign,
    iconBg:   "bg-violet-100",
    iconColor:"text-violet-600",
    stroke:   "#7c3aed",
    fill:     "#ede9fe",
    spark: [
      {v:22018},{v:23400},{v:21900},{v:25200},
      {v:23800},{v:26100},{v:24780},
    ],
  },
  {
    label:    "Total Purchases",
    value:    "$16,430.00",
    prev:     "$15,120.00",
    change:   "8.6%",
    up:       true,
    icon:     ShoppingCart,
    iconBg:   "bg-blue-100",
    iconColor:"text-blue-600",
    stroke:   "#3b82f6",
    fill:     "#dbeafe",
    spark: [
      {v:15120},{v:15800},{v:14900},{v:16500},
      {v:15600},{v:17000},{v:16430},
    ],
  },
  {
    label:    "Sales Return",
    value:    "$1,250.00",
    prev:     "$1,308.00",
    change:   "4.3%",
    up:       false,
    icon:     Clock,
    iconBg:   "bg-slate-100",
    iconColor:"text-slate-600",
    stroke:   "#94a3b8",
    fill:     "#f1f5f9",
    spark: [
      {v:1308},{v:1200},{v:1380},{v:1100},
      {v:1320},{v:1180},{v:1250},
    ],
  },
  {
    label:    "Total Profit",
    value:    "$8,350.00",
    prev:     "$7,210.00",
    change:   "15.7%",
    up:       true,
    icon:     DollarSign,
    iconBg:   "bg-orange-100",
    iconColor:"text-orange-600",
    stroke:   "#f97316",
    fill:     "#ffedd5",
    spark: [
      {v:7210},{v:7800},{v:7400},{v:8100},
      {v:7700},{v:8600},{v:8350},
    ],
  },
];

// ── Bar chart data ─────────────────────────────────────────────────────────────

const BAR_DATA = [
  { day: "May 19", sales: 3200, purchases: 2800 },
  { day: "May 19", sales: 4000, purchases: 3100 },
  { day: "May 20", sales: 3700, purchases: 2700 },
  { day: "May 21", sales: 4900, purchases: 3800 },
  { day: "May 22", sales: 3400, purchases: 2500 },
  { day: "May 23", sales: 3100, purchases: 2300 },
  { day: "May 24", sales: 3800, purchases: 2900 },
];

// ── Donut data ─────────────────────────────────────────────────────────────────

const PIE_DATA = [
  { name: "Macbook Pro",  value: 33, amount: "$8,250",  color: "#6d28d9", dot: "bg-violet-700" },
  { name: "iPhone 15",    value: 23, amount: "$5,620",  color: "#3b82f6", dot: "bg-blue-500"   },
  { name: "AirPods Pro",  value: 13, amount: "$3,250",  color: "#10b981", dot: "bg-emerald-500"},
  { name: "Apple Watch",  value:  9, amount: "$2,160",  color: "#f97316", dot: "bg-orange-500" },
  { name: "iPad Air",     value:  7, amount: "$1,850",  color: "#ec4899", dot: "bg-pink-500"   },
  { name: "Others",       value: 15, amount: "$3,650",  color: "#a78bfa", dot: "bg-violet-400" },
];

// ── Stock alerts ───────────────────────────────────────────────────────────────

const ALERTS = [
  { product:"Wireless Headphones", sku:"WH-1000XM5",   warehouse:"Main Warehouse", stock:5, level:"Low Stock" },
  { product:"iPhone 15 Pro",       sku:"IP15-PRO-256", warehouse:"Main Warehouse", stock:8, level:"Low Stock" },
  { product:"Logitech Keyboard",   sku:"LK-MX-KEYS",   warehouse:"Warehouse 2",   stock:3, level:"Critical"  },
  { product:'Samsung 24" Monitor', sku:"SM-24-IPS",     warehouse:"Warehouse 2",   stock:2, level:"Critical"  },
];

// ── Transactions ───────────────────────────────────────────────────────────────

const TRANSACTIONS = [
  { label:"Sale to John Doe",          ref:"INV-2026-1025", amount:"$385.00",   time:"Today, 10:24 AM",     icon:"sale"     },
  { label:"Purchase from TechStore",   ref:"PO-2026-0895",  amount:"$1,250.00", time:"Today, 09:15 AM",     icon:"purchase" },
  { label:"Stock Transfer",            ref:"ST-2026-0452",  amount:"$0.00",     time:"Yesterday, 04:30 PM", icon:"transfer" },
  { label:"Sale to Sarah Johnson",     ref:"INV-2026-1024", amount:"$750.00",   time:"Yesterday, 02:18 PM", icon:"sale"     },
  { label:"Purchase from Gadget World",ref:"PO-2026-0894",  amount:"$980.00",   time:"Yesterday, 11:40 AM", icon:"purchase" },
];

// ── Quick stats ────────────────────────────────────────────────────────────────

const QUICK = [
  { label:"Total Products",   value:"1,248", change:"+5.4% vs last month",  up:true,  bg:"bg-violet-100", color:"text-violet-600", icon:Package       },
  { label:"Total Warehouses", value:"4",     change:"No change",             up:null,  bg:"bg-blue-100",   color:"text-blue-600",   icon:Warehouse     },
  { label:"Low Stock Items",  value:"24",    change:"+2 vs yesterday",       up:false, bg:"bg-orange-100", color:"text-orange-600", icon:AlertTriangle },
  { label:"Out of Stock",     value:"8",     change:"-1 vs yesterday",       up:true,  bg:"bg-red-100",    color:"text-red-600",    icon:AlertTriangle },
  { label:"Total Customers",  value:"856",   change:"+18.2% vs last month",  up:true,  bg:"bg-teal-100",   color:"text-teal-600",   icon:Users         },
  { label:"Total Suppliers",  value:"42",    change:"No change",             up:null,  bg:"bg-slate-100",  color:"text-slate-600",  icon:Users         },
];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

const TOOLTIP_COLORS: Record<string, string> = {
  Sales:     "text-violet-700",
  Purchases: "text-violet-400",
};

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
        <p key={p.name} className={`font-semibold ${TOOLTIP_COLORS[p.name] ?? "text-gray-800"}`}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ── Search data ───────────────────────────────────────────────────────────────

const SEARCH_DATA = [
  { type: "Product",  label: "Wireless Headphones", sub: "WH-1000XM5 · 5 pcs left",  href: "/products" },
  { type: "Product",  label: "iPhone 15 Pro",        sub: "IP15-PRO · 8 pcs left",    href: "/products" },
  { type: "Product",  label: "Logitech Keyboard",    sub: "LK-MX-KEYS · 3 pcs left",  href: "/products" },
  { type: "Sale",     label: "INV-2026-1025",         sub: "John Doe · $385.00",        href: "/sales"    },
  { type: "Sale",     label: "INV-2026-1024",         sub: "Sarah Johnson · $750.00",   href: "/sales"    },
  { type: "Customer", label: "John Doe",              sub: "5 purchases · $2,340 total",href: "/customers"},
  { type: "Customer", label: "Sarah Johnson",         sub: "3 purchases · $1,450 total",href: "/customers"},
  { type: "Customer", label: "Jean Pierre",           sub: "2 purchases · $890 total",  href: "/customers"},
  { type: "Supplier", label: "TechStore Ltd",         sub: "12 orders · Active",        href: "/suppliers"},
  { type: "Supplier", label: "Gadget World",          sub: "8 orders · Active",         href: "/suppliers"},
];

const TYPE_COLOR: Record<string, string> = {
  Product:  "bg-violet-100 text-violet-700",
  Sale:     "bg-emerald-100 text-emerald-700",
  Customer: "bg-blue-100 text-blue-700",
  Supplier: "bg-amber-100 text-amber-700",
};

// ── Quick actions ──────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "New Sale",       icon: ShoppingCart, color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", href: "/sales"     },
  { label: "Add Product",    icon: Plus,         color: "bg-blue-50 text-blue-600 hover:bg-blue-100",          href: "/products"  },
  { label: "Add Customer",   icon: UserPlus,     color: "bg-violet-50 text-violet-600 hover:bg-violet-100",    href: "/customers" },
  { label: "Stock In",       icon: PackagePlus,  color: "bg-amber-50 text-amber-600 hover:bg-amber-100",       href: "/inventory" },
  { label: "View Reports",   icon: BarChart3,    color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",    href: "/reports"   },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [showExport,   setShowExport]   = useState(false);
  const [query,        setQuery]        = useState("");
  const [searchOpen,   setSearchOpen]   = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const results = query.length >= 1
    ? SEARCH_DATA.filter((d) =>
        d.label.toLowerCase().includes(query.toLowerCase()) ||
        d.sub.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-full">

      {/* ── Export modal ── */}
      {showExport && <ExportReportModal onClose={() => setShowExport(false)} />}

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning, Admin</h1>
          <p className="text-sm text-gray-400 mt-0.5">Here&apos;s what happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 shadow-sm">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>May 24, 2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* ── Quick Search + Actions ── */}
      <div className="flex items-center gap-4">

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Quick search — products, sales, customers…"
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm transition-all"
          />
          {query && (
            <button type="button" title="Clear" onClick={() => { setQuery(""); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown */}
          {searchOpen && (query.length >= 1) && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 overflow-hidden">
              {results.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400 text-center">No results for &quot;{query}&quot;</p>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {results.length} result{results.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {results.map((r, i) => (
                    <a key={i} href={r.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      onClick={() => setSearchOpen(false)}
                    >
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_COLOR[r.type]}`}>
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

        {/* Quick Action buttons */}
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color, href }) => (
            <a key={label} href={href}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${color}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:block">{label}</span>
            </a>
          ))}

          {/* Export Report */}
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md shadow-violet-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xl:block">Export Report</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map((s) => {
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
                    <span className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 ${
                      s.up ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {s.up
                        ? <ArrowUpRight className="w-3 h-3" />
                        : <ArrowDownRight className="w-3 h-3" />}
                      {s.change}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 mt-1 leading-tight">{s.value}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                vs last month <span className="font-medium text-gray-600">{s.prev}</span>
              </p>
              <div className="mt-2 -mx-1">
                <ResponsiveContainer width="100%" height={48}>
                  <AreaChart data={s.spark}>
                    <defs>
                      <linearGradient id={`g-${s.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={s.stroke} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={s.stroke} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={s.stroke}
                      strokeWidth={2}
                      fill={`url(#g-${s.label})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Bar Chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Sales &amp; Purchases Overview</h2>
              <span className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-[10px] flex items-center justify-center cursor-default">i</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-violet-600 inline-block" />
                  <span className="text-xs text-gray-500">Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-violet-200 inline-block" />
                  <span className="text-xs text-gray-500">Purchases</span>
                </div>
              </div>
              <select
                title="Select period"
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 outline-none bg-white cursor-pointer"
              >
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={BAR_DATA} barGap={3} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="sales"     name="Sales"     fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" name="Purchases" fill="#ddd6fe" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — Top Selling */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Selling Products <span className="text-gray-400 font-normal text-sm">(2026)</span></h2>
            <button type="button" className="text-xs text-violet-600 font-medium hover:underline">View All</button>
          </div>

          {/* Donut */}
          <div className="relative flex justify-center">
            <PieChart width={180} height={180}>
              <Pie
                data={PIE_DATA}
                cx={85}
                cy={85}
                innerRadius={52}
                outerRadius={82}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {PIE_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            {/* Center label — absolute overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] text-gray-400">Total Sales</p>
              <p className="text-sm font-bold text-gray-900">$24,780</p>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            {PIE_DATA.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.dot}`} />
                  <span className="text-xs text-gray-600">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-800">{p.amount}</span>
                  <span className="text-[10px] text-gray-400 w-6 text-right">{p.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alerts + Transactions ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Stock Alerts */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Stock Alerts</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-bold">12</span>
            </div>
            <button type="button" className="text-xs text-violet-600 font-medium hover:underline">
              View All Alerts
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Product","SKU","Warehouse","Stock","Alert Level","Status",""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ALERTS.map((row) => (
                <tr key={row.sku} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{row.product}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400 font-mono text-xs">{row.sku}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{row.warehouse}</td>
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
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button type="button" title="More options" className="text-gray-300 hover:text-gray-500 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
            <button type="button" className="text-xs text-violet-600 font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {TRANSACTIONS.map((t) => (
              <div key={t.ref} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  t.icon === "sale"     ? "bg-emerald-100 text-emerald-600" :
                  t.icon === "purchase" ? "bg-blue-100 text-blue-600" :
                                          "bg-slate-100 text-slate-500"
                }`}>
                  {t.icon === "sale"     && <ShoppingCart className="w-4 h-4" />}
                  {t.icon === "purchase" && <Package      className="w-4 h-4" />}
                  {t.icon === "transfer" && <TrendingUp   className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.ref}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{t.amount}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-6 gap-4">
        {QUICK.map(({ label, value, change, up, bg, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
            <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{label}</p>
            <p className={`text-[11px] font-medium mt-1 ${
              up === true  ? "text-emerald-500" :
              up === false ? "text-red-500"     : "text-gray-400"
            }`}>
              {up === true  && <ArrowUpRight   className="w-3 h-3 inline mr-0.5" />}
              {up === false && <ArrowDownRight className="w-3 h-3 inline mr-0.5" />}
              {change}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
