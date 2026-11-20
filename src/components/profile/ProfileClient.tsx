"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Loader2, Save, Sparkles } from "lucide-react";

type Profile = {
  nama: string;
  nip: string;
  email: string;
  jabatan: string | null;
  unit_name: string | null;
  role_name: string | null;
  atasan_nama: string | null;
  atasan_jabatan: string | null;
};

type Stats = { activityCount: number; reportCount: number; targetCount: number };

export default function ProfileClient({
  user,
  stats,
  weeklySummary,
  weekStart,
}: {
  user: Profile;
  stats: Stats;
  weeklySummary: string | null;
  weekStart: string;
}) {
  const router = useRouter();
  const [nama, setNama] = useState(user.nama);
  const [jabatan, setJabatan] = useState(user.jabatan ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const [summary, setSummary] = useState(weeklySummary);
  const [generating, setGenerating] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    setProfileMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, jabatan: jabatan || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan profil.");
      setProfileMsg("Profil tersimpan.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setError("");
    setPasswordMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengganti password.");
      setPasswordMsg("Password diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengganti password.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function generateSummary() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat rekap mingguan.");
      setSummary(data.item.summary_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat rekap mingguan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-slate-500">Kelola data kepegawaian dan rekap mingguan Anda.</p>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Data kepegawaian</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Nama</span>
                <input value={nama} onChange={(e) => setNama(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Jabatan</span>
                <input value={jabatan} onChange={(e) => setJabatan(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">NIP</span>
                <input value={user.nip} readOnly className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Email</span>
                <input value={user.email} readOnly className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Unit kerja</span>
                <input value={user.unit_name ?? "-"} readOnly className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Atasan langsung</span>
                <input value={user.atasan_nama ? `${user.atasan_nama}${user.atasan_jabatan ? ` · ${user.atasan_jabatan}` : ""}` : "-"} readOnly className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button disabled={savingProfile} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                <Save size={13} /> {savingProfile ? "Menyimpan..." : "Simpan profil"}
              </button>
              {profileMsg ? <span className="text-[11px] text-emerald-600">{profileMsg}</span> : null}
            </div>
          </form>

          <form onSubmit={savePassword} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Ganti password</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Password saat ini</span>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">Password baru (min. 8 karakter)</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button disabled={savingPassword} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                {savingPassword ? "Memproses..." : "Perbarui password"}
              </button>
              {passwordMsg ? <span className="text-[11px] text-emerald-600">{passwordMsg}</span> : null}
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold">Statistik</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Aktivitas</dt><dd className="font-semibold">{stats.activityCount}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Laporan</dt><dd className="font-semibold">{stats.reportCount}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Target</dt><dd className="font-semibold">{stats.targetCount}</dd></div>
            </dl>
          </div>

          <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <CalendarRange size={15} /> Rekap mingguan
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Minggu mulai {weekStart}. Rekap disusun dari aktivitas minggu ini.</p>
            <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-relaxed text-slate-700">
              {summary ?? "Belum ada rekap. Klik tombol untuk menyusun."}
            </div>
            <button onClick={() => void generateSummary()} disabled={generating} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {generating ? "Menyusun..." : summary ? "Susun ulang" : "Susun rekap"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}