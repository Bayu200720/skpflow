"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Target,
  User,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

const baseNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activities", label: "Aktivitas Harian", icon: ClipboardList },
  { href: "/targets", label: "Target Kinerja", icon: Target },
  { href: "/reports", label: "Laporan Bulanan", icon: FileText },
  { href: "/profile", label: "Profil", icon: User },
];

function roleLabel(role: SessionUser["role"]) {
  if (role === "ATASAN") return "Atasan";
  if (role === "ADMIN") return "Admin";
  return "ASN";
}

export default function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = user.role === "ADMIN" ? [...baseNav, { href: "/admin", label: "Admin", icon: Shield }] : baseNav;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">S</div>
          <div>
            <div className="text-sm font-bold tracking-tight">SKPFlow</div>
            <div className="text-[11px] text-slate-500">Catat hari ini</div>
          </div>
          <button className="ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-3 bottom-4 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="text-[11px] text-slate-500">{roleLabel(user.role)}</div>
            </div>
          </div>
          <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Selamat datang, {user.name.split(" ")[0]}</div>
            <div className="text-[11px] text-slate-500">{roleLabel(user.role)} · SKPFlow</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/activities" className="hidden rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 sm:block">
              + Tambah Aktivitas
            </Link>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}