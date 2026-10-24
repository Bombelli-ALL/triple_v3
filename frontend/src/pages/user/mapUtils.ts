// mapUtils.ts
import type {
  TripRoute, RouteWaypoint, DemoTrip, ComputedRoute, NavRoute,
  NavProfile, NavStep, NavPoint,
} from './types'

// ── Demo Trips ────────────────────────────────────────────────────────────────
export const DEMO_TRIPS: DemoTrip[] = [
  {
    id: 'trip-rabat-capital-link',
    title: 'Rabat Capital Link',
    city: 'Rabat',
    country: 'Morocco',
    summary: 'A wider Rabat route through stations, monuments, and civic stops built for testing walking, driving, and transit connectors.',
    image: '/assets/places/m6.jpeg',
    tags: ['Capital', 'Transit', 'Drive'],
    route: {
      tripId: 'trip-rabat-capital-link',
      waypoints: [
        { lat: 34.0266404, lng: -6.8226773, label: 'Rabat Ville Station' },
        { lat: 34.0191232, lng: -6.8326296, label: 'Mohammed V Mausoleum' },
        { lat: 34.0014378, lng: -6.8467675, label: 'Chellah' },
        { lat: 33.9950852, lng: -6.8516687, label: 'Ibn Sina Tram Stop' },
        { lat: 33.9808923, lng: -6.8665057, label: 'Agdal Station' },
      ],
    },
  },
  {
    id: 'trip-fes-medina-loop',
    title: 'Fes Medina Loop',
    city: 'Fès',
    country: 'Morocco',
    summary: 'A heritage-heavy loop through the old medina gates, madrasas, and tanneries.',
    image: '/assets/places/m3.jpeg',
    tags: ['Culture', 'Walking', 'Heritage'],
    route: {
      tripId: 'trip-fes-medina-loop',
      waypoints: [
        { lat: 34.0617022, lng: -4.9840213, label: 'Bab Bou Jeloud (Blue Gate)' },
        { lat: 34.0622104, lng: -4.9827364, label: 'Bou Inania Madrasa' },
        { lat: 34.0651258, lng: -4.9735649, label: 'Al Attarine Madrasa' },
        { lat: 34.0648232, lng: -4.9732969, label: 'University of Al Quaraouiyine' },
        { lat: 34.0659178, lng: -4.9709916, label: 'Chouara Tanneries' },
      ],
    },
  },
  {
    id: 'trip-meknes-imperial-core',
    title: 'Meknes Imperial Core',
    city: 'Meknès',
    country: 'Morocco',
    summary: 'A compact imperial route through gates, museums, and royal courtyards in Meknes.',
    image: '/assets/places/m4.jpeg',
    tags: ['History', 'Architecture', 'Royal'],
    route: {
      tripId: 'trip-meknes-imperial-core',
      waypoints: [
        { lat: 33.8957, lng: -5.5476, label: 'Place El-Hedim' },
        { lat: 33.8961, lng: -5.5484, label: 'Bab Mansour' },
        { lat: 33.8947, lng: -5.5478, label: 'Mausoleum of Moulay Ismail' },
        { lat: 33.8939, lng: -5.5462, label: 'Dar Jamai Museum' },
        { lat: 33.8928, lng: -5.5449, label: 'Medina Souk' },
      ],
    },
  },
  {
    id: 'trip-casablanca-corniche-line',
    title: 'Casablanca Corniche Line',
    city: 'Casablanca',
    country: 'Morocco',
    summary: 'A broader Casablanca route from the Hassan II Mosque down to the Corniche and central stations.',
    image: '/assets/places/m5.jpeg',
    tags: ['Coastal', 'Drive', 'City'],
    route: {
      tripId: 'trip-casablanca-corniche-line',
      waypoints: [
        { lat: 33.6083748, lng: -7.6325771, label: 'Hassan II Mosque' },
        { lat: 33.5951466, lng: -7.6187859, label: 'Ancienne Medina' },
        { lat: 33.5888687, lng: -7.6119978, label: 'United Nations Square' },
        { lat: 33.5731104, lng: -7.5898434, label: 'Casa-Port Station' },
        { lat: 33.5829311, lng: -7.6863452, label: 'La Corniche' },
      ],
    },
  },
  {
    id: 'trip-marrakech-medina-gardens',
    title: 'Marrakech Medina & Gardens',
    city: 'Marrakech',
    country: 'Morocco',
    summary: 'A Marrakech route balancing medina landmarks, gardens, and the railway side of town.',
    image: '/assets/places/m6.jpeg',
    tags: ['Medina', 'Gardens', 'Drive'],
    route: {
      tripId: 'trip-marrakech-medina-gardens',
      waypoints: [
        { lat: 31.6258257, lng: -7.9891608, label: 'Jemaa el-Fna' },
        { lat: 31.6294723, lng: -7.9810845, label: 'Koutoubia Mosque' },
        { lat: 31.6205996, lng: -7.9855634, label: 'Bahia Palace' },
        { lat: 31.6415587, lng: -8.0025825, label: 'Majorelle Garden' },
        { lat: 31.6299992, lng: -8.0175121, label: 'Marrakech Railway Station' },
      ],
    },
  },
  {
    id: 'trip-tangier-port-kasbah',
    title: 'Tangier Port to Kasbah',
    city: 'Tangier',
    country: 'Morocco',
    summary: 'A Tangier route linking the port, medina edge, and kasbah viewpoints.',
    image: '/assets/places/m7.jpeg',
    tags: ['Port', 'Kasbah', 'Transit'],
    route: {
      tripId: 'trip-tangier-port-kasbah',
      waypoints: [
        { lat: 35.7831656, lng: -5.8125092, label: 'Tangier Ville Station' },
        { lat: 35.7908075, lng: -5.8135069, label: 'Grand Socco' },
        { lat: 35.7939482, lng: -5.8173278, label: 'Petit Socco' },
        { lat: 35.7998245, lng: -5.8346482, label: 'Kasbah Museum' },
        { lat: 35.8019344, lng: -5.8380739, label: 'Kasbah Viewpoint' },
      ],
    },
  },
  {
    id: 'trip-agadir-marina-cable',
    title: 'Agadir Marina & Heights',
    city: 'Agadir',
    country: 'Morocco',
    summary: 'A coastal Agadir test route between the beach, marina, cable car area, and souk.',
    image: '/assets/places/m5.jpeg',
    tags: ['Beach', 'Drive', 'Cable'],
    route: {
      tripId: 'trip-agadir-marina-cable',
      waypoints: [
        { lat: 30.4277546, lng: -9.5981072, label: 'Agadir Beach' },
        { lat: 30.4235907, lng: -9.6032128, label: 'Agadir Marina' },
        { lat: 30.4206296, lng: -9.6006354, label: 'Agadir Oufella Cable Base' },
        { lat: 30.4117125, lng: -9.5836371, label: 'Souk El Had' },
        { lat: 30.4141417, lng: -9.5935135, label: 'Vallée des Oiseaux' },
      ],
    },
  },
  {
    id: 'trip-essaouira-medina-ramparts',
    title: 'Essaouira Medina & Ramparts',
    city: 'Essaouira',
    country: 'Morocco',
    summary: 'An Essaouira route between the medina gates, harbor, and sea ramparts.',
    image: '/assets/places/m6.jpeg',
    tags: ['Sea', 'Ramparts', 'Walk'],
    route: {
      tripId: 'trip-essaouira-medina-ramparts',
      waypoints: [
        { lat: 31.5115201, lng: -9.7709046, label: 'Bab Marrakech' },
        { lat: 31.5136454, lng: -9.7693861, label: 'Essaouira Medina' },
        { lat: 31.5146571, lng: -9.7723508, label: 'Skala de la Ville' },
        { lat: 31.5098436, lng: -9.7727774, label: 'Essaouira Port' },
        { lat: 31.5083486, lng: -9.7700132, label: 'Moulay Hassan Square' },
      ],
    },
  },
  {
    id: 'trip-chefchaouen-blue-stairs',
    title: 'Chefchaouen Blue Stairs',
    city: 'Chefchaouen',
    country: 'Morocco',
    summary: 'A compact blue-city route through the medina, kasbah, and lookout steps.',
    image: '/assets/places/m3.jpeg',
    tags: ['Blue City', 'Walk', 'Photo'],
    route: {
      tripId: 'trip-chefchaouen-blue-stairs',
      waypoints: [
        { lat: 35.1714178, lng: -5.2696957, label: 'Outa el Hammam' },
        { lat: 35.1706538, lng: -5.2681695, label: 'Kasbah Museum' },
        { lat: 35.1719711, lng: -5.2636366, label: 'Blue Alley Lookout' },
        { lat: 35.1699075, lng: -5.2643848, label: 'Ras El Maa' },
        { lat: 35.1733971, lng: -5.2667883, label: 'Medina Steps' },
      ],
    },
  },
  {
    id: 'trip-ouarzazate-kasbah-line',
    title: 'Ouarzazate Kasbah Line',
    city: 'Ouarzazate',
    country: 'Morocco',
    summary: 'A desert-city route linking the kasbah core, Taourirt, studios, and main avenues.',
    image: '/assets/places/m4.jpeg',
    tags: ['Kasbah', 'Desert', 'Drive'],
    route: {
      tripId: 'trip-ouarzazate-kasbah-line',
      waypoints: [
        { lat: 30.9180208, lng: -6.8936018, label: 'Kasbah Taourirt' },
        { lat: 30.9217452, lng: -6.9003887, label: 'Cinema Museum' },
        { lat: 30.9299797, lng: -6.9036301, label: 'Atlas Studios' },
        { lat: 30.9347191, lng: -6.9109382, label: 'Main Bus Station' },
        { lat: 30.9147423, lng: -6.9018471, label: 'Avenue Mohammed V' },
      ],
    },
  },
  {
    id: 'trip-merzouga-dunes-sunset',
    title: 'Merzouga Dunes Sunset',
    city: 'Merzouga',
    country: 'Morocco',
    summary: 'A Merzouga test route between village stays, dune access, and sunset viewpoints.',
    image: '/assets/places/m7.jpeg',
    tags: ['Desert', 'Sunset', 'Drive'],
    route: {
      tripId: 'trip-merzouga-dunes-sunset',
      waypoints: [
        { lat: 31.0995774, lng: -4.0120863, label: 'Merzouga Center' },
        { lat: 31.1014382, lng: -4.0109024, label: 'Erg Chebbi Access' },
        { lat: 31.1037359, lng: -4.0103811, label: 'Sunset Dunes Point' },
        { lat: 31.1064462, lng: -4.0149203, label: 'Camp Transfer Zone' },
      ],
    },
  },
  {
    id: 'trip-dakhla-lagoon-line',
    title: 'Dakhla Lagoon Line',
    city: 'Dakhla',
    country: 'Morocco',
    summary: 'A long lagoon route for testing wider-distance connectors in Dakhla.',
    image: '/assets/places/m5.jpeg',
    tags: ['Lagoon', 'Drive', 'Scenic'],
    route: {
      tripId: 'trip-dakhla-lagoon-line',
      waypoints: [
        { lat: 23.7176736, lng: -15.9350633, label: 'Dakhla Center' },
        { lat: 23.7134215, lng: -15.9386791, label: 'Dakhla Waterfront' },
        { lat: 23.7064013, lng: -15.9491178, label: 'Lagoon Point' },
        { lat: 23.6981454, lng: -15.9597546, label: 'Kite Beach Access' },
      ],
    },
  },
  {
    id: 'trip-imlil-valley-links',
    title: 'Imlil Valley Links',
    city: 'Imlil',
    country: 'Morocco',
    summary: 'A mountain village route through trailheads, guesthouses, and valley connectors.',
    image: '/assets/places/m6.jpeg',
    tags: ['Atlas', 'Trails', 'Drive'],
    route: {
      tripId: 'trip-imlil-valley-links',
      waypoints: [
        { lat: 31.1368536, lng: -7.9180408, label: 'Imlil Center' },
        { lat: 31.1346981, lng: -7.9197795, label: 'Trailhead Square' },
        { lat: 31.1327318, lng: -7.9166816, label: 'Aroumd Turnoff' },
        { lat: 31.1298811, lng: -7.9134175, label: 'Valley Guesthouse' },
      ],
    },
  },
  {
    id: 'trip-tetouan-white-medina',
    title: 'Tetouan White Medina',
    city: 'Tetouan',
    country: 'Morocco',
    summary: 'A Tetouan route through the white medina, plazas, and museum edge.',
    image: '/assets/places/m4.jpeg',
    tags: ['White Medina', 'Culture', 'Walk'],
    route: {
      tripId: 'trip-tetouan-white-medina',
      waypoints: [
        { lat: 35.5711267, lng: -5.3723864, label: 'Place Hassan II' },
        { lat: 35.5735202, lng: -5.3699471, label: 'Old Medina Gate' },
        { lat: 35.5759451, lng: -5.3665298, label: 'Ethnographic Museum' },
        { lat: 35.5785172, lng: -5.3626317, label: 'Mellah Edge' },
      ],
    },
  },
  {
    id: 'trip-asilah-sea-wall',
    title: 'Asilah Sea Wall Route',
    city: 'Asilah',
    country: 'Morocco',
    summary: 'A compact Asilah route around the sea wall, medina edge, and mural streets.',
    image: '/assets/places/m3.jpeg',
    tags: ['Coast', 'Walk', 'Murals'],
    route: {
      tripId: 'trip-asilah-sea-wall',
      waypoints: [
        { lat: 35.4661091, lng: -6.0348446, label: 'Asilah Medina Gate' },
        { lat: 35.4680426, lng: -6.0365882, label: 'Mural Street' },
        { lat: 35.4708651, lng: -6.0373074, label: 'Ocean Ramparts' },
        { lat: 35.4722198, lng: -6.0350429, label: 'Borj Al Kamra' },
      ],
    },
  },
]

