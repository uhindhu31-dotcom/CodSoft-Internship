import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const user = await requireRole(request, ["candidate", "recruiter", "admin"]);
  if (user instanceof Response) return user;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ notifications });
}

export async function PATCH(request: Request) {
  const user = await requireRole(request, ["candidate", "recruiter", "admin"]);
  if (user instanceof Response) return user;

  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    typeof body.id !== "string"
  ) {
    return Response.json({ error: "A notification id is required." }, { status: 400 });
  }

  const result = await prisma.notification.updateMany({
    where: { id: body.id, userId: user.id },
    data: { readAt: new Date() },
  });
  if (!result.count) {
    return Response.json({ error: "Notification not found." }, { status: 404 });
  }

  return Response.json({ read: true });
}
