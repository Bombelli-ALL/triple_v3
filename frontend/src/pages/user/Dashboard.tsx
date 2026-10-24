import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowRight, Check, ChevronRight, Flame, Loader2, MapPin, Minus, Pencil, Plus, Users } from 'lucide-react'
import { ACCOUNT_SETTINGS_UPDATED_EVENT, loadAccountSettings } from '@/lib/accountSettings'
import { fetchGamificationOverview, type GamificationOverview } from '@/lib/gamification'
import {
	requestHeroPlanner,
	type HeroAgentResponse,
	type HeroPlannerRequest,
	type StoredHeroPlannerResult,
} from '@/lib/agent'
import {
	HERO_AGENT_NOTICE_KEY,
	HERO_LATEST_TRIP_ID_KEY,
	HERO_PENDING_MAP_OPEN_KEY,
	HERO_PLANNER_REQUEST_KEY,
	HERO_PLANNER_RESULT_KEY,
	HERO_PROMPT_CONTEXT_KEY,
	readHeroStorage,
	removeHeroStorage,
	writeHeroStorage,
} from '@/lib/heroGeneratedTrip'
import {
	getMyDashboard,
	listCities,
	saveMyPreferences,
	type CityOption,
	type MyDashboard,
	type TravelPreferences,
} from '@/lib/travelApi'
import { useAuthStore } from '@/stores/authStore'

const DAY_OPTIONS = [2, 3, 5, 7]
const BUDGET_OPTIONS = [1500, 3000, 6000, 10000]
const INTEREST_OPTIONS = ['Culture', 'Food', 'History', 'Nature', 'Shopping', 'Beach', 'Nightlife', 'Adventure', 'Relax']
// Suggested alongside the cities already in the database; any real Moroccan city can be typed
const POPULAR_CITIES = ['Marrakech', 'Casablanca', 'Fez', 'Rabat', 'Tangier', 'Agadir', 'Chefchaouen', 'Essaouira', 'Merzouga', 'Tetouan', 'Ouarzazate', 'Meknes', 'Ifrane', 'Dakhla', 'El Jadida', 'Asilah']

// Suggested split of a trip budget; shown as a guide, not as booked prices
const BUDGET_SPLIT = [
	{ label: 'Stay', share: 0.4, color: 'bg-zinc-900' },
	{ label: 'Food', share: 0.25, color: 'bg-orange-500' },
	{ label: 'Activities', share: 0.2, color: 'bg-orange-300' },
	{ label: 'Transport', share: 0.15, color: 'bg-zinc-300' },
] as const

function formatDh(value: number) {
	return `${Math.round(value).toLocaleString()} DH`
}

function greeting() {
	const hour = new Date().getHours()
	if (hour < 12) return 'Good morning'
	if (hour < 18) return 'Good afternoon'
	return 'Good evening'
}

function readStoredHeroContext(): Partial<TravelPreferences> | null {
	const raw = readHeroStorage(HERO_PROMPT_CONTEXT_KEY)
	if (!raw) return null
	try {
		const parsed = JSON.parse(raw) as { city?: string; durationDays?: number | null; budgetDh?: number | null }
		return { city: parsed.city, durationDays: parsed.durationDays ?? undefined, budgetDh: parsed.budgetDh ?? null }
	} catch {
		return null
	}
}

/* ── building blocks ─────────────────────────────────────────── */

