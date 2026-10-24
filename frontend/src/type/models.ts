export type ISODateString = string

export type Coordinates = {
	lat: number
	lng: number
}

export type TripUserRole = 'owner' | 'member'

export interface RoleModel {
	id: string
	name: string
}

export interface UserModel {
	id: string
	name: string
	email: string
	preferences?: string | null
	roleId: string
	createdAt: ISODateString
	updatedAt: ISODateString
	deletedAt?: ISODateString | null
}

export interface RegionModel {
	id: string
	name_key: string
}

export interface LanguageModel {
	id: string
	language: string
}

export interface RegionTranslationModel {
	id: string
	regionId: string
	languageId: string
	name: string
}

export interface CityModel {
	id: string
	name_key: string
	coords: Coordinates
	images: string[]
	regionId: string
}

export interface CityTranslationModel {
	id: string
	cityId: string
	languageId: string
	name: string
}

export interface CategoryModel {
	id: string
	name_key: string
	description_key: string
}

export interface CategoryTranslationModel {
	id: string
	categoryId: string
	languageId: string
	name: string
	description?: string | null
}

export interface PlaceModel {
	id: string
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

export interface PlaceTranslationModel {
	id: string
	placeId: string
	languageId: string
	name: string
	description?: string | null
}

export interface RatingModel {
	id: string
	value: number
	comment?: string | null
	placeId: string
	userId: string
}

export interface TripModel {
	id: string
	dateTime: ISODateString
	tripPolyline: string
	cityId: string
	createdAt: ISODateString
	updatedAt: ISODateString
	deletedAt?: ISODateString | null
}

export interface TripUserModel {
	tripId: string
	userId: string
	role: TripUserRole
	joinedAt: ISODateString
}

export interface TripPlaceModel {
	tripId: string
	placeId: string
	index: number
}

export interface PlaceRecommendation extends PlaceModel {
	avgRating: number
	distance: number
}

export interface TripWithRelations extends TripModel {
	tripUsers: TripUserModel[]
	tripPlaces: TripPlaceModel[]
}
