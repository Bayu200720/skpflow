import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weekRange } from "@/lib/dates";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { start } = weekRange();
  const [user, activityCount, reportCount, targetCount, weekly] = await Promise.all([
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
    prisma.weekly_summaries.findFirst({
      where: { user_id: session.id, week_start: start },
      orderBy: { generated_at: "desc" },
    }),
  ]);
  if (!user) redirect("/login");

  return (
    <ProfileClient
      user={{
        nama: user.nama,
        nip: user.nip,
        email: user.email,
        jabatan: user.jabatan,
        unit_name: user.units?.name ?? null,
        role_name: user.roles?.name ?? null,
        atasan_nama: user.users?.nama ?? null,
        atasan_jabatan: user.users?.jabatan ?? null,
      }}
      stats={{ activityCount, reportCount, targetCount }}
      weeklySummary={weekly?.summary_text ?? null}
      weekStart={start.toISOString().slice(0, 10)}
    />
  );
}