import type { PlanTier } from "@prisma/client";

export type PlanSnapshot = { plan: PlanTier; premiumUntil: Date | null };

const DAY_MS = 86_400_000;

/** PREMIUM with no end date never expires; otherwise it lasts until premiumUntil */
export function isPremiumActive(user: PlanSnapshot, now = new Date()) {
  if (user.plan !== "PREMIUM") return false;
  return !user.premiumUntil || user.premiumUntil > now;
}

export function describePlan(user: PlanSnapshot, now = new Date()) {
  const active = isPremiumActive(user, now);
  return {
    plan: active ? ("PREMIUM" as const) : ("FREE" as const),
    isPremium: active,
    premiumUntil: active ? user.premiumUntil : null,
    expired: user.plan === "PREMIUM" && !active,
    daysLeft:
      active && user.premiumUntil
        ? Math.ceil((user.premiumUntil.getTime() - now.getTime()) / DAY_MS)
        : null,
  };
}

/** New end date when adding days on top of whatever Premium time is left */
export function extendPremium(
  user: PlanSnapshot,
  days: number,
  now = new Date(),
) {
  const start =
    isPremiumActive(user, now) && user.premiumUntil ? user.premiumUntil : now;
  return new Date(start.getTime() + days * DAY_MS);
}
