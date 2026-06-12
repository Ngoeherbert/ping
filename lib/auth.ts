import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

let authInstance: any;

// Detect if we are executing within a client-side mobile environment
const isClient =
  typeof window !== "undefined" ||
  process.env.EXPO_OS === "ios" ||
  process.env.EXPO_OS === "android";

if (isClient) {
  // Feed Metro a hollow placeholder so it bundles without executing server-only logic
  authInstance = {} as any;
} else {
  authInstance = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),

    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      async sendResetPassword({ user, url }) {
        // TODO: integrate email provider (Resend, Nodemailer, etc.)
        console.log(`Password reset link for ${user.email}: ${url}`);
      },
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },

    user: {
      additionalFields: {
        username: {
          type: "string",
          required: false,
          defaultValue: "",
          input: true,
        },
        avatarUrl: {
          type: "string",
          required: false,
          input: false,
        },
        bio: {
          type: "string",
          required: false,
          input: false,
        },
        isVerified: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
  });
}

export const auth = authInstance;
export type Auth = typeof auth;
