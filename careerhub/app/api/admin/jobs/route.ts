import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

const jobStatuses = new Set(["pending", "approved", "rejected"]);

export async function GET(request: Request) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const status = new URL(request.url).searchParams.get("status") ?? "pending";
  if (!jobStatuses.has(status)) {
    return Response.json({ error: "Job status filter is invalid." }, { status: 400 });
  }

  const jobs = await prisma.job.findMany({
    where: { status },
    include: {
      company: { select: { id: true, name: true, verified: true, recruiterId: true } },
      _count: { select: { applications: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ jobs });
}
