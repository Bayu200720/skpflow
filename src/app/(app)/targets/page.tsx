import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TargetsClient from "@/components/targets/TargetsClient";

export default async function TargetsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const targets = await prisma.targets.findMany({
    where: { user_id: session.id },
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
    include: { activities: { select: { quantity: true, status: true } } },
  });

  return (
    <TargetsClient
      initialTargets={targets.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        indicator: t.indicator,
        target_value: Number(t.target_value),
        unit: t.unit,
        period_start: t.period_start.toISOString().slice(0, 10),
        period_end: t.period_end.toISOString().slice(0, 10),
        status: t.status,
        achieved: t.activities.reduce((sum, a) => sum + (a.quantity ? Number(a.quantity) : 0), 0),
        activityCount: t.activities.length,
      }))}
    />
  );
}