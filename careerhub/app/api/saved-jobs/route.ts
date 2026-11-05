import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: candidate.id },
    include: {
      job: {
        include: {
          company: { select: { id: true, name: true, verified: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ savedJobs });
}

export async function POST(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || typeof body.jobId !== "string" || !body.jobId.trim()) {
    return Response.json({ error: "A valid jobId is required." }, { status: 400 });
  }

  const job = await prisma.job.findFirst({
    where: { id: body.jobId, status: "approved" },
    select: { id: true },
  });
  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  const savedJob = await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: candidate.id, jobId: job.id } },
    create: { userId: candidate.id, jobId: job.id },
    update: {},
  });

  return Response.json({ savedJob }, { status: 201 });
}

export async function DELETE(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) {
    return Response.json({ error: "A jobId is required." }, { status: 400 });
  }

  const result = await prisma.savedJob.deleteMany({
    where: { userId: candidate.id, jobId },
  });
  if (!result.count) {
    return Response.json({ error: "Saved job not found." }, { status: 404 });
  }

  return Response.json({ deleted: true });
}
