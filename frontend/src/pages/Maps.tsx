/**
 * Maps.tsx — Google Maps-level POI search + Tourist step-by-step navigation
 * Uses Geoapify API (same POI database as Google Maps)
 */
import { useState, useCallback, useEffect, useRef, memo, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap, ZoomControl, Circle } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import { Search, X, Navigation, Trash2, ChevronUp, ChevronDown, MapPin, Clock, Footprints, LocateFixed, Plus, Minus, AlertTriangle, Coffee, Utensils, Hotel, Landmark, ShoppingBag, Play, CheckCircle, ChevronRight, Flag, Star, ArrowRight } from 'lucide-react'
import MapLayout from '../components/layouts/Maplayout'
import 'leaflet/dist/leaflet.css'
import { readHeroGeneratedTrip } from '@/lib/heroGeneratedTrip'
import { getPublicTrip } from '@/lib/travelApi'
import { DEMO_TRIPS } from '@/pages/user/mapUtils'

const GEOAPIFY_KEY = 'cf156c4c999d4468bf829a371f065ed5'
const BRAND = '#FC4C02'
const BLUE = '#4285f4'
const DEFAULT_CENTER: LatLngExpression = [34.0615, -4.981]
const DEFAULT_ZOOM = 14
const TILES = {
	light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
	dark: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
	osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
} as const

const CATEGORIES = [
	{ key: 'accommodation', label: '🏨 Hotels', color: '#0ea5e9' },
	{ key: 'catering.restaurant', label: '🍽️ Restaurants', color: '#f59e0b' },
	{ key: 'catering.cafe', label: '☕ Cafés', color: '#8b5cf6' },
	{ key: 'tourism.attraction', label: '🏛️ Sights', color: '#10b981' },
	{ key: 'tourism.sights', label: '🕌 Historic', color: '#6366f1' },
	{ key: 'commercial.shopping_mall', label: '🛍️ Shopping', color: '#ec4899' },
	{ key: 'catering.bar', label: '🍺 Bars', color: '#f97316' },
	{ key: 'leisure.park', label: '🌳 Parks', color: '#22c55e' },
] as const
type CategoryKey = (typeof CATEGORIES)[number]['key']

interface Pin {
	id: number
	lat: number
	lng: number
	label: string
	subtitle?: string
	category?: string
	address?: string
	openingHours?: string
	phone?: string
	website?: string
	rating?: number
}
interface SearchResult {
	id: string
	name: string
	subtitle: string
	lat: number
	lng: number
	category: string
	address?: string
	openingHours?: string
	phone?: string
	website?: string
	rating?: number
}
interface RouteResult {
	points: LatLngExpression[]
	distanceM: number
	durationS: number
	failed: boolean
	legs: number[]
}
interface UserLocation {
	lat: number
	lng: number
	accuracy: number
}

const fmt = {
	dist: (m: number) => (m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)} km`),
	time: (s: number) => {
		const m = Math.round(s / 60)
		return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
	},
}
function straightDist(a: Pin, b: Pin) {
	return Math.round(Math.sqrt((b.lat - a.lat) ** 2 + (b.lng - a.lng) ** 2) * 111_000)
}
function pinColor(i: number, total: number) {
	if (i === 0) return BRAND
	if (i === total - 1) return '#18181b'
	return '#6366f1'
}
function catColor(cat: string) {
	return CATEGORIES.find((c) => cat.startsWith(c.key.split('.')[0]))?.color || '#6366f1'
}
function catEmoji(cat: string) {
	if (cat.includes('accommodation')) return '🏨'
	if (cat.includes('restaurant')) return '🍽️'
	if (cat.includes('cafe')) return '☕'
	if (cat.includes('bar')) return '🍺'
	if (cat.includes('tourism') || cat.includes('sights')) return '🏛️'
	if (cat.includes('shopping') || cat.includes('commercial')) return '🛍️'
	if (cat.includes('park') || cat.includes('leisure')) return '🌳'
	return '📍'
}

async function geoapifyAutocomplete(query: string, lat: number, lng: number, signal: AbortSignal): Promise<SearchResult[]> {
	const params = new URLSearchParams({ text: query, apiKey: GEOAPIFY_KEY, limit: '10', lang: 'en', bias: `proximity:${lng},${lat}`, filter: `circle:${lng},${lat},30000`, format: 'json' })
	const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal })
	if (!res.ok) return []
	const data = await res.json()
	return (data.results || []).map((r: { place_id: string; name?: string; formatted: string; lat: number; lon: number; categories?: string[]; address_line1?: string; address_line2?: string; datasource?: { raw?: { opening_hours?: string; phone?: string; website?: string; stars?: number } } }) => ({
		id: r.place_id || Math.random().toString(),
		name: r.name || r.address_line1 || r.formatted.split(',')[0],
		subtitle: r.address_line2 || r.formatted.split(',').slice(1, 3).join(',').trim(),
		lat: r.lat,
		lng: r.lon,
		category: (r.categories || [])[0] || 'place',
		address: r.formatted,
		openingHours: r.datasource?.raw?.opening_hours,
		phone: r.datasource?.raw?.phone,
		website: r.datasource?.raw?.website,
		rating: r.datasource?.raw?.stars,
	}))
}

async function geoapifyPlaces(category: CategoryKey, lat: number, lng: number, signal: AbortSignal): Promise<SearchResult[]> {
	const params = new URLSearchParams({ categories: category, filter: `circle:${lng},${lat},5000`, limit: '40', apiKey: GEOAPIFY_KEY })
	const res = await fetch(`https://api.geoapify.com/v2/places?${params}`, { signal })
	if (!res.ok) return []
	const data = await res.json()
	return (data.features || [])
		.filter((f: { properties?: { name?: string } }) => f.properties?.name)
		.map((f: { properties: { place_id: string; name: string; formatted: string; lat: number; lon: number; categories?: string[]; address_line1?: string; address_line2?: string; datasource?: { raw?: { opening_hours?: string; phone?: string; website?: string; stars?: number } } } }) => {
			const p = f.properties
			return { id: p.place_id || Math.random().toString(), name: p.name, subtitle: p.address_line2 || p.formatted?.split(',').slice(1, 2).join('').trim() || '', lat: p.lat, lng: p.lon, category: (p.categories || [])[0] || category, address: p.formatted, openingHours: p.datasource?.raw?.opening_hours, phone: p.datasource?.raw?.phone, website: p.datasource?.raw?.website, rating: p.datasource?.raw?.stars }
		})
}

