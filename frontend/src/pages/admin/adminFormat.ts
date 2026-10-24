// Formatting helpers for the admin pages

const WEEK_MS = 7 * 86_400_000

export function activityStatus(lastSeenAt: string | null) {
	if (!lastSeenAt) return { label: 'Never signed in', dot: 'bg-zinc-300' }
	return Date.now() - new Date(lastSeenAt).getTime() < WEEK_MS ? { label: 'Active', dot: 'bg-emerald-500' } : { label: 'Inactive', dot: 'bg-zinc-400' }
}

export function formatDate(value: string | null) {
	if (!value) return '—'
	return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeTime(value: string | null) {
	if (!value) return 'Never'
	const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000)
	if (minutes < 1) return 'Just now'
	if (minutes < 60) return `${minutes} min ago`
	const hours = Math.round(minutes / 60)
	if (hours < 24) return `${hours} h ago`
	const days = Math.round(hours / 24)
	return days < 30 ? `${days} d ago` : formatDate(value)
}
