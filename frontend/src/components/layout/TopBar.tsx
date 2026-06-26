"use client";

import { Bell, ChevronDown } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">

      {/* Left — spacer */}
      <div />

      {/* Right — actions */}
      <div className="flex items-center gap-1">

        <button
          type="button"
          title="Notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 ml-2 pl-4 border-l border-gray-100 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center shrink-0 ring-2 ring-emerald-400 ring-offset-1">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">Admin</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Admin</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>

    </header>
  );
}
