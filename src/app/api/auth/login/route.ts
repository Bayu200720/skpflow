import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email/NIP dan password wajib diisi." }, { status: 422 });
  }

  const { identifier, password } = parsed.data;
  const user = await prisma.users.findFirst({
    where: { OR: [{ email: identifier }, { nip: identifier }] },
    include: { roles: true },
  });

  if (!user || !user.is_active) {
    return NextResponse.json({ error: "Akun tidak ditemukan atau tidak aktif." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  const roleName = user.roles?.name === "Atasan" ? "ATASAN" : user.roles?.name === "Admin" ? "ADMIN" : "ASN";

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.nama,
    role: roleName,
    unitId: user.unit_id,
    supervisorId: user.atasan_id,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.nama, role: roleName },
  });
}