import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const auth = betterAuth({
  appName: "CareerHub",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "candidate",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            role: adminEmails.has(user.email.toLowerCase())
              ? "admin"
              : "candidate",
          },
        }),
        after: async (user) => {
          const delivery = await sendWelcomeEmail(user.name, user.email);
          if (delivery.status === "failed") {
            console.error("Welcome email was not delivered.");
          }
        },
      },
    },
  },
});
