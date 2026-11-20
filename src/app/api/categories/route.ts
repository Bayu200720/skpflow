import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [categories, tags] = await Promise.all([
    prisma.categories.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.tags.findMany({ orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ categories, tags });
}