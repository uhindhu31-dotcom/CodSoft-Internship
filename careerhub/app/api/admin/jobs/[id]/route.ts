import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/jobs/[id]">,
) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    (body.status !== "approved" && body.status !== "rejected")
  ) {
    return Response.json({ error: "Choose approved or rejected." }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, title: true, company: { select: { recruiterId: true } } },
  });
  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  const [updatedJob] = await prisma.$transaction([
    prisma.job.update({ where: { id }, data: { status: body.status } }),
    prisma.notification.create({
      data: {
        userId: job.company.recruiterId,
        title: `Job ${body.status}`,
        message: `Your posting "${job.title}" was ${body.status} by CareerHub.`,
      },
    }),
  ]);
  return Response.json({ job: updatedJob });
}
