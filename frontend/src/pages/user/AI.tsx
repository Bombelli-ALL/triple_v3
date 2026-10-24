import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp, Hotel, Lightbulb, LoaderCircle, MapPin, Plane, Search, Compass, XCircle } from 'lucide-react'
import { requestHeroAgent } from '@/lib/agent'
import { trackGamificationEvent } from '@/lib/gamification'
import ZellijLineBackground from '@/components/ZellijLineBackground'
import { useNavigate } from 'react-router-dom'

type BookingSuggestion = {
	title: string
	type: 'flight' | 'stay' | 'activity' | 'transport' | 'rental' | 'guide' | 'other'
	priceRange?: string
	notes?: string
}

type TravelPlan = {
	from: { city: string; country: string }
	to: { city: string; country: string }
	duration: number
	totalBudget: number
	totalEstimatedCost: number
	budgetMatch: number
	flights: FlightOption[]
	hotels: HotelOption[]
	itinerary: DayPlan[]
	budgetBreakdown: BudgetBreakdown
	tips: string[]
	packingList: string[]
}

type FlightOption = {
	airline: string
	from: string
	to: string
	departure: string
	arrival: string
	duration: string
	stops: number
	price: number
	isBestValue: boolean
}

type HotelOption = {
	name: string
	stars: number
	pricePerNight: number
	totalPrice: number
	location: string
	rating: number
	amenities: string[]
	isRecommended: boolean
}

type DayPlan = {
	day: number
	theme: string
	morning: string[]
	afternoon: string[]
	evening: string[]
	estimatedDailyCost: number
}

type BudgetBreakdown = {
	flights: number
	hotels: number
	food: number
	activities: number
	transport: number
	misc: number
}

type HeroAgentResponse = {
	answer: string
	intent: 'booking' | 'information' | 'collaboration' | 'guide' | 'new_trip'
	followUpQuestion: string | null
	bookings: BookingSuggestion[]
	travelPlan?: TravelPlan
	actions: AgentAction[]
}

type AgentAction = {
	type: 'SHOW_TRIPS' | 'SHOW_MATCH' | 'SHOW_GROUPS' | 'REQUEST_GROUP_JOIN' | 'SHOW_BOOKINGS' | 'SHOW_GUIDES' | 'SHOW_MAP' | 'SHOW_QUESTS'
	payload?: Record<string, unknown>
}

type TripStopType = 'hotel' | 'cafe' | 'activity' | 'restaurant'

type TripPlanRouteStop = {
	id: string
	name: string
	type: TripStopType
	time: string
	description: string
	image: string
	mapUrl: string
	price?: string
	rating?: number
	address?: string
}

type TripPlanRouteDay = {
	day: number
	title: string
	summary: string
	area: string
	hotel: TripPlanRouteStop
	stops: TripPlanRouteStop[]
}

type TripPlanRouteState = {
	prompt: string
	city: string
	durationDays: number
	budgetDh: number | null
	customPlan: {
		city: string
		durationDays: number
		budgetDh: number | null
		title: string
		subtitle: string
		coverImage: string
		totalEstimate: string
		tags: string[]
		days: TripPlanRouteDay[]
	}
}

const LOADING_TEXTS = ['Reading your route and budget...', 'Comparing stays and transport...', 'Composing a cleaner trip rhythm...', 'Balancing cost against experience...', 'Finalizing your Morocco brief...']

const PROMPT_SUGGESTIONS = ['Marrakech for 5 days, 1800 USD budget, flying from Paris', 'Fes and Chefchaouen, 6 days, premium riads, from Madrid', 'Essaouira weekend escape, 3 days, 900 USD total, from Casablanca', 'Merzouga desert trip for 2 people, 7 days, 2200 USD, from London']

const TABS = ['Overview', 'Flights', 'Hotels', 'Itinerary', 'Budget', 'Tips']

const TRIP_PLAN_COVERS: Record<string, string> = {
	Fes: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=80',
	Meknes: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1400&q=80',
	Marrakech: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1400&q=80',
	Rabat: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=80',
	Casablanca: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
	Chefchaouen: 'https://images.unsplash.com/photo-1577147443647-81856d5151af?auto=format&fit=crop&w=1400&q=80',
	Essaouira: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1400&q=80',
}

const TRIP_PLAN_FALLBACKS: Record<TripStopType, string[]> = {
	hotel: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=900&q=80'],
	cafe: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80'],
	restaurant: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80'],
	activity: ['https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=900&q=80'],
}

const MOROCCO_CITIES = ['Agadir', 'Casablanca', 'Chefchaouen', 'Essaouira', 'Fes', 'Ifrane', 'Marrakech', 'Merzouga', 'Meknes', 'Ouarzazate', 'Rabat', 'Tangier', 'Tetouan']

const formatUsd = (value: number) => `$${value.toLocaleString('en-US')}`
const formatMad = (value: number) => `${(value * 10).toLocaleString('en-US')} MAD`

const tabButtonClass = (isActive: boolean) => `whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-zinc-950 text-white shadow-[0_14px_30px_rgba(24,24,27,0.16)]' : 'text-zinc-500 hover:bg-white hover:text-zinc-900'}`

const sectionCardClass = 'rounded-[28px] border border-zinc-200/80 bg-white/96 shadow-[0_16px_45px_rgba(24,24,27,0.06)] backdrop-blur'

const buildSearchMapUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

const fallbackImageFor = (type: TripStopType, seed: number) => TRIP_PLAN_FALLBACKS[type][seed % TRIP_PLAN_FALLBACKS[type].length]

