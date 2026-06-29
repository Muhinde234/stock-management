"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Store, Plus, Pencil, Trash2, X, Check, Loader2,
  Search, AlertCircle, Building2, Users,
} from "lucide-react";
import { storesApi, type Store as StoreType, type StoreCreate } from "@/lib/api/stores";
import { shopsApi, type Shop } from "@/lib/api/shops";
import { getCurrentUser } from "@/lib/auth";

// ── Form Modal ─────────────────────────────────────────────────────────────────

function StoreFormModal({
  initial, shops, lockedShopId, onClose, onSaved,
}: {
  initial?:       StoreType;
  shops:          Shop[];
  lockedShopId?:  number;   // when set, shop selector is hidden and this is used
  onClose:        () => void;
  onSaved:        (s: StoreType) => void;
}) {
  const [name,   setName]   = useState(initial?.name ?? "");
  const [shopId, setShopId] = useState<number | "">(lockedShopId ?? initial?.shop_id ?? "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Branch name is required."); return; }
    if (!shopId)      { setError("Please select a shop."); return; }
    setSaving(true); setError("");
    try {
      const payload: StoreCreate = { name: name.trim(), shop_id: shopId as number };
      const saved = initial
        ? await storesApi.update(initial.id, { name: name.trim() })
        : await storesApi.create(payload);
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save branch.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{initial ? "Edit Branch" : "New Branch"}</h2>
          </div>
          <button onClick={onClose} title="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
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
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Main Branch, Warehouse A"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Shop selector: hidden for managers (shop is locked to their own) */}
          {!lockedShopId && !initial && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Shop <span className="text-red-500">*</span>
              </label>
              <select
                value={shopId}
                onChange={e => setShopId(e.target.value ? Number(e.target.value) : "")}
                title="Select shop"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">Select a shop…</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.shopName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? "Save Changes" : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ store, onClose, onDeleted }: {
  store:     StoreType;
  onClose:   () => void;
  onDeleted: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function del() {
    setDeleting(true);
    try { await storesApi.delete(store.id); onDeleted(store.id); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to delete."); setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Delete Branch</h3>
            <p className="text-sm text-gray-500">Cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-4">Delete <span className="font-semibold">{store.name}</span>?</p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={del} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60">
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StoresPage() {
  const [stores,   setStores]   = useState<StoreType[]>([]);
  const [shops,    setShops]    = useState<Shop[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<StoreType | null>(null);
  const [deleting, setDeleting] = useState<StoreType | null>(null);

  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  useEffect(() => { setCurrentUser(getCurrentUser()); }, []);

  const isManager = currentUser?.role === "shop_manager";
  const myShopId  = currentUser?.shop_id;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (isManager && myShopId) {
        // Manager: only their own shop's branches — no need to fetch all shops
        const storeList = await storesApi.getAll({ shop_id: myShopId });
        setStores(Array.isArray(storeList) ? storeList : []);
        setShops([]); // not needed — manager's shop is locked
      } else {
        const [storeList, shopList] = await Promise.all([
          storesApi.getAll(),
          shopsApi.getAll(),
        ]);
        setStores(Array.isArray(storeList) ? storeList : []);
        setShops(Array.isArray(shopList) ? shopList : []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load branches.");
    } finally { setLoading(false); }
  }, [isManager, myShopId]);

  useEffect(() => { load(); }, [load]);

  const filtered = stores.filter(s =>
    !search.trim() || s.name.toLowerCase().includes(search.toLowerCase())
  );

  function onSaved(s: StoreType) {
    setStores(prev => prev.find(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev]);
    setShowForm(false); setEditing(null);
  }
  function onDeleted(id: number) { setStores(prev => prev.filter(s => s.id !== id)); setDeleting(null); }

  function shopName(store: StoreType) {
    if (store.shop?.shopName) return store.shop.shopName;
    return shops.find(s => s.id === store.shop_id)?.shopName ?? `Shop #${store.shop_id}`;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isManager ? "My Branches" : "Branches"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isManager ? "Branches under your shop" : "Manage your stock locations"}
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 transition">
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Total Branches", value: stores.length, color: "bg-blue-50 text-blue-700" },
          isManager
            ? { label: "Your Shop",  value: `#${myShopId ?? "—"}`, color: "bg-violet-50 text-violet-700" }
            : { label: "Shops",      value: shops.length,            color: "bg-violet-50 text-violet-700" },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search branches…"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>

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
          <Store className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-500">{search ? "No branches match your search." : "No branches yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(store => (
            <div key={store.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{store.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">ID #{store.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setEditing(store)} title="Edit"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setDeleting(store)} title="Delete"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {!isManager && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Building2 className="w-3 h-3 shrink-0 text-gray-400" />
                    {shopName(store)}
                  </div>
                )}
                {(store.stock_keeper_id || store.cashier_id) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users className="w-3 h-3 shrink-0" />
                    {[
                      store.stock_keeper_id ? `Keeper #${store.stock_keeper_id}` : null,
                      store.cashier_id      ? `Cashier #${store.cashier_id}` : null,
                    ].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                Created {new Date(store.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editing) && (
        <StoreFormModal
          initial={editing ?? undefined}
          shops={shops}
          lockedShopId={isManager ? myShopId : undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
      {deleting && (
        <DeleteModal store={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} />
      )}
    </div>
  );
}
