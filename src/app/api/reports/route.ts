import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { draftReportNarrative } from "@/lib/ai";
import { buildReportSections } from "@/lib/reports";
import { monthName, monthRange } from "@/lib/dates";

const generateSchema = z.object({
  period_month: z.coerce.number().int().min(1).max(12),
  period_year: z.coerce.number().int().min(2000).max(2100),
  regenerate: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = new URL(request.url).searchParams.get("scope") ?? "mine";

  let where: Record<string, unknown>;
  if (scope === "team") {
    if (session.role === "ADMIN") where = {};
    else if (session.role === "ATASAN") where = { users: { atasan_id: session.id } };
    else return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else {
    where = { user_id: session.id };
  }

  const items = await prisma.reports.findMany({
    where,
    orderBy: [{ period_year: "desc" }, { period_month: "desc" }, { created_at: "desc" }],
    include: {
      users: { select: { id: true, nama: true, jabatan: true, units: { select: { name: true } } } },
      report_reviews: { orderBy: { created_at: "desc" }, take: 1, include: { users: { select: { nama: true } } } },
      _count: { select: { report_activities: true } },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Periode laporan tidak valid." }, { status: 422 });
  }
  const { period_month, period_year, regenerate } = parsed.data;
  const { start, end } = monthRange(period_year, period_month);

  const existing = await prisma.reports.findFirst({
    where: { user_id: session.id, period_month, period_year },
  });
  if (existing && !regenerate) {
    return NextResponse.json(
      { error: `Laporan ${monthName(period_month)} ${period_year} sudah ada.`, id: existing.id },
      { status: 409 },
    );
  }
  if (existing && !["draft", "revision"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Laporan yang sudah diajukan/disetujui tidak dapat digenerate ulang." },
      { status: 409 },
    );
  }

  const [user, activities, targets] = await Promise.all([
    prisma.users.findUnique({ where: { id: session.id }, include: { units: true } }),
    prisma.activities.findMany({
      where: { user_id: session.id, date: { gte: start, lt: end } },
      include: { categories: true, targets: true },
      orderBy: { date: "asc" },
    }),
    prisma.targets.findMany({
      where: { user_id: session.id, period_start: { lt: end }, period_end: { gte: start } },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

  const categoryCounts = new Map<string, number>();
  for (const a of activities) {
    const name = a.categories?.name ?? "Lainnya";
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  }
  const targetLines = targets.map((t) => {
    const related = activities.filter((a) => a.target_id === t.id);
    const achieved = related.reduce((sum, a) => sum + (a.quantity ? Number(a.quantity) : 0), 0);
    return `${t.name}: ${achieved}/${Number(t.target_value)} ${t.unit ?? "unit"}`;
  });

  const periodLabel = `${monthName(period_month)} ${period_year}`;
  const stats = {
    periodLabel,
    activityCount: activities.length,
    doneCount: activities.filter((a) => a.status === "selesai").length,
    progressCount: activities.filter((a) => a.status === "proses").length,
    categoryCounts: [...categoryCounts.entries()].map(([name, count]) => ({ name, count })),
    targetLines,
    outputLines: activities.map((a) => a.output).filter((x): x is string => !!x),
    obstacleLines: activities.map((a) => a.obstacle).filter((x): x is string => !!x),
  };

  const narrative = await draftReportNarrative(stats);
  const sections = buildReportSections({
    user: {
      nama: user.nama,
      nip: user.nip,
      jabatan: user.jabatan,
      unitName: user.units?.name ?? "-",
    },
    month: period_month,
    year: period_year,
    activities: activities.map((a) => ({
      title: a.title,
      status: a.status,
      quantity: a.quantity,
      unit: a.unit,
      output: a.output,
      obstacle: a.obstacle,
      categoryName: a.categories?.name ?? null,
      targetId: a.target_id,
    })),
    targets: targets.map((t) => ({
      id: t.id,
      name: t.name,
      indicator: t.indicator,
      target_value: t.target_value,
      unit: t.unit,
    })),
    narrative,
  });

  const activityLinks = activities.map((a) => ({ activity_id: a.id }));

  const report = await prisma.$transaction(async (tx) => {
    let target = existing;
    if (target) {
      await tx.report_sections.deleteMany({ where: { report_id: target.id } });
      await tx.report_activities.deleteMany({ where: { report_id: target.id } });
      target = await tx.reports.update({
        where: { id: target.id },
        data: { status: "draft", submitted_at: null, reviewed_at: null, updated_at: new Date() },
      });
    } else {
      target = await tx.reports.create({
        data: {
          user_id: session.id,
          period_month,
          period_year,
          status: "draft",
        },
      });
    }
    await tx.report_sections.createMany({
      data: sections.map((s) => ({ report_id: target!.id, ...s })),
    });
    if (activityLinks.length) {
      await tx.report_activities.createMany({
        data: activityLinks.map((l) => ({ report_id: target!.id, activity_id: l.activity_id })),
      });
    }
    await tx.audit_logs.create({
      data: {
        user_id: session.id,
        action: existing ? "report.regenerate" : "report.generate",
        entity_type: "report",
        entity_id: target.id,
        details: { period_month, period_year, activities: activityLinks.length },
      },
    });
    return target;
  });

  return NextResponse.json({ id: report.id }, { status: existing ? 200 : 201 });
}