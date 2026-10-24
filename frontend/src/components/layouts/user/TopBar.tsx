import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Bell, Search, Menu, User, ChevronDown, Globe, LogOut, Settings, LayoutDashboard, Map as MapIcon, Shuffle, Briefcase, UsersRound, Trophy, History, CalendarDays } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'
import { listNotifications, markAllNotificationsRead, markNotificationRead, type GroupNotification } from '@/lib/travelApi'
import { hasActivePremium } from '@/lib/plan'

interface TopBarProps {
	onMenuClick?: () => void
}

const NOTIFICATION_EXIT_MS = 280
const NOTIFICATION_DISMISSED_STORAGE_KEY = 'trippple-dismissed-notifications'
const LANGUAGE_OPTIONS: Array<{ code: AppLocale; label: string }> = [
	{ code: 'en', label: 'EN' },
	{ code: 'fr', label: 'FR' },
	{ code: 'ar', label: 'AR' },
	{ code: 'es', label: 'ES' },
]

const BREADCRUMB_LABEL_KEYS: Array<[string, string]> = [
	['/user/dashboard', 'topbar.dashboard'],
	['/user/maps', 'topbar.maps'],
	['/user/match', 'topbar.match'],
	['/user/trips', 'topbar.trips'],
	['/user/groups', 'topbar.groups'],
	['/user/trip-plan', 'topbar.tripPlan'],
	['/user/ai', 'topbar.aiAssistant'],
	['/user/leaderboard', 'topbar.leaderboard'],
	['/user/history', 'topbar.history'],
	['/user/settings', 'topbar.settings'],
	['/user/view-360', 'topbar.view360'],
	['/admin/dashboard', 'topbar.adminDashboard'],
	['/admin/users', 'topbar.adminUsers'],
	['/admin/trips', 'topbar.adminTrips'],
	['/admin/analytics', 'topbar.adminAnalytics'],
	['/admin/settings', 'topbar.adminSettings'],
]

function formatRelativeTime(locale: AppLocale, value: string) {
	const formatter = getRelativeTimeFormatter(locale)
	const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000)

	if (Math.abs(minutes) < 60) {
		return formatter.format(minutes, 'minute')
	}

	const hours = Math.round(minutes / 60)
	if (Math.abs(hours) < 24) {
		return formatter.format(hours, 'hour')
	}

	const days = Math.round(hours / 24)
	return formatter.format(days, 'day')
}

const relativeTimeFormatterCache = new Map<AppLocale, Intl.RelativeTimeFormat>()

function getRelativeTimeFormatter(locale: AppLocale) {
	const cached = relativeTimeFormatterCache.get(locale)
	if (cached) return cached

	const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
	relativeTimeFormatterCache.set(locale, formatter)
	return formatter
}

function getBreadcrumbLabel(pathname: string, t: (key: string, options?: Record<string, unknown>) => string) {
	if (pathname.startsWith('/user/groups/') && pathname.endsWith('/chat')) {
		return t('topbar.groupChat')
	}

	const key = BREADCRUMB_LABEL_KEYS.find(([path]) => pathname === path)?.[1] ?? 'topbar.dashboard'
	return t(key)
}

