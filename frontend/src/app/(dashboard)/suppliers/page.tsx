"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck, Plus, Search, Mail, Phone, MapPin, Hash,
  Pencil, Trash2, X, Check, Loader2, AlertCircle,
  CheckCircle2, ShoppingBag, DollarSign,
} from "lucide-react";
import { suppliersApi, type Supplier, type SupplierPayload } from "@/lib/api/suppliers";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?";
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────

function SupplierFormModal({ initial, onClose, onSaved }: {
  initial?:  Supplier;
  onClose:   () => void;
  onSaved:   (s: Supplier) => void;
}) {
  const [form, setForm] = useState<SupplierPayload>({
    name:      initial?.name      ?? "",
    email:     initial?.email     ?? "",
    phone:     initial?.phone     ?? "",
    address:   initial?.address   ?? "",
    taxNumber: initial?.taxNumber ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set<K extends keyof SupplierPayload>(k: K, v: SupplierPayload[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Supplier name is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = initial
        ? await suppliersApi.update(initial.id, form)
        : await suppliersApi.create(form);
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save supplier.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{initial ? "Edit Supplier" : "New Supplier"}</h2>
          </div>
          <button type="button" title="Close" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {[
            { key: "name" as const,      label: "Company / Supplier Name *", placeholder: "e.g. ABC Distributors", icon: Truck,  title: "Supplier name"   },
            { key: "email" as const,     label: "Email",                      placeholder: "supplier@example.com",  icon: Mail,   title: "Email address"   },
            { key: "phone" as const,     label: "Phone",                      placeholder: "+250 700 000 000",      icon: Phone,  title: "Phone number"    },
            { key: "address" as const,   label: "Address",                    placeholder: "Kigali, Rwanda",        icon: MapPin, title: "Physical address" },
            { key: "taxNumber" as const, label: "Tax / TIN Number",           placeholder: "000 000 000",           icon: Hash,   title: "Tax number"      },
          ].map(({ key, label, placeholder, icon: Icon, title }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
              </label>
              <input
                title={title}
                value={form[key] ?? ""}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ supplier, onClose, onDeleted }: {
  supplier:  Supplier;
  onClose:   () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function del() {
    setDeleting(true); setError("");
    try { await suppliersApi.delete(supplier.id); onDeleted(supplier.id); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed."); setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center">Delete Supplier?</h2>
        <p className="text-sm text-gray-500 text-center mt-2">
          Remove <span className="font-semibold text-gray-800">{supplier.name}</span> permanently?
        </p>
        {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={del} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold flex items-center justify-center gap-2">
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [toast,     setToast]     = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(() => {
    setLoading(true); setError("");
    suppliersApi.getAll({ page, limit: LIMIT, search: search || undefined })
      .then(res => {
        setSuppliers(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load suppliers."))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  function onSaved(s: Supplier) {
    setSuppliers(prev => prev.find(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev]);
    setShowForm(false); setEditing(null);
    showToast(editing ? "Supplier updated" : "Supplier added");
  }

  function onDeleted(id: string) {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
    showToast("Supplier deleted");
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} suppliers registered</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 shadow-sm transition">
          <Plus className="w-4 h-4" /> New Supplier
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input type="text" title="Search suppliers" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search suppliers…"
          className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
        {search && (
          <button type="button" title="Clear search" onClick={() => { setSearch(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Paid</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th scope="col" className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className={`h-4 bg-gray-100 rounded animate-pulse ${j === 0 ? "w-36" : "w-20"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-20 text-center">
                  <Truck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">{search ? `No suppliers matching "${search}"` : "No suppliers yet."}</p>
                  {!search && (
                    <button type="button" onClick={() => setShowForm(true)}
                      className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 mx-auto transition">
                      <Plus className="w-3.5 h-3.5" /> Add Supplier
                    </button>
                  )}
                </td>
              </tr>
            ) : suppliers.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                      {initials(s.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      {s.taxNumber && <p className="text-[11px] text-gray-400 flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{s.taxNumber}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="space-y-0.5">
                    {s.email   && <p className="flex items-center gap-1.5 text-xs text-gray-600"><Mail   className="w-3 h-3 text-gray-400" />{s.email}</p>}
                    {s.phone   && <p className="flex items-center gap-1.5 text-xs text-gray-600"><Phone  className="w-3 h-3 text-gray-400" />{s.phone}</p>}
                    {s.address && <p className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="w-3 h-3 text-gray-400" />{s.address}</p>}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <p className="flex items-center gap-1 text-sm text-gray-700">
                    <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />{s.totalOrders ?? 0}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="flex items-center gap-1 text-sm font-bold text-gray-900">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />{(s.totalPaid ?? 0).toLocaleString()}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    s.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>{s.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button type="button" title="Edit supplier" onClick={() => setEditing(s)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" title="Delete supplier" onClick={() => setDeleting(s)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" title="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-500 px-2">Page {page} of {totalPages}</span>
          <button type="button" title="Next page" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Modals */}
      {(showForm || editing) && (
        <SupplierFormModal
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
      {deleting && <DeleteModal supplier={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
