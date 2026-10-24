import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { OPEN_ASSISTANT_EVENT } from '@/lib/events'
import { CalendarDays, ChevronRight, Eye, History, LayoutDashboard, MapPinned, MessageCircle, Plus, Users, UsersRound } from 'lucide-react'

const BOTTOM_NAV_VISIBILITY_EVENT = 'trippple:bottom-nav-visibility'

const TABS = [
	{ path: '/user/dashboard', label: 'Home', icon: LayoutDashboard },
	{ path: '/user/history', label: 'Trips', icon: History },
]
const TABS_RIGHT = [{ path: '/user/groups', label: 'Groups', icon: UsersRound }]

const QUICK_ACTIONS = [
	{ title: 'Plan a trip', subtitle: 'Build a day-by-day itinerary', icon: CalendarDays, to: '/user/trip-plan' },
	{ title: 'Explore the map', subtitle: 'Find places around you', icon: MapPinned, to: '/user/maps' },
	{ title: 'Create a group', subtitle: 'Travel with other people', icon: Users, to: '/user/groups', state: { openCreateGroup: true } },
	{ title: '360° view', subtitle: 'Look around before you go', icon: Eye, to: '/user/view-360' },
]

function TabLink({ path, label, icon: Icon }: { path: string; label: string; icon: typeof History }) {
	return (
		<NavLink to={path} className='flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1'>
			{({ isActive }) => (
				<>
					<Icon className={`h-5 w-5 ${isActive ? 'text-orange-500' : 'text-zinc-400'}`} strokeWidth={2.1} />
					<span className={`text-[11px] leading-none ${isActive ? 'font-medium text-zinc-900' : 'text-zinc-500'}`}>{label}</span>
				</>
			)}
		</NavLink>
	)
}

/** Phone tab bar: fixed to the bottom edge, never floating over content */
export default function BottomNav() {
	const [open, setOpen] = useState(false)
	const [hidden, setHidden] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		const onVisibility = (event: Event) => {
			const isHidden = Boolean((event as CustomEvent<{ hidden?: boolean }>).detail?.hidden)
			setHidden(isHidden)
			if (isHidden) setOpen(false)
		}
		window.addEventListener(BOTTOM_NAV_VISIBILITY_EVENT, onVisibility as EventListener)
		return () => window.removeEventListener(BOTTOM_NAV_VISIBILITY_EVENT, onVisibility as EventListener)
	}, [])

	useEffect(() => {
		if (!open) return
		const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [open])

	const goTo = (to: string, state?: Record<string, unknown>) => {
		setOpen(false)
		navigate(to, state ? { state } : undefined)
	}

	const openAssistant = () => {
		setOpen(false)
		window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT))
	}

	if (hidden) return null

	return (
		<div className='md:hidden'>
			{open && (
				<>
					<button type='button' aria-label='Close menu' onClick={() => setOpen(false)} className='fixed inset-0 z-40 bg-zinc-900/30' />
					<div className='fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-3' role='dialog' aria-label='Quick actions'>
						<div className='mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200' />
						<ul className='divide-y divide-zinc-100'>
							{QUICK_ACTIONS.map((action) => (
								<li key={action.title}>
									<button type='button' onClick={() => goTo(action.to, action.state)} className='flex w-full items-center gap-3 py-3 text-left'>
										<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700'>
											<action.icon className='h-5 w-5' />
										</span>
										<span className='min-w-0 flex-1'>
											<span className='block text-[15px] font-medium text-zinc-900'>{action.title}</span>
											<span className='block text-sm text-zinc-500'>{action.subtitle}</span>
										</span>
										<ChevronRight className='h-4 w-4 text-zinc-300' />
									</button>
								</li>
							))}
						</ul>
					</div>
				</>
			)}

			<nav className='fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]' aria-label='Main'>
				<div className='mx-auto flex h-16 max-w-md items-stretch px-2'>
					{TABS.map((tab) => (
						<TabLink key={tab.path} {...tab} />
					))}
					<div className='flex flex-1 items-center justify-center'>
						<button
							type='button'
							aria-label={open ? 'Close menu' : 'New'}
							aria-expanded={open}
							onClick={() => setOpen((value) => !value)}
							className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition ${open ? 'rotate-45 bg-zinc-900' : 'bg-orange-500'}`}
						>
							<Plus className='h-5 w-5' strokeWidth={2.4} />
						</button>
					</div>
					{TABS_RIGHT.map((tab) => (
						<TabLink key={tab.path} {...tab} />
					))}
					<button type='button' onClick={openAssistant} className='flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1'>
						<MessageCircle className='h-5 w-5 text-zinc-400' strokeWidth={2.1} />
						<span className='text-[11px] leading-none text-zinc-500'>Assistant</span>
					</button>
				</div>
			</nav>
		</div>
	)
}
