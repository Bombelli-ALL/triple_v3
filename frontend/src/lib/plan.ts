import api from '@/lib/api'

export type PlanInfo = {
	plan: 'FREE' | 'PREMIUM'
	isPremium: boolean
	premiumUntil: string | null
	expired: boolean
	daysLeft: number | null
}

// Public pages (pricing) render outside ApiInterceptors, so the token is passed explicitly
const bearer = (token?: string | null) => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)

export const getMyPlan = (token?: string | null) => api.get<PlanInfo>('/me/plan', bearer(token))

export const redeemCode = (code: string, token?: string | null) => api.post<PlanInfo>('/me/plan/redeem', { code }, bearer(token))

/** Pull the readable reason out of an API error ("This code has expired.") */
export function apiErrorMessage(error: unknown, fallback: string) {
	const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
	return typeof message === 'string' && message.trim() ? message : fallback
}

/** User pages that need Premium (admins always have access) */
export const PREMIUM_FEATURES: Record<string, { name: string; description: string }> = {
	'/user/groups': { name: 'Travel groups', description: 'Find people going to the same city, join their group and chat together.' },
	'/user/leaderboard': { name: 'Leaderboard', description: 'See how you rank against other travelers, your friends and people heading to your city.' },
	'/user/trips': { name: 'Transport', description: 'Compare trains and flights between Moroccan cities in one place.' },
	'/user/ai': { name: 'Trip planner', description: 'Describe your trip and get a complete plan with stays, routes and budget.' },
	'/user/view-360': { name: '360° view', description: 'Look around places in 360° before you go.' },
}

export function premiumFeatureFor(pathname: string) {
	const key = Object.keys(PREMIUM_FEATURES).find((path) => pathname === path || pathname.startsWith(`${path}/`))
	return key ? { path: key, ...PREMIUM_FEATURES[key] } : null
}

export function canUsePremium(user?: { role?: string; plan?: string; premiumUntil?: string | null } | null) {
	return user?.role === 'ADMIN' || hasActivePremium(user)
}

/** True while a user's Premium is running (PREMIUM with no end date, or an end date in the future) */
export function hasActivePremium(user?: { plan?: string; premiumUntil?: string | null } | null) {
	if (user?.plan !== 'PREMIUM') return false
	return !user.premiumUntil || new Date(user.premiumUntil).getTime() > Date.now()
}

export function formatPlanEnd(plan: PlanInfo) {
	if (!plan.isPremium) return null
	if (!plan.premiumUntil) return 'No end date'
	return new Date(plan.premiumUntil).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── admin ───────────────────────────────────────────────── */

export type AdminOverview = {
	totalUsers: number
	newThisWeek: number
	activeThisWeek: number
	premiumActive: number
	premiumExpired: number
	freeUsers: number
	roles: Partial<Record<'TRAVELER' | 'GUIDE' | 'ADMIN', number>>
	trips: number
	activeCodes: number
	redemptions: number
	signupsByDay: Array<{ date: string; count: number }>
}

export type AdminMember = PlanInfo & {
	id: string
	name: string
	email: string
	avatarUrl?: string | null
	role: 'TRAVELER' | 'GUIDE' | 'ADMIN'
	authMethod: 'PASSWORD' | 'GOOGLE'
	lastSeenAt: string | null
	createdAt: string
	trips: number
	codesUsed: number
}

export type ReferralCode = {
	id: string
	code: string
	label: string | null
	premiumDays: number
	maxUses: number | null
	usedCount: number
	active: boolean
	expiresAt: string | null
	createdAt: string
	createdBy: { id: string; name: string } | null
	redemptions: Array<{ redeemedAt: string; user: { id: string; name: string; email: string } }>
}

export type CreateReferralCodeInput = {
	label?: string
	premiumDays?: number
	maxUses?: number | null
	expiresAt?: string | null
	code?: string
}

export const getAdminOverview = () => api.get<AdminOverview>('/admin/overview')
export const listMembers = () => api.get<AdminMember[]>('/admin/members')
export const updateMemberPlan = (userId: string, body: { action: 'grant'; days?: number | null } | { action: 'revoke' }) =>
	api.patch<PlanInfo>(`/admin/users/${userId}/plan`, body)
export const listReferralCodes = () => api.get<ReferralCode[]>('/admin/referral-codes')
export const createReferralCode = (input: CreateReferralCodeInput) => api.post<ReferralCode>('/admin/referral-codes', input)
export const setReferralCodeActive = (id: string, active: boolean) => api.patch<ReferralCode>(`/admin/referral-codes/${id}`, { active })
export const deleteReferralCode = (id: string) => api.delete<{ id: string }>(`/admin/referral-codes/${id}`)

/** Shareable sign-up link that pre-fills the code */
export function referralLink(code: string) {
	const origin = typeof window !== 'undefined' ? window.location.origin : 'https://triple.nexdevo.com'
	return `${origin}/register?ref=${encodeURIComponent(code)}`
}

/* ── cities & places (admin) ─────────────────────────────── */

export type CitySyncStatus = {
	running: boolean
	startedAt: string | null
	finishedAt: string | null
	total: number
	done: number
	current: string | null
	placesAdded: number
	failed: string[]
}

export type CityCoverage = { id: string; name: string; coverImage: string | null; places: number }

export const getCityCoverage = () => api.get<CityCoverage[]>('/admin/city-coverage')
export const startCitySync = () => api.post<CitySyncStatus>('/admin/city-sync')
export const getCitySyncStatus = () => api.get<CitySyncStatus>('/admin/city-sync')
