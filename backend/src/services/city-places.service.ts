import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { findCityByName } from "@/common/city-lookup";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  photos?: Array<{ name?: string }>;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  editorialSummary?: { text?: string };
  priceLevel?: string;
  addressComponents?: Array<{ shortText?: string; types?: string[] }>;
};

type ResolvedCity = NonNullable<Awaited<ReturnType<typeof findCityByName>>>;

export type PlaceCategory = "sights" | "culture" | "nature" | "food" | "cafe";

const SEARCH_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const PLACE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.photos",
  "places.types",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
  "places.priceLevel",
].join(",");

// Searches run for every city, per category, and how many places each keeps
const CATEGORY_QUERIES: Array<{
  category: PlaceCategory;
  take: number;
  query: (city: string) => string;
}> = [
  {
    category: "sights",
    take: 6,
    query: (city) => `top tourist attractions in ${city} Morocco`,
  },
  {
    category: "culture",
    take: 5,
    query: (city) => `museums historic monuments and medina in ${city} Morocco`,
  },
  {
    category: "nature",
    take: 4,
    query: (city) => `parks gardens beaches and nature near ${city} Morocco`,
  },
  {
    category: "food",
    take: 5,
    query: (city) => `best traditional Moroccan restaurants in ${city}`,
  },
  {
    category: "cafe",
    take: 4,
    query: (city) => `coffee shop in ${city} Morocco`,
  },
];

/** The cities preloaded by "Load all cities"; users can still pick any other real Moroccan city */
export const MOROCCAN_CITIES = [
  "Marrakech",
  "Casablanca",
  "Fez",
  "Rabat",
  "Tangier",
  "Agadir",
  "Chefchaouen",
  "Essaouira",
  "Meknes",
  "Ouarzazate",
  "Merzouga",
  "Tetouan",
  "Ifrane",
  "Dakhla",
  "El Jadida",
  "Asilah",
  "Al Hoceima",
  "Saidia",
  "Oujda",
  "Nador",
  "Kenitra",
  "Sale",
  "Mohammedia",
  "Safi",
  "Taroudant",
  "Tiznit",
  "Errachidia",
  "Zagora",
  "Tinghir",
  "Azrou",
  "Beni Mellal",
  "Larache",
  "Martil",
  "M'diq",
  "Imlil",
  "Taghazout",
  "Sidi Ifni",
  "Laayoune",
  "Midelt",
  "Moulay Idriss Zerhoun",
  "Oualidia",
  "Mirleft",
];

// Rough price per person in DH from Google's price level (restaurants/cafés only)
const PRICE_LEVEL_DH: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE: 60,
  PRICE_LEVEL_MODERATE: 150,
  PRICE_LEVEL_EXPENSIVE: 300,
  PRICE_LEVEL_VERY_EXPENSIVE: 500,
};

const CITY_TYPES = new Set([
  "locality",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "postal_town",
]);

// Seed places that were assigned to the wrong city, keyed by slug
const SEED_PLACE_CITY: Record<string, string> = {
  "jemaa-el-fnaa": "marrakech",
  "koutoubia-mosque": "marrakech",
  "medina-of-fez": "fez",
  "blue-city-streets": "chefchaouen",
  "hassan-ii-mosque": "casablanca",
  "essaouira-beach": "essaouira",
  "ait-benhaddou-kasbah": "ouarzazate",
};

