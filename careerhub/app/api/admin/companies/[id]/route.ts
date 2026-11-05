import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/companies/[id]">,
) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    !("verified" in body) ||
    typeof body.verified !== "boolean"
  ) {
    return Response.json({ error: "A verified boolean is required." }, {
      status: 400,
    });
  }

  const company = await prisma.company.update({
    where: { id },
    data: { verified: body.verified },
    select: { id: true, name: true, verified: true },
  });
  return Response.json({ company });
}