const sentenceCase = (value: string) =>
	value
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/^[a-z]/, (match) => match.toUpperCase())

const extractCities = (text: string) => {
	const matches = MOROCCO_CITIES.filter((city) => new RegExp(`\\b${city}\\b`, 'i').test(text))
	return Array.from(new Set(matches))
}

const extractDuration = (text: string) => {
	const match = text.match(/(\d+)\s*-\s*day/i) ?? text.match(/(\d+)\s+days?/i) ?? text.match(/for\s+(\d+)\s+days?/i)
	const value = Number(match?.[1] ?? 0)
	return Number.isFinite(value) && value > 0 ? value : 5
}

const extractBudget = (text: string) => {
	const usdMatch = text.match(/(\d[\d,]*)\s*(usd|\$)/i) ?? text.match(/\$(\d[\d,]*)/i)
	if (usdMatch) {
		return Number(usdMatch[1].replace(/,/g, ''))
	}

	const madMatch = text.match(/(\d[\d,]*)\s*(mad|dh)/i)
	if (madMatch) {
		return Math.round(Number(madMatch[1].replace(/,/g, '')) / 10)
	}

	return 1500
}

const splitAnswerIntoHighlights = (answer: string) =>
	answer
		.split(/[.!?]\s+/)
		.map((part) => sentenceCase(part))
		.filter((part) => part.length > 10)

function toFallbackTravelPlan(prompt: string, response: HeroAgentResponse): TravelPlan {
	const sourceText = `${prompt} ${response.answer} ${response.followUpQuestion ?? ''}`
	const cities = extractCities(sourceText)
	const destinationCity = cities[0] ?? 'Marrakech'
	const secondaryCity = cities[1] ?? destinationCity
	const duration = extractDuration(sourceText)
	const totalBudget = extractBudget(sourceText)
	const highlights = splitAnswerIntoHighlights(response.answer)
	const itinerary = Array.from({ length: duration }, (_, index) => {
		const dayNumber = index + 1
		const cityForDay = dayNumber <= Math.ceil(duration / 2) ? destinationCity : secondaryCity
		const leadHighlight = highlights[index] ?? `Explore the character, food, and landmarks of ${cityForDay}.`
		const secondHighlight = highlights[index + 1] ?? `Keep the pace balanced with local stops and flexible free time in ${cityForDay}.`

		return {
			day: dayNumber,
			theme: dayNumber === 1 ? `Arrival in ${cityForDay}` : dayNumber === duration ? `Final day in ${cityForDay}` : `${cityForDay} discoveries`,
			morning: [dayNumber === 1 ? `Arrival and riad check-in in ${cityForDay}.` : leadHighlight],
			afternoon: [secondHighlight, `Walk central areas, local markets, and signature spots in ${cityForDay}.`],
			evening: [`Dinner and a relaxed evening atmosphere in ${cityForDay}.`],
			estimatedDailyCost: Math.max(120, Math.round(totalBudget / duration)),
		}
	})

	const hotelCards = response.bookings.filter((booking) => booking.type === 'stay')
	const flightCards = response.bookings.filter((booking) => booking.type === 'flight')
	const estimatedFlights = Math.max(250, Math.round(totalBudget * 0.28))
	const estimatedHotels = Math.max(320, Math.round(totalBudget * 0.34))
	const estimatedFood = Math.max(160, Math.round(totalBudget * 0.16))
	const estimatedActivities = Math.max(180, Math.round(totalBudget * 0.14))
	const estimatedTransport = Math.max(90, Math.round(totalBudget * 0.05))
	const estimatedMisc = Math.max(60, totalBudget - estimatedFlights - estimatedHotels - estimatedFood - estimatedActivities - estimatedTransport)
	const totalEstimatedCost = estimatedFlights + estimatedHotels + estimatedFood + estimatedActivities + estimatedTransport + estimatedMisc

	return {
		from: { city: 'Madrid', country: 'Spain' },
		to: { city: destinationCity, country: 'Morocco' },
		duration,
		totalBudget,
		totalEstimatedCost,
		budgetMatch: Math.max(0, Math.min(100, Math.round((totalBudget / totalEstimatedCost) * 100))),
		flights:
			flightCards.length > 0
				? flightCards.map((booking, index) => ({
						airline: booking.title,
						from: 'Madrid',
						to: destinationCity,
						departure: index === 0 ? '08:30' : '12:45',
						arrival: index === 0 ? '10:10' : '14:25',
						duration: '1h 40m',
						stops: 0,
						price: Math.max(120, Math.round(estimatedFlights / Math.max(flightCards.length, 1))),
						isBestValue: index === 0,
					}))
				: [
						{
							airline: 'Suggested flight option',
							from: 'Madrid',
							to: destinationCity,
							departure: '08:30',
							arrival: '10:10',
							duration: '1h 40m',
							stops: 0,
							price: estimatedFlights,
							isBestValue: true,
						},
					],
		hotels:
			hotelCards.length > 0
				? hotelCards.map((booking, index) => ({
						name: booking.title,
						stars: 5,
						pricePerNight: Math.max(80, Math.round(estimatedHotels / duration)),
						totalPrice: estimatedHotels,
						location: index === 0 ? destinationCity : secondaryCity,
						rating: 4.8,
						amenities: ['Breakfast', 'Wi-Fi', 'Central location'],
						isRecommended: index === 0,
					}))
				: [
						{
							name: `Premium riad in ${destinationCity}`,
							stars: 5,
							pricePerNight: Math.max(80, Math.round(estimatedHotels / duration)),
							totalPrice: estimatedHotels,
							location: destinationCity,
							rating: 4.8,
							amenities: ['Breakfast', 'Wi-Fi', 'Central location'],
							isRecommended: true,
						},
					],
		itinerary,
		budgetBreakdown: {
			flights: estimatedFlights,
			hotels: estimatedHotels,
			food: estimatedFood,
			activities: estimatedActivities,
			transport: estimatedTransport,
			misc: estimatedMisc,
		},
		tips: highlights.slice(0, 4).length > 0 ? highlights.slice(0, 4) : [`Book riads in ${destinationCity} early for the best premium options.`, `Keep one slower half-day to enjoy the medina without rushing.`, `Use private transfers between cities when comfort matters most.`],
		packingList: ['Passport', 'Comfortable walking shoes', 'Light layers', 'Phone charger', 'Day bag', 'Travel documents'],
	}
}