export interface MapDraftTrip {
  id: string
  tripId: string
  title: string
  city: string
  country: string
  durationDays: number
  nights: number
  spots: number
  image: string
  summary: string
  hasRoute: boolean
  status: 'Draft'
}

const DRAFT_META: Record<string, { durationDays: number; nights: number }> = {
  'trip-rabat-capital-link': { durationDays: 2, nights: 1 },
  'trip-fes-medina-loop': { durationDays: 2, nights: 1 },
  'trip-meknes-imperial-core': { durationDays: 2, nights: 1 },
  'trip-casablanca-corniche-line': { durationDays: 2, nights: 1 },
  'trip-marrakech-medina-gardens': { durationDays: 3, nights: 2 },
  'trip-tangier-port-kasbah': { durationDays: 2, nights: 1 },
  'trip-agadir-marina-cable': { durationDays: 2, nights: 1 },
  'trip-essaouira-medina-ramparts': { durationDays: 2, nights: 1 },
  'trip-chefchaouen-blue-stairs': { durationDays: 2, nights: 1 },
  'trip-ouarzazate-kasbah-line': { durationDays: 2, nights: 1 },
  'trip-merzouga-dunes-sunset': { durationDays: 2, nights: 1 },
  'trip-dakhla-lagoon-line': { durationDays: 3, nights: 2 },
  'trip-imlil-valley-links': { durationDays: 2, nights: 1 },
  'trip-tetouan-white-medina': { durationDays: 2, nights: 1 },
  'trip-asilah-sea-wall': { durationDays: 1, nights: 0 },
}

