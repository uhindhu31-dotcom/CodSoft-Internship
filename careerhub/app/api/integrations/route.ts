import { connection } from "next/server";
import { isAIConfigured } from "@/lib/ai-resume";
import { isEmailConfigured } from "@/lib/email";

export async function GET() {
  await connection();
  return Response.json({
    ai: {
      configured: isAIConfigured(),
      provider: "OpenAI",
      configuration: "Set OPENAI_API_KEY to enable AI resume analysis and job matching.",
    },
    email: {
      configured: isEmailConfigured(),
      provider: "Resend",
      configuration: "Set RESEND_API_KEY and EMAIL_FROM to enable email notifications.",
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
