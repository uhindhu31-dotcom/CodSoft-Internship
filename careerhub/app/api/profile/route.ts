import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: candidate.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return Response.json({ profile });
}

export async function PATCH(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return Response.json({ error: "Profile details are invalid." }, { status: 400 });
  }

  const data: {
    headline?: string | null;
    location?: string | null;
    bio?: string | null;
    skills?: string[];
  } = {};
  for (const [key, limit] of [
    ["headline", 160],
    ["location", 120],
    ["bio", 3000],
  ] as const) {
    if (body[key] === undefined) continue;
    if (
      body[key] !== null &&
      (typeof body[key] !== "string" || body[key].trim().length > limit)
    ) {
      return Response.json({ error: `Profile ${key} is invalid.` }, { status: 400 });
    }
    data[key] = typeof body[key] === "string" ? body[key].trim() : null;
  }
  if (body.skills !== undefined) {
    if (
      !Array.isArray(body.skills) ||
      body.skills.length > 40 ||
      body.skills.some(
        (skill) => typeof skill !== "string" || !skill.trim() || skill.length > 50,
      )
    ) {
      return Response.json({ error: "Skills must be a list of up to 40 values." }, {
        status: 400,
      });
    }
    data.skills = [...new Set(body.skills.map((skill) => skill.trim()))];
  }

  const profile = await prisma.candidateProfile.upsert({
    where: { userId: candidate.id },
    create: { userId: candidate.id, ...data },
    update: {
      ...data,
      aiAnalysis: Prisma.DbNull,
      aiAnalyzedAt: null,
    },
  });

  return Response.json({ profile });
}
