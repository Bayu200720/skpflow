import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  date: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  target_id: z.string().uuid().nullable().optional(),
  output: z.string().nullable().optional(),
  quantity: z.coerce.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  duration_minutes: z.coerce.number().int().nullable().optional(),
  status: z.enum(["belum_dimulai", "proses", "selesai"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  obstacle: z.string().nullable().optional(),
  follow_up: z.string().nullable().optional(),
});

async function ownedActivity(id: string, userId: string) {
  const activity = await prisma.activities.findFirst({ where: { id, user_id: userId } });
  return activity;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const activity = await prisma.activities.findFirst({
    where: { id, user_id: session.id },
    include: { categories: true, targets: true, attachments: true },
  });
  if (!activity) return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ item: activity });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownedActivity(id, session.id))) {
    return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal.", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;
  const updated = await prisma.activities.update({
    where: { id },
    data: {
      ...(d.date ? { date: new Date(d.date) } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.category_id !== undefined ? { category_id: d.category_id } : {}),
      ...(d.target_id !== undefined ? { target_id: d.target_id } : {}),
      ...(d.output !== undefined ? { output: d.output } : {}),
      ...(d.quantity !== undefined ? { quantity: d.quantity } : {}),
      ...(d.unit !== undefined ? { unit: d.unit } : {}),
      ...(d.duration_minutes !== undefined ? { duration_minutes: d.duration_minutes } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.priority !== undefined ? { priority: d.priority } : {}),
      ...(d.obstacle !== undefined ? { obstacle: d.obstacle } : {}),
      ...(d.follow_up !== undefined ? { follow_up: d.follow_up } : {}),
      updated_at: new Date(),
    },
    include: { categories: true, targets: true },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownedActivity(id, session.id))) {
    return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 });
  }
  await prisma.activities.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}