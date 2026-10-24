import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, MoreHorizontal, Search } from 'lucide-react'
import { apiErrorMessage, listMembers, updateMemberPlan, type AdminMember } from '@/lib/plan'
import { Avatar, PageHeader, PlanBadge, StatusLabel } from './adminUi'
import { activityStatus, formatDate, relativeTime } from './adminFormat'

type PlanFilter = 'all' | 'premium' | 'free' | 'expired'
type RoleFilter = 'all' | AdminMember['role']

const PLAN_FILTERS: Array<{ value: PlanFilter; label: string }> = [
	{ value: 'all', label: 'All' },
	{ value: 'premium', label: 'Premium' },
	{ value: 'free', label: 'Free' },
	{ value: 'expired', label: 'Expired' },
]

const GRANT_OPTIONS: Array<{ label: string; days: number | null }> = [
	{ label: 'Give 1 month', days: 30 },
	{ label: 'Give 3 months', days: 90 },
	{ label: 'Give 1 year', days: 365 },
	{ label: 'Give with no end date', days: null },
]

const ROLE_LABEL: Record<AdminMember['role'], string> = { TRAVELER: 'Traveler', GUIDE: 'Guide', ADMIN: 'Admin' }

function planEnd(member: AdminMember) {
	if (!member.isPremium) return null
	return member.premiumUntil ? `Until ${formatDate(member.premiumUntil)}` : 'No end date'
}

