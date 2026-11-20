export type AiCategory = { id: string; name: string };
export type AiTarget = { id: string; name: string };

export type AiContext = {
  categories: AiCategory[];
  targets: AiTarget[];
  today: string; // yyyy-mm-dd
};

export type ActivityDraft = {
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

type NarrativeStats = {
  periodLabel: string;
  activityCount: number;
  doneCount: number;
  progressCount: number;
  categoryCounts: { name: string; count: number }[];
  targetLines: string[];
  outputLines: string[];
  obstacleLines: string[];
  weekLabel?: string;
};

function provider() {
  const p = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  return p === "groq" && process.env.AI_API_KEY ? "groq" : "mock";
}

async function chatJson(system: string, user: string): Promise<unknown> {
  const base = (process.env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "llama-3.3-70b-versatile";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI response kosong");
  return JSON.parse(content);
}

function guessCategory(text: string, categories: AiCategory[]) {
  const lower = text.toLowerCase();
  let best: AiCategory | null = null;
  let bestScore = 0;
  for (const c of categories) {
    const words = c.name.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const score = words.filter((w) => lower.includes(w)).length;
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  const aliases: [RegExp, string][] = [
    [/\b(backup|server|jaringan|monitoring|infra)/i, "Infrastruktur"],
    [/\b(rapat|koordinasi|meeting|notulen)/i, "Rapat dan Koordinasi"],
    [/\b(tiket|pengguna|printer|layanan|dukungan)/i, "Layanan Pengguna"],
    [/\b(api|aplikasi|bug|fitur|kode|deploy|ui)/i, "Pengembangan Aplikasi"],
    [/\b(dokumentasi|dokumen|panduan|sop)/i, "Dokumentasi"],
    [/\b(administrasi|absensi|surat|kepegawaian|laporan)/i, "Administrasi"],
  ];
  if (!best || bestScore === 0) {
    for (const [re, name] of aliases) {
      if (re.test(lower)) {
        const found = categories.find((c) => c.name === name);
        if (found) return found.id;
      }
    }
    return null;
  }
  return best.id;
}

function guessTarget(text: string, targets: AiTarget[]) {
  const lower = text.toLowerCase();
  const target = targets.find((t) => {
    const key = t.name.toLowerCase().split(/\W+/).filter((w) => w.length > 4)[0];
    return key ? lower.includes(key) : false;
  });
  return target?.id ?? null;
}

function mockExtract(text: string, ctx: AiContext): ActivityDraft[] {
  const parts = text
    .split(/\r?\n|;|•|(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((s) => s.length >= 4)
    .slice(0, 12);

  return parts.map((part) => {
    const title = part.length > 90 ? `${part.slice(0, 87)}...` : part;
    const qty = part.match(/(\d+)\s*(tiket|dokumen|file|laporan|server|rapat|kali|unit)/i);
    const dur = part.match(/(\d+)\s*(menit|jam)/i);
    const minutes = dur ? (dur[2].toLowerCase() === "jam" ? Number(dur[1]) * 60 : Number(dur[1])) : null;
    return {
      date: ctx.today,
      title,
      description: title !== part ? part : null,
      category_id: guessCategory(part, ctx.categories),
      target_id: guessTarget(part, ctx.targets),
      output: null,
      quantity: qty ? Number(qty[1]) : null,
      unit: qty ? qty[2] : null,
      duration_minutes: minutes,
      status: /proses|sedang|belum/i.test(part) ? "proses" : "selesai",
      priority: /penting|urgent|segera/i.test(part) ? "high" : "medium",
    } satisfies ActivityDraft;
  });
}

const draftSchema = {
  type: "object",
  properties: {
    activities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          category_id: { type: "string" },
          target_id: { type: "string" },
          output: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          duration_minutes: { type: "number" },
          status: { type: "string", enum: ["belum_dimulai", "proses", "selesai"] },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["title", "status", "priority"],
      },
    },
  },
  required: ["activities"],
};

function normalizeDrafts(raw: unknown, ctx: AiContext): ActivityDraft[] {
  const obj = raw as { activities?: unknown[] };
  if (!obj || !Array.isArray(obj.activities)) return [];
  return obj.activities
    .map((item) => {
      const a = item as Record<string, unknown>;
      if (typeof a.title !== "string" || !a.title.trim()) return null;
      const status = a.status === "belum_dimulai" || a.status === "proses" ? a.status : "selesai";
      const priority = a.priority === "low" || a.priority === "high" ? a.priority : "medium";
      return {
        date: typeof a.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.date) ? a.date : ctx.today,
        title: a.title.trim().slice(0, 200),
        description: typeof a.description === "string" && a.description.trim() ? a.description.trim() : null,
        category_id: ctx.categories.some((c) => c.id === a.category_id) ? String(a.category_id) : null,
        target_id: ctx.targets.some((t) => t.id === a.target_id) ? String(a.target_id) : null,
        output: typeof a.output === "string" && a.output.trim() ? a.output.trim() : null,
        quantity: typeof a.quantity === "number" ? a.quantity : null,
        unit: typeof a.unit === "string" && a.unit.trim() ? a.unit.trim() : null,
        duration_minutes: typeof a.duration_minutes === "number" ? Math.round(a.duration_minutes) : null,
        status,
        priority,
      } satisfies ActivityDraft;
    })
    .filter((x): x is ActivityDraft => x !== null)
    .slice(0, 15);
}

export async function extractActivities(text: string, ctx: AiContext): Promise<ActivityDraft[]> {
  if (provider() === "mock") return mockExtract(text, ctx);
  try {
    const raw = await chatJson(
      "Kamu asisten pencatatan kinerja ASN Indonesia. Pecah catatan bebas menjadi aktivitas terpisah. " +
        "Gunakan hanya category_id dan target_id yang ada pada konteks. Balas JSON sesuai skema.",
      JSON.stringify({
        catatan: text,
        tanggal_hari_ini: ctx.today,
        kategori: ctx.categories,
        target: ctx.targets,
        skema: draftSchema,
      }),
    );
    const drafts = normalizeDrafts(raw, ctx);
    return drafts.length > 0 ? drafts : mockExtract(text, ctx);
  } catch (err) {
    console.warn("AI extract gagal, memakai mock:", err);
    return mockExtract(text, ctx);
  }
}

function mockWeekly(stats: NarrativeStats) {
  const cats = stats.categoryCounts.map((c) => `${c.name} (${c.count})`).join(", ") || "belum ada aktivitas";
  return [
    `Rekap ${stats.weekLabel ?? stats.periodLabel}: tercatat ${stats.activityCount} aktivitas, ${stats.doneCount} selesai dan ${stats.progressCount} masih diproses.`,
    `Sebaran kategori: ${cats}.`,
    stats.targetLines.length ? `Target terkait: ${stats.targetLines.join("; ")}.` : "",
    stats.obstacleLines.length ? `Kendala: ${stats.obstacleLines.join("; ")}.` : "Tidak ada kendala yang dilaporkan.",
  ]
    .filter(Boolean)
    .join(" ");
}

function mockNarrative(stats: NarrativeStats) {
  const cats = stats.categoryCounts.map((c) => `${c.name} (${c.count})`).join(", ") || "belum ada aktivitas";
  return {
    executive_summary:
      `Pada ${stats.periodLabel}, tercatat ${stats.activityCount} aktivitas dengan ${stats.doneCount} selesai dan ${stats.progressCount} masih dalam proses. ` +
      `Aktivitas tersebar pada kategori: ${cats}.`,
    closing: `Laporan ${stats.periodLabel} disusun sebagai bahan evaluasi kinerja dan tindak lanjut perbaikan periode berikutnya.`,
  };
}

export async function summarizeWeekly(stats: NarrativeStats): Promise<string> {
  if (provider() === "mock") return mockWeekly(stats);
  try {
    const raw = (await chatJson(
      "Kamu asisten penyusun rekap kinerja ASN. Tulis rekap mingguan 2-4 kalimat dalam bahasa Indonesia formal, tanpa markdown.",
      JSON.stringify({ data: stats, skema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } }),
    )) as { text?: unknown };
    if (typeof raw.text === "string" && raw.text.trim()) return raw.text.trim();
    return mockWeekly(stats);
  } catch (err) {
    console.warn("AI weekly summary gagal, memakai mock:", err);
    return mockWeekly(stats);
  }
}

export async function draftReportNarrative(stats: NarrativeStats): Promise<{ executive_summary: string; closing: string }> {
  if (provider() === "mock") return mockNarrative(stats);
  try {
    const raw = (await chatJson(
      "Kamu penyusun laporan kinerja bulanan ASN. Tulis ringkasan eksekutif (3-5 kalimat) dan kalimat penutup. " +
        "Bahasa Indonesia formal, tanpa markdown. Balas JSON dengan kunci executive_summary dan closing.",
      JSON.stringify({ data: stats }),
    )) as { executive_summary?: unknown; closing?: unknown };
    if (typeof raw.executive_summary === "string" && raw.executive_summary.trim()) {
      return {
        executive_summary: raw.executive_summary.trim(),
        closing:
          typeof raw.closing === "string" && raw.closing.trim()
            ? raw.closing.trim()
            : mockNarrative(stats).closing,
      };
    }
    return mockNarrative(stats);
  } catch (err) {
    console.warn("AI report narrative gagal, memakai mock:", err);
    return mockNarrative(stats);
  }
}

export function aiProviderName() {
  return provider();
}