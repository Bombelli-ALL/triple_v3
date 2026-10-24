export type BudgetTier = 'budget' | 'mid-range' | 'premium' | 'luxury'

export type TripType = 'city-break' | 'culture' | 'food' | 'nature' | 'beach' | 'adventure'

export type PreferenceForm = {
	budget?: BudgetTier | string
	atmosphere?: string
	vibe?: string
	style?: string
	wifi?: string
	guests?: string
	language?: string
}

export type HeroPromptContext = {
	prompt: string
	intent: 'match' | 'dashboard' | 'booking' | 'guide' | 'collab' | 'info'
	city: string
	category: string
	preferences?: PreferenceForm
	durationDays?: number | null
	budgetDh?: number | null
	demoPrompts?: string[]
	matchTargetCount?: number
}

export type TripSwipeItem = {
	id: string
	title: string
	city: string
	country: string
	image: string
	description: string
	rating: number
	budget: BudgetTier
	wifi: boolean
	durationDays: number
	tripType: TripType
	vibes: string[]
	tags: string[]
}

export type SwipeDirection = 'left' | 'right'

export type SwipeDecision = {
	tripId: string
	direction: SwipeDirection
	timestamp: number
}

export type MatchSessionResult = {
	likedTrips: TripSwipeItem[]
	skippedTrips: TripSwipeItem[]
	topPicks: TripSwipeItem[]
	totalSwiped: number
	decisions: SwipeDecision[]
}
