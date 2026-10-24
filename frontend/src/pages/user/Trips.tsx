import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Filter,
  Plane,
  Search,
  Train,
  Users,
  X,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────── */
interface Transport {
  id: string
  type: string
  route: string
  from: string
  to: string
  departure: string
  arrival: string
  date: string
  status: 'confirmed' | 'pending' | 'cancelled'
  price: string
  passengers: number
  duration: string
  stationFrom?: string
  stationTo?: string
}

interface Flight {
  id: string
  airline: string
  flightNumber: string
  from: string
  fromCode: string
  to: string
  toCode: string
  departure: string
  arrival: string
  date: string
  duration: string
  stops: number
  price: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

/* ─────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────── */
const transports: Transport[] = [
  {
    id: '1', type: 'Al Boraq', route: 'Tangier - Casablanca',
    from: 'Tangier', to: 'Casablanca', departure: '08:00', arrival: '10:10',
    date: '2026-03-30', status: 'confirmed', price: '180 MAD', passengers: 1,
    duration: '2h 10m', stationFrom: 'Tanger Ville', stationTo: 'Casa Voyageurs',
  },
  {
    id: '2', type: 'Al Boraq', route: 'Tangier - Rabat',
    from: 'Tangier', to: 'Rabat', departure: '09:15', arrival: '10:35',
    date: '2026-03-30', status: 'confirmed', price: '115 MAD', passengers: 1,
    duration: '1h 20m', stationFrom: 'Tanger Ville', stationTo: 'Rabat Agdal',
  },
  {
    id: '3', type: 'ONCF Train', route: 'Casablanca - Marrakech',
    from: 'Casablanca', to: 'Marrakech', departure: '13:40', arrival: '16:20',
    date: '2026-03-28', status: 'pending', price: '110 MAD', passengers: 2,
    duration: '2h 40m', stationFrom: 'Casa Voyageurs', stationTo: 'Marrakech',
  },
  {
    id: '4', type: 'ONCF Train', route: 'Fes - Meknes',
    from: 'Fes', to: 'Meknes', departure: '09:20', arrival: '10:00',
    date: '2026-03-29', status: 'confirmed', price: '35 MAD', passengers: 1,
    duration: '40m', stationFrom: 'Fès', stationTo: 'Meknès',
  },
  {
    id: '5', type: 'ONCF Train', route: 'Fes - Rabat',
    from: 'Fes', to: 'Rabat', departure: '07:50', arrival: '10:20',
    date: '2026-03-28', status: 'confirmed', price: '120 MAD', passengers: 1,
    duration: '2h 30m', stationFrom: 'Fès', stationTo: 'Rabat Agdal',
  },
  {
    id: '6', type: 'ONCF Train', route: 'Rabat - Casablanca',
    from: 'Rabat', to: 'Casablanca', departure: '11:00', arrival: '12:05',
    date: '2026-03-28', status: 'confirmed', price: '60 MAD', passengers: 1,
    duration: '1h 05m', stationFrom: 'Rabat Ville', stationTo: 'Casa Port',
  },
  {
    id: '7', type: 'ONCF Train', route: 'Marrakech - Casablanca',
    from: 'Marrakech', to: 'Casablanca', departure: '18:00', arrival: '20:40',
    date: '2026-03-30', status: 'cancelled', price: '110 MAD', passengers: 1,
    duration: '2h 40m', stationFrom: 'Marrakech', stationTo: 'Casa Voyageurs',
  },
  {
    id: '8', type: 'ONCF Train', route: 'Kenitra - Tangier',
    from: 'Kenitra', to: 'Tangier', departure: '15:10', arrival: '16:35',
    date: '2026-03-31', status: 'confirmed', price: '95 MAD', passengers: 1,
    duration: '1h 25m', stationFrom: 'Kénitra', stationTo: 'Tanger Ville',
  },
]

const flights: Flight[] = [
  {
    id: 'f1', airline: 'Air Arabia', flightNumber: 'MAC 301',
    from: 'Casablanca', fromCode: 'CMN', to: 'Paris', toCode: 'CDG',
    departure: '06:30', arrival: '11:15', date: '2026-04-10',
    duration: '3h 45m', stops: 0, price: '$342', status: 'confirmed',
  },
  {
    id: 'f2', airline: 'Royal Air Maroc', flightNumber: 'AT 702',
    from: 'Casablanca', fromCode: 'CMN', to: 'Dubai', toCode: 'DXB',
    departure: '23:55', arrival: '08:10', date: '2026-04-15',
    duration: '7h 15m', stops: 0, price: '$610', status: 'pending',
  },
  {
    id: 'f3', airline: 'Ryanair', flightNumber: 'FR 1234',
    from: 'Marrakech', fromCode: 'RAK', to: 'Madrid', toCode: 'MAD',
    departure: '14:20', arrival: '17:55', date: '2026-04-20',
    duration: '2h 35m', stops: 0, price: '$89', status: 'confirmed',
  },
]

/* ─────────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────────── */
function Toast({ open, message, onClose }: { open: boolean; message: string; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, 2800)
    return () => clearTimeout(t)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 w-[calc(100%-32px)] max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl bg-zinc-950 px-4 py-3 shadow-2xl ring-1 ring-white/10">
        <AlertCircle className="h-3.5 w-3.5 text-orange-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white">Coming soon</p>
          <p className="text-[10px] text-zinc-400 truncate">{message}</p>
        </div>
        <button onClick={onClose} className="shrink-0 text-zinc-500 hover:text-zinc-300 transition">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
        <Icon className="h-4 w-4 text-zinc-400" />
      </div>
      <p className="text-xs font-semibold text-zinc-600">No {label} found</p>
      <p className="mt-0.5 text-[11px] text-zinc-400">Try a different keyword</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   TRANSPORT CARD
───────────────────────────────────────────────────────────────── */
function TransportCard({ transport, onBook }: { transport: Transport; onBook: () => void }) {
  const isAlBoraq = transport.type === 'Al Boraq'
  const isCancelled = transport.status === 'cancelled'
  const isPending = transport.status === 'pending'

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-sm ${
        isCancelled ? 'opacity-55' : ''
      }`}
    >
      <div className="px-4 py-3">
        {/* Row 1 */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${isAlBoraq ? 'text-orange-500' : 'text-zinc-400'}`}>
              {transport.type}
            </span>
            {isPending && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200">
                Pending
              </span>
            )}
            {isCancelled && (
              <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-rose-500 ring-1 ring-rose-200">
                Cancelled
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-zinc-900">{transport.price}</span>
            {!isCancelled && (
              <button
                onClick={onBook}
                className="rounded-lg bg-zinc-950 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange-500 active:scale-95"
              >
                Book
              </button>
            )}
          </div>
        </div>

        {/* Row 2: route */}
        <div className="flex items-center gap-2">
          <div className="shrink-0" style={{ width: '33%' }}>
            <p className="text-sm font-bold tabular-nums text-zinc-950 leading-tight">{transport.departure}</p>
            <p className="text-xs font-medium text-zinc-700 truncate">{transport.from}</p>
            <p className="text-[10px] text-zinc-400 truncate">{transport.stationFrom}</p>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center gap-1">
              <span className="h-px flex-1 bg-zinc-200" />
              <ArrowRight className="h-2.5 w-2.5 text-zinc-300 shrink-0" />
              <span className="h-px flex-1 bg-zinc-200" />
            </div>
            <span className="mt-0.5 text-[9px] font-medium text-zinc-400">{transport.duration}</span>
          </div>
          <div className="shrink-0 text-right" style={{ width: '33%' }}>
            <p className="text-sm font-bold tabular-nums text-zinc-950 leading-tight">{transport.arrival}</p>
            <p className="text-xs font-medium text-zinc-700 truncate">{transport.to}</p>
            <p className="text-[10px] text-zinc-400 truncate">{transport.stationTo}</p>
          </div>
        </div>

        {/* Row 3: meta */}
        <div className="mt-2 flex items-center gap-3 border-t border-zinc-100 pt-2">
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <Calendar className="h-2.5 w-2.5 text-zinc-300" />
            {transport.date}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <Users className="h-2.5 w-2.5 text-zinc-300" />
            {transport.passengers} passenger{transport.passengers > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   FLIGHT CARD
───────────────────────────────────────────────────────────────── */
function FlightCard({ flight, onBook }: { flight: Flight; onBook: () => void }) {
  const isCancelled = flight.status === 'cancelled'
  const isPending = flight.status === 'pending'

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-sm ${
        isCancelled ? 'opacity-55' : ''
      }`}
    >
      <div className="px-4 py-3">
        {/* Row 1 */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100">
              <Plane className="h-2.5 w-2.5 text-zinc-500" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
              {flight.airline}
            </span>
            <span className="text-[9px] font-medium text-zinc-400">{flight.flightNumber}</span>
            {isPending && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200">
                Pending
              </span>
            )}
            {isCancelled && (
              <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-rose-500 ring-1 ring-rose-200">
                Cancelled
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-zinc-900">{flight.price}</span>
            {!isCancelled && (
              <button
                onClick={onBook}
                className="rounded-lg bg-zinc-950 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange-500 active:scale-95"
              >
                Book
              </button>
            )}
          </div>
        </div>

        {/* Row 2: route */}
        <div className="flex items-center gap-2">
          <div className="shrink-0" style={{ width: '33%' }}>
            <p className="text-sm font-bold tabular-nums text-zinc-950 leading-tight">{flight.departure}</p>
            <p className="text-xs font-medium text-zinc-700">{flight.fromCode}</p>
            <p className="text-[10px] text-zinc-400 truncate">{flight.from}</p>
          </div>
          <div className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center gap-1">
              <span className="h-px flex-1 bg-zinc-200" />
              <Plane className="h-2.5 w-2.5 text-zinc-300 shrink-0" />
              <span className="h-px flex-1 bg-zinc-200" />
            </div>
            <span className="mt-0.5 text-[9px] font-medium text-zinc-400">{flight.duration}</span>
            <span className="text-[8px] text-zinc-400">
              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="shrink-0 text-right" style={{ width: '33%' }}>
            <p className="text-sm font-bold tabular-nums text-zinc-950 leading-tight">{flight.arrival}</p>
            <p className="text-xs font-medium text-zinc-700">{flight.toCode}</p>
            <p className="text-[10px] text-zinc-400 truncate">{flight.to}</p>
          </div>
        </div>

        {/* Row 3: meta */}
        <div className="mt-2 flex items-center gap-3 border-t border-zinc-100 pt-2">
          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <Calendar className="h-2.5 w-2.5 text-zinc-300" />
            {flight.date}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────────── */
export default function UserTrips() {
  const [activeTab, setActiveTab] = useState<'flights' | 'transport'>('transport')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const visibleTransports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return transports
    return transports.filter((tr) =>
      [tr.type, tr.route, tr.from, tr.to, tr.stationFrom, tr.stationTo, tr.price, tr.date]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [searchQuery])

  const visibleFlights = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return flights
    return flights.filter((f) =>
      [f.airline, f.flightNumber, f.from, f.fromCode, f.to, f.toCode, f.date]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [searchQuery])

  const pendingCount = useMemo(
    () => [...transports, ...flights].filter((t) => t.status === 'pending').length,
    [],
  )

  const handleBook = () => {
    setShowComingSoon(true)
    setLastAction('Booking feature coming soon.')
  }

  useEffect(() => {
    const raw = sessionStorage.getItem('agentAction')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { type?: string }
      if (parsed?.type === 'SHOW_BOOKINGS') {
        setActiveTab('transport')
        sessionStorage.removeItem('agentAction')
      }
    } catch { /* */ }
  }, [])

  // const totalCount = activeTab === 'transport' ? transports.length : flights.length

  return (
    <div className="space-y-3.5 pb-6">
      <Toast
        open={showComingSoon}
        message="This feature is coming soon."
        onClose={() => setShowComingSoon(false)}
      />

      {/* Header */}
      <div>
        <h2 className="text-sm font-bold tracking-tight text-zinc-950">My Trips</h2>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          {transports.length + flights.length} trips{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-zinc-100 p-0.5 gap-px shrink-0">
          {[
            { key: 'transport', label: 'Trains', icon: Train },
            { key: 'flights', label: 'Flights', icon: Plane },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as 'flights' | 'transport'); setSearchQuery('') }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <tab.icon className={`h-2.5 w-2.5 ${activeTab === tab.key ? 'text-orange-500' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'transport' ? 'Search trains…' : 'Search flights…'}
            className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-[11px] font-medium text-zinc-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition hover:bg-zinc-50 shrink-0">
          <Filter className="h-3 w-3" />
        </button>
      </div>

      {/* Agent banner */}
      {lastAction && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
          <p className="text-[11px] font-medium text-orange-700 flex-1">{lastAction}</p>
          <button onClick={() => setLastAction(null)} className="text-orange-300 hover:text-orange-500 transition">
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      {/* Transport list */}
      {activeTab === 'transport' && (
        <div className="space-y-1.5">
          {visibleTransports.length === 0 ? (
            <EmptyState icon={Train} label="trains" />
          ) : (
            visibleTransports.map((t) => (
              <TransportCard key={t.id} transport={t} onBook={handleBook} />
            ))
          )}
        </div>
      )}

      {/* Flights list */}
      {activeTab === 'flights' && (
        <div className="space-y-1.5">
          {visibleFlights.length === 0 ? (
            <EmptyState icon={Plane} label="flights" />
          ) : (
            visibleFlights.map((f) => (
              <FlightCard key={f.id} flight={f} onBook={handleBook} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
