import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Calendar, ChevronDown, Compass, History, Loader2, MapPin, Send, Star, Users, ArrowUpRight, Route, X, MessageCircleMore, Trash2 } from 'lucide-react'
import {
  requestHeroPlanner,
	requestHeroAgent,
	type AgentAction,
	type AgentActionType,
	type HeroAgentResponse,
  type HeroPlannerRequest,
	type StoredHeroPlannerResult,
} from '@/lib/agent'
import {
  HERO_AGENT_FOLLOWUP_KEY,
  HERO_AGENT_NOTICE_KEY,
  HERO_LATEST_TRIP_ID_KEY,
  HERO_PENDING_MAP_OPEN_KEY,
  HERO_PLANNER_REQUEST_KEY,
  HERO_PLANNER_RESULT_KEY,
  buildHeroGeneratedTripFollowup,
  readHeroStorage,
  readHeroGeneratedTrip,
  removeHeroStorage,
  writeHeroStorage,
} from '@/lib/heroGeneratedTrip'
import { joinPublicGroup } from '@/lib/travelApi'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { OPEN_ASSISTANT_EVENT } from '@/lib/events'

type Message = {
	id: string
	role: 'user' | 'assistant'
	content: string
}

type StoredChatThread = {
	id: string
	title: string
	updatedAt: string
	messages: Message[]
	lastResponse: HeroAgentResponse | null
}

const HERO_PLANNER_READY_EVENT = 'hero-planner-ready'
const CAPABILITY_COPY = ['Open agenda', 'Open matching', 'Join groups', 'Show routes']
const AGENT_CHAT_STORAGE_KEY = 'agentBubbleChats'
export const AGENT_VISIBILITY_EVENT = 'trippple:agent-visibility'
const MOBILE_AGENT_DEFAULT_TOP_RATIO = 0.18
const MOBILE_AGENT_MIN_TOP_RATIO = 0.12
const MOBILE_AGENT_MAX_TOP_RATIO = 0.42
const MOBILE_AGENT_DISMISS_TOP_RATIO = 0.28
const MOBILE_AGENT_CLOSE_TOP_RATIO = 0.32

