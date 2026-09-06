import { env } from "@/lib/env";

const allowedEmails = new Set(env.allowedEmails);

export function isEmailAllowed(email: string | null | undefined) {
  if (!allowedEmails.size) {
    return false;
  }

  return typeof email === "string" && allowedEmails.has(email.toLowerCase());
}
