"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Search, RefreshCw, Loader2,
  AlertCircle, CheckCircle2, X, UserCircle2,
  ChevronLeft, ChevronRight, Shield,
} from "lucide-react";
import { cashiersApi } from "@/lib/api";
import type { Cashier } from "@/lib/api";

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

function AddCashierModal({
  onClose, onSaved,
}: { onClose: () => void; onSaved: (c: Cashier) => void }) {
  const [username,  setUsername]  = useState("");
  const [fullName,  setFullName]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  async function handleSave() {
    if (!username.trim()) { setError("Username is required."); return; }
    setSaving(true);
    setError("");
    try {
      const c = await cashiersApi.create({ username: username.trim(), full_name: fullName.trim() || null });
      onSaved(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create cashier.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <UserCircle2 className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">New Cashier</h2>
          </div>
          <button type="button" title="Close" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Username *</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="e.g. john_doe"
              title="Username"
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm text-gray-800 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="e.g. John Doe"
              title="Full name"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm text-gray-800 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={!username.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [addOpen,  setAddOpen]  = useState(false);
  const [toast,    setToast]    = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await cashiersApi.getAll();
      setCashiers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = cashiers.filter(c =>
    (c.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSaved(c: Cashier) {
    setAddOpen(false);
    setCashiers(prev => [...prev, c]);
    showToast(`Cashier "${c.username}" created`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">
      {addOpen && <AddCashierModal onClose={() => setAddOpen(false)} onSaved={handleSaved} />}

      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Staff</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading ? "Loading…" : `${cashiers.length} cashier${cashiers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" title="Refresh" onClick={load}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-200">
              <Plus className="w-4 h-4" /> Add Cashier
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button type="button" onClick={load} className="ml-auto text-xs font-semibold underline underline-offset-2">Retry</button>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or username…"
            title="Search staff"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
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
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto" />
                <div className="h-4 w-24 bg-gray-100 rounded mx-auto" />
                <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-100">
            <Users className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">
              {search ? `No staff matching "${search}"` : "No cashiers yet"}
            </p>
            {!search && (
              <button type="button" onClick={() => setAddOpen(true)}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add First Cashier
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paged.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-violet-100 border-2 border-violet-200 flex items-center justify-center">
                  <span className="text-lg font-bold text-violet-700">
                    {(c.full_name ?? c.username).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{c.full_name ?? c.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">@{c.username}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100">
                  <Shield className="w-3 h-3 text-violet-500" />
                  <span className="text-[11px] font-semibold text-violet-600">Cashier</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Joined {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