export const MAP_DRAFT_TRIPS: MapDraftTrip[] = DEMO_TRIPS.map((trip) => {
  const meta = DRAFT_META[trip.id] ?? { durationDays: 2, nights: 1 }
  const spots = normalizeWaypoints(trip.route).length

  return {
    id: `draft-${trip.id}`,
    tripId: trip.id,
    title: trip.title,
    city: trip.city,
    country: trip.country,
    durationDays: meta.durationDays,
    nights: meta.nights,
    spots,
    image: trip.image,
    summary: trip.summary,
    hasRoute: spots >= 2,
    status: 'Draft',
  }
})

// ── Coordinate normalization ──────────────────────────────────────────────────
export function normalizeWaypoints(route?: TripRoute): RouteWaypoint[] {
  if (!route) return []
  if (route.waypoints && route.waypoints.length >= 2) {
    return route.waypoints.map(w => ({
      lat: w.lat,
      lng: w.lng,
      label: w.label,
      kind: w.kind,
      day: w.day,
    }))
  }
  if (route.polyline && route.polyline.length >= 2) {
    return route.polyline.map(([a, b], i) => ({
      lat: a,
      lng: b,
      label: `Waypoint ${i + 1}`,
    }))
  }
  return []
}

export function waypointsToLatLng(wps: RouteWaypoint[]): Array<[number, number]> {
  return wps.map(w => [w.lat, w.lng])
}

