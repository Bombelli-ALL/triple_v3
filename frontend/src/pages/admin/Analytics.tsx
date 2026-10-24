import { BarChart3, Download, Globe, TrendingDown, TrendingUp, Users } from 'lucide-react'

const kpis = [
  { label: 'Monthly Active Users', value: '485', trend: '+12.5%', trendUp: true },
  { label: 'Trips This Month', value: '89', trend: '+8.2%', trendUp: true },
  { label: 'Revenue (MTD)', value: '32K MAD', trend: '+18.3%', trendUp: true },
  { label: 'Avg. Trip Value', value: '3,450 MAD', trend: '-2.1%', trendUp: false },
]

const monthlyRevenue = [
  { month: 'Jan', revenue: 12000, target: 15000 },
  { month: 'Feb', revenue: 15000, target: 15000 },
  { month: 'Mar', revenue: 14000, target: 18000 },
  { month: 'Apr', revenue: 18000, target: 18000 },
  { month: 'May', revenue: 16000, target: 20000 },
  { month: 'Jun', revenue: 20000, target: 20000 },
  { month: 'Jul', revenue: 22000, target: 22000 },
  { month: 'Aug', revenue: 21000, target: 24000 },
  { month: 'Sep', revenue: 24000, target: 24000 },
  { month: 'Oct', revenue: 26000, target: 26000 },
  { month: 'Nov', revenue: 28000, target: 28000 },
  { month: 'Dec', revenue: 32000, target: 30000 },
]

const topDestinations = [
  { destination: 'Fes Medina', trips: 180, growth: 15.5 },
  { destination: 'Meknes', trips: 120, growth: 12.2 },
  { destination: 'Volubilis', trips: 95, growth: 18.8 },
  { destination: 'Ifrane', trips: 85, growth: 8.4 },
  { destination: 'Azrou', trips: 60, growth: 5.1 },
  { destination: 'Moulay Idriss', trips: 45, growth: 22.3 },
]

const conversionFunnel = [
  { stage: 'Visitors', value: 10000, percent: 100 },
  { stage: 'Sign Ups', value: 1500, percent: 15 },
  { stage: 'Trip Created', value: 850, percent: 8.5 },
  { stage: 'Booking Made', value: 420, percent: 4.2 },
  { stage: 'Trip Completed', value: 380, percent: 3.8 },
]

export default function AdminAnalytics() {
  const maxRevenue = Math.max(...monthlyRevenue.map((item) => item.revenue))

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-2xl font-semibold text-zinc-900'>Analytics</h2>
          <p className='text-sm text-zinc-500'>Fes-Meknes region performance insights</p>
        </div>
        <button className='flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-600'>
          <Download className='h-4 w-4' />
          Export Report
        </button>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {kpis.map((kpi) => (
          <div key={kpi.label} className='rounded-[20px] border border-zinc-200 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-zinc-500'>{kpi.label}</p>
                <p className='mt-1 text-3xl font-semibold text-zinc-900'>{kpi.value}</p>
              </div>
              <div className='rounded-xl bg-orange-500/15 p-3 text-orange-500'>
                <Users className='h-5 w-5' />
              </div>
            </div>
            <div className={`mt-4 flex items-center gap-2 text-sm ${kpi.trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
              {kpi.trendUp ? <TrendingUp className='h-4 w-4' /> : <TrendingDown className='h-4 w-4' />}
              {kpi.trend}
              <span className='text-zinc-400'>vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center gap-2 text-sm font-semibold text-zinc-800'>
            <BarChart3 className='h-4 w-4 text-orange-500' />
            Revenue vs Target
          </div>
          <div className='mt-4 flex h-56 items-end gap-3'>
            {monthlyRevenue.map((item) => (
              <div key={item.month} className='flex w-5 flex-col items-center gap-2'>
                <div className='w-full rounded-full bg-zinc-200' style={{ height: `${Math.round((item.target / maxRevenue) * 100)}%` }} />
                <div
                  className='-mt-2 w-full rounded-full bg-orange-500/60'
                  style={{ height: `${Math.round((item.revenue / maxRevenue) * 100)}%` }}
                />
                <span className='text-[10px] text-zinc-400'>{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center gap-2 text-sm font-semibold text-zinc-800'>
            <Globe className='h-4 w-4 text-orange-500' />
            Top Destinations
          </div>
          <div className='mt-4 space-y-3'>
            {topDestinations.map((dest, idx) => (
              <div key={dest.destination} className='flex items-center justify-between'>
                <div className='flex items-center gap-3 text-sm text-zinc-600'>
                  <span className='text-xs text-zinc-400'>{idx + 1}</span>
                  {dest.destination}
                </div>
                <div className='flex items-center gap-3 text-sm'>
                  <span className='text-zinc-500'>{dest.trips} trips</span>
                  <span className='rounded-full bg-orange-500/15 px-2 py-1 text-xs text-orange-600'>
                    +{dest.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-sm'>
        <div className='flex items-center gap-2 text-sm font-semibold text-zinc-800'>
          <BarChart3 className='h-4 w-4 text-orange-500' />
          Conversion Funnel
        </div>
        <div className='mt-4 space-y-3'>
          {conversionFunnel.map((stage) => (
            <div key={stage.stage} className='space-y-1'>
              <div className='flex justify-between text-sm text-zinc-600'>
                <span>{stage.stage}</span>
                <span>
                  {stage.value.toLocaleString()} ({stage.percent}%)
                </span>
              </div>
              <div className='h-3 w-full rounded-full bg-zinc-100'>
                <div className='h-full rounded-full bg-orange-500' style={{ width: `${stage.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
