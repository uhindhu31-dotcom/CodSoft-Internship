
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
  modelName: "user",
  additionalFields: {
    role: {
      type: "string",
      required: false,
      defaultValue: "STUDENT",
      input: false,
    },
  },
},

  advanced: {
    database: {
      generateId: ({ model }) => {
        if (model === "user") {
          return false;
        }

        return crypto.randomUUID();
      },
    },
  },
});
