import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const reportDetailInclude = Prisma.validator<Prisma.reportsInclude>()({
  users: { include: { units: true } },
  report_sections: { orderBy: { sort_order: "asc" } },
  report_reviews: {
    orderBy: { created_at: "desc" },
    include: { users: { select: { id: true, nama: true, jabatan: true } } },
  },
  report_activities: {
    include: {
      activities: { include: { categories: true, targets: true } },
    },
  },
});

export type ReportDetail = Prisma.reportsGetPayload<{ include: typeof reportDetailInclude }>;

export function getReportDetail(id: string): Promise<ReportDetail | null> {
  return prisma.reports.findUnique({ where: { id }, include: reportDetailInclude });
}
