export type AppLocale = 'en' | 'fr' | 'ar' | 'es'

export function resolveAppLocale(language?: string): AppLocale {
	const normalized = language?.split('-')[0]?.toLowerCase()

	if (normalized === 'fr' || normalized === 'ar' || normalized === 'es') {
		return normalized
	}

	return 'en'
}
