import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ActivitiesClient from "@/components/activities/ActivitiesClient";

export default async function ActivitiesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [activities, categories, targets] = await Promise.all([
    prisma.activities.findMany({
      where: { user_id: session.id, date: { gte: start } },
      include: { categories: true, targets: true },
      orderBy: [{ date: "desc" }, { created_at: "desc" }],
      take: 300,
    }),
    prisma.categories.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
    prisma.targets.findMany({
      where: { user_id: session.id, status: { not: "archived" } },
      orderBy: { created_at: "desc" },
    }),
  ]);

  return (
    <ActivitiesClient
      initialActivities={activities.map((a) => ({
        id: a.id,
        date: a.date.toISOString().slice(0, 10),
        title: a.title,
        description: a.description,
        output: a.output,
        quantity: a.quantity === null ? null : Number(a.quantity),
        unit: a.unit,
        duration_minutes: a.duration_minutes,
        status: a.status,
        priority: a.priority,
        obstacle: a.obstacle,
        category_id: a.category_id,
        target_id: a.target_id,
        category_name: a.categories?.name ?? null,
        target_name: a.targets?.name ?? null,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      targets={targets.map((t) => ({ id: t.id, name: t.name }))}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}