"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  PackagePlus, Package, Search, Loader2, AlertCircle,
  RotateCcw, CheckCircle2, Boxes, Layers, X, AlertTriangle,
  ScanLine, Trash2, ChevronRight, Eye, Phone, User,
  ArrowLeft, Check, Filter, ChevronDown,
} from "lucide-react";
import { productsApi, parsePrice, getUnitName, type Product } from "@/lib/api/products";
import { unitsApi, type Unit } from "@/lib/api/units";
import { categoriesApi } from "@/lib/api/categories";
import { purchasesApi } from "@/lib/api/purchases";
import type { Category } from "@/lib/api/categories";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "box" | "piece";
type Step = "select" | "configure" | "scan" | "review" | "done";

interface ScannedItem {
  id:        string;       // unique per scan
  barcode:   string;
  index:     number;
}

interface Session {
  product:       Product;
  unitLabel:     string;
  mode:          Mode;
  piecesPerBox:  number;
  scanned:       ScannedItem[];
  costPrice:     number;
  sellingPrice:  number;
  supplierName:  string;
  supplierPhone: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stockLabel(p: Product) {
  if (p.stock_status === "out_of_stock") return "out";
  if ((p.initialQuantity ?? 0) <= p.minimumQuantity) return "low";
  return "ok";
}

function StockBadge({ product }: { product: Product }) {
  const s = stockLabel(product);
  const cfg = {
    out: "bg-red-100 text-red-700",
    low: "bg-amber-100 text-amber-700",
    ok:  "bg-emerald-100 text-emerald-700",
  }[s];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg}`}>
    {s === "out" ? "Out of stock" : s === "low" ? "Low stock" : "In stock"}
  </span>;
}

// ── Step 1: Product Search ────────────────────────────────────────────────────

function ProductSearchStep({ units, onSelect }: { units: Unit[]; onSelect: (p: Product) => void }) {
  const [query,      setQuery]      = useState("");
  const [catFilter,  setCatFilter]  = useState<number | "">("");
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [showCats,   setShowCats]   = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => { categoriesApi.getAll().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    function h(e: MouseEvent) { if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCats(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({ search: query.trim() || undefined, category_id: catFilter || undefined, limit: 30 });
      setProducts(Array.isArray(res) ? res : []);
    } catch { setProducts([]); }
    finally  { setLoading(false); }
  }, [query, catFilter]);

  useEffect(() => { const t = setTimeout(load, 280); return () => clearTimeout(t); }, [load]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Type product name to search…" autoFocus
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm" />
        {loading
          ? <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          : query && <button type="button" onClick={() => setQuery("")} title="Clear" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>

      {/* Category filter */}
      <div ref={catRef} className="relative inline-block">
        <button type="button" onClick={() => setShowCats(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${catFilter ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
          <Filter className="w-3.5 h-3.5" />
          {catFilter ? (categories.find(c => c.id === catFilter)?.categoryName ?? "Category") : "All categories"}
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
        {showCats && (
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg min-w-44 py-1">
            <button type="button" onClick={() => { setCatFilter(""); setShowCats(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-violet-50 ${!catFilter ? "text-violet-700 font-semibold" : "text-gray-600"}`}>
              All categories
            </button>
            {categories.map(c => (
              <button key={c.id} type="button" onClick={() => { setCatFilter(c.id); setShowCats(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-violet-50 ${catFilter === c.id ? "text-violet-700 font-semibold" : "text-gray-600"}`}>
                {c.categoryName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="py-14 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{loading ? "Searching…" : query ? `No results for "${query}"` : "Type a product name above"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {products.map(p => {
              const s = stockLabel(p);
              return (
                <button key={p.id} type="button" onClick={() => onSelect(p)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-violet-50 transition-colors text-left group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s === "out" ? "bg-red-50" : s === "low" ? "bg-amber-50" : "bg-violet-50"}`}>
                    <Package className={`w-5 h-5 ${s === "out" ? "text-red-400" : s === "low" ? "text-amber-500" : "text-violet-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.productName}</p>
                      {s !== "ok" && <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${s === "out" ? "text-red-400" : "text-amber-400"}`} />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
                      {p.category && <span>{p.category.categoryName}</span>}
                      {p.sku && <span className="font-mono">SKU: {p.sku}</span>}
                      <span>Stock: <strong>{p.initialQuantity ?? 0}</strong></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-800">{parsePrice(p.sellingPrice).toLocaleString()} RWF</p>
                    <p className="text-[10px] text-gray-400 mb-1">sell price</p>
                    <StockBadge product={p} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 shrink-0 transition" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Product Info Card (reused across steps) ───────────────────────────────────

function ProductCard({ product, unitLabel, onBack }: { product: Product; unitLabel: string; onBack?: () => void }) {
  const s = stockLabel(product);
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 ${s === "out" ? "border-red-200" : s === "low" ? "border-amber-200" : "border-gray-100"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s === "out" ? "bg-red-50" : s === "low" ? "bg-amber-50" : "bg-violet-50"}`}>
        <Package className={`w-5 h-5 ${s === "out" ? "text-red-400" : s === "low" ? "text-amber-500" : "text-violet-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{product.productName}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-gray-500">
          {unitLabel && <span>Unit: <strong>{unitLabel}</strong></span>}
          {product.category && <span>Category: <strong>{product.category.categoryName}</strong></span>}
          {product.sku && <span className="font-mono">SKU: {product.sku}</span>}
          <span>Stock: <strong className={s !== "ok" ? "text-amber-600" : ""}>{product.initialQuantity ?? 0}</strong></span>
          <span>Buy: <strong>{parsePrice(product.productPrice).toLocaleString()} RWF</strong></span>
          <span>Sell: <strong>{parsePrice(product.sellingPrice).toLocaleString()} RWF</strong></span>
        </div>
      </div>
      {onBack && (
        <button type="button" onClick={onBack} title="Change product" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ── Step 2: Configure Mode ────────────────────────────────────────────────────

function ConfigureStep({
  product, unitLabel, onBack, onNext,
}: {
  product:   Product;
  unitLabel: string;
  onBack:    () => void;
  onNext:    (mode: Mode, piecesPerBox: number) => void;
}) {
  const [mode,         setMode]         = useState<Mode>("box");
  const [piecesPerBox, setPiecesPerBox] = useState(12);

  return (
    <div className="space-y-4">
      <ProductCard product={product} unitLabel={unitLabel} onBack={onBack} />

      {/* Mode */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Check-In Type</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: "box",   icon: Boxes,  label: "Package / Box",  desc: "Scan boxes — specify items per box" },
            { key: "piece", icon: Layers, label: "Piece / Detail",  desc: "Scan individual items one by one" },
          ] as { key: Mode; icon: React.ElementType; label: string; desc: string }[]).map(({ key, icon: Icon, label, desc }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${mode === key ? "border-violet-500 bg-violet-50" : "border-gray-100 hover:border-gray-200"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mode === key ? "bg-violet-100" : "bg-gray-100"}`}>
                <Icon className={`w-5 h-5 ${mode === key ? "text-violet-600" : "text-gray-400"}`} />
              </div>
              <p className={`text-sm font-bold ${mode === key ? "text-violet-700" : "text-gray-700"}`}>{label}</p>
              <p className="text-[11px] text-gray-400 leading-snug">{desc}</p>
            </button>
          ))}
        </div>

        {/* Items per box — only shown in box mode */}
        {mode === "box" && (
          <div className="mt-5 p-4 bg-violet-50 rounded-xl border border-violet-100 space-y-2">
            <label className="block text-xs font-bold text-violet-700">Items per box / package</label>
            <p className="text-[11px] text-violet-500">How many individual pieces are in each box you will scan?</p>
            <div className="flex items-center gap-3 mt-2">
              <button type="button" title="Decrease" onClick={() => setPiecesPerBox(v => Math.max(1, v - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-violet-200 flex items-center justify-center text-violet-600 hover:bg-violet-100 font-bold text-lg transition">−</button>
              <input type="number" min="1" title="Items per box" value={piecesPerBox}
                onChange={e => setPiecesPerBox(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center text-2xl font-black text-violet-700 border-2 border-violet-200 rounded-xl py-1.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white" />
              <button type="button" title="Increase" onClick={() => setPiecesPerBox(v => v + 1)}
                className="w-9 h-9 rounded-lg bg-white border border-violet-200 flex items-center justify-center text-violet-600 hover:bg-violet-100 font-bold text-lg transition">+</button>
              <span className="text-sm text-violet-600 font-semibold">pieces / box</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" onClick={() => onNext(mode, piecesPerBox)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition shadow-md shadow-violet-200">
          Start Scanning <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Scan ──────────────────────────────────────────────────────────────

function ScanStep({
  product, unitLabel, mode, piecesPerBox, onBack, onNext,
}: {
  product:      Product;
  unitLabel:    string;
  mode:         Mode;
  piecesPerBox: number;
  onBack:       () => void;
  onNext:       (scanned: ScannedItem[]) => void;
}) {
  const [scanned,  setScanned]  = useState<ScannedItem[]>([]);
  const [input,    setInput]    = useState("");
  const [flash,    setFlash]    = useState(false);
  const [dupWarn,  setDupWarn]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function addScan(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;

    if (scanned.some(s => s.barcode === trimmed)) {
      setDupWarn(true);
      setTimeout(() => setDupWarn(false), 2000);
      setInput("");
      return;
    }

    const item: ScannedItem = { id: crypto.randomUUID(), barcode: trimmed, index: scanned.length + 1 };
    setScanned(prev => [...prev, item]);
    setInput("");
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
    inputRef.current?.focus();
  }

  function removeItem(id: string) { setScanned(prev => prev.filter(s => s.id !== id)); }

  const totalPieces = mode === "box" ? scanned.length * piecesPerBox : scanned.length;
  const unit        = mode === "box" ? "box" : "piece";

  return (
    <div className="space-y-4">
      <ProductCard product={product} unitLabel={unitLabel} />

      {/* Counter */}
      <div className={`rounded-2xl p-5 text-center transition-all duration-300 ${flash ? "bg-emerald-500" : "bg-white border border-gray-100 shadow-sm"}`}>
        <p className={`text-5xl font-black transition-colors ${flash ? "text-white" : "text-violet-700"}`}>
          {scanned.length}
        </p>
        <p className={`text-sm font-semibold mt-1 transition-colors ${flash ? "text-white" : "text-gray-500"}`}>
          {unit}{scanned.length !== 1 ? "s" : ""} scanned
          {mode === "box" && scanned.length > 0 && (
            <span className="ml-2 opacity-75">({totalPieces} pieces total)</span>
          )}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {mode === "box"
            ? <Boxes className={`w-4 h-4 ${flash ? "text-white" : "text-violet-400"}`} />
            : <Layers className={`w-4 h-4 ${flash ? "text-white" : "text-violet-400"}`} />}
          <span className={`text-xs font-medium ${flash ? "text-white" : "text-gray-400"}`}>
            {mode === "box" ? `${piecesPerBox} items per box` : "Individual pieces"}
          </span>
        </div>
      </div>

      {/* Scanner input */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-violet-300 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="w-5 h-5 text-violet-500" />
          <p className="text-sm font-bold text-violet-700">
            Scan {mode === "box" ? "box" : "item"} barcode / QR code
          </p>
        </div>
        {dupWarn && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Duplicate barcode — already scanned!
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addScan(input); } }}
            placeholder={`Scan or type ${mode === "box" ? "box" : "item"} barcode, press Enter…`}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-violet-200 text-sm font-mono outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-violet-50 placeholder-violet-300"
          />
          <button type="button" onClick={() => addScan(input)} title="Add scan"
            className="px-4 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition">
            Add
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Press Enter after each scan. Barcode scanner will auto-submit.</p>
      </div>

      {/* Scanned list */}
      {scanned.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Scanned {unit}s</p>
            <span className="text-xs text-gray-400">{scanned.length} item{scanned.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
            {scanned.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {item.index}
                </span>
                <ScanLine className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                <span className="font-mono text-sm text-gray-700 flex-1 truncate">{item.barcode}</span>
                {mode === "box" && (
                  <span className="text-[10px] text-gray-400 shrink-0">{piecesPerBox} pcs</span>
                )}
                <button type="button" onClick={() => removeItem(item.id)} title="Remove" className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" onClick={() => onNext(scanned)} disabled={scanned.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition shadow-md shadow-emerald-200">
          <Eye className="w-4 h-4" />
          Review {scanned.length} {unit}{scanned.length !== 1 ? "s" : ""} ({totalPieces} pieces)
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Review & Save ─────────────────────────────────────────────────────

function ReviewStep({
  product, unitLabel, mode, piecesPerBox, scanned, onBack, onSaved,
}: {
  product:      Product;
  unitLabel:    string;
  mode:         Mode;
  piecesPerBox: number;
  scanned:      ScannedItem[];
  onBack:       () => void;
  onSaved:      (session: Session) => void;
}) {
  const [costPrice,     setCostPrice]     = useState(parsePrice(product.productPrice));
  const [sellingPrice,  setSellingPrice]  = useState(parsePrice(product.sellingPrice));
  const [supplierName,  setSupplierName]  = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");

  const unit        = mode === "box" ? "box" : "piece";
  const totalPieces = mode === "box" ? scanned.length * piecesPerBox : scanned.length;
  const totalCost   = costPrice * (mode === "box" ? scanned.length : scanned.length);

  async function save() {
    setSaving(true); setError("");
    try {
      // One purchase record per scanned box/piece
      for (const item of scanned) {
        await purchasesApi.create({
          purchase_type:  mode === "box" ? "package" : "detail",
          scanned_code:   item.barcode,
          product_id:     product.id,
          sku:            product.sku || item.barcode,
          quantity:       mode === "box" ? piecesPerBox : 1,
          unit_price:     costPrice,
          supplier_name:  supplierName  || undefined,
          supplier_phone: supplierPhone || undefined,
          notes: [
            supplierName  ? `Supplier: ${supplierName}` : "",
            supplierPhone ? `Phone: ${supplierPhone}`   : "",
            `Sell: ${sellingPrice.toLocaleString()} RWF`,
          ].filter(Boolean).join(" | ") || undefined,
        });
      }
      onSaved({ product, unitLabel, mode, piecesPerBox, scanned, costPrice, sellingPrice, supplierName, supplierPhone });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save purchase order.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <ProductCard product={product} unitLabel={unitLabel} />

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
          <Eye className="w-4 h-4 text-violet-500" />
          <p className="text-sm font-bold text-violet-700">Scan Summary</p>
        </div>
        <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
          {scanned.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {item.index}
              </span>
              <ScanLine className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span className="font-mono text-sm text-gray-700 flex-1 truncate">{item.barcode}</span>
              <span className="text-[10px] text-gray-400 shrink-0">
                {mode === "box" ? `${piecesPerBox} pcs` : "1 pc"}
              </span>
              <span className="text-xs font-semibold text-gray-600 shrink-0 w-24 text-right">
                {costPrice.toLocaleString()} RWF/{unit}
              </span>
            </div>
          ))}
        </div>
        {/* Totals row */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 grid grid-cols-3 text-center">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{mode === "box" ? "Boxes" : "Pieces"}</p>
            <p className="text-lg font-black text-gray-900">{scanned.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Total Pieces</p>
            <p className="text-lg font-black text-violet-700">{totalPieces}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Total Cost</p>
            <p className="text-lg font-black text-emerald-700">{totalCost.toLocaleString()} RWF</p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing (per {unit})</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cost / Buy Price</label>
            <div className="relative">
              <input type="number" min="0" value={costPrice} onChange={e => setCostPrice(Number(e.target.value))}
                title="Cost / buy price" placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-14 text-sm font-bold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">RWF</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Selling Price</label>
            <div className="relative">
              <input type="number" min="0" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))}
                title="Selling price" placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-14 text-sm font-bold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">RWF</span>
            </div>
          </div>
        </div>
        {costPrice > 0 && sellingPrice > costPrice && (
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700 font-medium">
            Margin: {((sellingPrice - costPrice) / sellingPrice * 100).toFixed(1)}% · Profit per {unit}: {(sellingPrice - costPrice).toLocaleString()} RWF
          </div>
        )}
      </div>

      {/* Supplier */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supplier <span className="text-gray-300 font-normal normal-case">(optional)</span></p>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)}
            placeholder="Supplier name"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="tel" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)}
            placeholder="Supplier phone"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button type="button" onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md shadow-emerald-200">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Check className="w-4 h-4" /> Confirm & Save {totalPieces} pieces</>}
        </button>
      </div>
    </div>
  );
}

// ── Done ─────────────────────────────────────────────────────────────────────

function SuccessCard({ session, onReset }: { session: Session; onReset: () => void }) {
  const unit        = session.mode === "box" ? "box" : "piece";
  const totalPieces = session.mode === "box" ? session.scanned.length * session.piecesPerBox : session.scanned.length;
  const totalCost   = session.costPrice * session.scanned.length;

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center space-y-5">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-9 h-9 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900">Check-in Saved!</h3>
        <p className="text-sm text-gray-500 mt-1">Stock has been updated successfully.</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
        {[
          { label: "Product",       value: session.product.productName },
          { label: "Type",          value: session.mode === "box" ? "Package / Box" : "Piece / Detail" },
          { label: `${session.mode === "box" ? "Boxes" : "Pieces"} scanned`, value: String(session.scanned.length) },
          ...(session.mode === "box" ? [{ label: "Items per box", value: String(session.piecesPerBox) }] : []),
          { label: "Total added",   value: `${totalPieces} pieces` },
          { label: `Cost / ${unit}`, value: `${session.costPrice.toLocaleString()} RWF` },
          { label: "Total cost",    value: `${totalCost.toLocaleString()} RWF` },
          ...(session.supplierName  ? [{ label: "Supplier", value: session.supplierName }] : []),
          ...(session.supplierPhone ? [{ label: "Phone",    value: session.supplierPhone }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={onReset}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 mx-auto transition shadow-md shadow-violet-200">
        <RotateCcw className="w-4 h-4" /> New Check-in
      </button>
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "select",    label: "Product"   },
  { key: "configure", label: "Type"      },
  { key: "scan",      label: "Scan"      },
  { key: "review",    label: "Review"    },
];

function StepBar({ step }: { step: Step }) {
  if (step === "done") return null;
  const current = STEPS.findIndex(s => s.key === step);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              done ? "bg-emerald-500 text-white" : active ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {done ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${active ? "text-violet-700" : done ? "text-emerald-600" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200 mx-0.5" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const [step,         setStep]         = useState<Step>("select");
  const [product,      setProduct]      = useState<Product | null>(null);
  const [unitLabel,    setUnitLabel]    = useState("");
  const [mode,         setMode]         = useState<Mode>("box");
  const [piecesPerBox, setPiecesPerBox] = useState(12);
  const [scanned,      setScanned]      = useState<ScannedItem[]>([]);
  const [session,      setSession]      = useState<Session | null>(null);
  const [units,        setUnits]        = useState<Unit[]>([]);

  useEffect(() => { unitsApi.getAll().then(setUnits).catch(() => {}); }, []);

  function handleSelect(p: Product) {
    setProduct(p);
    setUnitLabel(getUnitName(p.quantityUnit, units));
    setStep("configure");
  }

  function handleConfigure(m: Mode, ppb: number) {
    setMode(m); setPiecesPerBox(ppb); setStep("scan");
  }

  function handleScanned(items: ScannedItem[]) {
    setScanned(items); setStep("review");
  }

  function handleSaved(s: Session) { setSession(s); setStep("done"); }

  function handleReset() {
    setStep("select"); setProduct(null); setScanned([]); setSession(null);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
          <PackagePlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check In Stock</h1>
          <p className="text-sm text-gray-500">Select product → choose type → scan → save</p>
        </div>
      </div>

      <StepBar step={step} />

      {step === "select" && <ProductSearchStep units={units} onSelect={handleSelect} />}

      {step === "configure" && product && (
        <ConfigureStep
          product={product} unitLabel={unitLabel}
          onBack={() => setStep("select")}
          onNext={handleConfigure}
        />
      )}

      {step === "scan" && product && (
        <ScanStep
          product={product} unitLabel={unitLabel}
          mode={mode} piecesPerBox={piecesPerBox}
          onBack={() => setStep("configure")}
          onNext={handleScanned}
        />
      )}

      {step === "review" && product && (
        <ReviewStep
          product={product} unitLabel={unitLabel}
          mode={mode} piecesPerBox={piecesPerBox}
          scanned={scanned}
          onBack={() => setStep("scan")}
          onSaved={handleSaved}
        />
      )}

      {step === "done" && session && (
        <SuccessCard session={session} onReset={handleReset} />
      )}
    </div>
  );
}
