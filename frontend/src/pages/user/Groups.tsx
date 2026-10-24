import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, CalendarDays, Check, ChevronRight, Crown, LoaderCircle, MapPin, MessageCircleMore, Pencil, Plus, Shield, Trash2, UserMinus, UserPlus, X } from 'lucide-react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { cancelPublicGroupJoin, createGroup, deleteGroup, getPublicGroup, joinPublicGroup, listCities, listCurrentUserGroups, listIncomingGroupRequests, listManagedGroups, listPublicGroups, removeGroupMember, reviewGroupMembership, updateGroup, updateGroupMemberRole, type CityOption, type CreateGroupPayload, type GroupDetail, type GroupMatch, type GroupMembership, type GroupMembershipRole, type IncomingGroupRequest } from '@/lib/travelApi'

type TabKey = 'discover' | 'mine' | 'manage'

type GroupCard = {
	id: string
	title: string
	description: string
	image: string
	cityId: string
	cityName: string
	startDate: string
	endDate: string
	capacity: number
	memberCount: number
	availableSpots: number
	budgetMin: number
	budgetMax: number
	viewerStatus?: 'PENDING' | 'MEMBER' | 'REJECTED' | null
	viewerRole?: GroupMembershipRole | null
	requestCount?: number
	score?: number
	source: TabKey
}

const fallbackImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80'
const coverOutputWidth = 1440
const coverOutputHeight = 720
const springEase = [0.22, 1, 0.36, 1] as const
const springTransition = { duration: 0.34, ease: springEase }
const BOTTOM_NAV_VISIBILITY_EVENT = 'trippple:bottom-nav-visibility'

const emptyForm: CreateGroupPayload = {
	cityId: '',
	title: '',
	description: '',
	coverImage: '',
	startDate: '',
	endDate: '',
	capacity: 6,
	budgetMin: 200,
	budgetMax: 1200,
}

const createDefaultForm = (): CreateGroupPayload => {
	const start = new Date()
	start.setMinutes(0, 0, 0)
	start.setHours(start.getHours() + 2)
	const end = new Date(start)
	end.setDate(end.getDate() + 2)
	return {
		...emptyForm,
		startDate: start.toISOString().slice(0, 16),
		endDate: end.toISOString().slice(0, 16),
	}
}

const formatDateRange = (startDate: string, endDate: string) =>
	`${new Date(startDate).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	})} - ${new Date(endDate).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})}`

const formatMoneyRange = (min: number, max: number) => `${min} to ${max} MAD`

const toCardFromMatch = (group: GroupMatch): GroupCard => ({
	id: group.groupId,
	title: group.title,
	description: group.description || `Travel with people heading to ${group.cityName}.`,
	image: group.coverImage || fallbackImage,
	cityId: group.cityId,
	cityName: group.cityName,
	startDate: group.startDate,
	endDate: group.endDate,
	capacity: group.capacity,
	memberCount: group.memberCount ?? 0,
	availableSpots: group.availableSpots ?? 0,
	budgetMin: group.budgetMin,
	budgetMax: group.budgetMax,
	score: group.score,
	source: 'discover',
})

const toCardFromMembership = (membership: GroupMembership): GroupCard => ({
	id: membership.group.id,
	title: membership.group.title,
	description: membership.group.description || `Shared itinerary in ${membership.group.city.name}.`,
	image: membership.group.coverImage || membership.group.city.coverImage || fallbackImage,
	cityId: membership.group.city.id,
	cityName: membership.group.city.name,
	startDate: membership.group.startDate,
	endDate: membership.group.endDate,
	capacity: membership.group.capacity,
	memberCount: membership.group.memberCount,
	availableSpots: membership.group.availableSpots,
	budgetMin: membership.group.budgetMin,
	budgetMax: membership.group.budgetMax,
	viewerStatus: membership.status,
	viewerRole: membership.role,
	source: 'mine',
})

const toCardFromManaged = (group: GroupDetail): GroupCard => ({
	id: group.id,
	title: group.title,
	description: group.description || `Manage your group heading to ${group.city.name}.`,
	image: group.coverImage || group.city.coverImage || fallbackImage,
	cityId: group.city.id,
	cityName: group.city.name,
	startDate: group.startDate,
	endDate: group.endDate,
	capacity: group.capacity,
	memberCount: group.memberCount,
	availableSpots: group.availableSpots,
	budgetMin: group.budgetMin,
	budgetMax: group.budgetMax,
	viewerStatus: group.viewerStatus,
	viewerRole: group.viewerRole,
	requestCount: group.pendingRequests.length,
	source: 'manage',
})

const toCardFromDetail = (group: GroupDetail, source: TabKey = 'discover'): GroupCard => ({
	id: group.id,
	title: group.title,
	description: group.description || `Shared itinerary in ${group.city.name}.`,
	image: group.coverImage || group.city.coverImage || fallbackImage,
	cityId: group.city.id,
	cityName: group.city.name,
	startDate: group.startDate,
	endDate: group.endDate,
	capacity: group.capacity,
	memberCount: group.memberCount,
	availableSpots: group.availableSpots,
	budgetMin: group.budgetMin,
	budgetMax: group.budgetMax,
	viewerStatus: group.viewerStatus,
	viewerRole: group.viewerRole,
	requestCount: group.pendingRequests.length,
	source,
})

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const loadImage = (src: string) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = reject
		image.src = src
	})

const buildCoverImage = async (src: string, zoom: number, offsetX: number, offsetY: number) => {
	const image = await loadImage(src)
	const canvas = document.createElement('canvas')
	canvas.width = coverOutputWidth
	canvas.height = coverOutputHeight
	const context = canvas.getContext('2d')
	if (!context) return src

	const baseScale = Math.max(canvas.width / image.width, canvas.height / image.height)
	const scale = baseScale * zoom
	const drawWidth = image.width * scale
	const drawHeight = image.height * scale
	const overflowX = Math.max(drawWidth - canvas.width, 0)
	const overflowY = Math.max(drawHeight - canvas.height, 0)
	const x = -overflowX * ((offsetX + 100) / 200)
	const y = -overflowY * ((offsetY + 100) / 200)

	context.clearRect(0, 0, canvas.width, canvas.height)
	context.drawImage(image, x, y, drawWidth, drawHeight)
	return canvas.toDataURL('image/jpeg', 0.88)
}

const mergeViewerState = (group: GroupDetail, fallback?: { viewerStatus?: GroupCard['viewerStatus']; viewerRole?: GroupCard['viewerRole'] | null }): GroupDetail => ({
	...group,
	viewerStatus: group.viewerStatus ?? fallback?.viewerStatus ?? null,
	viewerRole: group.viewerRole ?? fallback?.viewerRole ?? null,
})

type GroupFormModalProps = {
	title: string
	subtitle: string
	cities: CityOption[]
	value: CreateGroupPayload
	submitLabel: string
	onChange: (next: CreateGroupPayload) => void
	onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
	onClose: () => void
	onSubmit: () => void
	isSaving: boolean
	coverSource: string
	coverFileName: string
	coverZoom: number
	coverOffsetX: number
	coverOffsetY: number
	onCoverZoomChange: (value: number) => void
	onCoverOffsetXChange: (value: number) => void
	onCoverOffsetYChange: (value: number) => void
	onCoverClear: () => void
}

