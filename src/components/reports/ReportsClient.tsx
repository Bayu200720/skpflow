"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Send, Sparkles } from "lucide-react";

type ReportItem = {
  id: string;
  period_month: number;
  period_year: number;
  status: string;
  submitted_at: string | null;
  updated_at?: string;
  activityCount: number;
  latestReview?: { decision: string; comment: string | null; reviewer: string } | null;
  ownerName?: string;
  ownerJabatan?: string | null;
  unitName?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu review",
  revision: "Perlu revisi",
  approved: "Disetujui",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-amber-50 text-amber-700",
  revision: "bg-orange-50 text-orange-700",
  approved: "bg-emerald-50 text-emerald-700",
};

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function periodLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}

export default function ReportsClient({
  role,
  mine,
  team,
}: {
  role: "ASN" | "ATASAN" | "ADMIN";
  mine: ReportItem[];
  team: ReportItem[];
}) {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [regenerate, setRegenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_month: month, period_year: year, regenerate }),
      });
      const data = await res.json();
      if (res.status === 409 && data.id) {
        router.push(`/reports/${data.id}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Gagal membuat laporan.");
      router.push(`/reports/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat laporan.");
    } finally {
      setGenerating(false);
    }
  }

  async function submitReport(id: string) {
    setSubmittingId(id);
    setError("");
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim laporan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim laporan.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Bulanan</h1>
        <p className="text-sm text-slate-500">Susun laporan dari aktivitas harian, lalu kirim untuk ditinjau atasan.</p>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div> : null}

      <form onSubmit={generate} className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <Sparkles size={16} /> Susun laporan baru
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Draft dibuat otomatis dari aktivitas pada periode terpilih, termasuk ringkasan eksekutif dan capaian target.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">Bulan</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">Tahun</span>
            <input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 pb-2 text-xs text-slate-600">
            <input type="checkbox" checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)} />
            Buat ulang draft yang ada
          </label>
          <button disabled={generating} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? "Menyusun..." : "Susun laporan"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Laporan saya</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada laporan. Susun laporan pertama dari aktivitas bulan ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Periode</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Aktivitas</th>
                  <th className="py-2 pr-4">Review terakhir</th>
                  <th className="py-2 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-medium">{periodLabel(r.period_month, r.period_year)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[r.status] ?? STATUS_CLASS.draft}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{r.activityCount}</td>
                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {r.latestReview ? (
                        <div>
                          <div className="font-medium">
                            {r.latestReview.decision === "approved" ? "Disetujui" : r.latestReview.decision === "revision" ? "Revisi" : "Komentar"} · {r.latestReview.reviewer}
                          </div>
                          {r.latestReview.comment ? <div className="mt-0.5 text-slate-400">{r.latestReview.comment}</div> : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">Belum ada review</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/reports/${r.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50">
                          <Eye size={12} /> Detail
                        </Link>
                        {["draft", "revision"].includes(r.status) ? (
                          <button
                            onClick={() => void submitReport(r.id)}
                            disabled={submittingId === r.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Send size={12} /> {submittingId === r.id ? "Mengirim..." : "Kirim"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {role !== "ASN" && team.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold">Laporan tim</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Pegawai</th>
                  <th className="py-2 pr-4">Periode</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Aktivitas</th>
                  <th className="py-2 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {team.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{r.ownerName}</div>
                      <div className="text-[11px] text-slate-400">
                        {r.ownerJabatan}
                        {r.unitName ? ` · ${r.unitName}` : ""}
                      </div>
                    </td>
                    <td className="py-3 pr-4">{periodLabel(r.period_month, r.period_year)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASS[r.status] ?? STATUS_CLASS.draft}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{r.activityCount}</td>
                    <td className="py-3 pr-4 text-right">
                      <Link href={`/reports/${r.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50">
                        <Eye size={12} /> Tinjau
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}