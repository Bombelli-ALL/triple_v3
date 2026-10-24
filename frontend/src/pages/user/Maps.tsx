// Maps.tsx — Google Maps full rewrite
// APIs used: Maps JS API, Routes API (REST), Places API, Geocoding API
// Keys via .env:
//   VITE_GOOGLE_MAPS_API_KEY
//   VITE_GOOGLE_ROUTES_API_KEY
//   VITE_GOOGLE_PLACES_API_KEY      (can be same as MAPS key if both APIs enabled on it)
//   VITE_GOOGLE_GEOCODING_API_KEY   (can be same as MAPS key if Geocoding enabled on it)

import {
  useCallback, useEffect, useMemo, useRef, useState, Fragment,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  GoogleMap, useJsApiLoader, Marker, Polyline, Circle,
  OverlayView, OverlayViewF,
} from '@react-google-maps/api'
import { trackGamificationEvent } from '@/lib/gamification'
import { Search, X, Trash2, ChevronDown, MapPin, Clock, Calendar, LocateFixed, Plus, Minus, AlertTriangle, Coffee, Utensils, Hotel, Landmark, ShoppingBag, Dumbbell, Trees, Loader2, Wine, Pill, Banknote, Bus, Compass, Route, Phone, CircleCheck, Star, MessageCircle, ExternalLink, ImageIcon } from 'lucide-react'
import type {
  PoiKind, RouteWaypoint, DemoTrip, ManualPin,
} from './types'
import { DEMO_TRIPS, normalizeWaypoints, fmt, tripById } from './mapUtils'
import { getPublicTrip, type PublicTrip, type PublicTripItem } from '@/lib/travelApi'
import {
  HERO_PLANNER_RESULT_KEY,
  HERO_LATEST_TRIP_ID_KEY,
  readHeroGeneratedTrip,
  readHeroStorage,
  removeHeroStorage,
} from '@/lib/heroGeneratedTrip'
import type { StoredHeroPlannerResult, TravelPlan } from '@/lib/agent'
import { AGENT_VISIBILITY_EVENT } from '@/components/layouts/user/AgentBubble'

// ─────────────────────────────────────────────────────────────────────────────
// ENV KEYS
// ─────────────────────────────────────────────────────────────────────────────
const GMAPS_KEY     = import.meta.env.VITE_GOOGLE_MAPS_API_KEY     as string
const ROUTES_KEY    = import.meta.env.VITE_GOOGLE_ROUTES_API_KEY   as string

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const BRAND  = '#FC4C02'
const BLUE   = '#4285F4'
const GREEN  = '#10B981'
const PURPLE = '#7C3AED'

const DEFAULT_CENTER = { lat: 33.8935, lng: -5.5473 }
const DEFAULT_ZOOM   = 13
const BOTTOM_NAV_VISIBILITY_EVENT = 'trippple:bottom-nav-visibility'

// IMPORTANT: defined OUTSIDE component so reference is stable — prevents
// useJsApiLoader from re-running on every render.
const GMAP_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry']

const MAP_STYLES_DEFAULT: google.maps.MapTypeStyle[] = [
  { featureType: 'poi',     elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers:               [{ visibility: 'simplified' }]   },
]
const MAP_STYLES_LIGHT: google.maps.MapTypeStyle[] = [
  ...MAP_STYLES_DEFAULT,
  { featureType: 'all', elementType: 'geometry', stylers: [{ lightness: 20 }] },
]

const TILE_MODES = {
  Default:   { mapTypeId: 'roadmap'   as const, styles: MAP_STYLES_DEFAULT },
  Light:     { mapTypeId: 'roadmap'   as const, styles: MAP_STYLES_LIGHT   },
  Satellite: { mapTypeId: 'satellite' as const, styles: []                 },
}
type TileKey = keyof typeof TILE_MODES

type CatKey = 'all'|'restaurant'|'cafe'|'hotel'|'attraction'|'shop'|'park'|'gym'|'pharmacy'|'bank'

const CATS: { key: CatKey; label: string; color: string; Icon: React.FC<any> }[] = [
  { key: 'all',        label: 'All',         color: '#1a1a2e', Icon: Compass    },
  { key: 'restaurant', label: 'Restaurants', color: '#E85D04', Icon: Utensils    },
  { key: 'cafe',       label: 'Cafés',       color: '#EAB308', Icon: Coffee      },
  { key: 'hotel',      label: 'Hotels',      color: '#0077B6', Icon: Hotel       },
  { key: 'attraction', label: 'Sights',      color: '#2D6A4F', Icon: Landmark    },
  { key: 'shop',       label: 'Shops',       color: '#C9184A', Icon: ShoppingBag },
  { key: 'park',       label: 'Parks',       color: '#40916C', Icon: Trees       },
  { key: 'gym',        label: 'Fitness',     color: '#D62828', Icon: Dumbbell    },
  { key: 'pharmacy',   label: 'Pharmacy',    color: '#0B9494', Icon: Pill        },
  { key: 'bank',       label: 'Banks',       color: '#2563EB', Icon: Banknote    },
]

const CAT_TO_PLACES_TYPE: Record<Exclude<CatKey,'all'>, string[]> = {
  restaurant: ['restaurant', 'food', 'meal_takeaway'],
  cafe:       ['cafe', 'bakery'],
  hotel:      ['lodging'],
  attraction: ['tourist_attraction', 'museum', 'art_gallery', 'point_of_interest'],
  shop:       ['shopping_mall', 'store', 'clothing_store'],
  park:       ['park', 'natural_feature'],
  gym:        ['gym', 'health'],
  pharmacy:   ['pharmacy', 'drugstore'],
  bank:       ['bank', 'atm'],
}

// ─────────────────────────────────────────────────────────────────────────────
// POI META
// ─────────────────────────────────────────────────────────────────────────────
interface PoiMeta { label: string; color: string; bg: string; Icon: React.FC<any> }
const KIND_META: Record<string, PoiMeta> = {
  restaurant: { label: 'Restaurant', color: '#E85D04', bg: '#FFF1EB', Icon: Utensils    },
  cafe:       { label: 'Café',       color: '#EAB308', bg: '#FFF8DB', Icon: Coffee      },
  hotel:      { label: 'Hotel',      color: '#0077B6', bg: '#E8F4FD', Icon: Hotel       },
  attraction: { label: 'Attraction', color: '#2D6A4F', bg: '#EDFAF4', Icon: Landmark    },
  shop:       { label: 'Shop',       color: '#C9184A', bg: '#FDE8EF', Icon: ShoppingBag },
  park:       { label: 'Park',       color: '#40916C', bg: '#E8F5EE', Icon: Trees       },
  gym:        { label: 'Fitness',    color: '#D62828', bg: '#FDE8E8', Icon: Dumbbell    },
  bar:        { label: 'Bar',        color: '#F97316', bg: '#FFF3EB', Icon: Wine        },
  pharmacy:   { label: 'Pharmacy',   color: '#0B9494', bg: '#E6F7F7', Icon: Pill        },
  bank:       { label: 'Bank',       color: '#2563EB', bg: '#EBF2FE', Icon: Banknote    },
  hospital:   { label: 'Hospital',   color: '#DC2626', bg: '#FEE2E2', Icon: Plus        },
  transport:  { label: 'Transport',  color: '#6B7280', bg: '#F3F4F6', Icon: Bus         },
}
function poiMeta(kind?: PoiKind): PoiMeta {
  return KIND_META[kind ?? ''] ?? { label: 'Place', color: '#6366F1', bg: '#EEF2FF', Icon: MapPin }
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface PlaceReview {
  author: string; rating: number; text: string; time: string
}
interface Poi {
  id: string; lat: number; lng: number; name: string; kind: PoiKind
  subtitle: string; address?: string; openingHours?: string; phone?: string
  website?: string; image?: string | null; rating?: number; placeId?: string
  reviewCount?: number; reviews?: PlaceReview[]; allPhotos?: string[]
  isOpen?: boolean; weekdayText?: string[]; summary?: string
}
interface ComputedNav {
  points: google.maps.LatLngLiteral[]
  distM: number; durS: number
  legs: number[]; steps: Array<{ instruction: string; distM: number; type: string }>
  failed?: boolean
  note?: string
}

type RouteMode = 'WALKING' | 'DRIVING' | 'TRANSIT'

type PlannerResolvedWaypoint = RouteWaypoint & {
  image?: string | null
}

const ROUTE_MODE_OPTIONS: Array<{ key: RouteMode; label: string }> = [
  { key: 'WALKING', label: 'Walk' },
  { key: 'DRIVING', label: 'Drive' },
  { key: 'TRANSIT', label: 'Transit' },
]

const CITY_TRIP_IMAGES: Record<string, string> = {
  marrakech: '/assets/places/m3.jpeg',
  fes: '/assets/places/m4.jpeg',
  fez: '/assets/places/m4.jpeg',
  rabat: '/assets/places/m5.jpeg',
  casablanca: '/assets/places/m6.jpeg',
  tangier: '/assets/places/m7.jpeg',
  chefchaouen: '/assets/places/m3.jpeg',
  essaouira: '/assets/places/m5.jpeg',
  agadir: '/assets/places/m6.jpeg',
}

function pickTripImage(city?: string | null) {
  const key = city?.trim().toLowerCase() || ''
  return CITY_TRIP_IMAGES[key] ?? '/assets/places/m3.jpeg'
}

function normalizeBackendTripKind(value?: string | null): PoiKind {
  const raw = value?.trim().toLowerCase()
  switch (raw) {
    case 'restaurant':
    case 'cafe':
    case 'hotel':
    case 'shop':
    case 'park':
    case 'gym':
    case 'bar':
    case 'pharmacy':
    case 'bank':
    case 'hospital':
    case 'transport':
      return raw
    default:
      return 'attraction'
  }
}

function sortTripItems(items: PublicTripItem[]) {
  return [...items].sort((a, b) => {
    const dayA = a.day ?? Number.MAX_SAFE_INTEGER
    const dayB = b.day ?? Number.MAX_SAFE_INTEGER
    if (dayA !== dayB) return dayA - dayB

    const timeA = a.time ? new Date(a.time).getTime() : Number.MAX_SAFE_INTEGER
    const timeB = b.time ? new Date(b.time).getTime() : Number.MAX_SAFE_INTEGER
    if (timeA !== timeB) return timeA - timeB

    return a.title.localeCompare(b.title)
  })
}

function sanitizePlannerStopTitle(text: string) {
  return text
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function readPlannerResultForTrip(tripId: string): StoredHeroPlannerResult | null {
  const raw = readHeroStorage(HERO_PLANNER_RESULT_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredHeroPlannerResult
    const actionTripId = parsed.response.actions?.find((action) => action.payload?.tripId)?.payload?.tripId
    return actionTripId === tripId ? parsed : null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES API (REST) — real road polylines
// ─────────────────────────────────────────────────────────────────────────────
async function fetchRoutesAPI(
  waypoints: RouteWaypoint[],
  profile: 'foot' | 'bike' | 'driving',
): Promise<ComputedNav | null> {
  if (waypoints.length < 2) return null
  const travelMode = profile === 'foot' ? 'WALK' : profile === 'bike' ? 'BICYCLE' : 'DRIVE'
  const origin      = { location: { latLng: { latitude: waypoints[0].lat, longitude: waypoints[0].lng } } }
  const destination = { location: { latLng: { latitude: waypoints[waypoints.length - 1].lat, longitude: waypoints[waypoints.length - 1].lng } } }
  const intermediates = waypoints.slice(1, -1).map(w => ({ location: { latLng: { latitude: w.lat, longitude: w.lng } } }))
  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': ROUTES_KEY,
        'X-Goog-FieldMask': 'routes.polyline,routes.legs,routes.distanceMeters,routes.duration',
      },
      body: JSON.stringify({
        origin, destination,
        intermediates: intermediates.length ? intermediates : undefined,
        travelMode,
        polylineQuality: 'HIGH_QUALITY',
        computeAlternativeRoutes: false,
      }),
    })
    if (!res.ok) return null
    const data  = await res.json()
    const route = data.routes?.[0]
    if (!route) return null
    const points = decodePolyline(route.polyline?.encodedPolyline ?? '')
    const distM  = route.distanceMeters ?? 0
    const durS   = parseInt(String(route.duration ?? '0').replace('s', ''), 10)
    const legs: number[] = (route.legs ?? []).map((l: any) => l.distanceMeters ?? 0)
    const steps: Array<{ instruction: string; distM: number; type: string }> = (route.legs?.[0]?.steps ?? []).map((s: any) => ({
      instruction: s.navigationInstruction?.instructions ?? 'Continue',
      distM:       s.distanceMeters ?? 0,
      type:        s.navigationInstruction?.maneuver?.toLowerCase() ?? 'continue',
    }))
    return { points, distM, durS, legs, steps }
  } catch { return null }
}

