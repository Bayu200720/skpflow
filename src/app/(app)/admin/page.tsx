import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/components/admin/AdminPanel";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

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

  return (
    <AdminPanel
      currentUserId={session.id}
      initialUsers={users.map((u) => ({
        id: u.id,
        nip: u.nip,
        nama: u.nama,
        email: u.email,
        jabatan: u.jabatan,
        is_active: u.is_active,
        role_id: u.role_id,
        role_name: u.roles.name,
        unit_id: u.unit_id,
        unit_name: u.units.name,
        atasan_id: u.atasan_id,
        atasan_nama: u.users?.nama ?? null,
        activityCount: u._count.activities,
        reportCount: u._count.reports,
        targetCount: u._count.targets,
      }))}
      roles={roles.map((r) => ({ id: r.id, name: r.name }))}
      units={units.map((u) => ({ id: u.id, name: u.name }))}
    />
  );
}