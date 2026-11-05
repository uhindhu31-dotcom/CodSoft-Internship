import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { ResumeParseError, extractResumeText } from "@/lib/resume-parser";

const maxResumeSize = 5 * 1024 * 1024;
type ResumeMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain";
const allowedResumeTypes = new Map<string, { extension: string; mimeType: ResumeMimeType }>([
  ["application/pdf", { extension: ".pdf", mimeType: "application/pdf" }],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    {
      extension: ".docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  ],
  ["text/plain", { extension: ".txt", mimeType: "text/plain" }],
]);

export async function GET(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const resumes = await prisma.resume.findMany({
    where: { userId: candidate.id },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ resumes });
}

export async function POST(request: Request) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Select a PDF, DOCX, or TXT resume to upload." }, {
      status: 400,
    });
  }

  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  const fileType = allowedResumeTypes.get(file.type);
  if (
    file.size < 1 ||
    file.size > maxResumeSize ||
    !fileType ||
    fileType.extension !== extension
  ) {
    return Response.json({
      error: "Resume must be a PDF, DOCX, or TXT file no larger than 5 MB.",
    }, { status: 400 });
  }

  const content = Buffer.from(await file.arrayBuffer());
  let extractedText: string;
  try {
    extractedText = await extractResumeText(
      fileType.mimeType,
      content,
    );
  } catch (error) {
    if (!(error instanceof ResumeParseError)) throw error;
    return Response.json({ error: error.message }, { status: 400 });
  }

  const fileName = file.name
    .replace(/[\u0000-\u001f\u007f/\\]/g, "_")
    .trim()
    .slice(0, 255);
  if (!fileName) {
    return Response.json({ error: "Resume file name is invalid." }, { status: 400 });
  }

  const resume = await prisma.$transaction(async (transaction) => {
    const created = await transaction.resume.create({
      data: {
        userId: candidate.id,
        fileName,
        mimeType: fileType.mimeType,
        fileSize: file.size,
        content,
        extractedText,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
      },
    });
    await transaction.candidateProfile.updateMany({
      where: { userId: candidate.id },
      data: { aiAnalysis: Prisma.DbNull, aiAnalyzedAt: null },
    });
    return created;
  });

  return Response.json({ resume }, { status: 201 });
}
