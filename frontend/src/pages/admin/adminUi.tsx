// Small shared pieces for the admin pages
import type { AdminMember } from '@/lib/plan'
import { activityStatus } from './adminFormat'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
	return (
		<div className='mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between'>
			<div>
				<h1 className='text-2xl font-semibold tracking-tight text-zinc-900'>{title}</h1>
				{description && <p className='mt-1 text-sm text-zinc-500'>{description}</p>}
			</div>
			{action}
		</div>
	)
}

export function Panel({ title, action, children, className = '', flush = false }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
	return (
		<section className={`rounded-xl border border-zinc-200 bg-white ${flush ? '' : 'p-4 sm:p-5'} ${className}`}>
			{(title || action) && (
				<div className={`flex items-center justify-between gap-3 ${flush ? 'border-b border-zinc-100 px-4 py-3 sm:px-5' : 'mb-4'}`}>
					{title && <h2 className='text-sm font-semibold text-zinc-900'>{title}</h2>}
					{action}
				</div>
			)}
			{children}
		</section>
	)
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
	return (
		<div className='rounded-xl border border-zinc-200 bg-white p-4 sm:p-5'>
			<p className='text-sm text-zinc-500'>{label}</p>
			<p className='mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900'>{value}</p>
			{hint && <p className='mt-1 text-xs text-zinc-400'>{hint}</p>}
		</div>
	)
}

export function PlanBadge({ member }: { member: Pick<AdminMember, 'isPremium' | 'expired'> }) {
	if (member.isPremium) return <span className='inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-200'>Premium</span>
	if (member.expired) return <span className='inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500'>Expired</span>
	return <span className='inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600'>Free</span>
}

export function StatusLabel({ lastSeenAt }: { lastSeenAt: string | null }) {
	const status = activityStatus(lastSeenAt)
	return (
		<span className='inline-flex items-center gap-1.5 text-sm text-zinc-600'>
			<span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
			{status.label}
		</span>
	)
}

export function Avatar({ name, src }: { name: string; src?: string | null }) {
	const initials = name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()
	return src ? (
		<img
			src={src}
			alt=''
			referrerPolicy='no-referrer'
			onError={(event) => {
				// Broken photo (e.g. expired Google avatar): fall back to the initials circle
				const img = event.currentTarget
				img.replaceWith(Object.assign(document.createElement('span'), { className: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600', textContent: initials || '?' }))
			}}
			className='h-8 w-8 shrink-0 rounded-full object-cover'
		/>
	) : (
		<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600'>{initials || '?'}</span>
	)
}
