import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const applications = await prisma.jobApplication.findMany({
    where: { candidateId: candidate.id },
    include: {
      job: {
        include: {
          company: { select: { name: true, verified: true } },
        },
      },
      interview: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ applications });
}