function Panel({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
	return (
		<section className={`rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 ${className}`}>
			{(title || action) && (
				<div className='mb-4 flex items-center justify-between gap-3'>
					{title && <h2 className='text-[15px] font-semibold text-zinc-900'>{title}</h2>}
					{action}
				</div>
			)}
			{children}
		</section>
	)
}

function TextLink({ to, children }: { to: string; children: React.ReactNode }) {
	return (
		<Link to={to} className='inline-flex items-center gap-0.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900'>
			{children}
			<ChevronRight className='h-4 w-4' />
		</Link>
	)
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
	return (
		<button
			type='button'
			onClick={onClick}
			aria-pressed={active}
			className={`h-9 rounded-full border px-3.5 text-sm transition ${active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'}`}
		>
			{children}
		</button>
	)
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
	return (
		<div className='flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-3 py-2 sm:justify-start'>
			<span className='text-sm text-zinc-600'>{label}</span>
			<div className='flex items-center gap-2'>
				<button type='button' onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`} className='flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 disabled:opacity-40'>
					<Minus className='h-3.5 w-3.5' />
				</button>
				<span className='w-5 text-center text-sm font-semibold tabular-nums'>{value}</span>
				<button type='button' onClick={() => onChange(Math.min(20, value + 1))} aria-label={`More ${label.toLowerCase()}`} className='flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-700'>
					<Plus className='h-3.5 w-3.5' />
				</button>
			</div>
		</div>
	)
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
	return (
		<div className='mb-2.5'>
			<p className='text-sm font-medium text-zinc-900'>{children}</p>
			{hint && <p className='mt-0.5 text-xs text-zinc-500'>{hint}</p>}
		</div>
	)
}

/* ── trip form ───────────────────────────────────────────────── */

function TripForm({
	initial,
	cities,
	onSaved,
	onCancel,
}: {
	initial: Partial<TravelPreferences> | null
	cities: CityOption[]
	onSaved: (preferences: TravelPreferences) => void
	onCancel?: () => void
}) {
	const [city, setCity] = useState(initial?.city ?? '')
	const [durationDays, setDurationDays] = useState(initial?.durationDays ?? 3)
	const [budgetDh, setBudgetDh] = useState<string>(initial?.budgetDh != null ? String(initial.budgetDh) : '')
	const [adults, setAdults] = useState(initial?.adults ?? 1)
	const [children, setChildren] = useState(initial?.children ?? 0)
	const [interests, setInterests] = useState<string[]>(initial?.interests ?? [])
	const [saving, setSaving] = useState(false)

	const cityNames = useMemo(() => {
		const names = new Map<string, string>()
		;[...POPULAR_CITIES, ...cities.map((option) => option.name)].forEach((name) => {
			if (!names.has(name.toLowerCase())) names.set(name.toLowerCase(), name)
		})
		return Array.from(names.values())
	}, [cities])

	const toggleInterest = (interest: string) =>
		setInterests((prev) => (prev.includes(interest) ? prev.filter((entry) => entry !== interest) : [...prev, interest]))

	const submit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (!city.trim() || saving) return
		const budget = Number(budgetDh)
		const preferences: TravelPreferences = {
			city: city.trim(),
			durationDays,
			budgetDh: budgetDh.trim() && Number.isFinite(budget) && budget > 0 ? budget : null,
			adults,
			children,
			interests,
		}
		try {
			setSaving(true)
			const { data } = await saveMyPreferences(preferences)
			onSaved(data)
		} catch (error) {
			console.error('Saving preferences failed:', error)
			toast.error('Could not save your trip. Please try again.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<form onSubmit={submit} className='rounded-2xl border border-zinc-200 bg-white'>
			<div className='border-b border-zinc-100 p-5 sm:p-7'>
				<h2 className='text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl'>{initial?.city ? 'Edit your trip' : 'Plan your trip'}</h2>
				<p className='mt-1 text-sm text-zinc-500'>Tell us where you're going. Your dashboard, budget and days are built from this.</p>
			</div>

			<div className='grid grid-cols-[minmax(0,1fr)] gap-7 p-5 sm:p-7 lg:grid-cols-2 lg:gap-x-10'>
				<div className='lg:col-span-2'>
					<FieldLabel hint='Pick one or type any city in Morocco'>Destination</FieldLabel>
					<input
						list='dashboard-cities'
						value={city}
						onChange={(event) => setCity(event.target.value)}
						placeholder='Where to?'
						required
						className='h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[15px] outline-none transition focus:border-zinc-900'
					/>
					<datalist id='dashboard-cities'>
						{cityNames.map((name) => (
							<option key={name} value={name} />
						))}
					</datalist>
					<div className='mt-3 flex flex-wrap gap-2'>
						{cityNames.slice(0, 16).map((name) => (
							<div key={name}>
								<Chip active={city.toLowerCase() === name.toLowerCase()} onClick={() => setCity(name)}>
									{name}
								</Chip>
							</div>
						))}
					</div>
				</div>

				<div>
					<FieldLabel>Length of stay</FieldLabel>
					<div className='flex flex-wrap items-center gap-2'>
						{DAY_OPTIONS.map((days) => (
							<Chip key={days} active={durationDays === days} onClick={() => setDurationDays(days)}>
								{days} days
							</Chip>
						))}
						<label className='flex h-9 items-center gap-2 rounded-full border border-zinc-200 pl-3.5 pr-1 text-sm text-zinc-500'>
							Other
							<input
								type='number'
								min={1}
								max={30}
								value={durationDays}
								onChange={(event) => setDurationDays(Math.max(1, Math.min(30, Number(event.target.value) || 1)))}
								aria-label='Number of days'
								className='h-7 w-12 rounded-full bg-zinc-100 text-center text-zinc-900 outline-none'
							/>
						</label>
					</div>
				</div>

				<div>
					<FieldLabel hint='For the whole trip, all travelers'>Budget</FieldLabel>
					<div className='flex flex-wrap items-center gap-2'>
						{BUDGET_OPTIONS.map((budget) => (
							<Chip key={budget} active={Number(budgetDh) === budget} onClick={() => setBudgetDh(String(budget))}>
								{budget.toLocaleString()} DH
							</Chip>
						))}
						<input
							type='number'
							min={0}
							inputMode='numeric'
							value={BUDGET_OPTIONS.includes(Number(budgetDh)) ? '' : budgetDh}
							onChange={(event) => setBudgetDh(event.target.value)}
							placeholder='Other amount'
							aria-label='Total budget in dirhams'
							className='h-9 w-36 rounded-full border border-zinc-200 px-3.5 text-sm outline-none focus:border-zinc-900'
						/>
					</div>
				</div>

				<div>
					<FieldLabel>Who's going</FieldLabel>
					<div className='grid gap-2 sm:flex sm:flex-wrap'>
						<Stepper label='Adults' value={adults} min={1} onChange={setAdults} />
						<Stepper label='Children' value={children} min={0} onChange={setChildren} />
					</div>
				</div>

				<div>
					<FieldLabel hint='Optional'>What you enjoy</FieldLabel>
					<div className='flex flex-wrap gap-2'>
						{INTEREST_OPTIONS.map((interest) => (
							<Chip key={interest} active={interests.includes(interest)} onClick={() => toggleInterest(interest)}>
								{interest}
							</Chip>
						))}
					</div>
				</div>
			</div>

			<div className='flex flex-col-reverse gap-2 border-t border-zinc-100 p-5 sm:flex-row sm:justify-end sm:p-7'>
				{onCancel && (
					<button type='button' onClick={onCancel} className='h-11 rounded-xl px-5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100'>
						Cancel
					</button>
				)}
				<button type='submit' disabled={saving || !city.trim()} className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50'>
					{saving && <Loader2 className='h-4 w-4 animate-spin' />}
					{saving ? 'Finding places…' : 'Save trip'}
				</button>
			</div>
		</form>
	)
}

/* ── dashboard sections ──────────────────────────────────────── */

function TripHeader({ dashboard, preferences, onEdit, onPlan }: { dashboard: MyDashboard; preferences: TravelPreferences; onEdit: () => void; onPlan: () => void }) {
	const travelers = preferences.adults + preferences.children
	const plan = dashboard.latestTrip?.matchesDestination ? dashboard.latestTrip : null
	const steps = [
		{ label: 'Destination', done: true },
		{ label: 'Dates', done: true },
		{ label: 'Budget', done: preferences.budgetDh != null },
		{ label: 'Itinerary', done: Boolean(plan) },
		{ label: 'Bookings', done: dashboard.stats.bookings > 0 },
	]
	const doneCount = steps.filter((step) => step.done).length
	const cover = dashboard.city?.coverImage || dashboard.places.find((place) => place.coverImage)?.coverImage

	return (
		<section className='overflow-hidden rounded-2xl border border-zinc-200 bg-white'>
			<div className='grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'>
				<div className='relative h-44 bg-zinc-100 sm:h-56 md:h-auto md:min-h-64'>
					{cover && <img src={cover} alt={preferences.city} className='absolute inset-0 h-full w-full object-cover' />}
				</div>

				<div className='flex flex-col p-5 sm:p-7'>
					<p className='text-sm text-zinc-500'>Your next trip</p>
					<h2 className='mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl'>{preferences.city}</h2>
					<p className='mt-2 text-sm text-zinc-600'>
						{preferences.durationDays} {preferences.durationDays === 1 ? 'day' : 'days'} · {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
						{preferences.budgetDh != null && ` · ${formatDh(preferences.budgetDh)}`}
					</p>
					{preferences.interests.length > 0 && <p className='mt-1 text-sm text-zinc-400'>{preferences.interests.join(', ')}</p>}

					<div className='mt-6'>
						<div className='mb-2 flex items-center justify-between text-sm'>
							<span className='font-medium text-zinc-900'>Trip setup</span>
							<span className='tabular-nums text-zinc-500'>
								{doneCount} of {steps.length}
							</span>
						</div>
						<div className='flex gap-1'>
							{steps.map((step) => (
								<div key={step.label} className={`h-1.5 flex-1 rounded-full ${step.done ? 'bg-orange-500' : 'bg-zinc-200'}`} />
							))}
						</div>
						<ul className='mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3'>
							{steps.map((step) => (
								<li key={step.label} className={`flex items-center gap-1.5 ${step.done ? 'text-zinc-700' : 'text-zinc-400'}`}>
									{step.done ? <Check className='h-3.5 w-3.5 text-orange-500' /> : <span className='h-1.5 w-1.5 rounded-full bg-zinc-300' />}
									{step.label}
								</li>
							))}
						</ul>
					</div>

					<div className='mt-6 flex flex-col gap-2 sm:mt-auto sm:flex-row sm:pt-6'>
						{plan ? (
							<Link to={`/user/trip-plan?trip=${encodeURIComponent(plan.id)}`} className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600'>
								Open itinerary <ArrowRight className='h-4 w-4' />
							</Link>
						) : (
							<button type='button' onClick={onPlan} className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600'>
								Build my itinerary <ArrowRight className='h-4 w-4' />
							</button>
						)}
						<button type='button' onClick={onEdit} className='inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50'>
							<Pencil className='h-4 w-4' /> Edit trip
						</button>
					</div>
				</div>
			</div>
		</section>
	)
}

function Stats({ stats }: { stats: MyDashboard['stats'] }) {
	const items = [
		{ label: 'Saved trips', value: stats.trips, to: '/user/history' },
		{ label: 'Planned days', value: stats.plannedDays, to: '/user/history' },
		{ label: 'Groups', value: stats.groups, to: '/user/groups' },
		{ label: 'Bookings', value: stats.bookings, to: '/user/trips' },
	]
	return (
		<div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
			{items.map((item) => (
				<Link key={item.label} to={item.to} className='rounded-2xl border border-zinc-200 bg-white px-4 py-4 transition hover:border-zinc-300 sm:px-5'>
					<p className='text-2xl font-semibold tabular-nums tracking-tight text-zinc-900'>{item.value}</p>
					<p className='mt-1 text-sm text-zinc-500'>{item.label}</p>
				</Link>
			))}
		</div>
	)
}

function Itinerary({ dashboard, preferences, onPlan }: { dashboard: MyDashboard; preferences: TravelPreferences; onPlan: () => void }) {
	const trip = dashboard.latestTrip?.matchesDestination ? dashboard.latestTrip : null
	const itemsByDay = new Map<number, string[]>()
	trip?.items.forEach((item) => itemsByDay.set(item.day, [...(itemsByDay.get(item.day) ?? []), item.title]))
	const totalDays = Math.max(preferences.durationDays, ...Array.from(itemsByDay.keys()), 1)
	const perDay = preferences.budgetDh != null ? preferences.budgetDh / preferences.durationDays : null

	return (
		<Panel title='Itinerary' action={trip ? <TextLink to={`/user/trip-plan?trip=${encodeURIComponent(trip.id)}`}>Full plan</TextLink> : undefined}>
			<ol className='relative'>
				{Array.from({ length: totalDays }, (_, index) => index + 1).map((day, index) => {
					const stops = itemsByDay.get(day) ?? []
					const isLast = index === totalDays - 1
					return (
						<li key={day} className='relative flex gap-4 pb-5 last:pb-0'>
							{!isLast && <span className='absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-zinc-200' aria-hidden />}
							<span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${stops.length ? 'bg-orange-500 text-white' : 'border border-zinc-200 bg-white text-zinc-500'}`}>{day}</span>
							<div className='min-w-0 flex-1 pt-1'>
								<div className='flex items-baseline justify-between gap-3'>
									<p className='text-sm font-medium text-zinc-900'>Day {day}</p>
									{perDay != null && <p className='shrink-0 text-xs tabular-nums text-zinc-400'>{formatDh(perDay)}</p>}
								</div>
								<p className={`mt-0.5 text-sm ${stops.length ? 'text-zinc-600' : 'text-zinc-400'}`}>{stops.length ? stops.slice(0, 4).join(' · ') : 'Nothing planned yet'}</p>
							</div>
						</li>
					)
				})}
			</ol>
			{!trip && (
				<button type='button' onClick={onPlan} className='mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-900 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white'>
					Fill my {preferences.durationDays} days in {preferences.city}
				</button>
			)}
		</Panel>
	)
}

