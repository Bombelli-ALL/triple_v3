import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Loader2 } from 'lucide-react'
import { getAdminOverview, listMembers, type AdminMember, type AdminOverview } from '@/lib/plan'
import { Avatar, PageHeader, Panel, PlanBadge, Stat } from './adminUi'
import CitiesPanel from './CitiesPanel'
import { relativeTime } from './adminFormat'

function SignupChart({ days }: { days: AdminOverview['signupsByDay'] }) {
	const max = Math.max(1, ...days.map((day) => day.count))
	return (
		<div>
			<div className='flex h-36 items-end gap-1 sm:gap-1.5'>
				{days.map((day) => (
					<div key={day.date} className='group relative flex h-full flex-1 items-end'>
						<div className='w-full rounded-t bg-orange-500/90 transition group-hover:bg-orange-600' style={{ height: `${Math.max(day.count ? 6 : 2, (day.count / max) * 100)}%`, opacity: day.count ? 1 : 0.25 }} />
						<span className='pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] text-white group-hover:block'>
							{day.count} · {new Date(day.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
						</span>
					</div>
				))}
			</div>
			<div className='mt-2 flex justify-between text-xs text-zinc-400'>
				<span>{days[0] ? new Date(days[0].date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}</span>
				<span>Today</span>
			</div>
		</div>
	)
}

export default function AdminDashboard() {
	const [overview, setOverview] = useState<AdminOverview | null>(null)
	const [members, setMembers] = useState<AdminMember[]>([])
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		Promise.all([getAdminOverview(), listMembers()])
			.then(([overviewResponse, membersResponse]) => {
				setOverview(overviewResponse.data)
				setMembers(membersResponse.data)
			})
			.catch(() => setError('Could not load the overview. Please refresh.'))
	}, [])

	if (error) return <p className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</p>
	if (!overview) {
		return (
			<div className='flex min-h-[50vh] items-center justify-center text-zinc-400'>
				<Loader2 className='h-5 w-5 animate-spin' aria-label='Loading' />
			</div>
		)
	}

	const premiumShare = overview.totalUsers ? Math.round((overview.premiumActive / overview.totalUsers) * 100) : 0
	const signupsLast14 = overview.signupsByDay.reduce((sum, day) => sum + day.count, 0)
	const roleRows = [
		{ label: 'Travelers', value: overview.roles.TRAVELER ?? 0 },
		{ label: 'Guides', value: overview.roles.GUIDE ?? 0 },
		{ label: 'Admins', value: overview.roles.ADMIN ?? 0 },
	]

	return (
		<>
			<PageHeader title='Overview' description='Your users, plans and invite codes at a glance.' />

			<div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
				<Stat label='Total users' value={overview.totalUsers} hint={`+${overview.newThisWeek} this week`} />
				<Stat label='Active this week' value={overview.activeThisWeek} hint='Signed in during the last 7 days' />
				<Stat label='Premium' value={overview.premiumActive} hint={`${premiumShare}% of users`} />
				<Stat label='Trips planned' value={overview.trips} />
			</div>

			<div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
				<Panel title='New sign-ups' action={<span className='text-sm text-zinc-500'>{signupsLast14} in 14 days</span>}>
					<SignupChart days={overview.signupsByDay} />
				</Panel>

				<Panel title='Plans'>
					<div className='flex h-2.5 overflow-hidden rounded-full bg-zinc-100'>
						<div className='bg-orange-500' style={{ width: `${premiumShare}%` }} />
					</div>
					<ul className='mt-4 space-y-2.5 text-sm'>
						<li className='flex justify-between'>
							<span className='flex items-center gap-2 text-zinc-600'>
								<span className='h-2.5 w-2.5 rounded-full bg-orange-500' />
								Premium
							</span>
							<span className='tabular-nums text-zinc-900'>{overview.premiumActive}</span>
						</li>
						<li className='flex justify-between'>
							<span className='flex items-center gap-2 text-zinc-600'>
								<span className='h-2.5 w-2.5 rounded-full bg-zinc-200' />
								Free
							</span>
							<span className='tabular-nums text-zinc-900'>{overview.freeUsers}</span>
						</li>
						<li className='flex justify-between text-zinc-500'>
							<span className='pl-[18px]'>Premium expired</span>
							<span className='tabular-nums'>{overview.premiumExpired}</span>
						</li>
					</ul>
					<div className='mt-5 border-t border-zinc-100 pt-4'>
						<ul className='space-y-2 text-sm'>
							{roleRows.map((row) => (
								<li key={row.label} className='flex justify-between'>
									<span className='text-zinc-600'>{row.label}</span>
									<span className='tabular-nums text-zinc-900'>{row.value}</span>
								</li>
							))}
						</ul>
					</div>
				</Panel>
			</div>

			<div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
				<Panel
					title='Newest users'
					flush
					action={
						<Link to='/admin/users' className='inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900'>
							All users <ChevronRight className='h-4 w-4' />
						</Link>
					}
				>
					<ul className='divide-y divide-zinc-100'>
						{members.slice(0, 6).map((member) => (
							<li key={member.id} className='flex items-center gap-3 px-4 py-3 sm:px-5'>
								<Avatar name={member.name} src={member.avatarUrl} />
								<div className='min-w-0 flex-1'>
									<p className='truncate text-sm font-medium text-zinc-900'>{member.name}</p>
									<p className='truncate text-xs text-zinc-500'>{member.email}</p>
								</div>
								<PlanBadge member={member} />
								<span className='hidden w-20 text-right text-xs text-zinc-400 sm:block'>{relativeTime(member.createdAt)}</span>
							</li>
						))}
					</ul>
				</Panel>

				<Panel
					title='Invite codes'
					action={
						<Link to='/admin/referrals' className='inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900'>
							Manage <ChevronRight className='h-4 w-4' />
						</Link>
					}
				>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<p className='text-2xl font-semibold tabular-nums text-zinc-900'>{overview.activeCodes}</p>
							<p className='text-sm text-zinc-500'>Active codes</p>
						</div>
						<div>
							<p className='text-2xl font-semibold tabular-nums text-zinc-900'>{overview.redemptions}</p>
							<p className='text-sm text-zinc-500'>Times used</p>
						</div>
					</div>
					<Link to='/admin/referrals' className='mt-5 flex h-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800'>
						Create an invite code
					</Link>
				</Panel>
			</div>

			<div className='mt-4'>
				<CitiesPanel />
			</div>
		</>
	)
}
