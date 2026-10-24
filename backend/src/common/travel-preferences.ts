import { Prisma } from "@prisma/client";

export type TravelPreferences = {
  city: string;
  durationDays: number;
  budgetDh: number | null;
  adults: number;
  children: number;
  interests: string[];
};

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** User.preferences is shared (liked places, account settings, gamification); travel choices live under `travel` */
export function readTravelPreferences(
  value: Prisma.JsonValue | null,
): TravelPreferences | null {
  const raw = asRecord(asRecord(value).travel);
  if (typeof raw.city !== "string" || !raw.city.trim()) return null;
  return {
    city: raw.city,
    durationDays: Number(raw.durationDays) || 3,
    budgetDh: raw.budgetDh == null ? null : Number(raw.budgetDh),
    adults: Number(raw.adults) || 1,
    children: Number(raw.children) || 0,
    interests: Array.isArray(raw.interests)
      ? raw.interests.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
  };
}
