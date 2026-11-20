import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canViewReport } from "@/lib/rbac";
import { getReportDetail } from "@/lib/report-queries";
import ReportDetailClient from "@/components/reports/ReportDetailClient";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const report = await getReportDetail(id);
  if (!report) notFound();
  if (!canViewReport(session, report.user_id, report.users.atasan_id)) redirect("/reports");

  return (
    <ReportDetailClient
      report={{
        id: report.id,
        period_month: report.period_month,
        period_year: report.period_year,
        status: report.status,
        submitted_at: report.submitted_at?.toISOString() ?? null,
        reviewed_at: report.reviewed_at?.toISOString() ?? null,
        owner: {
          id: report.users.id,
          nama: report.users.nama,
          nip: report.users.nip,
          jabatan: report.users.jabatan,
          unit_name: report.users.units?.name ?? null,
        },
        sections: report.report_sections.map((s) => ({
          id: s.id,
          section_key: s.section_key,
          content: s.content ?? "",
          sort_order: s.sort_order,
        })),
        reviews: report.report_reviews.map((r) => ({
          id: r.id,
          decision: r.decision,
          comment: r.comment,
          created_at: r.created_at.toISOString(),
          reviewer_name: r.users.nama,
        })),
        activities: report.report_activities
          .map((ra) => ra.activities)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((a) => ({
            id: a.id,
            date: a.date.toISOString().slice(0, 10),
            title: a.title,
            status: a.status,
            category_name: a.categories?.name ?? null,
            target_name: a.targets?.name ?? null,
            output: a.output,
            quantity: a.quantity === null ? null : Number(a.quantity),
            unit: a.unit,
          })),
      }}
      permissions={{
        isOwner: session.id === report.user_id,
        canEdit: session.id === report.user_id && ["draft", "revision"].includes(report.status),
        canReview:
          session.id !== report.user_id &&
          (session.role === "ADMIN" || report.users.atasan_id === session.id) &&
          ["submitted", "approved", "revision"].includes(report.status),
      }}
    />
  );
}