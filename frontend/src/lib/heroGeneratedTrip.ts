import type { DemoTrip } from '@/pages/user/types'

export const HERO_GENERATED_TRIP_KEY = 'heroGeneratedTrip'
export const HERO_PENDING_MAP_OPEN_KEY = 'heroPendingMapOpen'
export const HERO_AGENT_FOLLOWUP_KEY = 'heroAgentFollowup'
export const HERO_LATEST_TRIP_ID_KEY = 'heroLatestTripId'
export const HERO_PLANNER_REQUEST_KEY = 'heroPlannerRequest'
export const HERO_PLANNER_RESULT_KEY = 'heroPlannerResult'
export const HERO_AGENT_NOTICE_KEY = 'heroAgentNotice'
export const HERO_POST_LOGIN_ROUTE_KEY = 'heroPostLoginRoute'
export const HERO_PROMPT_CONTEXT_KEY = 'heroPromptContext'

export type StoredHeroGeneratedTrip<TPlan = unknown> = {
  id: string
  createdAt: string
  plan: TPlan
  mapTrip: DemoTrip
}

function hasWindow() {
  return typeof window !== 'undefined'
}

export function writeHeroStorage(key: string, value: string) {
  if (!hasWindow()) return
  window.sessionStorage.setItem(key, value)
  window.localStorage.setItem(key, value)
}

export function readHeroStorage(key: string) {
  if (!hasWindow()) return null
  const fromSession = window.sessionStorage.getItem(key)
  if (fromSession != null) return fromSession
  const fromLocal = window.localStorage.getItem(key)
  if (fromLocal != null) {
    window.sessionStorage.setItem(key, fromLocal)
  }
  return fromLocal
}

export function removeHeroStorage(key: string) {
  if (!hasWindow()) return
  window.sessionStorage.removeItem(key)
  window.localStorage.removeItem(key)
}

/** Forget the previous user's planner state so the next login starts from their own account */
export function clearHeroSession() {
  ;[
    HERO_GENERATED_TRIP_KEY,
    HERO_PENDING_MAP_OPEN_KEY,
    HERO_AGENT_FOLLOWUP_KEY,
    HERO_LATEST_TRIP_ID_KEY,
    HERO_PLANNER_REQUEST_KEY,
    HERO_PLANNER_RESULT_KEY,
    HERO_AGENT_NOTICE_KEY,
    HERO_POST_LOGIN_ROUTE_KEY,
    HERO_PROMPT_CONTEXT_KEY,
  ].forEach(removeHeroStorage)
}

export function buildHeroGeneratedTripId(city: string) {
  const slug = city
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `hero-${slug || 'trip'}-${Date.now()}`
}

export function saveHeroGeneratedTrip<TPlan>(trip: StoredHeroGeneratedTrip<TPlan>) {
  writeHeroStorage(HERO_GENERATED_TRIP_KEY, JSON.stringify(trip))
}

export function readHeroGeneratedTrip<TPlan = unknown>(tripId?: string | null) {
  const raw = readHeroStorage(HERO_GENERATED_TRIP_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredHeroGeneratedTrip<TPlan>
    if (tripId && parsed.id !== tripId) return null
    return parsed
  } catch {
    return null
  }
}

export function clearHeroGeneratedTrip(tripId?: string | null) {
  const existing = readHeroGeneratedTrip(tripId)
  if (!existing) return
  removeHeroStorage(HERO_GENERATED_TRIP_KEY)
}

type HeroPlanLikeDay = {
  day?: number
  title?: string
  hotel?: unknown
  stops?: unknown[]
}

type HeroPlanLike = {
  city?: string
  durationDays?: number
  totalEstimate?: string
  days?: HeroPlanLikeDay[]
}

export function buildHeroGeneratedTripFollowup<TPlan = HeroPlanLike>(
  trip: StoredHeroGeneratedTrip<TPlan> | null,
) {
  const plan = (trip?.plan ?? null) as HeroPlanLike | null
  if (!plan) return null

  const days = Array.isArray(plan.days) ? plan.days : []
  const dayCount =
    typeof plan.durationDays === 'number' && plan.durationDays > 0
      ? plan.durationDays
      : days.length

  const stopCount = days.reduce((total, day) => {
    const mappedStops = Array.isArray(day.stops) ? day.stops.length : 0
    return total + mappedStops + (day.hotel ? 1 : 0)
  }, 0)

  const dayPreview = days
    .slice(0, 2)
    .map((day, index) => `Day ${day.day ?? index + 1}: ${day.title ?? 'Route'}`)
    .join(' • ')

  const city = typeof plan.city === 'string' && plan.city.trim() ? plan.city.trim() : 'your trip'
  const estimate =
    typeof plan.totalEstimate === 'string' && plan.totalEstimate.trim()
      ? ` Budget target: ${plan.totalEstimate.trim()}.`
      : ''

  return `Here is your agenda and live track for ${city}: ${dayCount || days.length} day${dayCount === 1 ? '' : 's'}, ${stopCount} mapped stop${stopCount === 1 ? '' : 's'}, and one stay base each day.${estimate}${dayPreview ? ` ${dayPreview}.` : ''}`
}
