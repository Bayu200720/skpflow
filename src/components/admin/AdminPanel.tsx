"use client";

import { useState } from "react";
import { KeyRound, Loader2, Plus, ShieldCheck } from "lucide-react";

type AdminUser = {
  id: string;
  nip: string;
  nama: string;
  email: string;
  jabatan: string | null;
  is_active: boolean;
  role_id: string;
  role_name: string;
  unit_id: string;
  unit_name: string;
  atasan_id: string | null;
  atasan_nama: string | null;
  activityCount: number;
  reportCount: number;
  targetCount: number;
};

type Option = { id: string; name: string };

const emptyForm = {
  nip: "",
  nama: "",
  email: "",
  password: "",
  role_id: "",
  unit_id: "",
  atasan_id: "",
  jabatan: "",
};

export default function AdminPanel({
  currentUserId,
  initialUsers,
  roles,
  units,
}: {
  currentUserId: string;
  initialUsers: AdminUser[];
  roles: Option[];
  units: Option[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, role_id: roles[0]?.id ?? "", unit_id: units[0]?.id ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, atasan_id: form.atasan_id || null, jabatan: form.jabatan || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat user.");
      setUsers((prev) => [
        ...prev,
        {
          ...data.item,
          role_name: roles.find((r) => r.id === data.item.role_id)?.name ?? "-",
          unit_name: units.find((u) => u.id === data.item.unit_id)?.name ?? "-",
          atasan_nama: users.find((u) => u.id === data.item.atasan_id)?.nama ?? null,
          activityCount: 0,
          reportCount: 0,
          targetCount: 0,
        },
      ]);
      setForm({ ...emptyForm, role_id: roles[0]?.id ?? "", unit_id: units[0]?.id ?? "" });
      setShowForm(false);
      setNotice("User baru dibuat.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat user.");
    } finally {
      setSaving(false);
    }
  }

  async function patchUser(id: string, patch: Record<string, unknown>, successMessage: string) {
    setError("");
    setNotice("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal memperbarui user.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...data.item,
              role_name: roles.find((r) => r.id === data.item.role_id)?.name ?? u.role_name,
              unit_name: units.find((x) => x.id === data.item.unit_id)?.name ?? u.unit_name,
              atasan_nama: users.find((x) => x.id === data.item.atasan_id)?.nama ?? null,
            }
          : u,
      ),
    );
    setNotice(successMessage);
  }

  async function resetPassword(user: AdminUser) {
    const password = window.prompt(`Password baru untuk ${user.nama} (min. 8 karakter):`);
    if (!password) return;
    await patchUser(user.id, { password }, `Password ${user.nama} diperbarui.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administrasi</h1>
          <p className="text-sm text-slate-500">Kelola akun, role, unit kerja, dan status keaktifan pegawai.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={14} /> {showForm ? "Tutup form" : "Tambah user"}
        </button>
      </div>

      {error ? <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl bg-emerald-50 px-4 py-2 text-xs text-emerald-700">{notice}</div> : null}

      {showForm ? (
        <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold">User baru</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">NIP</span>
              <input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Nama</span>
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Password awal</span>
              <input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Role</span>
              <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Unit</span>
              <select value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Atasan langsung</span>
              <select value={form.atasan_id} onChange={(e) => setForm({ ...form, atasan_id: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Tanpa atasan</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.nama}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Jabatan</span>
              <input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
          </div>
          <button disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? "Menyimpan..." : "Buat user"}
          </button>
        </form>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold">
          <ShieldCheck size={16} className="text-blue-600" /> {users.length} akun
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2">Pegawai</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2">Atasan</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.nama} {u.id === currentUserId ? <span className="text-[10px] text-blue-600">(Anda)</span> : null}</div>
                    <div className="text-[11px] text-slate-400">{u.email} · NIP {u.nip}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role_id}
                      onChange={(e) => void patchUser(u.id, { role_id: e.target.value }, `Role ${u.nama} diperbarui.`)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.unit_id}
                      onChange={(e) => void patchUser(u.id, { unit_id: e.target.value }, `Unit ${u.nama} diperbarui.`)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.atasan_nama ?? "—"}</td>
                  <td className="px-4 py-3 text-[11px] text-slate-500">{u.activityCount} aktivitas · {u.reportCount} laporan · {u.targetCount} target</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => void resetPassword(u)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50">
                        <KeyRound size={12} /> Reset
                      </button>
                      {u.id === currentUserId ? null : (
                        <button
                          onClick={() => void patchUser(u.id, { is_active: !u.is_active }, `${u.nama} ${u.is_active ? "dinonaktifkan" : "diaktifkan"}.`)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-medium ${u.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {u.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}