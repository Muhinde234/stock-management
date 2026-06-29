"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import {
  Plus, Search, Edit2, Trash2, Eye,
  Package, X, ChevronLeft, ChevronRight,
  AlertCircle, ChevronDown, CheckCircle2,
  ScanLine, Loader2,
  PackageCheck, PackageX, TrendingDown,
} from "lucide-react";
import { productsApi, parsePrice, getUnitName } from "@/lib/api";
import { categoriesApi } from "@/lib/api/categories";
import { unitsApi, type Unit } from "@/lib/api/units";
import type { Product, ProductPayload, Category } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

// ── User snapshot helpers (useSyncExternalStore — avoids setState-in-effect) ──
function noopSubscribe() { return () => {}; }
function userServerSnap(): null { return null; }
function userClientSnap(): string | null {
  const u = getCurrentUser();
  if (!u) return null;
  return [u.role, String(u.store_id ?? ""), String(u.shop_id ?? "")].join("\x00");
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE        = 12;
const OTHER_UNIT_ID    = -1;  // sentinel for "Other…" option

// ── Stock status helpers ──────────────────────────────────────────────────────

function getLocalStockLevel(p: Product): "low" | "ok" | "out" {
  if (p.stock_status === "out_of_stock") return "out";
  if ((p.initialQuantity ?? 0) <= p.minimumQuantity) return "low";
  return "ok";
}

function StockStatusBadge({ product }: { product: Product }) {
  const level = getLocalStockLevel(product);
  if (level === "out") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
      <PackageX className="w-3 h-3" /> Out of Stock
    </span>
  );
  if (level === "low") return (
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
      status === "active"
        ? "bg-violet-50 text-violet-700 border border-violet-100"
        : "bg-gray-100 text-gray-500 border border-gray-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-violet-500" : "bg-gray-400"}`} />
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

// ── Inline category creator ───────────────────────────────────────────────────

function CategorySelect({
  categories, value, onChange, onCategoryAdded,
}: {
  categories:      Category[];
  value:           number | "";
  onChange:        (id: number) => void;
  onCategoryAdded: (cat: Category) => void;
}) {
  const [adding,  setAdding]  = useState(false);
  const [newName, setNewName] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true); setError("");
    try {
      const cat = await categoriesApi.create(name);
      onCategoryAdded(cat);
      onChange(cat.id);
      setNewName(""); setAdding(false);
    } catch {
      const fake: Category = { id: Date.now(), categoryName: name };
      onCategoryAdded(fake); onChange(fake.id);
      setNewName(""); setAdding(false);
    } finally { setSaving(false); }
  }

  if (adding) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef} type="text" value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } if (e.key === "Escape") setAdding(false); }}
            placeholder="New category name…" title="New category name"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-violet-300 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
          />
          <button type="button" title="Save category" onClick={handleAdd} disabled={saving || !newName.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Add
          </button>
          <button type="button" title="Cancel" onClick={() => { setAdding(false); setNewName(""); }}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
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
        <select title="Product category" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white transition-all cursor-pointer">
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
      <button type="button" title="Add new category" onClick={() => setAdding(true)}
        className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ product, onClose, onDeleted }: {
  product:   Product;
  onClose:   () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function handleDelete() {
    setDeleting(true);
    try { await productsApi.delete(product.id); onDeleted(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to delete product."); setDeleting(false); }
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
          <span className="font-semibold text-gray-800">{product.productName}</span>?
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

// ── Add / Edit Product Modal ───────────────────────────────────────────────────

interface ProductFormProps {
  initial?:        Product | null;
  categories:      Category[];
  units:           Unit[];
  onClose:         () => void;
  onSaved:         (wasEdit: boolean) => void;
  onCategoryAdded: (cat: Category) => void;
  onUnitAdded:     (u: Unit) => void;
}

type FormState = {
  productName:     string;
  quantityUnit:    number | "";   // unit ID, OTHER_UNIT_ID = "Other…", "" = unselected
  customUnitName:  string;
  productPrice:    number;
  sellingPrice:    number;
  initialQuantity: number;
  minimumQuantity: number;
  category_id:     number | "";
  status:          "active" | "inactive";
};

function emptyForm(): FormState {
  return {
    productName:     "",
    quantityUnit:    "",
    customUnitName:  "",
    productPrice:    0,
    sellingPrice:    0,
    initialQuantity: 0,
    minimumQuantity: 5,
    category_id:     "",
    status:          "active",
  };
}

function autoSku(name: string): string {
  const initials = name.trim().split(/\s+/).map(w => w[0] ?? "").join("").toUpperCase() || "P";
  return `${initials}-${Date.now().toString().slice(-5)}`;
}

function ProductFormModal({
  initial, categories, units,
  onClose, onSaved, onCategoryAdded, onUnitAdded,
}: ProductFormProps) {
  const isEdit = !!initial;

  const [form, setForm] = useState<FormState>(() => {
    if (!isEdit) return emptyForm();
    const rawUnit = initial.quantityUnit;
    const unitId  = typeof rawUnit === "object" ? rawUnit.id : (rawUnit ?? "");
    return {
      productName:     initial.productName,
      quantityUnit:    unitId,
      customUnitName:  "",
      productPrice:    parsePrice(initial.productPrice),
      sellingPrice:    parsePrice(initial.sellingPrice),
      initialQuantity: initial.initialQuantity ?? 0,
      minimumQuantity: initial.minimumQuantity,
      category_id:     initial.category_id as number | "",
      status:          initial.status,
    };
  });

  const [customProps, setCustomProps] = useState<{ key: string; value: string }[]>(() => {
    const props = isEdit ? (initial.additionalProperties ?? {}) : {};
    return Object.entries(props).map(([key, value]) => ({ key, value }));
  });

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const unitLabel = form.quantityUnit === OTHER_UNIT_ID
    ? (form.customUnitName || "unit")
    : getUnitName(form.quantityUnit === "" ? undefined : form.quantityUnit as number, units);

  const margin = form.productPrice > 0 && form.sellingPrice > form.productPrice
    ? (form.sellingPrice - form.productPrice) / form.sellingPrice * 100
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.productName.trim()) { setError("Product name is required."); return; }
    if (form.sellingPrice <= 0)   { setError("Selling price must be greater than 0."); return; }
    if (form.minimumQuantity < 0) { setError("Minimum quantity cannot be negative."); return; }

    let unitId: number | undefined;
    if (form.quantityUnit === OTHER_UNIT_ID) {
      const name = form.customUnitName.trim();
      if (!name) { setError("Please enter a custom unit name."); return; }
      setSaving(true);
      try {
        const newUnit = await unitsApi.create(name);
        onUnitAdded(newUnit);
        unitId = newUnit.id;
      } catch {
        setError("Failed to create unit. Please try again.");
        setSaving(false);
        return;
      }
    } else if (form.quantityUnit !== "") {
      unitId = form.quantityUnit as number;
    }

    if (!unitId) { setError("Please select a measurement unit."); setSaving(false); return; }

    const resolvedProps: Record<string, string> = {};
    for (const row of customProps) {
      if (row.key.trim()) resolvedProps[row.key.trim()] = row.value;
    }

    const payload: ProductPayload = {
      productName:           form.productName.trim(),
      quantityUnit:          unitId,
      category_id:           (form.category_id || 1) as number,
      sku:                   isEdit ? initial!.sku : autoSku(form.productName),
      productPrice:          form.productPrice || undefined,
      sellingPrice:          form.sellingPrice,
      initialQuantity:       form.initialQuantity,
      minimumQuantity:       form.minimumQuantity,
      status:                form.status,
      additionalProperties:  Object.keys(resolvedProps).length ? resolvedProps : undefined,
    };

    setSaving(true);
    try {
      if (isEdit && initial) {
        await productsApi.update(initial.id, payload);
      } else {
        await productsApi.create(payload);
      }
      onSaved(isEdit);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "Edit Product" : "Register Product"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? "Update product details" : "Add a product you sell"}
            </p>
          </div>
          <button type="button" title="Close" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form id="product-form" onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Name + Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={form.productName}
                onChange={e => set("productName", e.target.value)}
                placeholder="e.g. Mineral Water 500ml"
                title="Product name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                title="Measurement unit"
                value={form.quantityUnit === "" ? "" : form.quantityUnit}
                onChange={e => set("quantityUnit", e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-white"
              >
                <option value="">Select…</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.unitName}</option>)}
                <option value={OTHER_UNIT_ID}>Other…</option>
              </select>
              {form.quantityUnit === OTHER_UNIT_ID && (
                <input
                  type="text" value={form.customUnitName}
                  onChange={e => set("customUnitName", e.target.value)}
                  placeholder="e.g. bags" title="Custom unit name"
                  className="mt-1.5 w-full px-3 py-2 rounded-xl border border-violet-300 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              )}
            </div>
          </div>

          {/* Prices */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Pricing</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Purchase Price <span className="text-gray-400 font-normal">(buying)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">RWF</span>
                  <input
                    type="number" min="0" step="1" title="Purchase price" placeholder="0"
                    value={form.productPrice || ""}
                    onChange={e => set("productPrice", parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">RWF</span>
                  <input
                    type="number" min="0" step="1" title="Selling price" placeholder="0"
                    value={form.sellingPrice || ""}
                    onChange={e => set("sellingPrice", parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>
              </div>
            </div>
            {margin !== null && (
              <div className="flex items-center gap-2 mt-2.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Margin: {margin.toFixed(1)}% — profit of {(form.sellingPrice - form.productPrice).toLocaleString()} RWF per {unitLabel}
              </div>
            )}
          </div>

          {/* Quantities */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Stock Quantities</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {isEdit ? "Quantity in Stock" : "Initial Quantity"}
                </label>
                <input
                  type="number" min="0" title="Quantity in stock" placeholder="0"
                  value={form.initialQuantity}
                  onChange={e => set("initialQuantity", parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Minimum Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min="0" title="Minimum quantity for restock alert" placeholder="5"
                  value={form.minimumQuantity}
                  onChange={e => set("minimumQuantity", parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
                <p className="text-[10px] text-amber-600 mt-1">You&apos;ll be notified to restock when below this</p>
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Category <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <CategorySelect
              categories={categories}
              value={form.category_id}
              onChange={id => set("category_id", id)}
              onCategoryAdded={onCategoryAdded}
            />
          </div>

          {/* Additional Properties */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Additional Properties</p>
              <button type="button"
                onClick={() => setCustomProps(p => [...p, { key: "", value: "" }])}
                className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Property
              </button>
            </div>
            {customProps.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Optionally add extra details like color, size, origin, brand, etc.
              </p>
            ) : (
              <div className="space-y-2">
                {customProps.map((prop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text" value={prop.key}
                      onChange={e => setCustomProps(p => p.map((r, j) => j === i ? { ...r, key: e.target.value } : r))}
                      placeholder="e.g. Color" title="Property name"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    <input
                      type="text" value={prop.value}
                      onChange={e => setCustomProps(p => p.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                      placeholder="e.g. Red" title="Property value"
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    <button type="button"
                      onClick={() => setCustomProps(p => p.filter((_, j) => j !== i))}
                      title="Remove property"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-2xl">
          <p className="text-xs text-gray-400"><span className="text-red-500">*</span> Required</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" form="product-form" disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-md shadow-violet-200">
              {saving
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : isEdit ? "Update Product" : "Register Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Product Detail Side Panel ─────────────────────────────────────────────────

function ProductDetailPanel({
  product, units, onClose, onEdit,
}: { product: Product; units: Unit[]; onClose: () => void; onEdit: () => void }) {
  const bp     = parsePrice(product.productPrice);
  const sp     = parsePrice(product.sellingPrice);
  const margin = sp > 0 ? (sp - bp) / sp * 100 : 0;
  const level  = getLocalStockLevel(product);
  const uName  = getUnitName(product.quantityUnit, units);

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
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{product.productName}</h3>
              {product.sku && <p className="text-xs font-mono text-gray-400 mt-0.5">{product.sku}</p>}
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={product.status} />
                <StockStatusBadge product={product} />
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {[
              { label: "Category",       value: product.category?.categoryName ?? `#${product.category_id}` },
              { label: "Unit",           value: uName || "—" },
              { label: "Purchase Price", value: `${bp.toLocaleString()} RWF` },
              { label: "Selling Price",  value: `${sp.toLocaleString()} RWF` },
              { label: "In Stock",       value: `${product.initialQuantity ?? 0}` },
              { label: "Min. Stock",     value: `${product.minimumQuantity}` },
              { label: "SKU",            value: product.sku ?? "—" },
              { label: "Created",        value: new Date(product.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-4 py-3">
                <p className="text-[11px] text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Additional properties */}
          {product.additionalProperties && Object.keys(product.additionalProperties).length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Properties</p>
              <div className="space-y-1.5">
                {Object.entries(product.additionalProperties).map(([k, v]) => (
                  <div key={k} className="flex justify-between px-3.5 py-2 bg-gray-50 rounded-lg text-xs">
                    <span className="text-gray-500 font-medium">{k}</span>
                    <span className="text-gray-800 font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profit card */}
          <div className={`rounded-2xl p-5 flex items-center justify-between ${
            level === "out" ? "bg-red-50 border border-red-100"   :
            level === "low" ? "bg-amber-50 border border-amber-100" :
                              "bg-violet-50 border border-violet-100"
          }`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                level === "out" ? "text-red-400" : level === "low" ? "text-amber-500" : "text-violet-500"
              }`}>Profit Margin</p>
              <p className={`text-3xl font-bold mt-1 ${
                level === "out" ? "text-red-700" : level === "low" ? "text-amber-700" : "text-violet-700"
              }`}>{margin.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                level === "out" ? "text-red-400" : level === "low" ? "text-amber-500" : "text-violet-400"
              }`}>Per Unit</p>
              <p className={`text-2xl font-bold mt-1 ${
                level === "out" ? "text-red-700" : level === "low" ? "text-amber-700" : "text-violet-700"
              }`}>{(sp - bp).toLocaleString()} RWF</p>
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
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [units,       setUnits]       = useState<Unit[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [stockFilter, setStockFilter] = useState<"" | "in_stock" | "low" | "out_of_stock">("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [toast,       setToast]       = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [delTarget,  setDelTarget]  = useState<Product | null>(null);
  const [viewTarget, setViewTarget] = useState<Product | null>(null);

  const userSnap  = useSyncExternalStore(noopSubscribe, userClientSnap, userServerSnap);
  const [roleStr, storeIdStr] = userSnap ? userSnap.split("\x00") : ["", ""];
  const isManager = roleStr === "shop_manager";
  const myStoreId = storeIdStr ? Number(storeIdStr) : undefined;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => setCategories([]));
    unitsApi.getAll().then(setUnits).catch(() => setUnits([]));
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    productsApi.getAll({
      skip:     (page - 1) * PAGE_SIZE,
      limit:    PAGE_SIZE,
      search:   search || undefined,
      // Scope to manager's branch when available
      stock_id: isManager && myStoreId ? myStoreId : undefined,
    })
      .then(res => {
        if (!active) return;
        setProducts(res);
        setTotal((page - 1) * PAGE_SIZE + res.length + (res.length === PAGE_SIZE ? 1 : 0));
        setError("");
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setProducts([]); setTotal(0);
        setError(err instanceof Error ? err.message : "Failed to load products.");
        setLoading(false);
      });
    return () => { active = false; };
  }, [page, search, refreshKey, isManager, myStoreId]);

  // Trigger a reload from event handlers (save/delete) — setState is fine in handlers
  function loadProducts() { setLoading(true); setError(""); setRefreshKey(k => k + 1); }

  const prevSearch = useRef(search);
  useEffect(() => {
    if (prevSearch.current !== search) {
      setLoading(true);
      setPage(1);
      prevSearch.current = search;
    }
  }, [search]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  function handleSaved(wasEdit: boolean) {
    setAddOpen(false); setEditTarget(null);
    loadProducts();
    showToast(wasEdit ? "Product updated successfully" : "Product registered successfully");
  }

  function handleDeleted() {
    setDelTarget(null); loadProducts();
    showToast("Product removed from catalog");
  }

  function handleCategoryAdded(cat: Category) { setCategories(prev => [...prev, cat]); }
  function handleUnitAdded(u: Unit)           { setUnits(prev => [...prev, u]); }

  const rows = stockFilter
    ? products.filter(p => {
        const qty = p.initialQuantity ?? 0;
        if (stockFilter === "out_of_stock") return p.stock_status === "out_of_stock";
        if (stockFilter === "low")          return p.stock_status === "in_stock" && qty <= p.minimumQuantity;
        if (stockFilter === "in_stock")     return p.stock_status === "in_stock" && qty > p.minimumQuantity;
        return true;
      })
    : products;

  const inStockCount = products.filter(p => p.stock_status === "in_stock" && (p.initialQuantity ?? 0) > p.minimumQuantity).length;
  const lowCount     = products.filter(p => p.stock_status === "in_stock" && (p.initialQuantity ?? 0) <= p.minimumQuantity).length;
  const outCount     = products.filter(p => p.stock_status === "out_of_stock").length;

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

      {addOpen && (
        <ProductFormModal
          categories={categories} units={units}
          onClose={() => setAddOpen(false)}
          onSaved={handleSaved}
          onCategoryAdded={handleCategoryAdded}
          onUnitAdded={handleUnitAdded}
        />
      )}
      {editTarget && (
        <ProductFormModal
          initial={editTarget}
          categories={categories} units={units}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
          onCategoryAdded={handleCategoryAdded}
          onUnitAdded={handleUnitAdded}
        />
      )}
      {delTarget && (
        <DeleteModal product={delTarget} onClose={() => setDelTarget(null)} onDeleted={handleDeleted} />
      )}
      {viewTarget && (
        <ProductDetailPanel
          product={viewTarget} units={units}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
        />
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="font-semibold text-gray-700">{total} products</span> registered
          </p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-200">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* ── Stock summary cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "In Stock",    count: inStockCount, icon: PackageCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", filter: "in_stock"    as const },
          { label: "Low Stock",   count: lowCount,     icon: TrendingDown, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   filter: "low"         as const },
          { label: "Out of Stock",count: outCount,     icon: PackageX,     color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100",     filter: "out_of_stock" as const },
        ].map(({ label, count, icon: Icon, color, bg, border, filter }) => (
          <button key={label} type="button"
            onClick={() => setStockFilter(stockFilter === filter ? "" : filter)}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg} hover:opacity-90 transition-all text-left ${stockFilter === filter ? "ring-2 ring-offset-1 ring-violet-400" : ""}`}>
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
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by product name or SKU…" title="Search products"
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
            <X className="w-3.5 h-3.5" /> Clear filter
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60">
              {["Product", "Unit", "Category", "Purchase Price", "Selling Price", "In Stock", "Min Stock", "Stock Status", "Status", ""].map(h => (
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
                      {search ? `No results for "${search}"` : "Register your first product to get started"}
                    </p>
                    {!search && (
                      <button type="button" onClick={() => setAddOpen(true)}
                        className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Product
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map(product => {
                const qty   = product.initialQuantity ?? 0;
                const uName = getUnitName(product.quantityUnit, units);
                return (
                  <tr key={product.id} className="hover:bg-gray-50/60 transition-colors group">
                    {/* Product */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-violet-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{product.productName}</p>
                          {product.sku && <p className="text-[11px] font-mono text-gray-400">{product.sku}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3.5 text-xs text-gray-500 font-medium">{uName || "—"}</td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                        {product.category?.categoryName ?? `Category ${product.category_id}`}
                      </span>
                    </td>

                    {/* Purchase price */}
                    <td className="px-4 py-3.5 text-sm text-gray-500">{parsePrice(product.productPrice).toLocaleString()} RWF</td>

                    {/* Selling price */}
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{parsePrice(product.sellingPrice).toLocaleString()} RWF</td>

                    {/* Qty */}
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-bold ${
                        qty === 0                ? "text-red-600"   :
                        qty <= product.minimumQuantity ? "text-amber-600" : "text-gray-900"
                      }`}>{qty}</span>
                    </td>

                    {/* Min stock */}
                    <td className="px-4 py-3.5 text-sm text-gray-400">{product.minimumQuantity}</td>

                    {/* Stock status */}
                    <td className="px-4 py-3.5"><StockStatusBadge product={product} /></td>

                    {/* Status */}
                    <td className="px-4 py-3.5"><StatusBadge status={product.status} /></td>

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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" title="Previous page" onClick={() => { setLoading(true); setPage(p => Math.max(1, p - 1)); }} disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <button type="button" title="Next page" onClick={() => { setLoading(true); setPage(p => Math.min(totalPages, p + 1)); }} disabled={page === totalPages}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
