import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, Users, ClipboardList, UsersRound, Compass, ChevronLeft, ChevronRight, LogOut, Trophy, Bus, History, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { canUsePremium, premiumFeatureFor } from '@/lib/plan'

interface SidebarProps {
	isCollapsed: boolean
	setIsCollapsed: (collapsed: boolean) => void
}

const MENU_ITEMS = [
	{ path: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ path: '/user/history', label: 'History', icon: History },
	{ path: '/user/maps', label: 'Maps', icon: Map },
	{ path: '/user/match', label: 'Match', icon: Users },
	{ path: '/user/trip-plan', label: 'Agenda', icon: ClipboardList },
	{ path: '/user/groups', label: 'Groups', icon: UsersRound },
	{ path: '/user/leaderboard', label: 'Leaderboard', icon: Trophy },
	{ path: '/user/trips', label: 'Transport', icon: Bus },
	{ path: '/user/ai', label: 'Trip planner', icon: Compass },
	{ path: '/user/view-360', label: '360° View', icon: Eye },
]

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
	const { logout, user } = useAuthStore()
	const premiumUnlocked = canUsePremium(user)
	const navigate = useNavigate()

	return (
		<aside className={`flex h-dvh flex-col overflow-hidden border-r border-border bg-bg duration-300 ease-in-out ${isCollapsed ? 'w-18' : 'w-60'}`}>
			<div className='flex h-16 items-center border-b border-border px-6'>
				<div
					className='group flex cursor-pointer items-center gap-2'
					onClick={() => {
						navigate('/')
						window.scrollTo({ top: 0, behavior: 'smooth' })
					}}>
					<span className='flex shrink-0 items-center justify-center text-orange-500 transition-transform duration-200 group-hover:scale-110'>
						<svg width='22' height='22' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
							<path d='M3 12L21 4L17 12L21 20L3 12Z' />
						</svg>
					</span>
					{!isCollapsed && <span className='text-[17px] font-semibold tracking-tight text-gray-900'>Trippple</span>}
				</div>
			</div>

			<nav className='flex-1 space-y-1 overflow-hidden p-3 pt-6'>
				{MENU_ITEMS.map((item) => (
					<NavLink key={item.path} to={item.path} className={({ isActive }) => `group relative flex h-11 items-center rounded-xl transition-all duration-200 hover:bg-active-bg ${isActive ? 'bg-active-bg text-brand' : 'text-text-muted hover:text-text'} ${isCollapsed ? 'justify-center' : 'px-3'}`}>
						{({ isActive }) => (
							<>
								<item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-brand' : 'group-hover:text-brand'}`} />

								{isCollapsed ? (
									<div className='pointer-events-none absolute left-full z-100 ml-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>{item.label}</div>
								) : (
									<>
										<span className='ml-3 text-sm font-medium transition-opacity duration-300'>{item.label}</span>
										{!premiumUnlocked && premiumFeatureFor(item.path) && <span className='ml-auto rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500'>Premium</span>}
										{isActive && <div className='absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand' />}
									</>
								)}
							</>
						)}
					</NavLink>
				))}
			</nav>

			<div className='space-y-1 border-t border-border p-3'>
				<button
					onClick={async () => {
						await logout()
						navigate('/')
					}}
					className={`group relative flex h-11 w-full items-center rounded-xl text-text-muted transition-all duration-200 hover:bg-red-50 hover:text-red-600 ${isCollapsed ? 'justify-center' : 'px-3'}`}>
					<LogOut className='h-5 w-5 shrink-0 transition-colors group-hover:text-red-600' />
					{isCollapsed ? <div className='pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>Log out</div> : <span className='ml-3 text-sm font-medium'>Log out</span>}
				</button>

				<button onClick={() => setIsCollapsed(!isCollapsed)} className={`group relative flex h-11 w-full items-center rounded-xl text-text-muted transition-all duration-200 hover:bg-active-bg hover:text-brand ${isCollapsed ? 'justify-center' : 'px-3'}`}>
					{isCollapsed ? (
						<ChevronRight className='h-5 w-5' />
					) : (
						<>
							<ChevronLeft className='h-5 w-5' />
							<span className='ml-3 text-sm font-medium'>Collapse</span>
						</>
					)}
				</button>
			</div>
		</aside>
	)
}
