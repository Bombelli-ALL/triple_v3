import type { TripSwipeItem, TripType } from '@/types/match'

/* ── helpers ── */
function norm(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function tokenize(input: string): string[] {
  return norm(input).split(/[\s,;.!?]+/).filter(Boolean)
}

/* ── synonym map: keyword → trip types + related tags ── */
const KEYWORD_MAP: Record<string, { types: TripType[]; tags: string[] }> = {
  // food & dining
  cafe: { types: ['food', 'city-break'], tags: ['cafe', 'coffee', 'restaurant', 'brunch', 'design cafes'] },
  koffee: { types: ['food', 'city-break'], tags: ['cafe', 'coffee', 'design cafes'] },
  coffee: { types: ['food', 'city-break'], tags: ['cafe', 'coffee', 'design cafes'] },
  restaurant: { types: ['food'], tags: ['restaurant', 'dining', 'street food', 'seafood'] },
  restuarant: { types: ['food'], tags: ['restaurant', 'dining', 'street food', 'seafood'] },
  resutarnt: { types: ['food'], tags: ['restaurant', 'dining', 'street food', 'seafood'] },
  food: { types: ['food'], tags: ['street food', 'cooking class', 'markets', 'seafood'] },
  eat: { types: ['food'], tags: ['street food', 'cooking class', 'seafood'] },
  taste: { types: ['food'], tags: ['street food', 'cooking class', 'markets'] },
  gastro: { types: ['food'], tags: ['cooking class', 'markets', 'street food'] },
  cook: { types: ['food'], tags: ['cooking class'] },
  seafood: { types: ['food', 'beach'], tags: ['seafood'] },
  brunch: { types: ['food', 'city-break'], tags: ['cafe', 'brunch'] },

  // stay & hospitality
  hotel: { types: ['city-break', 'culture'], tags: ['guesthouse', 'rooftop', 'hammam'] },
  hostel: { types: ['city-break'], tags: ['guesthouse', 'social'] },
  riad: { types: ['culture', 'city-break'], tags: ['guesthouse', 'rooftop'] },
  stay: { types: ['city-break', 'culture'], tags: ['guesthouse', 'rooftop'] },
  resort: { types: ['beach', 'nature'], tags: ['hammam', 'marina'] },

  // beach & water
  beach: { types: ['beach'], tags: ['beach', 'surf', 'ocean walks', 'marina'] },
  surf: { types: ['beach', 'adventure'], tags: ['surf', 'beach'] },
  ocean: { types: ['beach'], tags: ['ocean walks', 'beach'] },
  sea: { types: ['beach'], tags: ['beach', 'marina', 'ocean walks'] },
  coast: { types: ['beach'], tags: ['beach', 'ocean walks'] },
  marina: { types: ['beach', 'city-break'], tags: ['marina'] },
  swim: { types: ['beach'], tags: ['beach'] },

  // culture & heritage
  culture: { types: ['culture'], tags: ['medina', 'museums', 'kasbah', 'guided tours', 'heritage'] },
  heritage: { types: ['culture'], tags: ['kasbah', 'museums', 'heritage'] },
  medina: { types: ['culture'], tags: ['medina', 'souk'] },
  museum: { types: ['culture'], tags: ['museums'] },
  history: { types: ['culture'], tags: ['museums', 'kasbah', 'heritage'] },
  art: { types: ['culture', 'city-break'], tags: ['museums', 'design cafes'] },
  souk: { types: ['culture', 'city-break'], tags: ['souk', 'markets', 'medina'] },
  market: { types: ['culture', 'food'], tags: ['souk', 'markets', 'medina'] },
  kasbah: { types: ['culture'], tags: ['kasbah'] },

  // nature
  nature: { types: ['nature'], tags: ['hiking', 'forest', 'mountain views'] },
  mountain: { types: ['nature', 'adventure'], tags: ['mountain views', 'hiking'] },
  forest: { types: ['nature'], tags: ['forest', 'hiking'] },
  hike: { types: ['nature', 'adventure'], tags: ['hiking'] },
  hiking: { types: ['nature', 'adventure'], tags: ['hiking'] },
  lake: { types: ['nature'], tags: ['hiking', 'forest'] },
  relax: { types: ['nature', 'beach'], tags: ['hammam', 'slow travel'] },
  chill: { types: ['nature', 'beach'], tags: ['slow travel', 'hammam'] },
  quiet: { types: ['nature'], tags: ['slow travel', 'guesthouse'] },
  hammam: { types: ['nature', 'culture'], tags: ['hammam'] },
  spa: { types: ['nature'], tags: ['hammam'] },

  // adventure
  adventure: { types: ['adventure'], tags: ['dunes', 'camel trek', 'camp'] },
  desert: { types: ['adventure'], tags: ['dunes', 'camel trek', 'camp'] },
  camel: { types: ['adventure'], tags: ['camel trek', 'dunes'] },
  trek: { types: ['adventure', 'nature'], tags: ['camel trek', 'hiking'] },
  camp: { types: ['adventure'], tags: ['camp', 'dunes'] },
  star: { types: ['adventure'], tags: ['camp', 'dunes'] },
  stargazing: { types: ['adventure'], tags: ['camp'] },
  dune: { types: ['adventure'], tags: ['dunes', 'camel trek'] },
  safari: { types: ['adventure'], tags: ['dunes', 'camel trek'] },

  // city & urban
  city: { types: ['city-break'], tags: ['souk', 'nightlife', 'design cafes', 'cafe crawl'] },
  urban: { types: ['city-break'], tags: ['nightlife', 'design cafes'] },
  nightlife: { types: ['city-break'], tags: ['nightlife'] },
  night: { types: ['city-break'], tags: ['nightlife'] },
  shopping: { types: ['city-break', 'culture'], tags: ['souk', 'markets'] },
  rooftop: { types: ['culture', 'city-break'], tags: ['rooftop'] },
  sunset: { types: ['beach', 'nature', 'culture'], tags: ['sunset', 'bay view'] },
  view: { types: ['nature', 'beach'], tags: ['mountain views', 'bay view'] },
  photo: { types: ['nature', 'culture'], tags: ['mountain views', 'medina'] },
  photography: { types: ['nature', 'culture'], tags: ['mountain views', 'medina'] },
  mountains: { types: ['nature', 'adventure'], tags: ['mountain views', 'hiking'] },
}

/* ── city aliases ── */
const CITY_ALIASES: Record<string, string> = {
  fez: 'Fez', fes: 'Fez', fas: 'Fez',
  meknes: 'Meknes', meknas: 'Meknes',
  tangier: 'Tangier', tanger: 'Tangier', tanja: 'Tangier',
  marrakech: 'Marrakech', marrakesh: 'Marrakech',
  agadir: 'Agadir',
  essaouira: 'Essaouira', souira: 'Essaouira',
  rabat: 'Rabat',
  chefchaouen: 'Chefchaouen', chaouen: 'Chefchaouen',
  merzouga: 'Merzouga',
  azrou: 'Azrou',
  casablanca: 'Casablanca', casa: 'Casablanca',
}

export function normalizeCity(input: string): string | null {
  for (const token of tokenize(input)) {
    if (CITY_ALIASES[token]) return CITY_ALIASES[token]
  }
  return null
}

export function normalizeTripType(input: string): TripType | null {
  const value = norm(input)
  if (value.includes('city') || value.includes('urban')) return 'city-break'
  if (value.includes('culture') || value.includes('heritage') || value.includes('medina')) return 'culture'
  if (value.includes('food') || value.includes('restaurant') || value.includes('taste')) return 'food'
  if (value.includes('nature') || value.includes('forest') || value.includes('mountain')) return 'nature'
  if (value.includes('beach') || value.includes('coast') || value.includes('sea')) return 'beach'
  if (value.includes('adventure') || value.includes('desert') || value.includes('trek')) return 'adventure'
  return null
}

/**
 * Smart fuzzy scoring: score each trip against the query.
 * Higher score = better match. Returns 0 if no relevance at all.
 */
export function scoreTripForQuery(trip: TripSwipeItem, query: string): number {
  const tokens = tokenize(query)
  if (tokens.length === 0) return 1 // no query = show everything equally

  let score = 0
  const tripText = norm(`${trip.title} ${trip.description} ${trip.city} ${trip.country} ${trip.tags.join(' ')} ${trip.vibes.join(' ')} ${trip.tripType}`)

  for (const token of tokens) {
    // 1. Direct text match
    if (tripText.includes(token)) score += 3

    // 2. City match (high priority)
    const cityMatch = CITY_ALIASES[token]
    if (cityMatch && trip.city === cityMatch) score += 10

    // 3. Keyword synonym matching
    const mapping = KEYWORD_MAP[token]
    if (mapping) {
      // Type match
      if (mapping.types.includes(trip.tripType)) score += 5

      // Tag match (fuzzy)
      for (const tag of mapping.tags) {
        if (trip.tags.some(t => norm(t).includes(tag))) score += 2
        if (trip.vibes.some(v => norm(v).includes(tag))) score += 1
      }
    }

    // 4. Partial word match in title
    if (norm(trip.title).includes(token)) score += 2

    // 5. Tag partial match
    if (trip.tags.some(t => norm(t).includes(token))) score += 2
  }

  // Bonus for high-rated trips
  if (score > 0 && trip.rating >= 4.7) score += 1

  return score
}

/**
 * Main search function: returns true if trip is relevant to query.
 * Uses smart scoring with a minimum threshold.
 */
export function matchesTripSearch(trip: TripSwipeItem, query: string): boolean {
  return scoreTripForQuery(trip, query) >= 3
}

/**
 * Sort trips by relevance to search query (best matches first).
 */
export function sortByRelevance(trips: TripSwipeItem[], query: string): TripSwipeItem[] {
  if (!query.trim()) return trips

  const scored = trips.map(trip => ({
    trip,
    score: scoreTripForQuery(trip, query),
  }))

  return scored
    .filter(s => s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .map(s => s.trip)
}
