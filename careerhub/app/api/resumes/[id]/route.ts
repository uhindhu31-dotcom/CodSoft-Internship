import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function GET(
  request: Request,
  context: RouteContext<"/api/resumes/[id]">,
) {
  const user = await requireRole(request, ["candidate", "recruiter", "admin"]);
  if (user instanceof Response) return user;

  const { id } = await context.params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      fileName: true,
      mimeType: true,
      content: true,
      extractedText: true,
    },
  });
  if (!resume) {
    return Response.json({ error: "Resume not found." }, { status: 404 });
  }

  if (user.role === "candidate" && resume.userId !== user.id) {
    return Response.json({ error: "You cannot access this resume." }, { status: 403 });
  }

  if (user.role === "recruiter") {
    const application = await prisma.jobApplication.findFirst({
      where: {
        resumeId: resume.id,
        candidateId: resume.userId,
        job: { company: { recruiterId: user.id } },
      },
      select: { id: true },
    });
    if (!application) {
      return Response.json({ error: "You cannot access this resume." }, {
        status: 403,
      });
    }
  }

  if (new URL(request.url).searchParams.get("view") === "text") {
    if (!resume.extractedText) {
      return Response.json({ error: "Extracted resume text is unavailable." }, {
        status: 409,
      });
    }
    return new Response(resume.extractedText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(`${resume.fileName}.txt`)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const safeFileName = encodeURIComponent(resume.fileName);
  return new Response(Buffer.from(resume.content), {
    headers: {
      "Content-Type": resume.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${safeFileName}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/resumes/[id]">,
) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const { id } = await context.params;
  const result = await prisma.resume.deleteMany({
    where: { id, userId: candidate.id },
  });
  if (!result.count) {
    return Response.json({ error: "Resume not found." }, { status: 404 });
  }
  await prisma.candidateProfile.updateMany({
    where: { userId: candidate.id },
    data: { aiAnalysis: Prisma.DbNull, aiAnalyzedAt: null },
  });

  return Response.json({ deleted: true });
}
