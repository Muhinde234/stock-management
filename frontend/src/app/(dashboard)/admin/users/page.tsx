"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Users, Plus, Pencil, Trash2, X, Check, Loader2,
  Mail, Building2, Store, Search, AlertCircle, Eye, EyeOff,
  ChevronDown, Shield, UserCog, ShoppingCart, Package,
} from "lucide-react";
import { usersApi, type AppUser, type UserCreate, type UserUpdate, type AppRole } from "@/lib/api/users";
import { shopsApi, type Shop } from "@/lib/api/shops";
import { storesApi, type Store as StoreType } from "@/lib/api/stores";

// ── Role config ───────────────────────────────────────────────────────────────

const ROLE_CFG: Record<AppRole, { label: string; color: string; icon: React.ElementType }> = {
  admin:        { label: "Admin",        color: "bg-purple-100 text-purple-700 border-purple-200", icon: Shield      },
  manager:      { label: "Shop Manager", color: "bg-blue-100 text-blue-700 border-blue-200",       icon: UserCog     },
  cashier:      { label: "Cashier",      color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: ShoppingCart },
  stock_keeper: { label: "Stock Keeper", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Package     },
};

const ALL_ROLES: AppRole[] = ["admin", "manager", "cashier", "stock_keeper"];

function RoleBadge({ role }: { role: AppRole }) {
  const cfg = ROLE_CFG[role] ?? ROLE_CFG.cashier;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?";
}

function avatarColor(role: AppRole): string {
  const map: Record<AppRole, string> = {
    admin:        "bg-purple-100 text-purple-700",
    manager:      "bg-blue-100 text-blue-700",
    cashier:      "bg-emerald-100 text-emerald-700",
    stock_keeper: "bg-orange-100 text-orange-700",
  };
  return map[role] ?? "bg-gray-100 text-gray-600";
}

// ── Searchable shop picker ────────────────────────────────────────────────────

