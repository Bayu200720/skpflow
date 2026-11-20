"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, Loader2, Send, XCircle } from "lucide-react";
import { SECTION_LABELS } from "@/lib/reports";

type Section = { id: string; section_key: string; content: string; sort_order: number };
type Review = { id: string; decision: string; comment: string | null; created_at: string; reviewer_name: string };
type ActivityRow = {
  id: string;
  date: string;
  title: string;
  status: string;
  category_name: string | null;
  target_name: string | null;
  output: string | null;
  quantity: number | null;
  unit: string | null;
};

type ReportDetail = {
  id: string;
  period_month: number;
  period_year: number;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  owner: { id: string; nama: string; nip: string | null; jabatan: string | null; unit_name: string | null };
  sections: Section[];
  reviews: Review[];
  activities: ActivityRow[];
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



export default function ReportDetailClient({
  report,
  permissions,
}: {
  report: ReportDetail;
  permissions: { isOwner: boolean; canEdit: boolean; canReview: boolean };
}) {
  const router = useRouter();
  const [sections, setSections] = useState(report.sections);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => a.sort_order - b.sort_order),
    [sections],
  );

  function setContent(id: string, content: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
  }

  async function saveDraft() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: orderedSections.map((s) => ({ section_key: s.section_key, content: s.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan draft.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan draft.");
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
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
      setSubmitting(false);
    }
  }

  async function review(decision: "approved" | "revision" | "commented") {
    setReviewing(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${report.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: decision === "commented" ? "comment" : decision, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim review.");
      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim review.");
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/reports" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Kembali
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Laporan {MONTH_NAMES[report.period_month - 1]} {report.period_year}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_CLASS[report.status] ?? STATUS_CLASS.draft}`}>
              {STATUS_LABEL[report.status] ?? report.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {report.owner.nama}
            {report.owner.jabatan ? ` · ${report.owner.jabatan}` : ""}
            {report.owner.unit_name ? ` · ${report.owner.unit_name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/reports/${report.id}/export?format=pdf`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={13} /> PDF
          </a>
          <a
            href={`/api/reports/${report.id}/export?format=docx`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={13} /> Word
          </a>
          <a
            href={`/api/reports/${report.id}/export?format=xlsx`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={13} /> Excel
          </a>
          {permissions.isOwner && ["draft", "revision"].includes(report.status) ? (
            <>
              <button onClick={() => void saveDraft()} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan draft"}
              </button>
              <button onClick={() => void submit()} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Kirim untuk review
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {orderedSections.map((section) => (
            <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold">
                {SECTION_LABELS[section.section_key as keyof typeof SECTION_LABELS] ?? section.section_key}
              </h2>
              {permissions.canEdit ? (
                <textarea
                  value={section.content}
                  onChange={(e) => setContent(section.id, e.target.value)}
                  rows={section.section_key === "executive_summary" ? 4 : 6}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed"
                />
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{section.content || "—"}</p>
              )}
            </section>
          ))}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Daftar aktivitas periode ini</h2>
            {report.activities.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Tidak ada aktivitas tercatat pada periode ini.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3">Tanggal</th>
                      <th className="py-2 pr-3">Kegiatan</th>
                      <th className="py-2 pr-3">Kategori</th>
                      <th className="py-2 pr-3">Target</th>
                      <th className="py-2 pr-3">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.activities.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap text-xs text-slate-500">
                          {new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${a.date}T00:00:00Z`))}
                        </td>
                        <td className="py-2 pr-3">{a.title}</td>
                        <td className="py-2 pr-3 text-slate-500">{a.category_name ?? "—"}</td>
                        <td className="py-2 pr-3 text-slate-500">{a.target_name ?? "—"}</td>
                        <td className="py-2 pr-3 text-slate-500">
                          {a.output ?? "—"}
                          {a.quantity !== null ? ` (${a.quantity}${a.unit ? ` ${a.unit}` : ""})` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {permissions.canReview ? (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
              <h2 className="text-sm font-semibold text-blue-900">Tinjau laporan</h2>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Catatan review (wajib saat meminta revisi)..."
                rows={4}
                className="mt-3 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => void review("approved")} disabled={reviewing} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  <CheckCircle2 size={14} /> Setujui
                </button>
                <button onClick={() => void review("revision")} disabled={reviewing} className="inline-flex items-center gap-1 rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                  <XCircle size={14} /> Minta revisi
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Riwayat review</h2>
            {report.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Belum ada review.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {report.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">
                        {r.decision === "approved" ? "Disetujui" : r.decision === "revision" ? "Revisi" : "Komentar"}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleString("id-ID")}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{r.reviewer_name}</p>
                    {r.comment ? <p className="mt-2 text-sm text-slate-700">{r.comment}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}