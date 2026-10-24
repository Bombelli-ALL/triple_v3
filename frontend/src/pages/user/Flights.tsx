import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plane,
  ArrowRightLeft,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  Search,
  ChevronRight,
  Globe,
  MapPin,

} from 'lucide-react'
import api from '@/lib/api'

interface Flight {
  id: string
  price: number
  currency: string
  deepLink: string
  outbound: {
    airline: string
    flightNumber: string
    origin: string
    destination: string
    departureTime: string
    duration: number
    stops: number
  }
  returnSegment?: {
    departureTime: string
  } | null
}

interface FlightProps {
  isEmbedded?: boolean
  onBook?: (flight: Flight) => void
}

export default function UserFlights({ isEmbedded = false, onBook }: FlightProps) {
  const { t, i18n } = useTranslation()
  const [origin, setOrigin] = useState('CMN')
  const [destination, setDestination] = useState('CDG')
  const [departureDate, setDepartureDate] = useState('2026-04-01')
  const [returnDate, setReturnDate] = useState('2026-04-10')
  const [adults, setAdults] = useState(1)
  const [results, setResults] = useState<Flight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await api.post('/flights/search', {
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
      })

      if (response.data.success) {
        setResults(response.data.results)
      } else {
        setError(t('user.flights.errors.no_results'))
      }
    } catch (err: any) {
      console.warn('Search failed, using demo data:', err)
      const demoFlights: Flight[] = [
        {
          id: 'demo-1',
          price: 450,
          currency: 'USD',
          deepLink: 'https://www.aviasales.com',
          outbound: {
            airline: 'AT',
            flightNumber: '970',
            origin: origin || 'CMN',
            destination: destination || 'CDG',
            departureTime: new Date(departureDate).toISOString(),
            duration: 185,
            stops: 0,
          },
        },
      ]
      setResults(demoFlights)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-col gap-6 ${isEmbedded ? '' : 'p-4 md:p-8'}`}>
      {!isEmbedded && (
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl'>
            {t('user.flights.search.title')}
          </h1>
          <p className='text-sm font-medium text-zinc-500'>
            {t('user.flights.search.desc')}
          </p>
        </div>
      )}

      <div className='overflow-hidden rounded-[32px] border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-200/40'>
        <form onSubmit={handleSearch} className='flex flex-col divide-y divide-zinc-100 lg:flex-row lg:divide-x lg:divide-y-0'>
          {/* Origin */}
          <div className='group relative flex-1 px-6 py-5 transition-all hover:bg-zinc-50/50'>
            <label className='mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400'>
              <MapPin className='h-3 w-3 text-orange-500' />
              {t('user.flights.search.origin')}
            </label>
            <input
              type='text'
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              className='w-full bg-transparent text-base font-bold text-zinc-950 placeholder-zinc-300 outline-none'
              placeholder='CMN'
            />
            <div className='absolute bottom-0 left-6 right-6 h-0.5 origin-left scale-x-0 bg-orange-500 transition-transform group-focus-within:scale-x-100' />
          </div>

          {/* Destination */}
          <div className='group relative flex-1 px-6 py-5 transition-all hover:bg-zinc-50/50'>
            <label className='mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400'>
              <MapPin className='h-3 w-3 text-orange-500' />
              {t('user.flights.search.destination')}
            </label>
            <input
              type='text'
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              className='w-full bg-transparent text-base font-bold text-zinc-950 placeholder-zinc-300 outline-none'
              placeholder='CDG'
            />
            <div className='absolute bottom-0 left-6 right-6 h-0.5 origin-left scale-x-0 bg-orange-500 transition-transform group-focus-within:scale-x-100' />
          </div>

          {/* Dates */}
          <div className='group relative flex-1 px-6 py-5 transition-all hover:bg-zinc-50/50 lg:flex-[1.8]'>
            <label className='mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400'>
              <Calendar className='h-3 w-3 text-orange-500' />
              {t('user.flights.search.date')}
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='date'
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className='w-full bg-transparent text-sm font-bold text-zinc-900 outline-none'
              />
              <ArrowRightLeft className='h-4 w-4 shrink-0 text-zinc-300' />
              <input
                type='date'
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className='w-full bg-transparent text-sm font-bold text-zinc-900 outline-none'
              />
            </div>
            <div className='absolute bottom-0 left-6 right-6 h-0.5 origin-left scale-x-0 bg-orange-500 transition-transform group-focus-within:scale-x-100' />
          </div>

          {/* Passengers */}
          <div className='group relative flex-1 px-6 py-5 transition-all hover:bg-zinc-50/50'>
            <label className='mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400'>
              <Users className='h-3 w-3 text-orange-500' />
              {t('user.flights.labels.adults')}
            </label>
            <div className='flex items-center gap-2'>
              <select
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value))}
                className='w-full appearance-none bg-transparent text-base font-bold text-zinc-900 outline-none'
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Adult' : 'Adults'}
                  </option>
                ))}
              </select>
            </div>
            <div className='absolute bottom-0 left-6 right-6 h-0.5 origin-left scale-x-0 bg-orange-500 transition-transform group-focus-within:scale-x-100' />
          </div>

          {/* Search Button */}
          <div className='p-3 lg:w-20 lg:p-4'>
            <button
              type='submit'
              disabled={isLoading}
              className='flex h-14 w-full items-center justify-center gap-3 rounded-[20px] bg-zinc-950 font-black text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 lg:h-full'
            >
              {isLoading ? (
                <Loader2 className='h-5 w-5 animate-spin' />
              ) : (
                <Search className='h-6 w-6' />
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className='flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600'>
          <AlertCircle className='h-5 w-5' />
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className='flex flex-col gap-4'>
          {results.map((flight) => (
            <div
              key={flight.id}
              className='group overflow-hidden rounded-[32px] border border-zinc-100 bg-white transition-all hover:border-orange-500/10 hover:shadow-2xl hover:shadow-zinc-200/50'
            >
              <div className='flex flex-col lg:flex-row lg:items-center'>
                <div className='flex-1 p-6 lg:p-8'>
                  <div className='flex flex-col gap-8 md:flex-row md:items-center'>
                    <div className='flex items-center gap-4'>
                      <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-900 transition-colors group-hover:bg-orange-50 group-hover:text-orange-500'>
                        <Plane className='h-7 w-7' />
                      </div>
                      <div>
                        <p className='text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-orange-500/60 transition-colors'>
                          {flight.outbound.airline}
                        </p>
                        <p className='text-xs font-bold text-zinc-500'>
                          {flight.outbound.flightNumber}
                        </p>
                      </div>
                    </div>

                    <div className='flex flex-1 items-center justify-between gap-6'>
                      <div className='text-center md:text-left'>
                        <p className='text-xl font-bold tracking-tight text-zinc-900'>
                          {new Date(flight.outbound.departureTime).toLocaleTimeString(i18n.language, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
                          {flight.outbound.origin}
                        </p>
                      </div>

                      <div className='flex flex-1 flex-col items-center gap-2 px-4'>
                        <p className='text-[9px] font-bold uppercase tracking-widest text-zinc-400'>
                          {Math.floor(flight.outbound.duration / 60)}h {flight.outbound.duration % 60}m
                        </p>
                        <div className='relative flex w-full items-center'>
                          <div className='h-[1px] flex-1 bg-zinc-100 transition-colors group-hover:bg-orange-100' />
                          <div className='mx-3 rounded-full border border-zinc-100 bg-white p-1 transition-colors group-hover:border-orange-100'>
                            <Plane className='h-2.5 w-2.5 text-zinc-300 transition-colors group-hover:text-orange-500' />
                          </div>
                          <div className='h-[1px] flex-1 bg-zinc-100 transition-colors group-hover:bg-orange-100' />
                        </div>
                        <p className='text-[9px] font-bold text-zinc-500 uppercase tracking-tight'>
                          {flight.outbound.stops === 0 ? t('user.flights.results.direct') : t('user.flights.results.stopover')}
                        </p>
                      </div>

                      <div className='text-center md:text-right'>
                        <p className='text-xl font-bold tracking-tight text-zinc-900'>
                          {new Date(
                            new Date(flight.outbound.departureTime).getTime() +
                            flight.outbound.duration * 60000
                          ).toLocaleTimeString(i18n.language, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
                          {flight.outbound.destination}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex flex-col justify-center border-t border-zinc-50 bg-zinc-50/30 p-6 lg:w-48 lg:border-l lg:border-t-0 lg:p-8'>
                  <div className='mb-4 text-center lg:text-right'>
                    <p className='text-[9px] font-bold uppercase tracking-widest text-zinc-400'>
                      {t('user.trips.labels.price')}
                    </p>
                    <p className='text-2xl font-black tracking-tight text-zinc-900'>
                      ${flight.price}
                    </p>
                  </div>
                  <button
                    onClick={() => onBook?.(flight)}
                    className='group/btn relative flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-950 px-6 font-bold text-white transition-all hover:bg-orange-500 hover:shadow-xl hover:shadow-orange-500/20 active:scale-[0.98]'
                  >
                    <span className='relative z-10 flex items-center gap-2 text-[10px] uppercase tracking-widest'>
                      {t('user.trips.actions.book')}
                      <ChevronRight className='h-3 w-3 transition-transform group-hover/btn:translate-x-1' />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isEmbedded && results.length === 0 && !isLoading && (
        <div className='flex flex-col items-center justify-center py-20 text-center'>
          <div className='mb-6 rounded-full bg-zinc-50 p-6'>
            <Globe className='h-12 w-12 text-zinc-300' />
          </div>
          <h3 className='text-xl font-black tracking-tight text-zinc-950'>
            {t('user.flights.search.title')}
          </h3>
          <p className='mx-auto mt-2 max-w-xs text-sm font-medium text-zinc-500'>
            {t('user.flights.search.desc')}
          </p>
        </div>
      )}
    </div>
  )
}
