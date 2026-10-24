import { PrismaService } from "@/prisma/prisma.service";

// Planner/UI spellings that differ from the seeded City names/slugs
const CITY_ALIASES: Record<string, string> = {
  fes: "fez",
  fès: "fez",
  marrakesh: "marrakech",
  tanger: "tangier",
  meknès: "meknes",
};

/** Resolve a free-text city name ("Fes", "casablanca") to a City row, or null */
export function findCityByName(prisma: PrismaService, cityName: string) {
  const trimmed = cityName.trim();
  const normalized = trimmed.toLowerCase();
  const slug = CITY_ALIASES[normalized] ?? normalized;
  return prisma.city.findFirst({
    where: {
      OR: [{ slug }, { name: { equals: trimmed, mode: "insensitive" } }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
    },
  });
}
