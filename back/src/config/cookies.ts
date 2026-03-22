import { env } from "./env";

export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  domain: env.NODE_ENV === "production" ? env.COOKIE_DOMAIN : undefined,
  path: "/",
};