export default function TopBar({ onMenuClick }: TopBarProps) {
	const { user, logout } = useAuthStore()
	const { isMobile } = useWindowSize()
	const location = useLocation()
	const navigate = useNavigate()
	const { i18n, t } = useTranslation()
	const locale = resolveAppLocale(i18n.resolvedLanguage)
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
	const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
	const [isNotificationsClosing, setIsNotificationsClosing] = useState(false)
	const [notifications, setNotifications] = useState<GroupNotification[]>([])
	const [notificationsLoading, setNotificationsLoading] = useState(false)
	const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>(() => {
		if (typeof window === 'undefined') return []

		try {
			const stored = window.localStorage.getItem(NOTIFICATION_DISMISSED_STORAGE_KEY)
			return stored ? (JSON.parse(stored) as string[]) : []
		} catch {
			return []
		}
	})

	const profileMenuRef = useRef<HTMLDivElement>(null)
	const languageMenuRef = useRef<HTMLDivElement>(null)
	const notificationsRef = useRef<HTMLDivElement>(null)
	const notificationCloseTimerRef = useRef<number | null>(null)
	const isNotificationsOpenRef = useRef(false)
	const isNotificationsClosingRef = useRef(false)

	const mobileNavLinks = useMemo(
		() => [
			{ label: t('topbar.dashboard'), to: '/user/dashboard', icon: LayoutDashboard },
			{ label: t('topbar.maps'), to: '/user/maps', icon: MapIcon },
			{ label: t('topbar.match'), to: '/user/match', icon: Shuffle },
			{ label: t('topbar.trips'), to: '/user/trips', icon: Briefcase },
			{ label: t('topbar.groups'), to: '/user/groups', icon: UsersRound },
			{ label: t('topbar.tripPlan'), to: '/user/trip-plan', icon: CalendarDays },
			{ label: t('topbar.aiAssistant'), to: '/user/ai', icon: MessageCircle },
			{ label: t('topbar.leaderboard'), to: '/user/leaderboard', icon: Trophy },
			{ label: t('topbar.history'), to: '/user/history', icon: History },
		],
		[t],
	)

	const dismissedNotificationIdSet = useMemo(() => new Set(dismissedNotificationIds), [dismissedNotificationIds])

	const { visibleNotifications, unreadCount } = useMemo(() => {
		const visible = notifications.filter((notification) => !dismissedNotificationIdSet.has(notification.id))
		const unread = visible.reduce((count, notification) => (notification.readAt ? count : count + 1), 0)

		return {
			visibleNotifications: visible,
			unreadCount: unread,
		}
	}, [dismissedNotificationIdSet, notifications])

	useEffect(() => {
		isNotificationsOpenRef.current = isNotificationsOpen
	}, [isNotificationsOpen])

	useEffect(() => {
		isNotificationsClosingRef.current = isNotificationsClosing
	}, [isNotificationsClosing])

	const refreshNotifications = useCallback(
		async (force = false) => {
			if (!user) {
				setNotifications([])
				return
			}

			if (!force && notifications.length > 0) return

			setNotificationsLoading(true)
			try {
				const { data } = await listNotifications({ limit: 12 })
				setNotifications(data)
			} catch {
				setNotifications([])
			} finally {
				setNotificationsLoading(false)
			}
		},
		[notifications.length, user],
	)

	useEffect(() => {
		void refreshNotifications()
	}, [refreshNotifications, user?.id])

	useEffect(() => {
		try {
			window.localStorage.setItem(NOTIFICATION_DISMISSED_STORAGE_KEY, JSON.stringify(dismissedNotificationIds))
		} catch {
			// Ignore storage write failures and keep notifications usable.
		}
	}, [dismissedNotificationIds])

	useEffect(() => {
		return () => {
			if (notificationCloseTimerRef.current) {
				window.clearTimeout(notificationCloseTimerRef.current)
			}
		}
	}, [])

	const closeNotifications = useCallback(
		(immediate = false) => {
			if (!isNotificationsOpenRef.current && !isNotificationsClosingRef.current) return

			if (notificationCloseTimerRef.current) {
				window.clearTimeout(notificationCloseTimerRef.current)
			}

			if (immediate) {
				setIsNotificationsOpen(false)
				setIsNotificationsClosing(false)
				isNotificationsOpenRef.current = false
				isNotificationsClosingRef.current = false
				return
			}

			setIsNotificationsClosing(true)
			isNotificationsClosingRef.current = true
			notificationCloseTimerRef.current = window.setTimeout(() => {
				setIsNotificationsOpen(false)
				setIsNotificationsClosing(false)
				isNotificationsOpenRef.current = false
				isNotificationsClosingRef.current = false
				notificationCloseTimerRef.current = null
			}, NOTIFICATION_EXIT_MS)
		},
		[],
	)

	useEffect(() => {
		const handlePointerDown = (event: MouseEvent) => {
			if (!profileMenuRef.current?.contains(event.target as Node)) {
				setIsProfileMenuOpen(false)
			}

			if (!languageMenuRef.current?.contains(event.target as Node)) {
				setIsLanguageMenuOpen(false)
			}

			if (!notificationsRef.current?.contains(event.target as Node)) {
				if (isNotificationsOpenRef.current || isNotificationsClosingRef.current) {
					closeNotifications()
				}
			}
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsProfileMenuOpen(false)
				setIsLanguageMenuOpen(false)
				closeNotifications()
			}
		}

		document.addEventListener('mousedown', handlePointerDown)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handlePointerDown)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [closeNotifications])

	useEffect(() => {
		setIsProfileMenuOpen(false)
		setIsLanguageMenuOpen(false)
		closeNotifications(true)
	}, [closeNotifications, location.pathname])

	const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase()
	const roleKey = user?.role ? `topbar.roles.${user.role}` : 'topbar.roles.USER'
	const userLabel = t(roleKey, { defaultValue: t('topbar.roles.USER') })
	const currentLanguageCode = locale.toUpperCase()

	async function handleLanguageChange(nextLocale: AppLocale) {
		await i18n.changeLanguage(nextLocale)
		setIsLanguageMenuOpen(false)
	}

	async function handleLogout() {
		await logout()
		navigate('/login')
	}

	const openNotifications = async () => {
		if (isNotificationsOpen && !isNotificationsClosing) {
			closeNotifications()
			return
		}

		if (notificationCloseTimerRef.current) {
			window.clearTimeout(notificationCloseTimerRef.current)
			notificationCloseTimerRef.current = null
		}

		setIsNotificationsClosing(false)
		setIsNotificationsOpen(true)
		isNotificationsClosingRef.current = false
		isNotificationsOpenRef.current = true
		await refreshNotifications(notifications.length === 0)
	}

	const handleNotificationClick = async (notification: GroupNotification) => {
		if (!notification.readAt) {
			await markNotificationRead(notification.id)
			setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item)))
		}

		if (notification.group?.id) {
			navigate('/user/groups', {
				state: {
					focusGroupId: notification.group.id,
					focusNotificationType: notification.type,
				},
			})
			closeNotifications()
		}
	}

	const handleReadAll = async () => {
		await markAllNotificationsRead()
		setNotifications((prev) =>
			prev.map((notification) => ({
				...notification,
				readAt: notification.readAt ?? new Date().toISOString(),
			})),
		)
	}

	const handleClearAllNotifications = async () => {
		if (visibleNotifications.length === 0) return

		try {
			await markAllNotificationsRead()
		} catch {
			// Clearing the local list matters more than surfacing this failure.
		}

		const clearedIds = visibleNotifications.map((notification) => notification.id)
		setDismissedNotificationIds((prev) => Array.from(new Set([...prev, ...clearedIds])))
		setNotifications((prev) => prev.map((notification) => (clearedIds.includes(notification.id) ? { ...notification, readAt: notification.readAt ?? new Date().toISOString() } : notification)))
	}

	const renderNotificationsContent = () => (
		<div className='flex h-full min-h-0 flex-col overflow-hidden'>
			<div className='flex items-center justify-between border-b border-zinc-100 px-5 py-4'>
				<div>
					<p className='text-sm font-semibold text-zinc-900'>{t('topbar.notifications')}</p>
					<p className='mt-0.5 text-xs text-zinc-400'>{unreadCount > 0 ? t('topbar.unreadLabel', { count: unreadCount }) : t('topbar.allCaughtUp')}</p>
				</div>
				<div className='flex items-center gap-2'>
					<button type='button' onClick={() => void handleReadAll()} disabled={unreadCount === 0} className='text-[11px] font-medium text-zinc-400 transition hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40'>
						{t('topbar.markAllRead')}
					</button>
					<span className='text-zinc-200'>|</span>
					<button type='button' onClick={() => void handleClearAllNotifications()} disabled={visibleNotifications.length === 0} className='text-[11px] font-medium text-zinc-400 transition hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40'>
						{t('topbar.clearAll')}
					</button>
				</div>
			</div>

			<div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain'>
				{notificationsLoading && <div className='flex h-36 items-center justify-center text-xs text-zinc-400'>{t('topbar.loading')}</div>}

				{!notificationsLoading && visibleNotifications.length === 0 && (
					<div className='flex h-40 flex-col items-center justify-center px-6 text-center'>
						<Bell className='mb-3 h-5 w-5 text-zinc-300' />
						<p className='text-sm font-medium text-zinc-500'>{t('topbar.noNotifications')}</p>
						<p className='mt-1 text-xs text-zinc-400'>{t('topbar.groupUpdatesHint')}</p>
					</div>
				)}

				{visibleNotifications.map((notification, index) => (
					<button key={notification.id} type='button' onClick={() => void handleNotificationClick(notification)} className='relative flex w-full flex-col px-5 py-4 text-left transition hover:bg-zinc-50'>
						<div className='flex items-start justify-between gap-4'>
							<div className='flex min-w-0 items-center gap-2'>
								{!notification.readAt && <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500' />}
								<p className={`truncate text-sm font-medium leading-snug ${notification.readAt ? 'text-zinc-500' : 'text-zinc-900'}`}>{notification.title}</p>
							</div>
							<span className='shrink-0 text-[11px] text-zinc-400'>{formatRelativeTime(locale, notification.createdAt)}</span>
						</div>
						<p className='mt-1 pl-3.5 text-xs leading-5 text-zinc-400'>{notification.message}</p>
						{index < visibleNotifications.length - 1 && <span className='absolute bottom-0 left-5 right-5 h-px bg-zinc-100' />}
					</button>
				))}
			</div>
		</div>
	)

	return (
		<>
			<header dir={i18n.dir()} className='flex h-16 w-full items-center justify-between border-b border-border bg-bg px-4 md:px-8'>
				<div className='flex items-center gap-4'>
					{!isMobile && (
						<div className='hidden lg:block'>
							<div className='flex items-center text-sm'>
								<span className='text-text font-semibold'>{getBreadcrumbLabel(location.pathname, t)}</span>
							</div>
						</div>
					)}

					{isMobile && (
						<Link to='/' className='group flex items-center gap-2'>
							<span className='flex shrink-0 items-center justify-center text-orange-500 transition-transform duration-200 group-hover:scale-110'>
								<svg width='22' height='22' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
									<path d='M3 12L21 4L17 12L21 20L3 12Z' />
								</svg>
							</span>
							<span className='text-[17px] font-semibold tracking-tight text-gray-900'>Trippple</span>
						</Link>
					)}

					{!isMobile && (
						<div className='flex items-center lg:hidden'>
							<button onClick={onMenuClick} className='-ml-2 p-2 text-gray-400 hover:text-gray-600'>
								<Menu className='h-6 w-6' />
							</button>
							<span className='ml-2 text-[17px] font-semibold tracking-tight text-gray-900'>Trippple</span>
						</div>
					)}
				</div>

				<div className='hidden max-w-md flex-1 items-center justify-center px-4 lg:flex'>
					<div className='relative w-full'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3' />
						<input type='text' placeholder={t('topbar.searchPlaceholder')} className='h-9 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand rtl:pl-4 rtl:pr-10' />
					</div>
				</div>

				<div className='flex items-center gap-2 sm:gap-4'>
					<div ref={languageMenuRef} className='relative hidden lg:block'>
						<button
							type='button'
							onClick={() => {
								setIsLanguageMenuOpen((prev) => !prev)
								setIsProfileMenuOpen(false)
							}}
							className='flex items-center gap-1.5 rounded-full px-2 py-2 text-[13.5px] font-medium text-gray-600 transition-colors hover:bg-zinc-100 hover:text-gray-900'
							aria-haspopup='menu'
							aria-expanded={isLanguageMenuOpen}
							aria-label='Change language'>
							<Globe className='h-4 w-4' />
							<span className='uppercase'>{currentLanguageCode}</span>
							<ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
						</button>

						{isLanguageMenuOpen && (
							<div className='absolute right-0 top-[calc(100%+0.65rem)] z-50 min-w-[104px] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_18px_44px_rgba(24,24,27,0.12)] rtl:right-auto rtl:left-0'>
								{LANGUAGE_OPTIONS.map((option) => {
									const isActive = locale === option.code

									return (
										<button key={option.code} type='button' onClick={() => void handleLanguageChange(option.code)} className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] font-medium transition ${isActive ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'}`}>
											{option.label}
										</button>
									)
								})}
							</div>
						)}
					</div>

					<div ref={notificationsRef} className='relative'>
						<button onClick={() => void openNotifications()} className='relative rounded-full p-2 text-gray-500 transition-colors hover:bg-zinc-100 hover:text-gray-900'>
							<Bell className='h-5 w-5' />
							{unreadCount > 0 && (
								<>
									<span className='absolute right-2 top-2 flex h-2 w-2'>
										<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75' />
										<span className='relative inline-flex h-2 w-2 rounded-full bg-brand' />
									</span>
									<span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-zinc-950 px-1.5 py-0.5 text-[10px] font-bold text-white'>{Math.min(unreadCount, 9)}</span>
								</>
							)}
						</button>

						{(isNotificationsOpen || isNotificationsClosing) &&
							(isMobile ? (
								<>
								<div onClick={() => closeNotifications()} className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] ${isNotificationsClosing ? 'animate-[notifBackdropOut_220ms_ease-out_both]' : 'animate-[notifBackdrop_220ms_ease-out_both]'}`} />
									<div className={`fixed inset-x-0 bottom-0 z-[60] h-[min(82vh,620px)] max-h-[82vh] rounded-t-[30px] border border-white/70 bg-white shadow-[0_-24px_60px_rgba(24,24,27,0.18)] ${isNotificationsClosing ? 'animate-[notifSheetExit_280ms_cubic-bezier(0.4,0,0.2,1)_both]' : 'animate-[notifSheetRise_560ms_cubic-bezier(0.22,1,0.36,1)_both]'}`}>
										<div className='mx-auto mt-3 h-1.5 w-14 rounded-full bg-zinc-200' />
										<div className='flex h-[calc(min(82vh,620px)-18px)] min-h-[402px] flex-col overflow-hidden'>
											<div className='flex items-center justify-between px-4 pb-1 pt-2'>
												<button type='button' onClick={() => closeNotifications()} className='rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-600'>
													{t('topbar.close')}
												</button>
											</div>
											{renderNotificationsContent()}
										</div>
									</div>
								</>
							) : (
								<div className={`absolute right-0 top-[calc(100%+0.9rem)] z-50 h-[min(72vh,560px)] w-[420px] origin-top-right overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-[0_30px_80px_rgba(24,24,27,0.18)] ${isNotificationsClosing ? 'animate-[notifPopoverExit_240ms_cubic-bezier(0.4,0,0.2,1)_both]' : 'animate-[notifPopoverRise_500ms_cubic-bezier(0.22,1,0.36,1)_both]'}`}>
									<div className='absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(249,115,22,0.08)_0%,rgba(249,115,22,0)_100%)]' />
									<div className='relative h-full overflow-hidden'>{renderNotificationsContent()}</div>
								</div>
							))}
					</div>

					<div ref={profileMenuRef} className='relative ml-2'>
						<button type='button' onClick={() => setIsProfileMenuOpen((prev) => !prev)} className='flex items-center gap-3 rounded-full border border-transparent px-1.5 py-1 transition hover:border-border hover:bg-surface' aria-haspopup='menu' aria-expanded={isProfileMenuOpen}>
							{!isMobile && (
								<div className='hidden text-right sm:block rtl:text-left'>
									<p className='text-sm font-semibold leading-none text-text'>{user?.name || t('topbar.guest')}</p>
									{hasActivePremium(user) ? (
										<p className='mt-1 text-xs font-medium leading-none text-orange-600'>Premium</p>
									) : (
										<p className='mt-1 text-xs leading-none text-text-muted'>{user ? userLabel : t('topbar.roles.USER')}</p>
									)}
								</div>
							)}

							<div className='h-9 w-9 overflow-hidden rounded-full border border-border bg-surface ring-2 ring-white'>
								<div className='flex h-full w-full items-center justify-center bg-brand/10 text-brand'>{userInitial ? <span className='text-sm font-semibold'>{userInitial}</span> : <User className='h-5 w-5' />}</div>
							</div>

							{!isMobile && <ChevronDown className='h-4 w-4 text-gray-400' />}
						</button>

						{isProfileMenuOpen && (
							<div className='absolute right-0 top-[calc(100%+0.75rem)] z-50 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_44px_rgba(24,24,27,0.12)] rtl:right-auto rtl:left-0'>
								<div className='border-b border-zinc-100 px-4 py-3'>
									<p className='text-sm font-semibold text-zinc-950'>{user?.name || t('topbar.guest')}</p>
									<p className='mt-1 text-xs text-zinc-500'>{user?.email || t('topbar.signedInTraveler')}</p>
								</div>

								{isMobile && (
									<>
										<div className='border-b border-zinc-100 p-2'>
											{mobileNavLinks.map(({ label, to, icon: Icon }) => (
												<button
													key={to}
													type='button'
													onClick={() => {
														navigate(to)
														setIsProfileMenuOpen(false)
													}}
													className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-zinc-50 ${location.pathname === to ? 'bg-orange-50 text-orange-500' : 'text-zinc-700'}`}>
													<Icon className={`h-4 w-4 ${location.pathname === to ? 'text-orange-500' : 'text-zinc-400'}`} />
													{label}
												</button>
											))}
										</div>

										<div className='border-b border-zinc-100 px-3 py-3'>
											<div className='grid grid-cols-4 gap-2'>
												{LANGUAGE_OPTIONS.map((option) => {
													const isActive = locale === option.code

													return (
														<button
															key={option.code}
															type='button'
															onClick={() => {
																void handleLanguageChange(option.code)
																setIsProfileMenuOpen(false)
															}}
															className={`rounded-xl px-2.5 py-2 text-center text-xs font-semibold transition ${isActive ? 'bg-zinc-950 text-white' : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
															{option.label}
														</button>
													)
												})}
											</div>
										</div>
									</>
								)}

								<div className='p-2'>
									<button
										type='button'
										onClick={() => {
											navigate('/user/settings')
											setIsProfileMenuOpen(false)
										}}
										className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50'>
										<Settings className='h-4 w-4 text-orange-500' />
										{t('topbar.accountSettings')}
									</button>

									<button type='button' onClick={() => void handleLogout()} className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50'>
										<LogOut className='h-4 w-4 text-zinc-500' />
										{t('topbar.logOut')}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</header>

			<style>{`
				@keyframes notifBackdrop {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}

				@keyframes notifBackdropOut {
					from {
						opacity: 1;
					}
					to {
						opacity: 0;
					}
				}

				@keyframes notifPopoverRise {
					0% {
						opacity: 0;
						transform: translateY(28px) scale(0.96);
					}
					64% {
						opacity: 1;
						transform: translateY(-6px) scale(1);
					}
					100% {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}

				@keyframes notifPopoverExit {
					from {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
					to {
						opacity: 0;
						transform: translateY(12px) scale(0.98);
					}
				}

				@keyframes notifSheetRise {
					0% {
						opacity: 0;
						transform: translateY(100%);
					}
					70% {
						opacity: 1;
						transform: translateY(-10px);
					}
					100% {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes notifSheetExit {
					from {
						opacity: 1;
						transform: translateY(0);
					}
					to {
						opacity: 0;
						transform: translateY(100%);
					}
				}
			`}</style>
		</>
	)
}