const SEED_PLACE_CATEGORY: Record<string, PlaceCategory> = {
  "jemaa-el-fnaa": "sights",
  "koutoubia-mosque": "culture",
  "medina-of-fez": "culture",
  "blue-city-streets": "sights",
  "hassan-ii-mosque": "culture",
  "essaouira-beach": "nature",
  "ait-benhaddou-kasbah": "culture",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Best guess for places saved before categories existed */
function categoryFromType(type?: string | null): PlaceCategory {
  const value = (type ?? "").toLowerCase();
  if (/caf|coffee|tea|bakery|pastry|patisserie/.test(value)) return "cafe";
  if (/restaurant|food|grill|bistro|diner|bar\b/.test(value)) return "food";
  if (
    /park|garden|beach|nature|mountain|lake|waterfall|hiking|desert|oasis|forest|valley/.test(
      value,
    )
  )
    return "nature";
  if (
    /museum|monument|historic|mosque|kasbah|palace|church|medina|gallery|heritage|cultural|religious|madrasa|fort/.test(
      value,
    )
  )
    return "culture";
  return "sights";
}

export type CitySyncStatus = {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  total: number;
  done: number;
  current: string | null;
  placesAdded: number;
  failed: string[];
};

/**
 * Makes any real Moroccan city usable: creates the City row on first use and
 * fills it with real Google places across sights, culture, nature, food and cafés.
 */
@Injectable()
export class CityPlacesService {
  private readonly logger = new Logger(CityPlacesService.name);
  private readonly inFlight = new Map<string, Promise<number>>();
  private syncStatus: CitySyncStatus = {
    running: false,
    startedAt: null,
    finishedAt: null,
    total: 0,
    done: 0,
    current: null,
    placesAdded: 0,
    failed: [],
  };

  constructor(private readonly prismaService: PrismaService) {}

  // The search key is the one allowed for server-side calls (others are browser-referrer locked)
  private get apiKey() {
    return (
      process.env.GOOGLE_PLACES_SEARCH_KEY ??
      process.env.GOOGLE_PLACES_API_KEY ??
      ""
    );
  }

  private photoUrl(photoName?: string) {
    if (!photoName || !this.apiKey) return null;
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&maxWidthPx=1400&key=${encodeURIComponent(this.apiKey)}`;
  }

  private async searchText(
    textQuery: string,
    maxResultCount: number,
    fields = PLACE_FIELDS,
  ) {
    if (!this.apiKey) return [];
    try {
      const response = await fetch(SEARCH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": fields,
        },
        body: JSON.stringify({
          textQuery,
          languageCode: "en",
          regionCode: "MA",
          maxResultCount,
        }),
      });
      if (!response.ok) {
        this.logger.warn(
          `Places search failed (${response.status}) for "${textQuery}"`,
        );
        return [];
      }
      const data = (await response.json()) as { places?: GooglePlace[] };
      return data.places ?? [];
    } catch (error) {
      this.logger.warn(`Places search error: ${String(error)}`);
      return [];
    }
  }

  /** Existing City row, or a new one when Google confirms the name is a real Moroccan city */
  async ensureCity(cityName: string): Promise<ResolvedCity | null> {
    const existing = await findCityByName(this.prismaService, cityName);
    if (existing) return existing;

    // Plain names work best ("Laayoune, Morocco" can return a different city)
    let match: GooglePlace | undefined;
    for (const query of [cityName, `${cityName}, Morocco`]) {
      [match] = await this.searchText(
        query,
        1,
        `${PLACE_FIELDS},places.addressComponents`,
      );
      if (match?.types?.some((type) => CITY_TYPES.has(type))) break;
    }
    const name = match?.displayName?.text?.trim();
    const isCity = match?.types?.some((type) => CITY_TYPES.has(type));
    // Southern provinces come back as "EH" or with no country; searches are already limited to Morocco
    const country = match?.addressComponents?.find((part) =>
      part.types?.includes("country"),
    )?.shortText;
    const inMorocco = !country || ["MA", "EH"].includes(country);
    // Guards against near-misses such as a neighbourhood that shares the name
    const wanted = slugify(cityName);
    const found = slugify(name ?? "");
    const sameName =
      Boolean(found) && (found.includes(wanted) || wanted.includes(found));
    if (!match || !name || !isCity || !inMorocco || !sameName) return null;

    const sameCity = await findCityByName(this.prismaService, name);
    if (sameCity) return sameCity;

    const region = await this.prismaService.region.findFirst({
      orderBy: { name: "asc" },
      select: { id: true },
    });
    if (!region) return null;

    const slug = slugify(name);
    return this.prismaService.city.upsert({
      where: { slug },
      update: {},
      create: {
        regionId: region.id,
        name,
        slug,
        lat: match.location?.latitude,
        lng: match.location?.longitude,
        coverImage: this.photoUrl(match.photos?.[0]?.name),
        description: `${name}, Morocco`,
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

  /** Adds real Google places for every category the city is still missing; returns how many were added */
  ensurePlaces(city: { id: string; name: string }) {
    const running = this.inFlight.get(city.id);
    if (running) return running;
    const task = this.fillCity(city).finally(() =>
      this.inFlight.delete(city.id),
    );
    this.inFlight.set(city.id, task);
    return task;
  }

  private async fillCity(city: { id: string; name: string }) {
    const counts = await this.prismaService.attraction.groupBy({
      by: ["category"],
      where: { cityId: city.id },
      _count: { _all: true },
    });
    const have = new Map(
      counts.map((entry) => [entry.category, entry._count._all]),
    );
    // Untagged places count toward "sights" so older rows don't trigger a refill
    const missing = CATEGORY_QUERIES.filter(({ category, take }) => {
      const count =
        (have.get(category) ?? 0) +
        (category === "sights" ? (have.get(null) ?? 0) : 0);
      return count < Math.ceil(take / 2);
    });
    if (!missing.length) return 0;

    const results = await Promise.all(
      missing.map(async ({ category, take, query }) => ({
        category,
        places: await this.searchText(query(city.name), take),
      })),
    );

    const seen = new Set<string>();
    const rows = results.flatMap(({ category, places }) =>
      places.flatMap((place) => {
        const name = place.displayName?.text?.trim();
        if (!place.id || !name || seen.has(place.id)) return [];
        seen.add(place.id);
        return [
          {
            cityId: city.id,
            name,
            slug: `g-${place.id}`,
            category,
            type: place.primaryTypeDisplayName?.text ?? "Attraction",
            lat: place.location?.latitude,
            lng: place.location?.longitude,
            description: place.editorialSummary?.text ?? place.formattedAddress,
            avgPrice: place.priceLevel
              ? PRICE_LEVEL_DH[place.priceLevel]
              : undefined,
            coverImage: this.photoUrl(place.photos?.[0]?.name),
          },
        ];
      }),
    );
    if (!rows.length) return 0;

    const { count } = await this.prismaService.attraction.createMany({
      data: rows,
      skipDuplicates: true,
    });
    if (count) this.logger.log(`Added ${count} Google places to ${city.name}`);
    return count;
  }

  /** Removes the fake seeded places, puts real seeded ones in their own city and tags old rows with a category */
  async cleanupSeedPlaces() {
    const removed = await this.prismaService.attraction.deleteMany({
      where: { coverImage: { contains: "picsum.photos" } },
    });

    for (const [slug, citySlug] of Object.entries(SEED_PLACE_CITY)) {
      const city = await this.prismaService.city.findUnique({
        where: { slug: citySlug },
        select: { id: true },
      });
      if (city) {
        await this.prismaService.attraction.updateMany({
          where: { slug },
          data: { cityId: city.id, category: SEED_PLACE_CATEGORY[slug] },
        });
      }
    }

    const untagged = await this.prismaService.attraction.findMany({
      where: { category: null },
      select: { id: true, type: true },
    });
    for (const place of untagged) {
      await this.prismaService.attraction.update({
        where: { id: place.id },
        data: { category: categoryFromType(place.type) },
      });
    }

    return { removedFake: removed.count, tagged: untagged.length };
  }

  getSyncStatus() {
    return this.syncStatus;
  }

  /** Starts loading every city in MOROCCAN_CITIES in the background; returns immediately */
  startSyncAll() {
    if (this.syncStatus.running) return this.syncStatus;
    this.syncStatus = {
      running: true,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      total: MOROCCAN_CITIES.length,
      done: 0,
      current: null,
      placesAdded: 0,
      failed: [],
    };
    void this.runSyncAll();
    return this.syncStatus;
  }

  private async runSyncAll() {
    try {
      await this.cleanupSeedPlaces();
      for (const name of MOROCCAN_CITIES) {
        this.syncStatus.current = name;
        try {
          const city = await this.ensureCity(name);
          if (city)
            this.syncStatus.placesAdded += await this.ensurePlaces(city);
          else this.syncStatus.failed.push(name);
        } catch (error) {
          this.logger.warn(`City sync failed for ${name}: ${String(error)}`);
          this.syncStatus.failed.push(name);
        }
        this.syncStatus.done += 1;
      }
    } finally {
      this.syncStatus.running = false;
      this.syncStatus.current = null;
      this.syncStatus.finishedAt = new Date().toISOString();
      this.logger.log(
        `City sync finished: ${this.syncStatus.placesAdded} places added, ${this.syncStatus.failed.length} failed`,
      );
    }
  }

  /** Cities with how many places they hold, for the admin */
  async listCityCoverage() {
    const cities = await this.prismaService.city.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        coverImage: true,
        _count: { select: { attractions: true } },
      },
    });
    return cities.map(({ _count, ...city }) => ({
      ...city,
      places: _count.attractions,
    }));
  }
}
