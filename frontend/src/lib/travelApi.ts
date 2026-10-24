import api from './api'

export type GroupSearchParams = {
	city?: string
	search?: string
	start?: string
	end?: string
	budget?: number
	offset?: number
	limit?: number
}

export type GroupMembershipStatus = 'PENDING' | 'MEMBER' | 'REJECTED'
export type GroupMembershipRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type NotificationType =
	| 'GROUP_JOIN_REQUEST'
	| 'GROUP_REQUEST_APPROVED'
	| 'GROUP_REQUEST_REJECTED'
	| 'GROUP_REQUEST_RESOLVED'
	| 'GROUP_ROLE_CHANGED'
	| 'GROUP_MEMBER_REMOVED'
	| 'GROUP_UPDATED'

export type GroupMatch = {
	groupId: string
	cityId: string
	cityName: string
	title: string
	description?: string | null
	coverImage?: string | null
	startDate: string
	endDate: string
	capacity: number
	memberCount?: number
	availableSpots?: number
	budgetMin: number
	budgetMax: number
	score: number
	scoreBreakdown?: {
		city: number
		dateOverlap: number
		budget: number
	}
}

export type GroupSearchResponse = {
	query: {
		city: string | null
		search?: string | null
		start: string
		end: string
		budget: number | null
		offset: number
		limit: number
	}
	total: number
	noMatches: boolean
	message?: string
	matches: GroupMatch[]
}

export type GroupProfile = {
	id: string
	email: string
	name: string
	avatarUrl: string | null
	role: string
	createdAt: string
	updatedAt: string
	preferences?: unknown
}

export type GroupMemberDetail = GroupProfile & {
	role: GroupMembershipRole
	joinedAt?: string
	requestedAt?: string
}

export type GroupMessage = {
	id: string
	message: string
	createdAt: string
	user: GroupProfile
}

export type GroupDetail = {
	id: string
	title: string
	description?: string | null
	coverImage?: string | null
	owner: GroupProfile
	city: {
		id: string
		name: string
		slug?: string
		description?: string | null
		coverImage?: string | null
	}
	startDate: string
	endDate: string
	capacity: number
	budgetMin: number
	budgetMax: number
	memberCount: number
	availableSpots: number
	viewerRole?: GroupMembershipRole | null
	viewerStatus?: GroupMembershipStatus | null
	members: GroupMemberDetail[]
	pendingRequests: GroupMemberDetail[]
	recentMessages: GroupMessage[]
}

export type GroupMembership = {
	status: GroupMembershipStatus
	role: GroupMembershipRole
	requestedAt: string
	respondedAt?: string | null
	group: {
		id: string
		title: string
		description?: string | null
		coverImage?: string | null
		owner: GroupProfile
		city: {
			id: string
			name: string
			slug?: string
			description?: string | null
			coverImage?: string | null
		}
		startDate: string
		endDate: string
		capacity: number
		budgetMin: number
		budgetMax: number
		memberCount: number
		availableSpots: number
	}
}

export type GroupJoinResponse = {
	groupId: string
	user: GroupProfile
	status: GroupMembershipStatus
	joined: boolean
	message: string
}

export type IncomingGroupRequest = {
	groupId: string
	status: GroupMembershipStatus
	role: GroupMembershipRole
	requestedAt: string
	user: GroupProfile
	group: {
		id: string
		title: string
		description?: string | null
		coverImage?: string | null
		city: {
			id: string
			name: string
			slug?: string
			description?: string | null
			coverImage?: string | null
		}
		owner: GroupProfile
		capacity: number
	}
}

export type GroupNotification = {
	id: string
	type: NotificationType
	title: string
	message: string
	membershipUserId?: string | null
	data?: Record<string, unknown> | null
	readAt?: string | null
	createdAt: string
	actor?: GroupProfile | null
	group?: {
		id: string
		title: string
		coverImage?: string | null
	} | null
}

export type CreateGroupPayload = {
	cityId: string
	title: string
	description?: string
	coverImage?: string
	startDate: string
	endDate: string
	capacity: number
	budgetMin: number
	budgetMax: number
}

export type UpdateGroupPayload = Partial<CreateGroupPayload>

export type GroupMessagesResponse = {
	groupId: string
	total: number
	messages: GroupMessage[]
}

export type PublicTrip = {
	id: string
	title: string
	description?: string | null
	status?: string
	budgetTotal?: string | number | null
	currency?: string | null
	startDate?: string | null
	endDate?: string | null
	city?: {
		id: string
		name: string
		slug?: string
		description?: string | null
		coverImage?: string | null
	} | null
	bookings?: unknown[]
	items?: PublicTripItem[]
	plan?: unknown
	createdAt?: string
}

export type SaveMyTripPayload = {
	title: string
	description?: string
	cityName?: string
	startDate?: string
	endDate?: string
	budgetTotal?: number
	currency?: string
	plan?: unknown
	items?: Array<{ day?: number; title: string; location?: string; notes?: string; type?: string }>
}

export type PublicTripItem = {
	id: string
	day?: number | null
	title: string
	location?: string | null
	time?: string | null
	notes?: string | null
	type?: string | null
}

export type PublicBooking = {
	id: string
	itemName: string
	type: string
	provider?: string | null
	basePrice?: number
	currency?: string
	status?: string
	startDate?: string | null
	endDate?: string | null
	trip?: {
		id: string
		title: string
		startDate?: string | null
		endDate?: string | null
	} | null
}

