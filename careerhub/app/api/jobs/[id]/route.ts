import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/jobs/[id]">,
) {
  const { id } = await context.params;
  const job = await prisma.job.findFirst({
    where: { id, status: "approved" },
    include: {
      company: { select: { id: true, name: true, website: true, verified: true } },
    },
  });

  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json({ job });
}
