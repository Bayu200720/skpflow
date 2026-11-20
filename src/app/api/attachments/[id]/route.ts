import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const attachment = await prisma.attachments.findUnique({
    where: { id },
    include: { activities: { select: { user_id: true } } },
  });
  if (!attachment) return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
  if (attachment.activities.user_id !== session.id && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteObject(attachment.file_path);
  await prisma.attachments.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}