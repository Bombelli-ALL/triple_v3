import axios from 'axios'
import api from './api'

export type AgentHistoryMessage = {
	role: 'user' | 'assistant'
	content: string
}

export type BookingSuggestion = {
	title: string
	type: 'flight' | 'stay' | 'activity' | 'transport' | 'rental' | 'guide' | 'other'
	priceRange?: string
	notes?: string
}

export type TravelPlan = {
	from: { city: string; country: string }
	to: { city: string; country: string }
	duration: number
	totalBudget: number
	totalEstimatedCost: number
	budgetMatch: number
	flights: Array<{
		airline: string
		from: string
		to: string
		departure: string
		arrival: string
		duration: string
		stops: number
		price: number
		isBestValue: boolean
	}>
	hotels: Array<{
		name: string
		stars: number
		pricePerNight: number
		totalPrice: number
		location: string
		rating: number
		amenities: string[]
		isRecommended: boolean
	}>
	itinerary: Array<{
		day: number
		theme: string
		morning: string[]
		afternoon: string[]
		evening: string[]
		estimatedDailyCost: number
	}>
	budgetBreakdown: {
		flights: number
		hotels: number
		food: number
		activities: number
		transport: number
		misc: number
	}
	tips: string[]
	packingList: string[]
}

export type AgentActionType =
	| 'SHOW_TRIPS'
	| 'SHOW_MATCH'
	| 'SHOW_GROUPS'
	| 'REQUEST_GROUP_JOIN'
	| 'SHOW_BOOKINGS'
	| 'SHOW_GUIDES'
	| 'SHOW_MAP'
	| 'SHOW_QUESTS'

export type AgentAction = {
	type: AgentActionType
	payload?: Record<string, unknown>
}

export type HeroAgentResponse = {
	answer: string
	intent: 'booking' | 'information' | 'collaboration' | 'guide' | 'new_trip'
	followUpQuestion: string | null
	bookings: BookingSuggestion[]
	travelPlan?: TravelPlan
	actions: AgentAction[]
}

export type HeroPlannerRequest = {
	ownerUserId?: string
	city: string
	placeId?: string
	lat?: number | null
	lng?: number | null
	interests: string[]
	durationDays: number
	budgetDh?: number | null
	adults: number
	children: number
	extraCity?: string
}

export type StoredHeroPlannerResult = {
	request: HeroPlannerRequest
	response: HeroAgentResponse
	generatedAt: string
}

export const requestHeroAgent = async <T>(prompt: string, history?: { role: 'user' | 'assistant'; content: string }[]) => {
	try {
		return await api.post<T>('/agent/hero', { prompt, history })
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status
			if (status === 400 || status === 415) {
				return await api.get<T>('/agent/hero', { params: { prompt } })
			}
		}
		throw error
	}
}

export const requestHeroPlanner = async <T = HeroAgentResponse>(payload: HeroPlannerRequest) => {
	const { ownerUserId: _ownerUserId, ...safePayload } = payload
	return await api.post<T>('/agent/hero-plan', safePayload)
}