const normalizeHeroResponse = (prompt: string, response: HeroAgentResponse): HeroAgentResponse => {
	if (response.travelPlan?.itinerary?.length) return response
	return {
		...response,
		travelPlan: toFallbackTravelPlan(prompt, response),
	}
}

const toTripPlanRouteState = (prompt: string, response: HeroAgentResponse): TripPlanRouteState | null => {
	const travelPlan = response.travelPlan
	if (!travelPlan?.itinerary?.length) return null

	const destinationCity = travelPlan.to.city || 'Fes'
	const hotelTemplate = travelPlan.hotels?.find((hotel) => hotel.isRecommended) || travelPlan.hotels?.[0]

	const days: TripPlanRouteDay[] = travelPlan.itinerary.map((day, index) => {
		const hotelName = hotelTemplate?.name || `Premium stay in ${destinationCity}`
		const hotelLocation = hotelTemplate?.location || destinationCity
		const hotelStop: TripPlanRouteStop = {
			id: `hotel-${day.day}`,
			name: hotelName,
			type: 'hotel',
			time: 'Check-in',
			description: `Stay in ${hotelLocation} with a comfortable premium base for day ${day.day}.`,
			image: fallbackImageFor('hotel', index),
			mapUrl: buildSearchMapUrl(`${hotelName} ${hotelLocation} Morocco`),
			price: hotelTemplate ? `${hotelTemplate.pricePerNight}/night` : undefined,
			rating: hotelTemplate?.rating,
			address: hotelLocation,
		}

		const stopBlocks: Array<{ time: string; items: string[]; type: TripStopType }> = [
			{ time: '09:00', items: day.morning, type: 'activity' },
			{ time: '13:00', items: day.afternoon, type: 'cafe' },
			{ time: '19:00', items: day.evening, type: 'restaurant' },
		]

		const stops = stopBlocks.flatMap((block, blockIndex) =>
			block.items.map((item, itemIndex) => ({
				id: `day-${day.day}-${blockIndex}-${itemIndex}`,
				name: sentenceCase(item).slice(0, 54),
				type: block.type,
				time: block.time,
				description: sentenceCase(item),
				image: fallbackImageFor(block.type, index + blockIndex + itemIndex),
				mapUrl: buildSearchMapUrl(`${item} ${destinationCity} Morocco`),
				address: destinationCity,
			})),
		)

		return {
			day: day.day,
			title: day.theme,
			summary: day.afternoon?.[0] || day.morning?.[0] || `Discover ${destinationCity} at a comfortable pace.`,
			area: destinationCity,
			hotel: hotelStop,
			stops,
		}
	})

	return {
		prompt,
		city: destinationCity,
		durationDays: travelPlan.duration,
		budgetDh: Math.round(travelPlan.totalBudget * 10),
		customPlan: {
			city: destinationCity,
			durationDays: travelPlan.duration,
			budgetDh: Math.round(travelPlan.totalBudget * 10),
			title: `${destinationCity} itinerary`,
			subtitle: response.answer,
			coverImage: TRIP_PLAN_COVERS[destinationCity] ?? TRIP_PLAN_COVERS.Fes,
			totalEstimate: `${formatUsd(travelPlan.totalEstimatedCost)} / ${formatMad(travelPlan.totalEstimatedCost)}`,
			tags: [destinationCity, `${travelPlan.duration} days`],
			days,
		},
	}
}

