import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const company = await prisma.company.findUnique({
    where: { recruiterId: recruiter.id },
    select: { id: true, name: true, verified: true },
  });
  if (!company) {
    return Response.json({ error: "Create a company profile first." }, { status: 404 });
  }

  const [jobs, totalApplications, pendingApplications, shortlisted, hired] =
    await Promise.all([
      prisma.job.findMany({
        where: { companyId: company.id },
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.jobApplication.count({ where: { job: { companyId: company.id } } }),
      prisma.jobApplication.count({
        where: { job: { companyId: company.id }, status: "applied" },
      }),
      prisma.jobApplication.count({
        where: { job: { companyId: company.id }, status: "shortlisted" },
      }),
      prisma.jobApplication.count({
        where: { job: { companyId: company.id }, status: "selected" },
      }),
    ]);

  return Response.json({
    company,
    stats: {
      jobs: jobs.length,
      totalApplications,
      pendingApplications,
      shortlisted,
      hired,
    },
    jobs,
  });
}