function ShopPicker({ shops, value, onChange }: {
  shops: Shop[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = shops.find(s => s.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = shops.filter(s =>
    !query.trim() || s.shopName.toLowerCase().includes(query.toLowerCase()) || String(s.id).includes(query)
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        {selected ? (
          <span className="flex items-center gap-2 text-gray-900">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {selected.shopName} <span className="text-gray-400 text-xs">#{selected.id}</span>
          </span>
        ) : (
          <span className="text-gray-400">— No shop assigned —</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or ID…"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="max-h-44 overflow-y-auto">
            <button type="button" onClick={() => { onChange(undefined); setOpen(false); setQuery(""); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50">
              — No shop assigned —
            </button>
            {filtered.map(s => (
              <button key={s.id} type="button"
                onClick={() => { onChange(s.id); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-violet-50 ${value === s.id ? "bg-violet-50 text-violet-700" : "text-gray-900"}`}>
                <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-gray-400" />{s.shopName}</span>
                <span className="text-xs text-gray-400">#{s.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Store picker ──────────────────────────────────────────────────────────────

function StorePicker({ stores, value, onChange }: {
  stores: StoreType[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
}) {
  return (
    <div className="relative">
      <select
        title="Assigned store"
        value={value ?? ""}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8"
      >
        <option value="">— No store assigned —</option>
        {stores.map(s => <option key={s.id} value={s.id}>{s.name} #{s.id}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ── User Form Modal ───────────────────────────────────────────────────────────

function UserFormModal({ initial, shops, stores, onClose, onSaved }: {
  initial?: AppUser;
  shops: Shop[];
  stores: StoreType[];
  onClose: () => void;
  onSaved: (u: AppUser) => void;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    email:     initial?.email     ?? "",
    password:  "",
    role:      (initial?.role ?? "cashier") as AppRole,
    shop_id:   initial?.shop_id  as number | undefined,
    stock_id:  initial?.stock_id as number | undefined,
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
    if (!initial && !form.password) { setError("Password is required for new accounts."); return; }
    setSaving(true); setError("");
    try {
      const saved = initial
        ? await usersApi.update(initial.id, {
            full_name: form.full_name.trim(),
            email:     form.email.trim(),
            role:      form.role,
          } as UserUpdate)
        : await usersApi.create({
            full_name: form.full_name.trim(),
            email:     form.email.trim(),
            password:  form.password,
            role:      form.role,
            shop_id:   form.shop_id,
            stock_id:  form.stock_id,
          } as UserCreate);

      // PATCH /users does not accept shop/stock assignment —
      // assignment must go through the branch or shop endpoint.
      if (form.role === "stock_keeper" && form.stock_id !== undefined) {
        await storesApi.update(form.stock_id, { stock_keeper_id: saved.id });
      }
      if (form.role === "manager" && form.shop_id !== undefined) {
        await shopsApi.update(form.shop_id, { manager_id: saved.id });
      }

      onSaved({ ...saved, shop_id: form.shop_id, stock_id: form.stock_id });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user.");
    } finally { setSaving(false); }
  }

  const needsShop  = form.role === "manager";
  const needsStore = form.role === "stock_keeper";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {initial ? "Edit User" : "New User"}
            </h2>
          </div>
          <button type="button" onClick={onClose} title="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Role selector — shown first so other fields adapt */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map(r => {
                const cfg = ROLE_CFG[r];
                const Icon = cfg.icon;
                const active = form.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set("role", r)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-left text-sm font-medium transition ${
                      active ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-violet-600" : "text-gray-400"}`} />
                    {cfg.label}
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
            <input
              value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              placeholder="e.g. Jean Dupont"
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
              placeholder="user@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Password — new accounts only */}
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
                  title={showPw ? "Hide" : "Show"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Shop picker — manager only */}
          {needsShop && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Assigned Shop
              </label>
              <ShopPicker shops={shops} value={form.shop_id} onChange={v => set("shop_id", v)} />
            </div>
          )}

          {/* Store picker — stock_keeper only */}
          {needsStore && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Store className="w-3 h-3" /> Assigned Branch
              </label>
              <StorePicker stores={stores} value={form.stock_id} onChange={v => set("stock_id", v)} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: {
  user: AppUser;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function del() {
    setDeleting(true); setError("");
    try { await usersApi.delete(user.id); onDeleted(user.id); }
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
            <h3 className="font-semibold text-gray-900">Deactivate User</h3>
            <p className="text-sm text-gray-500">The account will be disabled.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Deactivate <span className="font-semibold">{user.full_name ?? user.email}</span>?
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={del} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-60">
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState<AppUser[]>([]);
  const [shops,    setShops]    = useState<Shop[]>([]);
  const [stores,   setStores]   = useState<StoreType[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "">("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState<AppUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [us, sh, st] = await Promise.all([
        usersApi.getAll(),
        shopsApi.getAll(),
        storesApi.getAll(),
      ]);
      setUsers(Array.isArray(us) ? us : []);
      setShops(Array.isArray(sh) ? sh : []);
      setStores(Array.isArray(st) ? st : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shopMap  = Object.fromEntries(shops.map(s => [s.id, s.shopName]));
  const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchQ && matchRole;
  });

  // Counts per role
  const counts = Object.fromEntries(
    ALL_ROLES.map(r => [r, users.filter(u => u.role === r).length])
  ) as Record<AppRole, number>;

  function onSaved(u: AppUser) {
    setUsers(prev => prev.find(x => Number(x.id) === Number(u.id)) ? prev.map(x => Number(x.id) === Number(u.id) ? u : x) : [u, ...prev]);
    setShowForm(false); setEditing(null);
  }
  function onDeleted(id: number) {
    // Backend soft-deletes (deactivates) — just hide from list locally
    setUsers(prev => prev.filter(u => Number(u.id) !== Number(id)));
    setDeleting(null);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all system users and their roles</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 shadow-sm shadow-violet-200 transition"
        >
          <Plus className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ALL_ROLES.map(r => {
          const cfg = ROLE_CFG[r];
          const Icon = cfg.icon;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(prev => prev === r ? "" : r)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition ${
                roleFilter === r ? "border-violet-500 bg-violet-50" : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${roleFilter === r ? "bg-violet-100" : "bg-gray-100"}`}>
                <Icon className={`w-4 h-4 ${roleFilter === r ? "text-violet-600" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{counts[r]}</p>
                <p className="text-[11px] text-gray-500">{cfg.label}s</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[220px]"
          />
        </div>
        {roleFilter && (
          <button
            type="button"
            onClick={() => setRoleFilter("")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-100 text-violet-700 text-sm font-medium hover:bg-violet-200"
          >
            {ROLE_CFG[roleFilter].label} <X className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} of {users.length} users
        </span>
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
          <Users className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-500">
            {search || roleFilter ? "No users match your filters." : "No users yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment</th>
                <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th scope="col" className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Name + avatar */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(u.role)}`}>
                        {initials(u.full_name)}
                      </div>
                      <p className="font-medium text-gray-900">{u.full_name ?? "—"}</p>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />{u.email}
                    </span>
                  </td>
                  {/* Role badge */}
                  <td className="px-5 py-3.5">
                    <RoleBadge role={u.role} />
                  </td>
                  {/* Assignment (shop or store) */}
                  <td className="px-5 py-3.5">
                    {u.role === "manager" && u.shop_id ? (
                      <span className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {u.shop?.shopName ?? shopMap[u.shop_id] ?? `Shop #${u.shop_id}`}
                      </span>
                    ) : u.role === "stock_keeper" && u.stock_id ? (
                      <span className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Store className="w-3 h-3 text-gray-400" />
                        {u.stock?.name ?? storeMap[u.stock_id] ?? `Branch #${u.stock_id}`}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  {/* Date */}
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button type="button" onClick={() => setEditing(u)} title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setDeleting(u)} title="Deactivate"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition">
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
        <UserFormModal
          initial={editing ?? undefined}
          shops={shops}
          stores={stores}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
      {deleting && (
        <DeleteModal user={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} />
      )}
    </div>
  );
}
