"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, Tag, Bookmark, Truck,
  ShoppingBag, ClipboardList, ShoppingCart, FileText,
  ArrowLeftRight, SlidersHorizontal, Receipt, BarChart3,
  UserCog, Settings, Store, Crown,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",        href: "/dashboard",        icon: LayoutDashboard  },
  { label: "Products",         href: "/products",         icon: Package          },
  { label: "Suppliers",        href: "/suppliers",        icon: Truck            },
  { label: "Purchases",        href: "/purchases",        icon: ShoppingBag      },
  { label: "Purchase Orders",  href: "/purchase-orders",  icon: ClipboardList    },
  { label: "Sales",            href: "/sales",            icon: ShoppingCart     },
  { label: "Transfers",        href: "/transfers",        icon: ArrowLeftRight   },
  { label: "Stock Adjustment", href: "/stock-adjustment", icon: SlidersHorizontal},
  { label: "Expenses",         href: "/expenses",         icon: Receipt          },
  { label: "Reports",          href: "/reports",          icon: BarChart3        },
  { label: "Users",    href: "/staff",            icon: UserCog          },
  { label: "Settings",         href: "/settings",         icon: Settings         },
];

export default function Sidebar() {
  const pathname = usePathname();

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
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV.map((item) => {
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
      </nav>

      {/* Upgrade Plan */}
    </aside>
  );
}
