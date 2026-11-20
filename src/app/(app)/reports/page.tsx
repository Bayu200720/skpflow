import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsClient from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const teamWhere =
    session.role === "ADMIN" ? {} : session.role === "ATASAN" ? { users: { atasan_id: session.id } } : null;

  const [mine, team] = await Promise.all([
    prisma.reports.findMany({
      where: { user_id: session.id },
      orderBy: [{ period_year: "desc" }, { period_month: "desc" }],
      include: {
        report_reviews: { orderBy: { created_at: "desc" }, take: 1, include: { users: { select: { nama: true } } } },
        _count: { select: { report_activities: true } },
      },
    }),
    teamWhere
      ? prisma.reports.findMany({
          where: { ...teamWhere, user_id: { not: session.id } },
          orderBy: [{ submitted_at: "desc" }, { created_at: "desc" }],
          include: {
            users: { select: { nama: true, jabatan: true, units: { select: { name: true } } } },
            report_reviews: { orderBy: { created_at: "desc" }, take: 1, include: { users: { select: { nama: true } } } },
            _count: { select: { report_activities: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <ReportsClient
      role={session.role}
      mine={mine.map((r) => ({
        id: r.id,
        period_month: r.period_month,
        period_year: r.period_year,
        status: r.status,
        submitted_at: r.submitted_at?.toISOString() ?? null,
        updated_at: r.updated_at.toISOString(),
        activityCount: r._count.report_activities,
        latestReview: r.report_reviews[0]
          ? {
              decision: r.report_reviews[0].decision,
              comment: r.report_reviews[0].comment,
              reviewer: r.report_reviews[0].users.nama,
            }
          : null,
      }))}
      team={team.map((r) => ({
        id: r.id,
        period_month: r.period_month,
        period_year: r.period_year,
        status: r.status,
        submitted_at: r.submitted_at?.toISOString() ?? null,
        ownerName: r.users.nama,
        ownerJabatan: r.users.jabatan,
        unitName: r.users.units?.name ?? null,
        activityCount: r._count.report_activities,
        latestReview: r.report_reviews[0]
          ? { decision: r.report_reviews[0].decision, comment: r.report_reviews[0].comment, reviewer: r.report_reviews[0].users.nama }
          : null,
      }))}
    />
  );
}