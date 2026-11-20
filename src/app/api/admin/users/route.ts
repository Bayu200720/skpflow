import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  nip: z.string().min(4).max(40),
  nama: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  atasan_id: z.string().uuid().nullable().optional(),
  jabatan: z.string().max(200).nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, roles, units] = await Promise.all([
    prisma.users.findMany({
      orderBy: { nama: "asc" },
      include: {
        roles: true,
        units: true,
        users: { select: { id: true, nama: true } },
        _count: { select: { activities: true, reports: true, targets: true } },
      },
    }),
    prisma.roles.findMany({ orderBy: { name: "asc" } }),
    prisma.units.findMany({ orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({
    items: users.map(({ password_hash: _ignored, ...u }) => u),
    roles,
    units,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal.", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;
  try {
    const created = await prisma.users.create({
      data: {
        nip: d.nip,
        nama: d.nama,
        email: d.email,
        password_hash: await hashPassword(d.password),
        role_id: d.role_id,
        unit_id: d.unit_id,
        atasan_id: d.atasan_id ?? null,
        jabatan: d.jabatan ?? null,
      },
      include: { roles: true, units: true },
    });
    const { password_hash: _ignored, ...safe } = created;
    return NextResponse.json({ item: safe }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return NextResponse.json({ error: "NIP atau email sudah dipakai." }, { status: 409 });
      if (err.code === "P2003") return NextResponse.json({ error: "Role/unit tidak valid." }, { status: 422 });
    }
    throw err;
  }
}