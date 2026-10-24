import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight, Coffee, Hotel, MapPin, Clock, Utensils, Compass, Route, Heart, Map, Navigation, Star, Loader2, Calendar, Wallet, Phone, Globe, CheckCircle2, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import {
  getPublicTrip,
  saveMyTrip,
  type SaveMyTripPayload,
  type PublicTrip,
  type PublicTripItem,
} from '@/lib/travelApi'
import {
  requestHeroPlanner,
  type HeroAgentResponse,
  type HeroPlannerRequest,
  type StoredHeroPlannerResult,
} from '@/lib/agent'
import {
  HERO_AGENT_NOTICE_KEY,
  HERO_AGENT_FOLLOWUP_KEY,
  HERO_LATEST_TRIP_ID_KEY,
  HERO_PENDING_MAP_OPEN_KEY,
  HERO_PLANNER_REQUEST_KEY,
  HERO_PLANNER_RESULT_KEY,
  buildHeroGeneratedTripFollowup,
  buildHeroGeneratedTripId,
  readHeroStorage,
  readHeroGeneratedTrip,
  removeHeroStorage,
  saveHeroGeneratedTrip,
  writeHeroStorage,
  type StoredHeroGeneratedTrip,
} from '@/lib/heroGeneratedTrip'
import type { DemoTrip, RouteWaypoint } from './types'
import { DEMO_TRIPS, MAP_DRAFT_TRIPS } from './mapUtils'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'

/* ─────────────────────────────────────────────────────────────────
   ENV
───────────────────────────────────────────────────────────────── */

const PUBLIC_API_URL = (import.meta.env.VITE_PUBLIC_API_URL ?? '').replace(/\/$/, '')
// The search key is the only Places key allowed on every domain (the others are referrer-locked)
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_SEARCH_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''
const GOOGLE_ROUTES_API_KEY = import.meta.env.VITE_GOOGLE_ROUTES_API_KEY ?? ''
const GOOGLE_GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY ?? ''

/* ─────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────── */

type TripStopType = 'hotel' | 'cafe' | 'activity' | 'restaurant'

type TripStop = {
  id: string
  name: string
  type: TripStopType
  time: string
  description: string
  image: string
  mapUrl: string
  price?: string
  rating?: number
  phone?: string
  website?: string
  lat?: number
  lng?: number
  address?: string
  placeId?: string
  openNow?: boolean
  openingHours?: string[]
  reviews?: Array<{
    author: string
    rating: number
    text: string
    relativeTimeDescription?: string
  }>
}

type TripDay = {
  day: number
  title: string
  summary: string
  area: string
  hotel: TripStop
  stops: TripStop[]
  routeSummary?: {
    distanceKm?: number
    durationMin?: number
  }
}

type TripPlanType = {
  city: string
  durationDays: number
  budgetDh: number | null
  title: string
  subtitle: string
  coverImage: string
  totalEstimate: string
  tags: string[]
  days: TripDay[]
}

type HeroPromptContext = {
  prompt?: string
  city?: string
  durationDays?: number | null
  budgetDh?: number | null
}

type AgendaPreview = {
  id: string
  title: string
  city: string
  summary: string
  coverImage: string
  durationDays: number
  stopsCount: number
  source: 'backend' | 'generated'
}

type LocalSeedPlace = {
  name: string
  type: TripStopType
  description: string
  address: string
  time: string
  price?: string
  image?: string
  rating?: number
  lat?: number
  lng?: number
  /** Search template rather than a named place; enrichment replaces its name */
  generic?: boolean
}

type RouteSummary = {
  distanceKm?: number
  durationMin?: number
}

