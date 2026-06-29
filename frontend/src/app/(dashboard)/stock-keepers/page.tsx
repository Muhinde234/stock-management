"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Plus, Pencil, Trash2, X, Check, Loader2,
  Phone, Mail, Search, AlertCircle, Store,
  Eye, EyeOff, ChevronDown, CheckCircle2, ShoppingCart, Package,
} from "lucide-react";
import { stockKeepersApi, type StockKeeper, type StockKeeperCreate, type StockKeeperUpdate } from "@/lib/api/stock-keepers";
import { ApiError } from "@/lib/api";
import { storesApi, type Store as StoreType } from "@/lib/api/stores";
import { getCurrentUser } from "@/lib/auth";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_CFG = {
  stock_keeper: { label: "Stock Keeper", icon: Package,       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cashier:      { label: "Cashier",      icon: ShoppingCart,  color: "bg-blue-50 text-blue-700 border-blue-200"         },
} as const;

type KeeperRole = keyof typeof ROLE_CFG;

function statusBadge(s: StockKeeper["status"]) {
  return s === "active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-gray-100 text-gray-500 border-gray-200";
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold bg-emerald-600 text-white">
      <CheckCircle2 className="w-4 h-4" />{message}
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────

function KeeperFormModal({
  initial, stores, onClose, onSaved,
}: {
  initial?: StockKeeper;
  stores:   StoreType[];
  onClose:  () => void;
  onSaved:  (k: StockKeeper) => void;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    email:     initial?.email     ?? "",
    phone:     initial?.phone     ?? "",
    password:  "",
    role:      ((initial?.role as KeeperRole) ?? "stock_keeper") as KeeperRole,
    store_id:  (initial?.store_id ?? initial?.stock_id) as number | undefined,
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim())     { setError("Email is required.");     return; }
    if (!initial && !form.password) { setError("Password is required."); return; }
    setSaving(true); setError("");
    try {
      const saved = initial
        ? await stockKeepersApi.update(initial.id, {
            full_name: form.full_name.trim(),
            email:     form.email.trim(),
            phone:     form.phone || undefined,
          } as StockKeeperUpdate)
        : await stockKeepersApi.create({
            full_name: form.full_name.trim(),
            email:     form.email.trim(),
            password:  form.password,
            role:      form.role,
            phone:     form.phone || undefined,
          } as StockKeeperCreate);

      // Also write the assignment onto the branch record
      if (form.store_id !== undefined) {
        await storesApi.update(form.store_id, { stock_keeper_id: saved.id });
      }

      onSaved({ ...saved, store_id: form.store_id });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setError("An account with this email already exists. Please use a different email address.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("You don't have permission to create users. Contact your administrator.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {initial ? "Edit Staff Member" : "Add Staff Member"}
            </h2>
          </div>
          <button type="button" onClick={onClose} title="Close"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Role <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_CFG) as KeeperRole[]).map(r => {
                const { label, icon: Icon } = ROLE_CFG[r];
                const active = form.role === r;
                return (
                  <button key={r} type="button" onClick={() => set("role", r)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                      active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}>
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-emerald-600" : "text-gray-400"}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input value={form.full_name} onChange={e => set("full_name", e.target.value)}
              placeholder="e.g. Jean Dupont"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email <span className="text-red-500">*</span>
            </label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="staff@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              placeholder="+250 700 000 000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Password — new only */}
          {!initial && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password}
                  onChange={e => set("password", e.target.value)} placeholder="Min 8 characters"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={() => setShowPw(v => !v)} title={showPw ? "Hide" : "Show"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Branch */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <Store className="w-3 h-3" /> Assign to Branch
            </label>
            {stores.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                No branches found. Create a branch first from the Stores page.
              </p>
            ) : (
              <div className="relative">
                <select title="Assigned branch" value={form.store_id ?? ""}
                  onChange={e => set("store_id", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-8 bg-white">
                  <option value="">— No branch assigned —</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ keeper, onClose, onDeleted }: {
  keeper:    StockKeeper;
  onClose:   () => void;
  onDeleted: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function del() {
    setDeleting(true); setError("");
    try { await stockKeepersApi.delete(keeper.id); onDeleted(keeper.id); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed."); setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Deactivate Staff</h3>
            <p className="text-sm text-gray-500">The account will be disabled.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Deactivate <span className="font-semibold">{keeper.full_name ?? keeper.email ?? "this user"}</span>?
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={del} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-60">
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {deleting ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StockKeepersPage() {
  const [keepers,     setKeepers]     = useState<StockKeeper[]>([]);
  const [stores,      setStores]      = useState<StoreType[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [filterStore, setFilterStore] = useState<number | "">("");
  const [filterRole,  setFilterRole]  = useState<KeeperRole | "">("");
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState<StockKeeper | null>(null);
  const [deleting,    setDeleting]    = useState<StockKeeper | null>(null);
  const [toast,       setToast]       = useState("");

  // Read current user only after mount (localStorage is client-only — avoids hydration mismatch)
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  useEffect(() => { setCurrentUser(getCurrentUser()); }, []);

  const isManager = currentUser?.role === "shop_manager";
  const myShopId  = currentUser?.shop_id;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(() => {
    setLoading(true); setError("");
    Promise.all([
      stockKeepersApi.getAll(),
      isManager && myShopId
        ? storesApi.getAll({ shop_id: myShopId })
        : storesApi.getAll(),
    ]).then(([ks, ss]) => {
      setKeepers(Array.isArray(ks) ? ks : []);
      setStores(Array.isArray(ss) ? ss : []);
    }).catch(err => {
      setError(err instanceof Error ? err.message : "Failed to load.");
    }).finally(() => setLoading(false));
  }, [isManager, myShopId]);

  useEffect(() => { load(); }, [load]);

  // Client-side fallback: filter keepers to manager's branches
  const myStoreIds = new Set(stores.map(s => s.id));

  const filtered = keepers.filter(k => {
    if (isManager && myShopId) {
      const kStoreId = k.store_id ?? k.stock_id;
      if (kStoreId !== undefined && !myStoreIds.has(kStoreId)) return false;
      // also filter by shop_id if present on the keeper object
      if (k.shop_id !== undefined && k.shop_id !== myShopId) return false;
    }
    const q = search.toLowerCase();
    const matchQ = !q
      || (k.full_name ?? "").toLowerCase().includes(q)
      || (k.email ?? "").toLowerCase().includes(q);
    const kStoreId = k.store_id ?? k.stock_id;
    const matchS = filterStore === "" || Number(kStoreId) === Number(filterStore);
    const matchR = filterRole  === "" || k.role === filterRole;
    return matchQ && matchS && matchR;
  });

  const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));

  function onSaved(k: StockKeeper) {
    setKeepers(prev =>
      prev.find(x => Number(x.id) === Number(k.id))
        ? prev.map(x => Number(x.id) === Number(k.id) ? k : x)
        : [k, ...prev]
    );
    setShowForm(false); setEditing(null);
    showToast(editing ? "Staff updated" : "Staff member added");
  }

  function onDeleted(id: number) {
    setKeepers(prev => prev.filter(k => Number(k.id) !== Number(id)));
    setDeleting(null);
    showToast("Staff deactivated");
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isManager ? "My Staff" : "Stock Keepers & Cashiers"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isManager ? "Staff assigned to your branches" : "Manage all branch staff"}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",        value: filtered.length,                                                                     color: "bg-gray-50 text-gray-700"           },
          { label: "Stock Keeper", value: filtered.filter(k => k.role === "stock_keeper" || !k.role).length,                   color: "bg-emerald-50 text-emerald-700"     },
          { label: "Cashier",      value: filtered.filter(k => k.role === "cashier").length,                                   color: "bg-blue-50 text-blue-700"           },
          { label: "Unassigned",   value: filtered.filter(k => !k.store_id && !k.stock_id).length,                             color: "bg-amber-50 text-amber-700"         },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]" />
        </div>

        {stores.length > 0 && (
          <div className="relative">
            <select title="Filter by branch" value={filterStore}
              onChange={e => setFilterStore(e.target.value === "" ? "" : Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">All Branches</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        )}

        <div className="relative">
          <select title="Filter by role" value={filterRole}
            onChange={e => setFilterRole(e.target.value as KeeperRole | "")}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
            <option value="">All Roles</option>
            <option value="stock_keeper">Stock Keeper</option>
            <option value="cashier">Cashier</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {(search || filterStore !== "" || filterRole !== "") && (
          <button type="button" onClick={() => { setSearch(""); setFilterStore(""); setFilterRole(""); }}
            className="px-3 py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-gray-100">
          <Users className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-500">
            {search || filterStore !== "" || filterRole !== "" ? "No staff match your filters." : "No staff added yet."}
          </p>
          {!search && filterStore === "" && filterRole === "" && (
            <button type="button" onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition">
              <Plus className="w-3.5 h-3.5" /> Add First Staff Member
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th scope="col" className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(k => {
                const role    = (k.role as KeeperRole) ?? "stock_keeper";
                const roleCfg = ROLE_CFG[role] ?? ROLE_CFG.stock_keeper;
                const RoleIcon = roleCfg.icon;
                const kStoreId = k.store_id ?? k.stock_id;
                return (
                  <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                          {initials(k.full_name)}
                        </div>
                        <p className="font-medium text-gray-900">{k.full_name ?? "—"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        {k.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail  className="w-3 h-3 text-gray-400" />{k.email}</p>}
                        {k.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{k.phone}</p>}
                        {!k.email && !k.phone && <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleCfg.color}`}>
                        <RoleIcon className="w-2.5 h-2.5" />{roleCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {kStoreId ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-700">
                          <Store className="w-3 h-3 text-gray-400" />
                          {k.store?.name ?? storeMap[kStoreId] ?? `Branch #${kStoreId}`}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(k.status)}`}>
                        {k.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button type="button" onClick={() => setEditing(k)} title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleting(k)} title="Deactivate"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(showForm || editing) && (
        <KeeperFormModal
          initial={editing ?? undefined}
          stores={stores}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
      {deleting && (
        <DeleteModal keeper={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}
