import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReviewReport } from "@/lib/rbac";

const schema = z.object({
  decision: z.enum(["approved", "revision", "comment"]),
  comment: z.string().max(4000).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const report = await prisma.reports.findUnique({ where: { id }, include: { users: true } });
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  if (!canReviewReport(session, report.user_id, report.users.atasan_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["submitted", "approved", "revision"].includes(report.status)) {
    return NextResponse.json({ error: "Laporan belum diajukan." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Keputusan tinjauan tidak valid." }, { status: 422 });
  }
  if (parsed.data.decision === "revision" && !parsed.data.comment?.trim()) {
    return NextResponse.json({ error: "Komentar wajib diisi untuk permintaan revisi." }, { status: 422 });
  }

  const { decision, comment } = parsed.data;
  const nextStatus = decision === "approved" ? "approved" : decision === "revision" ? "revision" : report.status;

  const [review, updated] = await prisma.$transaction([
    prisma.report_reviews.create({
      data: {
        report_id: id,
        reviewer_id: session.id,
        decision,
        comment: comment?.trim() || null,
      },
      include: { users: { select: { nama: true } } },
    }),
    prisma.reports.update({
      where: { id },
      data: {
        status: nextStatus,
        reviewed_at: decision === "comment" ? report.reviewed_at : new Date(),
        updated_at: new Date(),
      },
    }),
  ]);

  await prisma.audit_logs.create({
    data: {
      user_id: session.id,
      action: `report.review.${decision}`,
      entity_type: "report",
      entity_id: id,
      details: { comment: comment ?? null },
    },
  });

  return NextResponse.json({ item: updated, review });
}