async function fetchDirectionsRoute(
  waypoints: RouteWaypoint[],
  mode: RouteMode,
): Promise<ComputedNav | null> {
  if (typeof google === 'undefined' || !google.maps?.DirectionsService || waypoints.length < 2) {
    return null
  }

  const service = new google.maps.DirectionsService()
  const points: google.maps.LatLngLiteral[] = []
  const legs: number[] = []
  const steps: Array<{ instruction: string; distM: number; type: string }> = []
  let distM = 0
  let durS = 0

  const sanitizeInstruction = (value?: string) =>
    (value ?? 'Continue').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const origin = { lat: waypoints[index].lat, lng: waypoints[index].lng }
    const destination = { lat: waypoints[index + 1].lat, lng: waypoints[index + 1].lng }

    const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: google.maps.TravelMode[mode],
        provideRouteAlternatives: false,
      }

      if (mode === 'TRANSIT') {
        request.transitOptions = { departureTime: new Date() }
      }

      service.route(request, (response, status) => {
        resolve(status === google.maps.DirectionsStatus.OK && response ? response : null)
      })
    })

    if (!result?.routes?.[0]) return null

    const route = result.routes[0]
    const routePoints = (route.overview_path ?? []).map((point) => ({ lat: point.lat(), lng: point.lng() }))
    routePoints.forEach((point, pointIndex) => {
      if (index > 0 && pointIndex === 0) return
      points.push(point)
    })

    for (const leg of route.legs ?? []) {
      const legDistance = leg.distance?.value ?? 0
      const legDuration = leg.duration?.value ?? 0
      distM += legDistance
      durS += legDuration
      legs.push(legDistance)

      for (const step of leg.steps ?? []) {
        steps.push({
          instruction: sanitizeInstruction(step.instructions),
          distM: step.distance?.value ?? 0,
          type: String(step.travel_mode ?? mode).toLowerCase(),
        })
      }
    }
  }

  return { points, distM, durS, legs, steps }
}

function routeGradientPalette(mode: RouteMode) {
  switch (mode) {
    case 'WALKING':
      return {
        glow: '#10B981',
        start: { r: 16, g: 185, b: 129 },
        end: { r: 6, g: 182, b: 212 },
      }
    case 'TRANSIT':
      return {
        glow: '#6366F1',
        start: { r: 99, g: 102, b: 241 },
        end: { r: 59, g: 130, b: 246 },
      }
    case 'DRIVING':
    default:
      return {
        glow: '#FC4C02',
        start: { r: 252, g: 76, b: 2 },
        end: { r: 245, g: 158, b: 11 },
      }
  }
}

function interpolateRouteColor(progress: number, mode: RouteMode) {
  const clamped = Math.max(0, Math.min(1, progress))
  const { start, end } = routeGradientPalette(mode)
  const mix = (from: number, to: number) => Math.round(from + (to - from) * clamped)
  return `rgb(${mix(start.r, end.r)}, ${mix(start.g, end.g)}, ${mix(start.b, end.b)})`
}

function buildRouteSegments(points: google.maps.LatLngLiteral[], mode: RouteMode) {
  const total = Math.max(points.length - 2, 1)
  return points.slice(0, -1).map((point, index) => ({
    id: `${mode}-${index}`,
    path: [point, points[index + 1]],
    color: interpolateRouteColor(index / total, mode),
  }))
}

function routeDayOptions(waypoints: RouteWaypoint[]) {
  return Array.from(
    new Set(
      waypoints
        .map((wp) => (typeof wp.day === 'number' && Number.isFinite(wp.day) ? wp.day : null))
        .filter((value): value is number => value !== null),
    ),
  ).sort((a, b) => a - b)
}

function filterWaypointsByDay(waypoints: RouteWaypoint[], day: number | null) {
  if (!day) return waypoints
  return waypoints.filter((wp) => (wp.day ?? day) === day)
}

async function resolveRouteGeometry(
  waypoints: RouteWaypoint[],
  mode: RouteMode,
): Promise<ComputedNav | null> {
  if (mode === 'TRANSIT') {
    const transit =
      (await fetchDirectionsRoute(waypoints, 'TRANSIT'))
    if (transit) return transit

    const walkFallback =
      (await fetchDirectionsRoute(waypoints, 'WALKING')) ??
      (await fetchRoutesAPI(waypoints, 'foot'))
    return walkFallback ? {
      ...walkFallback,
      note: 'Transit is limited for this route, showing the walking connector instead.',
    } : null
  }

  if (mode === 'WALKING') {
    return (
      (await fetchDirectionsRoute(waypoints, 'WALKING')) ??
      (await fetchRoutesAPI(waypoints, 'foot'))
    )
  }

  const driving =
    (await fetchDirectionsRoute(waypoints, 'DRIVING')) ??
    (await fetchRoutesAPI(waypoints, 'driving'))
  if (driving) return driving

  const walkFallback =
    (await fetchDirectionsRoute(waypoints, 'WALKING')) ??
    (await fetchRoutesAPI(waypoints, 'foot'))
  return walkFallback ? {
    ...walkFallback,
    note: 'Driving was not available for this route, so the map is showing the walking connector instead.',
  } : null
}

function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  const pts: google.maps.LatLngLiteral[] = []
  let i = 0, lat = 0, lng = 0
  while (i < encoded.length) {
    let b, s = 0, r = 0
    do { b = encoded.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5 } while (b >= 0x20)
    lat += (r & 1) ? ~(r >> 1) : r >> 1; s = 0; r = 0
    do { b = encoded.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5 } while (b >= 0x20)
    lng += (r & 1) ? ~(r >> 1) : r >> 1
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return pts
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACES helpers
// ─────────────────────────────────────────────────────────────────────────────
function kindFromTypes(types: string[]): PoiKind {
  if (types.some(t => ['restaurant','food','meal_takeaway','meal_delivery'].includes(t))) return 'restaurant'
  if (types.some(t => ['cafe','bakery'].includes(t))) return 'cafe'
  if (types.includes('lodging')) return 'hotel'
  if (types.some(t => ['tourist_attraction','museum','art_gallery','point_of_interest'].includes(t))) return 'attraction'
  if (types.some(t => ['park','natural_feature'].includes(t))) return 'park'
  if (types.some(t => ['gym','health','stadium'].includes(t))) return 'gym'
  if (types.some(t => ['pharmacy','drugstore'].includes(t))) return 'pharmacy'
  if (types.some(t => ['bank','atm','finance'].includes(t))) return 'bank'
  if (types.some(t => ['shopping_mall','store','clothing_store'].includes(t))) return 'shop'
  if (types.some(t => ['bar','night_club'].includes(t))) return 'bar'
  if (types.some(t => ['hospital','doctor','clinic'].includes(t))) return 'hospital'
  return 'place' as PoiKind
}

function placeToPoi(p: google.maps.places.PlaceResult): Poi | null {
  if (!p.geometry?.location || !p.name) return null
  const lat  = p.geometry.location.lat()
  const lng  = p.geometry.location.lng()
  const kind = kindFromTypes(p.types ?? [])
  const { label } = poiMeta(kind)
  return {
    id:           `gp-${p.place_id}`,
    lat, lng, name: p.name, kind,
    subtitle:     `${label}${p.vicinity ? ` · ${p.vicinity}` : ''}`,
    address:      p.formatted_address ?? p.vicinity,
    openingHours: p.opening_hours?.weekday_text?.[0],
    phone:        p.formatted_phone_number,
    website:      p.website,
    image:        p.photos?.[0]?.getUrl({ maxWidth: 400 }) ?? null,
    rating:       p.rating,
    placeId:      p.place_id,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICON FACTORIES
// CRITICAL: use plain {width,height} / {x,y} objects — NOT new google.maps.Size/Point
// Those constructors require the google global which isn't available at module load time.
// ─────────────────────────────────────────────────────────────────────────────
function svgIcon(svg: string, w: number, h: number, ax?: number, ay?: number): google.maps.Icon {
  return {
    url:        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: w, height: h }           as unknown as google.maps.Size,
    anchor:     { x: ax ?? w/2, y: ay ?? h }      as unknown as google.maps.Point,
  }
}

function iconWaypoint(color: string) {
  return svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 40 52">
    <defs>
      <filter id="waypointShadow" x="-40%" y="-25%" width="180%" height="180%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.18"/>
      </filter>
      <linearGradient id="waypointFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <path d="M20 3C11.16 3 4 10.16 4 19c0 12.93 16 29 16 29s16-16.07 16-29C36 10.16 28.84 3 20 3z" fill="url(#waypointFill)" stroke="white" stroke-width="2.5" filter="url(#waypointShadow)"/>
    <circle cx="20" cy="19" r="8.4" fill="white" fill-opacity="0.98"/>
    <circle cx="20" cy="19" r="4.5" fill="${color}"/>
    <circle cx="20" cy="19" r="1.9" fill="white" fill-opacity="0.88"/>
  </svg>`, 34, 46, 17, 44)
}

function iconPoi(color: string, selected: boolean) {
  const id = selected ? 'poiSel' : 'poiBase'
  const w = selected ? 40 : 34
  const h = selected ? 52 : 46
  return svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 40 52">
    <defs>
      <filter id="${id}Shadow" x="-40%" y="-25%" width="180%" height="180%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#0f172a" flood-opacity="${selected ? '0.28' : '0.18'}"/>
      </filter>
      <linearGradient id="${id}Fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <path d="M20 3C11.16 3 4 10.16 4 19c0 12.93 16 29 16 29s16-16.07 16-29C36 10.16 28.84 3 20 3z" fill="url(#${id}Fill)" stroke="white" stroke-width="${selected ? '2.8' : '2.4'}" filter="url(#${id}Shadow)"/>
    <circle cx="20" cy="19" r="${selected ? '9.6' : '8.4'}" fill="white" fill-opacity="0.98"/>
    <circle cx="20" cy="19" r="${selected ? '5.1' : '4.5'}" fill="${color}"/>
    <circle cx="20" cy="19" r="${selected ? '2.15' : '1.9'}" fill="white" fill-opacity="0.88"/>
  </svg>`, w, h, w / 2, h - 2)
}

function iconPin() {
  return svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
    <circle cx="15" cy="14" r="12" fill="${PURPLE}" stroke="white" stroke-width="2.5"/>
    <circle cx="15" cy="14" r="4" fill="white"/>
    <line x1="15" y1="26" x2="15" y2="38" stroke="${PURPLE}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`, 30, 40)
}

function iconUser() {
  return svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="${BLUE}33" stroke="${BLUE}" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="6" fill="${BLUE}" stroke="white" stroke-width="2.5"/>
  </svg>`, 24, 24, 12, 12)
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function KindBadge({ kind }: { kind?: PoiKind }) {
  const { label, color, bg } = poiMeta(kind)
  return <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{label}</span>
}

function RatingStars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(n => (
          <Star key={n} className={`w-3 h-3 ${n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 fill-zinc-200'}`} />
        ))}
      </div>
      <span className="text-[11px] font-bold text-zinc-700">{rating.toFixed(1)}</span>
      {count != null && <span className="text-[10px] text-zinc-400">({count.toLocaleString()})</span>}
    </div>
  )
}

