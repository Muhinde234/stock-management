"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Edit2, Trash2, Eye,
  Package, X, ChevronLeft, ChevronRight,
  AlertCircle, ChevronDown, CheckCircle2,
  Barcode, ScanLine, ArrowRight, Loader2,
  PackageCheck, PackageX, TrendingDown,
  ShoppingCart, Minus, CreditCard, Smartphone, Banknote,
  CalendarCheck,
} from "lucide-react";
import { productsApi, categoriesApi, parsePrice, salesApi, getCashierIdFromToken } from "@/lib/api";
import type { Product, ProductPayload, Category, PaymentMethod } from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

// ── Stock status helpers ──────────────────────────────────────────────────────

function getStockStatus(p: Product) {
  if (p.quantity_in_stock === 0) return "sold_out";
  if (p.quantity_in_stock <= p.minimum_stock) return "low";
  return "in_stock";
}

function StockStatusBadge({ product }: { product: Product }) {
  const st = getStockStatus(product);
  if (st === "sold_out") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
      <PackageX className="w-3 h-3" /> Out of Stock
    </span>
  );
  if (st === "low") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
      <TrendingDown className="w-3 h-3" /> Low Stock
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
      <PackageCheck className="w-3 h-3" /> In Stock
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
      status === "active" ? "bg-violet-50 text-violet-700 border border-violet-100" : "bg-gray-100 text-gray-500 border border-gray-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-violet-500" : "bg-gray-400"}`} />
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

// ── Inline category creator ───────────────────────────────────────────────────

function CategorySelect({
  categories,
  value,
  onChange,
  onCategoryAdded,
}: {
  categories: Category[];
  value: number | "";
  onChange: (id: number) => void;
  onCategoryAdded: (cat: Category) => void;
}) {
  const [adding,   setAdding]   = useState(false);
  const [newName,  setNewName]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const cat = await categoriesApi.create(name);
      onCategoryAdded(cat);
      onChange(cat.id);
      setNewName("");
      setAdding(false);
    } catch {
      // Optimistic fallback with mock id
      const fake: Category = { id: Date.now(), categoryName: name };
      onCategoryAdded(fake);
      onChange(fake.id);
      setNewName("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  if (adding) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } if (e.key === "Escape") setAdding(false); }}
            placeholder="New category name…"
            title="New category name"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-violet-300 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
          />
          <button
            type="button"
            title="Save category"
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Add
          </button>
          <button
            type="button"
            title="Cancel"
            onClick={() => { setAdding(false); setNewName(""); }}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <select
          title="Product category"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white transition-all cursor-pointer"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.categoryName}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
      <button
        type="button"
        title="Add new category"
        onClick={() => setAdding(true)}
        className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({
  product, onClose, onDeleted,
}: { product: Product; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function handleDelete() {
    setDeleting(true);
    try {
      await productsApi.delete(product.id);
      onDeleted();
    } catch {
      setError("Failed to delete product. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center">Delete Product?</h2>
        <p className="text-sm text-gray-500 text-center mt-2">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-800">{product.name}</span>?
          This action cannot be undone.
        </p>
        {error && (
          <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
            {deleting
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting…</>
              : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Product Modal (2-step) ─────────────────────────────────────────

interface ProductFormProps {
  initial?: Product | null;
  initialBarcode?: string;
  categories: Category[];
  onClose: () => void;
  onSaved: (wasEdit: boolean) => void;
  onCategoryAdded: (cat: Category) => void;
}

const EMPTY_FORM = (): Omit<ProductPayload, "category_id"> & { category_id: number | "" } => ({
  name:              "",
  description:       "",
  category_id:       "",
  sku:               "",
  barcode:           "",
  buying_price:      0,
  selling_price:     0,
  quantity_in_stock: 0,
  minimum_stock:     5,
  expiry_date:       "",
  status:            "active",
});

function ProductFormModal({
  initial, initialBarcode = "", categories,
  onClose, onSaved, onCategoryAdded,
}: ProductFormProps) {
  const isEdit = !!initial;

  // step 1 = barcode scan, step 2 = product details
  const [step, setStep] = useState<1 | 2>(isEdit ? 2 : 1);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name:              initial.name,
          description:       initial.description ?? "",
          category_id:       initial.category_id as number | "",
          sku:               initial.sku,
          barcode:           initial.barcode ?? "",
          buying_price:      parsePrice(initial.buying_price),
          selling_price:     parsePrice(initial.selling_price),
          quantity_in_stock: initial.quantity_in_stock,
          minimum_stock:     initial.minimum_stock,
          expiry_date:       initial.expiry_date ?? "",
          status:            initial.status,
        }
      : { ...EMPTY_FORM(), barcode: initialBarcode }
  );

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input on step 1
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => barcodeRef.current?.focus(), 80);
    }
  }, [step]);

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleBarcodeKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      setStep(2);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim())        { setError("Product name is required.");             return; }
    if (!form.sku.trim())         { setError("SKU is required.");                      return; }
    if (!form.category_id)        { setError("Category is required.");                 return; }
    if (form.selling_price <= 0)  { setError("Selling price must be greater than 0."); return; }

    const payload: ProductPayload = {
      name:              form.name.trim(),
      description:       form.description?.trim() || undefined,
      category_id:       form.category_id as number,
      sku:               form.sku.trim().toUpperCase(),
      barcode:           form.barcode?.trim() || undefined,
      buying_price:      form.buying_price,
      selling_price:     form.selling_price,
      quantity_in_stock: form.quantity_in_stock,
      minimum_stock:     form.minimum_stock,
      expiry_date:       form.expiry_date || undefined,
      status:            form.status,
    };

    setSaving(true);
    try {
      if (isEdit && initial) {
        await productsApi.update(initial.id, payload);
      } else {
        await productsApi.create(payload);
      }
      onSaved(isEdit);
    } catch {
      setError("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const margin = form.buying_price > 0 && form.selling_price > form.buying_price
    ? (form.selling_price - form.buying_price) / form.selling_price * 100
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            {!isEdit && (
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 1 ? "bg-violet-600 text-white" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {step === 2 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                </div>
                <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 2 ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"
                }`}>2</div>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEdit ? "Edit Product" : step === 1 ? "Scan Barcode" : "Product Details"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEdit
                  ? "Update the product details below"
                  : step === 1
                    ? "Scan barcode with scanner or type it manually"
                    : "Fill in the product information"}
              </p>
            </div>
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step 1: Barcode Scanner ── */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center flex-1 px-8 py-10 gap-7">
            <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-violet-200 flex items-center justify-center">
              <ScanLine className="w-10 h-10 text-violet-500" />
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-base font-semibold text-gray-800">Ready to scan</p>
              <p className="text-sm text-gray-400">
                Point the barcode scanner at the product barcode,<br />
                or type the barcode manually below
              </p>
            </div>

            {/* Barcode input */}
            <div className="w-full max-w-sm space-y-3">
              <div className="relative">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  ref={barcodeRef}
                  type="text"
                  value={form.barcode}
                  onChange={(e) => set("barcode", e.target.value)}
                  onKeyDown={handleBarcodeKey}
                  placeholder="Barcode will appear here…"
                  title="Product barcode"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm font-mono text-gray-800 placeholder-gray-300 outline-none transition-all text-center tracking-widest"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Skip (no barcode)
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!form.barcode.trim()}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-200"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {form.barcode && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Barcode scanned: <span className="font-mono font-bold ml-1">{form.barcode}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-300">Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">Enter</kbd> after scanning to continue automatically</p>
          </div>
        )}

        {/* ── Step 2: Product Details ── */}
        {step === 2 && (
          <>
            <form
              id="product-form"
              onSubmit={handleSubmit}
              className="overflow-y-auto flex-1 px-6 py-5 space-y-6"
            >
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Barcode preview (read-only from step 1) */}
              {form.barcode && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">
                  <Barcode className="w-5 h-5 text-violet-500 shrink-0" />
                  <div>
                    <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wide">Scanned Barcode</p>
                    <p className="text-sm font-mono font-bold text-violet-700">{form.barcode}</p>
                  </div>
                  {!isEdit && (
                    <button
                      type="button"
                      title="Re-scan barcode"
                      onClick={() => setStep(1)}
                      className="ml-auto text-xs text-violet-500 hover:text-violet-700 font-medium underline underline-offset-2"
                    >
                      Re-scan
                    </button>
                  )}
                </div>
              )}

              {/* Basic info */}
              <section className="space-y-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Basic Information</p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. iPhone 15 Pro Max"
                    title="Product name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Brief description of the product…"
                    title="Product description"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => set("sku", e.target.value.toUpperCase())}
                      placeholder="e.g. IP15-PRO-256"
                      title="Stock Keeping Unit"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 font-mono outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Barcode <span className="text-gray-400 font-normal">(from scan)</span>
                    </label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={form.barcode}
                        onChange={(e) => set("barcode", e.target.value)}
                        placeholder="Barcode number"
                        title="Product barcode"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 font-mono outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                      />
                    </div>
                  </div>
                </div>


                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <CategorySelect
                    categories={categories}
                    value={form.category_id}
                    onChange={(id) => set("category_id", id)}
                    onCategoryAdded={onCategoryAdded}
                  />
                </div>
              </section>

              {/* Pricing */}
              <section className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pricing</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Buying Price</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        title="Buying price"
                        placeholder="0.00"
                        value={form.buying_price || ""}
                        onChange={(e) => set("buying_price", parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        title="Selling price"
                        placeholder="0.00"
                        value={form.selling_price || ""}
                        onChange={(e) => set("selling_price", parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {margin !== null && (
                  <div className="flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Margin: {margin.toFixed(1)}% · profit of ${(form.selling_price - form.buying_price).toFixed(2)} per unit
                  </div>
                )}
              </section>

              {/* Stock */}
              <section className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Stock &amp; Location</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {isEdit ? "Quantity in Stock" : "Initial Quantity"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      title="Quantity in stock"
                      placeholder="0"
                      value={form.quantity_in_stock}
                      onChange={(e) => set("quantity_in_stock", parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Minimum Stock Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      title="Minimum stock level"
                      placeholder="5"
                      value={form.minimum_stock}
                      onChange={(e) => set("minimum_stock", parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Alert when stock drops below this</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiry-date" className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="expiry-date"
                      type="date"
                      title="Expiry date"
                      value={form.expiry_date}
                      onChange={(e) => set("expiry_date", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                    <div className="flex gap-3">
                      {(["active", "inactive"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => set("status", s)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all capitalize ${
                            form.status === s
                              ? s === "active"
                                ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200"
                                : "bg-gray-600 border-gray-600 text-white"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-2xl">
              <div className="flex items-center gap-2">
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <p className="text-xs text-gray-400">
                  <span className="text-red-500">*</span> Required fields
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="product-form"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-md shadow-violet-200"
                >
                  {saving
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    : isEdit ? "Update Product" : "Save & Check In"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Product Detail Side Panel ─────────────────────────────────────────────────

function ProductDetailPanel({
  product, onClose, onEdit,
}: { product: Product; onClose: () => void; onEdit: () => void }) {
  const bp     = parsePrice(product.buying_price);
  const sp     = parsePrice(product.selling_price);
  const margin = sp > 0 ? (sp - bp) / sp * 100 : 0;
  const stockSt = getStockStatus(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-900">Product Details</h2>
          <button type="button" title="Close" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <Package className="w-7 h-7 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h3>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{product.sku}</p>
              {product.description && <p className="text-xs text-gray-500 mt-1.5">{product.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={product.status} />
                <StockStatusBadge product={product} />
              </div>
            </div>
          </div>

          {/* Barcode */}
          {product.barcode && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <Barcode className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Barcode</p>
                <p className="text-sm font-mono font-bold text-gray-800 tracking-wider">{product.barcode}</p>
              </div>
            </div>
          )}

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {[
              { label: "Category",      value: product.category?.categoryName ?? `#${product.category_id}` },
              { label: "SKU",           value: product.sku },
              { label: "Buying Price",  value: `$${bp.toFixed(2)}` },
              { label: "Selling Price", value: `$${sp.toFixed(2)}` },
              { label: "In Stock",      value: `${product.quantity_in_stock} units` },
              { label: "Min. Stock",    value: `${product.minimum_stock} units` },
              { label: "Expiry Date",   value: product.expiry_date ?? "—" },
              { label: "Created",       value: new Date(product.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-3">
                <p className="text-[11px] text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Profit card */}
          <div className={`rounded-2xl p-5 flex items-center justify-between ${
            stockSt === "sold_out" ? "bg-red-50 border border-red-100" :
            stockSt === "low"     ? "bg-amber-50 border border-amber-100" :
                                    "bg-violet-50 border border-violet-100"
          }`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                stockSt === "sold_out" ? "text-red-400" : stockSt === "low" ? "text-amber-500" : "text-violet-500"
              }`}>Profit Margin</p>
              <p className={`text-3xl font-bold mt-1 ${
                stockSt === "sold_out" ? "text-red-700" : stockSt === "low" ? "text-amber-700" : "text-violet-700"
              }`}>{margin.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                stockSt === "sold_out" ? "text-red-400" : stockSt === "low" ? "text-amber-500" : "text-violet-400"
              }`}>Per Unit</p>
              <p className={`text-2xl font-bold mt-1 ${
                stockSt === "sold_out" ? "text-red-700" : stockSt === "low" ? "text-amber-700" : "text-violet-700"
              }`}>${(sp - bp).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Close
          </button>
          <button type="button" onClick={onEdit}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
            <Edit2 className="w-3.5 h-3.5" /> Edit Product
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Checkout Modal ────────────────────────────────────────────────────────────

type CheckoutStep = "scan" | "confirm" | "success";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "cash",         label: "Cash",         icon: Banknote    },
  { value: "card",         label: "Card",         icon: CreditCard  },
  { value: "mobile_money", label: "Mobile Money", icon: Smartphone  },
  { value: "other",        label: "Other",        icon: ShoppingCart},
];

function CheckoutModal({ onClose }: { onClose: () => void }) {
  const [step,          setStep]          = useState<CheckoutStep>("scan");
  const [barcode,       setBarcode]       = useState("");
  const [product,       setProduct]       = useState<Product | null>(null);
  const [quantity,      setQuantity]      = useState(1);
  const [payment,       setPayment]       = useState<PaymentMethod>("cash");
  const [sale,          setSale]          = useState<import("@/lib/api").SaleRead | null>(null);
  const [scanning,      setScanning]      = useState(false);
  const [checking,      setChecking]      = useState(false);
  const [error,         setError]         = useState("");
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
      setQuantity(1);
      setStep("confirm");
    } catch {
      setError("Product not found for this barcode. Try again.");
    } finally {
      setScanning(false);
    }
  }

  async function handleCheckout() {
    if (!product) return;
    setChecking(true);
    setError("");
    try {
      const result = await salesApi.checkout({
        cashier_id:      getCashierIdFromToken(),
        items:           [{ barcode: product.barcode ?? undefined, product_id: product.id, quantity }],
        discount_amount: "0",
        tax_amount:      "0",
        payment_method:  payment,
        cash_received:   null,
      });
      setSale(result);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  function handleScanNext() {
    setStep("scan");
    setBarcode("");
    setProduct(null);
    setSale(null);
    setError("");
    setQuantity(1);
    setPayment("cash");
  }

  const sp    = product ? parsePrice(product.selling_price) : 0;
  const total = sp * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {step === "scan"    ? "Scan to Checkout"  :
                 step === "confirm" ? "Confirm Checkout"  :
                                     "Checkout Complete"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === "scan"    ? "Point scanner at product barcode"  :
                 step === "confirm" ? "Review and confirm the sale"        :
                                     "Sale recorded successfully"}
              </p>
            </div>
          </div>
          <button type="button" title="Close" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Step: Scan ── */}
        {step === "scan" && (
          <div className="px-6 py-8 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <ScanLine className="w-10 h-10 text-emerald-500" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">Ready to scan</p>
              <p className="text-xs text-gray-400 mt-1">Scan barcode or type it below, then press Enter</p>
            </div>

            <div className="w-full space-y-3">
              <div className="relative">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => { setBarcode(e.target.value); setError(""); }}
                  onKeyDown={handleScan}
                  placeholder="Barcode appears here…"
                  title="Product barcode"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-sm font-mono text-gray-800 placeholder-gray-300 outline-none transition-all text-center tracking-widest"
                />
                {scanning && (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => { if (barcode.trim()) handleScan({ key: "Enter", preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>); }}
                disabled={!barcode.trim() || scanning}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {scanning ? "Looking up…" : "Look Up Product"}
              </button>
            </div>

            <p className="text-xs text-gray-300">Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">Enter</kbd> after scanning</p>
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === "confirm" && product && (
          <div className="px-6 py-6 space-y-5">

            {/* Product card */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 leading-tight">{product.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-semibold">
                    {product.category?.categoryName ?? `Category ${product.category_id}`}
                  </span>
                  {product.barcode && (
                    <span className="text-[11px] font-mono text-gray-400">{product.barcode}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-gray-900">${sp.toFixed(2)}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">per unit</p>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Quantity</p>
              <div className="flex items-center gap-3">
                <button type="button" title="Decrease" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40 transition-all"
                  disabled={quantity <= 1}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-gray-900 w-8 text-center">{quantity}</span>
                <button type="button" title="Increase" onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-sm font-semibold text-emerald-700">Total</p>
              <p className="text-2xl font-bold text-emerald-700">${total.toFixed(2)}</p>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPayment(value)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      payment === value
                        ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setStep("scan"); setError(""); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Re-scan
              </button>
              <button type="button" onClick={handleCheckout} disabled={checking}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-200">
                {checking
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                  : <><CheckCircle2 className="w-4 h-4" /> Checkout</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && sale && (
          <div className="px-6 py-8 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CalendarCheck className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="text-center space-y-1">
              <p className="text-lg font-bold text-gray-900">Sale Complete!</p>
              <p className="text-sm text-gray-400">
                {new Date(sale.sale_date).toLocaleString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>

            {/* Receipt card */}
            <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 divide-y divide-gray-100 text-sm overflow-hidden">
              {[
                { label: "Sale #",    value: sale.sale_number },
                { label: "Product",   value: product?.name ?? "—" },
                { label: "Category",  value: product?.category?.categoryName ?? "—" },
                { label: "Qty",       value: String(quantity) },
                { label: "Payment",   value: sale.payment_method.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) },
                { label: "Grand Total", value: `$${parseFloat(sale.grand_total).toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <p className="text-gray-400 font-medium">{label}</p>
                  <p className={`font-bold ${label === "Grand Total" ? "text-emerald-600 text-base" : "text-gray-800"}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 w-full pt-1">
              <button type="button" onClick={handleScanNext}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                <ScanLine className="w-4 h-4" /> Scan Next
              </button>
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed top-5 right-5 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [stockFilter,setStockFilter]= useState<"" | "in_stock" | "low" | "sold_out">("");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [addOpen,      setAddOpen]      = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editTarget,   setEditTarget]   = useState<Product | null>(null);
  const [delTarget,    setDelTarget]    = useState<Product | null>(null);
  const [viewTarget,   setViewTarget]   = useState<Product | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Load categories once
  useEffect(() => {
    categoriesApi.getAll()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productsApi.getAll({
        skip:   (page - 1) * PAGE_SIZE,
        limit:  PAGE_SIZE,
        search: search || undefined,
      });
      setProducts(res);
      // API returns a plain array — infer hasMore from whether a full page came back
      setTotal((page - 1) * PAGE_SIZE + res.length + (res.length === PAGE_SIZE ? 1 : 0));
    } catch (err) {
      setProducts([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Reset to page 1 when search changes
  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current !== search) { setPage(1); prevSearch.current = search; }
  }, [search]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  function handleSaved(wasEdit: boolean) {
    setAddOpen(false);
    setEditTarget(null);
    loadProducts();
    showToast(wasEdit ? "Product updated successfully" : "Product added & checked in to stock");
  }

  function handleDeleted() {
    setDelTarget(null);
    loadProducts();
    showToast("Product removed from catalog");
  }

  function handleCategoryAdded(cat: Category) {
    setCategories((prev) => [...prev, cat]);
  }

  // Apply client-side stock filter
  const rows = stockFilter
    ? products.filter((p) => getStockStatus(p) === stockFilter)
    : products;

  const inStockCount  = products.filter((p) => getStockStatus(p) === "in_stock").length;
  const lowCount      = products.filter((p) => getStockStatus(p) === "low").length;
  const soldOutCount  = products.filter((p) => getStockStatus(p) === "sold_out").length;

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-full">

      {toast && <Toast message={toast.message} type={toast.type} />}

      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={loadProducts} className="ml-auto text-xs font-semibold underline underline-offset-2 hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}

      {addOpen && (
        <ProductFormModal
          categories={categories}
          onClose={() => setAddOpen(false)}
          onSaved={handleSaved}
          onCategoryAdded={handleCategoryAdded}
        />
      )}
      {editTarget && (
        <ProductFormModal
          initial={editTarget}
          categories={categories}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
          onCategoryAdded={handleCategoryAdded}
        />
      )}
      {delTarget  && (
        <DeleteModal
          product={delTarget}
          onClose={() => setDelTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
      {viewTarget && (
        <ProductDetailPanel
          product={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
        />
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Scan to check in · <span className="font-semibold text-gray-700">{total} products</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-200"
          >
            <ShoppingCart className="w-4 h-4" />
            Scan Checkout
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-200"
          >
            <ScanLine className="w-4 h-4" />
            Scan &amp; Add Product
          </button>
        </div>
      </div>

      {/* ── Stock summary cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "In Stock",     count: inStockCount,  icon: PackageCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", filter: "in_stock" as const },
          { label: "Low Stock",    count: lowCount,      icon: TrendingDown, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   filter: "low" as const },
          { label: "Out of Stock / Sold", count: soldOutCount,  icon: PackageX,    color: "text-red-600",    bg: "bg-red-50",     border: "border-red-100",     filter: "sold_out" as const },
        ].map(({ label, count, icon: Icon, color, bg, border, filter }) => (
          <button
            key={label}
            type="button"
            onClick={() => setStockFilter(stockFilter === filter ? "" : filter)}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg} hover:opacity-90 transition-all text-left ${stockFilter === filter ? "ring-2 ring-offset-1 ring-violet-400" : ""}`}
          >
            <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Search + filter row ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or barcode…"
            title="Search products"
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 shadow-sm transition-all"
          />
          {search && (
            <button type="button" title="Clear search" onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {stockFilter && (
          <button type="button" onClick={() => setStockFilter("")}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-violet-100 text-violet-700 text-xs font-semibold hover:bg-violet-200 transition-all">
            <X className="w-3.5 h-3.5" />
            Clear filter
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60">
              {["Product", "Barcode", "Category", "Buying Price", "Selling Price", "Qty in Stock", "Min Stock", "Stock Status", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className={`h-4 bg-gray-100 rounded-lg animate-pulse ${j === 0 ? "w-36" : "w-20"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <ScanLine className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">No products found</p>
                    <p className="text-xs text-gray-300">
                      {search ? `No results for "${search}"` : "Scan a barcode to add your first product"}
                    </p>
                    {!search && (
                      <button type="button" onClick={() => setAddOpen(true)}
                        className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all">
                        <ScanLine className="w-3.5 h-3.5" /> Scan &amp; Add
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Product */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{product.name}</p>
                        <p className="text-[11px] font-mono text-gray-400">{product.sku}</p>
                      </div>
                    </div>
                  </td>

                  {/* Barcode */}
                  <td className="px-4 py-3.5">
                    {product.barcode ? (
                      <div className="flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="text-xs font-mono text-gray-500">{product.barcode}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                      {product.category?.categoryName ?? `Category ${product.category_id}`}
                    </span>
                  </td>

                  {/* Buying price */}
                  <td className="px-4 py-3.5 text-sm text-gray-500">${parsePrice(product.buying_price).toFixed(2)}</td>

                  {/* Selling price */}
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900">${parsePrice(product.selling_price).toFixed(2)}</td>

                  {/* Qty */}
                  <td className="px-4 py-3.5">
                    <span className={`text-sm font-bold ${
                      product.quantity_in_stock === 0 ? "text-red-600" :
                      product.quantity_in_stock <= product.minimum_stock ? "text-amber-600" :
                      "text-gray-900"
                    }`}>
                      {product.quantity_in_stock}
                    </span>
                  </td>

                  {/* Min stock */}
                  <td className="px-4 py-3.5 text-sm text-gray-400">{product.minimum_stock}</td>

                  {/* Stock status */}
                  <td className="px-4 py-3.5">
                    <StockStatusBadge product={product} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={product.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" title="View details" onClick={() => setViewTarget(product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Edit product" onClick={() => setEditTarget(product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Delete product" onClick={() => setDelTarget(product)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50 bg-gray-50/40">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)}
              </span>{" "}
              of <span className="font-semibold text-gray-700">{total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" title="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 bg-white shadow-sm transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button key={pg} type="button" title={`Page ${pg}`} onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border ${
                      pg === page
                        ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-violet-50 hover:text-violet-600 shadow-sm"
                    }`}>
                    {pg}
                  </button>
                );
              })}
              <button type="button" title="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 bg-white shadow-sm transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
