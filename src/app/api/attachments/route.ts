import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { putObject, signedDownloadUrl } from "@/lib/storage";

export const runtime = "nodejs";

async function attachmentUrl(id: string, filePath: string) {
  const signed = await signedDownloadUrl(filePath);
  return signed ?? `/api/attachments/${id}/file`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const activityId = new URL(request.url).searchParams.get("activity_id");
  if (!activityId) return NextResponse.json({ error: "activity_id wajib diisi." }, { status: 422 });

  const activity = await prisma.activities.findFirst({
    where: { id: activityId, user_id: session.id },
    select: { id: true },
  });
  if (!activity) return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 });

  const items = await prisma.attachments.findMany({
    where: { activity_id: activityId },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({
    items: await Promise.all(
      items.map(async (a) => ({
        ...a,
        url: await attachmentUrl(a.id, a.file_path),
      })),
    ),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Form tidak valid." }, { status: 400 });

  const activityId = String(form.get("activity_id") ?? "");
  const file = form.get("file");
  if (!activityId || !(file instanceof File)) {
    return NextResponse.json({ error: "activity_id dan file wajib diisi." }, { status: 422 });
  }

  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 10);
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `Ukuran file maksimal ${maxMb} MB.` }, { status: 413 });
  }

  const activity = await prisma.activities.findFirst({ where: { id: activityId, user_id: session.id } });
  if (!activity) return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "lampiran";
  const key = `${session.id}/${activityId}/${crypto.randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await putObject(key, bytes, file.type || "application/octet-stream");
  const created = await prisma.attachments.create({
    data: {
      activity_id: activityId,
      file_name: file.name,
      file_path: key,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: session.id,
    },
  });

  return NextResponse.json(
    { item: { ...created, url: await attachmentUrl(created.id, created.file_path) } },
    { status: 201 },
  );
}