function Budget({ preferences, onEdit }: { preferences: TravelPreferences; onEdit: () => void }) {
	if (preferences.budgetDh == null) {
		return (
			<Panel title='Budget'>
				<p className='text-sm text-zinc-500'>Add a budget to see what you can spend each day.</p>
				<button type='button' onClick={onEdit} className='mt-3 text-sm font-medium text-orange-600 hover:text-orange-700'>
					Add a budget
				</button>
			</Panel>
		)
	}
	const travelers = Math.max(1, preferences.adults + preferences.children)
	const total = preferences.budgetDh
	const perDay = total / preferences.durationDays

	return (
		<Panel title='Budget'>
			<p className='text-3xl font-semibold tabular-nums tracking-tight text-zinc-900'>{formatDh(total)}</p>
			<p className='mt-1 text-sm text-zinc-500'>
				{formatDh(perDay)} a day · {formatDh(perDay / travelers)} per person
			</p>

			<div className='mt-5 flex h-2.5 overflow-hidden rounded-full'>
				{BUDGET_SPLIT.map((part) => (
					<div key={part.label} className={part.color} style={{ width: `${part.share * 100}%` }} />
				))}
			</div>
			<ul className='mt-4 space-y-2.5'>
				{BUDGET_SPLIT.map((part) => (
					<li key={part.label} className='flex items-center justify-between text-sm'>
						<span className='flex items-center gap-2 text-zinc-600'>
							<span className={`h-2.5 w-2.5 rounded-full ${part.color}`} />
							{part.label}
						</span>
						<span className='tabular-nums text-zinc-900'>{formatDh(total * part.share)}</span>
					</li>
				))}
			</ul>
			<p className='mt-4 text-xs text-zinc-400'>A suggested split. Adjust it as you book.</p>
		</Panel>
	)
}