function GroupFormModal({ title, subtitle, cities, value, submitLabel, onChange, onFileChange, onClose, onSubmit, isSaving, coverSource, coverFileName, coverZoom, coverOffsetX, coverOffsetY, onCoverZoomChange, onCoverOffsetXChange, onCoverOffsetYChange, onCoverClear }: GroupFormModalProps) {
	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className='fixed inset-0 z-[120] flex items-end justify-center px-0 sm:px-4 lg:pl-[17.5rem] lg:pr-6'>
			<motion.button type='button' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} onClick={onClose} className='absolute inset-0 bg-black/45 backdrop-blur-md' aria-label='Close group form' />
			<motion.div initial={{ y: 44, opacity: 0.98 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 32, opacity: 0.98 }} transition={springTransition} className='relative z-10 flex flex-col w-full max-h-[calc(100dvh-4.5rem)] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_80px_rgba(17,24,39,0.22)] sm:max-h-[calc(100dvh-5rem)] sm:max-w-265 sm:rounded-[30px] sm:border sm:border-white/70'>
				<div className='pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-2.5 sm:pt-3'>
					<div className='h-1.5 w-11 rounded-full bg-zinc-300/90' />
				</div>

				<div className='relative overflow-hidden border-b border-zinc-100 px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8'>
					<div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),transparent_55%)]' />
					<div className='relative flex items-start justify-between gap-4'>
						<div>
							<span className='inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600'>Group form</span>
							<h3 className='mt-3 text-xl font-semibold text-zinc-950 sm:text-2xl'>{title}</h3>
							<p className='mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500'>{subtitle}</p>
						</div>
						<motion.button whileHover={{ rotate: 90, scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={onClose} className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200'>
							<X className='h-4 w-4' />
						</motion.button>
					</div>
				</div>

				<div className='flex-1 grid min-h-0 max-h-full content-start gap-4 overflow-y-auto px-5 py-5 sm:px-6 md:grid-cols-2'>
					<label className='block'>
						<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>City</span>
						<select value={value.cityId} onChange={(event) => onChange({ ...value, cityId: event.target.value })} className='h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100'>
							<option value=''>Select a city</option>
							{cities.map((city) => (
								<option key={city.id} value={city.id}>
									{city.name}
								</option>
							))}
						</select>
					</label>

					<label className='block'>
						<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>Title</span>
						<input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} className='h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' placeholder='Casablanca food weekend' />
					</label>

					<label className='block md:col-span-2'>
						<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>Description</span>
						<textarea value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} rows={4} className='w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' placeholder='Who this group is for, what the vibe is, and what people should expect.' />
					</label>

					<label className='block md:col-span-2'>
						<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>Cover image</span>
						<div className='rounded-2xl border border-zinc-200 bg-white p-3'>
							<input type='file' accept='image/*' onChange={onFileChange} className='block w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800' />
							<p className='mt-2 text-xs text-zinc-500'>Choose an image, then frame it before saving.</p>
							{coverSource ? (
								<div className='mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3'>
									<div className='mb-2 flex items-center justify-between gap-3'>
										<p className='truncate text-xs font-medium text-zinc-500'>{coverFileName}</p>
										<button type='button' onClick={onCoverClear} className='rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-600 transition hover:bg-white'>
											Reset
										</button>
									</div>
									<motion.div layout className='relative h-48 overflow-hidden rounded-2xl bg-zinc-950 sm:h-56'>
										<motion.img
											src={coverSource}
											alt='Cover crop preview'
											className='absolute inset-0 h-full w-full select-none object-cover'
											transition={{ duration: 0.28, ease: 'easeOut' }}
											style={{
												transform: `translate(${coverOffsetX * 0.8}%, ${coverOffsetY * 0.8}%) scale(${coverZoom})`,
												transformOrigin: 'center center',
											}}
										/>
										<div className='pointer-events-none absolute inset-0 border border-white/10' />
										<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_52%)]' />
									</motion.div>
									<div className='mt-3 grid gap-3 md:grid-cols-3'>
										<label className='block'>
											<span className='mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400'>Zoom</span>
											<input type='range' min='1' max='2.5' step='0.01' value={coverZoom} onChange={(event) => onCoverZoomChange(Number(event.target.value))} className='w-full' />
										</label>
										<label className='block'>
											<span className='mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400'>Left / right</span>
											<input type='range' min='-100' max='100' step='1' value={coverOffsetX} onChange={(event) => onCoverOffsetXChange(Number(event.target.value))} className='w-full' />
										</label>
										<label className='block'>
											<span className='mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400'>Up / down</span>
											<input type='range' min='-100' max='100' step='1' value={coverOffsetY} onChange={(event) => onCoverOffsetYChange(Number(event.target.value))} className='w-full' />
										</label>
									</div>
								</div>
							) : value.coverImage ? (
								<div className='mt-3 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 p-3'>
									<div className='h-48 overflow-hidden rounded-2xl sm:h-56'>
										<img src={value.coverImage} alt='Group cover preview' className='h-full w-full object-cover' />
									</div>
								</div>
							) : null}
						</div>
					</label>

					<label className='block'>
						<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>Start date</span>
						<input type='datetime-local' value={value.startDate} onChange={(event) => onChange({ ...value, startDate: event.target.value })} className='h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' />
					</label>

					<label className='block'>
						<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>End date</span>
						<input type='datetime-local' value={value.endDate} onChange={(event) => onChange({ ...value, endDate: event.target.value })} className='h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' />
					</label>

					<label className='block'>
						<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>Capacity</span>
						<input type='number' min={2} max={100} value={value.capacity} onChange={(event) => onChange({ ...value, capacity: Number(event.target.value) })} className='h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' />
					</label>

					<div className='grid grid-cols-2 gap-4'>
						<label className='block'>
							<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>Min budget</span>
							<input type='number' min={0} value={value.budgetMin} onChange={(event) => onChange({ ...value, budgetMin: Number(event.target.value) })} className='h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' />
						</label>
						<label className='block'>
							<span className='mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>Max budget</span>
							<input type='number' min={0} value={value.budgetMax} onChange={(event) => onChange({ ...value, budgetMax: Number(event.target.value) })} className='h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' />
						</label>
					</div>
				</div>

				<div className='flex flex-col-reverse gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6'>
					<motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={onClose} className='h-12 rounded-full border border-zinc-200 px-5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50'>
						Cancel
					</motion.button>
					<motion.button whileHover={{ y: -1, boxShadow: '0 12px 24px rgba(249,115,22,0.22)' }} whileTap={{ scale: 0.985 }} onClick={onSubmit} disabled={isSaving} className='inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60'>
						{isSaving && <LoaderCircle className='h-4 w-4 animate-spin' />}
						{submitLabel}
					</motion.button>
				</div>
			</motion.div>
		</motion.div>
	)
}

