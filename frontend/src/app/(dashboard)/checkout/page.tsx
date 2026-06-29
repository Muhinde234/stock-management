"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PackageCheck, ScanLine, Loader2, AlertCircle, CheckCircle2,
  Printer, RotateCcw, Package, Banknote, CreditCard, Smartphone,
  X, ChevronRight, ArrowLeft, ShoppingCart, Plus, Minus,
  Search, Store,
} from "lucide-react";
import { productsApi, parsePrice, type Product } from "@/lib/api/products";
import { salesApi, type PaymentMethod, type SaleRead } from "@/lib/api/sales";
import { purchasesApi } from "@/lib/api/purchases";

type Step = "scan" | "payment" | "receipt";
interface CartItem { product: Product; quantity: number; }

// ── Hardware scanner hook ─────────────────────────────────────────────────────

function useBarcodeScanner(onScan: (code: string) => void, enabled: boolean) {
  const buf   = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cb    = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "TEXTAREA") return;
    if (tag === "INPUT" && !(e.target as HTMLInputElement).dataset.scanner) return;
    if (e.key === "Enter") {
      if (buf.current.length > 2) onScan(buf.current);
      buf.current = ""; if (timer.current) clearTimeout(timer.current); return;
    }
    if (e.key.length === 1) {
      buf.current += e.key;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { buf.current = ""; }, 200);
    }
  }, [onScan, enabled]);
  useEffect(() => { window.addEventListener("keydown", cb); return () => window.removeEventListener("keydown", cb); }, [cb]);
}

// ── Payment options ───────────────────────────────────────────────────────────

const PAY_OPTS: { key: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { key: "cash",         label: "Cash",         icon: Banknote   },
  { key: "mobile_money", label: "Mobile Money", icon: Smartphone },
  { key: "card",         label: "Card",         icon: CreditCard },
];

// ── Professional Receipt ──────────────────────────────────────────────────────

