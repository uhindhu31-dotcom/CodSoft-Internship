import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.job.groupBy({
    by: ["category"],
    where: { status: "approved" },
    _avg: { salaryMin: true, salaryMax: true },
    _count: { _all: true },
    orderBy: { category: "asc" },
  });

  const insights = categories.map((item) => ({
    category: item.category,
    averageMinimum: item._avg.salaryMin,
    averageMaximum: item._avg.salaryMax,
    roles: item._count._all,
  }));
  return Response.json({ insights });
}
