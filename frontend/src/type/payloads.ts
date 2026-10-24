import type { Coordinates, ISODateString, UserModel } from './models'

export interface LoginPayload {
	email: string
	password: string
}

export interface RegisterPayload {
	name: string
	email: string
	password: string
	roleId: string
	preferences?: string
}

export interface AuthResponse {
	user: Omit<UserModel, 'createdAt' | 'updatedAt' | 'deletedAt'>
	token: string
}

export interface CreateTripPayload {
	dateTime: ISODateString
	tripPolyline?: string
	routeCoords?: number[][]
	cityId: string
	userIds?: string[]
	placeIds?: string[]
}

export interface UpdateTripPayload extends Partial<CreateTripPayload> {}

export interface PlaceFeedbackPayload {
	placeId: string
	liked: boolean
}

export interface PlaceFeedbackResponse {
	userId: string
	placeId: string
	liked: boolean
	updated: boolean
}

export interface ResetVectorResponse {
	userId: string
	reset: true
}

export interface CreateCityPayload {
	name_key: string
	coords: Coordinates
	images: string[]
	regionId: string
}

export interface CreateRegionPayload {
	name_key: string
}

export interface CreateCategoryPayload {
	name_key: string
	description_key: string
}

export interface CreatePlacePayload {
	name_key: string
	description_key: string
	coords: Coordinates
	images: string[]
	video: string
	tags: string[]
	entryFee: number
	openingHours: string
	cityId: string
	categoryId: string
}
