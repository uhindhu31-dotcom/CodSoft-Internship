import type { User } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UserRole = "candidate" | "recruiter" | "admin";

export type AuthenticatedUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "status"
>;

function isUserRole(role: string): role is UserRole {
  return role === "candidate" || role === "recruiter" || role === "admin";
}

export async function requireRole(
  request: Request,
  allowedRoles: readonly UserRole[],
): Promise<AuthenticatedUser | Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, status: true },
  });
  if (
    !user ||
    user.status !== "active" ||
    !isUserRole(user.role) ||
    !allowedRoles.includes(user.role)
  ) {
    return Response.json({ error: "You do not have permission for this action." }, {
      status: 403,
    });
  }

  return user;
}
