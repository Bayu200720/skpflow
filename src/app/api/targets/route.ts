import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  indicator: z.string().nullable().optional(),
  target_value: z.coerce.number().positive(),
  unit: z.string().nullable().optional(),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  status: z.enum(["active", "completed", "archived"]).default("active"),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targets = await prisma.targets.findMany({
    where: { user_id: session.id },
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
    include: {
      activities: { select: { id: true, quantity: true, status: true } },
    },
  });
  return NextResponse.json({ items: targets });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal.", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;
  if (new Date(d.period_end) < new Date(d.period_start)) {
    return NextResponse.json({ error: "Periode selesai harus setelah periode mulai." }, { status: 422 });
  }
  const created = await prisma.targets.create({
    data: {
      user_id: session.id,
      name: d.name,
      description: d.description ?? null,
      indicator: d.indicator ?? null,
      target_value: d.target_value,
      unit: d.unit ?? null,
      period_start: new Date(d.period_start),
      period_end: new Date(d.period_end),
      status: d.status,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}