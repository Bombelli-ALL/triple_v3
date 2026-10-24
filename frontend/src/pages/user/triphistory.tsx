import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, Loader2, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { deleteMyTrip, listMyTrips, listPublicTrips, type PublicTrip } from '@/lib/travelApi'
import { useAuthStore } from '@/stores/authStore'

type TripCard = {
  id: string
  title: string
  summary: string
  city: string
  durationDays: number
  spots: number
  image: string
  createdAt?: string
}

const TRIP_PLAN_PATH = '/user/trip-plan'
const IMAGE_FALLBACKS = ['/assets/places/m3.jpeg', '/assets/places/m4.jpeg', '/assets/places/m5.jpeg', '/assets/places/m6.jpeg', '/assets/places/m7.jpeg']

function fallbackImage(id: string) {
  const hash = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return IMAGE_FALLBACKS[hash % IMAGE_FALLBACKS.length]
}

function applyImageFallback(event: SyntheticEvent<HTMLImageElement>, id: string) {
  const img = event.currentTarget
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = fallbackImage(id)
}

type StoredPlan = { durationDays?: number; coverImage?: string; days?: Array<{ stops?: unknown[] }> }

function toTripCard(trip: PublicTrip): TripCard {
  const plan = (trip.plan ?? null) as StoredPlan | null
  const items = trip.items ?? []
  const itemDays = new Set(items.map((item) => item.day ?? 1)).size
  const dateDays =
    trip.startDate && trip.endDate
      ? Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000) + 1
      : 0
  const planStops = plan?.days?.reduce((sum, day) => sum + (day.stops?.length ?? 0), 0) ?? 0

  return {
    id: trip.id,
    title: trip.title,
    summary: trip.description?.trim() || '',
    city: trip.city?.name ?? 'Morocco',
    durationDays: Math.max(1, plan?.durationDays ?? (itemDays || dateDays || 1)),
    spots: Math.max(items.length, planStops),
    image: plan?.coverImage || trip.city?.coverImage || fallbackImage(trip.id),
    createdAt: trip.createdAt,
  }
}

function matchesQuery(trip: TripCard, query: string) {
  if (!query) return true
  return [trip.title, trip.city, trip.summary].some((value) => value.toLowerCase().includes(query))
}

