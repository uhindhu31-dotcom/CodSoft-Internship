import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import {
  sendApplicationNotificationEmail,
} from "@/lib/email";
import { emailDeliveryStatus } from "@/lib/email-delivery-message";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/jobs/[id]/apply">,
) {
  const candidate = await requireRole(request, ["candidate"]);
  if (candidate instanceof Response) return candidate;

  const { id: jobId } = await context.params;
  const body: unknown = await request.json().catch(() => ({}));
  if (!isRecord(body)) {
    return Response.json({ error: "Application details are invalid." }, { status: 400 });
  }

  const coverLetter =
    typeof body.coverLetter === "string" ? body.coverLetter.trim() : null;
  const resumeId = typeof body.resumeId === "string" ? body.resumeId : null;

  if (coverLetter && coverLetter.length > 5000) {
    return Response.json({ error: "Cover letters must be under 5,000 characters." }, {
      status: 400,
    });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: "approved" },
    select: {
      id: true,
      title: true,
      company: {
        select: {
          recruiterId: true,
          recruiter: { select: { email: true } },
        },
      },
    },
  });
  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  if (resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: candidate.id },
      select: { id: true },
    });
    if (!resume) {
      return Response.json({ error: "Resume not found." }, { status: 404 });
    }
  }

  const existingApplication = await prisma.jobApplication.findUnique({
    where: { jobId_candidateId: { jobId, candidateId: candidate.id } },
    select: { id: true },
  });
  if (existingApplication) {
    return Response.json({ error: "You have already applied for this job." }, {
      status: 409,
    });
  }

  const application = await prisma.$transaction(async (transaction) => {
    const created = await transaction.jobApplication.create({
      data: { jobId, candidateId: candidate.id, coverLetter, resumeId },
    });
    await transaction.applicationStatusEvent.create({
      data: { applicationId: created.id, status: "applied" },
    });
    await transaction.notification.create({
      data: {
        userId: job.company.recruiterId,
        title: "New job application",
        message: `${candidate.name} applied for ${job.title}.`,
      },
    });
    return created;
  });

  const emailDelivery = await sendApplicationNotificationEmail(
    job.company.recruiter.email,
    candidate.name,
    job.title,
  );
  return Response.json(
    { application, emailDelivery: emailDeliveryStatus(emailDelivery) },
    { status: 201 },
  );
}