function Progress({ overview }: { overview: GamificationOverview }) {
	const { summary } = overview
	const nextQuests = overview.quests.filter((quest) => quest.status !== 'completed').slice(0, 3)

	return (
		<Panel title='Your progress' action={<TextLink to='/user/leaderboard'>Leaderboard</TextLink>}>
			<div className='grid grid-cols-3 divide-x divide-zinc-100 rounded-xl bg-zinc-50 py-3 text-center'>
				<div>
					<p className='text-lg font-semibold tabular-nums text-zinc-900'>{summary.totalXp}</p>
					<p className='text-xs text-zinc-500'>points</p>
				</div>
				<div className='px-1'>
					<p className='truncate text-sm font-semibold leading-7 text-zinc-900'>{summary.rankLabel}</p>
					<p className='text-xs text-zinc-500'>level</p>
				</div>
				<div>
					<p className='flex items-center justify-center gap-1 text-lg font-semibold tabular-nums text-zinc-900'>
						<Flame className='h-4 w-4 text-orange-500' />
						{summary.streakDays}
					</p>
					<p className='text-xs text-zinc-500'>day streak</p>
				</div>
			</div>

			{nextQuests.length > 0 && (
				<ul className='mt-4 divide-y divide-zinc-100'>
					{nextQuests.map((quest) => (
						<li key={quest.id}>
							<Link to={quest.href} className='group flex items-center gap-3 py-3'>
								<div className='min-w-0 flex-1'>
									<p className='truncate text-sm font-medium text-zinc-900'>{quest.title}</p>
									<div className='mt-2 h-1 overflow-hidden rounded-full bg-zinc-100'>
										<div className='h-full rounded-full bg-orange-500' style={{ width: `${quest.progress}%` }} />
									</div>
								</div>
								<span className='shrink-0 text-xs tabular-nums text-zinc-400'>+{quest.xp}</span>
								<ChevronRight className='h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-zinc-600' />
							</Link>
						</li>
					))}
				</ul>
			)}
		</Panel>
	)
}