function useSearch(centerRef: React.RefObject<{ lat: number; lng: number }>) {
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])
	const [busy, setBusy] = useState(false)
	const [open, setOpen] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout>>(0)
	const abort = useRef<AbortController>(null)
	useEffect(() => {
		clearTimeout(timer.current)
		if (query.trim().length < 2) {
			setResults([])
			setOpen(false)
			return
		}
		timer.current = setTimeout(async () => {
			abort.current?.abort()
			abort.current = new AbortController()
			setBusy(true)
			try {
				const { lat, lng } = centerRef.current!
				const res = await geoapifyAutocomplete(query.trim(), lat, lng, abort.current.signal)
				setResults(res)
				setOpen(true)
			} catch (e: unknown) {
				if ((e as Error).name !== 'AbortError') setResults([])
			} finally {
				setBusy(false)
			}
		}, 300)
		return () => clearTimeout(timer.current)
	}, [query]) // eslint-disable-line
	const clear = useCallback(() => {
		abort.current?.abort()
		setQuery('')
		setResults([])
		setOpen(false)
	}, [])
	return { query, setQuery, results, busy, open, setOpen, clear }
}

async function fetchRoute(pins: Pin[]): Promise<RouteResult> {
	const lf = pins.slice(0, -1).map((p, i) => straightDist(p, pins[i + 1]))
	const fb: RouteResult = { points: pins.map((p) => [p.lat, p.lng]), distanceM: lf.reduce((a, b) => a + b, 0), durationS: (lf.reduce((a, b) => a + b, 0) / 1_000) * 720, failed: true, legs: lf }
	if (pins.length < 2) return { ...fb, distanceM: 0, durationS: 0, legs: [] }
	try {
		const coords = pins.map((p) => `${p.lng},${p.lat}`).join(';')
		for (const profile of ['foot', 'driving']) {
			const r = await fetch(`/osrm/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=false`, { signal: AbortSignal.timeout(8_000) })
			if (!r.ok) continue
			const d = await r.json()
			if (d.code !== 'Ok' || !d.routes?.length) continue
			const route = d.routes[0]
			return { points: route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]), distanceM: Math.round(route.distance), durationS: Math.round(route.duration), failed: false, legs: (route.legs ?? []).map((l: { distance: number }) => Math.round(l.distance)) }
		}
		return fb
	} catch {
		return fb
	}
}

function useRoute(pins: Pin[]) {
	const E: RouteResult = { points: [], distanceM: 0, durationS: 0, failed: false, legs: [] }
	const [route, setRoute] = useState<RouteResult>(E)
	const [loading, setLoading] = useState(false)
	const key = pins.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|')
	useEffect(() => {
		let dead = false
		if (pins.length < 2) {
			setRoute(E)
			return
		}
		setLoading(true)
		fetchRoute(pins).then((r) => {
			if (!dead) {
				setRoute(r)
				setLoading(false)
			}
		})
		return () => {
			dead = true
		}
	}, [key]) // eslint-disable-line
	return { route, loading }
}

function useGeolocation(onLocated: (lat: number, lng: number) => void) {
	const [locating, setLocating] = useState(false)
	const [location, setLocation] = useState<UserLocation | null>(null)
	const [geoError, setGeoError] = useState<string | null>(null)
	const cbRef = useRef(onLocated)
	useEffect(() => {
		cbRef.current = onLocated
	}, [onLocated])
	const locate = useCallback(() => {
		if (!navigator.geolocation) {
			setGeoError('Not supported')
			return
		}
		setLocating(true)
		setGeoError(null)
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
				setLocation(loc)
				setLocating(false)
				cbRef.current(loc.lat, loc.lng)
			},
			(err) => {
				setLocating(false)
				setGeoError(err.code === 1 ? 'Location access denied.' : 'Could not get location.')
			},
			{ enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
		)
	}, [])
	return { locate, locating, location, geoError }
}

function makeWaypointIcon(n: number, color: string, active = false) {
	const s = active ? 38 : 30
	return new DivIcon({
		className: '',
		iconSize: [s + 4, s + 14],
		iconAnchor: [(s + 4) / 2, s + 14],
		html: `<div style="display:flex;flex-direction:column;align-items:center;position:relative;">${active ? `<div style="position:absolute;width:${s + 16}px;height:${s + 16}px;border-radius:50%;background:${color}22;top:-8px;left:-8px;animation:activepin 1.5s ease-in-out infinite;"></div>` : ''}<div style="width:${s}px;height:${s}px;border-radius:50%;background:${color};border:${active ? 3 : 2.5}px solid #fff;box-shadow:0 3px 14px ${color}66;display:flex;align-items:center;justify-content:center;font-size:${s * 0.4}px;font-weight:900;color:#fff;font-family:system-ui,sans-serif;position:relative;z-index:1;">${n}</div><div style="width:2px;height:10px;background:${color};border-radius:0 0 2px 2px;margin-top:-1px;opacity:.9;"></div></div>`,
	})
}
function makePoiIcon(category: string, small = false) {
	const c = catColor(category)
	const e = catEmoji(category)
	const sz = small ? 26 : 34
	return new DivIcon({
		className: '',
		iconSize: [sz + 4, sz + 12],
		iconAnchor: [(sz + 4) / 2, sz + 12],
		html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:${sz}px;height:${sz}px;border-radius:${sz / 3.5}px;background:${c};border:2px solid #fff;box-shadow:0 3px 12px ${c}55;display:flex;align-items:center;justify-content:center;font-size:${sz * 0.48}px;">${e}</div><div style="width:2px;height:8px;background:${c};border-radius:0 0 2px 2px;margin-top:-1px;"></div></div>`,
	})
}
function makeUserDotIcon() {
	return new DivIcon({
		className: '',
		iconSize: [24, 24],
		iconAnchor: [12, 12],
		html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(66,133,244,.25);animation:userpulse 2.2s ease-out infinite;"></div><div style="width:14px;height:14px;border-radius:50%;background:${BLUE};border:2.5px solid #fff;box-shadow:0 2px 10px rgba(66,133,244,.7);position:relative;z-index:1;"></div></div>`,
	})
}

