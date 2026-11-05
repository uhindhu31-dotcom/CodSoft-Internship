import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/users/[id]">,
) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    (body.status !== "active" && body.status !== "blocked")
  ) {
    return Response.json({ error: "Choose active or blocked." }, { status: 400 });
  }
  if (id === admin.id && body.status === "blocked") {
    return Response.json({ error: "You cannot block your own admin account." }, {
      status: 400,
    });
  }

  const result = await prisma.user.updateMany({
    where: { id, role: { in: ["candidate", "recruiter"] } },
    data: { status: body.status },
  });
  if (!result.count) {
    return Response.json({ error: "Candidate or recruiter not found." }, {
      status: 404,
    });
  }

  return Response.json({ updated: true });
}
