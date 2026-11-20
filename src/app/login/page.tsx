"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

const demos = [
  { label: "ASN", email: "siti.aminah@skpflow.id" },
  { label: "Atasan", email: "budi.santoso@skpflow.id" },
  { label: "Admin", email: "admin@skpflow.id" },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("siti.aminah@skpflow.id");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500 text-lg font-bold">S</div>
            <div>
              <div className="text-lg font-bold">SKPFlow</div>
              <div className="text-xs text-slate-400">ASN Daily Work & SKP Assistant</div>
            </div>
          </div>
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            Catat hari ini, susun kinerja tanpa repot.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Ubah catatan aktivitas harian menjadi rekap mingguan dan draft laporan bulanan yang siap ditinjau atasan.
          </p>
        </div>
        <div className="relative grid gap-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold text-white">Quick add dengan AI</div>
            <div className="mt-1 text-xs">Tulis satu paragraf, AI memecah menjadi beberapa aktivitas.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold text-white">Terhubung ke target kinerja</div>
            <div className="mt-1 text-xs">Setiap aktivitas dapat diarahkan ke target dan output yang terukur.</div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">S</div>
              <div>
                <div className="font-bold">SKPFlow</div>
                <div className="text-xs text-slate-500">Catat hari ini</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight">Masuk ke akun Anda</h2>
            <p className="mt-1 text-sm text-slate-500">Gunakan email atau NIP yang terdaftar.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Email / NIP</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-transparent py-3 text-sm outline-none"
                    placeholder="nama@instansi.go.id"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Password</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <LockKeyhole size={16} className="text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent py-3 text-sm outline-none"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk"} <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Akun demo · password: password</div>
              <div className="flex flex-wrap gap-2">
                {demos.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => {
                      setIdentifier(demo.email);
                      setPassword("password");
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-slate-400">Prototipe hackathon · data demo</p>
        </div>
      </section>
    </div>
  );
}