export default function UserAI() {
	const navigate = useNavigate()
	const [phase, setPhase] = useState<'idle' | 'loading' | 'result' | 'error'>('idle')
	const [input, setInput] = useState('')
	const [plan, setPlan] = useState<HeroAgentResponse | null>(null)
	const [activeTab, setActiveTab] = useState(0)
	const [openDays, setOpenDays] = useState<number[]>([1])
	const [checkedItems, setCheckedItems] = useState<string[]>([])
	const [errorMsg, setErrorMsg] = useState('')
	const [loadingTextIndex, setLoadingTextIndex] = useState(0)
	const [progressWidth, setProgressWidth] = useState(0)
	const [agendaJumpPending, setAgendaJumpPending] = useState(false)
	const itinerarySectionRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		let textInterval: ReturnType<typeof setInterval> | undefined
		let progressTimer: ReturnType<typeof setTimeout> | undefined

		if (phase === 'loading') {
			textInterval = setInterval(() => {
				setLoadingTextIndex((index) => (index + 1) % LOADING_TEXTS.length)
			}, 1200)

			progressTimer = setTimeout(() => {
				setProgressWidth(92)
			}, 80)
		}

		return () => {
			if (textInterval) clearInterval(textInterval)
			if (progressTimer) clearTimeout(progressTimer)
		}
	}, [phase])

	useEffect(() => {
		if (activeTab !== 3 || !agendaJumpPending) return
		const frameId = window.requestAnimationFrame(() => {
			itinerarySectionRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			})
			setAgendaJumpPending(false)
		})

		return () => window.cancelAnimationFrame(frameId)
	}, [activeTab, agendaJumpPending])

	const handleSubmit = async () => {
		if (!input.trim()) return
		const submittedPrompt = input.trim()
		setErrorMsg('')
		setLoadingTextIndex(0)
		setProgressWidth(0)
		setPhase('loading')
		try {
			const res = await requestHeroAgent<HeroAgentResponse>(submittedPrompt)
			const normalized = normalizeHeroResponse(submittedPrompt, res.data)
			const routeState = toTripPlanRouteState(submittedPrompt, normalized)
			if (routeState) {
				sessionStorage.setItem('heroPromptContext', JSON.stringify(routeState))
				navigate('/user/trip-plan', { state: routeState })
				return
			}
			setPlan(normalized)
			setPhase('result')
			setActiveTab(0)
			void trackGamificationEvent('AI_PROMPT_SENT').catch(() => {
				// The UI should still resolve even if analytics fails.
			})
		} catch {
			setErrorMsg('The planner could not finish this request. Please try again.')
			setPhase('error')
		}
	}

	const handleToggleDay = (dayIndex: number) => {
		setOpenDays((prev) => (prev.includes(dayIndex) ? prev.filter((day) => day !== dayIndex) : [...prev, dayIndex]))
	}

	const handleToggleItem = (item: string) => {
		setCheckedItems((prev) => (prev.includes(item) ? prev.filter((entry) => entry !== item) : [...prev, item]))
	}

	const resetToIdle = () => {
		setPhase('idle')
		setPlan(null)
		setInput('')
		setActiveTab(0)
		setOpenDays([1])
		setCheckedItems([])
		setErrorMsg('')
		setProgressWidth(0)
		setAgendaJumpPending(false)
	}

	const openAgenda = () => {
		if (plan?.travelPlan?.itinerary?.length) {
			setOpenDays(plan.travelPlan.itinerary.map((day) => day.day))
		}
		setAgendaJumpPending(true)
		setActiveTab(3)
	}

	if (phase === 'idle') {
		return (
			<div className='mx-auto max-w-5xl px-1 pb-10'>
				<section className='relative overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f1e7_100%)] p-6 shadow-[0_24px_70px_rgba(24,24,27,0.07)] sm:p-8'>
					<div className='absolute inset-0 opacity-[0.18]'>
						<ZellijLineBackground />
					</div>
					<div className='relative mx-auto max-w-4xl'>
						<div className='text-center'>
							<div className='inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 shadow-sm'>
								<Compass className='h-3.5 w-3.5 text-orange-500' />
								Trip planner
							</div>
							<h1 className='mt-5 text-[36px] font-semibold leading-[0.96] tracking-[-0.05em] text-zinc-950 sm:text-[52px]'>
								<span className='block'>
									Plan Your
									<span
										className='inline-block text-orange-500'
										style={{
											fontFamily: '"Dancing Script", cursive',
											fontWeight: 700,
											letterSpacing: '-0.01em',
										}}>
										Morocco
									</span>
								</span>
								<span className='block'>Trip</span>
							</h1>
							<p className='mt-4 text-sm leading-7 text-zinc-600 sm:text-base'>Route, days, budget, style.</p>
						</div>
					</div>

					<div className='relative mx-auto mt-8 max-w-4xl'>
						<div className='rounded-full flex items-center gap-3 border border-zinc-200 bg-white p-2 shadow-[0_16px_40px_rgba(24,24,27,0.08)]'>
								
								<div className='flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)]'>
									<MapPin className='h-4.5 w-4.5' />
								</div>
								
								<input
									type='text'
									value={input}
									onChange={(event) => setInput(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											void handleSubmit()
										}
									}}
									className='h-11.5 w-full min-w-0 flex-1 bg-transparent pr-2 text-[15px] font-medium text-zinc-800 outline-none sm:text-[16px]'
									placeholder='Marrakech for 5 days, from Paris, 1800 USD budget, boutique riad'
								/>
								
								<button type='button' onClick={handleSubmit} disabled={!input.trim()} className='flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70'>
									<Search className='h-4.5 w-4.5' />
								</button>

						</div>

						<div className='mt-4 flex flex-wrap gap-2'>
							{PROMPT_SUGGESTIONS.map((chip) => (
								<button key={chip} type='button' onClick={() => setInput(chip)} className='rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-orange-300 hover:text-orange-600'>
									{chip}
								</button>
							))}
						</div>

						<div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
							<div className='flex flex-wrap items-center gap-2 text-xs text-zinc-400'>
								<span className='rounded-full bg-zinc-50 px-3 py-1.5'>Flights</span>
								<span className='rounded-full bg-zinc-50 px-3 py-1.5'>Stays</span>
								<span className='rounded-full bg-zinc-50 px-3 py-1.5'>Agenda</span>
								<span className='rounded-full bg-zinc-50 px-3 py-1.5'>Budget</span>
							</div>
							<div className='text-xs text-zinc-400'>One clean prompt works best.</div>
						</div>
					</div>
				</section>
			</div>
		)
	}

	if (phase === 'loading') {
		return (
			<div className='mx-auto max-w-3xl px-1 py-10'>
				<div className='overflow-hidden rounded-[30px] border border-zinc-200/80 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)]'>
					<div className='mx-auto max-w-lg text-center'>
						<div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-white'>
							<LoaderCircle className='h-5 w-5 animate-spin' />
						</div>
						<h2 className='mt-5 text-2xl font-semibold text-zinc-950'>Building your plan</h2>
						<p className='mt-3 text-sm text-zinc-500'>{LOADING_TEXTS[loadingTextIndex]}</p>
						<div className='mt-6 overflow-hidden rounded-full bg-zinc-200'>
							<div className='h-2 rounded-full bg-[linear-gradient(90deg,#18181b_0%,#f97316_100%)] transition-all duration-4000 ease-linear' style={{ width: `${progressWidth}%` }} />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (phase === 'error') {
		return (
			<div className='mx-auto max-w-2xl px-1 py-10'>
				<div className='rounded-[32px] border border-rose-200 bg-[linear-gradient(180deg,#fffaf9_0%,#ffffff_100%)] p-8 text-center shadow-[0_20px_60px_rgba(225,29,72,0.08)]'>
					<div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500'>
						<XCircle className='h-8 w-8' />
					</div>
					<h2 className='mt-5 text-2xl font-semibold text-zinc-950'>The planner hit a problem.</h2>
					<p className='mt-3 text-sm leading-7 text-zinc-600'>{errorMsg}</p>
					<button type='button' onClick={resetToIdle} className='mt-6 rounded-[18px] bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900'>
						Start Again
					</button>
				</div>
			</div>
		)
	}

	if (!plan) return null

	if (!plan.travelPlan) {
		return (
			<div className='mx-auto max-w-4xl space-y-6 px-1 pb-10'>
				<div className='rounded-[30px] border border-orange-200/70 bg-[linear-gradient(135deg,#fff8f1_0%,#ffffff_100%)] p-6 shadow-[0_18px_50px_rgba(249,115,22,0.08)]'>
					<p className='text-sm leading-7 text-zinc-700'>{plan.answer}</p>
				</div>

				<div className='grid gap-4 sm:grid-cols-2'>
					{plan.bookings.map((booking, index) => (
						<div key={`${booking.title}-${index}`} className={`${sectionCardClass} p-5`}>
							<div className='flex items-start justify-between gap-3'>
								<div>
									<h3 className='text-base font-semibold text-zinc-950'>{booking.title}</h3>
									{booking.priceRange && <p className='mt-2 text-sm font-medium text-orange-600'>{booking.priceRange}</p>}
								</div>
								<span className='rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500'>{booking.type}</span>
							</div>
							{booking.notes && <p className='mt-3 text-sm leading-6 text-zinc-600'>{booking.notes}</p>}
						</div>
					))}
				</div>

				<button type='button' onClick={resetToIdle} className='rounded-[18px] bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900'>
					New Plan
				</button>
			</div>
		)
	}

	const { travelPlan } = plan
	const bestFlight = travelPlan.flights?.find((flight) => flight.isBestValue) || travelPlan.flights?.[0]
	const recommendedHotel = travelPlan.hotels?.find((hotel) => hotel.isRecommended) || travelPlan.hotels?.[0]
	const packingProgress = ((checkedItems.length || 0) / Math.max(travelPlan.packingList?.length || 0, 1)) * 100

	return (
		<div className='mx-auto max-w-6xl space-y-6 px-1 pb-10'>
			<section className='relative overflow-hidden rounded-[34px] border border-[#eadfce] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f1e7_100%)] p-6 shadow-[0_24px_70px_rgba(24,24,27,0.07)] sm:p-8'>
				<div className='absolute inset-0 opacity-[0.16]'>
					<ZellijLineBackground />
				</div>
				<div className='relative'>
					<div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end'>
						<div>
							<div className='inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600 shadow-sm'>
								<Compass className='h-3.5 w-3.5 text-orange-500' />
								Your Plan
							</div>
							<h1 className='mt-5 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl'>
								{travelPlan.from.city} to {travelPlan.to.city}
							</h1>
							<p className='mt-3 max-w-2xl text-sm text-zinc-600'>{plan.answer}</p>
							{plan.followUpQuestion && <p className='mt-2 text-sm text-zinc-500'>{plan.followUpQuestion}</p>}
						</div>

						<div className='grid gap-3 sm:grid-cols-3 lg:grid-cols-1'>
							<div className='rounded-[22px] border border-white/80 bg-white/88 p-4 shadow-sm'>
								<p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400'>Days</p>
								<p className='mt-2 text-xl font-semibold text-zinc-950'>{travelPlan.duration}</p>
							</div>
							<div className='rounded-[22px] border border-white/80 bg-white/88 p-4 shadow-sm'>
								<p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400'>Estimated</p>
								<p className='mt-2 text-xl font-semibold text-zinc-950'>{formatUsd(travelPlan.totalEstimatedCost)}</p>
							</div>
							<div className='rounded-[22px] border border-white/80 bg-white/88 p-4 shadow-sm'>
								<p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400'>Match</p>
								<p className='mt-2 text-xl font-semibold text-zinc-950'>{travelPlan.budgetMatch}%</p>
							</div>
						</div>
					</div>

					<div className='mt-6 flex flex-wrap items-center gap-3'>
						<button type='button' onClick={resetToIdle} className='rounded-[18px] border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50'>
							New Plan
						</button>
						<button type='button' onClick={openAgenda} className='inline-flex items-center gap-2 rounded-[18px] bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-900'>
							Open Agenda
							<ArrowRight className='h-4 w-4' />
						</button>
						<div className='rounded-[18px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600'>
							{formatUsd(travelPlan.totalEstimatedCost)} / {formatMad(travelPlan.totalEstimatedCost)}
						</div>
					</div>
				</div>
			</section>

			<div className='sticky top-16 z-20 rounded-[24px] border border-zinc-200/80 bg-[rgba(248,245,241,0.9)] p-2 shadow-[0_16px_40px_rgba(24,24,27,0.06)] backdrop-blur'>
				<div className='flex gap-2 overflow-x-auto'>
					{TABS.map((tab, index) => (
						<button key={tab} type='button' onClick={() => setActiveTab(index)} className={tabButtonClass(activeTab === index)}>
							{tab}
						</button>
					))}
				</div>
			</div>

			<div className='flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-zinc-200/80 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(24,24,27,0.05)]'>
				<div>
					<p className='text-sm font-semibold text-zinc-950'>Agenda ready</p>
					<p className='mt-1 text-xs text-zinc-500'>Open the itinerary generated from your prompt.</p>
				</div>
				<button type='button' onClick={openAgenda} className='inline-flex items-center gap-2 rounded-[18px] bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-900'>
					Open Agenda
					<ArrowRight className='h-4 w-4' />
				</button>
			</div>

			{activeTab === 0 && (
				<div className='space-y-6'>
					<div className={`${sectionCardClass} p-6`}>
						<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400'>Overview</p>
						<div className='mt-4 grid gap-3 sm:grid-cols-4'>
							<div className='rounded-[22px] border border-zinc-100 bg-zinc-50/70 p-4'>
								<p className='text-[11px] uppercase tracking-[0.14em] text-zinc-400'>Flights</p>
								<p className='mt-2 text-xl font-semibold text-zinc-950'>{travelPlan.flights?.length || 0}</p>
							</div>
							<div className='rounded-[22px] border border-zinc-100 bg-zinc-50/70 p-4'>
								<p className='text-[11px] uppercase tracking-[0.14em] text-zinc-400'>Hotels</p>
								<p className='mt-2 text-xl font-semibold text-zinc-950'>{travelPlan.hotels?.length || 0}</p>
							</div>
							<div className='rounded-[22px] border border-zinc-100 bg-zinc-50/70 p-4'>
								<p className='text-[11px] uppercase tracking-[0.14em] text-zinc-400'>Days</p>
								<p className='mt-2 text-xl font-semibold text-zinc-950'>{travelPlan.duration}</p>
							</div>
							<div className='rounded-[22px] border border-zinc-100 bg-zinc-50/70 p-4'>
								<p className='text-[11px] uppercase tracking-[0.14em] text-zinc-400'>Budget</p>
								<p className='mt-2 text-xl font-semibold text-zinc-950'>{formatUsd(travelPlan.totalEstimatedCost)}</p>
							</div>
						</div>
					</div>

					{bestFlight && (
						<div className={`${sectionCardClass} p-6`}>
							<div className='flex items-center gap-3'>
								<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600'>
									<Plane className='h-5 w-5' />
								</div>
								<div>
									<p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400'>Selected Flight</p>
									<h3 className='mt-1 text-lg font-semibold text-zinc-950'>{bestFlight.airline}</h3>
								</div>
							</div>
							<div className='mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
								<div>
									<p className='text-sm font-medium text-zinc-800'>
										{bestFlight.from} to {bestFlight.to}
									</p>
									<div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500'>
										<span className='rounded-full bg-zinc-100 px-3 py-1'>
											{bestFlight.departure} to {bestFlight.arrival}
										</span>
										<span className='rounded-full bg-zinc-100 px-3 py-1'>{bestFlight.duration}</span>
										<span className='rounded-full bg-zinc-100 px-3 py-1'>{bestFlight.stops === 0 ? 'Direct' : `${bestFlight.stops} stop`}</span>
									</div>
								</div>
								<div className='text-left sm:text-right'>
									<p className='text-sm text-zinc-500'>Best value fare</p>
									<p className='mt-1 text-2xl font-semibold text-zinc-950'>{formatUsd(bestFlight.price)}</p>
								</div>
							</div>
						</div>
					)}

					{recommendedHotel && (
						<div className={`${sectionCardClass} p-6`}>
							<div className='flex items-center gap-3'>
								<div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600'>
									<Hotel className='h-5 w-5' />
								</div>
								<div>
									<p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400'>Recommended Stay</p>
									<h3 className='mt-1 text-lg font-semibold text-zinc-950'>{recommendedHotel.name}</h3>
								</div>
							</div>
							<div className='mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
								<div>
									<p className='text-sm text-zinc-600'>{recommendedHotel.location}</p>
									<p className='mt-2 text-sm text-amber-500'>{'★'.repeat(recommendedHotel.stars)}</p>
									<div className='mt-3 flex flex-wrap gap-2'>
										{recommendedHotel.amenities.slice(0, 4).map((amenity) => (
											<span key={amenity} className='rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-600'>
												{amenity}
											</span>
										))}
									</div>
								</div>
								<div className='text-left sm:text-right'>
									<p className='text-sm text-zinc-500'>{formatUsd(recommendedHotel.pricePerNight)} / night</p>
									<p className='mt-1 text-xl font-semibold text-zinc-950'>{formatUsd(recommendedHotel.totalPrice)} total</p>
								</div>
							</div>
						</div>
					)}
					<div className={`${sectionCardClass} p-6`}>
						<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400'>Budget Status</p>
						<p className='mt-4 text-3xl font-semibold text-zinc-950'>{formatUsd(travelPlan.totalEstimatedCost)}</p>
						<p className='mt-2 text-sm text-zinc-500'>Budget: {formatUsd(travelPlan.totalBudget)}</p>
						<div className='mt-5 h-2 overflow-hidden rounded-full bg-zinc-100'>
							<div
								className={`h-full rounded-full ${travelPlan.totalBudget >= travelPlan.totalEstimatedCost ? 'bg-emerald-500' : 'bg-orange-500'}`}
								style={{
									width: `${Math.min((travelPlan.totalEstimatedCost / Math.max(travelPlan.totalBudget, 1)) * 100, 100)}%`,
								}}
							/>
						</div>
						<p className={`mt-4 text-sm font-medium ${travelPlan.totalBudget >= travelPlan.totalEstimatedCost ? 'text-emerald-700' : 'text-orange-600'}`}>{travelPlan.totalBudget >= travelPlan.totalEstimatedCost ? `Under budget by ${formatUsd(travelPlan.totalBudget - travelPlan.totalEstimatedCost)}` : `Over budget by ${formatUsd(travelPlan.totalEstimatedCost - travelPlan.totalBudget)}`}</p>
					</div>
				</div>
			)}

			{activeTab === 1 && (
				<div className='space-y-4'>
					{!travelPlan.flights?.length ? (
						<div className={`${sectionCardClass} p-8 text-center text-sm text-zinc-500`}>No flight options found.</div>
					) : (
						travelPlan.flights.map((flight, index) => (
							<div key={`${flight.airline}-${index}`} className={`${sectionCardClass} p-6`}>
								<div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
									<div>
										<div className='flex items-center gap-3'>
											<h3 className='text-lg font-semibold text-zinc-950'>{flight.airline}</h3>
											{flight.isBestValue && <span className='rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600'>Best Value</span>}
										</div>
										<p className='mt-2 text-sm text-zinc-500'>
											{flight.from} to {flight.to}
										</p>
									</div>
									<div className='text-left sm:text-right'>
										<p className='text-sm text-zinc-500'>Fare</p>
										<p className='text-2xl font-semibold text-zinc-950'>{formatUsd(flight.price)}</p>
									</div>
								</div>
								<div className='mt-5 grid gap-3 sm:grid-cols-3'>
									<div className='rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600'>
										{flight.departure} to {flight.arrival}
									</div>
									<div className='rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600'>{flight.duration}</div>
									<div className='rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600'>{flight.stops === 0 ? 'Direct route' : `${flight.stops} stop`}</div>
								</div>
							</div>
						))
					)}
				</div>
			)}

			{activeTab === 2 && (
				<div className='grid gap-4 lg:grid-cols-2'>
					{!travelPlan.hotels?.length ? (
						<div className={`${sectionCardClass} p-8 text-center text-sm text-zinc-500 lg:col-span-2`}>No stay options found.</div>
					) : (
						travelPlan.hotels.map((hotel, index) => (
							<div key={`${hotel.name}-${index}`} className={`${sectionCardClass} p-6`}>
								<div className='flex items-start justify-between gap-4'>
									<div>
										<div className='flex items-center gap-3'>
											<h3 className='text-lg font-semibold text-zinc-950'>{hotel.name}</h3>
											{hotel.isRecommended && <span className='rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600'>Recommended</span>}
										</div>
										<p className='mt-2 flex items-center gap-1 text-sm text-zinc-500'>
											<MapPin className='h-4 w-4' />
											{hotel.location}
										</p>
										<p className='mt-2 text-sm text-amber-500'>
											{'★'.repeat(hotel.stars)} <span className='text-zinc-400'>({hotel.rating})</span>
										</p>
									</div>
									<div className='text-right'>
										<p className='text-sm text-zinc-500'>Per night</p>
										<p className='text-xl font-semibold text-zinc-950'>{formatUsd(hotel.pricePerNight)}</p>
									</div>
								</div>
								<div className='mt-5 flex flex-wrap gap-2'>
									{hotel.amenities?.map((amenity) => (
										<span key={amenity} className='rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-600'>
											{amenity}
										</span>
									))}
								</div>
								<div className='mt-5 border-t border-zinc-100 pt-4 text-sm text-zinc-600'>
									Total stay estimate: <span className='font-semibold text-zinc-950'>{formatUsd(hotel.totalPrice)}</span>
								</div>
							</div>
						))
					)}
				</div>
			)}

			{activeTab === 3 && (
				<div ref={itinerarySectionRef} className='space-y-4'>
					{!travelPlan.itinerary?.length ? (
						<div className={`${sectionCardClass} p-8 text-center text-sm text-zinc-500`}>Itinerary will appear here.</div>
					) : (
						travelPlan.itinerary.map((day) => {
							const isOpen = openDays.includes(day.day)
							return (
								<div key={day.day} className={`${sectionCardClass} overflow-hidden`}>
									<button type='button' onClick={() => handleToggleDay(day.day)} className='flex w-full items-center justify-between px-5 py-5 text-left transition hover:bg-zinc-50/70'>
										<div>
											<p className='text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400'>Day {day.day}</p>
											<h3 className='mt-2 text-lg font-semibold text-zinc-950'>{day.theme}</h3>
											<p className='mt-1 text-sm text-zinc-500'>{formatUsd(day.estimatedDailyCost)} estimated daily spend</p>
										</div>
										{isOpen ? <ChevronUp className='h-5 w-5 text-zinc-400' /> : <ChevronDown className='h-5 w-5 text-zinc-400' />}
									</button>
									{isOpen && (
										<div className='grid gap-3 border-t border-zinc-100 px-5 py-5 lg:grid-cols-3'>
											<div className='rounded-2xl bg-amber-50 p-4'>
												<p className='text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700'>Morning</p>
												<ul className='mt-3 space-y-2 text-sm leading-6 text-zinc-700'>{day.morning?.length ? day.morning.map((activity) => <li key={activity}>{activity}</li>) : <li className='text-zinc-500'>No morning items.</li>}</ul>
											</div>
											<div className='rounded-2xl bg-orange-50 p-4'>
												<p className='text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-700'>Afternoon</p>
												<ul className='mt-3 space-y-2 text-sm leading-6 text-zinc-700'>{day.afternoon?.length ? day.afternoon.map((activity) => <li key={activity}>{activity}</li>) : <li className='text-zinc-500'>No afternoon items.</li>}</ul>
											</div>
											<div className='rounded-2xl bg-zinc-100 p-4'>
												<p className='text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700'>Evening</p>
												<ul className='mt-3 space-y-2 text-sm leading-6 text-zinc-700'>{day.evening?.length ? day.evening.map((activity) => <li key={activity}>{activity}</li>) : <li className='text-zinc-500'>No evening items.</li>}</ul>
											</div>
										</div>
									)}
								</div>
							)
						})
					)}
				</div>
			)}

			{activeTab === 4 && (
				<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
					<div className={`${sectionCardClass} p-6`}>
						<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400'>Budget Breakdown</p>
						<div className='mt-5 space-y-5'>
							{Object.entries(travelPlan.budgetBreakdown || {}).map(([key, value]) => {
								const percent = travelPlan.totalEstimatedCost > 0 ? (value / travelPlan.totalEstimatedCost) * 100 : 0
								return (
									<div key={key}>
										<div className='mb-2 flex items-center justify-between gap-3'>
											<span className='text-sm font-medium capitalize text-zinc-700'>{key}</span>
											<span className='text-sm text-zinc-500'>
												{formatUsd(value)} / {formatMad(value)}
											</span>
										</div>
										<div className='h-2.5 overflow-hidden rounded-full bg-zinc-100'>
											<div className='h-full rounded-full bg-[linear-gradient(90deg,#18181b_0%,#f97316_100%)]' style={{ width: `${percent}%` }} />
										</div>
									</div>
								)
							})}
						</div>
					</div>

					<div className={`${sectionCardClass} p-6`}>
						<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400'>Summary</p>
						<div className='mt-5 space-y-4'>
							<div className='rounded-2xl bg-zinc-50 p-4'>
								<p className='text-sm text-zinc-500'>Estimated total</p>
								<p className='mt-1 text-2xl font-semibold text-zinc-950'>{formatUsd(travelPlan.totalEstimatedCost)}</p>
							</div>
							<div className='rounded-2xl bg-zinc-50 p-4'>
								<p className='text-sm text-zinc-500'>Declared budget</p>
								<p className='mt-1 text-2xl font-semibold text-zinc-950'>{formatUsd(travelPlan.totalBudget)}</p>
							</div>
							<div className={`rounded-2xl p-4 text-sm font-medium ${travelPlan.totalBudget >= travelPlan.totalEstimatedCost ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>{travelPlan.totalBudget >= travelPlan.totalEstimatedCost ? `Under budget by ${formatUsd(travelPlan.totalBudget - travelPlan.totalEstimatedCost)}` : `Over budget by ${formatUsd(travelPlan.totalEstimatedCost - travelPlan.totalBudget)}`}</div>
						</div>
					</div>
				</div>
			)}

			{activeTab === 5 && (
				<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
					<div className='space-y-6'>
						<div className={`${sectionCardClass} p-6`}>
							<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400'>Travel Notes</p>
							<div className='mt-5 grid gap-3'>
								{travelPlan.tips?.map((tip) => (
									<div key={tip} className='flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4'>
										<Lightbulb className='mt-0.5 h-5 w-5 shrink-0 text-orange-500' />
										<p className='text-sm leading-7 text-zinc-600'>{tip}</p>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className={`${sectionCardClass} p-6`}>
						<div className='flex items-center justify-between gap-4'>
							<div>
								<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400'>Packing List</p>
								<p className='mt-2 text-sm text-zinc-500'>
									{checkedItems.length}/{travelPlan.packingList?.length || 0} items checked
								</p>
							</div>
							<div className='rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700'>{Math.round(packingProgress)}%</div>
						</div>
						<div className='mt-4 h-2 overflow-hidden rounded-full bg-zinc-100'>
							<div className='h-full rounded-full bg-zinc-950 transition-all' style={{ width: `${packingProgress}%` }} />
						</div>
						<div className='mt-5 space-y-2'>
							{travelPlan.packingList?.map((item) => {
								const isChecked = checkedItems.includes(item)
								return (
									<button key={item} type='button' onClick={() => handleToggleItem(item)} className='flex w-full items-center gap-3 rounded-2xl border border-zinc-100 px-3 py-3 text-left transition hover:bg-zinc-50'>
										<div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${isChecked ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 text-transparent'}`}>
											<Check className='h-3.5 w-3.5' strokeWidth={3} />
										</div>
										<span className={`text-sm ${isChecked ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>{item}</span>
									</button>
								)
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
