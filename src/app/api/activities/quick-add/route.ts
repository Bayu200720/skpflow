import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractActivities } from "@/lib/ai";
import { toDateInput } from "@/lib/dates";

const schema = z.object({ text: z.string().min(4).max(4000) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tulis catatan minimal 4 karakter." }, { status: 422 });
  }

  const [categories, targets] = await Promise.all([
    prisma.categories.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.targets.findMany({
      where: { user_id: session.id, status: "active" },
      orderBy: { created_at: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const drafts = await extractActivities(parsed.data.text, {
    categories,
    targets,
    today: toDateInput(new Date()),
  });

  return NextResponse.json({ drafts, provider: (process.env.AI_PROVIDER ?? "mock").toLowerCase() === "groq" ? "groq" : "mock" });
}