import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function POST(
  request: Request,
  context: RouteContext<"/api/users/[id]/report">,
) {
  const reporter = await requireRole(request, ["candidate", "recruiter"]);
  if (reporter instanceof Response) return reporter;

  const { id: reportedUserId } = await context.params;
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
  if (reportedUserId === reporter.id) {
    return Response.json({ error: "You cannot report your own account." }, {
      status: 400,
    });
  }

  const reportedUser = await prisma.user.findUnique({
    where: { id: reportedUserId },
    select: { id: true },
  });
  if (!reportedUser) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const report = await prisma.userReport.create({
    data: { reporterId: reporter.id, reportedUserId, reason: body.reason.trim() },
  });
  return Response.json({ report }, { status: 201 });
}
