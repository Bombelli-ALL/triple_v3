import type { AppLocale } from '@/lib/locale'
import { extraRuntimeExact, getExtraRuntimePatterns } from '@/lib/extraRuntimeTranslations'

type RuntimePattern = {
	test: RegExp
	replace: (match: RegExpMatchArray) => string
}

type RuntimeLocaleMap = {
	exact: Record<string, string>
	patterns: RuntimePattern[]
}

type SupportedLocale = Exclude<AppLocale, 'en'>

const commonExact: Record<SupportedLocale, Record<string, string>> = {
	fr: {
		Dashboard: 'Tableau de bord',
		History: 'Historique',
		Maps: 'Cartes',
		Match: 'Match',
		Agenda: 'Agenda',
		Planning: 'Planification',
		Itineraries: 'Itinéraires',
		Guides: 'Guides',
		Support: 'Support',
		'Editorial flow': 'Parcours éditorial',
		'Signature route': 'Route signature',
		'Beach mood': 'Ambiance plage',
		'Festival mood': 'Ambiance festival',
		'Rooftop mood': 'Ambiance rooftop',
		Groups: 'Groupes',
		Trips: 'Voyages',
		Leaderboard: 'Classement',
		Transport: 'Transport',
		'AI Planner': 'Planificateur IA',
		'AI Assistant': 'Assistant IA',
		'360 View': 'Vue 360',
		Notifications: 'Notifications',
		Settings: 'Paramètres',
		'Account settings': 'Paramètres du compte',
		'Search trips, places...': 'Rechercher des voyages, des lieux...',
		'Mark all read': 'Tout marquer comme lu',
		'Clear all': 'Tout effacer',
		Close: 'Fermer',
		'No notifications': 'Aucune notification',
		'Group updates will appear here.': 'Les mises à jour de groupe apparaîtront ici.',
		Guest: 'Invité',
		Traveler: 'Voyageur',
		User: 'Utilisateur',
		Admin: 'Admin',
		'Log out': 'Déconnexion',
		Collapse: 'Réduire',
		'All caught up': 'Tout est à jour',
		'Loading...': 'Chargement...',
		'Search...': 'Rechercher...',
	},
	es: {
		Dashboard: 'Panel',
		History: 'Historial',
		Maps: 'Mapas',
		Match: 'Match',
		Agenda: 'Agenda',
		Planning: 'Planificación',
		Itineraries: 'Itinerarios',
		Guides: 'Guías',
		Support: 'Soporte',
		'Editorial flow': 'Recorrido editorial',
		'Signature route': 'Ruta principal',
		'Beach mood': 'Ambiente de playa',
		'Festival mood': 'Ambiente de festival',
		'Rooftop mood': 'Ambiente rooftop',
		Groups: 'Grupos',
		Trips: 'Viajes',
		Leaderboard: 'Clasificación',
		Transport: 'Transporte',
		'AI Planner': 'Planificador IA',
		'AI Assistant': 'Asistente IA',
		'360 View': 'Vista 360',
		Notifications: 'Notificaciones',
		Settings: 'Ajustes',
		'Account settings': 'Configuración de la cuenta',
		'Search trips, places...': 'Buscar viajes, lugares...',
		'Mark all read': 'Marcar todo como leído',
		'Clear all': 'Borrar todo',
		Close: 'Cerrar',
		'No notifications': 'No hay notificaciones',
		'Group updates will appear here.': 'Las novedades de grupo aparecerán aquí.',
		Guest: 'Invitado',
		Traveler: 'Viajero',
		User: 'Usuario',
		Admin: 'Admin',
		'Log out': 'Cerrar sesión',
		Collapse: 'Contraer',
		'All caught up': 'Todo al día',
		'Loading...': 'Cargando...',
		'Search...': 'Buscar...',
	},
	ar: {
		Dashboard: 'لوحة القيادة',
		History: 'السجل',
		Maps: 'الخرائط',
		Match: 'المطابقة',
		Agenda: 'البرنامج',
		Planning: 'التخطيط',
		Itineraries: 'المسارات',
		Guides: 'الأدلة',
		Support: 'الدعم',
		'Editorial flow': 'المسار التحريري',
		'Signature route': 'المسار المميز',
		'Beach mood': 'أجواء الشاطئ',
		'Festival mood': 'أجواء المهرجان',
		'Rooftop mood': 'أجواء السطح',
		Groups: 'المجموعات',
		Trips: 'الرحلات',
		Leaderboard: 'لوحة الترتيب',
		Transport: 'النقل',
		'AI Planner': 'مخطط الذكاء الاصطناعي',
		'AI Assistant': 'المساعد الذكي',
		'360 View': 'عرض 360',
		Notifications: 'الإشعارات',
		Settings: 'الإعدادات',
		'Account settings': 'إعدادات الحساب',
		'Search trips, places...': 'ابحث عن رحلات وأماكن...',
		'Mark all read': 'تحديد الكل كمقروء',
		'Clear all': 'مسح الكل',
		Close: 'إغلاق',
		'No notifications': 'لا توجد إشعارات',
		'Group updates will appear here.': 'ستظهر تحديثات المجموعات هنا.',
		Guest: 'زائر',
		Traveler: 'مسافر',
		User: 'مستخدم',
		Admin: 'مشرف',
		'Log out': 'تسجيل الخروج',
		Collapse: 'تصغير',
		'All caught up': 'لا توجد تحديثات جديدة',
		'Loading...': 'جارٍ التحميل...',
		'Search...': 'بحث...',
	},
}

