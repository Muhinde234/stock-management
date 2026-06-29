"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  UserCog, Plus, Pencil, Trash2, X, Check, Loader2,
  Mail, Building2, Search, AlertCircle,
  Eye, EyeOff,
} from "lucide-react";
import { shopManagersApi, type ShopManager, type ShopManagerCreate, type ShopManagerUpdate } from "@/lib/api/shop-managers";
import { shopsApi, type Shop, type ShopUpdate } from "@/lib/api/shops";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?";
}

// ── Searchable shop picker ────────────────────────────────────────────────────

function ShopPicker({
  shops,
  value,
  onChange,
}: {
  shops: Shop[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = shops.find(s => s.id === value);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = shops.filter(s => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return s.shopName.toLowerCase().includes(q) || String(s.id).includes(q);
  });

  function select(shop: Shop | null) {
    onChange(shop?.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer focus-within:ring-2 focus-within:ring-violet-500 bg-white"
      >
        {selected ? (
          <span className="flex items-center gap-2 text-gray-900">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {selected.shopName}
            <span className="text-gray-400 text-xs">#{selected.id}</span>
          </span>
        ) : (
          <span className="text-gray-400">— No shop assigned —</span>
        )}
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => select(null)}
              className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50"
            >
              — No shop assigned —
            </button>
            {filtered.length === 0 && (
              <p className="px-4 py-2 text-sm text-gray-400">No shops found.</p>
            )}
            {filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => select(s)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-violet-50 transition ${value === s.id ? "bg-violet-50 text-violet-700" : "text-gray-900"}`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {s.shopName}
                </span>
                <span className="text-xs text-gray-400">ID #{s.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────

function ManagerFormModal({
  initial, shops, onClose, onSaved,
}: { initial?: ShopManager; shops: Shop[]; onClose: () => void; onSaved: (m: ShopManager) => void }) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    email:     initial?.email     ?? "",
    password:  "",
    shop_id:   initial?.shop_id   as number | undefined,
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required.");    return; }
    if (!form.email.trim())    { setError("Email is required.");         return; }
    if (!initial && !form.password) { setError("Password is required."); return; }
    setSaving(true); setError("");
    try {
      // Step 1: create or update the user (PATCH /users/:id only accepts email & full_name)
      const saved = initial
        ? await shopManagersApi.update(initial.id, {
            full_name: form.full_name.trim(),
            email:     form.email.trim(),
          } as ShopManagerUpdate)
        : await shopManagersApi.create({
            full_name: form.full_name.trim(),
            email:     form.email.trim(),
            password:  form.password,
            role:      "manager",
            shop_id:   form.shop_id,
          } as ShopManagerCreate);

      // Step 2: assign manager to shop via the shops endpoint
      // (PATCH /users/:id ignores shop_id — assignment must go through the shop)
      if (form.shop_id !== undefined) {
        await shopsApi.update(form.shop_id, { manager_id: saved.id } as ShopUpdate);
      }

      onSaved({ ...saved, shop_id: form.shop_id });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save manager.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {initial ? "Edit Shop Manager" : "New Shop Manager"}
            </h2>
          </div>
          <button type="button" onClick={onClose} title="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              placeholder="Jean Dupont"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="manager@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Password — only for new accounts */}
          {!initial && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  title={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Shop picker */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Assigned Shop
            </label>
            <ShopPicker
              shops={shops}
              value={form.shop_id}
              onChange={v => set("shop_id", v)}
            />
            <p className="mt-1 text-[11px] text-gray-400">Search by shop name or ID</p>
          </div>

          {/* Role badge (read-only) */}
          <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg">
            <span className="text-xs text-blue-600 font-medium">Role will be set to:</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">manager</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? "Save Changes" : "Create Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  manager, onClose, onDeleted,
}: { manager: ShopManager; onClose: () => void; onDeleted: (id: number) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true); setError("");
    try {
      await shopManagersApi.delete(manager.id);
      onDeleted(manager.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete manager.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Remove Manager</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Remove <span className="font-semibold">{manager.full_name}</span>?
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ShopManagersPage() {
  const [managers, setManagers] = useState<ShopManager[]>([]);
  const [shops,    setShops]    = useState<Shop[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [filterShop, setFilterShop] = useState<number | "">("");
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<ShopManager | null>(null);
  const [deleting,   setDeleting]   = useState<ShopManager | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [mgrs, shs] = await Promise.all([shopManagersApi.getAll(), shopsApi.getAll()]);
      setManagers(Array.isArray(mgrs) ? mgrs : []);
      setShops(Array.isArray(shs) ? shs : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shopMap = Object.fromEntries(shops.map(s => [s.id, s.shopName]));

  const filtered = managers.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q);
    const matchShop = filterShop === "" || m.shop_id === filterShop;
    return matchSearch && matchShop;
  });

  function handleSaved(m: ShopManager) {
    setManagers(prev => prev.find(x => x.id === m.id) ? prev.map(x => x.id === m.id ? m : x) : [m, ...prev]);
    setShowForm(false); setEditing(null);
  }
  function handleDeleted(id: number) {
    setManagers(prev => prev.filter(m => m.id !== id));
    setDeleting(null);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Managers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all shop manager accounts</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 transition"
        >
          <Plus className="w-4 h-4" /> Add Manager
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Managers", value: managers.length,                             color: "bg-blue-50 text-blue-700"       },
          { label: "With Shop",      value: managers.filter(m => m.shop_id).length,      color: "bg-emerald-50 text-emerald-700" },
          { label: "Unassigned",     value: managers.filter(m => !m.shop_id).length,     color: "bg-amber-50 text-amber-700"     },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[220px]"
          />
        </div>
        <select
          title="Filter by shop"
          value={filterShop}
          onChange={e => setFilterShop(e.target.value === "" ? "" : Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All Shops</option>
          {shops.map(s => <option key={s.id} value={s.id}>{s.shopName} (#{s.id})</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Loading…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={load} className="text-sm text-violet-600 hover:underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <UserCog className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-500">
            {search || filterShop !== "" ? "No managers match your filters." : "No managers yet. Add your first manager."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Manager</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Shop</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th scope="col" className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {initials(m.full_name)}
                      </div>
                      <p className="font-medium text-gray-900">{m.full_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail className="w-3 h-3 text-gray-400" />{m.email}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {m.shop_id ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        <span>{m.shop?.shopName ?? shopMap[m.shop_id] ?? `Shop #${m.shop_id}`}</span>
                        <span className="text-gray-400">#{m.shop_id}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                      {m.role ?? "manager"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditing(m)}
                        title="Edit manager"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(m)}
                        title="Delete manager"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(showForm || editing) && (
        <ManagerFormModal
          initial={editing ?? undefined}
          shops={shops}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <DeleteConfirmModal
          manager={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
