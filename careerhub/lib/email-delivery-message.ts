import type { EmailDelivery } from "@/lib/email";

export function emailDeliveryMessage(delivery: unknown) {
  const result =
    typeof delivery === "object" &&
    delivery !== null &&
    "emailDelivery" in delivery
      ? delivery.emailDelivery
      : delivery;
  if (
    typeof result !== "object" ||
    result === null ||
    !("status" in result) ||
    typeof result.status !== "string"
  ) {
    return "";
  }
  if (result.status === "not_configured") {
    return " Email notifications are not configured (set RESEND_API_KEY and EMAIL_FROM).";
  }
  if (result.status === "failed") {
    return " The change was saved, but the email could not be sent; check the email provider configuration and logs.";
  }
  return "";
}

export function emailDeliveryStatus(delivery: EmailDelivery) {
  return { status: delivery.status, configured: delivery.configured };
}
