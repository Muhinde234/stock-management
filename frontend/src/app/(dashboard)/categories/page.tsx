"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tag, Plus, Search, Package, Loader2,
  AlertCircle, CheckCircle2, X, Pencil, Trash2,
  ChevronLeft, ChevronRight, Layers,
} from "lucide-react";
import { categoriesApi, productsApi } from "@/lib/api";
import type { Category, Product } from "@/lib/api";

const PAGE_SIZE = 12;

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ cat, onClose, onSaved }: {
  cat:     Category;
  onClose: () => void;
  onSaved: (c: Category) => void;
}) {
  const [name,   setName]   = useState(cat.categoryName);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = await categoriesApi.update(cat.id, name.trim());
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update category.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Edit Category</h2>
          </div>
          <button type="button" title="Close" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={name} onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Beverages"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ cat, productCount, onClose, onDeleted }: {
  cat:          Category;
  productCount: number;
  onClose:      () => void;
  onDeleted:    (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function del() {
    setDeleting(true); setError("");
    try { await categoriesApi.delete(cat.id); onDeleted(cat.id); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to delete."); setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center">Delete Category?</h2>
        <p className="text-sm text-gray-500 text-center mt-2">
          Delete <span className="font-semibold text-gray-800">{cat.categoryName}</span>?
          {productCount > 0 && (
            <span className="block mt-1 text-amber-600 font-medium">
              ⚠ {productCount} product{productCount !== 1 ? "s" : ""} use this category.
            </span>
          )}
        </p>
        {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={del} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold flex items-center justify-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [toast,      setToast]      = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [adding,    setAdding]    = useState(false);
  const [newName,   setNewName]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  const [editing,  setEditing]  = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(() => {
    setLoading(true); setError("");
    Promise.all([
      categoriesApi.getAll(),
      productsApi.getAll({ limit: 500 }),
    ]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
    }).catch(e => {
      setError(e instanceof Error ? e.message : "Failed to load categories.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true); setSaveError("");
    try {
      const cat = await categoriesApi.create(newName.trim());
      setCategories(prev => [...prev, cat]);
      setNewName(""); setAdding(false);
      showToast(`Category "${cat.categoryName}" added`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to add category.");
    } finally { setSaving(false); }
  }

  function onEdited(updated: Category) {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditing(null);
    showToast(`Category renamed to "${updated.categoryName}"`);
  }

  function onDeleted(id: number) {
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
    showToast("Category deleted");
  }

  const countMap: Record<number, number> = {};
  products.forEach(p => { countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1; });

  const filtered   = categories.filter(c => c.categoryName.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">

      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? "Loading…" : `${categories.length} categories · ${products.length} products`}
            </p>
          </div>
          <button type="button" onClick={() => { setAdding(true); setSaveError(""); setNewName(""); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-200">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline underline-offset-2">Retry</button>
          </div>
        )}

        {/* Add form */}
        {adding && (
          <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-900 mb-3">New Category</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text" value={newName} autoFocus
                  onChange={e => { setNewName(e.target.value); setSaveError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  placeholder="Category name…"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm text-gray-800 outline-none transition-all"
                />
                {saveError && <p className="text-xs text-red-600 mt-1.5">{saveError}</p>}
              </div>
              <button type="button" onClick={handleAdd} disabled={!newName.trim() || saving}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => { setAdding(false); setNewName(""); setSaveError(""); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search categories…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
          />
          {search && (
            <button type="button" title="Clear search" onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-300 bg-white rounded-2xl border border-gray-100">
            <Layers className="w-12 h-12" />
            <p className="text-sm font-semibold text-gray-400">
              {search ? `No categories matching "${search}"` : "No categories yet"}
            </p>
            {!search && (
              <button type="button" onClick={() => setAdding(true)}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add First Category
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paged.map(cat => {
              const count = countMap[cat.id] ?? 0;
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-violet-600" />
                    </div>
                    {/* Action buttons — visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" title="Edit" onClick={() => setEditing(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Delete" onClick={() => setDeleting(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{cat.categoryName}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Package className="w-3 h-3" />
                    {count} product{count !== 1 ? "s" : ""}
                  </div>
                  {cat.created_at && (
                    <p className="text-[11px] text-gray-300 mt-2">
                      {new Date(cat.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-semibold text-gray-600">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button type="button" title="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-600 px-2">Page {page} / {totalPages}</span>
              <button type="button" title="Next page" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editing  && <EditModal   cat={editing}  onClose={() => setEditing(null)}  onSaved={onEdited} />}
      {deleting && <DeleteModal cat={deleting} productCount={countMap[deleting.id] ?? 0} onClose={() => setDeleting(null)} onDeleted={onDeleted} />}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