function PlaceDetailsContent({ poi, onAdd, inRoute, onClose, loading, compact = false, agendaHref, routeHref }: {
  poi: Poi
  onAdd: () => void
  inRoute: boolean
  onClose?: () => void
  loading?: boolean
  compact?: boolean
  agendaHref?: string | null
  routeHref?: string | null
}) {
  const { color, bg, Icon } = poiMeta(poi.kind)
  const [showHours, setShowHours] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [photoDragOffset, setPhotoDragOffset] = useState(0)
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
  const imgH = compact ? 'h-34' : 'h-40'
  const galleryPhotos = Array.from(
    new Set((poi.allPhotos?.filter(Boolean) ?? []).length ? poi.allPhotos!.filter(Boolean) : (poi.image ? [poi.image] : [])),
  )
  const hasGallery = galleryPhotos.length > 0
  const wheelLockRef = useRef(false)
  const photoDragRef = useRef<{ active: boolean; startX: number }>({ active: false, startX: 0 })

  const jumpToPhoto = useCallback((index: number) => {
    if (!galleryPhotos.length) return
    const total = galleryPhotos.length
    const normalized = ((index % total) + total) % total
    setActivePhotoIndex(normalized)
  }, [galleryPhotos.length])

  const advancePhoto = useCallback((direction: 1 | -1) => {
    if (galleryPhotos.length <= 1) return
    jumpToPhoto(activePhotoIndex + direction)
  }, [activePhotoIndex, galleryPhotos.length, jumpToPhoto])

  useEffect(() => {
    setActivePhotoIndex(0)
    setPhotoDragOffset(0)
    setIsDraggingPhoto(false)
  }, [poi.id, galleryPhotos.length])

  return (
    <div className="font-sans" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero image */}
      {hasGallery && (
        <div
          className={`${imgH} w-full overflow-hidden rounded-2xl relative mb-2.5 bg-zinc-100`}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onWheel={(event) => {
            if (galleryPhotos.length <= 1) return
            const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : (event.shiftKey ? event.deltaY : 0)
            if (!horizontalDelta || wheelLockRef.current) return
            wheelLockRef.current = true
            window.setTimeout(() => { wheelLockRef.current = false }, 240)
            advancePhoto(horizontalDelta > 0 ? 1 : -1)
            event.preventDefault()
            event.stopPropagation()
          }}
        >
          <div
            className={`flex h-full w-full select-none ${galleryPhotos.length > 1 ? (isDraggingPhoto ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
            onPointerDown={(event) => {
              if (galleryPhotos.length <= 1) return
              photoDragRef.current = { active: true, startX: event.clientX }
              setIsDraggingPhoto(true)
              setPhotoDragOffset(0)
              ;(event.currentTarget as HTMLDivElement).setPointerCapture?.(event.pointerId)
              event.preventDefault()
              event.stopPropagation()
            }}
            onPointerMove={(event) => {
              if (!photoDragRef.current.active || galleryPhotos.length <= 1) return
              const nextOffset = event.clientX - photoDragRef.current.startX
              setPhotoDragOffset(nextOffset)
              event.preventDefault()
              event.stopPropagation()
            }}
            onPointerUp={(event) => {
              if (!photoDragRef.current.active) return
              const finalOffset = photoDragOffset
              photoDragRef.current.active = false
              setIsDraggingPhoto(false)
              setPhotoDragOffset(0)
              ;(event.currentTarget as HTMLDivElement).releasePointerCapture?.(event.pointerId)
              if (galleryPhotos.length > 1) {
                if (finalOffset <= -32) advancePhoto(1)
                else if (finalOffset >= 32) advancePhoto(-1)
              }
              event.preventDefault()
              event.stopPropagation()
            }}
            onPointerCancel={(event) => {
              if (!photoDragRef.current.active) return
              photoDragRef.current.active = false
              setIsDraggingPhoto(false)
              setPhotoDragOffset(0)
              ;(event.currentTarget as HTMLDivElement).releasePointerCapture?.(event.pointerId)
              event.stopPropagation()
            }}
            style={{
              touchAction: 'pan-y',
              transform: `translateX(calc(${-activePhotoIndex * 100}% + ${photoDragOffset}px))`,
              transition: isDraggingPhoto ? 'none' : 'transform 360ms cubic-bezier(.22,1,.36,1)',
            }}
          >
            {galleryPhotos.map((photo, index) => (
              <motion.div
                key={`${poi.id}-photo-${index}`}
                className="relative h-full w-full shrink-0 select-none"
                animate={{
                  scale: index === activePhotoIndex ? 1 : 0.972,
                  opacity: index === activePhotoIndex ? 1 : 0.9,
                  filter: index === activePhotoIndex ? 'saturate(1)' : 'saturate(.88)',
                }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <img
                  src={photo}
                  alt={`${poi.name} ${index + 1}`}
                  className="h-full w-full object-cover pointer-events-none"
                  draggable={false}
                />
              </motion.div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
          {galleryPhotos.length > 1 && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-full pointer-events-none">
              <ImageIcon className="w-2.5 h-2.5 text-white/80" />
              <span className="text-[9px] font-bold text-white/90">{activePhotoIndex + 1} / {galleryPhotos.length}</span>
            </div>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white/92 text-zinc-600 shadow-sm backdrop-blur-sm flex items-center justify-center transition hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {/* Rating overlay */}
          {poi.rating != null && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-extrabold text-zinc-900">{poi.rating.toFixed(1)}</span>
              {poi.reviewCount != null && <span className="text-[9px] text-zinc-400 font-medium">({poi.reviewCount})</span>}
            </div>
          )}
          {galleryPhotos.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none">
              {galleryPhotos.map((_, index) => (
                <span
                  key={`${poi.id}-gallery-dot-${index}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === activePhotoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/45'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-2.5 mb-2">
        <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`${compact ? 'text-[13px]' : 'text-[15px]'} font-extrabold leading-tight text-zinc-900`}>{poi.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <KindBadge kind={poi.kind} />
            {poi.isOpen != null && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${poi.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {poi.isOpen ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
        </div>
        {onClose && !hasGallery && (
          <button onClick={onClose} className="h-8 w-8 rounded-full border border-zinc-200 bg-white text-zinc-500 flex items-center justify-center shrink-0 hover:bg-zinc-50 transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Rating (when no image) */}
      {poi.rating != null && !poi.image && <div className="mb-2"><RatingStars rating={poi.rating} count={poi.reviewCount} /></div>}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 py-2 mb-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          <span className="text-[10px] text-zinc-400 font-medium">Loading details…</span>
        </div>
      )}

      {/* About */}
      {poi.summary && poi.summary !== poi.subtitle && (
        <p className="text-[10px] text-zinc-500 leading-relaxed mb-1.5 line-clamp-2">{poi.summary}</p>
      )}

      {/* Details */}
      <div className="space-y-1 mb-1.5">
        {poi.address && (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-zinc-400" />
            <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{poi.address}</p>
          </div>
        )}
        {poi.openingHours && (
          <div>
            <button onClick={() => setShowHours(!showHours)} className="flex items-center gap-1.5 group">
              <Clock className="w-3 h-3 shrink-0 text-zinc-400" />
              <span className="text-[10px] text-zinc-500">{poi.openingHours}</span>
              {poi.weekdayText && poi.weekdayText.length > 1 && (
                <ChevronDown className={`w-2.5 h-2.5 text-zinc-300 transition-transform ${showHours ? 'rotate-180' : ''}`} />
              )}
            </button>
            {showHours && poi.weekdayText && (
              <div className="ml-4.5 mt-1 space-y-0.5 pl-1 border-l-2 border-zinc-100">
                {poi.weekdayText.map((d, i) => (
                  <p key={i} className="text-[9px] text-zinc-400 leading-relaxed">{d}</p>
                ))}
              </div>
            )}
          </div>
        )}
        {poi.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 shrink-0 text-zinc-400" />
            <a href={`tel:${poi.phone}`} className="text-[10px] text-blue-600 font-medium hover:underline">{poi.phone}</a>
          </div>
        )}
        {poi.website && (
          <div className="flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 shrink-0 text-zinc-400" />
            <a href={poi.website} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 truncate font-medium hover:underline">{poi.website.replace(/^https?:\/\//,'').replace(/\/$/,'')}</a>
          </div>
        )}
      </div>

      {/* Reviews */}
      {poi.reviews && poi.reviews.length > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageCircle className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Reviews</span>
          </div>
          <div className="space-y-1.5">
            {poi.reviews.slice(0, compact ? 2 : 3).map((r, i) => (
              <div key={i} className="bg-zinc-50 rounded-xl px-2.5 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-bold text-zinc-700">{r.author}</span>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} className={`w-2 h-2 ${n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 fill-zinc-200'}`} />)}
                  </div>
                </div>
                <p className="text-[9px] text-zinc-500 leading-relaxed line-clamp-2">{r.text}</p>
                {r.time && <p className="text-[8px] text-zinc-300 mt-0.5">{r.time}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {(agendaHref || routeHref) && (
          <div className="grid grid-cols-2 gap-2">
            {agendaHref ? (
              <Link
                to={agendaHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[11px] font-bold text-zinc-700 transition hover:bg-zinc-50 active:scale-[.98]"
              >
                <Calendar className="h-3.5 w-3.5" />
                Open agenda
              </Link>
            ) : <div />}
            {routeHref ? (
              <Link
                to={routeHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-[11px] font-bold text-[#FC4C02] transition hover:bg-orange-100 active:scale-[.98]"
              >
                <Route className="h-3.5 w-3.5" />
                Open route
              </Link>
            ) : <div />}
          </div>
        )}

        <button onClick={onAdd} className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all hover:opacity-90 active:scale-[.97] shadow-sm ${inRoute ? 'bg-zinc-100 text-zinc-400' : 'text-white'}`} style={inRoute ? {} : { background: BRAND }}>
          {inRoute ? <><CircleCheck className="w-3.5 h-3.5 text-emerald-500" />Saved</> : <><Plus className="w-3.5 h-3.5" />Save spot</>}
        </button>
      </div>
    </div>
  )
}

function RouteStopsList({
  waypoints,
  activeStopId,
  onSelect,
  colorForStop,
  compact = false,
}: {
  waypoints: RouteWaypoint[]
  activeStopId?: string | null
  onSelect: (wp: RouteWaypoint, index: number) => void
  colorForStop: (index: number) => string
  compact?: boolean
}) {
  if (!waypoints.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-[12px] text-zinc-500">
        This draft does not have a saved road yet.
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {waypoints.map((wp, index) => {
        const color = colorForStop(index)
        const active = activeStopId === `wp-${index}`
        return (
          <button
            key={`route-stop-${index}`}
            onClick={() => onSelect(wp, index)}
            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${active ? 'shadow-sm' : 'bg-white hover:-translate-y-0.5 hover:shadow-sm'}`}
            style={active ? { borderColor: `${color}55`, background: `${color}14` } : { borderColor: '#e4e4e7' }}
          >
            <span
              className={`${compact ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-[12px]'} flex shrink-0 items-center justify-center rounded-2xl font-black text-white`}
              style={{ background: color, boxShadow: `0 10px 24px ${color}30` }}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`${compact ? 'text-[12px]' : 'text-[13px]'} block truncate font-bold text-zinc-900`}>
                {wp.label || `Stop ${index + 1}`}
              </span>
              <span className="block text-[10px] text-zinc-400">
                {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
              </span>
            </span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
          </button>
        )
      })}
    </div>
  )
}

function RouteSummaryCard({
  trip,
  image,
  waypoints,
  dayOptions,
  activeDay,
  distanceM,
  durationS,
  routeNote,
  loading,
  routeMode,
  onRouteModeChange,
  onSelectDay,
  stopsOpen,
  onToggleStops,
  onStopClick,
  activeStopId,
  onClear,
  onHide,
  colorForStop,
  compact = false,
}: {
  trip: DemoTrip
  image?: string | null
  waypoints: RouteWaypoint[]
  dayOptions: number[]
  activeDay: number | null
  distanceM: number
  durationS: number
  routeNote?: string | null
  loading: boolean
  routeMode: RouteMode
  onRouteModeChange: (mode: RouteMode) => void
  onSelectDay: (day: number) => void
  stopsOpen: boolean
  onToggleStops: () => void
  onStopClick: (wp: RouteWaypoint, index: number) => void
  activeStopId?: string | null
  onClear: () => void
  onHide?: () => void
  colorForStop: (index: number) => string
  compact?: boolean
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const displayImage = imageFailed ? null : (image || null)

  useEffect(() => {
    setImageFailed(false)
  }, [image, trip.id])

  return (
    <div className={`overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_20px_70px_rgba(15,23,42,.16)] backdrop-blur-xl ${compact ? '' : 'w-full'}`}>
      <div className={compact ? 'px-4 py-4' : 'px-5 py-5'}>
        <div className="flex items-start gap-3">
          <div className={`${compact ? 'h-14 w-14 rounded-[20px]' : 'h-16 w-16 rounded-[22px]'} relative shrink-0 overflow-hidden bg-zinc-100`}>
            {displayImage ? (
              <img
                src={displayImage}
                alt={trip.title}
                className="h-full w-full object-cover"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#fff3ee,#ffe6d8)]">
                <Route className="h-5 w-5 text-[#FC4C02]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FC4C02]">
                <Route className="h-3 w-3" />
                Route
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                {loading ? 'Loading' : `${waypoints.length} stops`}
              </span>
            </div>
            <p className={`mt-2 truncate font-black text-zinc-900 ${compact ? 'text-[14px]' : 'text-[18px]'}`}>
              {trip.title}
            </p>
            <p className={`mt-1 leading-relaxed text-zinc-500 ${compact ? 'line-clamp-2 text-[10px]' : 'line-clamp-3 text-[12px]'}`}>
              {trip.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600">
                {loading ? 'Loading route…' : `${waypoints.length} stops`}
              </span>
              {distanceM > 0 && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600">
                  {fmt.dist(distanceM)}
                </span>
              )}
              {durationS > 0 && (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600">
                  {fmt.time(durationS)}
                </span>
              )}
            </div>

            {dayOptions.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dayOptions.map((day) => {
                  const active = activeDay === day
                  return (
                    <button
                      key={`route-day-${day}`}
                      onClick={() => onSelectDay(day)}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                        active
                          ? 'bg-orange-500 text-white shadow-[0_10px_24px_rgba(252,76,2,.22)]'
                          : 'border border-zinc-200 bg-white text-zinc-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500'
                      }`}
                    >
                      Day {day}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {ROUTE_MODE_OPTIONS.map((mode) => {
                const active = routeMode === mode.key
                const disabled = false
                return (
                  <button
                    key={mode.key}
                    onClick={() => onRouteModeChange(mode.key)}
                    disabled={false}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${active ? 'bg-zinc-900 text-white shadow-[0_10px_24px_rgba(15,23,42,.16)]' : 'border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'} ${disabled ? 'cursor-not-allowed opacity-35' : ''}`}
                  >
                    {mode.label}
                  </button>
                )
              })}
            </div>
            {routeNote && (
              <p className="mt-2 text-[10px] font-medium leading-relaxed text-zinc-500">
                {routeNote}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {onHide && (
              <button
                onClick={onHide}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClear}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={onToggleStops}
          disabled={!waypoints.length}
          className={`mt-4 flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-all ${waypoints.length ? 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-white' : 'cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300'}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
              {activeDay ? `Day ${activeDay}` : 'Stops'}
            </span>
            <span className="truncate text-[11px] text-zinc-500">
              {waypoints.length ? `Tap to ${stopsOpen ? 'hide' : 'show'} ${activeDay ? `day ${activeDay}` : 'all'} stops` : 'No stops yet'}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${stopsOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className={`grid transition-all duration-300 ease-out ${stopsOpen ? 'grid-rows-[1fr] border-t border-zinc-100/80' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className={compact ? 'px-4 pb-4 pt-3' : 'px-5 pb-5 pt-4'}>
            <div className={compact ? 'max-h-[36vh] overflow-y-auto pr-1' : 'max-h-[38vh] overflow-y-auto pr-1'}>
              <RouteStopsList
                waypoints={waypoints}
                activeStopId={activeStopId}
                onSelect={onStopClick}
                colorForStop={colorForStop}
                compact={compact}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Maps() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GMAPS_KEY,
    libraries: GMAP_LIBRARIES,
  })

  // ── UI state ──
  const hasTrackedRef = useRef(false)
  const requestedTripId = searchParams.get('trip')

  // ── Trip / route state ──
  const [selectedTrip,    setSelectedTrip]    = useState<DemoTrip|null>(null)
  const [tripWaypoints,   setTripWaypoints]   = useState<RouteWaypoint[]>([])
  const [tripPoints,      setTripPoints]      = useState<google.maps.LatLngLiteral[]>([])
  const [tripDistM,       setTripDistM]       = useState(0)
  const [tripDurS,        setTripDurS]        = useState(0)
  const [tripRouteNote,   setTripRouteNote]   = useState<string | null>(null)
  const [routePreviewImage, setRoutePreviewImage] = useState<string | null>(null)
  const [tripLoading,     setTripLoading]     = useState(false)
  const [showTripRoute,   setShowTripRoute]   = useState(true)
  const [routeMode,       setRouteMode]       = useState<RouteMode>('WALKING')
  const [selectedRouteDay, setSelectedRouteDay] = useState<number | null>(null)

  // ── Tour ──
  const [tourActive, setTourActive] = useState(false)
  const [tourStop,   setTourStop]   = useState(0)

  // ── Manual pins ──
  const [manualPins, setManualPins] = useState<ManualPin[]>([])
  const [addPinMode, setAddPinMode] = useState(false)
  const pinIdRef = useRef(0)

  // ── POI browsing ──
  const [pois,        setPois]        = useState<Poi[]>([])
  const [poisLoading, setPoisLoading] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState<Poi|null>(null)
  const [cat,         setCat]         = useState<CatKey|null>(null)
  const [placeDetailLoading, setPlaceDetailLoading] = useState(false)
  const [mobilePlaceSheet,   setMobilePlaceSheet]   = useState(false)
  const [mobilePlaceSheetTop, setMobilePlaceSheetTop] = useState(336)
  const [mobileStopsOpen,    setMobileStopsOpen]    = useState(false)
  const [mobileRouteHidden,  setMobileRouteHidden]  = useState(false)
  const [desktopRouteHidden, setDesktopRouteHidden] = useState(false)
  const [desktopStopsOpen,   setDesktopStopsOpen]   = useState(false)
  const [desktopDock,        setDesktopDock]        = useState<'route' | 'place' | null>(null)
  const detailCache = useRef<Map<string, Poi>>(new Map())
  const placesRef = useRef<google.maps.places.PlacesService|null>(null)
  const mobilePlaceDragRef = useRef<{ pointerId: number | null; startY: number; startTop: number }>({
    pointerId: null,
    startY: 0,
    startTop: 336,
  })

  // ── Search ──
  const [searchQ,       setSearchQ]       = useState('')
  const [searchResults, setSearchResults] = useState<Poi[]>([])
  const [searchBusy,    setSearchBusy]    = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const searchRef  = useRef<HTMLDivElement>(null)
  const srchTimer  = useRef<ReturnType<typeof setTimeout>|null>(null)

  // ── Map ──
  const [tile,    setTile]    = useState<TileKey>('Default')
  const [userPos, setUserPos] = useState<{lat:number;lng:number;acc:number}|null>(null)
  const [toast,   setToast]   = useState<string|null>(null)
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM)
  const mapRef    = useRef<google.maps.Map|null>(null)
  const geocoderRef = useRef<google.maps.Geocoder|null>(null)
  const routeDays = useMemo(() => routeDayOptions(tripWaypoints), [tripWaypoints])
  const activeRouteDay = useMemo(() => {
    if (!routeDays.length) return null
    return selectedRouteDay && routeDays.includes(selectedRouteDay) ? selectedRouteDay : routeDays[0]
  }, [routeDays, selectedRouteDay])
  const visibleRouteWaypoints = useMemo(
    () => filterWaypointsByDay(tripWaypoints, activeRouteDay),
    [tripWaypoints, activeRouteDay],
  )
  const wpColor = (i: number) => i===0 ? GREEN : i===visibleRouteWaypoints.length-1 ? BRAND : '#6366F1'
  const inPins  = (poi: Poi) => manualPins.some(p=>Math.abs(p.lat-poi.lat)<0.0001&&Math.abs(p.lng-poi.lng)<0.0001)
  const effectiveRouteMode = routeMode
  const routeSegments = useMemo(
    () => (tripPoints.length >= 2 ? buildRouteSegments(tripPoints, effectiveRouteMode) : []),
    [tripPoints, effectiveRouteMode],
  )
  const routePalette = useMemo(() => routeGradientPalette(effectiveRouteMode), [effectiveRouteMode])
  const routeStrokeIcons = useMemo(() => {
    if (typeof google === 'undefined') return undefined
    if (effectiveRouteMode === 'WALKING') {
      return [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          strokeWeight: 2,
          scale: 3,
        },
        offset: '0',
        repeat: '14px',
      }]
    }
    if (effectiveRouteMode === 'TRANSIT') {
      return [{
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillOpacity: 1,
          fillColor: '#ffffff',
          strokeOpacity: 0,
          scale: 2.6,
        },
        offset: '0',
        repeat: '18px',
      }]
    }
    return undefined
  }, [effectiveRouteMode])
  const bounceRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const poiRequestRef = useRef(0)
  const tripRequestRef = useRef(0)
  const routeIntroTokenRef = useRef(0)
  const routeIntroTripRef = useRef<string | null>(null)

  // ── Gamification ──
  useEffect(() => {
    const ok = tripWaypoints.length>=2||manualPins.length>=2
    if (!ok||hasTrackedRef.current) return
    hasTrackedRef.current = true
    void trackGamificationEvent('MAP_PREVIEWED').catch(()=>{ hasTrackedRef.current=false })
  }, [tripWaypoints.length, manualPins.length])

  // ── Helpers ──
  const showToast = useCallback((msg:string) => {
    setToast(msg); setTimeout(()=>setToast(null), 3000)
  }, [])

  const isMobileViewport = useCallback(() => (
    typeof window !== 'undefined' && window.innerWidth < 1024
  ), [])

  const setTripQuery = useCallback((tripId: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (tripId) next.set('trip', tripId)
      else next.delete('trip')
      return next
    }, { replace: true })
  }, [setSearchParams])

  const flyTo = useCallback((lat:number, lng:number, zoom=15) => {
    mapRef.current?.panTo({lat,lng}); mapRef.current?.setZoom(zoom)
  }, [])

  const wait = useCallback((ms: number) => new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  }), [])

  const fitMapToPoints = useCallback((points: google.maps.LatLngLiteral[], padding = 80) => {
    if (!mapRef.current || points.length < 2) return
    const bounds = new google.maps.LatLngBounds()
    points.forEach(point => bounds.extend(point))
    mapRef.current.fitBounds(bounds, padding)
  }, [])

  const animateTripIntro = useCallback(async (
    tripId: string,
    routePoints: google.maps.LatLngLiteral[],
    fallbackPoints: google.maps.LatLngLiteral[],
  ) => {
    const map = mapRef.current
    const points = routePoints.length >= 2 ? routePoints : fallbackPoints

    if (!map || !points.length) {
      routeIntroTripRef.current = null
      return
    }

    const token = ++routeIntroTokenRef.current
    routeIntroTripRef.current = tripId

    map.panTo(DEFAULT_CENTER)
    map.setZoom(6)
    await wait(420)
    if (routeIntroTokenRef.current !== token) return

    const previewPoint = points[Math.floor(points.length / 2)] ?? points[0]
    map.panTo(previewPoint)
    map.setZoom(8)
    await wait(420)
    if (routeIntroTokenRef.current !== token) return

    map.setZoom(11)
    await wait(420)
    if (routeIntroTokenRef.current !== token) return

    if (routePoints.length >= 2) fitMapToPoints(routePoints, 140)
    else if (fallbackPoints.length >= 2) fitMapToPoints(fallbackPoints, 140)
    else flyTo(points[0].lat, points[0].lng, 15)

    routeIntroTripRef.current = null
  }, [fitMapToPoints, flyTo, wait])

  const mapPublicTripToDemo = useCallback((trip: PublicTrip): DemoTrip => {
    const cityName = trip.city?.name || 'Morocco'
    return {
      id: trip.id,
      title: trip.title || `${cityName} route`,
      city: cityName,
      country: 'Morocco',
      summary:
        trip.description?.trim() ||
        `A saved route through ${cityName} with real stops from your trip planner.`,
      image: pickTripImage(cityName),
      tags: ['Itinerary', cityName],
      route: undefined,
    }
  }, [])

  const geocodeTripWaypoint = useCallback(async (
    geocoder: google.maps.Geocoder,
    item: PublicTripItem,
    cityName: string,
  ): Promise<RouteWaypoint | null> => {
    const address = item.location?.trim() || `${item.title}, ${cityName}, Morocco`

    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status !== 'OK' || !results?.[0]?.geometry?.location) {
          resolve(null)
          return
        }

        const location = results[0].geometry.location
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          label: item.title,
          kind: normalizeBackendTripKind(item.type),
          day: item.day ?? undefined,
        })
      })
    })
  }, [])

  const resolveBackendTripWaypoints = useCallback(async (trip: PublicTrip) => {
    const geocoder = geocoderRef.current ?? new google.maps.Geocoder()
    geocoderRef.current = geocoder

    const sortedItems = sortTripItems(Array.isArray(trip.items) ? trip.items : [])
      .filter((item) => item.title?.trim())
      .slice(0, 12)

    const waypoints = await Promise.all(
      sortedItems.map((item) =>
        geocodeTripWaypoint(geocoder, item, trip.city?.name || trip.title || 'Morocco'),
      ),
    )

    const deduped = new Map<string, RouteWaypoint>()
    waypoints.filter(Boolean).forEach((wp) => {
      const key = `${wp!.lat.toFixed(5)},${wp!.lng.toFixed(5)},${wp!.day ?? 0}`
      if (!deduped.has(key)) deduped.set(key, wp!)
    })

    return Array.from(deduped.values())
  }, [geocodeTripWaypoint])

  const resolveWaypointByPlannerQuery = useCallback(async (
    query: string,
    cityName: string,
  ): Promise<PlannerResolvedWaypoint | null> => {
    const service = placesRef.current
    if (!service) return null

    const searchQuery = `${sanitizePlannerStopTitle(query)}, ${cityName}, Morocco`

    const placeId = await new Promise<string | null>((resolve) => {
      service.findPlaceFromQuery(
        {
          query: searchQuery,
          fields: ['place_id', 'name', 'geometry'],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
            resolve(results[0].place_id)
            return
          }
          resolve(null)
        },
      )
    })

    if (!placeId) return null

    return await new Promise<PlannerResolvedWaypoint | null>((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: ['name', 'geometry', 'photos', 'types'],
        },
        (place, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !place?.geometry?.location
          ) {
            resolve(null)
            return
          }

          resolve({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            label: place.name || sanitizePlannerStopTitle(query),
            kind: kindFromTypes(place.types ?? []),
            image: place.photos?.[0]?.getUrl({ maxWidth: 700 }) ?? null,
          })
        },
      )
    })
  }, [])

  const resolvePlannerTripWaypoints = useCallback(async (
    travelPlan: TravelPlan,
  ): Promise<PlannerResolvedWaypoint[]> => {
    const cityName = travelPlan.to?.city?.trim() || 'Morocco'
    const queries = (travelPlan.itinerary ?? [])
      .flatMap((day) =>
        [...(day.morning ?? []), ...(day.afternoon ?? []), ...(day.evening ?? [])].map((entry) => ({
          day: day.day,
          label: sanitizePlannerStopTitle(entry),
        })),
      )
      .filter((entry) => entry.label)
      .slice(0, 12)

    const resolved = await Promise.all(
      queries.map(async (entry) => {
        const waypoint = await resolveWaypointByPlannerQuery(entry.label, cityName)
        return waypoint ? { ...waypoint, day: entry.day } : null
      }),
    )

    const deduped = new Map<string, PlannerResolvedWaypoint>()
    resolved.filter(Boolean).forEach((wp) => {
      const key = `${wp!.lat.toFixed(5)},${wp!.lng.toFixed(5)},${wp!.day ?? 0}`
      if (!deduped.has(key)) deduped.set(key, wp!)
    })

    const normalizedCity = cityName.trim().toLowerCase()
    const exactFallbackTrip = DEMO_TRIPS.find((trip) => {
      const tripCity = trip.city.trim().toLowerCase()
      return tripCity === normalizedCity || (normalizedCity === 'fes' && tripCity === 'fès') || (normalizedCity === 'fez' && tripCity === 'fès')
    })

    if (deduped.size >= 2 || !exactFallbackTrip?.route?.waypoints?.length) {
      return Array.from(deduped.values())
    }

    const fallbackRoute = exactFallbackTrip.route.waypoints
    const dayCount = Math.max(1, travelPlan.itinerary?.length || 1)
    const chunkSize = Math.max(1, Math.ceil(fallbackRoute.length / dayCount))
    const fallbackResolved = await Promise.all(
      fallbackRoute.map(async (wp, index) => {
        const assignedDay = Math.min(dayCount, Math.floor(index / chunkSize) + 1)
        const resolvedWaypoint = await resolveWaypointByPlannerQuery(wp.label || `${cityName} stop ${index + 1}`, cityName)
        return resolvedWaypoint
          ? { ...resolvedWaypoint, day: assignedDay }
          : { ...wp, day: assignedDay, image: null }
      }),
    )

    const merged = new Map<string, PlannerResolvedWaypoint>()
    ;[...Array.from(deduped.values()), ...fallbackResolved.filter(Boolean)].forEach((wp) => {
      const key = `${wp!.lat.toFixed(5)},${wp!.lng.toFixed(5)},${wp!.day ?? 0}`
      if (!merged.has(key)) merged.set(key, wp!)
    })

    return Array.from(merged.values())
  }, [resolveWaypointByPlannerQuery])

  const resolveRoutePreviewImage = useCallback(async (
    cityName: string,
    candidateLabels: string[],
  ) => {
    for (const label of candidateLabels) {
      const resolved = await resolveWaypointByPlannerQuery(label, cityName)
      if (resolved?.image) return resolved.image
    }
    return null
  }, [resolveWaypointByPlannerQuery])

  const loadBackendTrip = useCallback(async (tripId: string, animateIntro = false) => {
    const requestId = ++tripRequestRef.current
    setTripLoading(true)

    try {
      const { data } = await getPublicTrip(tripId)
      if (tripRequestRef.current !== requestId) return

      const plannerResult = readPlannerResultForTrip(tripId)
      const plannerTravelPlan = plannerResult?.response.travelPlan

      const mappedTrip = mapPublicTripToDemo(data)
      const backendWaypoints = await resolveBackendTripWaypoints(data)
      if (tripRequestRef.current !== requestId) return

      const plannerWaypoints =
        backendWaypoints.length >= 2 || !plannerTravelPlan
          ? []
          : await resolvePlannerTripWaypoints(plannerTravelPlan)
      if (tripRequestRef.current !== requestId) return

      const waypoints = (backendWaypoints.length >= 2 ? backendWaypoints : plannerWaypoints) as RouteWaypoint[]
      const tripImage =
        plannerWaypoints.find((wp) => wp.image)?.image ||
        (await resolveRoutePreviewImage(
          data.city?.name || mappedTrip.city,
          waypoints.slice(0, 4).map((wp) => wp.label || '').filter(Boolean),
        )) ||
        mappedTrip.image ||
        null
      if (tripRequestRef.current !== requestId) return

      const routeTrip: DemoTrip = {
        ...mappedTrip,
        image: tripImage || mappedTrip.image,
        route: waypoints.length ? { tripId: mappedTrip.id, waypoints } : undefined,
      }

      setSelectedTrip(routeTrip)
      setSelectedPoi(null)
      setDesktopDock('route')
      setDesktopStopsOpen(false)
      setMobileStopsOpen(false)
      setMobileRouteHidden(false)
      setDesktopRouteHidden(false)
      setTourActive(false)
      setTourStop(0)
      setManualPins([])
      setAddPinMode(false)
      setTripWaypoints(waypoints)
      setRoutePreviewImage(tripImage || routeTrip.image || null)

      if (waypoints.length >= 2) {
        const nextMode = routeMode
        const result = await resolveRouteGeometry(waypoints, nextMode)
        if (tripRequestRef.current !== requestId) return

        const fallbackPoints = waypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng }))
        const routePoints = result?.points?.length ? result.points : fallbackPoints
        if (result) {
          setTripPoints(result.points)
          setTripDistM(result.distM)
          setTripDurS(result.durS)
          setTripRouteNote(result.note ?? null)
        } else {
          setTripPoints(fallbackPoints)
          setTripDistM(0)
          setTripDurS(0)
          setTripRouteNote('This route could not be resolved live, so the map is showing the saved stop order only.')
        }

        if (animateIntro) {
          void animateTripIntro(routeTrip.id, routePoints, fallbackPoints)
        } else if (result?.points?.length) {
          fitMapToPoints(result.points, 90)
        } else if (fallbackPoints.length >= 2) {
          fitMapToPoints(fallbackPoints, 90)
        }
      } else {
        setTripPoints([])
        setTripDistM(0)
        setTripDurS(0)
        setTripRouteNote(null)
        setRoutePreviewImage(tripImage || routeTrip.image || null)
        if (waypoints[0]) flyTo(waypoints[0].lat, waypoints[0].lng, 14)
      }
    } catch {
      if (tripRequestRef.current !== requestId) return
      showToast(`Trip "${tripId}" was not found.`)
      setTripQuery(null)
    } finally {
      if (tripRequestRef.current === requestId) {
        setTripLoading(false)
      }
    }
  }, [
    animateTripIntro,
    fitMapToPoints,
    flyTo,
    mapPublicTripToDemo,
    resolveBackendTripWaypoints,
    routeMode,
    setTripQuery,
    showToast,
  ])

  // ── Map load ──
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    geocoderRef.current = new google.maps.Geocoder()
    placesRef.current = new google.maps.places.PlacesService(map)
    map.addListener('zoom_changed', () => {
      setZoomLevel(map.getZoom() ?? DEFAULT_ZOOM)
    })
  }, [])

  // ── Load trip route via Routes API ──
  const loadTripRoute = useCallback(async (trip: DemoTrip, animateIntro = false) => {
    const allWps = normalizeWaypoints(trip.route)
    const wps = filterWaypointsByDay(allWps, activeRouteDay)
    if (!allWps.length) { setTripWaypoints([]); setTripPoints([]); setTripDistM(0); setTripDurS(0); setTripRouteNote(null); setRoutePreviewImage(trip.image || null); return }
    if (animateIntro) routeIntroTripRef.current = trip.id
    setTripLoading(true); setTripWaypoints(allWps)
    void resolveRoutePreviewImage(
      trip.city || 'Morocco',
      wps.slice(0, 4).map((wp) => wp.label || '').filter(Boolean),
    ).then((image) => {
      if (image) setRoutePreviewImage(image)
      else setRoutePreviewImage(trip.image || null)
    })
    const nextMode = routeMode
    const result = await resolveRouteGeometry(wps, nextMode)
    const fallbackPoints = wps.map(w => ({ lat: w.lat, lng: w.lng }))
    const routePoints = result?.points?.length ? result.points : fallbackPoints
    if (result) {
      setTripPoints(result.points); setTripDistM(result.distM); setTripDurS(result.durS); setTripRouteNote(result.note ?? null)
    } else {
      setTripPoints(fallbackPoints); setTripDistM(0); setTripDurS(0); setTripRouteNote('This route could not be resolved live, so the map is showing the saved stop order only.')
    }
    setTripLoading(false)
    if (animateIntro) {
      void animateTripIntro(trip.id, routePoints, fallbackPoints)
    } else {
      setTimeout(() => {
        if (result?.points?.length) fitMapToPoints(result.points, 90)
        else if (wps.length >= 2) fitMapToPoints(fallbackPoints, 90)
        else flyTo(wps[0].lat, wps[0].lng, 14)
      }, 200)
    }
    // Proactively resolve real Google names for all waypoints
    if (placesRef.current) {
      wps.forEach((wp) => {
        if (!wp.label) return
        const cacheKey = `${wp.lat.toFixed(5)},${wp.lng.toFixed(5)}`
        if (detailCache.current.has(cacheKey)) {
          const cached = detailCache.current.get(cacheKey)!
          setTripWaypoints(prev => prev.map((w) => (
            w.lat === wp.lat && w.lng === wp.lng && (w.day ?? 0) === (wp.day ?? 0)
              ? { ...w, label: cached.name }
              : w
          )))
          return
        }
        const svc = placesRef.current!
        svc.findPlaceFromQuery({
          query: wp.label,
          fields: ['place_id', 'name'],
          locationBias: new google.maps.Circle({ center: { lat: wp.lat, lng: wp.lng }, radius: 200 }),
        }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
            svc.getDetails({
              placeId: results[0].place_id!,
              fields: ['name'],
            }, (place, dStatus) => {
              if (dStatus === google.maps.places.PlacesServiceStatus.OK && place?.name) {
                setTripWaypoints(prev => prev.map((w) => (
                  w.lat === wp.lat && w.lng === wp.lng && (w.day ?? 0) === (wp.day ?? 0)
                    ? { ...w, label: place!.name! }
                    : w
                )))
              }
            })
          }
        })
      })
    }
  }, [activeRouteDay, animateTripIntro, fitMapToPoints, flyTo, routeMode])

  const clearRoute = useCallback(() => {
    routeIntroTokenRef.current += 1
    routeIntroTripRef.current = null
    setTripWaypoints([])
    setTripPoints([])
    setTripDistM(0)
    setTripDurS(0)
    setTripRouteNote(null)
    setRoutePreviewImage(null)
    setSelectedTrip(null)
    setSelectedPoi(null)
    setTourActive(false)
    setTourStop(0)
    setDesktopDock(null)
    setDesktopStopsOpen(false)
    setMobileStopsOpen(false)
    setMobileRouteHidden(false)
    setDesktopRouteHidden(false)
    setMobilePlaceSheet(false)
    setSelectedRouteDay(null)
    setTripQuery(null)
    showToast('Route cleared')
  }, [setTripQuery, showToast])

  useEffect(() => {
    if (requestedTripId) return
    const latestTripId = readHeroStorage(HERO_LATEST_TRIP_ID_KEY)
    if (!latestTripId) return

    removeHeroStorage(HERO_LATEST_TRIP_ID_KEY)
    setTripQuery(latestTripId)
  }, [requestedTripId, setTripQuery])

  useEffect(() => {
    if (!isLoaded) return
    if (!requestedTripId) return

    if (selectedTrip?.id === requestedTripId) return

    const storedHeroTrip = readHeroGeneratedTrip(requestedTripId)
    if (storedHeroTrip?.mapTrip) {
      const trip = storedHeroTrip.mapTrip
      setSelectedTrip(trip)
      setSelectedPoi(null)
      setDesktopDock('route')
      setDesktopStopsOpen(false)
      setMobileStopsOpen(false)
      setMobileRouteHidden(false)
      setDesktopRouteHidden(false)
      setTourActive(false)
      setTourStop(0)
      setManualPins([])
      setAddPinMode(false)
      if (trip.route && normalizeWaypoints(trip.route).length >= 2) {
        void loadTripRoute(trip, true)
        return
      }

      setTripWaypoints([])
      setTripPoints([])
      setTripDistM(0)
      setTripDurS(0)
      setTripRouteNote(null)
      return
    }

    const trip = tripById(requestedTripId)
    if (trip) {
      setSelectedTrip(trip)
      setSelectedPoi(null)
      setDesktopDock('route')
      setDesktopStopsOpen(false)
      setMobileStopsOpen(false)
      setMobileRouteHidden(false)
      setDesktopRouteHidden(false)
      setTourActive(false)
      setTourStop(0)
      setManualPins([])
      setAddPinMode(false)
      if (trip.route && normalizeWaypoints(trip.route).length >= 2) {
        void loadTripRoute(trip, true)
        return
      }

      setTripWaypoints([])
      setTripPoints([])
      setTripDistM(0)
      setTripDurS(0)
      setTripRouteNote(null)
      return
    }

    void loadBackendTrip(requestedTripId, true)
  }, [isLoaded, loadBackendTrip, loadTripRoute, requestedTripId, selectedTrip?.id, setTripQuery])

  // ── POI load via Google Places nearbySearch ──
  const loadPois = useCallback(async (category: CatKey | null) => {
    if (!category) {
      setPois([])
      setPoisLoading(false)
      return
    }
    if (!placesRef.current || !mapRef.current) return
    setPoisLoading(true)
    const center = mapRef.current.getCenter()
    if (!center) { setPoisLoading(false); return }

    const requestId = ++poiRequestRef.current
    const searchTypes = category === 'all'
      ? ['establishment']
      : CAT_TO_PLACES_TYPE[category as Exclude<CatKey, 'all'>]

    const runNearbySearch = (type: string) => new Promise<google.maps.places.PlaceResult[]>((resolve) => {
      placesRef.current?.nearbySearch(
        { location: center, radius: 2000, type },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) resolve(results)
          else resolve([])
        },
      )
    })

    const results = await Promise.all(searchTypes.map((type) => runNearbySearch(type)))
    if (poiRequestRef.current !== requestId) return

    const deduped = Array.from(new Map(
      results.flat().map((place) => [place.place_id ?? `${place.name}-${place.vicinity}`, place]),
    ).values())

    setPois(deduped.map(placeToPoi).filter(Boolean) as Poi[])
    setPoisLoading(false)
  }, [])

  const changeCategory = useCallback((k: CatKey) => {
    if (cat === k) {
      poiRequestRef.current += 1
      setCat(null)
      setPois([])
      setPoisLoading(false)
      return
    }
    setCat(k)
    void loadPois(k)
  }, [cat, loadPois])

  // ── Search via Google Places textSearch ──
  useEffect(() => {
    if (srchTimer.current) clearTimeout(srchTimer.current)
    if (searchQ.trim().length<2) { setSearchResults([]); setSearchOpen(false); return }
    srchTimer.current = setTimeout(()=>{
      if (!placesRef.current||!mapRef.current) return
      setSearchBusy(true)
      const req: google.maps.places.TextSearchRequest = {
        query: searchQ, location: mapRef.current.getCenter()??DEFAULT_CENTER, radius: 50000,
      }
      placesRef.current.textSearch(req, (results, status) => {
        if (status===google.maps.places.PlacesServiceStatus.OK && results) {
          setSearchResults(results.map(placeToPoi).filter(Boolean) as Poi[])
          setSearchOpen(true)
        } else setSearchResults([])
        setSearchBusy(false)
      })
    }, 300)
    return ()=>{ if (srchTimer.current) clearTimeout(srchTimer.current) }
  }, [searchQ])

  // ── Geolocation ──
  const locate = useCallback(() => {
    if (!navigator.geolocation) { showToast('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(
      p => { setUserPos({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy}); flyTo(p.coords.latitude,p.coords.longitude,16); showToast('Showing your location') },
      () => showToast('Could not get location'),
      { enableHighAccuracy:true, timeout:12000 },
    )
  }, [showToast, flyTo])

  const zoomIn = useCallback(() => {
    const currentZoom = mapRef.current?.getZoom() ?? DEFAULT_ZOOM
    mapRef.current?.setZoom(currentZoom + 1)
  }, [])

  const zoomOut = useCallback(() => {
    const currentZoom = mapRef.current?.getZoom() ?? DEFAULT_ZOOM
    mapRef.current?.setZoom(currentZoom - 1)
  }, [])

  // ── Fetch full Place Details ──
  const fetchPlaceDetails = useCallback((poi: Poi) => {
    if (!poi.placeId || !placesRef.current) return
    if (detailCache.current.has(poi.placeId)) {
      const cached = detailCache.current.get(poi.placeId)!
      setSelectedPoi(cached)
      // Propagate name back to tripWaypoints if this is a stop
      if (cached.id.startsWith('wp-')) {
        const idx = parseInt(cached.id.replace('wp-', ''), 10)
        setTripWaypoints(prev => prev.map((w, i) => i === idx ? { ...w, label: cached.name } : w))
      }
      return
    }
    setPlaceDetailLoading(true)
    placesRef.current.getDetails({
      placeId: poi.placeId,
      fields: ['name','formatted_address','formatted_phone_number','website','opening_hours','photos','reviews','rating','user_ratings_total','editorial_summary','place_id','types','geometry'],
    }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const enriched: Poi = {
          ...poi,
          name: place.name ?? poi.name,
          address: place.formatted_address ?? poi.address,
          phone: place.formatted_phone_number ?? poi.phone,
          website: place.website ?? poi.website,
          rating: place.rating ?? poi.rating,
          reviewCount: place.user_ratings_total,
          image: place.photos?.[0]?.getUrl({ maxWidth: 600 }) ?? poi.image,
          allPhotos: place.photos?.slice(0, 5).map(p => p.getUrl({ maxWidth: 600 })),
          isOpen: place.opening_hours?.isOpen?.(),
          openingHours: place.opening_hours?.weekday_text?.[0] ?? poi.openingHours,
          weekdayText: place.opening_hours?.weekday_text,
          summary: (place as any).editorial_summary?.overview ?? poi.subtitle,
          reviews: (place.reviews ?? []).slice(0, 3).map(r => ({
            author: r.author_name ?? 'Traveler',
            rating: r.rating ?? 5,
            text: r.text ?? '',
            time: r.relative_time_description ?? '',
          })),
        }
        detailCache.current.set(poi.placeId!, enriched)
        setSelectedPoi(enriched)
        // Propagate real Google name back to tripWaypoints if this is a stop
        if (poi.id.startsWith('wp-') && place.name) {
          const idx = parseInt(poi.id.replace('wp-', ''), 10)
          setTripWaypoints(prev => prev.map((w, i) => i === idx ? { ...w, label: place!.name! } : w))
        }
      }
      setPlaceDetailLoading(false)
    })
  }, [])

  // ── Select a POI (with detail fetch) ──
  const selectPoi = useCallback((poi: Poi) => {
    setSelectedPoi(poi)
    const mobile = isMobileViewport()
    setMobilePlaceSheet(mobile)
    setMobileStopsOpen(false)
    setDesktopStopsOpen(false)
    setDesktopDock(mobile ? null : 'place')
    if (poi.placeId) {
      fetchPlaceDetails(poi)
    } else if (poi.name && placesRef.current) {
      // No placeId — try to find the place by name + location
      setPlaceDetailLoading(true)
      const request: google.maps.places.FindPlaceFromQueryRequest = {
        query: poi.name,
        fields: ['place_id', 'name', 'geometry'],
        locationBias: new google.maps.Circle({ center: { lat: poi.lat, lng: poi.lng }, radius: 200 }),
      }
      placesRef.current.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const best = results[0]
          if (best.place_id) {
            const enrichedPoi = { ...poi, placeId: best.place_id, name: best.name ?? poi.name }
            setSelectedPoi(enrichedPoi)
            // Update tripWaypoints label if this is a stop
            if (poi.id.startsWith('wp-') && best.name) {
              const idx = parseInt(poi.id.replace('wp-', ''), 10)
              setTripWaypoints(prev => prev.map((w, i) => i === idx ? { ...w, label: best.name! } : w))
            }
            fetchPlaceDetails(enrichedPoi)
          } else {
            setPlaceDetailLoading(false)
          }
        } else {
          setPlaceDetailLoading(false)
        }
      })
    }
  }, [fetchPlaceDetails, isMobileViewport])

  const closePoiPreview = useCallback(() => {
    setMobilePlaceSheetTop(348)
    setSelectedPoi(null)
    setMobilePlaceSheet(false)
    setPlaceDetailLoading(false)
    if (!isMobileViewport()) {
      setDesktopDock(selectedTrip ? 'route' : null)
    }
  }, [isMobileViewport, selectedTrip])

  const handleMobilePlaceDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    mobilePlaceDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTop: mobilePlaceSheetTop || Math.round(viewportHeight * 0.5),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [mobilePlaceSheetTop])

  const handleMobilePlaceDragMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (mobilePlaceDragRef.current.pointerId !== event.pointerId) return
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const minTop = Math.round(viewportHeight * 0.44)
    const maxTop = Math.round(viewportHeight * 0.92)
    const delta = event.clientY - mobilePlaceDragRef.current.startY
    const nextTop = Math.min(maxTop, Math.max(minTop, mobilePlaceDragRef.current.startTop + delta))
    setMobilePlaceSheetTop(nextTop)
  }, [])

  const handleMobilePlaceDragEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (mobilePlaceDragRef.current.pointerId !== event.pointerId) return
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const minTop = Math.round(viewportHeight * 0.44)
    const closeThreshold = Math.round(viewportHeight * 0.88)
    const relaxedTop = Math.round(viewportHeight * 0.5)
    if (mobilePlaceSheetTop >= closeThreshold) {
      closePoiPreview()
    } else {
      setMobilePlaceSheetTop(mobilePlaceSheetTop > relaxedTop ? relaxedTop : minTop)
    }
    mobilePlaceDragRef.current.pointerId = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [closePoiPreview, mobilePlaceSheetTop])

  useEffect(() => {
    if (!mobilePlaceSheet) return
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    setMobilePlaceSheetTop(Math.round(viewportHeight * 0.5))
  }, [mobilePlaceSheet, selectedPoi?.id])

  useEffect(() => {
    const shouldHideBottomNav = Boolean(
      mobilePlaceSheet || (selectedTrip && !mobileRouteHidden),
    )
    window.dispatchEvent(new CustomEvent(BOTTOM_NAV_VISIBILITY_EVENT, { detail: { hidden: shouldHideBottomNav } }))

    return () => {
      window.dispatchEvent(new CustomEvent(BOTTOM_NAV_VISIBILITY_EVENT, { detail: { hidden: false } }))
    }
  }, [mobilePlaceSheet, mobileRouteHidden, selectedTrip])

  useEffect(() => {
    const shouldHideAgent = isMobileViewport()
      ? Boolean(mobilePlaceSheet || (selectedTrip && !mobileRouteHidden))
      : false
    window.dispatchEvent(new CustomEvent(AGENT_VISIBILITY_EVENT, { detail: { hidden: shouldHideAgent } }))

    return () => {
      window.dispatchEvent(new CustomEvent(AGENT_VISIBILITY_EVENT, { detail: { hidden: false } }))
    }
  }, [isMobileViewport, mobilePlaceSheet, mobileRouteHidden, selectedTrip])

  const openRoutePreview = useCallback((expandStops = false) => {
    setSelectedPoi(null)
    setMobilePlaceSheet(false)
    setMobileRouteHidden(false)
    setDesktopRouteHidden(false)
    if (isMobileViewport()) {
      setMobileStopsOpen(true)
      return
    }
    setDesktopDock('route')
    if (expandStops) setDesktopStopsOpen(true)
  }, [isMobileViewport])

  // ── Map click ──
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat(), lng = e.latLng?.lng()
    if (lat==null||lng==null) return
    if (addPinMode) { const id=`pin-${++pinIdRef.current}`; setManualPins(p=>[...p,{id,lat,lng,label:`Pin ${pinIdRef.current}`,isManual:true}]); showToast('Pin added') }
    else {
      setSelectedPoi(null)
      setMobilePlaceSheet(false)
      if (!isMobileViewport()) setDesktopDock(selectedTrip ? 'route' : null)
    }
  }, [addPinMode, isMobileViewport, selectedTrip, showToast])

  // ── Map idle → reload POIs ──
  const onMapIdle = useCallback(() => {
    if (bounceRef.current) clearTimeout(bounceRef.current)
    bounceRef.current = setTimeout(() => { void loadPois(cat) }, 800)
  }, [cat, loadPois])

  // ── Tour fly ──
  useEffect(() => {
    if (tourActive && visibleRouteWaypoints[tourStop]) {
      flyTo(visibleRouteWaypoints[tourStop].lat, visibleRouteWaypoints[tourStop].lng, 17)
    }
  }, [tourActive, tourStop, visibleRouteWaypoints, flyTo])

  useEffect(() => {
    if (routeDays.length <= 1) {
      setSelectedRouteDay(null)
      return
    }

    if (!selectedRouteDay || !routeDays.includes(selectedRouteDay)) {
      setSelectedRouteDay(routeDays[0])
    }
  }, [routeDays, selectedRouteDay])

  useEffect(() => {
    if (!selectedTrip) return
    setRouteMode(visibleRouteWaypoints.length > 10 ? 'DRIVING' : 'WALKING')
  }, [selectedTrip?.id, activeRouteDay, visibleRouteWaypoints.length])

  useEffect(() => {
    if (!isLoaded || !selectedTrip) return
    if (routeIntroTripRef.current === selectedTrip.id) return
    if (tripPoints.length >= 2) {
      fitMapToPoints(tripPoints, 90)
      return
    }
    if (visibleRouteWaypoints.length >= 2) {
      fitMapToPoints(visibleRouteWaypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng })), 90)
      return
    }
    if (visibleRouteWaypoints[0]) flyTo(visibleRouteWaypoints[0].lat, visibleRouteWaypoints[0].lng, 14)
  }, [fitMapToPoints, flyTo, isLoaded, selectedTrip?.id, tripPoints.length, visibleRouteWaypoints])

  useEffect(() => {
    if (!isLoaded || !selectedTrip?.route) return
    const wps = filterWaypointsByDay(normalizeWaypoints(selectedTrip.route), activeRouteDay)
    if (wps.length < 2) return
    void loadTripRoute(selectedTrip, false)
  }, [activeRouteDay, isLoaded, loadTripRoute, routeMode, selectedTrip?.id])

  // ── Close search on outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current&&!searchRef.current.contains(e.target as Node)) setSearchOpen(false) }
    document.addEventListener('mousedown', h); return ()=>document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  // ── Map options ──
  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    mapTypeId:          TILE_MODES[tile].mapTypeId,
    styles:             TILE_MODES[tile].styles,
    disableDefaultUI:   true,
    zoomControl:        false,
    gestureHandling:    'greedy',
    clickableIcons:     false,
  }), [tile])

  const saveSpot = useCallback((poi: Poi) => {
    const alreadySaved = manualPins.some(p=>Math.abs(p.lat-poi.lat)<0.0001&&Math.abs(p.lng-poi.lng)<0.0001)
    if (alreadySaved) {
      showToast(`${poi.name} is already saved`)
      return
    }
    setManualPins(prev => [
      ...prev,
      {
        id: `saved-${poi.id}`,
        lat: poi.lat,
        lng: poi.lng,
        label: poi.name,
        isManual: true,
      },
    ])
    showToast(`${poi.name} saved`)
  }, [manualPins, showToast])

  const buildWaypointPoi = useCallback((wp: RouteWaypoint, i: number): Poi => ({
    id: `wp-${i}`,
    lat: wp.lat,
    lng: wp.lng,
    name: wp.label || `Stop ${i + 1}`,
    kind: (wp.kind as PoiKind) || 'attraction',
    subtitle: activeRouteDay
      ? `Day ${activeRouteDay}, stop ${i + 1} of ${visibleRouteWaypoints.length}`
      : `Stop ${i + 1} of ${visibleRouteWaypoints.length}`,
    image: selectedTrip?.image || null,
  }), [activeRouteDay, selectedTrip?.image, visibleRouteWaypoints.length])

  const focusTripWaypoint = useCallback((wp: RouteWaypoint, i: number) => {
    setMobileStopsOpen(false)
    setDesktopStopsOpen(false)
    selectPoi(buildWaypointPoi(wp, i))
    flyTo(wp.lat, wp.lng, 17)
  }, [buildWaypointPoi, flyTo, selectPoi])

  const handleWaypointOverlayClick = useCallback((
    event: { preventDefault?: () => void; stopPropagation?: () => void } | undefined,
    wp: RouteWaypoint,
    index: number,
  ) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    focusTripWaypoint(wp, index)
  }, [focusTripWaypoint])

  const handlePoiOverlayClick = useCallback((
    event: { preventDefault?: () => void; stopPropagation?: () => void } | undefined,
    poi: Poi,
  ) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    selectPoi(poi)
    flyTo(poi.lat, poi.lng, 17)
  }, [flyTo, selectPoi])

  const swallowOverlayPress = useCallback((
    event: { preventDefault?: () => void; stopPropagation?: () => void } | undefined,
  ) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING / ERROR STATES
  // ─────────────────────────────────────────────────────────────────────────
  if (loadError) return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-zinc-50">
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-zinc-700 font-bold">Failed to load Google Maps</p>
          <p className="text-zinc-400 text-sm mt-1">Check your VITE_GOOGLE_MAPS_API_KEY in .env</p>
          <p className="text-zinc-400 text-xs mt-1 font-mono">{loadError.message}</p>
        </div>
      </div>
    </div>
  )

  if (!isLoaded) return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-zinc-50">
      <div className="flex h-full w-full items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-zinc-500 font-medium">Loading Google Maps…</span>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
      <div className="relative z-0 isolate flex h-full min-h-0 w-full overflow-hidden bg-zinc-50 overscroll-none">
        <style>{`
          @keyframes mti{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes labelFadeIn{from{opacity:0;transform:translateY(4px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)}}
          .mchips::-webkit-scrollbar{display:none}.mchips{scrollbar-width:none;-webkit-overflow-scrolling:touch;}
          ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#e4e4e7;border-radius:4px}
          .stop-label{animation:labelFadeIn .25s ease both;pointer-events:auto;cursor:pointer;}
          .stop-label:hover .stop-label-inner{box-shadow:0 4px 20px rgba(0,0,0,.18);transform:translateY(-1px);}
        `}</style>

        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[3500] bg-zinc-900/95 text-white text-[12px] font-semibold px-4 py-2 rounded-full shadow-2xl pointer-events-none whitespace-nowrap" style={{animation:'mti .2s ease both'}}>
            {toast}
          </div>
        )}

        <div className={`relative flex-1 ${addPinMode ? 'cursor-crosshair' : ''}`}>
          {addPinMode && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2500] bg-zinc-900 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none">
              <MapPin className="w-3.5 h-3.5" />
              Tap map to add a pin
            </div>
          )}

          <div ref={searchRef} className="absolute z-[2700] top-3 left-3 right-3 lg:left-4 lg:right-auto lg:w-[400px]">
            <div className={`mr-14 lg:mr-0 bg-white rounded-2xl border border-zinc-100 overflow-hidden transition-shadow ${searchOpen&&searchResults.length?'shadow-[0_8px_40px_rgba(0,0,0,.18)]':'shadow-[0_4px_20px_rgba(0,0,0,.11)]'}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                {searchBusy ? <Loader2 className="w-4 h-4 text-orange-500 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-zinc-400 shrink-0" />}
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onFocus={()=>searchResults.length&&setSearchOpen(true)} placeholder="Search restaurants, cafés, hotels…" autoComplete="off" spellCheck={false} className="flex-1 text-[13px] font-medium text-zinc-900 placeholder-zinc-400 bg-transparent outline-none min-w-0" />
                {searchQ && <button onClick={()=>{ setSearchQ(''); setSearchOpen(false); setSearchResults([]) }} className="h-6 w-6 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition shrink-0"><X className="w-3 h-3" /></button>}
              </div>
              {searchOpen && searchResults.length>0 && (
                <div className="border-t border-zinc-100 max-h-64 overflow-y-auto">
                  {searchResults.map((r,i)=>{
                    const {color,bg,Icon}=poiMeta(r.kind)
                    return (
                      <button key={r.id} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors ${i<searchResults.length-1?'border-b border-zinc-50':''}`} onMouseDown={e=>{ e.preventDefault(); selectPoi(r); setSearchQ(r.name); setSearchOpen(false); flyTo(r.lat,r.lng,17) }}>
                        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{background:bg}}><Icon className="w-3.5 h-3.5" style={{color}} /></div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-zinc-900 truncate">{r.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{r.subtitle}</p>
                          {r.rating!=null&&<div className="flex items-center gap-1 mt-0.5"><Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" /><span className="text-[10px] text-zinc-500">{r.rating.toFixed(1)}</span></div>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="mt-2 lg:hidden">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm whitespace-nowrap shrink-0 ${cat ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-900 text-white'}`}>
                  {cat ? 'Nearby on' : 'Nearby off'}
                </span>
                {CATS.map(c => {
                  const active = cat === c.key
                  return (
                    <button
                      key={c.key}
                      onClick={() => changeCategory(c.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 ${active ? 'text-white border-transparent' : 'bg-white text-zinc-500 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200'}`}
                      style={active ? { background: c.color } : {}}
                    >
                      {poisLoading && active ? <Loader2 className="w-3 h-3 animate-spin" /> : <c.Icon className="w-3 h-3" />}
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-2 hidden lg:flex flex-wrap gap-1.5 overflow-visible pb-1">
              <span className={`flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm whitespace-nowrap shrink-0 ${cat ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-900 text-white'}`}>
                {cat ? 'Nearby on' : 'Nearby off'}
              </span>
              {CATS.map(c => {
                const active = cat === c.key
                return (
                  <button
                    key={c.key}
                    onClick={() => changeCategory(c.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 ${active ? 'text-white border-transparent' : 'bg-white text-zinc-500 border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200'}`}
                    style={active ? { background: c.color } : {}}
                  >
                    {poisLoading && active ? <Loader2 className="w-3 h-3 animate-spin" /> : <c.Icon className="w-3 h-3" />}
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedTrip && !mobilePlaceSheet && !mobileRouteHidden && (
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute z-[2450] left-3 right-3 bottom-4 max-h-[72vh] overflow-hidden lg:hidden"
            >
              <RouteSummaryCard
                trip={selectedTrip}
                image={routePreviewImage}
                waypoints={visibleRouteWaypoints}
                dayOptions={routeDays}
                activeDay={activeRouteDay}
                distanceM={tripDistM}
                durationS={tripDurS}
                routeNote={tripRouteNote}
                loading={tripLoading}
                routeMode={effectiveRouteMode}
                onRouteModeChange={setRouteMode}
                onSelectDay={setSelectedRouteDay}
                stopsOpen={mobileStopsOpen}
                onToggleStops={() => setMobileStopsOpen((open) => !open)}
                onStopClick={focusTripWaypoint}
                activeStopId={selectedPoi?.id}
                onClear={clearRoute}
                onHide={() => setMobileRouteHidden(true)}
                colorForStop={wpColor}
                compact
              />
            </motion.div>
          )}

          {selectedTrip && !mobilePlaceSheet && mobileRouteHidden && (
            <motion.button
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => setMobileRouteHidden(false)}
              className="lg:hidden absolute z-[2800] left-0 top-1/2 -translate-y-1/2 inline-flex h-12 w-10 items-center justify-center rounded-r-2xl border border-l-0 border-white/80 bg-white/95 text-zinc-700 shadow-[0_12px_30px_rgba(15,23,42,.18)] backdrop-blur-sm"
              aria-label="Show route card"
            >
              <ChevronDown className="h-5 w-5 -rotate-90 text-orange-500" />
            </motion.button>
          )}

          <div className="absolute z-[2400] bottom-20 left-3 flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.14)] backdrop-blur-sm lg:bottom-4 lg:left-4">
            <button
              onClick={locate}
              className="flex h-11 w-11 items-center justify-center text-zinc-700 transition hover:bg-zinc-50 active:scale-95"
              aria-label="Locate me"
            >
              <LocateFixed className="h-4 w-4 text-zinc-600" />
            </button>
            <div className="mx-2 h-px bg-zinc-100" />
            <button
              onClick={zoomIn}
              className="flex h-11 w-11 items-center justify-center text-zinc-700 transition hover:bg-zinc-50 active:scale-95"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="mx-2 h-px bg-zinc-100" />
            <button
              onClick={zoomOut}
              className="flex h-11 w-11 items-center justify-center text-zinc-700 transition hover:bg-zinc-50 active:scale-95"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          {!mobilePlaceSheet && (!selectedTrip || mobileRouteHidden) && (
            <div className="lg:hidden absolute z-[2600] bottom-4 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-zinc-100 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,.11)] p-1">
              <button onClick={()=>{ setAddPinMode(m=>!m); showToast(addPinMode?'Pin mode off':'Tap map to add pin') }} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition ${addPinMode?'text-white':'text-zinc-500'}`} style={addPinMode?{background:PURPLE}:{}}><Plus className="w-3 h-3" />{addPinMode?'Adding':'Pin'}</button>
              {manualPins.length>0 && <><div className="w-px h-4 bg-zinc-200" /><button onClick={()=>setManualPins([])} className="px-2 py-1.5 rounded-lg text-zinc-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button></>}
              <div className="w-px h-4 bg-zinc-200" />
              {(Object.keys(TILE_MODES) as TileKey[]).map(k=><button key={k} onClick={()=>setTile(k)} className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition capitalize ${tile===k?'bg-zinc-900 text-white':'text-zinc-500 hover:bg-zinc-100'}`}>{k}</button>)}
              <div className="w-px h-4 bg-zinc-200" />
              <button onClick={()=>setShowTripRoute(r=>!r)} className={`px-2 py-1.5 rounded-lg transition ${showTripRoute?'text-orange-500':'text-zinc-500'}`}><Route className="w-3.5 h-3.5" /></button>
            </div>
          )}

          <GoogleMap
            mapContainerClassName="h-full w-full"
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            options={mapOptions}
            onLoad={onMapLoad}
            onClick={onMapClick}
            onIdle={onMapIdle}
          >
            {userPos && (
              <>
                <Circle center={{lat:userPos.lat,lng:userPos.lng}} radius={Math.max(userPos.acc,20)}
                  options={{strokeColor:BLUE,strokeOpacity:0.3,strokeWeight:1,fillColor:BLUE,fillOpacity:0.08}} />
                <Marker position={{lat:userPos.lat,lng:userPos.lng}} icon={iconUser()} zIndex={1000} />
              </>
            )}

            {showTripRoute && tripPoints.length>=2 && (
              <Fragment>
                <Polyline
                  path={tripPoints}
                  options={{ strokeColor: routePalette.glow, strokeWeight: 24, strokeOpacity: 0.08 }}
                />
                <Polyline
                  path={tripPoints}
                  options={{ strokeColor: routePalette.glow, strokeWeight: 12, strokeOpacity: 0.16 }}
                />
                {routeSegments.map((segment) => (
                  <Polyline
                    key={segment.id}
                    path={segment.path}
                    options={{
                      strokeColor: segment.color,
                      strokeWeight: effectiveRouteMode === 'DRIVING' ? 6 : effectiveRouteMode === 'TRANSIT' ? 5.5 : 5,
                      strokeOpacity: effectiveRouteMode === 'TRANSIT' ? 0.82 : 1,
                      icons: routeStrokeIcons,
                    }}
                    onClick={() => {
                      fitMapToPoints(tripPoints, 90)
                      openRoutePreview(false)
                    }}
                  />
                ))}
              </Fragment>
            )}

            {visibleRouteWaypoints.map((wp,i)=>(
              <Fragment key={`wp-${i}`}>
                <Marker
                  position={{lat:wp.lat,lng:wp.lng}}
                  icon={iconWaypoint(wpColor(i))}
                  zIndex={tourActive&&i===tourStop?1200:900}
                  onClick={()=>focusTripWaypoint(wp, i)}
                />
                {zoomLevel >= 14 && (
                  <OverlayViewF
                    position={{lat:wp.lat,lng:wp.lng}}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(_w,h)=>({x: 20, y: -(h/2)-2})}
                  >
                    <button
                      type="button"
                      className="stop-label"
                      onMouseDown={swallowOverlayPress}
                      onTouchStart={swallowOverlayPress}
                      onClick={(event)=>handleWaypointOverlayClick(event, wp, i)}
                      aria-label={`Open stop ${wp.label||`Stop ${i+1}`}`}
                      style={{ background: 'transparent', border: 0, padding: 0, pointerEvents: 'auto', cursor: 'pointer', display: 'block' }}
                    >
                      <div className="stop-label-inner" style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '5px 10px 5px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 12px rgba(0,0,0,.12)',
                        border: `1.5px solid ${wpColor(i)}20`,
                        whiteSpace: 'nowrap',
                        maxWidth: 180,
                        transition: 'all .2s ease',
                      }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 20, height: 20, borderRadius: '50%',
                          background: wpColor(i), color: '#fff',
                          fontSize: 10, fontWeight: 800, flexShrink: 0,
                        }}>{i+1}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#27272a',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{wp.label||`Stop ${i+1}`}</span>
                      </div>
                    </button>
                  </OverlayViewF>
                )}
              </Fragment>
            ))}

            {manualPins.map(pin=>(
              <Marker key={pin.id} position={{lat:pin.lat,lng:pin.lng}} icon={iconPin()} zIndex={800} title={pin.label}
                onClick={()=>{
                  const poi = { id: pin.id as string, lat: pin.lat, lng: pin.lng, name: pin.label || 'Pin', kind: 'place' as PoiKind, subtitle: 'Manual pin' }
                  const mobile = isMobileViewport()
                  setSelectedPoi(poi)
                  setPlaceDetailLoading(false)
                  setMobilePlaceSheet(mobile)
                  setDesktopDock(mobile ? null : 'place')
                  setMobileStopsOpen(false)
                  setDesktopStopsOpen(false)
                }}
              />
            ))}

            {pois.map(p=>{
              const meta = poiMeta(p.kind)
              const isSel = selectedPoi?.id===p.id
              return (
                <Fragment key={p.id}>
                  <Marker
                    position={{lat:p.lat,lng:p.lng}}
                    icon={iconPoi(meta.color,isSel)}
                    zIndex={isSel?800:500}
                    onClick={()=>{ selectPoi(p); flyTo(p.lat,p.lng,17) }}
                  />
                  {zoomLevel >= 16 && !isSel && (
                    <OverlayViewF
                      position={{lat:p.lat,lng:p.lng}}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      getPixelPositionOffset={(_w,h)=>({x: 18, y: -(h/2)})}
                    >
                      <button
                        type="button"
                        className="stop-label"
                        onMouseDown={swallowOverlayPress}
                        onTouchStart={swallowOverlayPress}
                        onClick={(event)=>handlePoiOverlayClick(event, p)}
                        aria-label={`Open place ${p.name}`}
                        style={{ background: 'transparent', border: 0, padding: 0, pointerEvents: 'auto', cursor: 'pointer', display: 'block' }}
                      >
                        <div className="stop-label-inner" style={{
                          background: '#ffffffe6',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 8,
                          padding: '3px 8px',
                          boxShadow: '0 1px 8px rgba(0,0,0,.1)',
                          border: `1px solid ${meta.color}25`,
                          whiteSpace: 'nowrap',
                          maxWidth: 150,
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: meta.color,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: 'block',
                          }}>{p.name}</span>
                        </div>
                      </button>
                    </OverlayViewF>
                  )}
                </Fragment>
              )
            })}

            {selectedPoi && !pois.find(p=>p.id===selectedPoi.id) && !visibleRouteWaypoints.some((_,i)=>`wp-${i}`===selectedPoi.id) && (
              <Marker position={{lat:selectedPoi.lat,lng:selectedPoi.lng}} icon={iconPoi(poiMeta(selectedPoi.kind).color,true)} zIndex={900} />
            )}
          </GoogleMap>

          {selectedPoi && desktopDock === 'place' && (
            <div className="hidden lg:block absolute z-[2450] left-1/2 bottom-5 w-[min(460px,calc(100%-32px))] -translate-x-1/2">
              <div className="max-h-[72vh] overflow-y-auto rounded-[30px] border border-white/80 bg-white/96 p-4 shadow-[0_20px_70px_rgba(15,23,42,.18)] backdrop-blur-xl">
                {selectedTrip && (
                  <button
                    onClick={() => {
                      setSelectedPoi(null)
                      setDesktopDock('route')
                    }}
                    className="mb-3 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-bold text-zinc-600 transition hover:bg-zinc-200"
                  >
                    <Route className="h-3.5 w-3.5" />
                    Back to route
                  </button>
                )}
                <PlaceDetailsContent
                  poi={selectedPoi}
                  onAdd={() => saveSpot(selectedPoi)}
                  inRoute={inPins(selectedPoi)}
                  onClose={closePoiPreview}
                  loading={placeDetailLoading}
                  agendaHref={selectedTrip ? `/user/trip-plan?trip=${encodeURIComponent(selectedTrip.id)}` : null}
                  routeHref={selectedTrip ? `/user/maps?trip=${encodeURIComponent(selectedTrip.id)}` : null}
                />
              </div>
            </div>
          )}

          {selectedTrip && desktopDock === 'route' && desktopRouteHidden && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => setDesktopRouteHidden(false)}
              className="hidden lg:inline-flex absolute z-[2800] left-1/2 bottom-6 -translate-x-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 px-4 py-2 text-[11px] font-semibold text-zinc-700 shadow-[0_12px_30px_rgba(15,23,42,.18)] backdrop-blur-sm"
              aria-label="Show route panel"
            >
              <ChevronDown className="h-5 w-5 rotate-180 text-orange-500" />
            </motion.button>
          )}

          {selectedTrip && desktopDock === 'route' && !desktopRouteHidden && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block absolute z-[2450] left-1/2 bottom-5 w-[min(520px,calc(100%-32px))] -translate-x-1/2"
            >
              <RouteSummaryCard
                trip={selectedTrip}
                image={routePreviewImage}
                waypoints={visibleRouteWaypoints}
                dayOptions={routeDays}
                activeDay={activeRouteDay}
                distanceM={tripDistM}
                durationS={tripDurS}
                routeNote={tripRouteNote}
                loading={tripLoading}
                routeMode={effectiveRouteMode}
                onRouteModeChange={setRouteMode}
                onSelectDay={setSelectedRouteDay}
                stopsOpen={desktopStopsOpen}
                onToggleStops={() => setDesktopStopsOpen((open) => !open)}
                onStopClick={focusTripWaypoint}
                activeStopId={selectedPoi?.id}
                onClear={clearRoute}
                onHide={() => setDesktopRouteHidden(true)}
                colorForStop={wpColor}
              />
            </motion.div>
          )}
        </div>

        {mobilePlaceSheet && selectedPoi && (
          <div className="lg:hidden fixed inset-0 z-[10050] pointer-events-none" onClick={closePoiPreview}>
            <div className="absolute inset-0 bg-black/30 pointer-events-auto" />
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-auto"
              onClick={e=>e.stopPropagation()}
              style={{animation:'mti .3s ease both', top: `${mobilePlaceSheetTop}px`}}
            >
              <div
                className="bg-white rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,.2)] overflow-hidden flex flex-col"
                style={{
                  maxHeight: `calc(100dvh - ${mobilePlaceSheetTop}px)`,
                  paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
                }}
              >
                <div
                  className="sticky top-0 z-10 flex justify-center pt-3 pb-1 bg-white rounded-t-[28px] touch-none cursor-grab active:cursor-grabbing"
                  onPointerDown={handleMobilePlaceDragStart}
                  onPointerMove={handleMobilePlaceDragMove}
                  onPointerUp={handleMobilePlaceDragEnd}
                  onPointerCancel={handleMobilePlaceDragEnd}
                >
                  <div className="w-10 h-1 rounded-full bg-zinc-200" />
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-20">
                  <PlaceDetailsContent
                    poi={selectedPoi}
                    onAdd={()=>saveSpot(selectedPoi)}
                    inRoute={inPins(selectedPoi)}
                    onClose={closePoiPreview}
                    loading={placeDetailLoading}
                    compact
                    agendaHref={selectedTrip ? `/user/trip-plan?trip=${encodeURIComponent(selectedTrip.id)}` : null}
                    routeHref={selectedTrip ? `/user/maps?trip=${encodeURIComponent(selectedTrip.id)}` : null}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}