export default function AgentBubble () {
	const { isMobile } = useWindowSize()
	const { user } = useAuthStore()
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)
	const [messages, setMessages] = useState<Message[]>([])
	const [lastResponse, setLastResponse] = useState<HeroAgentResponse | null>(null)
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)
	const [actionsOpen, setActionsOpen] = useState(false)
	const [historyOpen, setHistoryOpen] = useState(false)
	const [threads, setThreads] = useState<StoredChatThread[]>([])
	const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
	const bottomRef = useRef<HTMLDivElement>(null)
	const dragStateRef = useRef<{ pointerId: number | null; startY: number; startTop: number }>({
		pointerId: null,
		startY: 0,
		startTop: 0,
	})
	const [mobileSheetTop, setMobileSheetTop] = useState(0)
	const [hiddenByPage, setHiddenByPage] = useState(false)
	const knownCities = ['Fes', 'Marrakech', 'Casablanca', 'Chefchaouen', 'Essaouira', 'Agadir', 'Rabat', 'Tangier', 'Merzouga', 'Ouarzazate', 'Imlil', 'Dakhla']

	const actionRoutes: Record<AgentActionType, { label: string; href: string; description: string; icon: typeof Star } | null> = {
		SHOW_TRIPS: {
			label: 'Open agenda',
			href: '/user/trip-plan',
			description: 'Open your saved itinerary and daily route.',
			icon: Compass,
		},
		SHOW_MATCH: {
			label: 'Open matching',
			href: '/user/match',
			description: 'See travelers and swipes that fit your vibe.',
			icon: Users,
		},
		SHOW_GROUPS: {
			label: 'Join a group trip',
			href: '/user/groups',
			description: 'See active trips that match your vibe and dates.',
			icon: Users,
		},
		REQUEST_GROUP_JOIN: {
			label: 'Send join request',
			href: '/user/groups',
			description: 'Send a pending request to the best matching group.',
			icon: Users,
		},
		SHOW_BOOKINGS: {
			label: 'Compare booking picks',
			href: '/user/trips',
			description: 'Flights, stays, and activities curated for you.',
			icon: Calendar,
		},
		SHOW_GUIDES: {
			label: 'Open trip planning',
			href: '/user/trip-plan',
			description: 'Plan the trip manually if you need guide-style help.',
			icon: MapPin,
		},
		SHOW_MAP: {
			label: 'View the route map',
			href: '/user/maps',
			description: 'Open the interactive route and live pins.',
			icon: Route,
		},
		SHOW_QUESTS: {
			label: 'Open quest mode',
			href: '/user/ai',
			description: 'Gamified missions and travel challenges.',
			icon: Star,
		},
	}

	const intentLabel = (intent?: HeroAgentResponse['intent']) => {
		switch (intent) {
			case 'booking':
				return 'Booking flow'
			case 'collaboration':
				return 'Collaboration'
			case 'guide':
				return 'Guide match'
			case 'new_trip':
				return 'New trip'
			default:
				return 'Travel info'
		}
	}

	const detectCity = (text: string) => knownCities.find((city) => new RegExp(`\\b${city}\\b`, 'i').test(text))
	const detectDurationDays = (text: string) => {
		const match = text.match(/(\d+)\s*(day|days|jour|jours)/i)
		return match ? Math.max(2, Math.min(7, Number(match[1]))) : null
	}
	const detectBudgetDh = (text: string) => {
		const match = text.match(/(\d{3,6})\s*(dh|mad)/i)
		return match ? Number(match[1]) : null
	}

	const buildThreadTitle = (
		items: Message[],
		response: HeroAgentResponse | null,
	) => {
		const firstUser = items.find((msg) => msg.role === 'user')?.content?.trim() || ''
		const responseCity = response?.travelPlan?.to?.city?.trim()
		const promptCity = detectCity(firstUser)
		const city = responseCity || promptCity || ''
		const duration =
			typeof response?.travelPlan?.duration === 'number' && response.travelPlan.duration > 0
				? response.travelPlan.duration
				: detectDurationDays(firstUser)

		if (response?.travelPlan) {
			if (city && duration) return `${duration}-Day ${city} Plan`
			if (city) return `${city} Trip Plan`
			return 'Trip Plan'
		}

		switch (response?.intent) {
			case 'collaboration':
				return city ? `${city} Group Match` : 'Group Match'
			case 'guide':
				return city ? `${city} Local Tips` : 'Local Tips'
			case 'booking':
				return city ? `${city} Booking Picks` : 'Booking Picks'
			case 'new_trip':
				return city ? `${city} New Trip` : 'New Trip'
			default:
				break
		}

		if (firstUser) {
			const cleaned = firstUser
				.replace(/\s+/g, ' ')
				.replace(/^(show|get|take|open|plan|build|create)\s+/i, '')
				.trim()
			if (cleaned) return cleaned.length > 36 ? `${cleaned.slice(0, 36)}…` : cleaned
		}

		return 'New chat'
	}

	const persistPlannerFromChat = async (
		prompt: string,
		response: HeroAgentResponse,
	) => {
		const travelPlan = response.travelPlan
		if (!travelPlan) return null

		const plannerRequest: HeroPlannerRequest = {
			ownerUserId: user?.id,
			city: travelPlan.to.city || detectCity(prompt) || 'Fes',
			interests: [],
			durationDays: Math.max(2, travelPlan.duration || detectDurationDays(prompt) || 3),
			budgetDh: detectBudgetDh(prompt) ?? Math.round((travelPlan.totalBudget || 0) * 10),
			adults: 2,
			children: 0,
		}

		writeHeroStorage(HERO_PLANNER_REQUEST_KEY, JSON.stringify(plannerRequest))

		if (!user?.id) {
			writeHeroStorage(HERO_AGENT_NOTICE_KEY, response.answer || 'Got it. I’m building your agenda now.')
			writeHeroStorage(HERO_PENDING_MAP_OPEN_KEY, 'true')
			return { tripId: null }
		}

		try {
			const { data } = await requestHeroPlanner<HeroAgentResponse>(plannerRequest)
			const nextResult: StoredHeroPlannerResult = {
				request: plannerRequest,
				response: data,
				generatedAt: new Date().toISOString(),
			}
			writeHeroStorage(HERO_PLANNER_RESULT_KEY, JSON.stringify(nextResult))
			removeHeroStorage(HERO_PLANNER_REQUEST_KEY)
			writeHeroStorage(HERO_AGENT_NOTICE_KEY, data.answer || response.answer || 'Got it. I’m building your agenda now.')
			const tripAction = data.actions?.find((action) => typeof action.payload?.tripId === 'string')
			const tripId = typeof tripAction?.payload?.tripId === 'string' ? String(tripAction.payload.tripId) : null
			if (tripId) {
				writeHeroStorage(HERO_LATEST_TRIP_ID_KEY, tripId)
			}
			return { tripId }
		} catch {
			const fallbackResult: StoredHeroPlannerResult = {
				request: plannerRequest,
				response,
				generatedAt: new Date().toISOString(),
			}
			writeHeroStorage(HERO_PLANNER_RESULT_KEY, JSON.stringify(fallbackResult))
			writeHeroStorage(HERO_AGENT_NOTICE_KEY, response.answer || 'Got it. I’m building your agenda now.')
			return { tripId: null }
		}
	}

	const persistThreads = (nextThreads: StoredChatThread[]) => {
		setThreads(nextThreads)
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(AGENT_CHAT_STORAGE_KEY, JSON.stringify(nextThreads))
		}
	}

	const saveCurrentThread = (
		nextMessages: Message[],
		nextResponse: HeroAgentResponse | null,
		threadId = activeThreadId ?? `chat-${Date.now()}`,
	) => {
		if (!nextMessages.length) return
		setActiveThreadId(threadId)
		const nextThread: StoredChatThread = {
			id: threadId,
			title: buildThreadTitle(nextMessages, nextResponse),
			updatedAt: new Date().toISOString(),
			messages: nextMessages,
			lastResponse: nextResponse,
		}
		const merged = [nextThread, ...threads.filter((thread) => thread.id !== threadId)].slice(0, 12)
		persistThreads(merged)
	}

	useEffect(() => {
		if (typeof window === 'undefined') return
		const raw = window.localStorage.getItem(AGENT_CHAT_STORAGE_KEY)
		if (!raw) return
		try {
			const parsed = JSON.parse(raw) as StoredChatThread[]
			if (!Array.isArray(parsed)) return
			setThreads(parsed)
		} catch {
			// ignore bad local history
		}
	}, [])

	useEffect(() => {
		if (!messages.length && !lastResponse) return
		saveCurrentThread(messages, lastResponse)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [messages, lastResponse])

	const loadThread = (thread: StoredChatThread) => {
		setActiveThreadId(thread.id)
		setMessages(thread.messages)
		setLastResponse(thread.lastResponse)
		setHistoryOpen(false)
		setOpen(true)
	}

	const clearThread = (threadId: string) => {
		const next = threads.filter((thread) => thread.id !== threadId)
		persistThreads(next)
		if (activeThreadId === threadId) {
			setActiveThreadId(null)
			setMessages([])
			setLastResponse(null)
		}
	}

	const startNewChat = () => {
		setActiveThreadId(null)
		setMessages([])
		setLastResponse(null)
		setInput('')
		setActionsOpen(false)
		setHistoryOpen(false)
	}

	const visibleThreads = useMemo(() => threads.slice(0, 8), [threads])

	const runAction = async (action: AgentAction, promptOverride?: string) => {
		const target = actionRoutes[action.type]
		if (!target) return
		const lastPrompt = promptOverride || [...messages].reverse().find((msg) => msg.role === 'user')?.content || ''
		const payload = {
			...action.payload,
			prompt: lastPrompt,
			city: detectCity(lastPrompt),
		}
		sessionStorage.setItem('agentAction', JSON.stringify({ type: action.type, payload }))
		if (action.type === 'REQUEST_GROUP_JOIN') {
			const groupId = typeof action.payload?.groupId === 'string' ? action.payload.groupId : null
			const title = typeof action.payload?.title === 'string' ? action.payload.title : 'the selected group'
			if (!groupId) return
			try {
				await joinPublicGroup(groupId)
				setMessages((prev) => [
					...prev,
					{
						id: `${Date.now()}-assistant-join`,
						role: 'assistant',
						content: `Join request sent for ${title}. I opened the groups page so you can track the status.`,
					},
				])
				navigate('/user/groups')
				setOpen(false)
			} catch {
				setMessages((prev) => [
					...prev,
					{
						id: `${Date.now()}-assistant-join-error`,
						role: 'assistant',
						content: `I couldn't send the join request for ${title} right now. Open Groups and try again there.`,
					},
				])
			}
			return
		}
		const tripId = typeof action.payload?.tripId === 'string' ? action.payload.tripId : null
		if (action.type === 'SHOW_TRIPS' && tripId) {
			navigate(`/user/trip-plan?trip=${encodeURIComponent(tripId)}`)
		} else if (action.type === 'SHOW_MAP' && tripId) {
			navigate(`/user/maps?trip=${encodeURIComponent(tripId)}`)
		} else {
			navigate(target.href)
		}
		setOpen(false)
	}

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, loading, open])

	useEffect(() => {
		if (typeof document === 'undefined') return
		if (!open) return
		if (!isMobile) return
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = previousOverflow
		}
	}, [isMobile, open])

	useEffect(() => {
		if (typeof window === 'undefined' || !isMobile) return
		const minTop = Math.round(window.innerHeight * MOBILE_AGENT_DEFAULT_TOP_RATIO)
		setMobileSheetTop((current) => {
			if (current > 0) return current
			return minTop
		})
	}, [isMobile])

	useEffect(() => {
		if (typeof window === 'undefined' || !isMobile || !open) return
		setMobileSheetTop(Math.round(window.innerHeight * MOBILE_AGENT_DEFAULT_TOP_RATIO))
	}, [isMobile, open])

	useEffect(() => {
		if (typeof window === 'undefined') return
		const handleVisibility = (event: Event) => {
			const detail = (event as CustomEvent<{ hidden?: boolean }>).detail
			const hidden = Boolean(detail?.hidden)
			setHiddenByPage(hidden)
			if (hidden) {
				setOpen(false)
				setHistoryOpen(false)
				setActionsOpen(false)
			}
		}
		window.addEventListener(AGENT_VISIBILITY_EVENT, handleVisibility as EventListener)
		return () => window.removeEventListener(AGENT_VISIBILITY_EVENT, handleVisibility as EventListener)
	}, [])

	// On phones the assistant opens from the tab bar instead of a floating button
	useEffect(() => {
		const openFromNav = () => setOpen(true)
		window.addEventListener(OPEN_ASSISTANT_EVENT, openFromNav)
		return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, openFromNav)
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined' || !isMobile) return
		const handleResize = () => {
			const minTop = Math.round(window.innerHeight * MOBILE_AGENT_DEFAULT_TOP_RATIO)
			const maxTop = Math.round(window.innerHeight * MOBILE_AGENT_MAX_TOP_RATIO)
			setMobileSheetTop((current) => {
				if (!current) return minTop
				return Math.min(maxTop, Math.max(minTop, current))
			})
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [isMobile])

	useEffect(() => {
		const consumePlannerNotice = () => {
			const storedNotice = readHeroStorage(HERO_AGENT_NOTICE_KEY)
			const storedFollowup = readHeroStorage(HERO_AGENT_FOLLOWUP_KEY)
			const storedResult = readHeroStorage(HERO_PLANNER_RESULT_KEY)
			const storedTrip = readHeroGeneratedTrip()
			if (!storedNotice && !storedFollowup && !storedResult && !storedTrip) return

			let notice = storedNotice?.trim() || 'Got it. I’m building your agenda now.'
			let followup = storedFollowup?.trim() || ''

			if (storedResult) {
				try {
					const parsed = JSON.parse(storedResult) as StoredHeroPlannerResult
					if (parsed?.response) {
						setLastResponse(parsed.response)
						if (parsed.response.answer?.trim()) {
							notice = parsed.response.answer.trim()
						}
					}
				} catch {
					// Ignore broken session state and keep the generic notice.
				}
			}

			if (!followup && storedTrip) {
				followup = buildHeroGeneratedTripFollowup(storedTrip) ?? ''
			}

			removeHeroStorage(HERO_AGENT_NOTICE_KEY)
			removeHeroStorage(HERO_AGENT_FOLLOWUP_KEY)
			setMessages((prev) => {
				const next = [...prev]
				if (notice && !next.some((msg) => msg.role === 'assistant' && msg.content === notice)) {
					next.push({ id: `hero-planner-${Date.now()}`, role: 'assistant', content: notice })
				}
				if (followup && !next.some((msg) => msg.role === 'assistant' && msg.content === followup)) {
					next.push({ id: `hero-track-${Date.now()}`, role: 'assistant', content: followup })
				}
				return next
			})
		}

		consumePlannerNotice()
		window.addEventListener(HERO_PLANNER_READY_EVENT, consumePlannerNotice)

		return () => {
			window.removeEventListener(HERO_PLANNER_READY_EVENT, consumePlannerNotice)
		}
	}, [])

	const sendMessage = async (text: string) => {
		const trimmed = text.trim()
		if (!trimmed || loading) return

		const history = messages.slice(-6).map((msg) => ({
			role: msg.role,
			content: msg.content,
		}))

		setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', content: trimmed }])
		setInput('')
		setLoading(true)

		try {
			const { data } = await requestHeroAgent<HeroAgentResponse>(trimmed, history)
			let nextResponse = data
			const routeIntent = Boolean(data.travelPlan) || /(agenda|route|itinerary|trip plan|map)/i.test(trimmed)
			if (routeIntent && data.travelPlan) {
				const persisted = await persistPlannerFromChat(trimmed, data)
				if (persisted?.tripId) {
					nextResponse = {
						...data,
						actions: (data.actions ?? []).map((action) =>
							action.type === 'SHOW_TRIPS' || action.type === 'SHOW_MAP'
								? {
									...action,
									payload: {
										...(action.payload ?? {}),
										tripId: persisted.tripId,
									},
								  }
								: action,
						),
					}
				}
			}
			setLastResponse(nextResponse)
			setActionsOpen(Boolean(nextResponse.actions?.length))
			setMessages((prev) => [
				...prev,
				{
					id: `${Date.now()}-assistant`,
					role: 'assistant',
					content: nextResponse.answer,
				},
			])
			const followUp = nextResponse.followUpQuestion?.trim()
			if (followUp) {
				setMessages((prev) => [
					...prev,
					{
						id: `${Date.now()}-followup`,
						role: 'assistant',
						content: followUp,
					},
				])
			}

			const lowerPrompt = trimmed.toLowerCase()
			const wantsRoute = /(route|map|navigate|navigation|itinerary)/.test(lowerPrompt)
			const autoAction = nextResponse.actions?.find((action) => {
				if (/(agenda|trip plan|history|open agenda|open history)/.test(lowerPrompt)) {
					return action.type === 'SHOW_TRIPS'
				}
				if (/(match|matching|swipe|find people|people like me)/.test(lowerPrompt)) {
					return action.type === 'SHOW_MATCH'
				}
				if (action.type === 'REQUEST_GROUP_JOIN') return true
				if (wantsRoute) {
					return action.type === 'SHOW_MAP'
				}
				if (action.type === 'SHOW_MATCH' && /(match|matching|swipe|people like me|similar travelers|find people)/.test(lowerPrompt)) {
					return true
				}
				if (action.type === 'SHOW_GROUPS' && nextResponse.intent === 'collaboration') return true
				if (action.type === 'SHOW_GUIDES' && nextResponse.intent === 'guide') return true
				if (action.type === 'SHOW_TRIPS' && (nextResponse.intent === 'booking' || nextResponse.intent === 'new_trip')) {
					return true
				}
				return false
			})

			if (autoAction) {
				setTimeout(() => {
					void runAction(autoAction, trimmed)
				}, 400)
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{
					id: `${Date.now()}-assistant-error`,
					role: 'assistant',
					content: 'I had trouble reaching the agent. Try again in a moment.',
				},
			])
		} finally {
			setLoading(false)
		}
	}

	const handleMobileDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!isMobile) return
		dragStateRef.current = {
			pointerId: event.pointerId,
			startY: event.clientY,
			startTop: mobileSheetTop || Math.round(window.innerHeight * MOBILE_AGENT_DEFAULT_TOP_RATIO),
		}
		event.currentTarget.setPointerCapture(event.pointerId)
	}

	const handleMobileDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!isMobile) return
		if (dragStateRef.current.pointerId !== event.pointerId) return
		const minTop = Math.round(window.innerHeight * MOBILE_AGENT_MIN_TOP_RATIO)
		const maxTop = Math.round(window.innerHeight * MOBILE_AGENT_MAX_TOP_RATIO)
		const delta = event.clientY - dragStateRef.current.startY
		const nextTop = Math.min(maxTop, Math.max(minTop, dragStateRef.current.startTop + delta))
		setMobileSheetTop(nextTop)
	}

	const handleMobileDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (!isMobile) return
		if (dragStateRef.current.pointerId !== event.pointerId) return
		const dismissThreshold = Math.round(window.innerHeight * MOBILE_AGENT_DISMISS_TOP_RATIO)
		const closeThreshold = Math.round(window.innerHeight * MOBILE_AGENT_CLOSE_TOP_RATIO)
		if (mobileSheetTop >= closeThreshold) {
			setOpen(false)
			setHistoryOpen(false)
			setActionsOpen(false)
		} else if (mobileSheetTop > dismissThreshold) {
			setMobileSheetTop(Math.round(window.innerHeight * MOBILE_AGENT_DEFAULT_TOP_RATIO))
		}
		dragStateRef.current.pointerId = null
		event.currentTarget.releasePointerCapture(event.pointerId)
	}

	return (
		<>
			<button
				onClick={() => setOpen((o) => !o)}
				className={`fixed z-[90] items-center justify-center text-white ring-2 ring-white/85 transition duration-200 hover:-translate-y-px hover:shadow-[0_24px_50px_rgba(249,115,22,0.4)] active:scale-95 ${
					isMobile
						? 'hidden'
						: open || hiddenByPage
						? 'pointer-events-none opacity-0'
						: 'pointer-events-auto opacity-100'
				} ${
					isMobile
						? 'bottom-[calc(env(safe-area-inset-bottom)+84px)] right-4 flex h-12 w-12 rounded-full bg-linear-to-br from-orange-500 via-orange-500 to-amber-500 shadow-[0_18px_40px_rgba(249,115,22,0.30)]'
						: 'bottom-6 right-6 flex h-12 w-12 rounded-full bg-linear-to-br from-orange-500 via-orange-500 to-amber-500 shadow-[0_18px_40px_rgba(249,115,22,0.35)]'
				}`}
				aria-label='Open travel assistant'
			>
				{open ? <X className='h-5 w-5' /> : <MessageCircleMore className='h-5 w-5' />}
			</button>

			{open ? (
			<div className={`fixed inset-0 z-[100] transition-all duration-200 ${isMobile ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-100'}`}>
				<div
					className={`absolute inset-0 ${isMobile ? 'bg-[rgba(15,23,42,0.42)] backdrop-blur-sm' : 'pointer-events-none bg-transparent'}`}
					onClick={() => isMobile && setOpen(false)}
				/>
				<div
					className={`absolute pointer-events-auto flex flex-col overflow-hidden bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-all duration-200 ${
						isMobile
							? 'inset-x-0 bottom-0 mx-auto w-full rounded-t-[28px]'
							: 'bottom-6 right-6 h-[min(76vh,720px)] w-[400px] rounded-[28px] border border-white/70 bg-white/96 ring-1 ring-orange-100/70'
					} translate-y-0 scale-100`}
					style={isMobile ? { top: `${mobileSheetTop || Math.round(MOBILE_AGENT_DEFAULT_TOP_RATIO * (typeof window !== 'undefined' ? window.innerHeight : 0))}px` } : undefined}
				>
				<div
					className={`flex items-center gap-3 border-b border-zinc-100/80 bg-linear-to-r from-white via-white to-orange-50 px-4 py-3 sm:px-5 sm:py-4 ${isMobile ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
					onPointerDown={handleMobileDragStart}
					onPointerMove={handleMobileDragMove}
					onPointerUp={handleMobileDragEnd}
					onPointerCancel={handleMobileDragEnd}
				>
					{isMobile ? <div className='absolute left-1/2 top-2 h-1.5 w-14 -translate-x-1/2 rounded-full bg-zinc-200' /> : null}
					<div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)]'>
						<MessageCircleMore className='h-4 w-4' />
					</div>
					<div className='flex-1'>
						<p className='text-sm font-semibold text-zinc-900'>Trippple Agent</p>
						<div className='mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400'>
							<span className='inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400' />
							Online • Your travel concierge
						</div>
					</div>
					<div className='flex items-center gap-1'>
						<button onClick={() => setHistoryOpen((value) => !value)} className='rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600'>
							<History className='h-4 w-4' />
						</button>
						<button onClick={startNewChat} className='rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600'>
							<MessageCircleMore className='h-4 w-4' />
						</button>
						<button onClick={() => setOpen(false)} className='rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600'>
						<X className='h-5 w-5' />
					</button>
					</div>
				</div>

				<div className='flex-1 min-h-0 space-y-3 overflow-y-auto px-4 py-4 pb-24 sm:px-5 sm:py-5'>
					{messages.length === 0 && !loading ? (
						<div className='rounded-3xl border border-orange-100/80 bg-linear-to-br from-orange-50 via-white to-amber-50 px-4 py-4 shadow-[0_14px_34px_rgba(249,115,22,0.08)]'>
							<div className='flex items-start gap-3'>
								<div className='mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-100 text-orange-600'>
									<MessageCircleMore className='h-4 w-4' />
								</div>
								<div className='min-w-0'>
									<p className='text-sm font-semibold text-zinc-900'>Ask for one travel task</p>
									<p className='mt-1 text-[12px] leading-5 text-zinc-500'>
										I can open sections, build routes, and send group join requests when your prompt is clear.
									</p>
									<div className='mt-3 flex flex-wrap gap-2'>
										{CAPABILITY_COPY.map((item) => (
											<span key={item} className='rounded-full border border-orange-100 bg-white px-2.5 py-1 text-[10px] font-semibold text-orange-600 shadow-sm'>
												{item}
											</span>
										))}
									</div>
								</div>
							</div>
						</div>
					) : null}

					{messages.map((msg) => (
							<div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
								<div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[72%] ${msg.role === 'user' ? 'bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-[0_12px_25px_rgba(249,115,22,0.25)]' : 'border border-zinc-100 bg-white/90 text-zinc-700 shadow-[0_10px_20px_rgba(24,24,27,0.06)]'}`}>{msg.content}</div>
							</div>
						))}
					{loading && (
						<div className='flex justify-start'>
							<div className='flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-3 py-2 text-xs text-zinc-400 shadow-[0_8px_18px_rgba(24,24,27,0.06)]'>
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
								Thinking...
							</div>
						</div>
					)}

					{historyOpen && (
						<div className='rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm'>
							<div className='mb-2 flex items-center justify-between'>
								<p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400'>Chat history</p>
								<button onClick={startNewChat} className='text-[11px] font-semibold text-orange-600 hover:text-orange-700'>New chat</button>
							</div>
							<div className='space-y-2'>
								{visibleThreads.length ? visibleThreads.map((thread) => (
									<div key={thread.id} className='flex items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 px-2.5 py-2'>
										<button onClick={() => loadThread(thread)} className='min-w-0 flex-1 text-left'>
											<p className='truncate text-[12px] font-semibold text-zinc-800'>{thread.title}</p>
											<p className='mt-0.5 text-[10px] text-zinc-400'>{new Date(thread.updatedAt).toLocaleString()}</p>
										</button>
										<button onClick={() => clearThread(thread.id)} className='rounded-full p-1.5 text-zinc-400 transition hover:bg-white hover:text-red-500'>
											<Trash2 className='h-3.5 w-3.5' />
										</button>
									</div>
								)) : (
									<p className='text-[12px] text-zinc-400'>No saved chats yet.</p>
								)}
							</div>
						</div>
					)}

					{lastResponse && (lastResponse.bookings?.length > 0 || lastResponse.actions?.length > 0) && (
						<div className='rounded-2xl border border-orange-100/70 bg-white/90 px-3 py-3 shadow-[0_12px_26px_rgba(249,115,22,0.08)]'>
							<div className='flex items-center justify-between gap-2'>
								<p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400'>
									Ready
								</p>
								<span className='rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-600'>
									{intentLabel(lastResponse.intent)}
								</span>
							</div>
							<div className='mt-2 flex flex-wrap gap-2'>
								{lastResponse.bookings?.slice(0, 2).map((booking, index) => (
									<span key={`${booking.title}-${index}`} className='rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600'>
										{booking.title}
									</span>
								))}
								{lastResponse.actions?.slice(0, 2).map((action, index) => {
									const target = actionRoutes[action.type]
									if (!target) return null
									return (
										<button
											key={`${action.type}-${index}-pill`}
											onClick={() => void runAction(action)}
											className='inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600 transition hover:bg-orange-100'
										>
											<target.icon className='h-3.5 w-3.5' />
											{target.label}
										</button>
									)
								})}
							</div>
						</div>
					)}

					<div ref={bottomRef} />
				</div>

				<div className='border-t border-zinc-100/80 bg-white/95 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-5 sm:py-4'>
					{lastResponse?.actions?.length ? (
						<div className='mb-3'>
							<button
								onClick={() => setActionsOpen((value) => !value)}
								className='flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-left'
							>
								<span className='text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400'>Actions</span>
								<ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
							</button>
							<div className={`grid transition-all duration-200 ${actionsOpen ? 'mt-2 grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
								<div className='min-h-0 overflow-hidden'>
									<div className='space-y-2'>
								{lastResponse.actions.map((action, index) => {
									const target = actionRoutes[action.type]
									if (!target) return null
									const Icon = target.icon
									return (
										<button key={`${action.type}-${index}`} onClick={() => void runAction(action)} className='group flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/40'>
											<span className='flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-50 text-orange-600'>
												<Icon className='h-4 w-4' />
											</span>
											<span className='flex-1'>
												<span className='block text-[13px] font-semibold text-zinc-900'>{target.label}</span>
												<span className='block text-[11px] text-zinc-500'>{target.description}</span>
											</span>
											<span className='flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition group-hover:border-orange-200 group-hover:text-orange-500'>
												<ArrowUpRight className='h-4 w-4' />
											</span>
										</button>
									)
								})}
									</div>
								</div>
							</div>
						</div>
					) : null}

					<div className='flex items-end gap-2'>
						<textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault()
									void sendMessage(input)
								}
							}}
							placeholder='Ask the Trippple agent...'
							rows={2}
							className='min-h-12 flex-1 resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200/50'
						/>
						<button onClick={() => void sendMessage(input)} disabled={loading || !input.trim()} className='flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-[0_12px_24px_rgba(249,115,22,0.3)] transition hover:-translate-y-px hover:shadow-[0_16px_30px_rgba(249,115,22,0.35)] disabled:opacity-40'>
							<Send className='h-4 w-4' />
						</button>
					</div>
				</div>
				</div>
			</div>
			) : null}
		</>
	)
}
