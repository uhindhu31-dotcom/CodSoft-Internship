import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/reports/[id]">,
) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    !("type" in body) ||
    (body.type !== "job" && body.type !== "user")
  ) {
    return Response.json({ error: "Report type must be job or user." }, {
      status: 400,
    });
  }

  const result =
    body.type === "job"
      ? await prisma.jobReport.updateMany({
          where: { id, resolvedAt: null },
          data: { resolvedAt: new Date() },
        })
      : await prisma.userReport.updateMany({
          where: { id, resolvedAt: null },
          data: { resolvedAt: new Date() },
        });
  if (!result.count) {
    return Response.json({ error: "Open report not found." }, { status: 404 });
  }

  return Response.json({ resolved: true });
}
