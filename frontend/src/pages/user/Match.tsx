import { useEffect, useRef, useState } from 'react'
import { X, AlertCircle, Search, MapPin, ArrowRight, ArrowLeft } from 'lucide-react'
import { trackGamificationEvent } from '@/lib/gamification'
import SwipeDeck from '@/features/match/components/SwipeDeck'
import MatchSummary from '@/features/match/components/MatchSummary'
import { MOCK_TRIP_SWIPE_DATA } from '@/data/mockTripSwipeData'
import type { MatchSessionResult, TripSwipeItem, BudgetTier, TripType } from '@/types/match'

const SEARCH_KEY = import.meta.env.VITE_GOOGLE_PLACES_SEARCH_KEY as string

const PLACES_BASE =
  import.meta.env.DEV
    ? '/google-places/maps/api/place/textsearch/json'
    : 'https://maps.googleapis.com/maps/api/place/textsearch/json'

const PHOTO_BASE = 'https://maps.googleapis.com/maps/api/place/photo'

const DEFAULT_LAT = 33.5731
const DEFAULT_LNG = -7.5898

// Diverse, culturally-inclusive placeholders
const PLACEHOLDERS = [
  'halal restaurant near me...',
  'vegetarian café with wifi...',
  'rooftop bar at sunset...',
  'Muslim-friendly brunch spot...',
  'best sushi in town...',
  'quiet café to work from...',
  'vegan food spot...',
  'hidden gem restaurant...',
  'family-friendly park café...',
  'cozy bookshop café...',
]

// Quick-pick suggestion examples shown below the input
const SUGGESTIONS = [
  { label: 'Halal restaurant', query: 'halal restaurant' },
  { label: 'Vegan café', query: 'vegan café' },
  { label: 'Cozy coffee shop', query: 'cozy coffee shop' },
  { label: 'Sushi place', query: 'sushi restaurant' },
  { label: 'Vegetarian food', query: 'vegetarian restaurant' },
  { label: 'Pizza spot', query: 'pizza restaurant' },
  { label: 'Beachside café', query: 'beachside café' },
  { label: 'Café to study', query: 'quiet café good wifi' },
]

interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  user_ratings_total?: number
  types?: string[]
  photos?: { photo_reference: string }[]
  geometry?: { location: { lat: number; lng: number } }
  opening_hours?: { open_now?: boolean }
  price_level?: number
}

function mapGooglePlaceToSwipeItem(place: GooglePlace): TripSwipeItem {
  const addressParts = place.formatted_address?.split(', ') ?? []
  const country = addressParts.at(-1) ?? 'Unknown'
  const city = addressParts.at(-2) ?? 'Local'
  const priceLevel = place.price_level ?? 0
  const budget: BudgetTier =
    priceLevel <= 1 ? 'budget' :
    priceLevel === 2 ? 'mid-range' :
    priceLevel === 3 ? 'premium' : 'luxury'
  const types = place.types ?? []
  let tripType: TripType = 'city-break'
  if (types.some((t: string) => ['restaurant', 'cafe', 'food', 'bar'].includes(t))) tripType = 'food'
  else if (types.some((t: string) => ['museum', 'art_gallery', 'church', 'place_of_worship'].includes(t))) tripType = 'culture'
  else if (types.some((t: string) => ['park', 'zoo', 'aquarium', 'natural_feature'].includes(t))) tripType = 'nature'
  else if (types.includes('beach')) tripType = 'beach'
  const photoRef = place.photos?.[0]?.photo_reference
  const image = photoRef
    ? `${PHOTO_BASE}?maxwidth=800&photo_reference=${photoRef}&key=${SEARCH_KEY}`
    : `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800`
  const cleanTags = (place.types ?? [])
    .filter((t: string) => !['point_of_interest', 'establishment', 'food'].includes(t))
    .slice(0, 3)
    .map((t: string) => t.replace(/_/g, ' '))
  return {
    id: place.place_id,
    title: place.name,
    city,
    country,
    image,
    description: cleanTags.join(' · ') || place.formatted_address || '',
    rating: place.rating ?? 0,
    budget,
    wifi: true,
    durationDays: 1,
    tripType,
    vibes: cleanTags,
    tags: cleanTags,
  } as TripSwipeItem
}

async function fetchPlaces(query: string, lat: number, lng: number): Promise<TripSwipeItem[]> {
  const url = new URL(PLACES_BASE, window.location.origin)
  url.searchParams.set('query', query)
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', '5000')
  url.searchParams.set('key', SEARCH_KEY)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.status === 'ZERO_RESULTS') return []
  if (data.status !== 'OK') throw new Error(`Google: ${data.status}`)
  return (data.results as GooglePlace[]).slice(0, 10).map(mapGooglePlaceToSwipeItem)
}

function useAnimatedPlaceholder(active: boolean) {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    if (active) return
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex((current) => (current + 1) % PLACEHOLDERS.length)
        setFade(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [active])

  return { placeholder: PLACEHOLDERS[index], fade }
}

