// import { env } from "./env";

// export const cookieOptions = {
//   httpOnly: true,
//   secure: env.NODE_ENV === "production",
//   sameSite: "lax" as const,
//   domain: env.NODE_ENV === "production" ? env.COOKIE_DOMAIN : undefined,
//   path: "/",
// };

import { config } from './env';

export const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  // sameSite: 'lax' as const,
  sameSite: config.isProduction ? 'none' as const : 'lax' as const,
  // domain: config.isProduction ? process.env.COOKIE_DOMAIN : undefined,
  path: '/',
};