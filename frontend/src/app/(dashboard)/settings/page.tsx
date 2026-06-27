"use client";

import { useState } from "react";
import {
  Settings, Store, Globe, Bell, Shield,
  CheckCircle2, Moon, Sun, Monitor,
} from "lucide-react";

type Theme = "light" | "dark" | "system";
type Currency = "USD" | "RWF" | "EUR";

export default function SettingsPage() {
  const [storeName,    setStoreName]    = useState("StockPro Store");
  const [currency,     setCurrency]     = useState<Currency>("USD");
  const [theme,        setTheme]        = useState<Theme>("light");
  const [lowStockAlert,setLowStockAlert]= useState(true);
  const [saleAlert,    setSaleAlert]    = useState(true);
  const [saved,        setSaved]        = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: "light",  label: "Light",  icon: Sun     },
    { value: "dark",   label: "Dark",   icon: Moon    },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/60">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Configure your store preferences</p>
          </div>
          <button type="button" onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-200">
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5 max-w-2xl">

        {/* Store info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Store className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Store Information</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Store Name</label>
              <input
                type="text"
                value={storeName}
                title="Store name"
                onChange={e => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm text-gray-800 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Regional */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Regional</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Currency</label>
              <select
                title="Currency"
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm text-gray-800 outline-none transition-all appearance-none cursor-pointer bg-white"
              >
                <option value="USD">USD — US Dollar ($)</option>
                <option value="RWF">RWF — Rwandan Franc (RF)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Appearance</h2>
          </div>
          <div className="px-6 py-5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setTheme(value)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all
                    ${theme === value
                      ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {[
              { label: "Low stock alerts",    sub: "Notify when a product falls below minimum stock", value: lowStockAlert, set: setLowStockAlert },
              { label: "Sale notifications",  sub: "Notify when a new sale is completed",             value: saleAlert,     set: setSaleAlert     },
            ].map(({ label, sub, value, set }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <button type="button" title={label} onClick={() => set(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${value ? "bg-violet-600" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security (read-only info) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Security</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">Authentication</p>
                <p className="text-xs text-gray-400 mt-0.5">JWT-based session via backend</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Password change</p>
                <p className="text-xs text-gray-400 mt-0.5">Manage via account settings</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">Coming soon</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
