import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, FileText, Target } from "lucide-react";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [todayCount, monthCount, activeTargets, latestReport] = await Promise.all([
    prisma.activities.count({ where: { user_id: session.id, date: { gte: startOfToday() } } }),
    prisma.activities.count({ where: { user_id: session.id, date: { gte: startOfMonth() } } }),
    prisma.targets.count({ where: { user_id: session.id, status: "active" } }),
    prisma.reports.findFirst({
      where: { user_id: session.id },
      orderBy: [{ period_year: "desc" }, { period_month: "desc" }],
    }),
  ]);

  const reportLabel = latestReport
    ? `${String(latestReport.period_month).padStart(2, "0")}/${latestReport.period_year} · ${latestReport.status}`
    : "Belum ada";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan aktivitas dan laporan Anda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aktivitas hari ini</span>
            <CalendarCheck2 size={16} className="text-blue-600" />
          </div>
          <div className="mt-3 text-2xl font-bold">{todayCount}</div>
          <Link href="/activities" className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:underline">
            Lihat aktivitas <ArrowRight size={12} className="ml-1" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aktivitas bulan ini</span>
            <CalendarCheck2 size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 text-2xl font-bold">{monthCount}</div>
          <div className="mt-2 text-xs text-slate-500">Sejak awal bulan</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Target aktif</span>
            <Target size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 text-2xl font-bold">{activeTargets}</div>
          <Link href="/targets" className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:underline">
            Kelola target <ArrowRight size={12} className="ml-1" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Laporan terbaru</span>
            <FileText size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 text-sm font-semibold">{reportLabel}</div>
          <Link href="/reports" className="mt-2 inline-flex items-center text-xs font-medium text-blue-600 hover:underline">
            Buka laporan <ArrowRight size={12} className="ml-1" />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Mulai cepat</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/activities" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            + Tambah aktivitas
          </Link>
          <Link href="/reports" className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Lihat laporan
          </Link>
        </div>
      </div>
    </div>
  );
}