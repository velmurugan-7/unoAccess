import { Response, Request } from "express";

const MAX_ACCOUNTS = 5;

export function getRecentAccounts(req: Request): string[] {
  try {
    const raw = req.cookies?.recent_accounts;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ACCOUNTS) : [];
  } catch {
    return [];
  }
}

export function setRecentAccounts(res: Response, email: string, existing: string[]) {
  const updated = [
    email,
    ...existing.filter(e => e !== email),
  ].slice(0, MAX_ACCOUNTS);

  res.cookie("recent_accounts", JSON.stringify(updated), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });
}