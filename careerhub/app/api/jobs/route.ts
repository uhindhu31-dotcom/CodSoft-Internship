import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredText(
  body: Record<string, unknown>,
  key: string,
  maxLength: number,
) {
  const value = body[key];
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
    ? value.trim()
    : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim().slice(0, 100);
  const location = params.get("location")?.trim().slice(0, 100);
  const category = params.get("category")?.trim().slice(0, 80);
  const workplace = params.get("workplace")?.trim();
  const minimumSalaryParam = params.get("minimumSalary");
  const minimumSalary = minimumSalaryParam ? Number(minimumSalaryParam) : undefined;

  if (
    minimumSalary !== undefined &&
    (!Number.isSafeInteger(minimumSalary) ||
      minimumSalary < 0 ||
      minimumSalary > 2_000_000_000)
  ) {
    return Response.json({ error: "minimumSalary must be a non-negative integer." }, {
      status: 400,
    });
  }

  const jobs = await prisma.job.findMany({
    where: {
      status: "approved",
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(workplace && ["Remote", "Hybrid", "On-site"].includes(workplace)
        ? { workplace }
        : {}),
      ...(minimumSalary !== undefined
        ? { salaryMax: { gte: minimumSalary } }
        : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
              { company: { name: { contains: query, mode: "insensitive" } } },
              { skills: { has: query } },
            ],
          }
        : {}),
    },
    include: {
      company: { select: { id: true, name: true, verified: true, location: true } },
    },
    orderBy:
      params.get("sort") === "salary"
        ? [{ salaryMax: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" },
  });

  return Response.json({ jobs });
}

export async function POST(request: Request) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const company = await prisma.company.findUnique({
    where: { recruiterId: recruiter.id },
    select: { id: true },
  });
  if (!company) {
    return Response.json({ error: "Create a company profile before posting a job." }, {
      status: 409,
    });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return Response.json({ error: "A valid JSON job description is required." }, {
      status: 400,
    });
  }

  const title = requiredText(body, "title", 120);
  const description = requiredText(body, "description", 12000);
  const location = requiredText(body, "location", 120);
  const category = requiredText(body, "category", 80);
  const workplace = requiredText(body, "workplace", 40);
  const experience = requiredText(body, "experience", 80);
  const employmentType = requiredText(body, "employmentType", 40);
  const salaryMin = body.salaryMin;
  const salaryMax = body.salaryMax;
  const skills = body.skills;
  const isValidSalary = (value: unknown) =>
    value === undefined ||
    value === null ||
    (typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0 &&
      value <= 2_000_000_000);

  if (
    !title ||
    !description ||
    !location ||
    !category ||
    !workplace ||
    !experience ||
    !employmentType ||
    !["Remote", "Hybrid", "On-site"].includes(workplace) ||
    !["Full-time", "Part-time", "Contract", "Internship"].includes(employmentType) ||
    !isValidSalary(salaryMin) ||
    !isValidSalary(salaryMax) ||
    (typeof salaryMin === "number" &&
      typeof salaryMax === "number" &&
      salaryMin > salaryMax) ||
    !Array.isArray(skills) ||
    skills.length > 30 ||
    skills.some((skill) => typeof skill !== "string" || skill.trim().length > 50)
  ) {
    return Response.json({ error: "Job fields are invalid or incomplete." }, {
      status: 400,
    });
  }

  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      title,
      description,
      location,
      category,
      workplace,
      experience,
      employmentType,
      salaryMin: typeof salaryMin === "number" ? salaryMin : null,
      salaryMax: typeof salaryMax === "number" ? salaryMax : null,
      skills: skills.map((skill) => skill.trim()).filter(Boolean),
      status: "pending",
    },
  });

  return Response.json({ job }, { status: 201 });
}
