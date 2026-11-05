import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const admin = await requireRole(request, ["admin"]);
  if (admin instanceof Response) return admin;

  const users = await prisma.user.findMany({
    where: { role: { in: ["candidate", "recruiter"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
          verified: true,
          _count: { select: { jobs: true } },
        },
      },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return Response.json({ users });
}
