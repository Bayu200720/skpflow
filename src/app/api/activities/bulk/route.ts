import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const draftSchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  target_id: z.string().uuid().nullable().optional(),
  output: z.string().nullable().optional(),
  quantity: z.coerce.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  duration_minutes: z.coerce.number().int().nullable().optional(),
  status: z.enum(["belum_dimulai", "proses", "selesai"]).default("selesai"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const schema = z.object({ items: z.array(draftSchema).min(1).max(20) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Daftar aktivitas tidak valid.", details: parsed.error.flatten() }, { status: 422 });
  }

  const created = await prisma.$transaction(
    parsed.data.items.map((d) =>
      prisma.activities.create({
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
          status: d.status,
          priority: d.priority,
        },
      }),
    ),
  );
  return NextResponse.json({ items: created }, { status: 201 });
}