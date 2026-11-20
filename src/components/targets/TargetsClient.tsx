"use client";

import { useState } from "react";
import { Pencil, Plus, Target as TargetIcon, Trash2 } from "lucide-react";

type TargetItem = {
  id: string;
  name: string;
  description: string | null;
  indicator: string | null;
  target_value: number;
  unit: string | null;
  period_start: string;
  period_end: string;
  status: string;
  achieved: number;
  activityCount: number;
};

const emptyForm = {
  name: "",
  description: "",
  indicator: "",
  target_value: "",
  unit: "",
  period_start: new Date().toISOString().slice(0, 10),
  period_end: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10),
  status: "active",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  archived: "Arsip",
};

const STATUS_CLASS: Record<string, string> = {
  active: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  archived: "bg-slate-100 text-slate-600",
};

export default function TargetsClient({ initialTargets }: { initialTargets: TargetItem[] }) {
  const [targets, setTargets] = useState(initialTargets);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(t: TargetItem) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description ?? "",
      indicator: t.indicator ?? "",
      target_value: String(t.target_value),
      unit: t.unit ?? "",
      period_start: t.period_start,
      period_end: t.period_end,
      status: t.status,
    });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        indicator: form.indicator || null,
        target_value: Number(form.target_value),
        unit: form.unit || null,
        period_start: form.period_start,
        period_end: form.period_end,
        status: form.status,
      };
      const res = await fetch(editingId ? `/api/targets/${editingId}` : "/api/targets", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan target.");
      const saved = data.item as Omit<TargetItem, "achieved" | "activityCount">;
      if (editingId) {
        setTargets((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? { ...t, ...saved, target_value: Number(saved.target_value), achieved: t.achieved, activityCount: t.activityCount }
              : t,
          ),
        );
      } else {
        setTargets((prev) => [{ ...saved, target_value: Number(saved.target_value), achieved: 0, activityCount: 0 }, ...prev]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan target.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus target ini? Aktivitas terkait tidak akan terhapus.")) return;
    const res = await fetch(`/api/targets/${id}`, { method: "DELETE" });
    if (res.ok) setTargets((prev) => prev.filter((t) => t.id !== id));
    else setError("Gagal menghapus target.");
  }

  async function setStatus(id: string, status: string) {
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const res = await fetch(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setError("Gagal memperbarui status target.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Target Kinerja</h1>
          <p className="text-sm text-slate-500">Tetapkan target terukur, hubungkan dengan aktivitas harian.</p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={14} /> Target baru
        </button>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div> : null}

      {showForm ? (
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold">{editingId ? "Ubah target" : "Target baru"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Nama target</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Backup database bulanan" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Indikator</span>
              <input value={form.indicator} onChange={(e) => setForm({ ...form, indicator: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Jumlah backup terlaksana" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Nilai target</span>
                <input type="number" step="0.01" min="0.01" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Satuan</span>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="file" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Mulai</span>
              <input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Selesai</span>
              <input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="active">Aktif</option>
                <option value="completed">Selesai</option>
                <option value="archived">Arsip</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Deskripsi</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan target"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">
              Batal
            </button>
          </div>
        </form>
      ) : null}

      {targets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <TargetIcon size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium">Belum ada target kinerja.</p>
          <p className="mt-1 text-xs text-slate-500">Buat target agar setiap aktivitas harian terhubung ke capaian yang terukur.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {targets.map((t) => {
            const percent = t.target_value > 0 ? Math.min(100, Math.round((t.achieved / t.target_value) * 100)) : 0;
            return (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">{t.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[t.status] ?? STATUS_CLASS.active}`}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </div>
                    {t.indicator ? <p className="mt-1 text-[11px] text-slate-500">Indikator: {t.indicator}</p> : null}
                    <p className="mt-0.5 text-[11px] text-slate-400">{t.period_start} s.d. {t.period_end}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(t)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Ubah">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => void remove(t.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{t.achieved} / {t.target_value} {t.unit ?? "unit"}</span>
                    <span className="font-semibold text-slate-700">{percent}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">{t.activityCount} aktivitas terhubung</div>
                </div>

                <div className="mt-3 flex gap-2">
                  <select value={t.status} onChange={(e) => void setStatus(t.id, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]">
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                    <option value="archived">Arsip</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}