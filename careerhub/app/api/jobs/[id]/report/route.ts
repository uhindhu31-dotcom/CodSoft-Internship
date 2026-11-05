import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function POST(
  request: Request,
  context: RouteContext<"/api/jobs/[id]/report">,
) {
  const reporter = await requireRole(request, ["candidate", "recruiter"]);
  if (reporter instanceof Response) return reporter;

  const { id: jobId } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    !("reason" in body) ||
    typeof body.reason !== "string" ||
    !body.reason.trim() ||
    body.reason.trim().length > 1000
  ) {
    return Response.json({ error: "Provide a report reason under 1,000 characters." }, {
      status: 400,
    });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true },
  });
  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  const report = await prisma.jobReport.create({
    data: { jobId, reporterId: reporter.id, reason: body.reason.trim() },
  });
  return Response.json({ report }, { status: 201 });
}
