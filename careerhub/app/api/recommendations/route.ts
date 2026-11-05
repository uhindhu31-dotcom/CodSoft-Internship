import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { isAIConfigured } from "@/lib/ai-resume";

type StoredMatch = {
  jobId: string;
  matchPercent: number;
  matchedSkills: string[];
  explanation: string;
};

function readStoredMatches(value: unknown): StoredMatch[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !("jobMatches" in value) ||
    !Array.isArray(value.jobMatches)
  ) {
    return [];
  }
  return value.jobMatches.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("jobId" in item) ||
      typeof item.jobId !== "string" ||
      !("matchPercent" in item) ||
      typeof item.matchPercent !== "number" ||
      !Number.isInteger(item.matchPercent) ||
      item.matchPercent < 0 ||
      item.matchPercent > 100 ||
      !("matchedSkills" in item) ||
      !Array.isArray(item.matchedSkills) ||
      item.matchedSkills.some((skill: unknown) => typeof skill !== "string") ||
      !("explanation" in item) ||
      typeof item.explanation !== "string"
    ) {
      return [];
    }
    return [{
      jobId: item.jobId,
      matchPercent: item.matchPercent,
      matchedSkills: item.matchedSkills,
      explanation: item.explanation,
    }];
  });
}

export async function GET(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const [profile, jobs] = await Promise.all([
    prisma.candidateProfile.findUnique({
      where: { userId: candidate.id },
      select: { skills: true, location: true, aiAnalysis: true },
    }),
    prisma.job.findMany({
      where: { status: "approved" },
      include: {
        company: { select: { id: true, name: true, verified: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const aiMatches = readStoredMatches(profile?.aiAnalysis);
  if (profile?.aiAnalysis) {
    const matchesById = new Map(aiMatches.map((match) => [match.jobId, match]));
    const recommendations = jobs
      .flatMap((job) => {
        const match = matchesById.get(job.id);
        return match
          ? [{ ...job, ...match, matchedSkills: match.matchedSkills.slice(0, 40) }]
          : [];
      })
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 10);
    return Response.json({
      method: "AI resume and job requirement analysis",
      note: "Matches use your latest AI resume analysis. Re-run the analysis to refresh them.",
      recommendations,
    });
  }

  const candidateSkills = new Set(
    (profile?.skills ?? []).map((skill) => skill.trim().toLowerCase()),
  );
  const recommendations = jobs
    .map((job) => {
      const matchedSkills = job.skills.filter((skill) =>
        candidateSkills.has(skill.trim().toLowerCase()),
      );
      return {
        ...job,
        matchedSkills,
        matchPercent: job.skills.length
          ? Math.round((matchedSkills.length / job.skills.length) * 100)
          : 0,
      };
    })
    .sort(
      (a, b) =>
        b.matchPercent - a.matchPercent ||
        Number(b.location === profile?.location) -
          Number(a.location === profile?.location),
    )
    .slice(0, 10);

  return Response.json({
    method: "Rule-based skill and location matching",
    note: isAIConfigured()
      ? "These preliminary matches use profile skills and location. Run an AI resume analysis for AI job matching."
      : "These preliminary matches use profile skills and location only. AI job matching requires OPENAI_API_KEY.",
    recommendations,
  });
}
