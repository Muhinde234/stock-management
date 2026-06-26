import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ─── Static data ─────────────────────────────────────────────────────────────

const SIDEBAR_LINKS = [
  { icon: BarChart3,    label: "Dashboard",  active: true  },
  { icon: Package,      label: "Products",   active: false },
  { icon: ShoppingCart, label: "Sales",      active: false },
  { icon: Users,        label: "Customers",  active: false },
  { icon: TrendingUp,   label: "Reports",    active: false },
];

const STAT_CARDS = [
  { label: "Total Revenue",  value: "$24,780", change: "+12.5%", color: "text-violet-600 bg-violet-50" },
  { label: "Total Sales",    value: "$16,430", change: "+8.6%",  color: "text-purple-600 bg-purple-50" },
  { label: "Products",       value: "1,248",    change: "+5.4%",  color: "text-indigo-600 bg-indigo-50" },
  { label: "Customers",      value: "856",       change: "+18.2%", color: "text-fuchsia-600 bg-fuchsia-50"},
];

const BARS = [
  { height: "h-[35%]", active: false },
  { height: "h-[60%]", active: false },
  { height: "h-[45%]", active: false },
  { height: "h-[75%]", active: false },
  { height: "h-[55%]", active: false },
  { height: "h-[90%]", active: true  },
  { height: "h-[70%]", active: false },
];

const RECENT_SALES = [
  { name: "Walk-in",     amount: "$385.00", time: "10:24 AM" },
  { name: "Jean Pierre", amount: "$750.00", time: "11:05 AM" },
  { name: "Alice K.",    amount: "$980.00", time: "11:30 AM" },
];

const HIGHLIGHTS = [
  "Real-time stock tracking",
  "Barcode scanner support",
  "Print receipts & invoices",
  "Profit & loss reports",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HeroPage() {
  return (
    <div className="min-h-screen bg-[#faf9ff] text-gray-900">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-6 md:px-14 lg:px-24 bg-white/80 backdrop-blur-md border-b border-violet-100">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-md shadow-violet-200">
            <span className="text-white font-black text-sm">S</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">StockPro</p>
            <p className="text-[10px] text-violet-500 leading-none mt-0.5">Inventory System</p>
          </div>
        </div>

        {/* Login */}
        <Link
          href="/auth/login"
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-violet-200 hover:shadow-violet-300"
        >
          Login
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
        </Link>

      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <main className="relative pt-32 pb-20 px-6 md:px-14 lg:px-24 overflow-hidden">

        {/* Soft bg shape */}
        <div className="pointer-events-none absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-violet-100 via-purple-50 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl opacity-60" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-100 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl opacity-40" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Copy ──────────────────────────────────────────────────── */}
          <div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-7 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              Sales &amp; Inventory Management
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-[52px] font-extrabold leading-[1.1] tracking-tight text-gray-900">
              Manage Your Shop{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-500">
                Smarter.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base md:text-lg text-gray-500 leading-relaxed max-w-md">
              One place for your sales, inventory, customers, and reports.
              Built for clarity — not complexity.
            </p>

            {/* Checklist */}
            <ul className="mt-8 space-y-2.5">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/auth/login"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-bold transition-all duration-200 shadow-xl shadow-violet-300 hover:shadow-violet-400 hover:-translate-y-0.5"
              >
                Get Started — Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
              <p className="text-xs text-gray-400">Trusted by 500+ shops</p>
            </div>

          </div>

          {/* ── Right: Dashboard preview ─────────────────────────────────────── */}
          <div className="relative hidden lg:block">

            {/* Glow */}
            <div className="absolute inset-0 bg-violet-200/40 blur-3xl rounded-3xl scale-95 translate-y-6" />

            {/* Browser chrome */}
            <div className="relative rounded-2xl border border-violet-100 bg-white shadow-2xl shadow-violet-100 overflow-hidden">

              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="w-3 h-3 rounded-full bg-red-400/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <span className="w-3 h-3 rounded-full bg-green-400/80" />
                <div className="flex-1 flex justify-center">
                  <div className="w-48 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-gray-400">localhost:3000/dashboard</span>
                  </div>
                </div>
              </div>

              {/* App shell */}
              <div className="flex h-[400px]">

                {/* Sidebar */}
                <aside className="w-40 shrink-0 bg-[#1e1b4b] flex flex-col py-4 px-2.5 gap-0.5">
                  <div className="flex items-center gap-2 px-2 mb-4">
                    <div className="w-5 h-5 rounded-md bg-violet-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-[9px] font-black">S</span>
                    </div>
                    <span className="text-white text-[11px] font-bold">StockPro</span>
                  </div>
                  {SIDEBAR_LINKS.map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium cursor-default ${
                        active
                          ? "bg-violet-600 text-white"
                          : "text-slate-400"
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      {label}
                    </div>
                  ))}
                </aside>

                {/* Main content */}
                <section className="flex-1 overflow-hidden p-4 bg-[#f8f7ff] flex flex-col gap-3">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-800 text-xs font-bold">Good morning, Admin</p>
                      <p className="text-gray-400 text-[9px] mt-0.5">Here&apos;s what&apos;s happening today</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[9px] text-gray-400 shadow-sm">
                      Jun 26, 2026
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-4 gap-2">
                    {STAT_CARDS.map(({ label, value, change, color }) => (
                      <div key={label} className="rounded-xl bg-white border border-gray-100 p-2.5 shadow-sm">
                        <p className="text-gray-400 text-[8px] mb-1">{label}</p>
                        <p className="text-gray-900 text-[11px] font-bold leading-tight">{value}</p>
                        <span className={`inline-block mt-1 text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${color}`}>
                          {change}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Charts */}
                  <div className="flex gap-2.5 flex-1 min-h-0">

                    {/* Bar chart */}
                    <div className="flex-[3] rounded-xl bg-white border border-gray-100 p-3 shadow-sm flex flex-col">
                      <p className="text-gray-500 text-[9px] font-semibold mb-2">Weekly Sales</p>
                      <div className="flex items-end gap-1.5 flex-1">
                        {BARS.map(({ height, active }, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-t-sm ${height} ${
                              active
                                ? "bg-gradient-to-t from-violet-600 to-violet-400"
                                : "bg-violet-100"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {["M","T","W","T","F","S","S"].map((d, i) => (
                          <span key={i} className="flex-1 text-center text-[8px] text-gray-300">{d}</span>
                        ))}
                      </div>
                    </div>

                    {/* Right col */}
                    <div className="flex-[2] flex flex-col gap-2">

                      {/* Alert */}
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-800 text-[9px] font-semibold">Low Stock Alert</p>
                          <p className="text-amber-600 text-[8px] mt-0.5">4 products need restocking</p>
                        </div>
                      </div>

                      {/* Recent sales */}
                      <div className="flex-1 rounded-xl bg-white border border-gray-100 p-2.5 shadow-sm flex flex-col gap-1.5">
                        <p className="text-gray-500 text-[8px] font-semibold">Recent Sales</p>
                        {RECENT_SALES.map(({ name, amount, time }) => (
                          <div key={name} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center text-[7px] text-violet-600 font-bold shrink-0">
                                {name[0]}
                              </div>
                              <div>
                                <p className="text-gray-700 text-[8px] font-medium leading-none">{name}</p>
                                <p className="text-gray-300 text-[7px] mt-0.5">{time}</p>
                              </div>
                            </div>
                            <span className="text-gray-800 text-[8px] font-bold">{amount}</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                </section>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
