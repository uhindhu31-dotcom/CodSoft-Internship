import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const [jobReports, userReports] = await Promise.all([
    prisma.jobReport.findMany({
      where: { resolvedAt: null },
      include: {
        job: { select: { id: true, title: true } },
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userReport.findMany({
      where: { resolvedAt: null },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return Response.json({ jobReports, userReports });
}