function PlanMenu({ member, busy, onAction }: { member: AdminMember; busy: boolean; onAction: (body: { action: 'grant'; days: number | null } | { action: 'revoke' }) => void }) {
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const close = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', close)
		return () => document.removeEventListener('mousedown', close)
	}, [open])

	return (
		<div ref={ref} className='relative'>
			<button type='button' onClick={() => setOpen((value) => !value)} disabled={busy} aria-label={`Plan actions for ${member.name}`} className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50'>
				{busy ? <Loader2 className='h-4 w-4 animate-spin' /> : <MoreHorizontal className='h-4 w-4' />}
			</button>
			{open && (
				<div className='absolute right-0 z-20 mt-1 w-52 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg'>
					<p className='px-3 pb-1 pt-2 text-xs text-zinc-400'>{member.isPremium ? 'Add Premium time' : 'Give Premium'}</p>
					{GRANT_OPTIONS.map((option) => (
						<button
							key={option.label}
							type='button'
							onClick={() => {
								setOpen(false)
								onAction({ action: 'grant', days: option.days })
							}}
							className='flex h-9 w-full items-center rounded-md px-3 text-left text-sm text-zinc-700 hover:bg-zinc-100'
						>
							{option.label}
						</button>
					))}
					{member.isPremium && (
						<button
							type='button'
							onClick={() => {
								setOpen(false)
								onAction({ action: 'revoke' })
							}}
							className='mt-1 flex h-9 w-full items-center rounded-md border-t border-zinc-100 px-3 text-left text-sm text-red-600 hover:bg-red-50'
						>
							Remove Premium
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default function AdminUsers() {
	const [members, setMembers] = useState<AdminMember[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [query, setQuery] = useState('')
	const [planFilter, setPlanFilter] = useState<PlanFilter>('all')
	const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
	const [busyId, setBusyId] = useState<string | null>(null)

	useEffect(() => {
		listMembers()
			.then(({ data }) => setMembers(data))
			.catch(() => setError('Could not load users. Please refresh.'))
	}, [])

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		return (members ?? []).filter((member) => {
			if (q && !`${member.name} ${member.email}`.toLowerCase().includes(q)) return false
			if (roleFilter !== 'all' && member.role !== roleFilter) return false
			if (planFilter === 'premium') return member.isPremium
			if (planFilter === 'free') return !member.isPremium && !member.expired
			if (planFilter === 'expired') return member.expired
			return true
		})
	}, [members, query, planFilter, roleFilter])

	const counts = useMemo(() => {
		const list = members ?? []
		return {
			all: list.length,
			premium: list.filter((member) => member.isPremium).length,
			free: list.filter((member) => !member.isPremium && !member.expired).length,
			expired: list.filter((member) => member.expired).length,
		}
	}, [members])

	const changePlan = async (member: AdminMember, body: { action: 'grant'; days: number | null } | { action: 'revoke' }) => {
		try {
			setBusyId(member.id)
			const { data } = await updateMemberPlan(member.id, body)
			setMembers((prev) => prev?.map((entry) => (entry.id === member.id ? { ...entry, ...data } : entry)) ?? null)
			toast.success(body.action === 'revoke' ? `Premium removed for ${member.name}` : `${member.name} is now Premium`)
		} catch (requestError) {
			toast.error(apiErrorMessage(requestError, 'Could not change the plan.'))
		} finally {
			setBusyId(null)
		}
	}

	if (error) return <p className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</p>

	return (
		<>
			<PageHeader title='Users' description={members ? `${counts.all} people · ${counts.premium} on Premium` : 'Everyone who signed up.'} />

			<div className='mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
				<div className='flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 md:w-80'>
					<Search className='h-4 w-4 shrink-0 text-zinc-400' />
					<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search name or email' className='h-full w-full bg-transparent text-sm outline-none placeholder:text-zinc-400' />
				</div>
				<div className='flex flex-wrap items-center gap-2'>
					<div className='flex rounded-lg border border-zinc-200 bg-white p-0.5'>
						{PLAN_FILTERS.map((filter) => (
							<button
								key={filter.value}
								type='button'
								onClick={() => setPlanFilter(filter.value)}
								className={`h-8 rounded-md px-3 text-sm transition ${planFilter === filter.value ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
							>
								{filter.label}
								<span className={`ml-1.5 tabular-nums ${planFilter === filter.value ? 'text-zinc-300' : 'text-zinc-400'}`}>{counts[filter.value]}</span>
							</button>
						))}
					</div>
					<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)} aria-label='Filter by role' className='h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-700 outline-none'>
						<option value='all'>All roles</option>
						<option value='TRAVELER'>Travelers</option>
						<option value='GUIDE'>Guides</option>
						<option value='ADMIN'>Admins</option>
					</select>
				</div>
			</div>

			{!members ? (
				<div className='flex min-h-[40vh] items-center justify-center text-zinc-400'>
					<Loader2 className='h-5 w-5 animate-spin' aria-label='Loading' />
				</div>
			) : filtered.length === 0 ? (
				<p className='rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500'>No users match these filters.</p>
			) : (
				<>
					{/* desktop table */}
					<div className='hidden overflow-visible rounded-xl border border-zinc-200 bg-white md:block'>
						<table className='w-full text-left text-sm'>
							<thead>
								<tr className='border-b border-zinc-100 text-xs text-zinc-500'>
									<th className='px-5 py-3 font-medium'>User</th>
									<th className='px-3 py-3 font-medium'>Plan</th>
									<th className='px-3 py-3 font-medium'>Status</th>
									<th className='px-3 py-3 font-medium'>Role</th>
									<th className='px-3 py-3 text-right font-medium'>Trips</th>
									<th className='px-3 py-3 font-medium'>Joined</th>
									<th className='w-12 px-3 py-3' />
								</tr>
							</thead>
							<tbody className='divide-y divide-zinc-100'>
								{filtered.map((member) => (
									<tr key={member.id} className='hover:bg-zinc-50/60'>
										<td className='px-5 py-3'>
											<div className='flex items-center gap-3'>
												<Avatar name={member.name} src={member.avatarUrl} />
												<div className='min-w-0'>
													<p className='truncate font-medium text-zinc-900'>{member.name}</p>
													<p className='truncate text-xs text-zinc-500'>{member.email}</p>
												</div>
											</div>
										</td>
										<td className='px-3 py-3'>
											<PlanBadge member={member} />
											{planEnd(member) && <p className='mt-1 text-xs text-zinc-400'>{planEnd(member)}</p>}
										</td>
										<td className='px-3 py-3'>
											<StatusLabel lastSeenAt={member.lastSeenAt} />
											<p className='mt-0.5 text-xs text-zinc-400'>{relativeTime(member.lastSeenAt)}</p>
										</td>
										<td className='px-3 py-3 text-zinc-600'>{ROLE_LABEL[member.role]}</td>
										<td className='px-3 py-3 text-right tabular-nums text-zinc-600'>{member.trips}</td>
										<td className='px-3 py-3 text-zinc-600'>{formatDate(member.createdAt)}</td>
										<td className='px-3 py-3'>
											<PlanMenu member={member} busy={busyId === member.id} onAction={(body) => void changePlan(member, body)} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* mobile list */}
					<ul className='divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white md:hidden'>
						{filtered.map((member) => (
							<li key={member.id} className='flex items-start gap-3 p-4'>
								<Avatar name={member.name} src={member.avatarUrl} />
								<div className='min-w-0 flex-1'>
									<div className='flex items-center gap-2'>
										<p className='truncate text-sm font-medium text-zinc-900'>{member.name}</p>
										<PlanBadge member={member} />
									</div>
									<p className='truncate text-xs text-zinc-500'>{member.email}</p>
									<p className='mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500'>
										<span className='inline-flex items-center gap-1'>
											<span className={`h-1.5 w-1.5 rounded-full ${activityStatus(member.lastSeenAt).dot}`} />
											{activityStatus(member.lastSeenAt).label}
										</span>
										<span>· {ROLE_LABEL[member.role]}</span>
										<span>· {member.trips} trips</span>
										{planEnd(member) && <span>· {planEnd(member)}</span>}
									</p>
								</div>
								<PlanMenu member={member} busy={busyId === member.id} onAction={(body) => void changePlan(member, body)} />
							</li>
						))}
					</ul>
				</>
			)}
		</>
	)
}
