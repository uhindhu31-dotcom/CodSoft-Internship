import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const company = await prisma.company.findUnique({
    where: { recruiterId: recruiter.id },
    select: { id: true },
  });
  if (!company) {
    return Response.json({ error: "Company profile not found." }, { status: 404 });
  }

  const applications = await prisma.jobApplication.findMany({
    where: { job: { companyId: company.id } },
    include: {
      job: { select: { id: true, title: true } },
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          candidateProfile: { select: { headline: true, location: true, skills: true } },
        },
      },
      resume: { select: { id: true, fileName: true, fileSize: true } },
      interview: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ applications });
}
