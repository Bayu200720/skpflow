import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewReport } from "@/lib/rbac";
import { getObjectBytes, signedDownloadUrl } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const attachment = await prisma.attachments.findUnique({
    where: { id },
    include: { activities: { include: { users: true } } },
  });
  if (!attachment) return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });

  const activity = attachment.activities;
  if (!canViewReport(session, activity.user_id, activity.users.atasan_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signed = await signedDownloadUrl(attachment.file_path);
  if (signed) return NextResponse.redirect(signed);

  const { bytes, contentType } = await getObjectBytes(attachment.file_path);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": attachment.mime_type ?? contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.file_name)}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}