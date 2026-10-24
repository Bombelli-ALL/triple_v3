import { useEffect, useMemo, useState } from 'react'
import { MapPin, Search, Star, Clock3, ChevronRight, X, Compass, Loader2, RefreshCcw, ExternalLink } from 'lucide-react'

type SpotItem = {
  id: string
  name: string
  address: string
  rating?: number
  userRatingCount?: number
  types?: string[]
  lat: number
  lng: number
  photoUrl?: string
  openNow?: boolean
  editorialSummary?: string
  primaryType?: string
}

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

const DEFAULT_QUERY = 'cafe fes'

const QUICK_SEARCHES = [
  'cafe fes',
  'restaurant marrakech',
  'hotel tangier',
  'riad chefchaouen',
  'beach agadir',
  'attractions rabat',
]

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80'

function getPhotoUrl(photoName?: string) {
  if (!photoName || !GOOGLE_API_KEY) return undefined
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&maxWidthPx=1400&key=${GOOGLE_API_KEY}`
}

function formatTypeLabel(value?: string) {
  if (!value) return 'Spot'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function getPrimaryBadge(item: SpotItem) {
  return formatTypeLabel(item.primaryType || item.types?.[0] || 'Spot')
}

function getFallbackByType(type?: string) {
  const normalized = (type || '').toLowerCase()

  if (normalized.includes('cafe') || normalized.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80'
  }
  if (normalized.includes('restaurant') || normalized.includes('food')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80'
  }
  if (normalized.includes('hotel') || normalized.includes('lodging')) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80'
  }
  if (normalized.includes('beach')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80'
  }
  if (normalized.includes('park') || normalized.includes('nature')) {
    return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80'
  }
  if (normalized.includes('museum') || normalized.includes('tourist') || normalized.includes('attraction')) {
    return 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=80'
  }

  return FALLBACK_IMAGE
}

async function searchPlacesText(query: string): Promise<SpotItem[]> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY in your .env')
  }

  const trimmed = query.trim()
  if (!trimmed) return []

  const body = {
    textQuery: trimmed,
    pageSize: 18,
    languageCode: 'en',
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType,places.photos,places.currentOpeningHours.openNow,places.editorialSummary',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || 'Failed to fetch places')
  }

  const data = await res.json()
  const places = Array.isArray(data.places) ? data.places : []

  return places
    .filter((p: any) => p?.id && p?.displayName?.text && p?.location)
    .map((p: any) => ({
      id: p.id,
      name: p.displayName?.text || 'Unknown place',
      address: p.formattedAddress || '',
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      types: p.types || [],
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      photoUrl: getPhotoUrl(p.photos?.[0]?.name),
      openNow: p.currentOpeningHours?.openNow,
      editorialSummary: p.editorialSummary?.text,
      primaryType: p.primaryType,
    }))
}

function SpotCard({
  item,
  onClick,
}: {
  item: SpotItem
  onClick: () => void
}) {
  const image = item.photoUrl || getFallbackByType(item.primaryType || item.types?.[0])

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
    >
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />

        <div className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
          {getPrimaryBadge(item)}
        </div>

        {typeof item.openNow === 'boolean' ? (
          <div
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur ${
              item.openNow
                ? 'bg-emerald-500/90 text-white'
                : 'bg-slate-900/80 text-white'
            }`}
          >
            {item.openNow ? 'Open now' : 'Closed'}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-900 sm:text-base">
              {item.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {item.address}
            </p>
          </div>

          <div className="rounded-full bg-slate-50 p-2 text-slate-400 transition group-hover:bg-orange-50 group-hover:text-orange-500">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {typeof item.rating === 'number' ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
              <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
              <span className="font-semibold">{item.rating.toFixed(1)}</span>
              {item.userRatingCount ? (
                <span className="text-orange-500/80">({item.userRatingCount})</span>
              ) : null}
            </div>
          ) : null}

          <div className="inline-flex items-center gap-1.5 text-slate-500">
            <MapPin className="h-4 w-4" />
            <span>View details</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function SpotDetailsSheet({
  item,
  onClose,
}: {
  item: SpotItem | null
  onClose: () => void
}) {
  if (!item) return null

  const image = item.photoUrl || getFallbackByType(item.primaryType || item.types?.[0])

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Close details"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] w-full max-w-2xl animate-[slideUp_.28s_ease-out] overflow-hidden rounded-t-[32px] bg-white shadow-2xl">
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-200" />

        <div className="relative mt-3 h-64 w-full overflow-hidden bg-slate-100 sm:h-72">
          <img src={image} alt={item.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(88vh-19rem)] overflow-y-auto px-5 pb-8 pt-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                {item.name}
              </h2>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-500">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <span>{item.address}</span>
              </p>
            </div>

            {typeof item.rating === 'number' ? (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                <div className="flex items-center gap-2 text-orange-600">
                  <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                  <span className="text-sm font-semibold">Rating</span>
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {item.rating.toFixed(1)}
                </div>
                {item.userRatingCount ? (
                  <div className="text-xs text-slate-500">{item.userRatingCount} reviews</div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {getPrimaryBadge(item)}
            </span>

            {typeof item.openNow === 'boolean' ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.openNow
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                }`}
              >
                {item.openNow ? 'Open now' : 'Closed now'}
              </span>
            ) : null}
          </div>

          {item.editorialSummary ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Compass className="h-4 w-4 text-orange-500" />
                About this spot
              </div>
              <p className="text-sm leading-6 text-slate-600">{item.editorialSummary}</p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${item.lat},${item.lng}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Maps
            </a>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              <Clock3 className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0.96;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default function Spots() {
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [submittedQuery, setSubmittedQuery] = useState(DEFAULT_QUERY)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<SpotItem[]>([])
  const [selectedItem, setSelectedItem] = useState<SpotItem | null>(null)

  async function fetchSpots(searchValue: string) {
    const finalQuery = searchValue.trim()
    if (!finalQuery) return

    try {
      setLoading(true)
      setError(null)

      const result = await searchPlacesText(finalQuery)
      setItems(result)
      setSubmittedQuery(finalQuery)
      localStorage.setItem('spots-last-query', finalQuery)
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not load spots. Check your Google Places API setup and key restrictions.'
      )
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedQuery = localStorage.getItem('spots-last-query')
    const initialQuery = savedQuery?.trim() ? savedQuery : DEFAULT_QUERY
    setQuery(initialQuery)
    setSubmittedQuery(initialQuery)
    fetchSpots(initialQuery)
  }, [])

  const resultTitle = useMemo(() => {
    return submittedQuery.trim() || 'your search'
  }, [submittedQuery])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed_0%,#ffffff_34%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 shadow-[0_14px_45px_rgba(15,23,42,0.07)] backdrop-blur">
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                  <Compass className="h-3.5 w-3.5" />
                  Spot Search
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Search places your way
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Type what you want directly, like <span className="font-medium text-slate-700">cafe fes</span>,{' '}
                  <span className="font-medium text-slate-700">hotel tanger</span>, or{' '}
                  <span className="font-medium text-slate-700">restaurant marrakech</span>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchSpots(query)}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                fetchSpots(query)
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search like: cafe fes, hotel tanger, restaurant rabat..."
                className="h-14 w-full rounded-[22px] border border-slate-200 bg-white pl-12 pr-32 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[18px] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setQuery(item)
                    fetchSpots(item)
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[42vh] items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              Loading places...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            <div className="text-base font-semibold">Could not fetch places</div>
            <p className="mt-2 text-sm leading-6">{error}</p>
            <p className="mt-2 text-sm leading-6">
              Make sure your key is inside <span className="font-semibold">VITE_GOOGLE_MAPS_API_KEY</span> and that
              Places API is enabled in Google Cloud.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No places found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Try another search like cafe fes, hotel tanger, or beach agadir.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {items.length} place{items.length > 1 ? 's' : ''} found
                </h2>
                <p className="text-sm text-slate-500">
                  Results for <span className="font-medium text-slate-700">{resultTitle}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <SpotCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <SpotDetailsSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}