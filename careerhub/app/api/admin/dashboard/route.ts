import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const [
    candidates,
    recruiters,
    jobs,
    pendingJobs,
    applications,
    unresolvedJobReports,
    unresolvedUserReports,
    recentApplications,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "candidate", status: "active" } }),
    prisma.user.count({ where: { role: "recruiter", status: "active" } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: "pending" } }),
    prisma.jobApplication.count(),
    prisma.jobReport.count({ where: { resolvedAt: null } }),
    prisma.userReport.count({ where: { resolvedAt: null } }),
    prisma.jobApplication.findMany({
      include: { job: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return Response.json({
    stats: {
      candidates,
      recruiters,
      jobs,
      pendingJobs,
      applications,
      unresolvedReports: unresolvedJobReports + unresolvedUserReports,
    },
    recentApplications,
  });
}
