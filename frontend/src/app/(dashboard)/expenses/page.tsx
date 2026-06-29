"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt, Plus, Search, Tag, Calendar, StickyNote,
  Pencil, Trash2, X, Check, Loader2, AlertCircle,
  CheckCircle2, Banknote, CreditCard, Smartphone, Filter,
} from "lucide-react";
import { expensesApi, type Expense, type ExpensePayload } from "@/lib/api/expenses";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["Operations", "Salaries", "Utilities", "Marketing", "Maintenance", "Transport", "Other"];

const PAYMENT_METHODS: { value: Expense["paymentMethod"]; label: string; icon: React.ElementType }[] = [
  { value: "cash",         label: "Cash",         icon: Banknote    },
  { value: "bank",         label: "Bank",         icon: CreditCard  },
  { value: "mobile_money", label: "Mobile Money", icon: Smartphone  },
];

function pmIcon(method: Expense["paymentMethod"]): React.ElementType {
  return PAYMENT_METHODS.find(m => m.value === method)?.icon ?? Banknote;
}

function pmLabel(method: Expense["paymentMethod"]): string {
  return PAYMENT_METHODS.find(m => m.value === method)?.label ?? method;
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

function ExpenseFormModal({ initial, onClose, onSaved }: {
  initial?:  Expense;
  onClose:   () => void;
  onSaved:   (e: Expense) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<ExpensePayload>({
    title:         initial?.title         ?? "",
    category:      initial?.category      ?? CATEGORIES[0],
    amount:        initial?.amount        ?? 0,
    paymentMethod: initial?.paymentMethod ?? "cash",
    reference:     initial?.reference     ?? "",
    notes:         initial?.notes         ?? "",
    date:          initial?.date          ?? today,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function set<K extends keyof ExpensePayload>(k: K, v: ExpensePayload[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim())    { setError("Title is required."); return; }
    if (form.amount <= 0)      { setError("Amount must be greater than 0."); return; }
    setSaving(true); setError("");
    try {
      const saved = initial
        ? await expensesApi.update(initial.id, form)
        : await expensesApi.create(form);
      onSaved(saved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save expense.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{initial ? "Edit Expense" : "Record Expense"}</h2>
          </div>
          <button type="button" title="Close" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Rent payment"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Category
              </label>
              <select title="Expense category" value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date <span className="text-red-500">*</span>
              </label>
              <input type="date" title="Expense date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (RWF) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">RWF</span>
              <input type="number" min="0" step="1" value={form.amount || ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => set("paymentMethod", value)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition ${
                    form.paymentMethod === value
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Reference / Receipt #</label>
            <input value={form.reference ?? ""} onChange={e => set("reference", e.target.value)} placeholder="e.g. INV-2024-001"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> Notes
            </label>
            <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={2}
              placeholder="Additional details…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initial ? "Save Changes" : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ expense, onClose, onDeleted }: {
  expense:   Expense;
  onClose:   () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function del() {
    setDeleting(true); setError("");
    try { await expensesApi.delete(expense.id); onDeleted(expense.id); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed."); setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center">Delete Expense?</h2>
        <p className="text-sm text-gray-500 text-center mt-2">
          Delete <span className="font-semibold text-gray-800">{expense.title}</span> ({expense.amount.toLocaleString()} RWF)?
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

export default function ExpensesPage() {
  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [toast,      setToast]      = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const LIMIT = 20;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(() => {
    setLoading(true); setError("");
    expensesApi.getAll({ page, limit: LIMIT, category: catFilter || undefined })
      .then(res => {
        setExpenses(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load expenses."))
      .finally(() => setLoading(false));
  }, [page, catFilter]);

  useEffect(() => { load(); }, [load]);

  // Client-side search filter on top of server results
  const visible = search.trim()
    ? expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()))
    : expenses;

  const totalAmount = visible.reduce((s, e) => s + e.amount, 0);

  function onSaved(e: Expense) {
    setExpenses(prev => prev.find(x => x.id === e.id) ? prev.map(x => x.id === e.id ? e : x) : [e, ...prev]);
    setShowForm(false); setEditing(null);
    showToast(editing ? "Expense updated" : "Expense recorded");
  }

  function onDeleted(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleting(null);
    showToast("Expense deleted");
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} records · <strong className="text-rose-600">{totalAmount.toLocaleString()} RWF</strong> shown</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-sm transition">
          <Plus className="w-4 h-4" /> Record Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…"
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 min-w-[200px]" />
        </div>
        <div className="relative flex items-center gap-2">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select title="Filter by category" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white appearance-none min-w-[160px]">
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {(search || catFilter) && (
          <button type="button" onClick={() => { setSearch(""); setCatFilter(""); setPage(1); }}
            className="px-3.5 py-2.5 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 transition">
            Clear filters
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
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
              <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th scope="col" className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className={`h-4 bg-gray-100 rounded animate-pulse ${j === 0 ? "w-40" : "w-20"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-20 text-center">
                  <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">{search || catFilter ? "No expenses match your filters." : "No expenses recorded yet."}</p>
                  {!search && !catFilter && (
                    <button type="button" onClick={() => setShowForm(true)}
                      className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 mx-auto transition">
                      <Plus className="w-3.5 h-3.5" /> Record First Expense
                    </button>
                  )}
                </td>
              </tr>
            ) : visible.map(e => {
              const PMIcon = pmIcon(e.paymentMethod);
              return (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{e.title}</p>
                    {e.reference && <p className="text-[11px] text-gray-400 mt-0.5">Ref: {e.reference}</p>}
                    {e.notes     && <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{e.notes}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                      <Tag className="w-2.5 h-2.5" />{e.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-bold text-rose-600">{e.amount.toLocaleString()} RWF</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <PMIcon className="w-3.5 h-3.5 text-gray-400" />{pmLabel(e.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button type="button" title="Edit" onClick={() => setEditing(e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Delete" onClick={() => setDeleting(e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" title="Previous" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-500 px-2">Page {page} of {totalPages}</span>
          <button type="button" title="Next" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Modals */}
      {(showForm || editing) && (
        <ExpenseFormModal
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
      {deleting && <DeleteModal expense={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
