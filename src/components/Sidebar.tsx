"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FlaskConical,
  Route,
  Wrench,
  AlertTriangle,
  FileCheck2,
  LayoutDashboard,
  Building2,
  Plus,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Панель управления", icon: LayoutDashboard },
  { href: "/samples", label: "Образцы", icon: FlaskConical },
  { href: "/samples/new", label: "Новый образец", icon: Plus, indent: true },
  { href: "/equipment", label: "Журнал оборудования", icon: Wrench },
  { href: "/deviations", label: "Журнал отклонений", icon: AlertTriangle },
  { href: "/protocols", label: "Протоколы", icon: FileCheck2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f2440] text-white flex flex-col z-50">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#0f2440]" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">ЛабМаршрут</h1>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">Испытания</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3">
            Навигация
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && !item.indent);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${item.indent ? "ml-8" : ""}
                ${isActive
                  ? "bg-white/10 text-amber-400 font-medium"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? "text-amber-400" : "text-white/40"}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-amber-400/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-amber-500/60" />
          <span className="text-[11px] text-white/30">v1.0 — Маршрут испытаний</span>
        </div>
      </div>
    </aside>
  );
}
