import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalText(value: unknown, limit: number) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > limit) return undefined;
  return value.trim();
}

export async function GET(request: Request) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const company = await prisma.company.findUnique({
    where: { recruiterId: recruiter.id },
  });
  if (!company) {
    return Response.json({ error: "Company profile not found." }, { status: 404 });
  }

  return Response.json({ company });
}

export async function POST(request: Request) {
  const user = await requireRole(request, ["candidate", "recruiter"]);
  if (user instanceof Response) return user;

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || typeof body.name !== "string") {
    return Response.json({ error: "A company name is required." }, { status: 400 });
  }

  const name = body.name.trim();
  const website = optionalText(body.website, 255);
  const description = optionalText(body.description, 5000);
  const location = optionalText(body.location, 120);
  if (
    !name ||
    name.length > 120 ||
    website === undefined ||
    description === undefined ||
    location === undefined ||
    (website &&
      (!URL.canParse(website) ||
        !["http:", "https:"].includes(new URL(website).protocol)))
  ) {
    return Response.json({ error: "Company details are invalid." }, { status: 400 });
  }

  const existingCompany = await prisma.company.findUnique({
    where: { recruiterId: user.id },
    select: { id: true },
  });
  if (existingCompany) {
    return Response.json({ error: "A company profile already exists." }, {
      status: 409,
    });
  }

  const company = await prisma.$transaction(async (transaction) => {
    const created = await transaction.company.create({
      data: { recruiterId: user.id, name, website, description, location },
    });
    await transaction.user.update({
      where: { id: user.id },
      data: { role: "recruiter" },
    });
    return created;
  });

  return Response.json({ company }, { status: 201 });
}

export async function PATCH(request: Request) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return Response.json({ error: "Company details are invalid." }, { status: 400 });
  }

  const data: {
    name?: string;
    website?: string | null;
    description?: string | null;
    location?: string | null;
  } = {};
  if (body.name !== undefined) {
    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 120
    ) {
      return Response.json({ error: "Company name is invalid." }, { status: 400 });
    }
    data.name = body.name.trim();
  }
  for (const [key, limit] of [
    ["website", 255],
    ["description", 5000],
    ["location", 120],
  ] as const) {
    if (body[key] === undefined) continue;
    const value = optionalText(body[key], limit);
    if (value === undefined) {
      return Response.json({ error: `Company ${key} is invalid.` }, { status: 400 });
    }
    if (
      key === "website" &&
      value &&
      (!URL.canParse(value) ||
        !["http:", "https:"].includes(new URL(value).protocol))
    ) {
      return Response.json({ error: "Company website must use HTTP or HTTPS." }, {
        status: 400,
      });
    }
    data[key] = value;
  }
  if (!Object.keys(data).length) {
    return Response.json({ error: "Provide at least one company field to update." }, {
      status: 400,
    });
  }

  const company = await prisma.company.update({
    where: { recruiterId: recruiter.id },
    data,
  });
  return Response.json({ company });
}
