import { useAuthStore } from '@/stores/authStore'
import { Activity, ArrowLeft, LayoutDashboard, LogOut, MapPinned, Menu, Settings, Ticket, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Logo() {
	return (
		<div className='flex items-center gap-2'>
			<svg width='22' height='22' viewBox='0 0 24 24' fill='currentColor' className='text-orange-500' aria-hidden='true'>
				<path d='M3 12L21 4L17 12L21 20L3 12Z' />
			</svg>
			<span className='text-[15px] font-semibold tracking-tight text-zinc-900'>Trippple</span>
			<span className='rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500'>Admin</span>
		</div>
	)
}

export default function AdminLayout() {
	const { t, i18n } = useTranslation()
	const navigate = useNavigate()
	const { user, logout } = useAuthStore()
	const [menuOpen, setMenuOpen] = useState(false)

	const links = [
		{ to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
		{ to: '/admin/users', label: t('admin.sidebar.users'), icon: Users },
		{ to: '/admin/referrals', label: 'Invite codes', icon: Ticket },
		{ to: '/admin/trips', label: t('admin.sidebar.trips'), icon: MapPinned },
		{ to: '/admin/analytics', label: t('admin.sidebar.analytics'), icon: Activity },
		{ to: '/admin/settings', label: t('admin.sidebar.settings'), icon: Settings },
	]

	const nav = (
		<nav className='flex flex-1 flex-col gap-0.5'>
			{links.map((link) => (
				<NavLink
					key={link.to}
					to={link.to}
					onClick={() => setMenuOpen(false)}
					className={({ isActive }) =>
						`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition ${isActive ? 'bg-zinc-900 font-medium text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`
					}
				>
					<link.icon className='h-4 w-4' />
					{link.label}
				</NavLink>
			))}

			<div className='mt-auto space-y-0.5 border-t border-zinc-100 pt-4'>
				<button type='button' onClick={() => navigate('/')} className='flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900'>
					<ArrowLeft className='h-4 w-4 rtl:rotate-180' />
					{t('user.header.back')}
				</button>
				<button type='button' onClick={() => logout().then(() => navigate('/'))} className='flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-zinc-600 transition hover:bg-red-50 hover:text-red-600'>
					<LogOut className='h-4 w-4' />
					{t('user.header.signout')}
				</button>
				{user && (
					<div className='px-3 pt-3'>
						<p className='truncate text-sm font-medium text-zinc-900'>{user.name}</p>
						<p className='truncate text-xs text-zinc-500'>{user.email}</p>
					</div>
				)}
			</div>
		</nav>
	)

	return (
		<div className='min-h-screen bg-zinc-50 text-zinc-900' dir={i18n.dir()}>
			{/* desktop sidebar */}
			<aside className='fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-zinc-200 bg-white p-4 lg:flex rtl:left-auto rtl:right-0 rtl:border-l rtl:border-r-0'>
				<div className='mb-6 px-2 pt-1'>
					<Logo />
				</div>
				{nav}
			</aside>

			{/* mobile top bar + drawer */}
			<header className='sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden'>
				<Logo />
				<button type='button' onClick={() => setMenuOpen(true)} aria-label='Open menu' className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100'>
					<Menu className='h-5 w-5' />
				</button>
			</header>
			{menuOpen && (
				<div className='fixed inset-0 z-40 lg:hidden'>
					<button type='button' aria-label='Close menu' onClick={() => setMenuOpen(false)} className='absolute inset-0 bg-zinc-900/30' />
					<aside className='absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white p-4 rtl:left-auto rtl:right-0'>
						<div className='mb-6 flex items-center justify-between px-2'>
							<Logo />
							<button type='button' onClick={() => setMenuOpen(false)} aria-label='Close menu' className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100'>
								<X className='h-5 w-5' />
							</button>
						</div>
						{nav}
					</aside>
				</div>
			)}

			<main className='min-w-0 lg:pl-60 rtl:lg:pl-0 rtl:lg:pr-60'>
				<div className='mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8'>
					<Outlet />
				</div>
			</main>
		</div>
	)
}
