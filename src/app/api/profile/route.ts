import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  nama: z.string().min(1).max(200).optional(),
  jabatan: z.string().max(200).nullable().optional(),
  current_password: z.string().optional(),
  new_password: z.string().min(8).max(128).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, activityCount, reportCount, targetCount] = await Promise.all([
    prisma.users.findUnique({
      where: { id: session.id },
      include: {
        units: true,
        roles: true,
        users: { select: { id: true, nama: true, jabatan: true, email: true } },
      },
    }),
    prisma.activities.count({ where: { user_id: session.id } }),
    prisma.reports.count({ where: { user_id: session.id } }),
    prisma.targets.count({ where: { user_id: session.id } }),
  ]);
  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

  const { password_hash: _ignored, ...safe } = user;
  return NextResponse.json({ item: safe, stats: { activityCount, reportCount, targetCount } });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal.", details: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;

  let password_hash: string | undefined;
  if (d.new_password) {
    const user = await prisma.users.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    if (!d.current_password || !(await verifyPassword(d.current_password, user.password_hash))) {
      return NextResponse.json({ error: "Password saat ini salah." }, { status: 422 });
    }
    password_hash = await hashPassword(d.new_password);
  }

  const updated = await prisma.users.update({
    where: { id: session.id },
    data: {
      ...(d.nama !== undefined ? { nama: d.nama } : {}),
      ...(d.jabatan !== undefined ? { jabatan: d.jabatan } : {}),
      ...(password_hash ? { password_hash } : {}),
      updated_at: new Date(),
    },
    include: { units: true, roles: true },
  });
  const { password_hash: _ignored, ...safe } = updated;
  return NextResponse.json({ item: safe });
}