function buildGrayPlaceholder(label: string) {
  const safe = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><text x="600" y="410" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#94a3b8">${safe}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

/* ─────────────────────────────────────────────────────────────────
   IMAGES
───────────────────────────────────────────────────────────────── */

const SEEDED_LOCAL_IMAGES = [
  buildGrayPlaceholder('Morocco place'),
  buildGrayPlaceholder('Historic stop'),
  buildGrayPlaceholder('Riad stay'),
  buildGrayPlaceholder('Local landmark'),
  buildGrayPlaceholder('Cafe or restaurant'),
]

const CITY_LOCAL_COVERS: Record<string, string> = {
  Fez: '/assets/places/m3.jpeg',
  Fes: '/assets/places/m3.jpeg',
  Meknes: '/assets/places/m4.jpeg',
  'Meknès': '/assets/places/m4.jpeg',
  Casablanca: '/assets/places/m5.jpeg',
  Marrakech: '/assets/places/m6.jpeg',
  Tangier: '/assets/places/m7.jpeg',
  Agadir: '/assets/places/m5.jpeg',
  Essaouira: '/assets/places/m6.jpeg',
  Chefchaouen: '/assets/places/m3.jpeg',
  Ouarzazate: '/assets/places/m4.jpeg',
  Rabat: '/assets/places/m6.jpeg',
}

/* ─────────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────────── */

function norm(v: string) {
  return v.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function extractCity(p: string) {
  const n = norm(p)
  if (n.includes('meknes') || n.includes('meknès')) return 'Meknes'
  if (n.includes('marrakech') || n.includes('marrakesh')) return 'Marrakech'
  if (n.includes('rabat')) return 'Rabat'
  if (n.includes('casablanca')) return 'Casablanca'
  if (n.includes('chefchaouen')) return 'Chefchaouen'
  if (n.includes('essaouira')) return 'Essaouira'
  return 'Fez'
}

function extractDays(p: string) {
  const m = norm(p).match(/(\d+)\s*(day|days|jour|jours)/i)
  return m ? Math.min(Number(m[1]), 7) : 3
}

function extractBudget(p: string) {
  const n = norm(p)
  const m = n.match(/(\d{3,6})\s*(dh|mad)/i) || n.match(/budget\s*(?:de)?\s*(\d{3,6})/i)
  if (!m) return null
  const raw = m.find((x) => /^\d{3,6}$/.test(x))
  return raw ? Number(raw) : null
}

function getLocalCityCover(city?: string | null) {
  if (!city) return ''
  return CITY_LOCAL_COVERS[city] || CITY_LOCAL_COVERS[extractCity(city)] || ''
}

function buildMapUrl(name: string, address: string, lat?: number, lng?: number) {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `https://www.google.com/maps?q=${lat},${lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`
}

function buildRouteUrl(stops: TripStop[]) {
  const pts = stops.filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
  if (pts.length >= 2) {
    const origin = `${pts[0].lat},${pts[0].lng}`
    const destination = `${pts[pts.length - 1].lat},${pts[pts.length - 1].lng}`
    const waypoints = pts.slice(1, -1).map((s) => `${s.lat},${s.lng}`).join('|')
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=walking`
  }
  const names = stops.map((s) => `${s.name} ${s.address ?? ''}`.trim()).join(' to ')
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(names)}&travelmode=walking`
}

function buildPhotoUrl(photoName?: string) {
  if (!photoName || !GOOGLE_PLACES_API_KEY) return ''
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1000&maxWidthPx=1400&key=${encodeURIComponent(GOOGLE_PLACES_API_KEY)}`
}

function minutesFromDuration(duration?: string): number | undefined {
  if (!duration) return undefined
  const clean = duration.replace('s', '')
  const sec = Number(clean)
  if (Number.isNaN(sec)) return undefined
  return Math.round(sec / 60)
}

function rawSeedToStop(place: LocalSeedPlace, seed: number): TripStop {
  return {
    id: `${place.generic ? 'generic' : 'seed'}-${seed}-${place.name.slice(0, 12).replace(/\s+/g, '-')}`,
    name: place.name,
    type: place.type,
    time: place.time,
    description: place.description,
    image: place.image ?? buildGrayPlaceholder(place.name),
    address: place.address,
    mapUrl: buildMapUrl(place.name, place.address, place.lat, place.lng),
    price: place.price,
    rating: place.rating,
    lat: place.lat,
    lng: place.lng,
  }
}

function replaceStopPreservingUI(base: TripStop, patch: Partial<TripStop>): TripStop {
  const next = { ...base, ...patch }
  next.mapUrl = buildMapUrl(next.name, next.address ?? '', next.lat, next.lng)
  return next
}

function normalizeBackendStopType(value?: string | null): TripStopType {
  const raw = value?.trim().toLowerCase()
  if (raw === 'hotel' || raw === 'riad') return 'hotel'
  if (raw === 'cafe' || raw === 'coffee') return 'cafe'
  if (raw === 'restaurant') return 'restaurant'
  return 'activity'
}

function formatTripItemTime(value?: string | null, fallback = 'Flexible') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function parseBudgetAmount(value?: string | number | null) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function buildBackendStop(item: PublicTripItem): TripStop {
  const type = normalizeBackendStopType(item.type)
  return {
    id: item.id,
    name: item.title,
    type,
    time: formatTripItemTime(item.time),
    description: item.notes?.trim() || 'Planner-selected stop for this route.',
    image: buildGrayPlaceholder(item.title),
    mapUrl: buildMapUrl(item.title, item.location ?? ''),
    address: item.location ?? undefined,
  }
}

function buildSyntheticHotelStop(city: string, day: number, coverImage?: string | null): TripStop {
  return {
    id: `planner-hotel-${city}-${day}`,
    name: `${city} base stay`,
    type: 'hotel',
    time: 'Check-in',
    description: `Planner base for day ${day} in ${city}.`,
    image: coverImage || getLocalCityCover(city) || buildGrayPlaceholder(`${city} stay`),
    mapUrl: buildMapUrl(`${city} stay`, `${city}, Morocco`),
    address: `${city}, Morocco`,
  }
}

function buildHeroGeneratedMapTrip(plan: TripPlanType, tripId: string): DemoTrip {
  const waypoints: RouteWaypoint[] = []
  for (const day of plan.days) {
    const orderedStops = [day.hotel, ...day.stops]
    for (const stop of orderedStops) {
      if (typeof stop.lat !== 'number' || typeof stop.lng !== 'number') continue
      waypoints.push({
        lat: stop.lat,
        lng: stop.lng,
        label: `Day ${day.day}: ${stop.name}`,
        kind: stop.type,
        day: day.day,
      })
    }
  }
  return {
    id: tripId,
    title: plan.title,
    city: plan.city,
    country: 'Morocco',
    summary: plan.subtitle,
    image: plan.coverImage,
    tags: plan.tags,
    route: waypoints.length ? { tripId, waypoints } : undefined,
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isSavedTripId(tripId?: string | null) {
  return Boolean(tripId && UUID_PATTERN.test(tripId))
}

function isTripPlan(value: unknown): value is TripPlanType {
  const candidate = value as Partial<TripPlanType> | null
  return Boolean(candidate && typeof candidate.city === 'string' && Array.isArray(candidate.days) && candidate.days.length)
}

function buildSaveTripPayload(plan: TripPlanType): SaveMyTripPayload {
  return {
    title: plan.title,
    description: plan.subtitle,
    cityName: plan.city,
    budgetTotal: plan.budgetDh ?? undefined,
    currency: 'MAD',
    plan,
    items: plan.days.flatMap((day) =>
      day.stops.map((stop) => ({
        day: day.day,
        title: stop.name,
        location: stop.address,
        notes: stop.description,
        type: stop.type,
      })),
    ),
  }
}

function storeHeroGeneratedPlan(plan: TripPlanType) {
  const tripId = buildHeroGeneratedTripId(plan.city)
  const stored: StoredHeroGeneratedTrip<TripPlanType> = {
    id: tripId,
    createdAt: new Date().toISOString(),
    plan,
    mapTrip: buildHeroGeneratedMapTrip(plan, tripId),
  }
  saveHeroGeneratedTrip(stored)
  // Keep a real copy in the user's account so it shows up in their history on any device
  void saveMyTrip(buildSaveTripPayload(plan)).catch((error) => console.error('Saving generated trip failed:', error))
  const followup = buildHeroGeneratedTripFollowup(stored)
  if (followup) writeHeroStorage(HERO_AGENT_FOLLOWUP_KEY, followup)
  window.dispatchEvent(new CustomEvent('hero-planner-ready'))
  return tripId
}

function mapPublicTripToPlan(trip: PublicTrip): TripPlanType {
  if (isTripPlan(trip.plan)) return trip.plan
  const city = trip.city?.name || 'Morocco'
  const items = Array.isArray(trip.items) ? trip.items : []
  const grouped = new globalThis.Map<number, PublicTripItem[]>()

  items.forEach((item) => {
    const day = Math.max(1, item.day ?? 1)
    const bucket = grouped.get(day) ?? []
    bucket.push(item)
    grouped.set(day, bucket)
  })

  const groupedEntries = Array.from(grouped.entries()) as Array<[number, PublicTripItem[]]>
  const days: TripDay[] = groupedEntries
    .sort((a, b) => a[0] - b[0])
    .map(([dayNumber, dayItems]) => {
      const sortedItems = [...dayItems].sort((a, b) => {
        const timeA = a.time ? new Date(a.time).getTime() : Number.MAX_SAFE_INTEGER
        const timeB = b.time ? new Date(b.time).getTime() : Number.MAX_SAFE_INTEGER
        if (timeA !== timeB) return timeA - timeB
        return a.title.localeCompare(b.title)
      })
      const stops = sortedItems.map((item) => buildBackendStop(item))
      const routeSummary = stops.length ? { distanceKm: Math.max(1, Math.round(stops.length * 1.4)), durationMin: Math.max(20, stops.length * 35) } : undefined
      return {
        day: dayNumber,
        title: `Day ${dayNumber}`,
        summary: sortedItems[0]?.notes?.trim() || `Planner route for day ${dayNumber} in ${city}.`,
        area: city,
        hotel: buildSyntheticHotelStop(city, dayNumber, trip.city?.coverImage ?? undefined),
        stops,
        routeSummary,
      }
    })

  const budget = parseBudgetAmount(trip.budgetTotal)
  const durationDays = days.length || 1
  return {
    city,
    durationDays,
    budgetDh: trip.currency === 'MAD' || !trip.currency ? budget : null,
    title: trip.title,
    subtitle: trip.description?.trim() || `A ${durationDays}-day itinerary through ${city}.`,
    coverImage: trip.city?.coverImage || getLocalCityCover(city) || buildGrayPlaceholder(city),
    totalEstimate: budget != null ? `${budget.toLocaleString()} ${trip.currency || 'MAD'} total` : `${durationDays}-day curated route`,
    tags: [city, 'Itinerary'],
    days: days.length ? days : [{ day: 1, title: 'Day 1', summary: `Planner route for ${city}.`, area: city, hotel: buildSyntheticHotelStop(city, 1, trip.city?.coverImage ?? undefined), stops: [] }],
  }
}

function buildDraftPlanFromDemoTrip(trip: DemoTrip): TripPlanType {
  const city = trip.city || 'Morocco'
  const draftMeta = MAP_DRAFT_TRIPS.find((entry) => entry.tripId === trip.id)
  const durationDays = Math.max(1, Math.min(draftMeta?.durationDays ?? 2, 7))
  const waypoints = Array.isArray(trip.route?.waypoints) ? trip.route.waypoints : []
  const stopsPerDay = Math.max(1, Math.ceil(Math.max(waypoints.length, 1) / durationDays))

  const days: TripDay[] = Array.from({ length: durationDays }).map((_, index) => {
    const slice = waypoints.slice(index * stopsPerDay, (index + 1) * stopsPerDay)
    const hotel = buildSyntheticHotelStop(city, index + 1, trip.image)
    const stops = slice.map((waypoint, stopIndex) => ({
      id: `${trip.id}-draft-stop-${index + 1}-${stopIndex + 1}`,
      name: waypoint.label || `Stop ${stopIndex + 1}`,
      type: 'activity' as const,
      time: stopIndex === 0 ? '10:00' : `${Math.min(18, 11 + stopIndex)}:00`,
      description: `${trip.city} route stop selected for this curated draft.`,
      image: trip.image || buildGrayPlaceholder(waypoint.label || trip.title),
      mapUrl: buildMapUrl(waypoint.label || trip.title, `${trip.city}, Morocco`, waypoint.lat, waypoint.lng),
      address: `${trip.city}, Morocco`,
      lat: waypoint.lat,
      lng: waypoint.lng,
    }))

    return {
      day: index + 1,
      title: durationDays === 1 ? trip.title : `Day ${index + 1}`,
      summary: trip.summary,
      area: city,
      hotel,
      stops,
      routeSummary: stops.length
        ? {
            distanceKm: Math.max(1, Number((stops.length * 1.6).toFixed(1))),
            durationMin: Math.max(20, stops.length * 28),
          }
        : undefined,
    }
  })

  return {
    city,
    durationDays,
    budgetDh: null,
    title: trip.title,
    subtitle: trip.summary,
    coverImage: trip.image || getLocalCityCover(city) || buildGrayPlaceholder(city),
    totalEstimate: `${durationDays}-day curated route`,
    tags: trip.tags ?? [city, 'Route'],
    days,
  }
}

function buildAgendaPreviewFromStoredPlan(stored: StoredHeroGeneratedTrip<TripPlanType>): AgendaPreview {
  const stopCount = stored.plan.days.reduce((total, day) => total + day.stops.length + 1, 0)
  return {
    id: stored.id,
    title: stored.plan.title,
    city: stored.plan.city,
    summary: stored.plan.subtitle || `Generated ${stored.plan.durationDays}-day route through ${stored.plan.city}.`,
    coverImage: stored.plan.coverImage || getLocalCityCover(stored.plan.city) || buildGrayPlaceholder(stored.plan.city),
    durationDays: stored.plan.durationDays,
    stopsCount: stopCount,
    source: 'generated',
  }
}

async function resolveSeedCoverImage(city: string, title: string) {
  const queries = [`${title} ${city} Morocco`, `${city} Morocco old medina`, `${city} Morocco landmark`]
  for (const query of queries) {
    const match = await searchGooglePlace(query)
    const photoName = match?.photos?.[0]?.name
    if (photoName) return buildPhotoUrl(photoName)
  }
  return getLocalCityCover(city) || buildGrayPlaceholder(city)
}

async function buildSeededAgendaPreview(city: string): Promise<AgendaPreview> {
  const seed = getCitySeed(city)
  const stopsCount = seed.days.reduce((total, day) => total + day.stops.length, 0)
  return {
    id: `seed:${city.toLowerCase()}`,
    title: seed.title,
    city,
    summary: seed.subtitle,
    coverImage: await resolveSeedCoverImage(city, seed.title),
    durationDays: seed.days.length,
    stopsCount,
    source: 'generated',
  }
}

/* ─────────────────────────────────────────────────────────────────
   LOCAL SEED DATA
───────────────────────────────────────────────────────────────── */

const CITY_SEEDS: Record<string, {
  title: string
  subtitle: string
  tags: string[]
  totalEstimate: string
  days: Array<{
    title: string
    summary: string
    area: string
    hotel: LocalSeedPlace
    stops: LocalSeedPlace[]
  }>
}> = {
  Fez: {
    title: 'Fez Medina Discovery',
    subtitle: 'Historic alleys, riads, rooftops, and iconic local food.',
    tags: ['Fez', 'Medina', 'Culture', 'Food', 'Walkable'],
    totalEstimate: '700–1200 DH/day',
    days: [
      {
        title: 'Medina Arrival',
        summary: 'A smooth first day around the old medina with major landmarks, tea, and a classic dinner.',
        area: 'Fes El Bali',
        hotel: {
          name: 'Riad Rcif',
          type: 'hotel',
          description: 'Elegant riad in the medina with traditional décor and a rooftop.',
          address: '1 Takharbicht Laayoune, Fes',
          time: 'Check-in',
          price: 'From 700 DH/night',
          image: SEEDED_LOCAL_IMAGES[1],
          rating: 4.7,
          lat: 34.0626, lng: 4.9728,
        },
        stops: [
          { name: 'Bab Bou Jeloud', type: 'activity', description: 'Iconic blue gate and the perfect start for your medina walk.', address: 'Bab Bou Jeloud, Fes', time: '09:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[1], rating: 4.7, lat: 34.0636, lng: -4.9772 },
          { name: 'Bou Inania Madrasa', type: 'activity', description: 'Historic madrasa with beautiful carvings and architecture.', address: 'Rue Talaa Kebira, Fes', time: '10:00', price: '20–30 DH', image: SEEDED_LOCAL_IMAGES[2], rating: 4.6, lat: 34.0641, lng: -4.9756 },
          { name: 'The Ruined Garden', type: 'cafe', description: 'Quiet garden café for a relaxed lunch or coffee break.', address: '15 Arsat Bennis, Douh, Fes', time: '12:30', price: '60–120 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.5, lat: 34.0617, lng: -4.9732 },
          { name: 'Al Attarine Madrasa', type: 'activity', description: 'Compact but one of the finest examples of Marinid design.', address: 'Near Al-Qarawiyyin, Fes', time: '15:00', price: '20–30 DH', image: SEEDED_LOCAL_IMAGES[3], rating: 4.6, lat: 34.0644, lng: -4.9741 },
          { name: 'Cafe Clock', type: 'restaurant', description: 'Popular spot for rooftop views and modern Moroccan plates.', address: '7 Derb El Magana, Talaa Kbira, Fes', time: '19:30', price: '100–180 DH', image: SEEDED_LOCAL_IMAGES[4], rating: 4.4, lat: 34.0638, lng: -4.9768 },
        ],
      },
      {
        title: 'Crafts & Panoramas',
        summary: 'Leather, viewpoints, and slow food across one of Morocco\'s richest old cities.',
        area: 'Fes El Bali',
        hotel: {
          name: 'Riad Salam Fes',
          type: 'hotel',
          description: 'Refined stay close to the medina with a polished atmosphere.',
          address: '18 Derb Bennis, Douh, Fes',
          time: 'Check-in',
          price: 'From 850 DH/night',
          image: SEEDED_LOCAL_IMAGES[2],
          rating: 4.6,
          lat: 34.0621, lng: -4.9718,
        },
        stops: [
          { name: 'Chouara Tannery', type: 'activity', description: 'Famous tannery with panoramic terraces overlooking the dye pits.', address: 'Chouara, Fes', time: '09:30', price: 'Tip / Free entry', image: SEEDED_LOCAL_IMAGES[1], rating: 4.4, lat: 34.0649, lng: -4.9708 },
          { name: 'Nejjarine Museum', type: 'activity', description: 'Wood arts museum in a beautifully restored fondouk.', address: 'Place Nejjarine, Fes', time: '11:00', price: '20–30 DH', image: SEEDED_LOCAL_IMAGES[3], rating: 4.5, lat: 34.0642, lng: -4.9742 },
          { name: 'Made in M', type: 'cafe', description: 'Clean modern café with coffee and dessert options.', address: 'Derb El Horra, Fes', time: '13:00', price: '40–90 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.3, lat: 34.0630, lng: -4.9760 },
          { name: 'Merenid Tombs', type: 'activity', description: 'Great sunset panorama over Fez.', address: 'Borj Nord hill, Fes', time: '17:30', price: 'Free', image: SEEDED_LOCAL_IMAGES[4], rating: 4.6, lat: 34.0669, lng: -4.9722 },
          { name: 'Dar Roumana', type: 'restaurant', description: 'Upscale Moroccan dining in a restored traditional house.', address: '30 Derb El Amer, Zkak Roumane, Fes', time: '20:00', price: '180–320 DH', image: SEEDED_LOCAL_IMAGES[2], rating: 4.7, lat: 34.0628, lng: -4.9734 },
        ],
      },
      {
        title: 'Palaces & Easy Finale',
        summary: 'A balanced final day mixing historic gates, gardens, and a relaxed closing dinner.',
        area: 'Fes Jdid / Medina',
        hotel: {
          name: 'Palais Medina & Spa',
          type: 'hotel',
          description: 'Comfortable upscale stay with easier car access.',
          address: 'Avenue Allal El Fassi, Fes',
          time: 'Check-in',
          price: 'From 950 DH/night',
          image: SEEDED_LOCAL_IMAGES[3],
          rating: 4.5,
          lat: 34.0520, lng: -5.0000,
        },
        stops: [
          { name: 'Royal Palace Gates', type: 'activity', description: 'A classic photo stop with monumental golden doors.', address: 'Place des Alaouites, Fes', time: '10:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[3], rating: 4.7, lat: 34.0578, lng: -4.9899 },
          { name: 'Jnan Sbil', type: 'activity', description: 'A peaceful garden for a slower midday reset.', address: 'Avenue Moulay Hassan, Fes', time: '11:30', price: 'Free', image: SEEDED_LOCAL_IMAGES[1], rating: 4.5, lat: 34.0600, lng: -4.9870 },
          { name: 'Café Carrion', type: 'cafe', description: 'Classic café stop for coffee and people watching.', address: 'Ville Nouvelle, Fes', time: '13:00', price: '30–70 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.2, lat: 34.0432, lng: -5.0042 },
          { name: 'Borj Nord Museum', type: 'activity', description: 'Historic fortress and arms museum with a strong city view.', address: 'Borj Nord, Fes', time: '16:00', price: '20–40 DH', image: SEEDED_LOCAL_IMAGES[4], rating: 4.3, lat: 34.0668, lng: -4.9716 },
          { name: 'Restaurant Dar Hatim', type: 'restaurant', description: 'Warm traditional dinner with Moroccan hospitality.', address: '6 Derb Idrissi, Fes', time: '20:00', price: '150–250 DH', image: SEEDED_LOCAL_IMAGES[2], rating: 4.5, lat: 34.0635, lng: -4.9745 },
        ],
      },
    ],
  },
  Casablanca: {
    title: 'Casablanca City Circuit',
    subtitle: 'A 7-day route through museums, history, and the best of Casa\'s culinary scene.',
    tags: ['Casablanca', 'Modern', 'Culture', 'Seafood', 'History'],
    totalEstimate: '800–1400 DH/day',
    days: [
      {
        title: 'Corniche & Hassan II',
        summary: 'Start with the iconic mosque and a coastal walk along the Corniche.',
        area: 'Ain Diab / Old Medina',
        hotel: {
          name: 'Hôtel Transatlantique',
          type: 'hotel',
          description: 'Historic art-deco hotel in the heart of Casablanca.',
          address: '79 Rue Chaouia, Casablanca',
          time: 'Check-in',
          price: 'From 900 DH/night',
          image: SEEDED_LOCAL_IMAGES[4],
          rating: 4.4,
          lat: 33.5950, lng: -7.6187,
        },
        stops: [
          { name: 'Hassan II Mosque', type: 'activity', description: 'The largest mosque in Africa with stunning ocean-edge architecture.', address: 'Bd Sidi Mohammed Ben Abdallah, Casablanca', time: '09:00', price: '120 DH', image: SEEDED_LOCAL_IMAGES[4], rating: 4.9, lat: 33.6086, lng: -7.6325 },
          { name: 'Old Medina Casablanca', type: 'activity', description: 'Compact medina with local crafts, color, and a calmer energy.', address: 'Old Medina, Casablanca', time: '11:30', price: 'Free', image: SEEDED_LOCAL_IMAGES[3], rating: 4.2, lat: 33.5980, lng: -7.6170 },
          { name: 'La Sqala', type: 'restaurant', description: 'Moroccan lunch in a restored Portuguese bastion garden.', address: 'Bd des Almohades, Casablanca', time: '13:00', price: '120–220 DH', image: SEEDED_LOCAL_IMAGES[1], rating: 4.5, lat: 33.5970, lng: -7.6198 },
          { name: 'Corniche Ain Diab', type: 'activity', description: 'The iconic seafront promenade for an afternoon stroll.', address: 'Ain Diab, Casablanca', time: '17:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[2], rating: 4.4, lat: 33.5912, lng: -7.6720 },
          { name: 'Rick\'s Café', type: 'restaurant', description: 'Legendary restaurant styled after Casablanca the film.', address: '248 Bd Sour Jdid, Casablanca', time: '20:00', price: '200–350 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.3, lat: 33.5978, lng: -7.6192 },
        ],
      },
      {
        title: 'Art Deco & Museum Day',
        summary: 'Explore the city\'s stunning Art Deco heritage and visit the Museum of Moroccan Judaism.',
        area: 'Ville Nouvelle',
        hotel: {
          name: 'Barceló Casablanca',
          type: 'hotel',
          description: 'Modern hotel in the business district with great access.',
          address: 'Rue Sidi Belyout, Casablanca',
          time: 'Check-in',
          price: 'From 1100 DH/night',
          image: SEEDED_LOCAL_IMAGES[0],
          rating: 4.3,
          lat: 33.5880, lng: -7.6120,
        },
        stops: [
          { name: 'Place Mohammed V', type: 'activity', description: 'A grand Art Deco square surrounded by colonial-era architecture.', address: 'Place Mohammed V, Casablanca', time: '10:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[3], rating: 4.6, lat: 33.5928, lng: -7.6145 },
          { name: 'Museum of Moroccan Judaism', type: 'activity', description: 'A unique and moving museum on the history of Moroccan Jews.', address: 'Quartier Oasis, Casablanca', time: '11:30', price: '30 DH', image: SEEDED_LOCAL_IMAGES[2], rating: 4.5, lat: 33.5667, lng: -7.6375 },
          { name: 'Brasserie La Fontaine', type: 'cafe', description: 'A classic French brasserie in a beautiful Art Deco building.', address: 'Rue Mohammed el Qorri, Casablanca', time: '13:30', price: '80–160 DH', image: SEEDED_LOCAL_IMAGES[1], rating: 4.4, lat: 33.5915, lng: -7.6158 },
          { name: 'Mohammed V International Park', type: 'activity', description: 'A sprawling green space for an afternoon break.', address: 'Casablanca', time: '16:30', price: 'Free', image: SEEDED_LOCAL_IMAGES[4], rating: 4.3, lat: 33.5890, lng: -7.6130 },
          { name: 'Dar Beida', type: 'restaurant', description: 'Upscale Moroccan cuisine in a beautifully decorated palatial setting.', address: 'Bd Lalla Yacout, Casablanca', time: '20:00', price: '200–400 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.6, lat: 33.5925, lng: -7.6140 },
        ],
      },
      {
        title: 'Seafood & Anfa',
        summary: 'A relaxed morning in upscale Anfa, then a deep dive into the city\'s seafood scene.',
        area: 'Anfa / Corniche',
        hotel: {
          name: 'Sofitel Casablanca Tour Blanche',
          type: 'hotel',
          description: 'Luxury tower hotel with panoramic city views.',
          address: 'Rue Sidi Belyout, Casablanca',
          time: 'Check-in',
          price: 'From 1600 DH/night',
          image: SEEDED_LOCAL_IMAGES[2],
          rating: 4.5,
          lat: 33.5868, lng: -7.6110,
        },
        stops: [
          { name: 'Anfa Place', type: 'activity', description: 'Upscale district for a morning coffee walk in quieter streets.', address: 'Anfa, Casablanca', time: '10:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[1], rating: 4.3, lat: 33.5880, lng: -7.6560 },
          { name: 'Le Cabestan', type: 'restaurant', description: 'Iconic oceanfront restaurant serving the freshest Moroccan seafood.', address: 'Bd de la Corniche, Casablanca', time: '13:00', price: '200–380 DH', image: SEEDED_LOCAL_IMAGES[4], rating: 4.5, lat: 33.5900, lng: -7.6700 },
          { name: 'Ain Diab Beach', type: 'activity', description: 'Afternoon on the city\'s most accessible city beach.', address: 'Ain Diab, Casablanca', time: '15:30', price: 'Free', image: SEEDED_LOCAL_IMAGES[3], rating: 4.1, lat: 33.5855, lng: -7.6788 },
          { name: 'Basmane', type: 'restaurant', description: 'A rooftop dinner with French-Moroccan fusion and city views.', address: 'Quartier Gauthier, Casablanca', time: '20:00', price: '180–300 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.4, lat: 33.5901, lng: -7.6270 },
        ],
      },
    ],
  },
  Marrakech: {
    title: 'Marrakech Medina Circuit',
    subtitle: 'Laneways, gardens, rooftops, and a tighter premium route through Marrakech.',
    tags: ['Marrakech', 'Medina', 'Rooftops', 'Food', 'Walkable'],
    totalEstimate: '900–1500 DH/day',
    days: [
      {
        title: 'Medina Core',
        summary: 'A compact first day through the souks, palace courtyards, and a rooftop dinner.',
        area: 'Medina',
        hotel: {
          name: 'Riad Yasmine',
          type: 'hotel',
          description: 'A stylish riad base inside the medina with easy route access.',
          address: '209 Arset Aouzal Rd, Marrakech',
          time: 'Check-in',
          price: 'From 1200 DH/night',
          image: SEEDED_LOCAL_IMAGES[2],
          rating: 4.8,
          lat: 31.6295, lng: -7.9891,
        },
        stops: [
          { name: 'Jemaa el-Fnaa', type: 'activity', description: 'Start in the city\'s main square before the lanes get busy.', address: 'Jemaa el-Fnaa, Marrakech', time: '09:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[5 % SEEDED_LOCAL_IMAGES.length], rating: 4.6, lat: 31.6258, lng: -7.9891 },
          { name: 'Bahia Palace', type: 'activity', description: 'Palace courtyards and decorative rooms with a calmer pace.', address: 'Avenue Imam El Ghazali, Marrakech', time: '11:00', price: '70 DH', image: SEEDED_LOCAL_IMAGES[3], rating: 4.5, lat: 31.6222, lng: -7.9831 },
          { name: 'Le Jardin', type: 'restaurant', description: 'A polished lunch stop in a courtyard setting.', address: '32 Souk Jeld Sidi Abdelaziz, Marrakech', time: '13:30', price: '120–220 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.5, lat: 31.6304, lng: -7.9862 },
        ],
      },
      {
        title: 'Gardens & Sunset',
        summary: 'A slower second day with gardens, modern coffee, and sunset views.',
        area: 'Majorelle / Medina edge',
        hotel: {
          name: 'Les Jardins De La Koutoubia',
          type: 'hotel',
          description: 'Comfortable stay with easier access and polished service.',
          address: '26 Rue de la Koutoubia, Marrakech',
          time: 'Check-in',
          price: 'From 1500 DH/night',
          image: SEEDED_LOCAL_IMAGES[1],
          rating: 4.6,
          lat: 31.6240, lng: -7.9924,
        },
        stops: [
          { name: 'Jardin Majorelle', type: 'activity', description: 'An early visit keeps the route smoother and the light better.', address: 'Rue Yves St Laurent, Marrakech', time: '10:00', price: '170 DH', image: SEEDED_LOCAL_IMAGES[4], rating: 4.6, lat: 31.6411, lng: -8.0037 },
          { name: 'Bacha Coffee', type: 'cafe', description: 'A sharp coffee stop with a premium feel.', address: 'Dar el Bacha, Marrakech', time: '12:30', price: '50–120 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.5, lat: 31.6350, lng: -7.9900 },
          { name: 'Kabana Rooftop', type: 'restaurant', description: 'A rooftop finish with cocktails and sunset city views.', address: 'Rue Fatima Zahra, Marrakech', time: '19:00', price: '160–280 DH', image: SEEDED_LOCAL_IMAGES[3], rating: 4.4, lat: 31.6265, lng: -7.9880 },
        ],
      },
    ],
  },
  Essaouira: {
    title: 'Essaouira Atlantic Reset',
    subtitle: 'Sea air, ramparts, seafood, and a light coastal rhythm.',
    tags: ['Essaouira', 'Coast', 'Food', 'Relaxed', 'Walkable'],
    totalEstimate: '700–1200 DH/day',
    days: [
      {
        title: 'Ramparts & Port',
        summary: 'A gentle route through the medina walls, port atmosphere, and seafood lunch.',
        area: 'Old Medina',
        hotel: {
          name: 'Riad Chbanate',
          type: 'hotel',
          description: 'A refined medina stay close to the ocean-facing core.',
          address: '179 Rue Chbanate, Essaouira',
          time: 'Check-in',
          price: 'From 950 DH/night',
          image: SEEDED_LOCAL_IMAGES[2],
          rating: 4.6,
          lat: 31.5108, lng: -9.7694,
        },
        stops: [
          { name: 'Skala de la Ville', type: 'activity', description: 'Classic ocean wall viewpoint and a strong route opener.', address: 'Skala de la Ville, Essaouira', time: '09:30', price: 'Free', image: SEEDED_LOCAL_IMAGES[3], rating: 4.7, lat: 31.5126, lng: -9.7742 },
          { name: 'Essaouira Fishing Port', type: 'activity', description: 'A raw, lively port stop for photos and atmosphere.', address: 'Port d\'Essaouira', time: '11:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[1], rating: 4.4, lat: 31.5065, lng: -9.7752 },
          { name: 'La Table by Madada', type: 'restaurant', description: 'Seafood-forward lunch in a more polished setting.', address: '18 Rue de l\'Istiklal, Essaouira', time: '13:00', price: '140–260 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.6, lat: 31.5114, lng: -9.7697 },
        ],
      },
      {
        title: 'Beach & Blue Hour',
        summary: 'A slower coastal second day with café time and a beachside close.',
        area: 'Beachfront',
        hotel: {
          name: 'Heure Bleue Palais',
          type: 'hotel',
          description: 'A premium stay with a rooftop pool and old-city access.',
          address: '2 Rue Ibn Batouta, Essaouira',
          time: 'Check-in',
          price: 'From 1700 DH/night',
          image: SEEDED_LOCAL_IMAGES[4],
          rating: 4.7,
          lat: 31.5104, lng: -9.7700,
        },
        stops: [
          { name: 'Essaouira Beach', type: 'activity', description: 'Long beach walk with room to slow the whole day down.', address: 'Plage d\'Essaouira', time: '10:00', price: 'Free', image: SEEDED_LOCAL_IMAGES[2], rating: 4.5, lat: 31.4980, lng: -9.7659 },
          { name: 'Mandala Society', type: 'cafe', description: 'A clean brunch-and-coffee stop with a modern feel.', address: 'Rue Youssef El Fassi, Essaouira', time: '12:30', price: '60–130 DH', image: SEEDED_LOCAL_IMAGES[0], rating: 4.4, lat: 31.5100, lng: -9.7692 },
          { name: 'Taros', type: 'restaurant', description: 'A rooftop finish for sunset and a stronger social vibe.', address: 'Place Moulay Hassan, Essaouira', time: '19:00', price: '150–260 DH', image: SEEDED_LOCAL_IMAGES[1], rating: 4.3, lat: 31.5096, lng: -9.7710 },
        ],
      },
    ],
  },
}

const CITY_SEED_ALIASES: Record<string, string> = { fes: 'Fez', 'fès': 'Fez', marrakesh: 'Marrakech' }

type CitySeed = (typeof CITY_SEEDS)[string]

// Template for cities without a curated seed; enrichPlan swaps each stop for a real Google place
function buildGenericCitySeed(city: string): CitySeed {
  const place = (name: string, type: TripStopType, description: string, time: string): LocalSeedPlace => ({
    name: `${name} ${city}`,
    type,
    description,
    address: `${city}, Morocco`,
    time,
    generic: true,
  })
  const hotel = place('Best rated riad hotel in', 'hotel', `A well-reviewed place to stay in ${city}.`, 'Check-in')
  return {
    title: `${city} Discovery`,
    subtitle: `Landmarks, markets and local food across ${city}.`,
    tags: [city, 'Culture', 'Food', 'Local'],
    totalEstimate: '600–1100 DH/day',
    days: [
      {
        title: 'Old Town & Landmarks',
        summary: `Start with the historic heart of ${city} and its best-known sights.`,
        area: `${city} old town`,
        hotel,
        stops: [
          place('Old medina of', 'activity', 'Wander the historic old town.', '10:00'),
          place('Famous historic monument in', 'activity', 'The landmark most visitors come to see.', '12:00'),
          place('Traditional Moroccan restaurant in', 'restaurant', 'Classic local dishes for lunch.', '13:30'),
          place('Popular café in', 'cafe', 'Mint tea break with the locals.', '16:30'),
        ],
      },
      {
        title: 'Culture & Markets',
        summary: `Museums, crafts and the busiest souks of ${city}.`,
        area: `${city} center`,
        hotel,
        stops: [
          place('Museum in', 'activity', 'Local history, art and crafts.', '10:00'),
          place('Souk market in', 'activity', 'Browse spices, textiles and handicrafts.', '12:00'),
          place('Best local food restaurant in', 'restaurant', 'A favourite for regional cooking.', '13:30'),
          place('Rooftop café in', 'cafe', 'Sunset views over the city.', '18:00'),
        ],
      },
      {
        title: 'Views & Slow Day',
        summary: `Gardens, viewpoints and a relaxed dinner in ${city}.`,
        area: city,
        hotel,
        stops: [
          place('Garden park in', 'activity', 'A calm green space to slow down.', '10:30'),
          place('Panoramic viewpoint in', 'activity', 'The best view of the city.', '12:30'),
          place('Top rated dinner restaurant in', 'restaurant', 'A memorable last dinner.', '20:00'),
        ],
      },
    ],
  }
}

function getCitySeed(city: string): CitySeed {
  const normalized = city.trim().toLowerCase()
  const key = CITY_SEED_ALIASES[normalized] ?? Object.keys(CITY_SEEDS).find((name) => name.toLowerCase() === normalized)
  return (key && CITY_SEEDS[key]) || buildGenericCitySeed(city.trim() || 'Morocco')
}

/* ─────────────────────────────────────────────────────────────────
   GOOGLE HELPERS
───────────────────────────────────────────────────────────────── */

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress?: string } | null> {
  if (!GOOGLE_GEOCODING_API_KEY || !address) return null
  try {
    const url = `https://geocode.googleapis.com/v4beta/geocode/address/${encodeURIComponent(address)}?key=${encodeURIComponent(GOOGLE_GEOCODING_API_KEY)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const first = data?.results?.[0]
    const loc = first?.location
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return null
    return { lat: loc.latitude, lng: loc.longitude, formattedAddress: first?.formattedAddress }
  } catch { return null }
}

type GoogleTextSearchPlace = {
  displayName?: { text?: string }
  id?: string
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  rating?: number
  nationalPhoneNumber?: string
  websiteUri?: string
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }
  photos?: Array<{ name?: string }>
}

async function searchGooglePlace(query: string): Promise<GoogleTextSearchPlace | null> {
  if (!GOOGLE_PLACES_API_KEY || !query) return null
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.photos',
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'en', regionCode: 'MA', maxResultCount: 1 }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.places?.[0] ?? null
  } catch { return null }
}

