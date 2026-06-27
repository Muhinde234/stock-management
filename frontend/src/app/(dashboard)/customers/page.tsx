"use client";

import { Users, UserPlus, ShoppingCart, Phone, Mail } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage customer profiles and history</p>
          </div>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 text-violet-400 text-sm font-semibold cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="px-6 py-10 flex flex-col items-center justify-center flex-1 gap-6">
        <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center">
          <Users className="w-10 h-10 text-violet-400" />
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-lg font-bold text-gray-800">Customer management coming soon</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            The backend does not yet expose a customers API. Once available, you&apos;ll be able to manage
            profiles, track purchase history, and view loyalty points here.
          </p>
        </div>

        {/* Preview cards */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl opacity-40 pointer-events-none select-none">
          {[
            { name: "Alice Martin",   email: "alice@example.com",   phone: "+250 788 001 001", orders: 12 },
            { name: "Bob Karangwa",   email: "bob@example.com",     phone: "+250 788 002 002", orders: 7  },
            { name: "Claire Uwase",   email: "claire@example.com",  phone: "+250 788 003 003", orders: 3  },
          ].map(c => (
            <div key={c.name} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-violet-600">{c.name[0]}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 text-center">{c.name}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.phone}</div>
                <div className="flex items-center gap-1.5"><ShoppingCart className="w-3 h-3" />{c.orders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
