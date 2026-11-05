import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

const allowedStatuses = new Set([
  "applied",
  "shortlisted",
  "rejected",
  "selected",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(request: Request) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const applications = await prisma.jobApplication.findMany({
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: { select: { name: true } },
        },
      },
      candidate: { select: { id: true, name: true, email: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return Response.json({ applications });
}

export async function PATCH(request: Request) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const body: unknown = await request.json().catch(() => null);
  const id = isRecord(body) && typeof body.id === "string" ? body.id : null;
  const status =
    isRecord(body) && typeof body.status === "string" ? body.status : null;
  if (
    !id ||
    !status ||
    !allowedStatuses.has(status)
  ) {
    return Response.json({ error: "Application id or status is invalid." }, {
      status: 400,
    });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id },
    select: { id: true, candidateId: true, job: { select: { title: true } } },
  });
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.jobApplication.update({
      where: { id: application.id },
      data: { status },
    });
    await transaction.applicationStatusEvent.create({
      data: { applicationId: application.id, status },
    });
    await transaction.notification.create({
      data: {
        userId: application.candidateId,
        title: "Application update",
        message: `Your application for ${application.job.title} is now ${status}.`,
      },
    });
    return result;
  });

  return Response.json({ application: updated });
}