type GooglePlaceDetails = {
  id?: string
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  rating?: number
  websiteUri?: string
  nationalPhoneNumber?: string
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }
  photos?: Array<{ name?: string }>
  reviews?: Array<{
    authorAttribution?: { displayName?: string }
    rating?: number
    relativePublishTimeDescription?: string
    text?: { text?: string }
  }>
}

async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY || !placeId) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,formattedAddress,location,rating,websiteUri,nationalPhoneNumber,regularOpeningHours,photos,reviews',
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

async function computeRouteSummary(stops: TripStop[]): Promise<RouteSummary | undefined> {
  if (!GOOGLE_ROUTES_API_KEY) return undefined
  const points = stops.filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
  if (points.length < 2) return undefined
  try {
    const origin = points[0]
    const destination = points[points.length - 1]
    const intermediates = points.slice(1, -1)
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_ROUTES_API_KEY, 'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration' },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        intermediates: intermediates.map((p) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } })),
        travelMode: 'WALK',
        routingPreference: 'TRAFFIC_UNAWARE',
      }),
    })
    if (!res.ok) return undefined
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route) return undefined
    return { distanceKm: typeof route.distanceMeters === 'number' ? Number((route.distanceMeters / 1000).toFixed(1)) : undefined, durationMin: minutesFromDuration(route.duration) }
  } catch { return undefined }
}

