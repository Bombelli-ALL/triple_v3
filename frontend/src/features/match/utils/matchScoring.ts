import type { HeroPromptContext, TripSwipeItem } from '@/types/match'

export function scoreTrip(trip: TripSwipeItem, context: HeroPromptContext | null) {
  if (!context) return 0

  let score = 0
  const prefs = context.preferences
  const city = context.city?.trim()

  if (city && trip.city.toLowerCase() === city.toLowerCase()) score += 4
  if (context.category === 'trip' || context.category === 'general') score += 2
  if (prefs?.budget && trip.budget === prefs.budget) score += 3
  if (prefs?.atmosphere && trip.vibes.includes(prefs.atmosphere)) score += 3
  if (prefs?.style && trip.tags.some((tag) => tag.toLowerCase() === prefs.style?.toLowerCase())) score += 2
  if (prefs?.wifi === 'yes' && trip.wifi) score += 2
  if (prefs?.wifi === 'no') score += 1
  if (context.durationDays && Math.abs(trip.durationDays - context.durationDays) <= 1) score += 2
  if (trip.rating >= 4.7) score += 1

  return score
}

export function matchesBaseIntent(trip: TripSwipeItem, context: HeroPromptContext | null) {
  if (!context) return true
  if (!context.city) return true
  return trip.city.toLowerCase() === context.city.toLowerCase()
}

export function matchesPreferences(trip: TripSwipeItem, context: HeroPromptContext | null) {
  if (!context?.preferences) return true

  const prefs = context.preferences

  if (prefs.budget && trip.budget !== prefs.budget) return false
  if (prefs.atmosphere && !trip.vibes.includes(prefs.atmosphere)) return false
  if (prefs.wifi === 'yes' && !trip.wifi) return false

  return true
}

export function getMatchedTrips(
  allTrips: TripSwipeItem[],
  context: HeroPromptContext | null,
  strictFilters: boolean,
) {
  const baseMatches = allTrips.filter((trip) => matchesBaseIntent(trip, context))
  const source = baseMatches.length ? baseMatches : allTrips
  const filtered = strictFilters ? source.filter((trip) => matchesPreferences(trip, context)) : source
  const finalSource = filtered.length ? filtered : source

  return [...finalSource].sort((a, b) => scoreTrip(b, context) - scoreTrip(a, context))
}

export function getActiveFilterChips(context: HeroPromptContext | null) {
  if (!context?.preferences) return []

  const chips: string[] = []
  if (context.preferences.budget) chips.push(`Budget: ${context.preferences.budget}`)
  if (context.preferences.atmosphere) chips.push(`Atmosphere: ${context.preferences.atmosphere}`)
  if (context.preferences.style) chips.push(`Style: ${context.preferences.style}`)
  if (context.preferences.wifi === 'yes') chips.push('Wi-Fi required')
  if (context.durationDays) chips.push(`Duration: ~${context.durationDays} days`)

  return chips
}

