import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  target_id: z.string().uuid().optional().nullable(),
  output: z.string().optional().nullable(),
  quantity: z.coerce.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  duration_minutes: z.coerce.number().int().optional().nullable(),
  status: z.enum(["belum_dimulai", "proses", "selesai"]).optional().default("selesai"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  obstacle: z.string().optional().nullable(),
  follow_up: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const categoryId = searchParams.get("category_id");

  const where: Record<string, unknown> = { user_id: session.id };
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (status && ["belum_dimulai", "proses", "selesai"].includes(status)) where.status = status;
  if (categoryId) where.category_id = categoryId;

  const items = await prisma.activities.findMany({
    where,
    include: { categories: true, targets: true },
    orderBy: [{ date: "desc" }, { created_at: "desc" }],
    take: 200,
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal.", details: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;
  const created = await prisma.activities.create({
    data: {
      user_id: session.id,
      date: new Date(d.date),
      title: d.title,
      description: d.description ?? null,
      category_id: d.category_id ?? null,
      target_id: d.target_id ?? null,
      output: d.output ?? null,
      quantity: d.quantity ?? null,
      unit: d.unit ?? null,
      duration_minutes: d.duration_minutes ?? null,
      status: d.status ?? "selesai",
      priority: d.priority ?? "medium",
      obstacle: d.obstacle ?? null,
      follow_up: d.follow_up ?? null,
    },
    include: { categories: true, targets: true },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}