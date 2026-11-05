import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { sendApplicationStatusEmail } from "@/lib/email";
import { emailDeliveryStatus } from "@/lib/email-delivery-message";

const applicationStatuses = new Set([
  "shortlisted",
  "rejected",
  "selected",
  "interview",
]);

type ApplicationStatus = "shortlisted" | "rejected" | "selected" | "interview";

function isApplicationStatus(value: string): value is ApplicationStatus {
  return applicationStatuses.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/recruiter/applications/[id]">,
) {
  const recruiter = await requireRole(request, ["recruiter"]);
  if (recruiter instanceof Response) return recruiter;

  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return Response.json({ error: "Application status is invalid." }, { status: 400 });
  }
  const status = typeof body.status === "string" ? body.status : null;
  if (!status || !isApplicationStatus(status)) {
    return Response.json({ error: "Application status is invalid." }, { status: 400 });
  }

  const application = await prisma.jobApplication.findFirst({
    where: { id, job: { company: { recruiterId: recruiter.id } } },
    include: {
      job: { select: { title: true } },
      candidate: { select: { name: true, email: true } },
    },
  });
  if (!application) {
    return Response.json({ error: "Application not found." }, { status: 404 });
  }

  let scheduledAt: Date | undefined;
  if (status === "interview") {
    const rawDate = body.scheduledAt;
    scheduledAt =
      typeof rawDate === "string" ? new Date(rawDate) : new Date(Number.NaN);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      return Response.json({ error: "Choose an interview time in the future." }, {
        status: 400,
      });
    }
  }

  const meetingUrl =
    typeof body.meetingUrl === "string"
      ? body.meetingUrl.trim()
      : null;
  if (
    meetingUrl &&
    (!URL.canParse(meetingUrl) ||
      !["http:", "https:"].includes(new URL(meetingUrl).protocol))
  ) {
    return Response.json({ error: "Interview links must use HTTP or HTTPS." }, {
      status: 400,
    });
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.jobApplication.update({
      where: { id: application.id },
      data: { status },
    });
    await transaction.applicationStatusEvent.create({
      data: {
        applicationId: application.id,
        status,
        note:
          status === "interview" && scheduledAt
            ? `Interview scheduled for ${scheduledAt.toISOString()}.`
            : null,
      },
    });
    if (status === "interview" && scheduledAt) {
      await transaction.interview.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
          scheduledAt,
          meetingUrl,
        },
        update: { scheduledAt, meetingUrl, status: "scheduled" },
      });
    }
    await transaction.notification.create({
      data: {
        userId: application.candidateId,
        title: "Application update",
        message:
          status === "interview"
            ? `An interview for ${application.job.title} has been scheduled.`
            : `Your application for ${application.job.title} is now ${status}.`,
      },
    });
    return result;
  });

  const emailDelivery = await sendApplicationStatusEmail(
    application.candidate.email,
    application.candidate.name,
    application.job.title,
    status,
    scheduledAt,
  );
  return Response.json({
    application: updated,
    emailDelivery: emailDeliveryStatus(emailDelivery),
  });
}
