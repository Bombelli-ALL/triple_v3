import type { BudgetTier, TripSwipeItem, TripType } from '@/types/match'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return (value && typeof value === 'object' ? value : {}) as UnknownRecord
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeBudget(value: unknown): BudgetTier {
  const text = typeof value === 'string' ? value.toLowerCase() : ''
  if (text.includes('budget')) return 'budget'
  if (text.includes('mid')) return 'mid-range'
  if (text.includes('lux')) return 'luxury'
  if (text.includes('prem')) return 'premium'
  return 'mid-range'
}

function normalizeTripType(value: unknown): TripType {
  const text = typeof value === 'string' ? value.toLowerCase() : ''
  if (text.includes('city')) return 'city-break'
  if (text.includes('food')) return 'food'
  if (text.includes('beach')) return 'beach'
  if (text.includes('adventure')) return 'adventure'
  if (text.includes('nature')) return 'nature'
  if (text.includes('culture') || text.includes('heritage')) return 'culture'
  return 'culture'
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
}

function pickImage(item: UnknownRecord) {
  const images = item.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string') return images[0]
  return asString(item.image, 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&auto=format&fit=crop&q=60')
}

function extractTripArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload

  const obj = asRecord(payload)
  if (Array.isArray(obj.trips)) return obj.trips
  if (Array.isArray(obj.items)) return obj.items
  if (Array.isArray(obj.data)) return obj.data

  const nestedData = asRecord(obj.data)
  if (Array.isArray(nestedData.trips)) return nestedData.trips
  if (Array.isArray(nestedData.items)) return nestedData.items

  return []
}

export function mapTripsResponseToSwipeItems(payload: unknown): TripSwipeItem[] {
  const rows = extractTripArray(payload)

  return rows.map((row, idx) => {
    const item = asRecord(row)
    const destination = asRecord(item.destination)
    const title = asString(item.title, asString(item.name, `Trip ${idx + 1}`))
    const city = asString(item.city, asString(destination.city, 'Morocco'))
    const country = asString(item.country, asString(destination.country, 'Morocco'))
    const durationDays = asNumber(item.durationDays, asNumber(item.duration, 3))
    const tags = toStringArray(item.tags)
    const vibes = toStringArray(item.vibes)

    return {
      id: asString(item.id, `trip-${idx + 1}`),
      title,
      city,
      country,
      image: pickImage(item),
      description: asString(item.description, 'Trip suggestion generated from your travel profile.'),
      rating: asNumber(item.rating, 4.5),
      budget: normalizeBudget(item.budget),
      wifi: asBoolean(item.wifi, true),
      durationDays,
      tripType: normalizeTripType(item.tripType ?? item.type ?? item.category),
      vibes: vibes.length ? vibes : ['local'],
      tags: tags.length ? tags : ['Recommended'],
    }
  })
}

