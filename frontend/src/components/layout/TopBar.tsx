"use client";

import { useSyncExternalStore } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { getCurrentUser, type UserRole } from "@/lib/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  admin:        "Admin",
  shop_manager: "Shop Manager",
  stock_keeper: "Stock Keeper",
};

const ROLE_BADGE: Record<UserRole, string> = {
  admin:        "bg-violet-100 text-violet-700",
  shop_manager: "bg-blue-100 text-blue-700",
  stock_keeper: "bg-emerald-100 text-emerald-700",
};

const AVATAR_BG: Record<UserRole, string> = {
  admin:        "bg-violet-600",
  shop_manager: "bg-blue-600",
  stock_keeper: "bg-emerald-600",
};

// Serialise to a stable string so useSyncExternalStore can compare by value
function clientSnapshot(): string | null {
  const user = getCurrentUser();
  if (!user) return null;
  return [user.role, user.full_name ?? user.username ?? ""].join("\x00");
}
function serverSnapshot(): null { return null; }
function noopSubscribe()        { return () => {}; }

function initials(name: string) {
  const src = name.trim();
  if (!src) return "??";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function TopBar() {
  const snap = useSyncExternalStore(noopSubscribe, clientSnapshot, serverSnapshot);

  const [roleStr, nameStr] = snap ? snap.split("\x00") : ["", ""];
  const role    = (roleStr as UserRole) || null;
  const display = nameStr || null;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">

      {/* Left — spacer */}
      <div />

      {/* Right */}
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

        {/* User — only rendered after client hydration to avoid mismatch */}
        {role && (
          <div className="flex items-center gap-2.5 ml-2 pl-4 border-l border-gray-100 cursor-pointer group">
            <div className={`w-9 h-9 rounded-full ${AVATAR_BG[role]} flex items-center justify-center shrink-0 ring-2 ring-white ring-offset-1`}>
              <span className="text-white text-sm font-bold">
                {initials(display ?? "")}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none truncate max-w-[120px]">
                {display}
              </p>
              <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${ROLE_BADGE[role]}`}>
                {ROLE_LABEL[role]}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        )}

      </div>
    </header>
  );
}
