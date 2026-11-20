import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewReport } from "@/lib/rbac";
import { getReportDetail } from "@/lib/report-queries";
import { renderReportMarkdown } from "@/lib/reports";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const report = await getReportDetail(id);
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  if (!canViewReport(session, report.user_id, report.users.atasan_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const markdown = renderReportMarkdown({
    report: {
      period_month: report.period_month,
      period_year: report.period_year,
      status: report.status,
      submitted_at: report.submitted_at,
    },
    owner: {
      nama: report.users.nama,
      nip: report.users.nip,
      jabatan: report.users.jabatan,
      unitName: report.users.units?.name ?? "-",
    },
    sections: report.report_sections.map((s) => ({
      section_key: s.section_key,
      content: s.content,
      sort_order: s.sort_order,
    })),
    reviews: report.report_reviews.map((r) => ({
      decision: r.decision,
      comment: r.comment,
      created_at: r.created_at,
      reviewerName: r.users.nama,
    })),
  });

  const slug = report.users.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const filename = `laporan-${report.period_year}-${String(report.period_month).padStart(2, "0")}-${slug}.md`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}