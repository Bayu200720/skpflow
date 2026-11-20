import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewReport } from "@/lib/rbac";
import { getReportDetail } from "@/lib/report-queries";
import { SECTION_KEYS } from "@/lib/reports";

const patchSchema = z.union([
  z.object({
    sections: z
      .array(
        z.object({
          section_key: z.enum(SECTION_KEYS),
          content: z.string().max(20000),
        }),
      )
      .min(1),
  }),
  z.object({ action: z.literal("submit") }),
]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const report = await getReportDetail(id);
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  if (!canViewReport(session, report.user_id, report.users.atasan_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    item: report,
    permissions: {
      isOwner: session.id === report.user_id,
      canReview: session.id !== report.user_id && (session.role === "ADMIN" || report.users.atasan_id === session.id),
      canEdit: session.id === report.user_id && ["draft", "revision"].includes(report.status),
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const report = await prisma.reports.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  if (report.user_id !== session.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid.", details: parsed.error.flatten() }, { status: 422 });
  }

  if ("action" in parsed.data) {
    if (!["draft", "revision"].includes(report.status)) {
      return NextResponse.json({ error: "Laporan sudah diajukan." }, { status: 409 });
    }
    const updated = await prisma.reports.update({
      where: { id },
      data: { status: "submitted", submitted_at: new Date(), updated_at: new Date() },
    });
    await prisma.audit_logs.create({
      data: {
        user_id: session.id,
        action: "report.submit",
        entity_type: "report",
        entity_id: id,
        details: { period_month: report.period_month, period_year: report.period_year },
      },
    });
    return NextResponse.json({ item: updated });
  }

  if (!["draft", "revision"].includes(report.status)) {
    return NextResponse.json({ error: "Laporan yang sudah diajukan tidak dapat diedit." }, { status: 409 });
  }

  await prisma.$transaction(
    parsed.data.sections.map((s) =>
      prisma.report_sections.updateMany({
        where: { report_id: id, section_key: s.section_key },
        data: { content: s.content, updated_at: new Date() },
      }),
    ),
  );
  const updated = await prisma.reports.update({ where: { id }, data: { updated_at: new Date() } });
  return NextResponse.json({ item: updated });
}