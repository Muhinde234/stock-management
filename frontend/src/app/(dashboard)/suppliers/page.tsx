"use client";

import { Truck, Plus, Phone, Mail, Package } from "lucide-react";

export default function SuppliersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage supplier records and purchase orders</p>
          </div>
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 text-violet-400 text-sm font-semibold cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="px-6 py-10 flex flex-col items-center justify-center flex-1 gap-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center">
          <Truck className="w-10 h-10 text-amber-400" />
        </div>

        <div className="text-center max-w-sm">
          <h2 className="text-lg font-bold text-gray-800">Supplier management coming soon</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            The backend does not yet expose a suppliers API. Once available, you&apos;ll be able to manage
            vendor contacts, track purchase orders, and monitor delivery status here.
          </p>
        </div>

        {/* Preview cards */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl opacity-40 pointer-events-none select-none">
          {[
            { name: "TechStore Ltd",    email: "orders@techstore.rw",  phone: "+250 788 100 001", items: 45 },
            { name: "Gadget World",     email: "buy@gadgetworld.rw",   phone: "+250 788 100 002", items: 32 },
            { name: "Supply Chain Co.", email: "info@supplychain.rw",  phone: "+250 788 100 003", items: 18 },
          ].map(s => (
            <div key={s.name} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <span className="text-lg font-bold text-amber-600">{s.name[0]}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 text-center">{s.name}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{s.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{s.phone}</div>
                <div className="flex items-center gap-1.5"><Package className="w-3 h-3" />{s.items} products supplied</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