function ProReceipt({ sale, cart, clientName, clientPhone, payment, onReset }: {
  sale: SaleRead; cart: CartItem[]; clientName: string;
  clientPhone: string; payment: PaymentMethod; onReset: () => void;
}) {
  const grandTotal   = parseFloat(sale.grand_total)  || 0;
  const changeDue    = parseFloat(sale.change_due)   || 0;
  const cashReceived = parseFloat(sale.cash_received ?? "0") || 0;
  const saleDate     = new Date(sale.sale_date);

  return (
    <>
      {/* Print styles — only receipt is visible when printing */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-root { display: block !important; position: fixed; inset: 0; }
          #receipt-root .no-print { display: none !important; }
          #receipt-paper {
            width: 80mm; margin: 0 auto; font-family: 'Courier New', monospace;
            font-size: 11px; color: #000;
          }
        }
        @media screen {
          #receipt-paper { font-family: 'Courier New', monospace; }
        }
      `}</style>

      <div id="receipt-root" className="p-6 max-w-md mx-auto space-y-4">

        {/* Success banner — screen only */}
        <div className="no-print bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white text-center shadow-lg shadow-emerald-200">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
          <p className="text-lg font-bold">Sale Complete!</p>
          <p className="text-emerald-100 text-sm">#{sale.sale_number}</p>
        </div>

        {/* Receipt paper */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div id="receipt-paper" className="p-6 space-y-3 text-[13px]">

            {/* ── Header ── */}
            <div className="text-center space-y-0.5 pb-3 border-b-2 border-dashed border-gray-300">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Store className="w-5 h-5 text-gray-700" />
                <p className="text-base font-black tracking-widest uppercase">StockPro</p>
              </div>
              <p className="text-[11px] text-gray-500">Inventory & Sales System</p>
              <p className="text-[10px] text-gray-400">────────────────────────</p>
              <p className="text-[11px] text-gray-600">
                {saleDate.toLocaleDateString("en-RW", { day: "2-digit", month: "short", year: "numeric" })}
                {" · "}
                {saleDate.toLocaleTimeString("en-RW", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-[11px] font-bold text-gray-700">Receipt # {sale.sale_number}</p>
              {(clientName || clientPhone) && (
                <div className="mt-1 text-[11px] text-gray-600">
                  {clientName  && <p>Client : {clientName}</p>}
                  {clientPhone && <p>Phone  : {clientPhone}</p>}
                </div>
              )}
            </div>

            {/* ── Items ── */}
            <div className="space-y-0">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase pb-1 border-b border-gray-200">
                <span className="w-5">#</span>
                <span className="flex-1 pl-1">Item</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-8 text-right">P.U</span>
                <span className="w-16 text-right">Total</span>
              </div>
              {cart.map(({ product, quantity }, idx) => {
                const price = parsePrice(product.sellingPrice);
                return (
                  <div key={product.id} className="flex justify-between items-start py-1.5 border-b border-gray-100 text-[12px]">
                    <span className="w-5 text-gray-400 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 pl-1 min-w-0 pr-2">
                      <p className="font-semibold text-gray-900 leading-tight break-words">{product.productName}</p>
                      {product.sku && <p className="text-[10px] text-gray-400 font-mono">{product.sku}</p>}
                    </div>
                    <span className="w-12 text-center text-gray-700 shrink-0">×{quantity}</span>
                    <span className="w-8 text-right text-gray-600 shrink-0 tabular-nums">{price.toLocaleString()}</span>
                    <span className="w-16 text-right font-bold text-gray-900 shrink-0 tabular-nums">{(price * quantity).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            {/* ── Totals ── */}
            <div className="pt-2 space-y-1 border-t-2 border-dashed border-gray-300">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{grandTotal.toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Discount</span>
                <span className="tabular-nums">{parseFloat(sale.discount_amount || "0").toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Tax</span>
                <span className="tabular-nums">{parseFloat(sale.tax_amount || "0").toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between text-[13px] font-black text-gray-900 pt-1 border-t border-gray-300">
                <span>TOTAL</span>
                <span className="tabular-nums">{grandTotal.toLocaleString()} RWF</span>
              </div>
            </div>

            {/* ── Payment ── */}
            <div className="pt-1 space-y-1 border-t border-dashed border-gray-300 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Payment Method</span>
                <span className="font-semibold capitalize">{payment.replace("_", " ")}</span>
              </div>
              {payment === "cash" && cashReceived > 0 && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Cash Received</span>
                    <span className="tabular-nums">{cashReceived.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Change Due</span>
                    <span className="tabular-nums">{changeDue.toLocaleString()} RWF</span>
                  </div>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="pt-3 text-center border-t-2 border-dashed border-gray-300 space-y-1">
              <p className="text-[10px] text-gray-400">────────────────────────</p>
              <p className="text-[12px] font-bold text-gray-700">Thank you for your purchase!</p>
              <p className="text-[10px] text-gray-400">Please keep this receipt</p>
              <p className="text-[10px] text-gray-300">Powered by StockPro</p>
            </div>
          </div>

          {/* Action buttons — screen only */}
          <div className="no-print px-6 pb-6 pt-2 flex gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition shadow"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition shadow-md shadow-violet-200"
            >
              <RotateCcw className="w-4 h-4" /> New Sale
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const [step,         setStep]         = useState<Step>("scan");
  const [cart,         setCart]         = useState<CartItem[]>([]);
  const [scanInput,    setScanInput]    = useState("");
  const [scanning,     setScanning]     = useState(false);
  const [scanError,    setScanError]    = useState("");
  const [suggestions,  setSuggestions]  = useState<Product[]>([]);
  const [showDrop,     setShowDrop]     = useState(false);
  const [allProducts,  setAllProducts]  = useState<Product[]>([]);
  const [prodSearch,   setProdSearch]   = useState("");
  const [loadingProds, setLoadingProds] = useState(true);
  const [clientName,   setClientName]   = useState("");
  const [clientPhone,  setClientPhone]  = useState("");
  const [payment,      setPayment]      = useState<PaymentMethod>("cash");
  const [amountPaid,   setAmountPaid]   = useState(0);
  const [processing,   setProcessing]   = useState(false);
  const [processError, setProcessError] = useState("");
  const [completedSale, setCompletedSale] = useState<SaleRead | null>(null);
  const [barcodeMap,    setBarcodeMap]    = useState<Map<string, number>>(new Map());
  const scanInputRef = useRef<HTMLInputElement>(null);
  const dropRef      = useRef<HTMLDivElement>(null);
  // Relay errors out of setCart functional updaters (which can't call setScanError directly)
  const pendingErr   = useRef("");

  const total  = cart.reduce((s, i) => s + parsePrice(i.product.sellingPrice) * i.quantity, 0);
  const change = Math.max(0, amountPaid - total);

  // Load products + build barcode map (callable after sale to refresh stock)
  const loadProducts = useCallback(async () => {
    setLoadingProds(true);
    const [prodRes, purRes] = await Promise.allSettled([
      productsApi.getAll({ limit: 200, status: "active" }),
      purchasesApi.getAll(),
    ]);
    if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value))
      setAllProducts(prodRes.value);
    if (purRes.status === "fulfilled" && Array.isArray(purRes.value)) {
      const map = new Map<string, number>();
      for (const p of purRes.value)
        if (p.scanned_code && p.product_id) map.set(p.scanned_code, p.product_id);
      setBarcodeMap(map);
    }
    setLoadingProds(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Auto-fill amount when entering payment step
  useEffect(() => {
    if (step === "payment") setAmountPaid(total);
  }, [step, total]);

  useEffect(() => {
    if (step === "scan") setTimeout(() => scanInputRef.current?.focus(), 50);
  }, [step]);

  // Live dropdown search
  useEffect(() => {
    const q = scanInput.trim();
    if (!q) { setSuggestions([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await productsApi.getAll({ search: q, limit: 8 });
        setSuggestions(Array.isArray(res) ? res : []);
        setShowDrop(true);
      } catch { setSuggestions([]); }
    }, 220);
    return () => clearTimeout(t);
  }, [scanInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Barcode / SKU lookup on Enter
  async function lookupAndAdd(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanning(true); setScanError(""); setShowDrop(false);

    // helper: add and clear input on success (stock errors set scanError inside addToCart)
    function tryAdd(product: Product) {
      addToCart(product);
      setScanInput(""); setSuggestions([]);
    }

    // 1. Exact SKU
    try {
      tryAdd(await productsApi.getBySku(trimmed));
      setScanning(false); return;
    } catch { /* next */ }

    // 2. Purchase barcode → product_id
    const pid = barcodeMap.get(trimmed);
    if (pid) {
      try {
        tryAdd(await productsApi.getById(pid));
        setScanning(false); return;
      } catch { /* next */ }
    }

    // 3. Already-loaded suggestion
    if (suggestions.length > 0) {
      tryAdd(suggestions[0]);
      setScanning(false); return;
    }

    // 4. Fresh search fallback
    try {
      const res = await productsApi.getAll({ search: trimmed, limit: 1 });
      if (Array.isArray(res) && res.length > 0) tryAdd(res[0]);
      else setScanError(`"${trimmed}" not found. Search by name below.`);
    } catch { setScanError(`"${trimmed}" not found. Search by name below.`); }
    setScanning(false);
  }

  const lookupRef = useRef(lookupAndAdd);
  useEffect(() => { lookupRef.current = lookupAndAdd; });
  const handleHwScan = useCallback((code: string) => { lookupRef.current(code); }, []);
  useBarcodeScanner(handleHwScan, step === "scan");

  function addToCart(product: Product) {
    const maxQty = product.initialQuantity ?? 0;
    if (maxQty <= 0) {
      setScanError(`"${product.productName}" is out of stock.`);
      return;
    }
    pendingErr.current = "";
    // Functional update so React chains calls — rapid duplicate scans are safe
    setCart(prev => {
      const existing   = prev.find(i => i.product.id === product.id);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty >= maxQty) {
        pendingErr.current = `Only ${maxQty} unit${maxQty !== 1 ? "s" : ""} of "${product.productName}" in stock.`;
        return prev;
      }
      return existing
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, quantity: 1 }];
    });
    // updater runs synchronously, so pendingErr is already set
    if (pendingErr.current) setScanError(pendingErr.current);
  }

  function changeQty(id: number, d: number) {
    pendingErr.current = "";
    setCart(prev => {
      const item = prev.find(i => i.product.id === id);
      if (!item) return prev;
      const newQty = item.quantity + d;
      const maxQty = item.product.initialQuantity ?? 0;
      if (d > 0 && newQty > maxQty) {
        pendingErr.current = `Only ${maxQty} unit${maxQty !== 1 ? "s" : ""} of "${item.product.productName}" in stock.`;
        return prev;
      }
      return prev
        .map(i => i.product.id !== id ? i : { ...i, quantity: Math.max(0, newQty) })
        .filter(i => i.quantity > 0);
    });
    if (pendingErr.current) setScanError(pendingErr.current);
  }

  function removeItem(id: number) {
    setCart(prev => prev.filter(i => i.product.id !== id));
  }

  async function processSale() {
    if (cart.length === 0) { setProcessError("Cart is empty."); return; }
    if (payment === "cash" && amountPaid < total) {
      setProcessError(`Cash received (${amountPaid.toLocaleString()} RWF) is less than total (${total.toLocaleString()} RWF).`);
      return;
    }
    setProcessing(true); setProcessError("");
    try {
      const sale = await salesApi.create({
        client_name:    clientName.trim()  || undefined,
        client_phone:   clientPhone.trim() || undefined,
        payment_method: payment,
        cash_received:  payment === "cash" ? amountPaid : total,
        items: cart.map(i => ({ product_id: i.product.id, sku: i.product.sku || undefined, quantity: i.quantity })),
      });
      setCompletedSale(sale); setStep("receipt");
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : "Failed to process sale.");
    } finally { setProcessing(false); }
  }

  function reset() {
    setCart([]); setScanInput(""); setScanError("");
    setClientName(""); setClientPhone(""); setPayment("cash");
    setAmountPaid(0); setProcessError(""); setCompletedSale(null); setStep("scan");
    loadProducts(); // re-fetch so stock levels reflect the completed sale
  }

  // Filtered product list for catalog
  const catalogProducts = allProducts.filter(p => {
    if (!prodSearch.trim()) return true;
    const q = prodSearch.toLowerCase();
    return p.productName.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  // ── Receipt ────────────────────────────────────────────────────────────────

  if (step === "receipt" && completedSale) {
    return (
      <ProReceipt
        sale={completedSale} cart={cart}
        clientName={clientName} clientPhone={clientPhone}
        payment={payment} onReset={reset}
      />
    );
  }

  // ── Payment ────────────────────────────────────────────────────────────────

  if (step === "payment") {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button type="button" title="Back to cart" onClick={() => { setProcessError(""); setStep("scan"); }}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
              <PackageCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Payment</h1>
              <p className="text-xs text-gray-400">{cart.length} product{cart.length !== 1 ? "s" : ""} · {total.toLocaleString()} RWF</p>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Summary</p>
          </div>
          <div className="divide-y divide-gray-50">
            {cart.map(({ product, quantity }, idx) => {
              const price = parsePrice(product.sellingPrice);
              return (
                <div key={product.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.productName}</p>
                    <p className="text-[11px] text-gray-400">{price.toLocaleString()} RWF × {quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">{(price * quantity).toLocaleString()} RWF</span>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-violet-50">
            <span className="text-sm font-bold text-gray-700">Total</span>
            <span className="text-xl font-black text-violet-700 tabular-nums">{total.toLocaleString()} RWF</span>
          </div>
        </div>

        {/* Client info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Client Info <span className="text-gray-300 font-normal normal-case">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="Client name"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
              placeholder="Phone number"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {PAY_OPTS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setPayment(key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${payment === key ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                <Icon className={`w-5 h-5 ${payment === key ? "text-violet-600" : "text-gray-400"}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cash received — auto-filled */}
        {payment === "cash" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Cash Received (RWF)</label>
            <div className="relative">
              <input type="number" min={0} value={amountPaid || ""}
                onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                title="Cash received"
                placeholder={total.toString()}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-bold font-mono outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">RWF</span>
            </div>
            {amountPaid >= total && amountPaid > 0 && (
              <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-sm text-emerald-700 font-semibold">Change Due</span>
                <span className="text-2xl font-black text-emerald-700 tabular-nums">{change.toLocaleString()} RWF</span>
              </div>
            )}
            {amountPaid > 0 && amountPaid < total && (
              <div className="px-4 py-2 bg-red-50 rounded-xl text-sm text-red-600 font-medium">
                Short by {(total - amountPaid).toLocaleString()} RWF
              </div>
            )}
          </div>
        )}

        {processError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {processError}
          </div>
        )}

        <button type="button" onClick={processSale}
          disabled={processing || (payment === "cash" && amountPaid < total)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 shadow-lg shadow-emerald-200 transition">
          {processing
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
            : <><Printer className="w-5 h-5" /> Save & Print Receipt — {total.toLocaleString()} RWF</>}
        </button>
      </div>
    );
  }

  // ── Scan / Catalog step ────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-500">Pick or scan products, then proceed to payment</p>
          </div>
        </div>
        {cart.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-black text-violet-700 tabular-nums">{total.toLocaleString()} RWF</p>
            <p className="text-xs text-gray-400">{cart.reduce((s, i) => s + i.quantity, 0)} items in cart</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left: Product catalog ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Scan input */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-violet-200 p-4 shadow-sm">
            <div ref={dropRef} className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
                  <input
                    ref={scanInputRef}
                    data-scanner="true"
                    value={scanInput}
                    onChange={e => { setScanInput(e.target.value); setScanError(""); }}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); lookupAndAdd(scanInput); }
                      if (e.key === "Escape") setShowDrop(false);
                      if (e.key === "ArrowDown" && showDrop && suggestions.length > 0) {
                        e.preventDefault();
                        (dropRef.current?.querySelector("button[data-sug]") as HTMLButtonElement)?.focus();
                      }
                    }}
                    onFocus={() => suggestions.length > 0 && setShowDrop(true)}
                    placeholder="Scan barcode or type SKU, press Enter…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-violet-200 text-sm font-mono outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-violet-50 placeholder-violet-300"
                  />
                </div>
                <button type="button" title="Scan" onClick={() => lookupAndAdd(scanInput)}
                  disabled={scanning || !scanInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition">
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                </button>
              </div>

              {/* Dropdown */}
              {showDrop && suggestions.length > 0 && (
                <div className="absolute left-0 right-14 top-full mt-1 z-30 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                  {suggestions.map((p, idx) => {
                    const price = parsePrice(p.sellingPrice);
                    const inCart = cart.find(i => i.product.id === p.id);
                    return (
                      <button key={p.id} data-sug={idx} type="button" onClick={() => { addToCart(p); setScanInput(""); setSuggestions([]); setShowDrop(false); setScanError(""); scanInputRef.current?.focus(); }}
                        onKeyDown={e => {
                          if (e.key === "ArrowDown") { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLButtonElement)?.focus(); }
                          if (e.key === "ArrowUp") { e.preventDefault(); idx === 0 ? scanInputRef.current?.focus() : (e.currentTarget.previousElementSibling as HTMLButtonElement)?.focus(); }
                          if (e.key === "Escape") { setShowDrop(false); scanInputRef.current?.focus(); }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 text-left transition border-b border-gray-50 last:border-0">
                        <Package className="w-4 h-4 text-violet-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.productName}</p>
                          <p className="text-[11px] text-gray-400">{price.toLocaleString()} RWF{p.initialQuantity != null && <span className={`ml-2 ${p.initialQuantity <= 0 ? "text-red-500" : "text-emerald-600"}`}>· {p.initialQuantity} in stock</span>}</p>
                        </div>
                        {inCart && <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full shrink-0">×{inCart.quantity}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {scanError && <p className="flex items-center gap-2 mt-2 text-sm text-red-600"><AlertCircle className="w-4 h-4 shrink-0" />{scanError}</p>}
          </div>

          {/* Product catalog */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input type="text" value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  placeholder="Filter products…"
                  className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </div>
              {prodSearch && <button type="button" title="Clear filter" onClick={() => setProdSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
              <span className="text-xs text-gray-400 shrink-0">{catalogProducts.length} products</span>
            </div>

            {loadingProds ? (
              <div className="py-12 flex flex-col items-center gap-2 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                <p className="text-sm">Loading products…</p>
              </div>
            ) : catalogProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 max-h-[420px] overflow-y-auto">
                {catalogProducts.map(p => {
                  const price      = parsePrice(p.sellingPrice);
                  const inCart     = cart.find(i => i.product.id === p.id);
                  const stock      = p.initialQuantity ?? 0;
                  const cartQty    = inCart?.quantity ?? 0;
                  const remaining  = stock - cartQty;
                  const outOfStock = stock <= 0;
                  const atLimit    = cartQty >= stock && stock > 0;
                  const disabled   = outOfStock || atLimit;
                  return (
                    <button key={p.id} type="button" onClick={() => !disabled && addToCart(p)}
                      disabled={disabled}
                      className={`relative flex flex-col items-start text-left p-3 rounded-xl border-2 transition-all group ${
                        atLimit      ? "border-amber-400 bg-amber-50 cursor-not-allowed" :
                        outOfStock   ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed" :
                        inCart       ? "border-violet-500 bg-violet-50" :
                                       "border-gray-100 hover:border-violet-300 hover:bg-violet-50/40"
                      }`}>
                      {/* Cart qty badge */}
                      {inCart && (
                        <span className={`absolute top-2 right-2 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center ${atLimit ? "bg-amber-500" : "bg-violet-600"}`}>
                          {inCart.quantity}
                        </span>
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                        atLimit ? "bg-amber-100" : inCart ? "bg-violet-200" : "bg-gray-100 group-hover:bg-violet-100"
                      }`}>
                        <Package className={`w-4 h-4 ${atLimit ? "text-amber-600" : inCart ? "text-violet-700" : "text-gray-400 group-hover:text-violet-500"}`} />
                      </div>
                      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 w-full">{p.productName}</p>
                      <p className="text-[11px] font-bold text-violet-700 mt-1">{price.toLocaleString()} RWF</p>
                      <p className={`text-[10px] mt-0.5 font-medium ${
                        outOfStock ? "text-red-500" : atLimit ? "text-amber-600" : remaining <= 3 ? "text-amber-500" : "text-gray-400"
                      }`}>
                        {outOfStock ? "Out of stock" : atLimit ? "Limit reached" : `${remaining} left`}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Cart ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900 text-sm">Cart</span>
                {cart.length > 0 && (
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button type="button" onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 transition">
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-center">
                <ShoppingCart className="w-10 h-10 text-gray-200" />
                <p className="text-sm text-gray-400">Cart is empty</p>
                <p className="text-xs text-gray-300">Click a product or scan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
                {cart.map(({ product, quantity }, idx) => {
                  const price = parsePrice(product.sellingPrice);
                  return (
                    <div key={product.id} className="flex items-center gap-2 px-4 py-2.5">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{product.productName}</p>
                        <p className="text-[10px] text-gray-400">{price.toLocaleString()} RWF</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" title="Decrease" onClick={() => changeQty(product.id, -1)}
                          className="w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition">
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className={`w-6 text-center text-xs font-bold ${quantity >= (product.initialQuantity ?? 0) ? "text-amber-600" : "text-gray-900"}`}>{quantity}</span>
                        <button type="button" title="Increase"
                          onClick={() => changeQty(product.id, 1)}
                          disabled={quantity >= (product.initialQuantity ?? 0)}
                          className="w-5 h-5 rounded-full bg-gray-100 hover:bg-emerald-100 hover:text-emerald-600 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-gray-900 w-20 text-right shrink-0 tabular-nums">{(price * quantity).toLocaleString()}</span>
                      <button type="button" title="Remove" onClick={() => removeItem(product.id)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total + Proceed */}
            <div className="border-t border-gray-100 p-4 space-y-3">
              {cart.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-xl font-black text-violet-700 tabular-nums">{total.toLocaleString()} RWF</span>
                </div>
              )}
              <button type="button" onClick={() => { setProcessError(""); setStep("payment"); }}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-200 transition">
                <ChevronRight className="w-4 h-4" /> Proceed to Payment
              </button>
              {cart.length === 0 && <p className="text-center text-[11px] text-gray-300">Add at least one product</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
