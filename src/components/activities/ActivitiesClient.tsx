"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";

export type ActivityItem = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  output: string | null;
  quantity: number | null;
  unit: string | null;
  duration_minutes: number | null;
  status: string;
  priority: string;
  obstacle: string | null;
  category_id: string | null;
  target_id: string | null;
  category_name: string | null;
  target_name: string | null;
};

type Option = { id: string; name: string };

type Draft = {
  date: string;
  title: string;
  description: string | null;
  category_id: string | null;
  target_id: string | null;
  output: string | null;
  quantity: number | null;
  unit: string | null;
  duration_minutes: number | null;
  status: "belum_dimulai" | "proses" | "selesai";
  priority: "low" | "medium" | "high";
};

const STATUS_LABEL: Record<string, string> = {
  belum_dimulai: "Belum dimulai",
  proses: "Proses",
  selesai: "Selesai",
};

const STATUS_CLASS: Record<string, string> = {
  belum_dimulai: "bg-slate-100 text-slate-600",
  proses: "bg-amber-50 text-amber-700",
  selesai: "bg-emerald-50 text-emerald-700",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-red-50 text-red-700",
};



export default function ActivitiesClient({
  initialActivities,
  categories,
  targets,
  today,
}: {
  initialActivities: ActivityItem[];
  categories: Option[];
  targets: Option[];
  today: string;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quickText, setQuickText] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [parsing, setParsing] = useState(false);
  const [savingDrafts, setSavingDrafts] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: today,
    title: "",
    category_id: "",
    target_id: "",
    output: "",
    quantity: "",
    unit: "",
    duration_minutes: "",
    status: "selesai",
    priority: "medium",
    obstacle: "",
  });

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const a of activities) {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [activities]);

  async function refresh(nextMonth = month, nextStatus = statusFilter) {
    setLoading(true);
    setError("");
    try {
      const [y, m] = nextMonth.split("-").map(Number);
      const from = `${nextMonth}-01`;
      const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
      const params = new URLSearchParams({ from, to });
      if (nextStatus) params.set("status", nextStatus);
      const res = await fetch(`/api/activities?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat aktivitas.");
      setActivities(
        data.items.map((a: Record<string, unknown>) => ({
          id: a.id,
          date: String(a.date).slice(0, 10),
          title: a.title,
          description: a.description,
          output: a.output,
          quantity: a.quantity === null ? null : Number(a.quantity),
          unit: a.unit,
          duration_minutes: a.duration_minutes,
          status: a.status,
          priority: a.priority,
          obstacle: a.obstacle,
          category_id: a.category_id,
          target_id: a.target_id,
          category_name: (a.categories as { name?: string } | null)?.name ?? null,
          target_name: (a.targets as { name?: string } | null)?.name ?? null,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat aktivitas.");
    } finally {
      setLoading(false);
    }
  }

  async function parseQuick() {
    if (quickText.trim().length < 4) return;
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/activities/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quickText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memecah catatan.");
      setAiProvider(data.provider ?? "");
      setDrafts(
        (data.drafts as Draft[]).map((d) => ({
          ...d,
          description: d.description ?? null,
          category_id: d.category_id ?? null,
          target_id: d.target_id ?? null,
          output: d.output ?? null,
          quantity: d.quantity ?? null,
          unit: d.unit ?? null,
          duration_minutes: d.duration_minutes ?? null,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memecah catatan.");
    } finally {
      setParsing(false);
    }
  }

  async function saveDrafts() {
    if (!drafts.length) return;
    setSavingDrafts(true);
    setError("");
    try {
      const res = await fetch("/api/activities/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: drafts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan aktivitas.");
      setDrafts([]);
      setQuickText("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan aktivitas.");
    } finally {
      setSavingDrafts(false);
    }
  }

  async function createActivity(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          title: form.title,
          category_id: form.category_id || null,
          target_id: form.target_id || null,
          output: form.output || null,
          quantity: form.quantity || null,
          unit: form.unit || null,
          duration_minutes: form.duration_minutes || null,
          status: form.status,
          priority: form.priority,
          obstacle: form.obstacle || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan aktivitas.");
      setForm({ ...form, title: "", output: "", quantity: "", unit: "", duration_minutes: "", obstacle: "" });
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan aktivitas.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    const res = await fetch(`/api/activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      await refresh();
      setError("Gagal memperbarui status.");
    }
  }

  async function removeActivity(id: string) {
    if (!window.confirm("Hapus aktivitas ini?")) return;
    const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
    if (res.ok) setActivities((prev) => prev.filter((a) => a.id !== id));
    else setError("Gagal menghapus aktivitas.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aktivitas Harian</h1>
          <p className="text-sm text-slate-500">Catat pekerjaan harian, lalu ubah menjadi laporan bulanan.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={14} /> {showForm ? "Tutup form" : "Tambah manual"}
        </button>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div> : null}

      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <Sparkles size={16} /> Quick add dengan AI
          {aiProvider ? (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-blue-700">
              provider: {aiProvider}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Tulis satu paragraf bebas. AI memecahnya menjadi beberapa aktivitas yang bisa Anda koreksi sebelum disimpan.
        </p>
        <textarea
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          rows={3}
          placeholder="Contoh: Pagi backup database produksi 1 jam. Siang rapat koordinasi tim infrastruktur dan membuat notulen. Sore cek tiket printer lantai 3 (2 tiket)."
          className="mt-3 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={parseQuick}
            disabled={parsing || quickText.trim().length < 4}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {parsing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {parsing ? "Memecah..." : "Pecah dengan AI"}
          </button>
          {drafts.length ? (
            <>
              <button
                onClick={saveDrafts}
                disabled={savingDrafts}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingDrafts ? "Menyimpan..." : `Simpan ${drafts.length} aktivitas`}
              </button>
              <button onClick={() => setDrafts([])} className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
                Batal
              </button>
            </>
          ) : null}
        </div>

        {drafts.length ? (
          <div className="mt-4 space-y-2">
            {drafts.map((d, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <input
                    value={d.title}
                    onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    className="w-full rounded-lg border border-transparent px-2 py-1 text-sm font-medium hover:border-slate-200 focus:border-blue-400 focus:outline-none"
                  />
                  <button onClick={() => setDrafts(drafts.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label="Hapus draft">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <select
                    value={d.category_id ?? ""}
                    onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, category_id: e.target.value || null } : x)))}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  >
                    <option value="">Tanpa kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={d.target_id ?? ""}
                    onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, target_id: e.target.value || null } : x)))}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  >
                    <option value="">Tanpa target</option>
                    {targets.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={d.status}
                    onChange={(e) =>
                      setDrafts(drafts.map((x, j) => (j === i ? { ...x, status: e.target.value as Draft["status"] } : x)))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  >
                    <option value="selesai">Selesai</option>
                    <option value="proses">Proses</option>
                    <option value="belum_dimulai">Belum dimulai</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {showForm ? (
        <form onSubmit={createActivity} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold">Tambah aktivitas manual</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Tanggal</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Judul</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Backup database produksi" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Kategori</span>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Tanpa kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Target</span>
              <select value={form.target_id} onChange={(e) => setForm({ ...form, target_id: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Tanpa target</option>
                {targets.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Output</span>
              <input value={form.output} onChange={(e) => setForm({ ...form, output: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="1 file backup" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Jumlah</span>
                <input type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Satuan</span>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="file" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Durasi (menit)</span>
              <input type="number" min="0" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="selesai">Selesai</option>
                  <option value="proses">Proses</option>
                  <option value="belum_dimulai">Belum dimulai</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Prioritas</span>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </select>
              </label>
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Kendala</span>
              <input value={form.obstacle} onChange={(e) => setForm({ ...form, obstacle: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Opsional" />
            </label>
          </div>
          <button disabled={saving} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan aktivitas"}
          </button>
        </form>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              void refresh(e.target.value, statusFilter);
            }}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              void refresh(month, e.target.value);
            }}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          >
            <option value="">Semua status</option>
            <option value="selesai">Selesai</option>
            <option value="proses">Proses</option>
            <option value="belum_dimulai">Belum dimulai</option>
          </select>
          {loading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : null}
          <span className="ml-auto text-xs text-slate-500">{activities.length} aktivitas</span>
        </div>

        {grouped.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Belum ada aktivitas pada periode ini. Mulai dengan quick add di atas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {grouped.map(([date, items]) => (
              <div key={date} className="px-4 py-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(
                    new Date(`${date}T00:00:00Z`),
                  )}
                </div>
                <div className="space-y-2">
                  {items.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{a.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[a.status] ?? STATUS_CLASS.belum_dimulai}`}>
                            {STATUS_LABEL[a.status] ?? a.status}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_CLASS[a.priority] ?? PRIORITY_CLASS.medium}`}>
                            {a.priority}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          {a.category_name ? <span>{a.category_name}</span> : null}
                          {a.target_name ? <span>Target: {a.target_name}</span> : null}
                          {a.quantity !== null ? <span>{a.quantity} {a.unit ?? ""}</span> : null}
                          {a.duration_minutes ? <span>{a.duration_minutes} menit</span> : null}
                          {a.output ? <span>Output: {a.output}</span> : null}
                        </div>
                        {a.obstacle ? <div className="mt-1 text-[11px] text-amber-700">Kendala: {a.obstacle}</div> : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={a.status}
                          onChange={(e) => void updateStatus(a.id, e.target.value)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
                        >
                          <option value="selesai">Selesai</option>
                          <option value="proses">Proses</option>
                          <option value="belum_dimulai">Belum dimulai</option>
                        </select>
                        <button onClick={() => void removeActivity(a.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}