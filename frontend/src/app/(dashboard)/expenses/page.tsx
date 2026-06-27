"use client";

import { Receipt, Plus, DollarSign, Tag, Calendar } from "lucide-react";

export default function ExpensesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track operational expenses</p>
          </div>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 text-violet-400 text-sm font-semibold cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="px-6 py-10 flex flex-col items-center justify-center flex-1 gap-6">
        <div className="w-20 h-20 rounded-2xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center">
          <Receipt className="w-10 h-10 text-rose-400" />
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-lg font-bold text-gray-800">Expense tracking coming soon</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            The backend does not yet expose an expenses API. Once available, you&apos;ll be able to
            log operational costs, categorize them, and view spending reports here.
          </p>
        </div>

        {/* Preview cards */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl opacity-40 pointer-events-none select-none">
          {[
            { label: "Rent",       amount: "$500.00",  category: "Overhead",  date: "Jun 1, 2026"  },
            { label: "Utilities",  amount: "$120.00",  category: "Overhead",  date: "Jun 5, 2026"  },
            { label: "Packaging",  amount: "$85.00",   category: "Operations",date: "Jun 10, 2026" },
          ].map(e => (
            <div key={e.label} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-base font-bold text-gray-900">{e.amount}</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{e.label}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><Tag className="w-3 h-3" />{e.category}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{e.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
