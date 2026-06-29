"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2, Plus, Pencil, Trash2, X, Check, Loader2,
  Phone, Mail, MapPin, Search, AlertCircle,
} from "lucide-react";
import { shopsApi, type Shop, type ShopCreate } from "@/lib/api/shops";

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: Shop["status"]) {
  return status === "active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-gray-100 text-gray-500 border-gray-200";
}

const EMPTY_FORM: ShopCreate = { shopName: "", address: "", phone: "", email: "" };

// ── Sub-components ────────────────────────────────────────────────────────────

function ShopFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Shop;
  onClose: () => void;
  onSaved: (shop: Shop) => void;
}) {
  const [form, setForm] = useState<ShopCreate>(
    initial
      ? { shopName: initial.shopName, address: initial.address ?? "", phone: initial.phone ?? "", email: initial.email ?? "" }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof ShopCreate, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.shopName.trim()) { setError("Shop name is required."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, shopName: form.shopName.trim() };
      const saved = initial
        ? await shopsApi.update(initial.id, payload)
        : await shopsApi.create(payload);
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save shop.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {initial ? "Edit Shop" : "New Shop"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Shop Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.shopName}
              onChange={(e) => set("shopName", e.target.value)}
              placeholder="e.g. Kigali Central Branch"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</span>
            </label>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. KG 5 Ave, Kigali"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
              </label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+250 7XX XXX XXX"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="shop@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? "Save Changes" : "Create Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  shop,
  onClose,
  onDeleted,
}: {
  shop: Shop;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true); setError("");
    try {
      await shopsApi.delete(shop.id);
      onDeleted(shop.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete shop.");
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
            <h3 className="font-semibold text-gray-900">Delete Shop</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to delete <span className="font-semibold">{shop.shopName}</span>?
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);
  const [deleting, setDeleting] = useState<Shop | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await shopsApi.getAll();
      setShops(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load shops.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = shops.filter((s) =>
    !search.trim() ||
    s.shopName.toLowerCase().includes(search.toLowerCase()) ||
    (s.address ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleSaved(shop: Shop) {
    setShops((prev) => {
      const exists = prev.find((s) => s.id === shop.id);
      return exists ? prev.map((s) => (s.id === shop.id ? shop : s)) : [shop, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  }

  function handleDeleted(id: number) {
    setShops((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all registered shops</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 shadow-sm shadow-violet-200 transition"
        >
          <Plus className="w-4 h-4" /> Add Shop
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Shops", value: shops.length, color: "bg-violet-50 text-violet-700" },
          { label: "Active",  value: shops.filter((s) => s.status === "active").length,   color: "bg-emerald-50 text-emerald-700" },
          { label: "Inactive", value: shops.filter((s) => s.status !== "active").length,  color: "bg-gray-50 text-gray-600" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl p-4 ${card.color} border border-white`}>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shops…"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading shops…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={load} className="text-sm text-violet-600 hover:underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Building2 className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-500">
            {search ? "No shops match your search." : "No shops yet. Add your first shop."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{shop.shopName}</h3>
                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(shop.status)}`}>
                      {shop.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing(shop)}
                    title="Edit shop"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(shop)}
                    title="Delete shop"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card details */}
              <div className="space-y-1.5 text-xs text-gray-500">
                {shop.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                    <span className="truncate">{shop.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400">
                ID #{shop.id} · Created {new Date(shop.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {(showForm || editing) && (
        <ShopFormModal
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <DeleteConfirmModal
          shop={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