export default function UserMatch() {
  const [inputValue, setInputValue] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [result, setResult] = useState<MatchSessionResult | null>(null)
  const [restartSeed, setRestartSeed] = useState(0)
  const [trips, setTrips] = useState<TripSwipeItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const { placeholder, fade } = useAnimatedPlaceholder(!!inputValue)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null)
    )
  }, [])

  const handleSubmit = async (overrideQuery?: string) => {
    const text = (overrideQuery ?? inputValue).trim()
    if (!text || isLoading) return

    if (overrideQuery) setInputValue(overrideQuery)
    setIsLoading(true)
    setSearchError(null)
    setHasSearched(true)

    const lat = userLocation?.lat ?? DEFAULT_LAT
    const lng = userLocation?.lng ?? DEFAULT_LNG

    try {
      setAppliedSearch(text)
      const places = await fetchPlaces(text, lat, lng)
      if (places.length === 0) {
        setSearchError(`No places found for "${text}". Showing popular spots instead.`)
        setTrips(MOCK_TRIP_SWIPE_DATA)
      } else {
        setTrips(places)
      }
    } catch {
      setSearchError('Search failed. Showing default recommendations.')
      setTrips(MOCK_TRIP_SWIPE_DATA)
    } finally {
      setIsLoading(false)
      setRestartSeed((s) => s + 1)
    }
  }

  const goBack = () => {
    setAppliedSearch('')
    setInputValue('')
    setSearchError(null)
    setResult(null)
    setTrips([])
    setHasSearched(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const restart = () => {
    setResult(null)
    setRestartSeed((s) => s + 1)
  }

  // ── 1. IDLE STATE (Hero Search) ───────────────────────────────────────────
  if (!hasSearched) {
    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-y-auto overflow-x-hidden bg-white">
        <div className="flex flex-col items-center justify-center flex-1 px-4 sm:px-6 py-10 sm:py-16">
          <div className="w-full max-w-[600px] flex flex-col items-center gap-8">

            {/* Heading */}
            <div className="text-center space-y-2 px-2">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-none">
                What are you looking for?
              </h2>
              <p className="text-sm sm:text-base text-gray-400 font-medium">
                Type anything — halal spots, vegan cafés, sushi, rooftops...
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full relative group">
              <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-300" />
              </div>

              {/* Animated placeholder */}
              {!inputValue && (
                <div
                  className={`absolute inset-y-0 left-11 sm:left-[52px] right-14 flex items-center pointer-events-none transition-opacity duration-400 ${fade ? 'opacity-100' : 'opacity-0'}`}
                >
                  <span className="text-base text-gray-400 truncate">{placeholder}</span>
                </div>
              )}

              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full h-14 sm:h-16 pl-11 sm:pl-[52px] pr-14 bg-white border border-gray-200 rounded-2xl text-base text-gray-900 shadow-sm focus:shadow-md focus:border-gray-300 focus:outline-none transition-all duration-300 placeholder-transparent"
                placeholder="Search..."
                autoComplete="off"
              />

              <div className="absolute inset-y-0 right-2 flex items-center">
                <button
                  onClick={() => handleSubmit()}
                  disabled={!inputValue.trim()}
                  className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-900 text-white hover:bg-orange-500 transition-all duration-200 disabled:opacity-25 disabled:hover:bg-gray-900 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Diverse suggestion chips — scrollable rows, no overflow */}
            <div className="w-full flex flex-col gap-2">
              <p className="text-xs text-gray-400 font-medium text-center tracking-wide uppercase">Quick picks</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.query}
                    onClick={() => handleSubmit(s.query)}
                    className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ── 2. LOADING STATE ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-white items-center justify-center gap-6 px-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-orange-50 rounded-full animate-ping opacity-75" />
          <div className="absolute w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full animate-pulse" />
          <MapPin className="w-7 h-7 text-orange-500 relative z-10" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-lg font-bold text-gray-900 tracking-tight">Finding matches...</p>
          <p className="text-xs sm:text-sm text-gray-400">
            Searching for "{appliedSearch || inputValue}"
          </p>
        </div>
      </div>
    )
  }

  // ── 3. ACTIVE STATE (Swipe Deck) ──────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full overflow-hidden bg-white">

      {/* Header */}
      <header className="flex items-center gap-3 px-3 sm:px-5 py-3 bg-white border-b border-gray-100 z-10 shrink-0 min-w-0">
        <button
          onClick={goBack}
          aria-label="Back to search"
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-none shrink-0">
          Match
        </h1>

        {appliedSearch && (
          <span className="text-xs sm:text-sm font-medium text-gray-400 truncate min-w-0 flex-1">
            "{appliedSearch}"
          </span>
        )}

        {/* Inline search refinement */}
        <button
          onClick={goBack}
          className="ml-auto shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-orange-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-orange-50"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refine</span>
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

        {/* Error Toast */}
        {searchError && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-20">
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 text-red-800 text-xs sm:text-sm font-medium border border-red-100 rounded-2xl shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="leading-snug">{searchError}</p>
              <button
                onClick={() => setSearchError(null)}
                className="ml-auto shrink-0 text-red-400 hover:text-red-700 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {result ? (
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="mx-auto max-w-4xl">
              <MatchSummary result={result} onRestart={restart} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative w-full h-full min-h-0 p-2 sm:p-4">
            <SwipeDeck
              key={restartSeed}
              items={trips}
              onComplete={setResult}
              onDecision={(direction) => {
                if (direction !== 'right') return
                void trackGamificationEvent('LOCAL_SPOT_MATCHED').catch(() => {})
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}