function makePatterns(locale: SupportedLocale): RuntimePattern[] {
	if (locale === 'fr') {
		return [
			{ test: /^(\d+)\s+m ago$/i, replace: (m) => `il y a ${m[1]} min` },
			{ test: /^(\d+)\s+h ago$/i, replace: (m) => `il y a ${m[1]} h` },
			{ test: /^(\d+)\s+d ago$/i, replace: (m) => `il y a ${m[1]} j` },
			{ test: /^(\d+)\s+unread$/i, replace: (m) => `${m[1]} non lus` },
			{ test: /^(\d+)\s+trips$/i, replace: (m) => `${m[1]} voyages` },
			{ test: /^Showing\s+(\d+)\s+of\s+(\d+)\s+users$/i, replace: (m) => `${m[1]} sur ${m[2]} utilisateurs` },
			{ test: /^Showing\s+(\d+)\s+of\s+(\d+)\s+trips$/i, replace: (m) => `${m[1]} sur ${m[2]} voyages` },
		]
	}

	if (locale === 'es') {
		return [
			{ test: /^(\d+)\s+m ago$/i, replace: (m) => `hace ${m[1]} min` },
			{ test: /^(\d+)\s+h ago$/i, replace: (m) => `hace ${m[1]} h` },
			{ test: /^(\d+)\s+d ago$/i, replace: (m) => `hace ${m[1]} d` },
			{ test: /^(\d+)\s+unread$/i, replace: (m) => `${m[1]} sin leer` },
			{ test: /^(\d+)\s+trips$/i, replace: (m) => `${m[1]} viajes` },
			{ test: /^Showing\s+(\d+)\s+of\s+(\d+)\s+users$/i, replace: (m) => `${m[1]} de ${m[2]} usuarios` },
			{ test: /^Showing\s+(\d+)\s+of\s+(\d+)\s+trips$/i, replace: (m) => `${m[1]} de ${m[2]} viajes` },
		]
	}

	return [
		{ test: /^(\d+)\s+m ago$/i, replace: (m) => `منذ ${m[1]} دقيقة` },
		{ test: /^(\d+)\s+h ago$/i, replace: (m) => `منذ ${m[1]} ساعة` },
		{ test: /^(\d+)\s+d ago$/i, replace: (m) => `منذ ${m[1]} يوم` },
		{ test: /^(\d+)\s+unread$/i, replace: (m) => `${m[1]} غير مقروء` },
		{ test: /^(\d+)\s+trips$/i, replace: (m) => `${m[1]} رحلات` },
		{ test: /^Showing\s+(\d+)\s+of\s+(\d+)\s+users$/i, replace: (m) => `عرض ${m[1]} من أصل ${m[2]} مستخدمين` },
		{ test: /^Showing\s+(\d+)\s+of\s+(\d+)\s+trips$/i, replace: (m) => `عرض ${m[1]} من أصل ${m[2]} رحلات` },
	]
}

const localeMap: Record<AppLocale, RuntimeLocaleMap> = {
	en: { exact: {}, patterns: [] },
	fr: {
		exact: { ...commonExact.fr, ...extraRuntimeExact.fr },
		patterns: [...makePatterns('fr'), ...getExtraRuntimePatterns('fr')],
	},
	es: {
		exact: { ...commonExact.es, ...extraRuntimeExact.es },
		patterns: [...makePatterns('es'), ...getExtraRuntimePatterns('es')],
	},
	ar: {
		exact: { ...commonExact.ar, ...extraRuntimeExact.ar },
		patterns: [...makePatterns('ar'), ...getExtraRuntimePatterns('ar')],
	},
}

export function isRuntimeTranslatableSource(text: string) {
	if (!text.trim()) return false

	return (['fr', 'es', 'ar'] as SupportedLocale[]).some(
		(locale) => translateRuntimeText(locale, text) !== text,
	)
}

export function translateRuntimeText(locale: AppLocale, text: string): string {
	if (!text.trim() || locale === 'en') return text

	const languagePack = localeMap[locale]
	const trimmed = text.trim()
	const exact = languagePack.exact[trimmed]

	if (exact) {
		const prefix = text.match(/^\s*/)?.[0] ?? ''
		const suffix = text.match(/\s*$/)?.[0] ?? ''
		return `${prefix}${exact}${suffix}`
	}

	for (const pattern of languagePack.patterns) {
		const match = trimmed.match(pattern.test)
		if (!match) continue

		const prefix = text.match(/^\s*/)?.[0] ?? ''
		const suffix = text.match(/\s*$/)?.[0] ?? ''
		return `${prefix}${pattern.replace(match)}${suffix}`
	}

	return text
}
