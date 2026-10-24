import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, Users, Plane, UsersRound, Compass, X, LogOut, Trophy } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { canUsePremium, premiumFeatureFor } from '@/lib/plan'

interface MobileDrawerProps {
	isOpen: boolean
	onClose: () => void
}

const MENU_ITEMS = [
	{ path: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ path: '/user/maps', label: 'Maps', icon: Map },
	{ path: '/user/match', label: 'Match', icon: Users },
	{ path: '/user/trips', label: 'Trips', icon: Plane },
	{ path: '/user/groups', label: 'Groups', icon: UsersRound },
	{ path: '/user/leaderboard', label: 'Leaderboard', icon: Trophy },
	{ path: '/user/ai', label: 'Trip planner', icon: Compass },
]

export default function MobileDrawer ({ isOpen, onClose }: MobileDrawerProps)  {
	const { logout, user } = useAuthStore()
	const premiumUnlocked = canUsePremium(user)
	const navigate = useNavigate()

	return (
		<>
			{/* Backdrop */}
			<div className={`fixed inset-0 z-60 bg-black/50 transition-opacity duration-300 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />

			{/* Drawer */}
			<aside className={`fixed inset-y-0 left-0 z-70 w-70 bg-bg shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
				<div className='flex h-16 items-center justify-between border-b border-border px-6'>
					<div
						className='flex items-center gap-2 group cursor-pointer'
						onClick={() => {
							onClose()
							navigate('/')
						}}>
						<span className='text-orange-500 transition-transform duration-200 group-hover:scale-110 flex shrink-0 items-center justify-center'>
							<svg width='22' height='22' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
								<path d='M3 12L21 4L17 12L21 20L3 12Z' />
							</svg>
						</span>
						<span className='text-[17px] font-semibold text-gray-900 tracking-tight'>Trippple</span>
					</div>
					<button onClick={onClose} className='p-2 text-text-muted hover:text-text'>
						<X className='h-6 w-6' />
					</button>
				</div>

				<nav className='flex-1 space-y-2 p-4 pt-6'>
					{MENU_ITEMS.map((item) => (
						<NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => `flex h-12 items-center rounded-xl px-4 transition-all ${isActive ? 'bg-active-bg text-brand' : 'text-text-muted hover:bg-surface hover:text-text'}`}>
							<item.icon className='h-5 w-5 shrink-0' />
							<span className='ml-3 font-medium'>{item.label}</span>
							{!premiumUnlocked && premiumFeatureFor(item.path) && <span className='ml-auto rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500'>Premium</span>}
						</NavLink>
					))}
				</nav>

				<div className='border-t border-border p-4'>
					<button
						onClick={async () => {
							await logout()
							onClose()
							navigate('/')
						}}
						className='flex h-12 w-full items-center rounded-xl px-4 text-text-muted transition-all hover:bg-red-50 hover:text-red-600'>
						<LogOut className='h-5 w-5 shrink-0' />
						<span className='ml-3 font-medium'>Log out</span>
					</button>
				</div>
			</aside>
		</>
	)
}
