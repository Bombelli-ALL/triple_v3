import { useMemo, useState } from 'react'
import { Calendar, Download, Filter, MapPin, Plane, Search, Users } from 'lucide-react'

interface TripRow {
  id: string
  name: string
  destination: string
  image: string
  user: string
  userEmail: string
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budget: string
  members: number
  bookings: number
}

const trips: TripRow[] = [
  {
    id: '1',
    name: 'Fes Medina Discovery',
    destination: 'Fes, Morocco',
    image: 'https://images.unsplash.com/photo-1549140600-78c9b8275e9d?w=800&auto=format&fit=crop&q=60',
    user: 'Ahmed Benali',
    userEmail: 'ahmed@email.com',
    status: 'active',
    startDate: 'Mar 15, 2025',
    endDate: 'Mar 18, 2025',
    budget: '4,500 MAD',
    members: 4,
    bookings: 8,
  },
  {
    id: '2',
    name: 'Meknes Heritage',
    destination: 'Meknes, Morocco',
    image: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=800&auto=format&fit=crop&q=60',
    user: 'Fatima Zahra',
    userEmail: 'fatima@email.com',
    status: 'planning',
    startDate: 'Apr 5, 2025',
    endDate: 'Apr 7, 2025',
    budget: '2,800 MAD',
    members: 2,
    bookings: 3,
  },
  {
    id: '3',
    name: 'Volubilis History',
    destination: 'Volubilis, Morocco',
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&auto=format&fit=crop&q=60',
    user: 'Youssef Amrani',
    userEmail: 'youssef@email.com',
    status: 'completed',
    startDate: 'Feb 10, 2025',
    endDate: 'Feb 11, 2025',
    budget: '1,500 MAD',
    members: 3,
    bookings: 2,
  },
  {
    id: '4',
    name: 'Ifrane Nature Escape',
    destination: 'Ifrane, Morocco',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800&auto=format&fit=crop&q=60',
    user: 'Sara Tazi',
    userEmail: 'sara@email.com',
    status: 'active',
    startDate: 'Mar 10, 2025',
    endDate: 'Mar 12, 2025',
    budget: '3,200 MAD',
    members: 5,
    bookings: 6,
  },
  {
    id: '5',
    name: 'Azrou Cedar Forest',
    destination: 'Azrou, Morocco',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=60',
    user: 'Karim Idrissi',
    userEmail: 'karim@email.com',
    status: 'cancelled',
    startDate: 'Mar 1, 2025',
    endDate: 'Mar 2, 2025',
    budget: '800 MAD',
    members: 2,
    bookings: 1,
  },
  {
    id: '6',
    name: 'Middle Atlas Tour',
    destination: 'Fes-Meknes Region',
    image: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&auto=format&fit=crop&q=60',
    user: 'Nadia Bennani',
    userEmail: 'nadia@email.com',
    status: 'planning',
    startDate: 'May 15, 2025',
    endDate: 'May 20, 2025',
    budget: '5,500 MAD',
    members: 4,
    bookings: 0,
  },
]

const statusStyles: Record<TripRow['status'], string> = {
  planning: 'bg-amber-500/15 text-amber-700',
  active: 'bg-orange-500/15 text-orange-600',
  completed: 'bg-zinc-200 text-zinc-600',
  cancelled: 'bg-rose-500/15 text-rose-600',
}

export default function AdminTrips() {
  const [searchQuery, setSearchQuery] = useState('')
  const filteredTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trip.user.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  )

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold text-zinc-900'>Trip Management</h2>
        <p className='text-sm text-zinc-500'>Monitor Fes-Meknes region trips</p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[
          { label: 'Total Trips', value: '345', icon: Plane },
          { label: 'Active Trips', value: '184', icon: MapPin },
          { label: 'Planning', value: '89', icon: Calendar },
          { label: 'Total Budget', value: '850K MAD', icon: Users },
        ].map((stat) => (
          <div key={stat.label} className='rounded-[20px] border border-zinc-200 bg-white p-4 shadow-sm'>
            <div className='flex items-center gap-4'>
              <div className='rounded-xl bg-orange-500/15 p-3 text-orange-500'>
                <stat.icon className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-zinc-500'>{stat.label}</p>
                <p className='text-2xl font-semibold text-zinc-900'>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='rounded-[22px] border border-zinc-200 bg-white shadow-sm'>
        <div className='flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-base font-semibold text-zinc-900'>All Trips</div>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder='Search trips...'
                className='h-10 w-60 rounded-full border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-700'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-600'>
              <Filter className='h-4 w-4' />
              Filter
            </button>
            <button className='flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-600'>
              <Download className='h-4 w-4' />
              Export
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full text-left text-sm'>
            <thead className='bg-zinc-50 text-xs uppercase tracking-wide text-zinc-400'>
              <tr>
                <th className='px-4 py-3'>Trip</th>
                <th className='px-4 py-3'>User</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3'>Dates</th>
                <th className='px-4 py-3'>Budget</th>
                <th className='px-4 py-3'>Members</th>
                <th className='px-4 py-3'>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className='border-t border-zinc-200'>
                  <td className='px-4 py-4'>
                    <div className='flex items-center gap-3'>
                      <img src={trip.image} alt={trip.name} className='h-12 w-12 rounded-lg object-cover' />
                      <div>
                        <div className='font-medium text-zinc-900'>{trip.name}</div>
                        <div className='text-xs text-zinc-500'>{trip.destination}</div>
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-4'>
                    <div className='text-sm'>
                      <div className='font-medium text-zinc-900'>{trip.user}</div>
                      <div className='text-xs text-zinc-500'>{trip.userEmail}</div>
                    </div>
                  </td>
                  <td className='px-4 py-4'>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[trip.status]}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className='px-4 py-4 text-sm text-zinc-600'>
                    <div>{trip.startDate}</div>
                    <div className='text-xs text-zinc-400'>{trip.endDate}</div>
                  </td>
                  <td className='px-4 py-4 font-medium text-zinc-900'>{trip.budget}</td>
                  <td className='px-4 py-4 text-zinc-600'>{trip.members}</td>
                  <td className='px-4 py-4 text-zinc-600'>{trip.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 text-sm text-zinc-500'>
          <div>
            Showing {filteredTrips.length} of {trips.length} trips
          </div>
          <div className='flex items-center gap-2 text-xs'>
            <button className='rounded-full border border-zinc-200 px-3 py-1 text-zinc-500'>Prev</button>
            <button className='rounded-full bg-orange-500 px-3 py-1 text-white'>1</button>
            <button className='rounded-full border border-zinc-200 px-3 py-1 text-zinc-500'>2</button>
            <button className='rounded-full border border-zinc-200 px-3 py-1 text-zinc-500'>3</button>
            <button className='rounded-full border border-zinc-200 px-3 py-1 text-zinc-500'>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
