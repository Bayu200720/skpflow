import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  indicator: z.string().nullable().optional(),
  target_value: z.coerce.number().positive().optional(),
  unit: z.string().nullable().optional(),
  period_start: z.string().min(1).optional(),
  period_end: z.string().min(1).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.targets.findFirst({ where: { id, user_id: session.id } });
  if (!existing) return NextResponse.json({ error: "Target tidak ditemukan." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal.", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;
  const updated = await prisma.targets.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.indicator !== undefined ? { indicator: d.indicator } : {}),
      ...(d.target_value !== undefined ? { target_value: d.target_value } : {}),
      ...(d.unit !== undefined ? { unit: d.unit } : {}),
      ...(d.period_start ? { period_start: new Date(d.period_start) } : {}),
      ...(d.period_end ? { period_end: new Date(d.period_end) } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      updated_at: new Date(),
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.targets.findFirst({ where: { id, user_id: session.id } });
  if (!existing) return NextResponse.json({ error: "Target tidak ditemukan." }, { status: 404 });
  await prisma.targets.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}