export type CityOption = {
	id: string
	name: string
	slug?: string
	coverImage?: string | null
	description?: string | null
}

export const searchPublicGroups = async (params: GroupSearchParams) => {
	return api.get<GroupSearchResponse>('/groups/search', { params })
}

export const listPublicGroups = async (params?: Partial<GroupSearchParams>) => {
	return api.get<GroupSearchResponse>('/groups', { params })
}

export const listCities = async (params?: { limit?: number }) => {
	return api.get<{ items?: CityOption[]; data?: CityOption[] } | CityOption[]>('/cities', { params })
}

export const getPublicGroup = async (groupId: string) => {
	return api.get<GroupDetail>(`/groups/${groupId}`)
}

export const joinPublicGroup = async (groupId: string) => {
	return api.post<GroupJoinResponse>(`/groups/${groupId}/join`)
}

export const cancelPublicGroupJoin = async (groupId: string) => {
	return api.delete<{ groupId: string; canceled: boolean; previousStatus: 'PENDING' | 'MEMBER' }>(
		`/groups/${groupId}/join`,
	)
}

export const listCurrentUserGroups = async () => {
	return api.get<GroupMembership[]>('/user/groups')
}

export const listManagedGroups = async () => {
	return api.get<GroupDetail[]>('/user/groups/managed')
}

export const listIncomingGroupRequests = async () => {
	return api.get<IncomingGroupRequest[]>('/user/groups/requests')
}

export const createGroup = async (payload: CreateGroupPayload) => {
	return api.post<GroupDetail>('/groups', payload)
}

export const updateGroup = async (groupId: string, payload: UpdateGroupPayload) => {
	return api.patch<GroupDetail>(`/groups/${groupId}`, payload)
}

export const deleteGroup = async (groupId: string) => {
	return api.delete<{ deleted: boolean; groupId: string }>(`/groups/${groupId}`)
}

export const reviewGroupMembership = async (
	groupId: string,
	userId: string,
	status: 'MEMBER' | 'REJECTED',
	note?: string,
) => {
	return api.patch(`/groups/${groupId}/members/${userId}/review`, { status, note })
}

export const updateGroupMemberRole = async (
	groupId: string,
	userId: string,
	role: 'ADMIN' | 'MEMBER',
) => {
	return api.patch(`/groups/${groupId}/members/${userId}/role`, { role })
}

export const removeGroupMember = async (groupId: string, userId: string) => {
	return api.delete<{ removed: boolean; groupId: string; userId: string }>(
		`/groups/${groupId}/members/${userId}`,
	)
}

export const listGroupMessages = async (groupId: string) => {
	return api.get<GroupMessagesResponse>(`/groups/${groupId}/messages`)
}

export const sendGroupMessage = async (groupId: string, message: string) => {
	return api.post<GroupMessage>(`/groups/${groupId}/messages`, { message })
}

export const listNotifications = async (params?: { unreadOnly?: boolean; limit?: number }) => {
	return api.get<GroupNotification[]>('/notifications', { params })
}

export const markNotificationRead = async (notificationId: string) => {
	return api.patch(`/notifications/${notificationId}/read`)
}

export const markAllNotificationsRead = async () => {
	return api.patch('/notifications/read-all')
}

export const listPublicTrips = async (params?: {
	cityId?: string
	startDate?: string
	endDate?: string
	status?: string
	offset?: number
	limit?: number
}) => {
	return api.get<PublicTrip[]>('/trips', { params })
}

export const getPublicTrip = async (tripId: string) => {
	return api.get<PublicTrip>(`/trips/${tripId}`)
}

export const listMyTrips = async () => {
	return api.get<PublicTrip[]>('/me/trips')
}

export const saveMyTrip = async (payload: SaveMyTripPayload) => {
	return api.post<PublicTrip>('/me/trips', payload)
}

export const deleteMyTrip = async (tripId: string) => {
	return api.delete<{ id: string }>(`/me/trips/${tripId}`)
}

export type TravelPreferences = {
	city: string
	durationDays: number
	budgetDh: number | null
	adults: number
	children: number
	interests: string[]
}

export type DashboardPlace = {
	id: string
	name: string
	type?: string | null
	description?: string | null
	avgPrice?: number | null
	durationMinutes?: number | null
	coverImage?: string | null
	category?: 'sights' | 'culture' | 'nature' | 'food' | 'cafe' | null
}

export type MyDashboard = {
	preferences: TravelPreferences | null
	city: (CityOption & { slug: string }) | null
	stats: {
		trips: number
		plannedDays: number
		groups: number
		bookings: number
		bookedTotal: number
	}
	latestTrip: {
		id: string
		title: string
		description?: string | null
		city: string | null
		matchesDestination: boolean
		budgetTotal: number | null
		currency?: string | null
		createdAt: string
		items: Array<{ id: string; day: number; title: string; type?: string | null; location?: string | null }>
	} | null
	places: DashboardPlace[]
}

export const getMyDashboard = async () => {
	return api.get<MyDashboard>('/me/dashboard')
}

export const saveMyPreferences = async (preferences: TravelPreferences) => {
	return api.put<TravelPreferences>('/me/preferences', preferences)
}

export const listPublicBookings = async (params?: { offset?: number; limit?: number }) => {
	return api.get<PublicBooking[]>('/bookings', { params })
}