/* ─────────────────────────────────────────────────────────────────
   OPTIONAL BACKEND ENRICHMENT
───────────────────────────────────────────────────────────────── */

async function enrichPlacesFromBackend(city: string, stops: TripStop[]): Promise<TripStop[] | null> {
  if (!PUBLIC_API_URL || stops.length === 0) return null
  try {
    const res = await fetch(`${PUBLIC_API_URL}/places/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, places: stops.map((s) => ({ id: s.id, name: s.name, type: s.type, address: s.address })) }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const items = Array.isArray(data?.places) ? data.places : []
    const byId = new Map(items.map((item: any) => [item.id, item]))
    return stops.map((s) => {
      const patch = byId.get(s.id)
      if (!patch) return s
      return replaceStopPreservingUI(s, { lat: typeof patch.lat === 'number' ? patch.lat : s.lat, lng: typeof patch.lng === 'number' ? patch.lng : s.lng, rating: typeof patch.rating === 'number' ? patch.rating : s.rating, address: patch.address ?? s.address, phone: patch.phone ?? s.phone, website: patch.website ?? s.website, image: patch.image || s.image })
    })
  } catch { return null }
}

/* ─────────────────────────────────────────────────────────────────
   PLAN GENERATION
───────────────────────────────────────────────────────────────── */

function createLocalPlan(city: string, requestedDays: number, budgetDh: number | null): TripPlanType {
  const seed = getCitySeed(city)
  const safeDays = Math.max(1, Math.min(requestedDays, 7))
  const days = Array.from({ length: safeDays }).map((_, index) => {
    const source = seed.days[index % seed.days.length]
    const hotel = rawSeedToStop(source.hotel, index * 10)
    const stops = source.stops.slice(0, 5).map((p, i) => rawSeedToStop(p, index * 10 + i + 1))
    return { day: index + 1, title: source.title, summary: source.summary, area: source.area, hotel, stops } satisfies TripDay
  })
  let totalEstimate = seed.totalEstimate
  if (budgetDh !== null) {
    const perDayBudget = Math.max(200, Math.round(budgetDh / safeDays))
    totalEstimate = `${Math.max(300, perDayBudget - 150)}–${perDayBudget + 200} DH/day`
  }
  // Use the first real stop image or local cover as the cover image
  const firstStopImage = days[0]?.hotel.image || days[0]?.stops[0]?.image
  const coverImage =
    (firstStopImage && !firstStopImage.startsWith('data:'))
      ? firstStopImage
      : (getLocalCityCover(city) || buildGrayPlaceholder(city))

  return { city, durationDays: safeDays, budgetDh, title: seed.title, subtitle: seed.subtitle, coverImage, totalEstimate, tags: seed.tags, days }
}

async function enrichSingleStop(city: string, stop: TripStop): Promise<TripStop> {
  let next = { ...stop }
  const placeQuery = `${stop.name} ${stop.address ?? ''} ${city} Morocco`
  const textMatch = await searchGooglePlace(placeQuery)
  if (textMatch) {
    const placeId = textMatch.id
    const lat = textMatch.location?.latitude
    const lng = textMatch.location?.longitude
    const photoName = textMatch.photos?.[0]?.name
    const googleImage = photoName ? buildPhotoUrl(photoName) : ''
    const realName = next.id.startsWith('generic-') ? textMatch.displayName?.text : undefined
    next = replaceStopPreservingUI(next, {
      placeId,
      ...(realName ? { name: realName } : {}),
      address: textMatch.formattedAddress ?? next.address,
      lat: typeof lat === 'number' ? lat : next.lat,
      lng: typeof lng === 'number' ? lng : next.lng,
      rating: typeof textMatch.rating === 'number' ? textMatch.rating : next.rating,
      phone: textMatch.nationalPhoneNumber ?? next.phone,
      website: textMatch.websiteUri ?? next.website,
      openNow: textMatch.regularOpeningHours?.openNow,
      openingHours: textMatch.regularOpeningHours?.weekdayDescriptions ?? next.openingHours,
      // Prefer Google photo, fallback to seeded local image
      image: googleImage || next.image || buildGrayPlaceholder(next.name),
    })
    if (placeId) {
      const details = await getGooglePlaceDetails(placeId)
      if (details) {
        const detailPhotoName = details.photos?.[0]?.name
        const detailImage = detailPhotoName ? buildPhotoUrl(detailPhotoName) : ''
        next = replaceStopPreservingUI(next, {
          address: details.formattedAddress ?? next.address,
          lat: typeof details.location?.latitude === 'number' ? details.location.latitude : next.lat,
          lng: typeof details.location?.longitude === 'number' ? details.location.longitude : next.lng,
          rating: typeof details.rating === 'number' ? details.rating : next.rating,
          phone: details.nationalPhoneNumber ?? next.phone,
          website: details.websiteUri ?? next.website,
          openNow: details.regularOpeningHours?.openNow,
          openingHours: details.regularOpeningHours?.weekdayDescriptions ?? next.openingHours,
          image: detailImage || next.image,
          reviews: Array.isArray(details.reviews)
            ? details.reviews.slice(0, 2).map((r) => ({ author: r.authorAttribution?.displayName ?? 'Guest', rating: typeof r.rating === 'number' ? r.rating : 0, text: r.text?.text ?? '', relativeTimeDescription: r.relativePublishTimeDescription }))
            : next.reviews,
        })
      }
    }
  }
  if ((typeof next.lat !== 'number' || typeof next.lng !== 'number') && next.address) {
    const geo = await geocodeAddress(`${next.address}, ${city}, Morocco`)
    if (geo) next = replaceStopPreservingUI(next, { lat: geo.lat, lng: geo.lng, address: geo.formattedAddress ?? next.address })
  }
  // Final fallback: use seeded local image, never grey placeholder
  if (!next.image || next.image.startsWith('data:image/svg+xml')) {
    next.image = buildGrayPlaceholder(next.name)
  }
  return next
}

async function enrichPlan(plan: TripPlanType): Promise<TripPlanType> {
  const enrichedDays = await Promise.all(
    plan.days.map(async (day) => {
      const localEnrichedHotel = await enrichSingleStop(plan.city, day.hotel)
      const localEnrichedStops = await Promise.all(day.stops.map((s) => enrichSingleStop(plan.city, s)))
      const backendMerged = await enrichPlacesFromBackend(plan.city, [localEnrichedHotel, ...localEnrichedStops])
      const mergedList = backendMerged ?? [localEnrichedHotel, ...localEnrichedStops]
      const hotel = mergedList[0]
      const stops = mergedList.slice(1)
      const routeSummary = await computeRouteSummary([hotel, ...stops])
      return { ...day, hotel, stops, routeSummary }
    })
  )
  // Prefer Google photo for cover, then local asset, never SVG placeholder
  const candidateCover =
    enrichedDays.flatMap((day) => [day.hotel, ...day.stops])
      .find((stop) => stop.image && !stop.image.startsWith('data:image/svg+xml'))?.image ||
    getLocalCityCover(plan.city) ||
    buildGrayPlaceholder(plan.city)

  return { ...plan, coverImage: candidateCover, days: enrichedDays }
}

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────────── */

const TYPE_CFG: Record<TripStopType, { icon: ReactNode; label: string; color: string; bg: string; dot: string; border: string; textClass: string }> = {
  hotel:      { icon: <Hotel size={11} />,    label: 'Stay',     color: '#6D28D9', bg: '#F5F3FF', dot: '#7C3AED', border: '#DDD6FE', textClass: 'text-violet-700' },
  cafe:       { icon: <Coffee size={11} />,   label: 'Café',     color: '#92400E', bg: '#FFFBEB', dot: '#D97706', border: '#FDE68A', textClass: 'text-amber-700' },
  restaurant: { icon: <Utensils size={11} />, label: 'Dining',   color: '#065F46', bg: '#ECFDF5', dot: '#059669', border: '#A7F3D0', textClass: 'text-emerald-700' },
  activity:   { icon: <Compass size={11} />,  label: 'Explore',  color: '#9A3412', bg: '#FFF7ED', dot: '#EA580C', border: '#FED7AA', textClass: 'text-orange-700' },
}

/* ─────────────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────────────── */

function TypeChip({ type }: { type: TripStopType }) {
  const c = TYPE_CFG[type]
  return (
    <span style={{ backgroundColor: c.bg, color: c.color, borderColor: c.border }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border tracking-wide shrink-0">
      {c.icon} {c.label}
    </span>
  )
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
      <Star size={10} fill="currentColor" /> {rating.toFixed(1)}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────
   HERO COVER
───────────────────────────────────────────────────────────────── */

function HeroCover({ plan, day }: { plan: TripPlanType; day: TripDay }) {
  const isPlaceholder = useCallback(
    (value?: string | null) => !value || value.startsWith('data:image/svg+xml'),
    [],
  )
  const [loaded, setLoaded] = useState(false)

  const images = useMemo(() => {
    const list = [plan.coverImage, day.hotel.image, ...day.stops.map(s => s.image)].filter(Boolean)
    const seen = new Set<string>()
    const unique = list.filter(src => { if (seen.has(src)) return false; seen.add(src); return true })
    return unique.sort((a, b) => Number(isPlaceholder(a)) - Number(isPlaceholder(b)))
  }, [plan.coverImage, day, isPlaceholder])

  const [idx, setIdx] = useState(0)
  const [imgSrc, setImgSrc] = useState(images[0] || plan.coverImage)

  useEffect(() => {
    setIdx(0)
    setImgSrc(images[0] || buildGrayPlaceholder(plan.city))
    setLoaded(false)
  }, [images, plan.city, day.day])

  const go = (dir: 1 | -1) => {
    const next = (idx + dir + images.length) % images.length
    setIdx(next)
    setImgSrc(images[next])
    setLoaded(false)
  }

  return (
    <div className="relative w-full overflow-hidden bg-zinc-200" style={{ aspectRatio: '16/7', minHeight: 220 }}>
      {!loaded && <div className="absolute inset-0 bg-zinc-200 animate-pulse" />}
      <img
        src={imgSrc}
        alt={plan.title}
        onLoad={() => setLoaded(true)}
        onError={() => {
          const currentIndex = images.indexOf(imgSrc)
          const nextReal = images.slice(currentIndex + 1).find((src) => !isPlaceholder(src))
          const fallback = buildGrayPlaceholder(plan.city)
          if (nextReal && nextReal !== imgSrc) {
            setImgSrc(nextReal)
            setLoaded(false)
          } else if (imgSrc !== fallback) {
            setImgSrc(fallback)
            setLoaded(false)
          } else {
            setLoaded(true)
          }
        }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: loaded ? 1 : 0 }}
      />

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* arrows */}
      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all border border-white/20">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all border border-white/20">
            <ChevronRight size={16} />
          </button>
          {/* dots */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); setImgSrc(images[i]); setLoaded(false) }}
                className={`rounded-full transition-all ${i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}

      {/* text */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300 mb-1">{plan.city} · Morocco</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">{plan.title}</h1>
        <p className="text-sm text-white/70 mt-1 max-w-xl line-clamp-2">{plan.subtitle}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   STAT ROW
───────────────────────────────────────────────────────────────── */

function StatRow({ plan }: { plan: TripPlanType }) {
  const totalStops = plan.days.reduce((a, d) => a + d.stops.length, 0)
  return (
    <div className="grid grid-cols-2 border-b border-zinc-100 sm:grid-cols-4">
      {[
        { icon: <Calendar size={13} />, label: 'Days', value: plan.durationDays },
        { icon: <MapPin size={13} />,   label: 'Stops', value: totalStops },
        { icon: <Wallet size={13} />,   label: 'Budget', value: plan.totalEstimate },
        { icon: <Hotel size={13} />,    label: 'Stays', value: plan.days.length },
      ].map((s, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2 border-zinc-100 px-4 py-3 odd:border-r sm:border-r sm:last:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
          <span className="text-zinc-400">{s.icon}</span>
          <div>
            <p className="text-[10px] text-zinc-400 leading-none mb-0.5">{s.label}</p>
            <p className="truncate text-[13px] font-bold text-zinc-900 leading-none">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAP STRIP
───────────────────────────────────────────────────────────────── */

function numberedPin(n: number) {
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;width:22px;height:22px;align-items:center;justify-content:center;border-radius:9999px;background:#f97316;color:#fff;font:600 11px/1 Inter,sans-serif;box-shadow:0 0 0 2px #fff">${n}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function FitToStops({ points }: { points: Array<{ lat: number; lng: number }> }) {
  const map = useMap()
  // Re-fit only when the stops change, not on every render
  const signature = points.map((p) => `${p.lat},${p.lng}`).join('|')
  useEffect(() => {
    const coords = signature ? signature.split('|').map((pair) => pair.split(',').map(Number) as [number, number]) : []
    if (coords.length > 1) map.fitBounds(coords, { padding: [24, 24], maxZoom: 15 })
  }, [map, signature])
  return null
}

function DayMapStrip({ stops, hotel }: { stops: TripStop[]; hotel: TripStop }) {
  const allStops = [hotel, ...stops]
  const withCoords = allStops.filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
  const center = withCoords[0]
  const mapsUrl = buildRouteUrl(allStops)

  if (!center) {
    return (
      <div className="h-32 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center gap-2">
        <MapPin size={20} className="text-zinc-300" />
        <p className="text-[12px] text-zinc-400">Map loading as places enrich…</p>
      </div>
    )
  }

  const markers = withCoords.slice(0, 8).map((s) => ({ lat: s.lat as number, lng: s.lng as number }))

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-100">
      <div className="relative z-0 h-44 bg-zinc-100 sm:h-56">
        <MapContainer
          key={`${center.lat},${center.lng}`}
          center={[center.lat as number, center.lng as number]}
          zoom={14}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          <FitToStops points={markers} />
          {markers.map((point, i) => (
            <Marker key={`${point.lat}-${point.lng}-${i}`} position={[point.lat, point.lng]} icon={numberedPin(i + 1)} />
          ))}
        </MapContainer>
        <div className="absolute bottom-3 right-3 z-[400]">
          <a href={mapsUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-black text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-zinc-800 transition-colors shadow-lg">
            <Navigation size={11} /> Open in Maps <ArrowUpRight size={10} />
          </a>
        </div>
      </div>

      {/* stop list wraps instead of scrolling sideways */}
      <div className="grid grid-cols-1 border-t border-zinc-100 bg-white sm:grid-cols-2">
        {allStops.map((s, i) => (
          <a key={`${s.id}-${i}`} href={s.mapUrl} target="_blank" rel="noreferrer"
            className="group flex min-w-0 items-center gap-2 border-b border-zinc-100 px-3 py-2.5 transition-colors hover:bg-zinc-50">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ backgroundColor: TYPE_CFG[s.type].dot }}>{i + 1}</div>
            <div>
              <p className="truncate text-[12px] font-semibold text-zinc-700 transition-colors group-hover:text-orange-600">{s.name}</p>
              <p className="text-[11px] text-zinc-400">{s.time}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   STOP CARD
───────────────────────────────────────────────────────────────── */

function StopCard({ stop, number }: { stop: TripStop; number: number }) {
  const [imgSrc, setImgSrc] = useState(stop.image || buildGrayPlaceholder(stop.name))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setImgSrc(stop.image || buildGrayPlaceholder(stop.name))
    setLoaded(false)
  }, [stop.image, stop.id, stop.name])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: number * 0.04 }}
      className="bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:border-zinc-200 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex gap-0">
        {/* image */}
        <div className="relative w-24 min-w-24 sm:w-32 sm:min-w-32 bg-zinc-100 self-stretch overflow-hidden">
          {!loaded && <div className="absolute inset-0 animate-pulse bg-zinc-100" />}
          <img
            src={imgSrc}
            alt={stop.name}
            onLoad={() => setLoaded(true)}
            onError={() => {
              const fb = buildGrayPlaceholder(stop.name)
              if (imgSrc !== fb) { setImgSrc(fb); setLoaded(false) }
              else setLoaded(true)
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* number badge */}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md"
            style={{ backgroundColor: TYPE_CFG[stop.type].dot }}>{number}</div>
          {stop.openNow !== undefined && (
            <div className="absolute bottom-2 left-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${stop.openNow ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-white'}`}>
                {stop.openNow ? '● Open' : '● Closed'}
              </span>
            </div>
          )}
        </div>

        {/* content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <TypeChip type={stop.type} />
                {typeof stop.rating === 'number' && <RatingBadge rating={stop.rating} />}
              </div>
              <h4 className="text-[14px] sm:text-[15px] font-bold text-zinc-900 leading-snug truncate">{stop.name}</h4>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 shrink-0 mt-0.5">
              <Clock size={10} />{stop.time}
            </div>
          </div>

          {stop.address && (
            <p className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
              <MapPin size={9} className="shrink-0" />{stop.address}
            </p>
          )}

          <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-2">{stop.description}</p>

          {/* meta row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-50">
            <div className="flex items-center gap-2 flex-wrap">
              {stop.price && (
                <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{stop.price}</span>
              )}
              {stop.phone && (
                <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Phone size={9} />{stop.phone}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {stop.website && (
                <a href={stop.website} target="_blank" rel="noreferrer"
                  className="text-[10px] text-orange-600 font-semibold flex items-center gap-0.5 hover:underline">
                  <Globe size={9} />Web
                </a>
              )}
              <a href={stop.mapUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-700 border border-zinc-200 rounded-full px-2 py-0.5 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all">
                <MapPin size={9} />Map
              </a>
            </div>
          </div>

          {/* review */}
          {stop.reviews?.[0]?.text && (
            <div className="bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold text-zinc-700">{stop.reviews[0].author}</span>
                {stop.reviews[0].rating > 0 && (
                  <span className="text-[9px] text-amber-500 flex items-center gap-0.5">
                    <Star size={8} fill="currentColor" />{stop.reviews[0].rating}
                  </span>
                )}
                {stop.reviews[0].relativeTimeDescription && (
                  <span className="text-[9px] text-zinc-400 ml-auto">{stop.reviews[0].relativeTimeDescription}</span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{stop.reviews[0].text}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   HOTEL CARD
───────────────────────────────────────────────────────────────── */

function HotelCard({ stop }: { stop: TripStop }) {
  const [imgSrc, setImgSrc] = useState(stop.image || buildGrayPlaceholder(stop.name))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setImgSrc(stop.image || buildGrayPlaceholder(stop.name))
    setLoaded(false)
  }, [stop.image, stop.id, stop.name])

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
      <div className="relative h-44 sm:h-52 bg-zinc-100">
        {!loaded && <div className="absolute inset-0 animate-pulse bg-zinc-100" />}
        <img
          src={imgSrc}
          alt={stop.name}
          onLoad={() => setLoaded(true)}
          onError={() => {
            const fb = buildGrayPlaceholder(stop.name)
            if (imgSrc !== fb) { setImgSrc(fb); setLoaded(false) }
            else setLoaded(true)
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

        {/* badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-white text-violet-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-violet-100">
            <Hotel size={10} /> Tonight's Stay
          </span>
          {typeof stop.rating === 'number' && (
            <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full">
              <Star size={8} fill="currentColor" />{stop.rating.toFixed(1)}
            </span>
          )}
        </div>
        {stop.price && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold bg-black/50 text-white backdrop-blur-sm px-2.5 py-1 rounded-full">{stop.price}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
          <h3 className="text-white text-[18px] sm:text-[20px] font-bold leading-tight flex-1 min-w-0 truncate">{stop.name}</h3>
          <a href={stop.mapUrl} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 bg-white text-zinc-900 text-[10px] font-semibold px-2.5 py-1.5 rounded-full hover:bg-zinc-100 transition-colors shrink-0">
            <MapPin size={9} />Map
          </a>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {stop.address && <p className="text-[11px] text-zinc-400 flex items-center gap-1"><MapPin size={9} />{stop.address}</p>}
        <p className="text-[12px] text-zinc-500 leading-relaxed">{stop.description}</p>
        {stop.openingHours?.[0] && <p className="text-[11px] text-zinc-500"><span className="font-semibold">Hours:</span> {stop.openingHours[0]}</p>}
        {stop.phone && <p className="text-[11px] text-zinc-500 flex items-center gap-1"><Phone size={9} />{stop.phone}</p>}
        {stop.website && (
          <a href={stop.website} target="_blank" rel="noreferrer" className="text-[11px] text-orange-600 font-semibold flex items-center gap-1 hover:underline">
            <Globe size={10} />Visit website
          </a>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   STICKY DAY NAV
───────────────────────────────────────────────────────────────── */

function StickyDayNav({
  days,
  selectedDay,
  onSelect,
}: {
  days: TripDay[]
  selectedDay: number
  onSelect: (n: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]') as HTMLElement
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [selectedDay])

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex justify-center md:bottom-0">
      <div className="mx-4 mb-4 w-full max-w-lg">
        <div className="bg-white/90 backdrop-blur-xl border border-zinc-200/80 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 hidden sm:block">Days</span>
            <span className="text-zinc-200 hidden sm:block text-xs">|</span>

            <div ref={scrollRef} className="flex min-w-0 flex-1 gap-1">
              {days.map((d) => {
                const active = d.day === selectedDay
                return (
                  <button
                    key={d.day}
                    data-active={active}
                    onClick={() => onSelect(d.day)}
                    className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-orange-400' : 'bg-zinc-300'}`} />
                    <span className="font-bold">{d.day}</span>
                    <span className="hidden sm:inline opacity-70 max-w-[80px] truncate">{d.title}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0 border-l border-zinc-100 pl-2">
              <button
                onClick={() => selectedDay > 1 && onSelect(selectedDay - 1)}
                disabled={selectedDay <= 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => selectedDay < days.length && onSelect(selectedDay + 1)}
                disabled={selectedDay >= days.length}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   DAY PANEL
───────────────────────────────────────────────────────────────── */

function DayPanel({ day, liveMapHref }: { day: TripDay; liveMapHref: string | null }) {
  const allStops = [day.hotel, ...day.stops]
  const routeUrl = buildRouteUrl(allStops)

  return (
    <motion.div
      key={day.day}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Day header */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Day {day.day}</span>
              {(day.routeSummary?.distanceKm || day.routeSummary?.durationMin) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  <Route size={9} />
                  {day.routeSummary?.distanceKm ? `${day.routeSummary.distanceKm}km` : ''}
                  {day.routeSummary?.distanceKm && day.routeSummary?.durationMin ? ' · ' : ''}
                  {day.routeSummary?.durationMin ? `${day.routeSummary.durationMin}min walk` : ''}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">{day.title}</h2>
            <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed max-w-xl">{day.summary}</p>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1"><MapPin size={10} />{day.area}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {liveMapHref && (
              <Link to={liveMapHref}
                className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-[11px] font-semibold px-3 py-2 rounded-xl hover:bg-zinc-700 transition-colors">
                <Map size={12} />Live map
              </Link>
            )}
            <a href={routeUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 border border-zinc-200 text-zinc-700 text-[11px] font-semibold px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors">
              <Navigation size={12} />Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* map strip */}
      <DayMapStrip stops={day.stops} hotel={day.hotel} />

      {/* hotel */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2 px-0.5 flex items-center gap-1.5">
          <Hotel size={11} className="text-violet-500" /> Tonight's stay
        </p>
        <HotelCard stop={day.hotel} />
      </div>

      {/* stops */}
      {day.stops.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 px-0.5 flex items-center gap-1.5">
            <Compass size={11} className="text-orange-500" /> Route stops · {day.stops.length} places
          </p>
          <div className="space-y-3">
            {day.stops.map((stop, i) => (
              <StopCard key={`${stop.id}-${i}`} stop={stop} number={i + 1} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR OVERVIEW
───────────────────────────────────────────────────────────────── */

function SidebarOverview({
  plan,
  selectedDay,
  onSelect,
  liveMapHref,
}: {
  plan: TripPlanType
  selectedDay: number
  onSelect: (n: number) => void
  liveMapHref: string | null
}) {
  const allDayStops = plan.days.find(d => d.day === selectedDay)
  const routeUrl = buildRouteUrl(allDayStops ? [allDayStops.hotel, ...allDayStops.stops] : [])

  return (
    <aside className="w-72 xl:w-80 shrink-0 hidden lg:block">
      <div className="sticky top-4 space-y-3">
        {/* trip summary card */}
        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
          <div className="relative h-32 bg-zinc-100">
            <img
              src={plan.coverImage}
              alt={plan.title}
              onError={(e) => {
                const fb = buildGrayPlaceholder(plan.city)
                ;(e.currentTarget as HTMLImageElement).src = fb
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[10px] text-white/70 font-medium">{plan.city}</p>
              <p className="text-white text-[15px] font-bold leading-tight truncate">{plan.title}</p>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-2">
            {[
              { label: 'Days', value: plan.durationDays },
              { label: 'Stops', value: plan.days.reduce((a, d) => a + d.stops.length, 0) },
              { label: 'Budget', value: plan.totalEstimate, wide: true },
            ].map((s, i) => (
              <div key={i} className={`bg-zinc-50 rounded-xl p-2.5 ${(s as any).wide ? 'col-span-2' : ''}`}>
                <p className="text-[9px] text-zinc-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                <p className="text-[14px] font-bold text-zinc-900">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4 space-y-2">
            {liveMapHref && (
              <Link to={liveMapHref}
                className="flex items-center justify-center gap-2 w-full bg-zinc-900 text-white text-[12px] font-semibold py-2.5 rounded-xl hover:bg-zinc-700 transition-colors">
                <Map size={13} />Open live map
              </Link>
            )}
            <a href={routeUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-zinc-200 text-zinc-700 text-[12px] font-semibold py-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
              <Navigation size={13} />Google Maps
            </a>
          </div>
        </div>

        {/* day list */}
        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Itinerary</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {plan.days.map((d) => {
              const active = d.day === selectedDay
              return (
                <button key={d.day} onClick={() => onSelect(d.day)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors ${active ? 'bg-orange-50' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    {d.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] font-semibold truncate ${active ? 'text-zinc-900' : 'text-zinc-700'}`}>{d.title}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{d.area} · {d.stops.length + 1} stops</p>
                  </div>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* tags */}
        <div className="flex flex-wrap gap-1.5 px-1">
          {plan.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────────────────── */

function LoadingScreen({ city, days }: { city: string; days: number }) {
  const [dot, setDot] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 400)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-zinc-900 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin size={18} className="text-orange-500" />
        </div>
      </div>
      <p className="text-[15px] font-semibold text-zinc-900 mb-1">
        Planning {days} days in {city}{'.'.repeat(dot + 1)}
      </p>
      <p className="text-[12px] text-zinc-400">Fetching real places from Google</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */

export default function TripPlanPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const state = (location.state as HeroPromptContext | undefined) ?? undefined
  const requestedTripId = searchParams.get('trip')

  const context = useMemo(() => {
    let storedPlannerRequest: HeroPlannerRequest | null = null
    let storedPlannerResult: StoredHeroPlannerResult | null = null
    if (typeof window !== 'undefined') {
      const rawReq = readHeroStorage(HERO_PLANNER_REQUEST_KEY)
      const rawRes = readHeroStorage(HERO_PLANNER_RESULT_KEY)
      if (rawReq) { try { storedPlannerRequest = JSON.parse(rawReq) } catch {} }
      if (rawRes) { try { storedPlannerResult = JSON.parse(rawRes) } catch {} }
    }
    const prompt = state?.prompt ?? ''
    const city =
      typeof state?.city === 'string' && state.city.trim() ? state.city
      : typeof storedPlannerResult?.request?.city === 'string' && storedPlannerResult.request.city.trim() ? storedPlannerResult.request.city
      : typeof storedPlannerRequest?.city === 'string' && storedPlannerRequest.city.trim() ? storedPlannerRequest.city
      : prompt ? extractCity(prompt) : 'Fes'
    const durationDays =
      typeof state?.durationDays === 'number' && state.durationDays > 0 ? state.durationDays
      : typeof storedPlannerResult?.request?.durationDays === 'number' && storedPlannerResult.request.durationDays > 0 ? storedPlannerResult.request.durationDays
      : typeof storedPlannerRequest?.durationDays === 'number' && storedPlannerRequest.durationDays > 0 ? storedPlannerRequest.durationDays
      : prompt ? extractDays(prompt) : 3
    const budgetDh =
      typeof state?.budgetDh === 'number' ? state.budgetDh
      : typeof storedPlannerResult?.request?.budgetDh === 'number' ? storedPlannerResult.request.budgetDh
      : typeof storedPlannerRequest?.budgetDh === 'number' ? storedPlannerRequest.budgetDh
      : prompt ? extractBudget(prompt) : null
    return { prompt, city, durationDays, budgetDh }
  }, [state])

  const [plan, setPlan] = useState<TripPlanType | null>(null)
  const [loading, setLoading] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [loadMessage, setLoadMessage] = useState<string | null>(null)
  const [agendas, setAgendas] = useState<AgendaPreview[]>([])
  const [saving, setSaving] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const hasPlannerContext = useMemo(() => {
    if (requestedTripId) return true
    if (state?.prompt || state?.city) return true
    if (typeof window === 'undefined') return false
    return Boolean(readHeroStorage(HERO_PLANNER_REQUEST_KEY) || readHeroStorage(HERO_LATEST_TRIP_ID_KEY) || readHeroStorage(HERO_PENDING_MAP_OPEN_KEY) === 'true')
  }, [requestedTripId, state?.city, state?.prompt])

  useEffect(() => {
    if (requestedTripId) return
    const latestTripId = readHeroStorage(HERO_LATEST_TRIP_ID_KEY)
    if (!latestTripId) return
    removeHeroStorage(HERO_LATEST_TRIP_ID_KEY)
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('trip', latestTripId); return n }, { replace: true })
  }, [requestedTripId, setSearchParams])

  useEffect(() => {
    let cancelled = false
    const loadAgendas = async () => {
      const next: AgendaPreview[] = []
      const storedHeroTrip = readHeroGeneratedTrip<TripPlanType>()
      if (storedHeroTrip) next.push(buildAgendaPreviewFromStoredPlan(storedHeroTrip))
      const seeded = await Promise.all(Object.keys(CITY_SEEDS).map((c) => buildSeededAgendaPreview(c)))
      if (cancelled) return
      next.push(...seeded)
      const deduped = new globalThis.Map<string, AgendaPreview>()
      next.forEach((a) => { if (!deduped.has(a.id)) deduped.set(a.id, a) })
      setAgendas(Array.from(deduped.values()))
    }
    void loadAgendas()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (requestedTripId || hasPlannerContext || !agendas.length) return
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('trip', agendas[0].id); return n }, { replace: true })
  }, [agendas, hasPlannerContext, requestedTripId, setSearchParams])

  useEffect(() => {
    const rawPlannerRequest = readHeroStorage(HERO_PLANNER_REQUEST_KEY)
    if (!rawPlannerRequest || requestedTripId || !user?.id) return
    let cancelled = false
    const hydrate = async () => {
      try {
        const request = JSON.parse(rawPlannerRequest) as HeroPlannerRequest
        if (!request.ownerUserId) request.ownerUserId = user.id
        const { data } = await requestHeroPlanner<HeroAgentResponse>(request)
        if (cancelled) return
        const nextResult: StoredHeroPlannerResult = { request, response: data, generatedAt: new Date().toISOString() }
        writeHeroStorage(HERO_PLANNER_RESULT_KEY, JSON.stringify(nextResult))
        removeHeroStorage(HERO_PLANNER_REQUEST_KEY)
        writeHeroStorage(HERO_AGENT_NOTICE_KEY, data.answer || 'Got it. Building your agenda now.')
        const tripAction = data.actions?.find((a: any) => a.payload?.tripId)
        const tripId = typeof tripAction?.payload?.tripId === 'string' ? String(tripAction.payload.tripId) : null
        if (tripId) {
          writeHeroStorage(HERO_LATEST_TRIP_ID_KEY, tripId)
          window.dispatchEvent(new CustomEvent('hero-planner-ready'))
          navigate(`/user/maps?trip=${encodeURIComponent(tripId)}`, { replace: true })
          return
        }
        writeHeroStorage(HERO_PENDING_MAP_OPEN_KEY, 'true')
        window.dispatchEvent(new CustomEvent('hero-planner-ready'))
      } catch (error) {
        console.error('Trip plan hydration failed:', error)
        if (!cancelled) { writeHeroStorage(HERO_PENDING_MAP_OPEN_KEY, 'true'); removeHeroStorage(HERO_PLANNER_REQUEST_KEY) }
      }
    }
    void hydrate()
    return () => { cancelled = true }
  }, [navigate, requestedTripId, user?.id])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setLoading(true); setEnriching(false); setLoadMessage(null)
      if (requestedTripId) {
        if (requestedTripId.startsWith('seed:')) {
          const cityFromSeed = requestedTripId.slice(5)
          const cityName = Object.keys(CITY_SEEDS).find((e) => e.toLowerCase() === cityFromSeed)
          const seededPlan = createLocalPlan(cityName ?? context.city, context.durationDays, context.budgetDh)
          if (cancelled) return
          setPlan(seededPlan); setSelectedDay(1); setLoading(false); setLoadMessage('Curated agenda loaded.'); return
        }
        const draftTrip = DEMO_TRIPS.find((trip) => trip.id === requestedTripId)
        if (draftTrip) {
          const draftPlan = buildDraftPlanFromDemoTrip(draftTrip)
          if (cancelled) return
          setPlan(draftPlan); setSelectedDay(1); setLoading(false); setLoadMessage('Curated agenda loaded. Enhancing places...')
          try {
            setEnriching(true)
            const enrichedDraftPlan = await enrichPlan(draftPlan)
            if (!cancelled) {
              setPlan(enrichedDraftPlan)
              setLoadMessage('Curated agenda loaded.')
            }
          } catch (innerError) {
            console.error(innerError)
            if (!cancelled) setLoadMessage('Curated agenda loaded. Some images are still loading.')
          } finally {
            if (!cancelled) setEnriching(false)
          }
          return
        }
        const storedHeroTrip = readHeroGeneratedTrip<TripPlanType>(requestedTripId)
        if (storedHeroTrip) {
          if (cancelled) return
          setPlan(storedHeroTrip.plan); setSelectedDay(1); setLoading(false); setLoadMessage('Saved route loaded.'); return
        }
        try {
          const { data } = await getPublicTrip(requestedTripId)
          if (cancelled) return
          const mappedPlan = mapPublicTripToPlan(data)
          setPlan(mappedPlan); setSelectedDay(1); setLoading(false); setLoadMessage('Saved planner route loaded. Enhancing places...')
          try {
            setEnriching(true)
            const enrichedPlan = await enrichPlan(mappedPlan)
            if (!cancelled) {
              setPlan(enrichedPlan)
              setLoadMessage('Saved planner route loaded.')
            }
          } catch (innerError) {
            console.error(innerError)
            if (!cancelled) setLoadMessage('Saved planner route loaded. Some images are still loading.')
          } finally {
            if (!cancelled) setEnriching(false)
          }
          return
        } catch (error) {
          console.error(error)
          if (!cancelled) setLoadMessage('Could not load saved trip. Falling back to local route.')
        }
      }
      const localPlan = createLocalPlan(context.city, context.durationDays, context.budgetDh)
      const shouldOpenMap = readHeroStorage(HERO_PENDING_MAP_OPEN_KEY) === 'true'
      if (!cancelled && !shouldOpenMap) { setPlan(localPlan); setSelectedDay(1); setLoading(false); setLoadMessage('Loading real place data from Google…') }
      try {
        setEnriching(true)
        const enriched = await enrichPlan(localPlan)
        if (!cancelled) {
          if (shouldOpenMap) {
            const generatedTripId = storeHeroGeneratedPlan(enriched)
            writeHeroStorage(HERO_LATEST_TRIP_ID_KEY, generatedTripId)
            removeHeroStorage(HERO_PENDING_MAP_OPEN_KEY)
            navigate(`/user/maps?trip=${encodeURIComponent(generatedTripId)}`, { replace: true })
            return
          }
          setPlan(enriched); setLoadMessage(null)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          if (shouldOpenMap) {
            const generatedTripId = storeHeroGeneratedPlan(localPlan)
            writeHeroStorage(HERO_LATEST_TRIP_ID_KEY, generatedTripId)
            removeHeroStorage(HERO_PENDING_MAP_OPEN_KEY)
            navigate(`/user/maps?trip=${encodeURIComponent(generatedTripId)}`, { replace: true })
            return
          }
          setLoadMessage('Places loaded with partial data.')
        }
      } finally {
        if (!cancelled) { setEnriching(false); if (shouldOpenMap) setLoading(true) }
      }
    }
    boot()
    return () => { cancelled = true }
  }, [context.city, context.durationDays, context.budgetDh, navigate, requestedTripId])

  const goTo = useCallback((n: number) => {
    setSelectedDay(n)
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const day = useMemo(() => {
    if (!plan) return null
    return plan.days.find((e) => e.day === selectedDay) ?? plan.days[0]
  }, [plan, selectedDay])

  const isSaved = isSavedTripId(requestedTripId)

  const handleSaveTrip = async () => {
    if (!plan || saving || isSaved) return
    try {
      setSaving(true)
      const { data } = await saveMyTrip(buildSaveTripPayload(plan))
      toast.success('Trip saved to your account')
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('trip', data.id); return n }, { replace: true })
    } catch (error) {
      console.error('Saving trip failed:', error)
      toast.error('Could not save this trip. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const liveMapHref = requestedTripId ? `/user/maps?trip=${encodeURIComponent(requestedTripId)}` : null
  const relatedAgendas = agendas.filter((a) => a.id !== requestedTripId).slice(0, 4)

  if (loading || !plan || !day) return <LoadingScreen city={context.city} days={context.durationDays} />

  return (
    /* ── white background, no grey ── */
    <div className="min-h-screen bg-white">

      {/* ── TOP NAV — NOT sticky, scrolls away with the page ── */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-3">
          <Link to="/user/dashboard" state={context}
            className="flex items-center gap-1 text-[12px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
            <ChevronLeft size={14} /> Back
          </Link>
          <span className="text-zinc-200 text-sm">|</span>
          <span className="text-[12px] font-semibold text-zinc-700 truncate">{plan.title}</span>
          <span className="ml-auto" />
          {enriching && (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Loader2 size={11} className="animate-spin text-orange-500" />
              <span className="hidden sm:inline">Enriching with Google data…</span>
            </span>
          )}
          {loadMessage && !enriching && (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <CheckCircle2 size={11} className="text-emerald-500" />
              <span className="hidden sm:inline">{loadMessage}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveTrip}
            disabled={saving || isSaved}
            className="shrink-0 flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[12px] font-semibold text-orange-600 transition-colors hover:bg-orange-100 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-600">
            {saving ? <Loader2 size={12} className="animate-spin" /> : isSaved ? <CheckCircle2 size={12} /> : <Bookmark size={12} />}
            {isSaved ? 'Saved' : 'Save trip'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 pb-28">
        {/* hero */}
        <div ref={topRef} className="rounded-2xl overflow-hidden border border-zinc-100 shadow-sm mb-4 bg-white">
          <HeroCover plan={plan} day={day} />
          <StatRow plan={plan} />
        </div>

        {/* layout */}
        <div className="flex gap-5 items-start">
          {/* main */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <DayPanel key={day.day} day={day} liveMapHref={liveMapHref} />
            </AnimatePresence>

            {/* related agendas */}
            {relatedAgendas.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Heart size={11} className="text-orange-500" /> More trips
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  {relatedAgendas.map((agenda) => (
                    <button key={agenda.id}
                      onClick={() => navigate(`/user/trip-plan?trip=${encodeURIComponent(agenda.id)}`)}
                      className="group text-left bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:border-zinc-200 hover:shadow-sm transition-all">
                      <div className="relative h-28 bg-zinc-100">
                        <img src={agenda.coverImage} alt={agenda.title}
                          onError={(e) => {
                            const fb = buildGrayPlaceholder(agenda.city)
                            ;(e.currentTarget as HTMLImageElement).src = fb
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-white text-[13px] font-bold leading-snug truncate">{agenda.title}</p>
                          <p className="text-white/60 text-[10px]">{agenda.city}</p>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">{agenda.summary}</p>
                        <div className="flex gap-1.5">
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{agenda.durationDays}d</span>
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{agenda.stopsCount} stops</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* sidebar */}
          <SidebarOverview plan={plan} selectedDay={selectedDay} onSelect={goTo} liveMapHref={liveMapHref} />
        </div>
      </div>

      {/* sticky day nav */}
      <StickyDayNav days={plan.days} selectedDay={selectedDay} onSelect={goTo} />
    </div>
  )
}