function TripCardLink({ trip, tone, onDelete, deleting }: { trip: TripCard; tone: 'mine' | 'community'; onDelete?: () => void; deleting?: boolean }) {
  const nights = Math.max(0, trip.durationDays - 1)
  return (
    <div className='relative min-w-0'>
      <Link
        to={`${TRIP_PLAN_PATH}?trip=${encodeURIComponent(trip.id)}`}
        className={
          tone === 'mine'
            ? 'group flex items-center gap-4 overflow-hidden rounded-[20px] border border-orange-100 bg-[#FFF7F2] p-3 pr-12 transition-all duration-200 hover:border-orange-200 hover:bg-[#FFF2EA] hover:shadow-md lg:p-4 lg:pr-12'
            : 'group flex items-center gap-4 overflow-hidden rounded-[20px] bg-[#EEF0FA] p-3 transition-all duration-200 hover:bg-[#E5E8F7] hover:shadow-md lg:p-4'
        }
      >
        <div className='h-[90px] w-[100px] shrink-0 overflow-hidden rounded-[14px] bg-zinc-200 lg:h-[100px] lg:w-[115px]'>
          <img
            src={trip.image}
            alt={trip.title}
            onError={(event) => applyImageFallback(event, trip.id)}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
        </div>

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className={`truncate text-[16px] font-bold leading-tight lg:text-[18px] ${tone === 'mine' ? 'text-zinc-900' : 'text-[#1A3BCC]'}`}>
                {trip.title}
              </p>
              {trip.summary && <p className='mt-1 line-clamp-2 text-[12px] text-zinc-500'>{trip.summary}</p>}
            </div>
            {tone === 'community' && (
              <ArrowRight className='mt-1 h-4 w-4 shrink-0 text-[#1A3BCC]/60 transition-transform duration-200 group-hover:translate-x-1' />
            )}
          </div>

          <div className='mt-3 flex flex-col gap-1'>
            <span className='flex items-center gap-1.5 text-[13px] text-zinc-500'>
              <Clock3 className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
              {trip.durationDays} {trip.durationDays === 1 ? 'Day' : 'Days'} {nights} {nights === 1 ? 'Night' : 'Nights'}
            </span>
            <span className='flex items-center gap-1.5 text-[13px] text-zinc-500'>
              <MapPin className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
              {trip.spots} Stops · {trip.city}
            </span>
          </div>
        </div>
      </Link>

      {onDelete && (
        <button
          type='button'
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Delete ${trip.title}`}
          className='absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm transition-colors hover:text-red-500 disabled:opacity-60'
        >
          {deleting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
        </button>
      )}
    </div>
  )
}

export default function UserHistory() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [myTrips, setMyTrips] = useState<TripCard[]>([])
  const [communityTrips, setCommunityTrips] = useState<TripCard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const [mine, community] = await Promise.all([listMyTrips(), listPublicTrips({ limit: 50 })])
        if (cancelled) return
        const myIds = new Set(mine.data.map((trip) => trip.id))
        setMyTrips(mine.data.map(toTripCard))
        setCommunityTrips(community.data.filter((trip) => !myIds.has(trip.id)).map(toTripCard))
      } catch (error) {
        console.error('Loading trips failed:', error)
        if (!cancelled) setLoadError('Could not load trips. Please refresh the page.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const query = search.trim().toLowerCase()
  const filteredMine = useMemo(() => myTrips.filter((trip) => matchesQuery(trip, query)), [myTrips, query])
  const filteredCommunity = useMemo(() => communityTrips.filter((trip) => matchesQuery(trip, query)), [communityTrips, query])

  const handleDelete = async (trip: TripCard) => {
    if (deletingId || !window.confirm(`Delete "${trip.title}"? This cannot be undone.`)) return
    try {
      setDeletingId(trip.id)
      await deleteMyTrip(trip.id)
      setMyTrips((prev) => prev.filter((entry) => entry.id !== trip.id))
      toast.success('Trip deleted')
    } catch (error) {
      console.error('Deleting trip failed:', error)
      toast.error('Could not delete this trip.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className='min-h-screen bg-white pb-10 md:pb-0'>
      <div className='mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 lg:px-12'>
        <div className='mb-8 flex h-12 w-full items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 shadow-sm lg:max-w-[520px]'>
          <Search className='h-4 w-4 shrink-0 text-zinc-400' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search trips or cities...'
            className='h-full w-full bg-transparent text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400'
          />
        </div>

        {loadError && <p className='mb-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600'>{loadError}</p>}

        <section className='mb-10'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <p className='text-[17px] font-medium text-zinc-900'>My trips</p>
              <p className='mt-1 text-[13px] text-zinc-400'>Trips you planned and saved to your account.</p>
            </div>
            <Link
              to={TRIP_PLAN_PATH}
              className='flex shrink-0 items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-orange-600'
            >
              <Plus className='h-4 w-4' /> Plan a trip
            </Link>
          </div>

          {loading ? (
            <div className='flex items-center gap-2 py-8 text-[14px] text-zinc-400'>
              <Loader2 className='h-4 w-4 animate-spin' /> Loading your trips...
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4'>
              {filteredMine.map((trip) => (
                <TripCardLink
                  key={trip.id}
                  trip={trip}
                  tone='mine'
                  deleting={deletingId === trip.id}
                  onDelete={() => void handleDelete(trip)}
                />
              ))}

              {filteredMine.length === 0 && (
                <p className='py-8 text-[14px] text-zinc-400'>
                  {query ? 'No trips match your search.' : "You haven't saved any trips yet. Plan one and press “Save trip”."}
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <p className='mb-1 text-[17px] font-medium text-zinc-900'>Community trips</p>
          <p className='mb-4 text-[13px] text-zinc-400'>Real trips planned by other travelers.</p>

          {loading ? (
            <div className='flex items-center gap-2 py-8 text-[14px] text-zinc-400'>
              <Loader2 className='h-4 w-4 animate-spin' /> Loading trips...
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4'>
              {filteredCommunity.map((trip) => (
                <TripCardLink key={trip.id} trip={trip} tone='community' />
              ))}

              {filteredCommunity.length === 0 && (
                <p className='py-8 text-[14px] text-zinc-400'>No community trips found.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
