import { formatDateID, monthName } from "./dates";

export const SECTION_KEYS = [
  "identity",
  "executive_summary",
  "daily_recap",
  "target_achievement",
  "output_recap",
  "obstacles",
  "closing",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  identity: "Identitas Pegawai",
  executive_summary: "Ringkasan Eksekutif",
  daily_recap: "Rekap Aktivitas Harian",
  target_achievement: "Capaian Target",
  output_recap: "Rekap Output",
  obstacles: "Kendala",
  closing: "Penutup",
};

export type GenerateActivity = {
  title: string;
  status: string;
  quantity: unknown; // Prisma Decimal | null
  unit: string | null;
  output: string | null;
  obstacle: string | null;
  categoryName: string | null;
  targetId: string | null;
};

export type GenerateTarget = {
  id: string;
  name: string;
  indicator: string | null;
  target_value: unknown;
  unit: string | null;
};

export type SectionDraft = { section_key: SectionKey; content: string; sort_order: number };

export function buildReportSections(input: {
  user: { nama: string; nip: string; jabatan: string | null; unitName: string };
  month: number;
  year: number;
  activities: GenerateActivity[];
  targets: GenerateTarget[];
  narrative: { executive_summary: string; closing: string };
}): SectionDraft[] {
  const { user, month, year, activities, targets, narrative } = input;
  const periodLabel = `${monthName(month)} ${year}`;
  const done = activities.filter((a) => a.status === "selesai").length;
  const inProgress = activities.filter((a) => a.status === "proses").length;

  const categoryCounts = new Map<string, number>();
  for (const a of activities) {
    const key = a.categoryName ?? "Lainnya";
    categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
  }
  const recap = [...categoryCounts.entries()].map(([name, count]) => `${name} (${count})`).join(", ");
  const dailyRecap = activities.length
    ? `Tercatat ${activities.length} aktivitas pada ${periodLabel}: ${done} selesai, ${inProgress} dalam proses, ${activities.length - done - inProgress} belum dimulai. Sebaran: ${recap || "tanpa kategori"}.`
    : `Belum ada aktivitas tercatat pada ${periodLabel}.`;

  const targetLines = targets.map((t) => {
    const related = activities.filter((a) => a.targetId === t.id);
    const achieved = related.reduce((sum, a) => sum + (a.quantity ? Number(a.quantity) : 0), 0);
    const targetValue = Number(t.target_value ?? 0);
    const unit = t.unit ?? "unit";
    return `${t.name}: ${achieved} dari ${targetValue} ${unit} (${related.length} aktivitas terkait)`;
  });
  const targetAchievement = targets.length
    ? targetLines.join("; ") + "."
    : "Belum ada target kinerja yang terhubung pada periode ini.";

  const outputs = activities.map((a) => a.output?.trim()).filter((x): x is string => !!x);
  const outputRecap = outputs.length ? `Output: ${outputs.join("; ")}.` : "Belum ada output terinci yang dicatat.";

  const obstacles = activities.map((a) => a.obstacle?.trim()).filter((x): x is string => !!x);
  const obstacleText = obstacles.length
    ? [...new Set(obstacles)].join("; ")
    : "Tidak ada kendala signifikan yang dilaporkan.";

  const identity = `Nama: ${user.nama} | NIP: ${user.nip} | Jabatan: ${user.jabatan ?? "-"} | Unit: ${user.unitName}`;

  const contents: Record<SectionKey, string> = {
    identity,
    executive_summary: narrative.executive_summary,
    daily_recap: dailyRecap,
    target_achievement: targetAchievement,
    output_recap: outputRecap,
    obstacles: obstacleText,
    closing: narrative.closing,
  };

  return SECTION_KEYS.map((key, index) => ({
    section_key: key,
    content: contents[key],
    sort_order: index + 1,
  }));
}

export function renderReportMarkdown(input: {
  report: { period_month: number; period_year: number; status: string; submitted_at: Date | null };
  owner: { nama: string; nip: string; jabatan: string | null; unitName: string };
  sections: { section_key: string; content: string | null; sort_order: number }[];
  reviews: { decision: string; comment: string | null; created_at: Date; reviewerName: string }[];
}) {
  const { report, owner, sections, reviews } = input;
  const lines: string[] = [
    `# Laporan Kinerja Bulanan — ${monthName(report.period_month)} ${report.period_year}`,
    "",
    `Pegawai: ${owner.nama} (${owner.nip})`,
    `Jabatan: ${owner.jabatan ?? "-"}`,
    `Unit: ${owner.unitName}`,
    `Status: ${report.status}`,
    report.submitted_at ? `Disubmit: ${formatDateID(report.submitted_at)}` : "",
    "",
  ];
  for (const s of [...sections].sort((a, b) => a.sort_order - b.sort_order)) {
    lines.push(`## ${SECTION_LABELS[s.section_key as SectionKey] ?? s.section_key}`, "", s.content ?? "-", "");
  }
  if (reviews.length) {
    lines.push("## Riwayat Tinjauan", "");
    for (const r of reviews) {
      lines.push(`- ${formatDateID(r.created_at)} · ${r.reviewerName} · ${r.decision}: ${r.comment ?? "-"}`);
    }
  }
  return lines.filter((l) => l !== undefined).join("\n");
}
