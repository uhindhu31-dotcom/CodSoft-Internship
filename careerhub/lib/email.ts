export type EmailDelivery =
  | { status: "sent"; configured: true }
  | { status: "not_configured"; configured: false }
  | { status: "failed"; configured: true };

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character] ?? character;
  });
}

function emailTemplate(title: string, message: string, link?: { href: string; label: string }) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeLink = link
    ? `<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>`
    : "";
  return {
    text: `${title}\n\n${message}${link ? `\n\n${link.label}: ${link.href}` : ""}`,
    html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#172033"><h1>${safeTitle}</h1><p>${safeMessage}</p>${safeLink}<p style="color:#667085;font-size:12px">CareerHub</p></main>`,
  };
}

export async function sendTransactionalEmail(
  message: EmailMessage,
): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { status: "not_configured", configured: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...message }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Email delivery failed.", { status: response.status });
      return { status: "failed", configured: true };
    }
    return { status: "sent", configured: true };
  } catch (error) {
    console.error("Email delivery request failed.", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: "failed", configured: true };
  }
}

export function sendWelcomeEmail(name: string, email: string) {
  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const link = { href: `${origin}/dashboard`, label: "Open your dashboard" };
  return sendTransactionalEmail({
    to: email,
    subject: "Welcome to CareerHub",
    ...emailTemplate(`Welcome, ${name}`, "Your CareerHub account is ready.", link),
  });
}

export function sendApplicationNotificationEmail(
  recruiterEmail: string,
  candidateName: string,
  jobTitle: string,
) {
  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return sendTransactionalEmail({
    to: recruiterEmail,
    subject: `New application for ${jobTitle}`,
    ...emailTemplate(
      "A candidate applied",
      `${candidateName} submitted an application for ${jobTitle}.`,
      { href: `${origin}/dashboard`, label: "Review applicants" },
    ),
  });
}

export function sendApplicationStatusEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  status: "shortlisted" | "rejected" | "selected" | "interview",
  scheduledAt?: Date,
) {
  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const interviewDetails =
    status === "interview" && scheduledAt
      ? ` The interview is scheduled for ${scheduledAt.toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "UTC",
        })} UTC.`
      : "";
  const message =
    status === "shortlisted"
      ? `Your application for ${jobTitle} has been shortlisted.`
      : status === "rejected"
        ? `The hiring team has updated your application for ${jobTitle}.`
        : status === "selected"
          ? `The hiring team has selected you for ${jobTitle}.`
          : `An interview has been scheduled for your ${jobTitle} application.${interviewDetails}`;

  return sendTransactionalEmail({
    to: candidateEmail,
    subject:
      status === "interview"
        ? `Interview scheduled: ${jobTitle}`
        : `Application update: ${jobTitle}`,
    ...emailTemplate(
      `Hello, ${candidateName}`,
      message,
      { href: `${origin}/dashboard`, label: "View application status" },
    ),
  });
}
