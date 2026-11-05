import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import {
  AIProviderError,
  analyzeResumeWithAI,
  isAIConfigured,
} from "@/lib/ai-resume";

export async function GET(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: candidate.id },
    select: { aiAnalysis: true, aiAnalyzedAt: true },
  });
  const configured = isAIConfigured();
  return Response.json({
    configured,
    provider: "OpenAI",
    analysis: profile?.aiAnalysis ?? null,
    analyzedAt: profile?.aiAnalyzedAt?.toISOString() ?? null,
    note: profile?.aiAnalysis
      ? configured
        ? "AI analysis is stored in your profile. Running a new analysis sends your profile and latest resume text to OpenAI."
        : "This is a previously saved AI analysis. New analyses and AI job matching require OPENAI_API_KEY."
      : configured
        ? "Select Analyze with AI to send your profile and latest resume text to OpenAI."
        : "AI analysis and AI job matching are unavailable until OPENAI_API_KEY is configured.",
  });
}

export async function POST(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  if (!isAIConfigured()) {
    return Response.json({
      configured: false,
      error: "AI analysis is not configured. Set OPENAI_API_KEY to enable it.",
    }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    !("consent" in body) ||
    body.consent !== true
  ) {
    return Response.json({
      error: "Consent is required before sending profile and resume text to OpenAI.",
    }, { status: 400 });
  }

  const [profile, resume, jobs] = await Promise.all([
    prisma.candidateProfile.findUnique({
      where: { userId: candidate.id },
      select: { headline: true, location: true, bio: true, skills: true },
    }),
    prisma.resume.findFirst({
      where: { userId: candidate.id },
      orderBy: { createdAt: "desc" },
      select: { extractedText: true },
    }),
    prisma.job.findMany({
      where: { status: "approved" },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        skills: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);
  const resumeText = resume?.extractedText?.trim() ?? "";
  const hasProfileContent = Boolean(
    profile?.headline || profile?.bio || profile?.skills.length,
  );
  if (!resumeText && !hasProfileContent) {
    return Response.json({
      error: "Add profile details or upload a text-based, PDF, or DOCX resume before analysis.",
    }, { status: 422 });
  }

  try {
    const analysis = await analyzeResumeWithAI({
      profile: {
        headline: profile?.headline ?? null,
        location: profile?.location ?? null,
        bio: profile?.bio ?? null,
        skills: profile?.skills ?? [],
      },
      resumeText,
      jobs,
    });
    await prisma.candidateProfile.upsert({
      where: { userId: candidate.id },
      create: {
        userId: candidate.id,
        aiAnalysis: analysis,
        aiAnalyzedAt: new Date(analysis.analyzedAt),
      },
      update: {
        aiAnalysis: analysis,
        aiAnalyzedAt: new Date(analysis.analyzedAt),
      },
    });
    return Response.json({
      configured: true,
      provider: "OpenAI",
      analysis,
      analyzedAt: analysis.analyzedAt,
    });
  } catch (error) {
    if (!(error instanceof AIProviderError)) throw error;
    return Response.json({ configured: true, error: error.message }, { status: 502 });
  }
}