export default function GroupsPage() {
	const { user } = useAuthStore()
	const navigate = useNavigate()
	const location = useLocation()
	const [tab, setTab] = useState<TabKey>('discover')
	const [search, setSearch] = useState('')
	const [groupsNotice, setGroupsNotice] = useState<string | null>(null)
	const [publicGroups, setPublicGroups] = useState<GroupMatch[]>([])
	const [memberships, setMemberships] = useState<GroupMembership[]>([])
	const [managedGroups, setManagedGroups] = useState<GroupDetail[]>([])
	const [incomingRequests, setIncomingRequests] = useState<IncomingGroupRequest[]>([])
	const [cities, setCities] = useState<CityOption[]>([])
	const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null)
	const [selectedCard, setSelectedCard] = useState<GroupCard | null>(null)
	const [loading, setLoading] = useState(true)
	const [busyGroupId, setBusyGroupId] = useState<string | null>(null)
	const [requestActionKey, setRequestActionKey] = useState<string | null>(null)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [savingForm, setSavingForm] = useState(false)
	const [form, setForm] = useState<CreateGroupPayload>(createDefaultForm)
	const [coverSource, setCoverSource] = useState('')
	const [coverFileName, setCoverFileName] = useState('')
	const [coverZoom, setCoverZoom] = useState(1)
	const [coverOffsetX, setCoverOffsetX] = useState(0)
	const [coverOffsetY, setCoverOffsetY] = useState(0)

	const loadAll = async () => {
		setLoading(true)
		try {
			const [groupsRes, membershipsRes, managedRes, requestsRes, citiesRes] = await Promise.all([
				listPublicGroups({
					start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
					end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
					limit: 24,
				}),
				user ? listCurrentUserGroups() : Promise.resolve({ data: [] }),
				user ? listManagedGroups() : Promise.resolve({ data: [] }),
				user ? listIncomingGroupRequests() : Promise.resolve({ data: [] }),
				listCities({ limit: 50 }),
			])

			setPublicGroups(groupsRes.data.matches)
			setMemberships(membershipsRes.data)
			setManagedGroups(managedRes.data)
			setIncomingRequests(requestsRes.data)
			setCities(Array.isArray(citiesRes.data) ? citiesRes.data : (citiesRes.data.items ?? citiesRes.data.data ?? []))
		} catch {
			setGroupsNotice('Could not sync groups right now.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadAll()
	}, [user?.id])

	useEffect(() => {
		setSearch('')
	}, [tab])

	useEffect(() => {
		const state = location.state as { focusGroupId?: string; focusNotificationType?: string } | null
		if (!state?.focusGroupId) return

		setTab('manage')
		const card = managedGroups.map(toCardFromManaged).find((item) => item.id === state.focusGroupId)
		if (card) {
			void openGroup(card)
		}
	}, [location.state, managedGroups])

	useEffect(() => {
		const state = location.state as { openCreateGroup?: boolean; focusGroupId?: string; focusNotificationType?: string } | null
		if (!state?.openCreateGroup) return

		openCreateModal()
		navigate(location.pathname, {
			replace: true,
			state: {
				...state,
				openCreateGroup: undefined,
			},
		})
	}, [location.pathname, location.state, navigate])

	const membershipMap = useMemo(() => new Map(memberships.map((membership) => [membership.group.id, membership])), [memberships])

	const requestCountByGroup = useMemo(() => {
		const counts = new Map<string, number>()
		for (const request of incomingRequests) {
			counts.set(request.groupId, (counts.get(request.groupId) ?? 0) + 1)
		}
		return counts
	}, [incomingRequests])

	const discoverCards = useMemo(
		() =>
			publicGroups.map((group) => {
				const membership = membershipMap.get(group.groupId)
				return {
					...toCardFromMatch(group),
					viewerRole: membership?.role ?? null,
					viewerStatus: membership?.status ?? null,
					requestCount: requestCountByGroup.get(group.groupId) ?? 0,
				}
			}),
		[publicGroups, membershipMap, requestCountByGroup],
	)

	const myCards = useMemo(() => memberships.map(toCardFromMembership), [memberships])
	const managedCards = useMemo(
		() =>
			managedGroups.map((group) => ({
				...toCardFromManaged(group),
				requestCount: requestCountByGroup.get(group.id) ?? group.pendingRequests.length,
			})),
		[managedGroups, requestCountByGroup],
	)

	const cards = tab === 'discover' ? discoverCards : tab === 'mine' ? myCards : managedCards

	const filteredCards = useMemo(() => {
		const query = search.trim().toLowerCase()
		if (!query) return cards
		return cards.filter((card) => [card.title, card.cityName, card.description].join(' ').toLowerCase().includes(query))
	}, [cards, search])

	const buildRequestActionKey = (groupId: string, userId: string, action: 'open' | 'approve' | 'decline') => `${groupId}:${userId}:${action}`

	const openGroup = async (card: GroupCard, actionKey?: string) => {
		setSelectedCard(card)
		if (actionKey) setRequestActionKey(actionKey)
		try {
			const { data } = await getPublicGroup(card.id)
			const merged = mergeViewerState(data, {
				viewerStatus: card.viewerStatus,
				viewerRole: card.viewerRole,
			})
			setSelectedGroup(merged)
			setSelectedCard((prev) =>
				prev
					? {
							...toCardFromDetail(merged, prev.source),
							viewerStatus: merged.viewerStatus ?? prev.viewerStatus ?? null,
							viewerRole: merged.viewerRole ?? prev.viewerRole ?? null,
						}
					: toCardFromDetail(merged),
			)
		} catch {
			setGroupsNotice('Could not load this group right now.')
		} finally {
			if (actionKey) setRequestActionKey(null)
		}
	}

	const closeGroup = () => {
		setSelectedCard(null)
		setSelectedGroup(null)
	}

	const statusLabel = (card: GroupCard) => {
		if (card.viewerStatus === 'MEMBER') return 'In group'
		if (card.viewerStatus === 'PENDING') return 'Pending'
		if (card.viewerStatus === 'REJECTED') return 'Declined'
		return card.source === 'manage' ? 'Managing' : 'Open'
	}

	const statusTone = (card: GroupCard) => {
		if (card.viewerStatus === 'MEMBER' || card.source === 'manage') return 'bg-emerald-50 text-emerald-700'
		if (card.viewerStatus === 'PENDING') return 'bg-amber-50 text-amber-700'
		if (card.viewerStatus === 'REJECTED') return 'bg-rose-50 text-rose-700'
		return 'bg-zinc-100 text-zinc-600'
	}

	const patchCardStatus = (groupId: string, nextStatus: GroupCard['viewerStatus'], nextRole: GroupCard['viewerRole'] = null) => {
		const patch = (card: GroupCard) => (card.id === groupId ? { ...card, viewerStatus: nextStatus, viewerRole: nextRole } : card)

		const baseGroup =
			selectedGroup && selectedGroup.id === groupId
				? {
						id: selectedGroup.id,
						title: selectedGroup.title,
						description: selectedGroup.description || '',
						coverImage: selectedGroup.coverImage || null,
						owner: selectedGroup.owner,
						city: selectedGroup.city,
						startDate: selectedGroup.startDate,
						endDate: selectedGroup.endDate,
						capacity: selectedGroup.capacity,
						budgetMin: selectedGroup.budgetMin,
						budgetMax: selectedGroup.budgetMax,
						memberCount: selectedGroup.memberCount,
						availableSpots: selectedGroup.availableSpots,
					}
				: (() => {
						const match = publicGroups.find((group) => group.groupId === groupId)
						if (!match) return null
						return {
							id: match.groupId,
							title: match.title,
							description: match.description || '',
							coverImage: match.coverImage || null,
							owner: {
								id: '',
								email: '',
								name: 'Group owner',
								avatarUrl: null,
								role: 'TRAVELER',
								createdAt: '',
								updatedAt: '',
							},
							city: {
								id: match.cityId,
								name: match.cityName,
								slug: undefined,
								description: null,
								coverImage: null,
							},
							startDate: match.startDate,
							endDate: match.endDate,
							capacity: match.capacity,
							budgetMin: match.budgetMin,
							budgetMax: match.budgetMax,
							memberCount: match.memberCount ?? 0,
							availableSpots: match.availableSpots ?? match.capacity,
						}
					})()

		setMemberships((prev) => {
			if (nextStatus === 'PENDING' || nextStatus === 'MEMBER' || nextStatus === 'REJECTED') {
				const existing = prev.find((membership) => membership.group.id === groupId)
				if (!existing) {
					if (!baseGroup) return prev
					return [
						{
							status: nextStatus,
							role: nextRole ?? 'MEMBER',
							requestedAt: new Date().toISOString(),
							respondedAt: nextStatus === 'PENDING' ? null : new Date().toISOString(),
							group: baseGroup,
						},
						...prev,
					]
				}
				return prev.map((membership) => (membership.group.id === groupId ? { ...membership, status: nextStatus, role: nextRole ?? membership.role } : membership))
			}
			return prev
		})
		setSelectedCard((prev) => (prev && prev.id === groupId ? patch(prev) : prev))
		setSelectedGroup((prev) =>
			prev && prev.id === groupId
				? {
						...prev,
						viewerStatus: nextStatus ?? null,
						viewerRole: nextRole ?? null,
					}
				: prev,
		)
	}

	const handleJoin = async (groupId: string) => {
		setBusyGroupId(groupId)
		try {
			const { data } = await joinPublicGroup(groupId)
			setGroupsNotice(data.message)
			patchCardStatus(groupId, data.status, data.status === 'MEMBER' ? 'MEMBER' : null)
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not submit the join request.'))
		} finally {
			setBusyGroupId(null)
		}
	}

	const handleCancelJoin = async (groupId: string) => {
		setBusyGroupId(groupId)
		try {
			await cancelPublicGroupJoin(groupId)
			setGroupsNotice('Join request canceled.')
			setMemberships((prev) => prev.filter((membership) => membership.group.id !== groupId))
			setSelectedCard((prev) => (prev && prev.id === groupId ? { ...prev, viewerStatus: null, viewerRole: null } : prev))
			setSelectedGroup((prev) => (prev && prev.id === groupId ? { ...prev, viewerStatus: null, viewerRole: null } : prev))
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not cancel the request.'))
		} finally {
			setBusyGroupId(null)
		}
	}

	const handleOpenChat = (groupId: string) => {
		navigate(`/user/groups/${groupId}/chat`)
	}

	const openCreateModal = () => {
		setForm(createDefaultForm())
		setCoverSource('')
		setCoverFileName('')
		setCoverZoom(1)
		setCoverOffsetX(0)
		setCoverOffsetY(0)
		setShowCreateModal(true)
	}

	const openEditModal = () => {
		if (!selectedGroup) return
		const formatInputDate = (value: string) => new Date(value).toISOString().slice(0, 16)
		setForm({
			cityId: selectedGroup.city.id,
			title: selectedGroup.title,
			description: selectedGroup.description || '',
			coverImage: selectedGroup.coverImage || '',
			startDate: formatInputDate(selectedGroup.startDate),
			endDate: formatInputDate(selectedGroup.endDate),
			capacity: selectedGroup.capacity,
			budgetMin: selectedGroup.budgetMin,
			budgetMax: selectedGroup.budgetMax,
		})
		setCoverSource('')
		setCoverFileName('')
		setCoverZoom(1)
		setCoverOffsetX(0)
		setCoverOffsetY(0)
		setShowEditModal(true)
	}

	const normalizePayload = (value: CreateGroupPayload): CreateGroupPayload => ({
		...value,
		description: value.description?.trim() || '',
		coverImage: value.coverImage?.trim() || '',
		startDate: new Date(value.startDate).toISOString(),
		endDate: new Date(value.endDate).toISOString(),
	})

	const getErrorMessage = (error: unknown, fallback: string) => {
		if (axios.isAxiosError(error)) {
			const message = (error.response?.data as { message?: string } | undefined)?.message
			if (typeof message === 'string') return message
			if (typeof error.message === 'string' && error.message) return error.message
		}
		return fallback
	}

	const validateForm = (value: CreateGroupPayload) => {
		if (!value.cityId || !value.title.trim()) return 'City and title are required.'
		if (!value.startDate || !value.endDate) return 'Start and end dates are required.'
		const start = new Date(value.startDate)
		const end = new Date(value.endDate)
		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			return 'Choose valid start and end dates.'
		}
		if (end <= start) return 'End date must be after the start date.'
		if (value.budgetMax < value.budgetMin) {
			return 'Max budget must be greater than or equal to min budget.'
		}
		return null
	}

	const handleCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				setCoverSource(reader.result)
				setCoverFileName(file.name)
				setCoverZoom(1)
				setCoverOffsetX(0)
				setCoverOffsetY(0)
			}
		}
		reader.readAsDataURL(file)
	}

	useEffect(() => {
		if (!coverSource) return
		let cancelled = false

		void buildCoverImage(coverSource, clamp(coverZoom, 1, 2.5), clamp(coverOffsetX, -100, 100), clamp(coverOffsetY, -100, 100)).then((nextImage) => {
			if (!cancelled) {
				setForm((prev) => ({ ...prev, coverImage: nextImage }))
			}
		})

		return () => {
			cancelled = true
		}
	}, [coverOffsetX, coverOffsetY, coverSource, coverZoom])

	const clearCoverImage = () => {
		setCoverSource('')
		setCoverFileName('')
		setCoverZoom(1)
		setCoverOffsetX(0)
		setCoverOffsetY(0)
		setForm((prev) => ({ ...prev, coverImage: '' }))
	}

	const handleCreate = async () => {
		const validationError = validateForm(form)
		if (validationError) {
			setGroupsNotice(validationError)
			return
		}
		setSavingForm(true)
		try {
			await createGroup(normalizePayload(form))
			setShowCreateModal(false)
			setGroupsNotice('Group created.')
			setTab('manage')
			await loadAll()
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not create the group.'))
		} finally {
			setSavingForm(false)
		}
	}

	const handleUpdate = async () => {
		if (!selectedGroup) return
		const validationError = validateForm(form)
		if (validationError) {
			setGroupsNotice(validationError)
			return
		}
		setSavingForm(true)
		try {
			const { data } = await updateGroup(selectedGroup.id, normalizePayload(form))
			const merged = mergeViewerState(data, {
				viewerStatus: selectedGroup.viewerStatus ?? selectedCard?.viewerStatus ?? null,
				viewerRole: selectedGroup.viewerRole ?? selectedCard?.viewerRole ?? null,
			})
			setSelectedGroup(merged)
			setSelectedCard((prev) =>
				prev
					? {
							...toCardFromDetail(merged, prev.source),
							viewerStatus: merged.viewerStatus ?? prev.viewerStatus ?? null,
							viewerRole: merged.viewerRole ?? prev.viewerRole ?? null,
						}
					: toCardFromDetail(merged),
			)
			setShowEditModal(false)
			setGroupsNotice('Group updated.')
			await loadAll()
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not update the group.'))
		} finally {
			setSavingForm(false)
		}
	}

	// ✅ NEW: card-level delete handler (no modal needed, just confirm + call API)
	const handleDeleteCard = async (card: GroupCard) => {
		if (!window.confirm('Delete this group? This cannot be undone.')) return
		setBusyGroupId(card.id)
		try {
			await deleteGroup(card.id)
			setGroupsNotice('Group deleted.')
			await loadAll()
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not delete the group.'))
		} finally {
			setBusyGroupId(null)
		}
	}

	const handleDelete = async () => {
		if (!selectedGroup || !window.confirm('Delete this group? This cannot be undone.')) return
		setBusyGroupId(selectedGroup.id)
		try {
			await deleteGroup(selectedGroup.id)
			setGroupsNotice('Group deleted.')
			closeGroup()
			await loadAll()
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not delete the group.'))
		} finally {
			setBusyGroupId(null)
		}
	}

	const requestsForSelectedGroup = useMemo(() => (selectedGroup ? incomingRequests.filter((request) => request.groupId === selectedGroup.id) : []), [selectedGroup, incomingRequests])

	const handleReviewRequest = async (userId: string, status: 'MEMBER' | 'REJECTED') => {
		if (!selectedGroup) return
		const actionKey = buildRequestActionKey(selectedGroup.id, userId, status === 'MEMBER' ? 'approve' : 'decline')
		setRequestActionKey(actionKey)
		setBusyGroupId(selectedGroup.id)
		try {
			await reviewGroupMembership(selectedGroup.id, userId, status)
			setGroupsNotice(status === 'MEMBER' ? 'Request approved.' : 'Request declined.')
			const { data } = await getPublicGroup(selectedGroup.id)
			const merged = mergeViewerState(data, {
				viewerStatus: selectedGroup.viewerStatus ?? selectedCard?.viewerStatus ?? null,
				viewerRole: selectedGroup.viewerRole ?? selectedCard?.viewerRole ?? null,
			})
			setSelectedGroup(merged)
			setSelectedCard((prev) =>
				prev
					? {
							...toCardFromDetail(merged, prev.source),
							viewerStatus: merged.viewerStatus ?? prev.viewerStatus ?? null,
							viewerRole: merged.viewerRole ?? prev.viewerRole ?? null,
						}
					: toCardFromDetail(merged),
			)
			await loadAll()
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not review the request.'))
		} finally {
			setBusyGroupId(null)
			setRequestActionKey(null)
		}
	}

	const handleRoleToggle = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
		if (!selectedGroup) return
		setBusyGroupId(selectedGroup.id)
		try {
			await updateGroupMemberRole(selectedGroup.id, userId, role)
			setGroupsNotice(role === 'ADMIN' ? 'Member promoted to admin.' : 'Admin role removed.')
			const { data } = await getPublicGroup(selectedGroup.id)
			const merged = mergeViewerState(data, {
				viewerStatus: selectedGroup.viewerStatus ?? selectedCard?.viewerStatus ?? null,
				viewerRole: selectedGroup.viewerRole ?? selectedCard?.viewerRole ?? null,
			})
			setSelectedGroup(merged)
			setSelectedCard((prev) =>
				prev
					? {
							...toCardFromDetail(merged, prev.source),
							viewerStatus: merged.viewerStatus ?? prev.viewerStatus ?? null,
							viewerRole: merged.viewerRole ?? prev.viewerRole ?? null,
						}
					: toCardFromDetail(merged),
			)
			await loadAll()
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not update the member role.'))
		} finally {
			setBusyGroupId(null)
		}
	}

	const handleRemoveMember = async (userId: string) => {
		if (!selectedGroup) return
		setBusyGroupId(selectedGroup.id)
		try {
			await removeGroupMember(selectedGroup.id, userId)
			setGroupsNotice('Member removed from the group.')
			const { data } = await getPublicGroup(selectedGroup.id)
			const merged = mergeViewerState(data, {
				viewerStatus: selectedGroup.viewerStatus ?? selectedCard?.viewerStatus ?? null,
				viewerRole: selectedGroup.viewerRole ?? selectedCard?.viewerRole ?? null,
			})
			setSelectedGroup(merged)
			setSelectedCard((prev) =>
				prev
					? {
							...toCardFromDetail(merged, prev.source),
							viewerStatus: merged.viewerStatus ?? prev.viewerStatus ?? null,
							viewerRole: merged.viewerRole ?? prev.viewerRole ?? null,
						}
					: toCardFromDetail(merged),
			)
			await loadAll()
		} catch (error) {
			setGroupsNotice(getErrorMessage(error, 'Could not remove that member.'))
		} finally {
			setBusyGroupId(null)
		}
	}

	useEffect(() => {
		const hidden = Boolean((selectedGroup && selectedCard) || showCreateModal || showEditModal)

		window.dispatchEvent(
			new CustomEvent(BOTTOM_NAV_VISIBILITY_EVENT, {
				detail: { hidden },
			}),
		)

		return () => {
			window.dispatchEvent(
				new CustomEvent(BOTTOM_NAV_VISIBILITY_EVENT, {
					detail: { hidden: false },
				}),
			)
		}
	}, [selectedCard, selectedGroup, showCreateModal, showEditModal])

	const selectedViewerRole = selectedGroup?.viewerRole ?? null
	const selectedViewerStatus = selectedGroup?.viewerStatus ?? selectedCard?.viewerStatus ?? null
	const canManageSelected = selectedViewerRole === 'OWNER' || selectedViewerRole === 'ADMIN'
	const canEditSelected = canManageSelected
	const canDeleteSelected = selectedViewerRole === 'OWNER'

	return (
		<div className='mx-auto w-full max-w-7xl pb-16 md:pb-0'>
			<div className='mb-6 flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
				<div className='flex flex-col gap-3'>
					<a
						href='#'
						onClick={(event) => {
							event.preventDefault()
							openCreateModal()
						}}
						className='hidden w-fit items-center gap-2 text-sm font-semibold text-orange-500 transition hover:text-orange-600 lg:inline-flex'>
						<Plus className='h-4 w-4' />
						Create group
					</a>
					<div>
						<h2 className='text-2xl font-semibold text-zinc-950'>Travel Groups</h2>
						<p className='mt-1 text-sm text-zinc-500'>Create your own circle, review requests, and keep the group vibe clean.</p>
					</div>
				</div>

				<div className='flex flex-col gap-3 sm:flex-row'>
					<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search by title or city' className='h-12 min-w-[260px] rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100' />
				</div>
			</div>

			<div className='mb-6 flex w-full items-center gap-6 border-b border-zinc-200'>
				{(
					[
						['discover', 'Discover'],
						['mine', 'My groups'],
						['manage', 'Managing'],
					] as const
				).map(([key, label]) => (
					<button key={key} onClick={() => setTab(key)} className={`relative -mb-px inline-flex items-center gap-2 border-b-2 px-0 pb-3 pt-1 text-sm font-medium transition ${tab === key ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}>
						<span>{label}</span>
						{key === 'manage' && incomingRequests.length > 0 && <span className='rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white'>{incomingRequests.length}</span>}
					</button>
				))}
			</div>
			<AnimatePresence mode='wait'>
				{groupsNotice && (
					<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24, ease: 'easeOut' }} className='mb-5 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-orange-700 shadow-[0_14px_34px_rgba(249,115,22,0.12)]'>
						<BellRing className='h-4 w-4 shrink-0' />
						<span>{groupsNotice}</span>
					</motion.div>
				)}
			</AnimatePresence>

			{tab === 'manage' && incomingRequests.length > 0 && (
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='mb-6 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm'>
					<div className='mb-4 flex items-center justify-between'>
						<div>
							<h3 className='text-lg font-semibold text-zinc-950'>Requests waiting on you</h3>
							<p className='mt-1 text-sm text-zinc-500'>Approve or reject pending requests across the groups you manage.</p>
						</div>
						<span className='rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600'>{incomingRequests.length} pending</span>
					</div>

					<div className='grid gap-3 md:grid-cols-2'>
						{incomingRequests.slice(0, 6).map((request) => {
							const openActionKey = buildRequestActionKey(request.groupId, request.user.id, 'open')
							const approveActionKey = buildRequestActionKey(request.groupId, request.user.id, 'approve')
							const declineActionKey = buildRequestActionKey(request.groupId, request.user.id, 'decline')
							const isOpeningRequest = requestActionKey === openActionKey
							const isApprovingRequest = requestActionKey === approveActionKey
							const isDecliningRequest = requestActionKey === declineActionKey

							return (
								<div key={`${request.groupId}-${request.user.id}`} className='rounded-[24px] border border-zinc-100 bg-zinc-50 p-4'>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<p className='text-sm font-semibold text-zinc-950'>{request.user.name}</p>
											<p className='mt-1 text-xs text-zinc-500'>Requested to join {request.group.title}</p>
										</div>
										<button
											onClick={() => {
												setTab('manage')
												void openGroup(
													managedCards.find((card) => card.id === request.groupId) ?? {
														id: request.group.id,
														title: request.group.title,
														description: request.group.description || '',
														image: request.group.coverImage || request.group.city.coverImage || fallbackImage,
														cityId: request.group.city.id,
														cityName: request.group.city.name,
														startDate: new Date().toISOString(),
														endDate: new Date().toISOString(),
														capacity: request.group.capacity,
														memberCount: 0,
														availableSpots: request.group.capacity,
														budgetMin: 0,
														budgetMax: 0,
														source: 'manage',
													},
													openActionKey,
												)
											}}
											disabled={Boolean(requestActionKey)}
											className='inline-flex min-w-[74px] items-center justify-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60'>
											{isOpeningRequest ? <LoaderCircle className='h-3.5 w-3.5 animate-spin' /> : 'Open'}
										</button>
									</div>

									<div className='mt-4 flex gap-2'>
										<button onClick={() => void handleReviewRequest(request.user.id, 'MEMBER')} disabled={Boolean(requestActionKey)} className='inline-flex min-w-[96px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60'>
											{isApprovingRequest ? <LoaderCircle className='h-3.5 w-3.5 animate-spin' /> : <Check className='h-3.5 w-3.5' />}
											{isApprovingRequest ? 'Working...' : 'Approve'}
										</button>
										<button onClick={() => void handleReviewRequest(request.user.id, 'REJECTED')} disabled={Boolean(requestActionKey)} className='inline-flex min-w-[96px] items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60'>
											{isDecliningRequest ? (
												<>
													<LoaderCircle className='h-3.5 w-3.5 animate-spin' />
													Working...
												</>
											) : (
												'Decline'
											)}
										</button>
									</div>
								</div>
							)
						})}
					</div>
				</motion.div>
			)}

			{loading ? (
				<div className='flex items-center justify-center rounded-[28px] border border-zinc-200 bg-white py-20 text-sm text-zinc-500'>
					<LoaderCircle className='mr-2 h-4 w-4 animate-spin' />
					Syncing live groups...
				</div>
			) : filteredCards.length === 0 ? (
				<div className='rounded-[28px] border border-zinc-200 bg-white py-16 text-center text-sm text-zinc-500'>No groups match the current view.</div>
			) : (
				<motion.div className='grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3'>
					<AnimatePresence>
						{filteredCards.map((card, index) => (
							<motion.article key={`${card.source}-${card.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, delay: index * 0.02, ease: 'easeOut' }} onClick={() => void openGroup(card)} className='group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md'>
								<div className='relative h-48 overflow-hidden'>
									<img src={card.image} alt={card.title} className='h-full w-full object-cover transition duration-500 group-hover:scale-105' />
									<div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent' />
									<div className='absolute bottom-4 left-4 right-4'>
										<motion.h3 layout className='text-xl font-bold text-white'>
											{card.title}
										</motion.h3>
										<div className='mt-2 flex items-center gap-3 text-[12px] text-white/85'>
											<span className='inline-flex items-center gap-1'>
												<MapPin className='h-3.5 w-3.5 text-orange-300' />
												{card.cityName}
											</span>
											<span>{formatDateRange(card.startDate, card.endDate)}</span>
										</div>
									</div>
								</div>

								<div className='flex flex-1 flex-col p-4'>
									<div className='mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold'>
										<span className={`rounded-md px-2.5 py-1 ${statusTone(card)}`}>{statusLabel(card)}</span>
										<span className='rounded-md bg-zinc-100 px-2.5 py-1 text-zinc-600'>
											{card.memberCount}/{card.capacity} members
										</span>
										<span className='rounded-md bg-orange-50 px-2.5 py-1 text-orange-700'>{formatMoneyRange(card.budgetMin, card.budgetMax)}</span>
										{typeof card.requestCount === 'number' && card.requestCount > 0 && <span className='rounded-md bg-zinc-900 px-2.5 py-1 text-white'>{card.requestCount} requests</span>}
										{typeof card.score === 'number' && <span className='rounded-md bg-zinc-900 px-2.5 py-1 text-white'>{card.score}/100 match</span>}
									</div>
									<p className='line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-zinc-600'>{card.description}</p>

									<div className='mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4'>
										<motion.button
											onClick={(event) => {
												event.stopPropagation()
												if (card.viewerStatus === 'MEMBER') {
													handleOpenChat(card.id)
													return
												}
												if (card.viewerStatus === 'PENDING') {
													void handleCancelJoin(card.id)
													return
												}
												if (card.source === 'manage') {
													void openGroup(card)
													return
												}
												void handleJoin(card.id)
											}}
											disabled={busyGroupId === card.id || card.viewerStatus === 'REJECTED'}
											className={`inline-flex min-w-[132px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${card.viewerStatus === 'MEMBER' ? 'bg-emerald-500 hover:bg-emerald-600' : card.viewerStatus === 'PENDING' ? 'bg-amber-400 hover:bg-amber-500' : 'bg-orange-500 hover:bg-orange-600'}`}>
											{busyGroupId === card.id ? <LoaderCircle className='h-4 w-4 animate-spin' /> : card.viewerStatus === 'MEMBER' ? <MessageCircleMore className='h-4 w-4' /> : card.viewerStatus === 'PENDING' ? <X className='h-4 w-4' /> : card.source === 'manage' ? <Shield className='h-4 w-4' /> : <UserPlus className='h-4 w-4' />}
											{card.viewerStatus === 'MEMBER' ? 'Open chat' : card.viewerStatus === 'PENDING' ? 'Cancel request' : card.source === 'manage' ? 'Manage' : 'Request to join'}
										</motion.button>

										{/* ✅ ONLY CHANGE: owner sees Delete instead of Details */}
										{card.viewerRole === 'OWNER' ? (
											<motion.button
												onClick={(event) => {
													event.stopPropagation()
													void handleDeleteCard(card)
												}}
												disabled={busyGroupId === card.id}
												className='inline-flex items-center gap-1 text-sm font-semibold text-rose-500 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50'>
												{busyGroupId === card.id ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
												Delete
											</motion.button>
										) : (
											<motion.button
												onClick={(event) => {
													event.stopPropagation()
													void openGroup(card)
												}}
												className='inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900'>
												Details
												<ChevronRight className='h-4 w-4' />
											</motion.button>
										)}
									</div>
								</div>
							</motion.article>
						))}
					</AnimatePresence>
				</motion.div>
			)}

			<AnimatePresence>
				{selectedGroup && selectedCard && (
					<div className='fixed inset-0 z-[100] flex items-end justify-center px-0 sm:px-4 lg:pl-[17.5rem] lg:pr-6' onClick={closeGroup}>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className='absolute inset-0 bg-black/45 backdrop-blur-md' />
						<motion.div
							onClick={(event) => event.stopPropagation()}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2, ease: 'easeOut' }}
							layout
							className='relative z-10 flex w-full max-h-[calc(100dvh-6.5rem)] flex-col overflow-hidden bg-white shadow-[0_-24px_80px_rgba(17,24,39,0.22)] rounded-t-[28px] sm:max-h-[calc(100dvh-5.5rem)] sm:max-w-[1060px] sm:rounded-[30px] sm:border sm:border-white/70 lg:max-w-[900px] lg:rounded-t-[30px] lg:rounded-b-none lg:border-x lg:border-t lg:border-b-0 lg:border-white/70'>
							<div className='pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-2.5 sm:pt-3'>
								<div className='h-1.5 w-11 rounded-full bg-zinc-300/90' />
							</div>

							<div className='relative h-36 w-full sm:h-44 lg:h-48'>
								<img src={selectedGroup.coverImage || selectedCard.image} className='h-full w-full object-cover' alt={selectedGroup.title} />
								<div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10' />
								<button onClick={closeGroup} className='absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:right-4 sm:top-4'>
									<X className='h-4 w-4' />
								</button>

								<div className='absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-5 sm:pb-5'>
									<div className='mb-2 flex flex-wrap items-center gap-2'>
										<span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone(selectedCard)}`}>{statusLabel(selectedCard)}</span>
										{selectedViewerRole && <span className='rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm'>{selectedViewerRole}</span>}
									</div>

									<h3 className='max-w-3xl text-[22px] font-bold leading-tight text-white sm:text-[27px]'>{selectedGroup.title}</h3>

									<div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/90 sm:text-sm'>
										<span className='inline-flex items-center gap-1.5'>
											<MapPin className='h-4 w-4 text-orange-300' />
											{selectedGroup.city.name}
										</span>
										<span className='inline-flex items-center gap-1.5'>
											<CalendarDays className='h-4 w-4 text-orange-300' />
											{formatDateRange(selectedGroup.startDate, selectedGroup.endDate)}
										</span>
										<span className='rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-sm'>{formatMoneyRange(selectedGroup.budgetMin, selectedGroup.budgetMax)}</span>
									</div>
								</div>
							</div>

							<div className='min-h-0 flex-1 overflow-y-auto'>
								<div className='grid gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(300px,0.98fr)] lg:gap-4'>
									<div className='space-y-3'>
										<div className='rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4'>
											<div className='flex items-start justify-between gap-3'>
												<div>
													<h4 className='text-sm font-semibold text-zinc-950 sm:text-base'>Group brief</h4>
													<p className='mt-1 text-xs text-zinc-500 sm:text-sm'>Owner: {selectedGroup.owner.name}</p>
												</div>
												<div className='rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200'>
													{selectedGroup.memberCount}/{selectedGroup.capacity} confirmed
												</div>
											</div>
											<p className='mt-3 text-sm leading-6 text-zinc-600'>{selectedGroup.description || 'No description yet.'}</p>
										</div>

										{canManageSelected && (
											<div className='rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4'>
												<div className='mb-3 flex items-center justify-between gap-3'>
													<div>
														<h4 className='text-sm font-semibold text-zinc-950 sm:text-base'>Pending requests</h4>
														<p className='mt-1 text-xs text-zinc-500 sm:text-sm'>Requests show here until an owner or admin handles them.</p>
													</div>
													<span className='rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200'>{requestsForSelectedGroup.length}</span>
												</div>

												<div className='space-y-2.5'>
													{requestsForSelectedGroup.length === 0 && <div className='rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-500'>No pending requests right now.</div>}
													{requestsForSelectedGroup.map((request) => {
														const approveActionKey = buildRequestActionKey(request.groupId, request.user.id, 'approve')
														const declineActionKey = buildRequestActionKey(request.groupId, request.user.id, 'decline')
														const isApprovingRequest = requestActionKey === approveActionKey
														const isDecliningRequest = requestActionKey === declineActionKey

														return (
															<div key={request.user.id} className='flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 md:flex-row md:items-center md:justify-between'>
																<div>
																	<p className='text-sm font-semibold text-zinc-950'>{request.user.name}</p>
																	<p className='mt-1 text-xs text-zinc-500'>{request.user.email}</p>
																</div>
																<div className='flex gap-2'>
																	<button onClick={() => void handleReviewRequest(request.user.id, 'MEMBER')} disabled={Boolean(requestActionKey)} className='inline-flex min-w-[96px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60'>
																		{isApprovingRequest ? <LoaderCircle className='h-3.5 w-3.5 animate-spin' /> : <Check className='h-3.5 w-3.5' />}
																		{isApprovingRequest ? 'Working...' : 'Approve'}
																	</button>
																	<button onClick={() => void handleReviewRequest(request.user.id, 'REJECTED')} disabled={Boolean(requestActionKey)} className='inline-flex min-w-[96px] items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60'>
																		{isDecliningRequest ? (
																			<>
																				<LoaderCircle className='h-3.5 w-3.5 animate-spin' />
																				Working...
																			</>
																		) : (
																			'Decline'
																		)}
																	</button>
																</div>
															</div>
														)
													})}
												</div>
											</div>
										)}

										{(canEditSelected || canDeleteSelected) && (
											<div className='rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4'>
												<div className='mb-3'>
													<h4 className='text-sm font-semibold text-zinc-950 sm:text-base'>Group settings</h4>
													<p className='mt-1 text-xs text-zinc-500 sm:text-sm'>Owner and admin controls stay available here.</p>
												</div>

												<div className='flex flex-wrap gap-2'>
													{canEditSelected && (
														<button onClick={openEditModal} className='inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50'>
															<Pencil className='h-4 w-4' />
															Edit group
														</button>
													)}

													{canDeleteSelected && (
														<button onClick={() => void handleDelete()} disabled={busyGroupId === selectedGroup.id} className='inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60'>
															<Trash2 className='h-4 w-4' />
															Delete group
														</button>
													)}
												</div>
											</div>
										)}
									</div>

									<div className='space-y-3'>
										<div className='rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4'>
											<div className='mb-3 flex items-center justify-between gap-3'>
												<div>
													<h4 className='text-sm font-semibold text-zinc-950 sm:text-base'>Members</h4>
													<p className='mt-1 text-xs text-zinc-500 sm:text-sm'>Live member roles from the backend.</p>
												</div>
												<span className='rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200'>{selectedGroup.members.length}</span>
											</div>

											<div className='space-y-2.5'>
												{selectedGroup.members.map((member) => {
													const isOwner = member.role === 'OWNER'
													const canChangeRole = selectedViewerRole === 'OWNER' && !isOwner && member.id !== user?.id
													const canKick = canManageSelected && !isOwner && (selectedViewerRole === 'OWNER' || member.role !== 'ADMIN')

													return (
														<div key={member.id} className='rounded-2xl border border-zinc-200/80 bg-white px-4 py-3'>
															<div className='flex items-center justify-between gap-3'>
																<div className='flex min-w-0 items-center gap-3'>
																	<img src={member.avatarUrl || fallbackImage} alt={member.name} className='h-11 w-11 rounded-full object-cover' />
																	<div className='min-w-0'>
																		<p className='truncate text-sm font-semibold text-zinc-950'>{member.name}</p>
																		<p className='truncate text-xs text-zinc-500'>{member.email}</p>
																	</div>
																</div>
																<span className='inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700'>
																	{member.role === 'OWNER' ? <Crown className='h-3 w-3' /> : <Shield className='h-3 w-3' />}
																	{member.role}
																</span>
															</div>

															{(canChangeRole || canKick) && (
																<div className='mt-3 flex flex-wrap gap-2'>
																	{canChangeRole && (
																		<button onClick={() => void handleRoleToggle(member.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')} className='rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-600 transition hover:bg-zinc-50'>
																			{member.role === 'ADMIN' ? 'Remove admin' : 'Promote to admin'}
																		</button>
																	)}
																	{canKick && (
																		<button onClick={() => void handleRemoveMember(member.id)} className='inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50'>
																			<UserMinus className='h-3.5 w-3.5' />
																			Remove
																		</button>
																	)}
																</div>
															)}
														</div>
													)
												})}
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className='sticky bottom-0 z-20 border-t border-zinc-200 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_30px_rgba(15,23,42,0.04)] sm:px-5 sm:pt-4 sm:pb-5 lg:rounded-b-none lg:border-b-0'>
								{selectedViewerStatus === 'MEMBER' ? (
									<div className='grid grid-cols-2 gap-3'>
										<button onClick={() => handleOpenChat(selectedGroup.id)} className='inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600'>
											<MessageCircleMore className='h-4 w-4' />
											Open chat
										</button>
										<button onClick={() => handleOpenChat(selectedGroup.id)} className='inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50'>
											<UserPlus className='h-4 w-4' />
											Invite friends
										</button>
									</div>
								) : selectedViewerStatus === 'PENDING' ? (
									<button onClick={() => void handleCancelJoin(selectedGroup.id)} disabled={busyGroupId === selectedGroup.id} className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60'>
										{busyGroupId === selectedGroup.id ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <X className='h-4 w-4' />}
										Cancel request
									</button>
								) : (
									<button onClick={() => void handleJoin(selectedGroup.id)} disabled={busyGroupId === selectedGroup.id} className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60'>
										{busyGroupId === selectedGroup.id ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <UserPlus className='h-4 w-4' />}
										Request to join
									</button>
								)}
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showCreateModal && (
					<GroupFormModal
						title='Create a new group'
						subtitle='Anyone can start a group. Keep it crisp, clear, and worth joining.'
						cities={cities}
						value={form}
						submitLabel='Create group'
						onChange={setForm}
						onFileChange={handleCoverFileChange}
						onClose={() => setShowCreateModal(false)}
						onSubmit={() => void handleCreate()}
						isSaving={savingForm}
						coverSource={coverSource}
						coverFileName={coverFileName}
						coverZoom={coverZoom}
						coverOffsetX={coverOffsetX}
						coverOffsetY={coverOffsetY}
						onCoverZoomChange={setCoverZoom}
						onCoverOffsetXChange={setCoverOffsetX}
						onCoverOffsetYChange={setCoverOffsetY}
						onCoverClear={clearCoverImage}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showEditModal && (
					<GroupFormModal
						title='Edit group'
						subtitle='Update the vibe, schedule, and budget without losing your members.'
						cities={cities}
						value={form}
						submitLabel='Save changes'
						onChange={setForm}
						onFileChange={handleCoverFileChange}
						onClose={() => setShowEditModal(false)}
						onSubmit={() => void handleUpdate()}
						isSaving={savingForm}
						coverSource={coverSource}
						coverFileName={coverFileName}
						coverZoom={coverZoom}
						coverOffsetX={coverOffsetX}
						coverOffsetY={coverOffsetY}
						onCoverZoomChange={setCoverZoom}
						onCoverOffsetXChange={setCoverOffsetX}
						onCoverOffsetYChange={setCoverOffsetY}
						onCoverClear={clearCoverImage}
					/>
				)}
			</AnimatePresence>
		</div>
	)
}