const PLACE_TABS = [
	{ value: 'all', label: 'All' },
	{ value: 'sights', label: 'Sights' },
	{ value: 'culture', label: 'Culture' },
	{ value: 'nature', label: 'Nature' },
	{ value: 'food', label: 'Food' },
	{ value: 'cafe', label: 'Cafés' },
] as const

function Places({ dashboard, preferences }: { dashboard: MyDashboard; preferences: TravelPreferences }) {
	const [tab, setTab] = useState<(typeof PLACE_TABS)[number]['value']>('all')
	const cityName = dashboard.city?.name ?? preferences.city
	const tabs = PLACE_TABS.filter((entry) => entry.value === 'all' || dashboard.places.some((place) => (place.category ?? 'sights') === entry.value))
	const shown = tab === 'all' ? dashboard.places.slice(0, 12) : dashboard.places.filter((place) => (place.category ?? 'sights') === tab)

	return (
		<Panel title={`Places in ${cityName}`} action={dashboard.places.length ? <TextLink to='/user/spots'>See all</TextLink> : undefined}>
			{dashboard.places.length ? (
				<>
					{tabs.length > 2 && (
						<div className='mb-4 flex flex-wrap gap-2'>
							{tabs.map((entry) => (
								<div key={entry.value}>
									<Chip active={tab === entry.value} onClick={() => setTab(entry.value)}>
										{entry.label}
									</Chip>
								</div>
							))}
						</div>
					)}
					<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'>
						{shown.map((place) => (
							<article key={place.id} className='min-w-0'>
								<div className='aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100'>
									{place.coverImage ? (
										<img src={place.coverImage} alt={place.name} loading='lazy' className='h-full w-full object-cover' />
									) : (
										<div className='flex h-full items-center justify-center text-zinc-300'>
											<MapPin className='h-6 w-6' />
										</div>
									)}
								</div>
								<p className='mt-2 truncate text-sm font-medium text-zinc-900'>{place.name}</p>
								<p className='truncate text-xs text-zinc-500'>{[place.type, place.avgPrice != null ? `~${formatDh(place.avgPrice)}` : null].filter(Boolean).join(' · ')}</p>
							</article>
						))}
					</div>
				</>
			) : (
				<p className='text-sm text-zinc-500'>We couldn't find “{preferences.city}” as a city in Morocco. Check the spelling in Edit trip.</p>
			)}
		</Panel>
	)
}