export function boundingBox(points: Array<[number, number]>): [[number, number], [number, number]] | null {
  if (!points.length) return null
  const lats = points.map(p => p[0])
  const lngs = points.map(p => p[1])
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

// ── OSRM route fetch ──────────────────────────────────────────────────────────
export async function fetchOsrmRoute(
  waypoints: RouteWaypoint[],
  profile: 'foot' | 'driving' = 'foot',
): Promise<ComputedRoute> {
  const fallback = straightLineRoute(waypoints)
  if (waypoints.length < 2) return fallback
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';')
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=false`,
      { signal: AbortSignal.timeout(10000) },
    )
    if (!res.ok) return fallback
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) return fallback
    const rt = data.routes[0]
    return {
      points: rt.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng] as [number, number]),
      distM: Math.round(rt.distance),
      durS: Math.round(rt.duration),
      failed: false,
      legs: (rt.legs || []).map((l: { distance: number }) => Math.round(l.distance)),
    }
  } catch {
    return fallback
  }
}

function straightLineRoute(wps: RouteWaypoint[]): ComputedRoute {
  const points: Array<[number, number]> = wps.map(w => [w.lat, w.lng])
  const legs = wps.slice(0, -1).map((w, i) => {
    const n = wps[i + 1]
    const dx = (n.lat - w.lat) * 111320
    const dy = (n.lng - w.lng) * 111320 * Math.cos((w.lat * Math.PI) / 180)
    return Math.round(Math.sqrt(dx * dx + dy * dy))
  })
  const distM = legs.reduce((a, b) => a + b, 0)
  return { points, distM, durS: Math.round(distM / 1.25), failed: true, legs }
}

// ── A→B navigation fetch with steps ──────────────────────────────────────────
export async function fetchNavRoute(
  from: NavPoint,
  to: NavPoint,
  profile: NavProfile,
): Promise<NavRoute> {
  const empty: NavRoute = { points: [], distM: 0, durS: 0, steps: [], failed: true }
  try {
    const osrm = profile === 'bike' ? 'bike' : profile
    const url = `https://router.project-osrm.org/route/v1/${osrm}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return empty
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) return empty
    const rt = data.routes[0]
    const steps: NavStep[] = []
    for (const leg of rt.legs || []) {
      for (const s of leg.steps || []) {
        const m = s.maneuver || {}
        if (Math.round(s.distance || 0) === 0 && m.type !== 'arrive') continue
        steps.push({
          instruction: s.name || formatManeuver(m.type, m.modifier),
          distM: Math.round(s.distance || 0),
          type: m.type || 'straight',
          modifier: m.modifier,
        })
      }
    }
    return {
      points: rt.geometry.coordinates.map(([g, a]: number[]) => [a, g] as [number, number]),
      distM: Math.round(rt.distance),
      durS: Math.round(rt.duration),
      steps,
      failed: false,
    }
  } catch {
    return empty
  }
}

function formatManeuver(type?: string, mod?: string): string {
  if (!type) return 'Continue'
  const m = mod ? ` ${mod}` : ''
  const map: Record<string, string> = {
    turn: `Turn${m}`, depart: 'Depart', arrive: 'Arrive at destination',
    merge: `Merge${m}`, ramp: `Take ramp${m}`, fork: `Fork${m}`,
    roundabout: 'Enter roundabout', continue: `Continue${m}`,
  }
  return map[type] || `${type}${m}`
}

// ── Format helpers ────────────────────────────────────────────────────────────
export const fmt = {
  dist: (m: number) => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`,
  time: (s: number) => {
    const m = Math.round(s / 60)
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
  },
}

export function tripById(id: string): DemoTrip | undefined {
  return DEMO_TRIPS.find(t => t.id === id)
}
