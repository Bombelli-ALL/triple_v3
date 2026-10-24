// types.ts

export type PoiKind =
  | 'place'
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'attraction'
  | 'shop'
  | 'park'
  | 'gym'
  | 'bar'
  | 'pharmacy'
  | 'bank'
  | 'hospital'
  | 'transport'

export interface RouteWaypoint {
  lat: number
  lng: number
  label?: string
  kind?: string
  day?: number
}

export interface TripRoute {
  tripId: string
  waypoints?: RouteWaypoint[]
  polyline?: Array<[number, number]>
}

export interface DemoTrip {
  id: string
  title: string
  city: string
  country: string
  summary: string
  image: string
  tags: string[]
  route?: TripRoute
}

export interface ManualPin {
  id: number | string
  lat: number
  lng: number
  label?: string
  isManual?: boolean
}

export interface NavPoint {
  lat: number
  lng: number
  label: string
}

export type NavProfile = 'foot' | 'bike' | 'driving'

export interface NavStep {
  instruction: string
  distM: number
  type: string
  modifier?: string
}

export interface NavRoute {
  points: Array<[number, number]>
  distM: number
  durS: number
  steps: NavStep[]
  failed: boolean
}

export interface ComputedRoute {
  points: Array<[number, number]>
  distM: number
  durS: number
  failed: boolean
  legs: number[]
}

// AI Action types
export interface ShowRouteAction {
  type: 'SHOW_ROUTE'
  payload: {
    tripId?: string
    waypoints?: Array<{ lat: number; lng: number; label?: string }>
  }
}

export type ShowRouteActionResult =
  | { ok: true; source: 'trip' | 'waypoints' | 'ai'; label?: string }
  | { ok: false; error: string }
