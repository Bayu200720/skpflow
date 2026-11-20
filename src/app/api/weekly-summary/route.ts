import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeWeekly } from "@/lib/ai";
import { formatShortDateID, weekRange } from "@/lib/dates";

async function statsFor(userId: string, start: Date, end: Date) {
  const activities = await prisma.activities.findMany({
    where: { user_id: userId, date: { gte: start, lt: end } },
    include: { categories: true, targets: true },
    orderBy: { date: "asc" },
  });
  const categoryCounts = new Map<string, number>();
  for (const a of activities) {
    const name = a.categories?.name ?? "Lainnya";
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  }
  return {
    activities,
    stats: {
      periodLabel: `${formatShortDateID(start)} - ${formatShortDateID(new Date(end.getTime() - 86400000))}`,
      weekLabel: `minggu ${formatShortDateID(start)} - ${formatShortDateID(new Date(end.getTime() - 86400000))}`,
      activityCount: activities.length,
      doneCount: activities.filter((a) => a.status === "selesai").length,
      progressCount: activities.filter((a) => a.status === "proses").length,
      categoryCounts: [...categoryCounts.entries()].map(([name, count]) => ({ name, count })),
      targetLines: [...new Set(activities.map((a) => a.targets?.name).filter((x): x is string => !!x))],
      outputLines: activities.map((a) => a.output).filter((x): x is string => !!x),
      obstacleLines: activities.map((a) => a.obstacle).filter((x): x is string => !!x),
    },
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const weekStart = new URL(request.url).searchParams.get("week_start");
  const base = weekStart ? new Date(weekStart) : new Date();
  const { start, end } = weekRange(base);

  const [{ activities, stats }, saved] = await Promise.all([
    statsFor(session.id, start, end),
    prisma.weekly_summaries.findFirst({
      where: { user_id: session.id, week_start: start },
      orderBy: { generated_at: "desc" },
    }),
  ]);

  return NextResponse.json({
    week_start: start,
    week_end: new Date(end.getTime() - 86400000),
    stats,
    saved: saved?.summary_text ?? null,
    activities: activities.map((a) => ({
      id: a.id,
      date: a.date,
      title: a.title,
      status: a.status,
      category: a.categories?.name ?? null,
      target: a.targets?.name ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const weekStart = typeof body?.week_start === "string" ? new Date(body.week_start) : new Date();
  const { start, end } = weekRange(weekStart);
  const { stats } = await statsFor(session.id, start, end);
  const text = await summarizeWeekly(stats);

  const existing = await prisma.weekly_summaries.findFirst({
    where: { user_id: session.id, week_start: start },
  });
  const saved = existing
    ? await prisma.weekly_summaries.update({
        where: { id: existing.id },
        data: { summary_text: text, week_end: new Date(end.getTime() - 86400000), edited_at: new Date() },
      })
    : await prisma.weekly_summaries.create({
        data: {
          user_id: session.id,
          week_start: start,
          week_end: new Date(end.getTime() - 86400000),
          summary_text: text,
        },
      });

  return NextResponse.json({ item: saved });
}