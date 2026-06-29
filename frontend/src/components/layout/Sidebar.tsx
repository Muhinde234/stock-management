"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { getCurrentUser, type UserRole } from "@/lib/auth";
import { removeToken } from "@/lib/api/client";
import {
  LayoutDashboard, Package, Tag, ShoppingCart, ShoppingBag, BarChart3,
  Settings, Store, Building2, UserCog, Users, Warehouse,
  PackagePlus, PackageCheck,
  Truck, SlidersHorizontal, ArrowLeftRight, LogOut,
} from "lucide-react";

// ── Nav definitions per role ─────────────────────────────────────────────────

type NavItem = { label: string; href: string; icon: React.ElementType };
type NavSection = { section: string; items: NavItem[] };

const ADMIN_NAV: NavSection[] = [
  {
    section: "Management",
    items: [
      { label: "Dashboard",      href: "/dashboard",              icon: LayoutDashboard },
      { label: "Shops",          href: "/admin/shops",            icon: Building2       },
      { label: "Shop Managers",  href: "/admin/shop-managers",    icon: UserCog         },
      { label: "All Users",      href: "/admin/users",            icon: Users           },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Settings",       href: "/settings",               icon: Settings        },
    ],
  },
];

const SHOP_MANAGER_NAV: NavSection[] = [
  {
    section: "Management",
    items: [
      { label: "Dashboard",      href: "/dashboard",              icon: LayoutDashboard },
      { label: "Stores",         href: "/stores",                 icon: Store           },
      { label: "Stock Keepers",  href: "/stock-keepers",          icon: Users           },
    ],
  },
  {
    section: "Inventory",
    items: [
      { label: "Products",       href: "/products",               icon: Package         },
      { label: "Categories",     href: "/categories",             icon: Tag             },
      { label: "Warehouses",     href: "/inventory",              icon: Warehouse       },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Sales",          href: "/sales",                  icon: ShoppingCart    },
      { label: "Purchases",      href: "/purchases",              icon: ShoppingBag     },
      { label: "Reports",        href: "/reports",                icon: BarChart3       },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Settings",       href: "/settings",               icon: Settings        },
    ],
  },
];

const STOCK_KEEPER_NAV: NavSection[] = [
  {
    section: "Operations",
    items: [
      { label: "Dashboard",      href: "/dashboard",              icon: LayoutDashboard },
      { label: "Check In",       href: "/checkin",                icon: PackagePlus     },
      { label: "Purchases",      href: "/purchases",              icon: ShoppingBag     },
      { label: "Checkout",       href: "/checkout",               icon: PackageCheck    },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Reports",        href: "/reports",                icon: BarChart3       },
      { label: "Settings",       href: "/settings",               icon: Settings        },
    ],
  },
];

// Fallback when role is unknown (old system compatibility)
const DEFAULT_NAV: NavSection[] = [
  {
    section: "",
    items: [
      { label: "Dashboard",        href: "/dashboard",        icon: LayoutDashboard   },
      { label: "Products",         href: "/products",         icon: Package           },
      { label: "Categories",       href: "/categories",       icon: Tag               },
      { label: "Inventory",        href: "/inventory",        icon: Warehouse         },
      { label: "Sales",            href: "/sales",            icon: ShoppingCart      },
      { label: "Suppliers",        href: "/suppliers",        icon: Truck             },
      { label: "Stock Adjustment", href: "/stock-adjustment", icon: SlidersHorizontal },
      { label: "Transfers",        href: "/transfers",        icon: ArrowLeftRight    },
      { label: "Reports",          href: "/reports",          icon: BarChart3         },
      { label: "Staff",            href: "/staff",            icon: UserCog           },
      { label: "Settings",         href: "/settings",         icon: Settings          },
    ],
  },
];

function initials(name: string) {
  const src = name.trim();
  if (!src) return "??";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin:         "Administrator",
  shop_manager:  "Shop Manager",
  stock_keeper:  "Stock Keeper",
};

const ROLE_COLOR: Record<UserRole, string> = {
  admin:         "bg-violet-100 text-violet-700",
  shop_manager:  "bg-blue-100 text-blue-700",
  stock_keeper:  "bg-emerald-100 text-emerald-700",
};

function getNavForRole(role: UserRole | null): NavSection[] {
  if (role === "admin")        return ADMIN_NAV;
  if (role === "shop_manager") return SHOP_MANAGER_NAV;
  if (role === "stock_keeper") return STOCK_KEEPER_NAV;
  return DEFAULT_NAV;
}

// ── External store for user identity (localStorage) ──────────────────────────
// useSyncExternalStore uses getServerSnapshot during SSR + hydration (returns
// null so server and client agree), then switches to getClientSnapshot after
// mount — no setState-in-effect, no hydration mismatch.

function noopSubscribe() { return () => {}; }
function getServerSnapshot(): string | null { return null; }
function getClientSnapshot(): string | null {
  const user = getCurrentUser();
  if (!user) return null;
  return [user.role, user.full_name ?? user.username ?? ""].join("\x00");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  function logout() {
    removeToken();
    router.push("/auth/login");
  }

  const snap = useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);
  const [roleStr, usernameStr] = snap ? snap.split("\x00") : ["", ""];
  const role     = (roleStr as UserRole) || null;
  const username = usernameStr || "";

  const sections = getNavForRole(role);

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-white border-r border-gray-100 shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-md shadow-violet-200 shrink-0">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none">StockPro</p>
          <p className="text-[10px] text-violet-500 mt-0.5">Inventory System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((sec) => (
          <div key={sec.section}>
            {sec.section && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {sec.section}
              </p>
            )}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                      active
                        ? "bg-violet-50 text-violet-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-violet-600" : "text-gray-400"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0 space-y-1">
        {role && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold",
              role === "admin"        ? "bg-violet-600" :
              role === "shop_manager" ? "bg-blue-600"   : "bg-emerald-600"
            )}>
              {initials(username)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-none">{username}</p>
              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold mt-0.5", ROLE_COLOR[role])}>
                {ROLE_LABEL[role]}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