function ClickHandler({ cbRef }: { cbRef: React.RefObject<((lat: number, lng: number) => void) | null> }) {
	useMapEvents({ click: (e) => cbRef.current?.(e.latlng.lat, e.latlng.lng) })
	return null
}
function MapBridge({ flyRef, centerRef }: { flyRef: React.RefObject<((lat: number, lng: number, zoom?: number) => void) | null>; centerRef: React.RefObject<{ lat: number; lng: number }> }) {
	const map = useMap()
	useEffect(() => {
		flyRef.current = (lat, lng, zoom = 16) => map.flyTo([lat, lng], zoom, { animate: true, duration: 1.0 })
		const update = () => {
			const c = map.getCenter()
			centerRef.current = { lat: c.lat, lng: c.lng }
		}
		map.on('moveend', update)
		update()
		return () => {
			map.off('moveend', update)
		}
	}, [map, flyRef, centerRef])
	return null
}
function FitBounds({ pins }: { pins: Pin[] }) {
	const map = useMap()
	const prevKey = useRef('')
	useEffect(() => {
		if (pins.length < 2) return
		const key = pins.map((p) => p.id).join(',')
		if (key === prevKey.current) return
		prevKey.current = key
		map.fitBounds(
			pins.map((p) => [p.lat, p.lng] as [number, number]),
			{ padding: [56, 56], maxZoom: 17 },
		)
	}, [pins, map])
	return null
}
const RouteLayer = memo(function RouteLayer({ route, show }: { route: RouteResult; show: boolean }) {
	if (!show || route.points.length < 2) return null
	return (
		<Fragment>
			<Polyline positions={route.points} pathOptions={{ color: BRAND, weight: 18, opacity: 0.07 }} />
			<Polyline positions={route.points} pathOptions={{ color: BRAND, weight: 10, opacity: 0.17 }} />
			<Polyline positions={route.points} pathOptions={route.failed ? { color: '#f59e0b', weight: 3.5, opacity: 0.9, dashArray: '8 11' } : { color: BRAND, weight: 4.5, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
		</Fragment>
	)
})

function ResultIcon({ category }: { category: string }) {
	const cls = 'h-4 w-4'
	if (category.includes('accommodation')) return <Hotel className={cls} />
	if (category.includes('restaurant')) return <Utensils className={cls} />
	if (category.includes('cafe')) return <Coffee className={cls} />
	if (category.includes('tourism') || category.includes('sights')) return <Landmark className={cls} />
	if (category.includes('commercial') || category.includes('shop')) return <ShoppingBag className={cls} />
	return <MapPin className={cls} />
}
function resultBg(c: string) {
	if (c.includes('accommodation')) return 'bg-sky-100 text-sky-600'
	if (c.includes('restaurant')) return 'bg-amber-100 text-amber-600'
	if (c.includes('cafe')) return 'bg-violet-100 text-violet-600'
	if (c.includes('tourism') || c.includes('sights')) return 'bg-emerald-100 text-emerald-600'
	if (c.includes('commercial')) return 'bg-pink-100 text-pink-600'
	return 'bg-indigo-100 text-indigo-600'
}

function TourMode({ pins, currentStop, onNext, onEnd, route }: { pins: Pin[]; currentStop: number; onNext: () => void; onEnd: () => void; route: RouteResult }) {
	const pin = pins[currentStop]
	const isLast = currentStop === pins.length - 1
	return (
		<div className='flex flex-col h-full'>
			<div className='px-5 pt-4 pb-3 border-b border-zinc-100'>
				<div className='flex items-center justify-between mb-2'>
					<span className='text-[11px] font-bold text-zinc-400 uppercase tracking-wider'>
						Stop {currentStop + 1} of {pins.length}
					</span>
					<button onClick={onEnd} className='text-[11px] font-bold text-zinc-400 hover:text-zinc-600 transition'>
						End tour
					</button>
				</div>
				<div className='h-1.5 bg-zinc-100 rounded-full overflow-hidden'>
					<div className='h-full rounded-full transition-all duration-500' style={{ width: `${((currentStop + 1) / pins.length) * 100}%`, background: BRAND }} />
				</div>
				<div className='flex justify-between mt-2'>
					{pins.map((_, i) => (
						<div key={i} className={`h-2 w-2 rounded-full transition-all duration-300 ${i < currentStop ? 'bg-green-500' : i === currentStop ? 'bg-[#FC4C02] scale-125' : 'bg-zinc-200'}`} />
					))}
				</div>
			</div>
			<div className='flex-1 overflow-y-auto px-5 py-4'>
				<div className='rounded-2xl border border-zinc-100 overflow-hidden'>
					<div className='p-4 bg-linear-to-br from-orange-50 to-white'>
						<div className='flex items-start gap-3'>
							<div className='h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-2xl' style={{ background: catColor(pin.category || '') + '22' }}>
								{catEmoji(pin.category || '')}
							</div>
							<div className='flex-1 min-w-0'>
								<p className='text-[15px] font-black text-zinc-900 leading-tight'>{pin.label}</p>
								{pin.subtitle && <p className='text-[11px] text-zinc-400 mt-0.5 capitalize'>{pin.subtitle}</p>}
								{pin.rating && (
									<div className='flex items-center gap-1 mt-1'>
										<Star className='h-3 w-3 text-amber-400 fill-amber-400' />
										<span className='text-[11px] font-bold text-zinc-700'>{pin.rating}</span>
									</div>
								)}
							</div>
						</div>
					</div>
					<div className='divide-y divide-zinc-50'>
						{pin.address && (
							<div className='px-4 py-3 flex items-start gap-3'>
								<MapPin className='h-4 w-4 text-zinc-400 shrink-0 mt-0.5' />
								<p className='text-[12px] text-zinc-600 leading-relaxed'>{pin.address}</p>
							</div>
						)}
						{pin.openingHours && (
							<div className='px-4 py-3 flex items-start gap-3'>
								<Clock className='h-4 w-4 text-zinc-400 shrink-0 mt-0.5' />
								<p className='text-[12px] text-zinc-600'>{pin.openingHours}</p>
							</div>
						)}
						{pin.phone && (
							<div className='px-4 py-3 flex items-start gap-3'>
								<span className='text-[12px] shrink-0 mt-0.5'>📞</span>
								<a href={`tel:${pin.phone}`} className='text-[12px] text-blue-600 font-medium'>
									{pin.phone}
								</a>
							</div>
						)}
						{pin.website && (
							<div className='px-4 py-3 flex items-start gap-3'>
								<span className='text-[12px] shrink-0 mt-0.5'>🌐</span>
								<a href={pin.website} target='_blank' rel='noreferrer' className='text-[12px] text-blue-600 font-medium truncate'>
									{pin.website.replace('https://', '')}
								</a>
							</div>
						)}
					</div>
				</div>
				{!isLast && route.legs[currentStop] && (
					<div className='mt-3 flex items-center gap-2 px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100'>
						<Navigation className='h-4 w-4 text-[#FC4C02] shrink-0' />
						<div className='flex-1'>
							<p className='text-[12px] font-bold text-zinc-700'>
								Next: <span className='text-[#FC4C02]'>{pins[currentStop + 1]?.label}</span>
							</p>
							<p className='text-[11px] text-zinc-400'>
								{fmt.dist(route.legs[currentStop])} · ~{fmt.time((route.legs[currentStop] / 1000) * 720)}
							</p>
						</div>
						<ArrowRight className='h-4 w-4 text-zinc-400' />
					</div>
				)}
				{currentStop > 0 && (
					<div className='mt-3'>
						<p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2'>Completed</p>
						{pins.slice(0, currentStop).map((p) => (
							<div key={p.id} className='flex items-center gap-2 py-1.5'>
								<CheckCircle className='h-4 w-4 text-green-500 shrink-0' />
								<span className='text-[12px] text-zinc-400 line-through truncate'>{p.label}</span>
							</div>
						))}
					</div>
				)}
			</div>
			<div className='px-5 py-4 border-t border-zinc-100'>
				{isLast ? (
					<button onClick={onEnd} className='w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 text-white text-[14px] font-black hover:bg-green-600 active:scale-[.98] transition'>
						<Flag className='h-5 w-5' />
						Tour Complete! 🎉
					</button>
				) : (
					<button onClick={onNext} className='w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-[14px] font-black active:scale-[.98] transition' style={{ background: BRAND }}>
						Done here → Next Stop
						<ChevronRight className='h-5 w-5' />
					</button>
				)}
			</div>
		</div>
	)
}

export default function Maps() {
	const [pins, setPins] = useState<Pin[]>([])
	const [nextId, setNextId] = useState(1)
	const [editId, setEditId] = useState<number | null>(null)
	const [showRoute, setShowRoute] = useState(true)
	const [tileKey, setTileKey] = useState<keyof typeof TILES>('light')
	const [panelOpen, setPanelOpen] = useState(false)
	const [addMode, setAddMode] = useState(true)
	const [previewPin, setPreviewPin] = useState<SearchResult | null>(null)
	const [browseResults, setBrowseResults] = useState<SearchResult[]>([])
	const [browsingCat, setBrowsingCat] = useState<CategoryKey | null>(null)
	const [browseBusy, setBrowseBusy] = useState(false)
	const [toast, setToast] = useState<string | null>(null)
	const [tourActive, setTourActive] = useState(false)
	const [currentStop, setCurrentStop] = useState(0)
	const flyRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)
	const centerRef = useRef<{ lat: number; lng: number }>({ lat: (DEFAULT_CENTER as number[])[0], lng: (DEFAULT_CENTER as number[])[1] })
	const clickCbRef = useRef<((lat: number, lng: number) => void) | null>(null)
	const searchWrap = useRef<HTMLDivElement>(null)
	const browseAbort = useRef<AbortController>(null)
	const { route, loading: routeLoading } = useRoute(pins)
	const { query, setQuery, results, busy, open, setOpen, clear } = useSearch(centerRef)
	const showToast = useCallback((msg: string) => {
		setToast(msg)
		setTimeout(() => setToast(null), 2500)
	}, [])
	const handleLocated = useCallback(
		(lat: number, lng: number) => {
			flyRef.current?.(lat, lng, 17)
			showToast('Showing your location')
		},
		[showToast],
	)
	const { locate, locating, location: userLoc, geoError } = useGeolocation(handleLocated)

	useEffect(() => {
		clickCbRef.current =
			addMode && !tourActive
				? (lat, lng) => {
						const id = nextId
						setPins((p) => [...p, { id, lat, lng, label: `Stop ${id}` }])
						setNextId((n) => n + 1)
						setPanelOpen(true)
					}
				: null
	}, [addMode, nextId, tourActive])
	useEffect(() => {
		const h = (e: MouseEvent) => {
			if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', h)
		return () => document.removeEventListener('mousedown', h)
	}, [setOpen])
	useEffect(() => {
		if (tourActive && pins[currentStop]) flyRef.current?.(pins[currentStop].lat, pins[currentStop].lng, 17)
	}, [tourActive, currentStop, pins])

	const addPin = useCallback(
		(r: SearchResult) => {
			const id = nextId
			setPins((p) => [...p, { id, lat: r.lat, lng: r.lng, label: r.name, subtitle: r.subtitle, category: r.category, address: r.address, openingHours: r.openingHours, phone: r.phone, website: r.website, rating: r.rating }])
			setNextId((n) => n + 1)
			setPanelOpen(true)
			showToast(`"${r.name}" added`)
		},
		[nextId, showToast],
	)
	const removePin = useCallback((id: number) => setPins((p) => p.filter((x) => x.id !== id)), [])

	// Open a saved or generated trip from ?trip=… (links from the trip page and history)
	useEffect(() => {
		const tripId = new URLSearchParams(window.location.search).get('trip')
		if (!tripId) return
		let cancelled = false
		const load = async () => {
			type Stop = { lat?: number; lng?: number; label?: string; name?: string }
			let stops: Stop[] = []
			const local = readHeroGeneratedTrip<unknown>(tripId)
			const demo = DEMO_TRIPS.find((trip) => trip.id === tripId)
			if (local?.mapTrip?.route?.waypoints?.length) stops = local.mapTrip.route.waypoints
			else if (demo?.route?.waypoints?.length) stops = demo.route.waypoints
			else if (/^[0-9a-f-]{36}$/i.test(tripId)) {
				try {
					const { data } = await getPublicTrip(tripId)
					const plan = data.plan as { days?: Array<{ hotel?: Stop; stops?: Stop[] }> } | undefined
					stops = (plan?.days ?? []).flatMap((day, index) => [...(index === 0 && day.hotel ? [day.hotel] : []), ...(day.stops ?? [])])
				} catch {
					stops = []
				}
			}
			const located = stops.filter((stop) => typeof stop.lat === 'number' && typeof stop.lng === 'number')
			if (cancelled || !located.length) return
			setPins(located.map((stop, index) => ({ id: index + 1, lat: stop.lat as number, lng: stop.lng as number, label: stop.label || stop.name || `Stop ${index + 1}` })))
			setNextId(located.length + 1)
			setPanelOpen(true)
		}
		void load()
		return () => {
			cancelled = true
		}
	}, [])
	const rename = useCallback((id: number, label: string) => setPins((p) => p.map((x) => (x.id === id ? { ...x, label } : x))), [])
	const clearAll = useCallback(() => {
		setPins([])
		setNextId(1)
		setPreviewPin(null)
		setBrowseResults([])
		setBrowsingCat(null)
		clear()
		setTourActive(false)
		setCurrentStop(0)
		showToast('Cleared')
	}, [clear, showToast])
	const pickResult = useCallback(
		(r: SearchResult) => {
			setPreviewPin(r)
			setQuery(r.name)
			setOpen(false)
			flyRef.current?.(r.lat, r.lng, 17)
		},
		[setQuery, setOpen],
	)
	const addPreview = useCallback(() => {
		if (!previewPin) return
		addPin(previewPin)
		setPreviewPin(null)
		clear()
	}, [previewPin, addPin, clear])
	const handleBrowse = useCallback(
		async (cat: CategoryKey) => {
			if (browsingCat === cat) {
				setBrowseResults([])
				setBrowsingCat(null)
				return
			}
			browseAbort.current?.abort()
			browseAbort.current = new AbortController()
			setBrowseBusy(true)
			setBrowsingCat(cat)
			try {
				const res = await geoapifyPlaces(cat, centerRef.current.lat, centerRef.current.lng, browseAbort.current.signal)
				setBrowseResults(res)
				showToast(`${res.length} places found`)
			} catch {
			} finally {
				setBrowseBusy(false)
			}
		},
		[browsingCat, showToast],
	)
	const startTour = useCallback(() => {
		if (pins.length === 0) return
		setTourActive(true)
		setCurrentStop(0)
		setPanelOpen(true)
		flyRef.current?.(pins[0].lat, pins[0].lng, 17)
	}, [pins])
	const nextStop = useCallback(() => {
		if (currentStop < pins.length - 1) setCurrentStop((s) => s + 1)
	}, [currentStop, pins.length])
	const endTour = useCallback(() => {
		setTourActive(false)
		setCurrentStop(0)
		showToast('Tour ended')
	}, [showToast])

	return (
		<MapLayout>
			<div className='relative flex h-full w-full overflow-hidden bg-zinc-100'>
				<style>{`
          @keyframes userpulse { 0%{transform:scale(1);opacity:.55} 70%{transform:scale(3.2);opacity:0} 100%{opacity:0} }
          @keyframes activepin { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.6);opacity:0} }
          @keyframes toastIn { from{opacity:0;transform:translateY(6px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
          .leaflet-popup-content-wrapper,.leaflet-popup-tip-container{display:none!important}
          .map-add .leaflet-container{cursor:crosshair!important}
          .map-pan .leaflet-container{cursor:grab!important}
          .map-pan .leaflet-container:active{cursor:grabbing!important}
          .leaflet-control-zoom{border:none!important;box-shadow:0 4px 24px rgba(0,0,0,.13)!important;border-radius:14px!important;overflow:hidden;margin:0 12px 12px 0!important}
          .leaflet-control-zoom a{border:none!important;background:#fff!important;color:#18181b!important;font-weight:900!important;width:40px!important;height:40px!important;line-height:40px!important;font-size:20px!important}
          .leaflet-control-zoom a:hover{background:#f4f4f5!important}

          @media(max-width:1024px){.leaflet-control-zoom{margin-bottom:90px!important}}
          .scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}
        `}</style>

				{toast && (
					<div className='absolute top-4 left-1/2 -translate-x-1/2 z-3000 bg-zinc-900/90 backdrop-blur-sm text-white text-[12px] font-semibold px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none' style={{ animation: 'toastIn .2s ease both' }}>
						{toast}
					</div>
				)}

				{/* SEARCH BAR */}
				{!tourActive && (
					<div ref={searchWrap} className='absolute z-2500 top-20 left-3 right-16 lg:left-[316px] lg:right-auto lg:w-[440px]'>
						<div className={`bg-white rounded-2xl overflow-hidden shadow-[0_4px_28px_rgba(0,0,0,.16)] ${open && results.length > 0 ? 'shadow-[0_8px_40px_rgba(0,0,0,.22)]' : ''}`}>
							<div className='flex items-center gap-3 px-4 py-3.5'>
								{busy ? <div className='h-4 w-4 border-2 border-zinc-200 border-t-[#FC4C02] rounded-full animate-spin shrink-0' /> : <Search className='h-[18px] w-[18px] text-zinc-400 shrink-0' />}
								<input
									value={query}
									onChange={(e) => {
										setQuery(e.target.value)
										setPreviewPin(null)
									}}
									onFocus={() => results.length > 0 && setOpen(true)}
									placeholder='Search cafes, riads, museums, restaurants…'
									autoComplete='off'
									spellCheck={false}
									className='flex-1 bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none min-w-0'
								/>
								{query && (
									<button
										onClick={() => {
											clear()
											setPreviewPin(null)
										}}
										className='h-6 w-6 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition shrink-0'>
										<X className='h-3.5 w-3.5' />
									</button>
								)}
							</div>
							{open && results.length > 0 && (
								<div className='border-t border-zinc-100 max-h-[320px] overflow-y-auto'>
									{results.map((r, i) => (
										<div key={r.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors ${i < results.length - 1 ? 'border-b border-zinc-50' : ''}`}>
											<button
												className='flex items-center gap-3 flex-1 min-w-0 text-left'
												onMouseDown={(e) => {
													e.preventDefault()
													pickResult(r)
												}}>
												<div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${resultBg(r.category)}`}>
													<ResultIcon category={r.category} />
												</div>
												<div className='min-w-0'>
													<p className='text-[13px] font-semibold text-zinc-900 truncate'>{r.name}</p>
													<p className='text-[11px] text-zinc-400 truncate mt-0.5'>{r.subtitle}</p>
												</div>
											</button>
											<button
												onMouseDown={(e) => {
													e.preventDefault()
													addPin(r)
												}}
												className='shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-orange-50 text-[#FC4C02] hover:bg-orange-100 transition'
												title='Add to route'>
												<Plus className='h-3.5 w-3.5' />
											</button>
										</div>
									))}
								</div>
							)}
							{open && !busy && query.trim().length >= 2 && results.length === 0 && (
								<div className='border-t border-zinc-100 px-4 py-5 text-center'>
									<p className='text-[13px] text-zinc-400 font-medium'>No results found</p>
									<p className='text-[11px] text-zinc-400 mt-1'>Try a different term</p>
								</div>
							)}
						</div>
						{!query && (
							<div className='mt-2 flex gap-1.5 flex-wrap'>
								{CATEGORIES.map((cat) => (
									<button key={cat.key} onClick={() => handleBrowse(cat.key)} className={`flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-semibold shadow-sm border transition-all active:scale-95 ${browsingCat === cat.key ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-100 hover:bg-zinc-50'}`}>
										{browseBusy && browsingCat === cat.key && <div className='h-3 w-3 border border-current/30 border-t-current rounded-full animate-spin' />}
										{cat.label}
									</button>
								))}
								{browsingCat && (
									<button
										onClick={() => {
											setBrowseResults([])
											setBrowsingCat(null)
										}}
										className='flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-semibold bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition'>
										<X className='h-3 w-3' /> Clear
									</button>
								)}
							</div>
						)}
						{previewPin && !open && (
							<button onClick={addPreview} className='mt-2 w-full flex items-center justify-center gap-2 bg-[#FC4C02] text-white text-[13px] font-bold px-4 py-3 rounded-xl shadow-[0_4px_20px_rgba(252,76,2,.35)] hover:bg-orange-600 active:scale-[.98] transition-all'>
								<Plus className='h-4 w-4' />
								Add "{previewPin.name}" to route
							</button>
						)}
						{geoError && (
							<div className='mt-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex gap-2 items-start'>
								<AlertTriangle className='h-4 w-4 text-red-500 shrink-0 mt-0.5' />
								<p className='text-[12px] text-red-600 font-medium'>{geoError}</p>
							</div>
						)}
					</div>
				)}

				{/* Locate me mobile */}
				<button onClick={locate} disabled={locating} className='lg:hidden absolute z-2500 top-3 right-3 h-12 w-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,.15)] hover:bg-zinc-50 active:scale-95 transition-all'>
					{locating ? <div className='h-4 w-4 border-2 border-zinc-200 border-t-[#4285f4] rounded-full animate-spin' /> : <LocateFixed style={{ width: 18, height: 18 }} className='text-zinc-600' />}
				</button>

				{/* DESKTOP SIDEBAR */}
				<aside className='hidden lg:flex flex-col w-[300px] shrink-0 bg-white border-r border-zinc-100 z-1000 shadow-sm overflow-hidden'>
					{tourActive ? (
						<TourMode pins={pins} currentStop={currentStop} onNext={nextStop} onEnd={endTour} route={route} />
					) : (
						<>
							<div className='px-5 py-4 border-b border-zinc-100 shrink-0'>
								<div className='flex items-center justify-between'>
									<div>
										<h1 className='text-[15px] font-black text-zinc-900 tracking-tight'>Trip Planner</h1>
										<p className='text-[11px] text-zinc-400 mt-0.5'>{pins.length === 0 ? 'Search or browse places' : `${pins.length} stop${pins.length !== 1 ? 's' : ''} planned`}</p>
									</div>
									<div className='flex gap-1.5'>
										<button onClick={locate} disabled={locating} className='h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-blue-500 hover:bg-blue-50 transition'>
											{locating ? <div className='h-3.5 w-3.5 border-2 border-zinc-200 border-t-[#4285f4] rounded-full animate-spin' /> : <LocateFixed className='h-4 w-4' />}
										</button>
										{pins.length > 0 && (
											<button onClick={clearAll} className='h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition'>
												<Trash2 className='h-4 w-4' />
											</button>
										)}
									</div>
								</div>
							</div>
							<div className='px-4 py-3 border-b border-zinc-100 shrink-0'>
								<button
									onClick={() => {
										setAddMode((m) => !m)
										showToast(addMode ? 'Pan mode' : 'Tap map to drop a pin')
									}}
									className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all ${addMode ? 'bg-[#FC4C02] text-white shadow-[0_4px_16px_rgba(252,76,2,.3)]' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
									{addMode ? <Minus className='h-3.5 w-3.5' /> : <Plus className='h-3.5 w-3.5' />}
									{addMode ? 'Tap map to add stop' : 'Enable add-pin mode'}
								</button>
							</div>
							{routeLoading && pins.length >= 2 && (
								<div className='flex items-center justify-center gap-2 py-4 border-b border-zinc-100 shrink-0'>
									{[0, 100, 200].map((d) => (
										<div key={d} style={{ animationDelay: `${d}ms` }} className='h-1.5 w-1.5 rounded-full bg-[#FC4C02] animate-bounce' />
									))}
									<span className='text-[11px] text-zinc-400 ml-1 font-medium'>Calculating…</span>
								</div>
							)}
							{!routeLoading && pins.length >= 2 && (
								<div className='flex border-b border-zinc-100 shrink-0'>
									<div className='flex-1 flex flex-col items-center py-3 gap-1'>
										<Footprints className='h-3.5 w-3.5 text-zinc-400' />
										<span className='text-[17px] font-black text-zinc-900 leading-none'>{fmt.dist(route.distanceM)}</span>
										<span className='text-[9px] font-bold uppercase tracking-wider text-zinc-400'>Total</span>
									</div>
									<div className='w-px bg-zinc-100' />
									<div className='flex-1 flex flex-col items-center py-3 gap-1'>
										<Clock className='h-3.5 w-3.5 text-zinc-400' />
										<span className='text-[17px] font-black text-zinc-900 leading-none'>{fmt.time(route.durationS)}</span>
										<span className='text-[9px] font-bold uppercase tracking-wider text-zinc-400'>Time</span>
									</div>
									<div className='w-px bg-zinc-100' />
									<div className='flex-1 flex flex-col items-center py-3 gap-1'>
										<MapPin className='h-3.5 w-3.5 text-zinc-400' />
										<span className='text-[17px] font-black text-zinc-900 leading-none'>{pins.length}</span>
										<span className='text-[9px] font-bold uppercase tracking-wider text-zinc-400'>Stops</span>
									</div>
								</div>
							)}
							{pins.length === 0 && (
								<div className='flex-1 flex flex-col items-center justify-center px-6 py-4 text-center gap-3'>
									<div className='h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl'>🗺️</div>
									<div>
										<p className='text-[14px] font-black text-zinc-800'>Plan your tour</p>
										<p className='text-[12px] text-zinc-400 mt-1 leading-relaxed'>Search places or tap category chips to discover what's nearby</p>
									</div>
									<div className='flex flex-col gap-2 text-left w-full bg-zinc-50 rounded-xl p-3'>
										{['🔍 Search any place above', '➕ Tap + to add to route', '▶️ Hit Start Tour to navigate stop by stop'].map((t) => (
											<p key={t} className='text-[11px] text-zinc-500'>
												{t}
											</p>
										))}
									</div>
								</div>
							)}
							{pins.length > 0 && (
								<div className='flex-1 overflow-y-auto py-2 px-2'>
									<StopList pins={pins} editId={editId} setEditId={setEditId} rename={rename} removePin={removePin} routeLegs={route.legs} routeLoading={routeLoading} routeFailed={route.failed} />
								</div>
							)}
							<div className='border-t border-zinc-100 px-4 py-3 flex flex-col gap-2 shrink-0'>
								{pins.length >= 2 && (
									<button onClick={startTour} className='w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[13px] font-black transition hover:opacity-90 active:scale-[.98]' style={{ background: BRAND }}>
										<Play className='h-4 w-4 fill-white' />
										Start Tour ({pins.length} stops)
									</button>
								)}
								<div className='flex gap-1.5'>
									{(Object.keys(TILES) as Array<keyof typeof TILES>).map((k) => (
										<button key={k} onClick={() => setTileKey(k)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition capitalize ${tileKey === k ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
											{k}
										</button>
									))}
									<button onClick={() => setShowRoute((r) => !r)} className={`px-3 py-1.5 rounded-lg flex items-center justify-center transition ${showRoute ? 'bg-[#FC4C02] text-white' : 'bg-zinc-100 text-zinc-500'}`}>
										<Navigation className='h-3.5 w-3.5' />
									</button>
								</div>
							</div>
						</>
					)}
				</aside>

				{/* MAP */}
				<div className={`flex-1 relative ${addMode && !tourActive ? 'map-add' : 'map-pan'}`}>
					<MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className='h-full w-full' zoomControl={false} preferCanvas>
						<TileLayer key={tileKey} url={TILES[tileKey]} />
						<ZoomControl position='bottomright' />
						<MapBridge flyRef={flyRef} centerRef={centerRef} />
						<ClickHandler cbRef={clickCbRef} />
						<FitBounds pins={pins} />
						{userLoc && (
							<>
								<Circle center={[userLoc.lat, userLoc.lng]} radius={Math.max(userLoc.accuracy, 15)} pathOptions={{ color: BLUE, fillColor: BLUE, fillOpacity: 0.12, weight: 1, opacity: 0.3 }} />
								<Marker position={[userLoc.lat, userLoc.lng]} icon={makeUserDotIcon()} zIndexOffset={1000} />
							</>
						)}
						{browseResults.map((r) => (
							<Marker key={r.id} position={[r.lat, r.lng]} icon={makePoiIcon(r.category, true)} zIndexOffset={600} eventHandlers={{ click: () => pickResult(r) }} />
						))}
						{previewPin && <Marker position={[previewPin.lat, previewPin.lng]} icon={makePoiIcon(previewPin.category)} zIndexOffset={900} />}
						{pins.map((pin, i) => (
							<Marker key={pin.id} position={[pin.lat, pin.lng]} icon={makeWaypointIcon(i + 1, pinColor(i, pins.length), tourActive && i === currentStop)} zIndexOffset={tourActive && i === currentStop ? 1100 : 800} />
						))}
						<RouteLayer route={route} show={showRoute} />
					</MapContainer>

					{/* Tour overlay mobile */}
					{tourActive && (
						<div className='lg:hidden absolute top-3 left-3 right-3 z-2000 bg-white rounded-2xl shadow-[0_4px_28px_rgba(0,0,0,.2)] overflow-hidden'>
							<div className='px-4 py-3 flex items-center gap-3'>
								<div className='h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-xl' style={{ background: catColor(pins[currentStop]?.category || '') + '22' }}>
									{catEmoji(pins[currentStop]?.category || '')}
								</div>
								<div className='flex-1 min-w-0'>
									<p className='text-[13px] font-black text-zinc-900 truncate'>{pins[currentStop]?.label}</p>
									<p className='text-[11px] text-zinc-400'>
										Stop {currentStop + 1} of {pins.length}
									</p>
								</div>
								<div className='shrink-0'>
									{currentStop < pins.length - 1 ? (
										<button onClick={nextStop} className='flex items-center gap-1 px-3 py-2 rounded-xl text-white text-[12px] font-bold' style={{ background: BRAND }}>
											Next <ChevronRight className='h-3.5 w-3.5' />
										</button>
									) : (
										<button onClick={endTour} className='px-3 py-2 rounded-xl bg-green-500 text-white text-[12px] font-bold'>
											Done! 🎉
										</button>
									)}
								</div>
							</div>
							<div className='h-1 bg-zinc-100'>
								<div className='h-full transition-all duration-500' style={{ width: `${((currentStop + 1) / pins.length) * 100}%`, background: BRAND }} />
							</div>
						</div>
					)}

					{addMode && !tourActive && <div className='lg:hidden absolute top-[72px] left-1/2 -translate-x-1/2 z-2000 bg-[#FC4C02] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none'>📍 Tap map to drop a pin</div>}

					<button onClick={locate} disabled={locating} className='hidden lg:flex absolute z-1500 right-3 bottom-[130px] h-10 w-10 items-center justify-center bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,.14)] hover:bg-zinc-50 active:scale-95 transition-all'>
						{locating ? <div className='h-4 w-4 border-2 border-zinc-200 border-t-[#4285f4] rounded-full animate-spin' /> : <LocateFixed style={{ width: 18, height: 18 }} className='text-zinc-600' />}
					</button>

					{!tourActive && (
						<div className='lg:hidden absolute z-1500 bottom-[84px] left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_4px_20px_rgba(0,0,0,.13)] border border-zinc-100 p-1.5'>
							<button
								onClick={() => {
									setAddMode((m) => !m)
									showToast(addMode ? 'Pan mode' : 'Tap map to pin')
								}}
								className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1 ${addMode ? 'bg-[#FC4C02] text-white' : 'bg-zinc-100 text-zinc-500'}`}>
								<Plus className='h-3 w-3' />
								{addMode ? 'Adding' : 'Add'}
							</button>
							<div className='w-px h-5 bg-zinc-200' />
							{(Object.keys(TILES) as Array<keyof typeof TILES>).map((k) => (
								<button key={k} onClick={() => setTileKey(k)} className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition capitalize ${tileKey === k ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>
									{k}
								</button>
							))}
							<div className='w-px h-5 bg-zinc-200' />
							<button onClick={() => setShowRoute((r) => !r)} className={`px-2 py-1.5 rounded-lg transition flex items-center ${showRoute ? 'bg-[#FC4C02] text-white' : 'text-zinc-500'}`}>
								<Navigation className='h-3.5 w-3.5' />
							</button>
							{pins.length > 0 && (
								<>
									<div className='w-px h-5 bg-zinc-200' />
									<button onClick={clearAll} className='px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition'>
										<Trash2 className='h-3.5 w-3.5' />
									</button>
								</>
							)}
						</div>
					)}
					{!tourActive && pins.length >= 2 && (
						<button onClick={startTour} className='lg:hidden absolute z-1500 bottom-[84px] right-3 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-[13px] font-black shadow-[0_4px_20px_rgba(252,76,2,.4)] active:scale-95 transition' style={{ background: BRAND }}>
							<Play className='h-4 w-4 fill-white' />
							Start Tour
						</button>
					)}
				</div>

				{/* MOBILE BOTTOM SHEET */}
				{!tourActive && (
					<div className='lg:hidden absolute bottom-0 left-0 right-0 z-2000 bg-white rounded-t-2xl border-t border-zinc-100 shadow-[0_-4px_32px_rgba(0,0,0,.10)] transition-transform duration-300 ease-out' style={{ maxHeight: '65vh', transform: panelOpen ? 'translateY(0)' : 'translateY(calc(100% - 74px))' }}>
						<button className='w-full focus:outline-none select-none' onClick={() => setPanelOpen((o) => !o)}>
							<div className='mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-zinc-200' />
							<div className='px-4 pb-3 flex items-center gap-3'>
								<div className='h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-xl' style={{ background: '#fff3ee' }}>
									🗺️
								</div>
								<div className='flex-1 text-left min-w-0'>
									<p className='text-[13px] font-black text-zinc-900'>{pins.length === 0 ? 'No stops yet' : `${pins.length} stop${pins.length !== 1 ? 's' : ''}`}</p>
									{pins.length >= 2 && !routeLoading && (
										<p className='text-[11px] text-zinc-400 font-medium'>
											{fmt.dist(route.distanceM)} · {fmt.time(route.durationS)}
										</p>
									)}
									{routeLoading && <p className='text-[11px] text-[#FC4C02] animate-pulse font-medium'>Calculating…</p>}
									{pins.length < 2 && !routeLoading && <p className='text-[11px] text-zinc-400'>Search above or tap map</p>}
								</div>
								<div className='flex items-center gap-2 shrink-0'>
									{pins.length > 0 && (
										<button
											onClick={(e) => {
												e.stopPropagation()
												clearAll()
											}}
											className='h-8 w-8 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-400'>
											<Trash2 className='h-3.5 w-3.5' />
										</button>
									)}
									{panelOpen ? <ChevronDown className='h-4 w-4 text-zinc-400' /> : <ChevronUp className='h-4 w-4 text-zinc-400' />}
								</div>
							</div>
						</button>
						<div className='overflow-y-auto px-2 pb-10' style={{ maxHeight: 'calc(65vh - 84px)' }}>
							<StopList pins={pins} editId={editId} setEditId={setEditId} rename={rename} removePin={removePin} routeLegs={route.legs} routeLoading={routeLoading} routeFailed={route.failed} />
						</div>
					</div>
				)}
			</div>
		</MapLayout>
	)
}

const StopList = memo(function StopList({ pins, editId, setEditId, rename, removePin, routeLegs, routeLoading, routeFailed }: { pins: Pin[]; editId: number | null; setEditId: (id: number | null) => void; rename: (id: number, label: string) => void; removePin: (id: number) => void; routeLegs: number[]; routeLoading: boolean; routeFailed: boolean }) {
	if (pins.length === 0) return null
	return (
		<div>
			{pins.map((pin, i) => (
				<div key={pin.id}>
					<div className='group flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors'>
						<div className='h-8 w-8 rounded-full flex items-center justify-center text-lg shrink-0' style={{ background: catColor(pin.category || '') + '22' }}>
							{catEmoji(pin.category || '')}
						</div>
						<div className='flex-1 min-w-0'>
							{editId === pin.id ? (
								<input autoFocus value={pin.label} onChange={(e) => rename(pin.id, e.target.value)} onBlur={() => setEditId(null)} onKeyDown={(e) => e.key === 'Enter' && setEditId(null)} className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[13px] text-zinc-900 outline-none focus:border-[#FC4C02] focus:ring-2 focus:ring-orange-100' />
							) : (
								<>
									<button onClick={() => setEditId(pin.id)} className='block w-full text-left text-[13px] font-semibold text-zinc-900 truncate'>
										{pin.label}
									</button>
									<span className='text-[10px] text-zinc-400 truncate block'>{pin.subtitle || `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`}</span>
								</>
							)}
						</div>
						<button onClick={() => removePin(pin.id)} className='h-7 w-7 flex items-center justify-center rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100'>
							<X className='h-3.5 w-3.5' />
						</button>
					</div>
					{i < pins.length - 1 && (
						<div className='ml-5 pl-4 flex items-center gap-1.5 py-0.5 border-l-2 border-dashed border-zinc-200'>
							{routeLoading ? (
								<span className='text-[10px] text-zinc-400 animate-pulse py-1'>routing…</span>
							) : routeLegs[i] ? (
								<span className={`text-[10px] font-bold py-1 flex items-center gap-1 ${routeFailed ? 'text-amber-500' : 'text-[#FC4C02]'}`}>
									<Navigation className='h-2.5 w-2.5' />
									{fmt.dist(routeLegs[i])}
								</span>
							) : null}
						</div>
					)}
				</div>
			))}
		</div>
	)
})
