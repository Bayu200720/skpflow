import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  nama: z.string().min(1).max(200).optional(),
  jabatan: z.string().max(200).nullable().optional(),
  role_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  atasan_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal.", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;
  if (id === session.id && d.is_active === false) {
    return NextResponse.json({ error: "Tidak bisa menonaktifkan akun sendiri." }, { status: 422 });
  }
  if (d.atasan_id === id) {
    return NextResponse.json({ error: "Atasan tidak boleh diri sendiri." }, { status: 422 });
  }

  try {
    const updated = await prisma.users.update({
      where: { id },
      data: {
        ...(d.nama !== undefined ? { nama: d.nama } : {}),
        ...(d.jabatan !== undefined ? { jabatan: d.jabatan } : {}),
        ...(d.role_id !== undefined ? { role_id: d.role_id } : {}),
        ...(d.unit_id !== undefined ? { unit_id: d.unit_id } : {}),
        ...(d.atasan_id !== undefined ? { atasan_id: d.atasan_id } : {}),
        ...(d.is_active !== undefined ? { is_active: d.is_active } : {}),
        ...(d.password ? { password_hash: await hashPassword(d.password) } : {}),
        updated_at: new Date(),
      },
      include: { roles: true, units: true, users: { select: { id: true, nama: true } } },
    });
    const { password_hash: _ignored, ...safe } = updated;
    return NextResponse.json({ item: safe });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ error: "Role/unit/atasan tidak valid." }, { status: 422 });
    }
    throw err;
  }
}