/* ── page ────────────────────────────────────────────────────── */

export default function UserDashboard() {
	useTranslation()
	const { user } = useAuthStore()
	const navigate = useNavigate()

	const [dashboard, setDashboard] = useState<MyDashboard | null>(null)
	const [overview, setOverview] = useState<GamificationOverview | null>(null)
	const [cities, setCities] = useState<CityOption[]>([])
	const [loading, setLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [editing, setEditing] = useState(false)
	const [gamificationEnabled, setGamificationEnabled] = useState(true)
	const [plannerResult, setPlannerResult] = useState<StoredHeroPlannerResult | null>(() => {
		const raw = readHeroStorage(HERO_PLANNER_RESULT_KEY)
		if (!raw) return null
		try {
			return JSON.parse(raw) as StoredHeroPlannerResult
		} catch {
			return null
		}
	})

	const loadDashboard = useCallback(async () => {
		try {
			setLoadError(null)
			const [{ data }, gamification] = await Promise.all([getMyDashboard(), fetchGamificationOverview().catch(() => null)])
			setDashboard(data)
			setOverview(gamification)
		} catch (error) {
			console.error('Loading dashboard failed:', error)
			setLoadError('Could not load your dashboard. Please refresh the page.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadDashboard()
		listCities({ limit: 50 })
			.then(({ data }) => setCities(Array.isArray(data) ? data : (data.items ?? data.data ?? [])))
			.catch(() => setCities([]))
	}, [loadDashboard, user?.id])

	// A trip request started on the home page before login is finished here
	useEffect(() => {
		const rawPlannerRequest = readHeroStorage(HERO_PLANNER_REQUEST_KEY)
		if (!rawPlannerRequest || plannerResult) return

		let cancelled = false
		const hydratePendingPlanner = async () => {
			try {
				const request = JSON.parse(rawPlannerRequest) as HeroPlannerRequest
				if (!request.ownerUserId && user?.id) request.ownerUserId = user.id
				const { data } = await requestHeroPlanner<HeroAgentResponse>(request)
				if (cancelled) return

				const nextResult: StoredHeroPlannerResult = { request, response: data, generatedAt: new Date().toISOString() }
				writeHeroStorage(HERO_PLANNER_RESULT_KEY, JSON.stringify(nextResult))
				removeHeroStorage(HERO_PLANNER_REQUEST_KEY)
				const tripAction = data.actions?.find((action) => action.payload?.tripId)
				if (tripAction?.payload?.tripId) {
					const tripId = String(tripAction.payload.tripId)
					writeHeroStorage(HERO_LATEST_TRIP_ID_KEY, tripId)
					navigate(`/user/maps?trip=${encodeURIComponent(tripId)}`, { replace: true })
					return
				}
				writeHeroStorage(HERO_PENDING_MAP_OPEN_KEY, 'true')
				writeHeroStorage(HERO_AGENT_NOTICE_KEY, data.answer || 'Got it. I’m building your agenda now.')
				window.dispatchEvent(new CustomEvent('hero-planner-ready'))
				setPlannerResult(nextResult)
			} catch {
				if (cancelled) return
				writeHeroStorage(HERO_PENDING_MAP_OPEN_KEY, 'true')
				removeHeroStorage(HERO_PLANNER_REQUEST_KEY)
			}
		}

		void hydratePendingPlanner()
		return () => {
			cancelled = true
		}
	}, [navigate, plannerResult, user?.id])

	useEffect(() => {
		const syncGamificationPreference = () => setGamificationEnabled(loadAccountSettings().gamificationEnabled)
		syncGamificationPreference()
		window.addEventListener('storage', syncGamificationPreference)
		window.addEventListener(ACCOUNT_SETTINGS_UPDATED_EVENT, syncGamificationPreference)
		return () => {
			window.removeEventListener('storage', syncGamificationPreference)
			window.removeEventListener(ACCOUNT_SETTINGS_UPDATED_EVENT, syncGamificationPreference)
		}
	}, [])

	const preferences = dashboard?.preferences ?? null
	const formInitial = useMemo(() => preferences ?? readStoredHeroContext(), [preferences])
	const firstName = user?.name?.split(' ')[0]

	const handleSaved = (saved: TravelPreferences) => {
		toast.success(`Trip to ${saved.city} saved`)
		setEditing(false)
		setLoading(true)
		void loadDashboard()
	}

	const buildItinerary = () => {
		if (!preferences) return
		navigate('/user/trip-plan', {
			state: { city: preferences.city, durationDays: preferences.durationDays, budgetDh: preferences.budgetDh },
		})
	}

	if (loading) {
		return (
			<div className='flex min-h-[60vh] items-center justify-center text-zinc-400'>
				<Loader2 className='h-5 w-5 animate-spin' aria-label='Loading' />
			</div>
		)
	}

	const showForm = !preferences || editing

	return (
		<div className='mx-auto w-full max-w-6xl md:pb-10'>
			<header className='mb-6 flex flex-col gap-1 sm:mb-8'>
				<h1 className='text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl'>
					{greeting()}
					{firstName ? `, ${firstName}` : ''}
				</h1>
				<p className='text-sm text-zinc-500 sm:text-[15px]'>{preferences && !editing ? `Here's where your ${preferences.city} trip stands.` : 'Start by telling us about your trip.'}</p>
			</header>

			{loadError && <p className='mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'>{loadError}</p>}

			{showForm && <TripForm initial={formInitial} cities={cities} onSaved={handleSaved} onCancel={preferences ? () => setEditing(false) : undefined} />}

			{dashboard && preferences && !editing && (
				<div className='space-y-4 sm:space-y-5'>
					<TripHeader dashboard={dashboard} preferences={preferences} onEdit={() => setEditing(true)} onPlan={buildItinerary} />
					<Stats stats={dashboard.stats} />

					<div className='grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start'>
						<Itinerary dashboard={dashboard} preferences={preferences} onPlan={buildItinerary} />
						<div className='space-y-4 sm:space-y-5'>
							<Budget preferences={preferences} onEdit={() => setEditing(true)} />
							{gamificationEnabled && overview && <Progress overview={overview} />}
						</div>
					</div>

					<Places dashboard={dashboard} preferences={preferences} />

					<Link to='/user/groups' className='flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 sm:p-5'>
						<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700'>
							<Users className='h-5 w-5' />
						</span>
						<div className='min-w-0 flex-1'>
							<p className='text-sm font-medium text-zinc-900'>Travel with others</p>
							<p className='truncate text-sm text-zinc-500'>Find groups heading to {preferences.city}</p>
						</div>
						<ChevronRight className='h-4 w-4 shrink-0 text-zinc-400' />
					</Link>
				</div>
			)}
		</div>
	)
}
