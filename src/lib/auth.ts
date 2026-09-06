import { APIError } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { betterAuth } from "better-auth";

import { env } from "@/lib/env";
import { isEmailAllowed } from "@/lib/auth/access";
import { getMongoClient } from "@/lib/db/mongodb";

export const auth = betterAuth({
  appName: "Circle PRM",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(getMongoClient().db()),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          if (!isEmailAllowed(user.email)) {
            throw APIError.from("FORBIDDEN", {
              message: "This Google account is not allowed to access Circle PRM.",
              code: "EMAIL_NOT_ALLOWED",
            });
          }

          return { data: user };
        },
      },
    },
  },
  trustedOrigins: [env.BETTER_AUTH_URL],
});
