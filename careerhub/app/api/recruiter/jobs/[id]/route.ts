import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/recruiter/jobs/[id]">,
) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return Response.json({ error: "Job details are invalid." }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { recruiterId: recruiter.id },
    select: { id: true },
  });
  if (!company) {
    return Response.json({ error: "Company profile not found." }, { status: 404 });
  }

  const textFields = [
    ["title", 120],
    ["description", 12000],
    ["location", 120],
    ["category", 80],
    ["workplace", 40],
    ["experience", 80],
    ["employmentType", 40],
  ] as const;
  const data: Record<string, string | number | string[] | null> = {};
  for (const [field, limit] of textFields) {
    if (body[field] === undefined) continue;
    if (
      typeof body[field] !== "string" ||
      !body[field].trim() ||
      body[field].trim().length > limit
    ) {
      return Response.json({ error: `Job ${field} is invalid.` }, { status: 400 });
    }
    if (
      (field === "workplace" &&
        !["Remote", "Hybrid", "On-site"].includes(body[field])) ||
      (field === "employmentType" &&
        !["Full-time", "Part-time", "Contract", "Internship"].includes(body[field]))
    ) {
      return Response.json({ error: `Job ${field} is invalid.` }, { status: 400 });
    }
    data[field] = body[field].trim();
  }
  for (const field of ["salaryMin", "salaryMax"] as const) {
    const value = body[field];
    if (value === undefined) continue;
    if (
      value !== null &&
      (typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < 0 ||
        value > 2_000_000_000)
    ) {
      return Response.json({ error: `Job ${field} is invalid.` }, { status: 400 });
    }
    data[field] = value;
  }
  const existingJob = await prisma.job.findFirst({
    where: { id, companyId: company.id },
    select: { salaryMin: true, salaryMax: true },
  });
  if (!existingJob) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }
  const minimum =
    typeof data.salaryMin === "number" || data.salaryMin === null
      ? data.salaryMin
      : existingJob.salaryMin;
  const maximum =
    typeof data.salaryMax === "number" || data.salaryMax === null
      ? data.salaryMax
      : existingJob.salaryMax;
  if (typeof minimum === "number" && typeof maximum === "number" && minimum > maximum) {
    return Response.json({ error: "Minimum salary cannot exceed maximum salary." }, {
      status: 400,
    });
  }
  if (body.skills !== undefined) {
    if (
      !Array.isArray(body.skills) ||
      body.skills.length > 30 ||
      body.skills.some(
        (skill) => typeof skill !== "string" || !skill.trim() || skill.length > 50,
      )
    ) {
      return Response.json({ error: "Job skills are invalid." }, { status: 400 });
    }
    data.skills = [...new Set(body.skills.map((skill: string) => skill.trim()))];
  }
  if (!Object.keys(data).length) {
    return Response.json({ error: "Provide at least one job field to update." }, {
      status: 400,
    });
  }

  const job = await prisma.job.update({
    where: { id },
    data: { ...data, status: "pending" },
  });
  return Response.json({ job });
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/recruiter/jobs/[id]">,
) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const { id } = await context.params;
  const company = await prisma.company.findUnique({
    where: { recruiterId: recruiter.id },
    select: { id: true },
  });
  if (!company) {
    return Response.json({ error: "Company profile not found." }, { status: 404 });
  }

  const result = await prisma.job.updateMany({
    where: { id, companyId: company.id },
    data: { status: "closed" },
  });
  if (!result.count) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json({ closed: true });
}
