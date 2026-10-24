import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Medal, Crown, Search, Users, Globe, Star, ArrowUpRight, Flame, Zap, Loader2, AlertCircle, X, UserPlus, FolderKanban, Compass, MapPin, RefreshCw, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'

type LeaderboardCategory = 'global' | 'friends' | 'city'

type BackendLeaderboardEntry = {
	rank: number
	userId: string
	userName: string
	userAvatar?: string | null
	totalScore: number
	totalXp: number
	level: number
	groupsCreated: number
	groupsJoined: number
}

type LeaderboardEntry = {
	id: string
	rank: number
	name: string
	avatarUrl?: string
	xp: number
	score: number
	level: number
	groupsCreated: number
	groupsJoined: number
	label: string
	isCurrentUser?: boolean
}

const CATEGORIES = [
	{ id: 'global', label: 'Global', icon: Globe },
	{ id: 'friends', label: 'Friends', icon: Users },
	{ id: 'city', label: 'City', icon: Star },
] as const

function getSafeAvatar(name: string, avatarUrl?: string | null) {
	if (avatarUrl && avatarUrl.trim().length > 0) return avatarUrl
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F97316&color=fff&bold=true&size=256`
}

function getTravelerLabel(entry: BackendLeaderboardEntry, isFrench: boolean) {
	if (entry.level >= 15) return isFrench ? 'Explorateur Légendaire' : 'Legendary Explorer'
	if (entry.level >= 10) return isFrench ? 'Voyageur Expert' : 'Expert Traveler'
	if (entry.level >= 5) return isFrench ? 'Grand Aventurier' : 'Great Adventurer'
	if (entry.groupsCreated >= 3) return isFrench ? 'Créateur de Groupes' : 'Group Creator'
	if (entry.groupsJoined >= 5) return isFrench ? 'Esprit Social' : 'Social Explorer'
	return isFrench ? 'Traveler' : 'Traveler'
}

function RankBadge({ rank }: { rank: number }) {
	if (rank === 1) {
		return (
			<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-50'>
				<Crown className='h-5 w-5 text-amber-600' />
			</div>
		)
	}
	if (rank === 2) {
		return (
			<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-4 ring-slate-50'>
				<Trophy className='h-5 w-5 text-slate-500' />
			</div>
		)
	}
	if (rank === 3) {
		return (
			<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 ring-4 ring-orange-50'>
				<Medal className='h-5 w-5 text-orange-600' />
			</div>
		)
	}
	return <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-sm font-bold text-zinc-400'>#{rank}</div>
}

export default function UserLeaderboard() {
	const { i18n } = useTranslation()
	const { user: loggedUser } = useAuthStore()

	const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('global')
	const [searchQuery, setSearchQuery] = useState('')
	const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null)
	const [inviteLoading, setInviteLoading] = useState(false)
	const [inviteSent, setInviteSent] = useState(false)

  const [user, setUser] = useState<{ rank: number | null, xp: number }>({ rank: null, xp: 0 })

	const isFrench = i18n.language?.startsWith('fr')

	const fetchLeaderboard = useCallback(
		async (softRefresh = false) => {
			if (softRefresh) {
				setIsRefreshing(true)
			} else {
				setIsLoading(true)
			}

			try {
				const params = new URLSearchParams({ category: activeCategory })
				const res = await api.get<{ leaderboard: BackendLeaderboardEntry[], user: { rank: number | null, xp: number } }>(`/users/leaderboard?${params.toString()}`)


				const rawData: BackendLeaderboardEntry[] = res.data.leaderboard
				setUser(res.data.user)

				const mapped: LeaderboardEntry[] = (Array.isArray(rawData) ? rawData : []).map((entry, index) => ({
					id: String(entry.userId ?? `user-${index}`),
					rank: Number(entry.rank ?? index + 1),
					name: String(entry.userName ?? 'Traveler'),
					avatarUrl: getSafeAvatar(String(entry.userName ?? 'Traveler'), entry.userAvatar),
					xp: Number(entry.totalXp ?? 0),
					score: Number(entry.totalScore ?? 0),
					level: Number(entry.level ?? 1),
					groupsCreated: Number(entry.groupsCreated ?? 0),
					groupsJoined: Number(entry.groupsJoined ?? 0),
					label: getTravelerLabel(entry, isFrench),
					isCurrentUser: entry.userId === loggedUser?.id,
				}))

				setLeaderboardData(mapped)
				setError(null)
			} catch (err) {
				console.error('Failed to fetch leaderboard:', err)
				setLeaderboardData([])
				setError(isFrench ? 'Impossible de charger le classement depuis le backend.' : 'Could not load leaderboard data from the backend.')
			} finally {
				setIsLoading(false)
				setIsRefreshing(false)
			}
		},
		[activeCategory, loggedUser?.id, isFrench],
	)

	useEffect(() => {
		fetchLeaderboard()
	}, [fetchLeaderboard])

	useEffect(() => {
		if (selectedUser) {
			document.body.style.overflow = 'hidden'
			document.body.classList.add('lb-modal-open')
		} else {
			document.body.style.overflow = ''
			document.body.classList.remove('lb-modal-open')
		}
		return () => {
			document.body.style.overflow = ''
			document.body.classList.remove('lb-modal-open')
		}
	}, [selectedUser])

	const handleInviteFriend = useCallback(
		async (entry: LeaderboardEntry) => {
			if (inviteLoading || inviteSent) return
			setInviteLoading(true)
			try {
				await api.post(`/users/${entry.id}/invite`, {
					message: isFrench ? `${(loggedUser as any)?.userName ?? 'Un voyageur'} vous invite à rejoindre un groupe sur Trippple !` : `${(loggedUser as any)?.userName ?? 'A traveler'} is inviting you to join a group on Trippple!`,
				})
				setInviteSent(true)
				setTimeout(() => setInviteSent(false), 3000)
			} catch {
				try {
					await navigator.clipboard.writeText(isFrench ? `Rejoins-moi sur Trippple ! ${window.location.origin}` : `Join me on Trippple! ${window.location.origin}`)
					setInviteSent(true)
					setTimeout(() => setInviteSent(false), 3000)
				} catch {
					/* silent */
				}
			} finally {
				setInviteLoading(false)
			}
		},
		[loggedUser, inviteLoading, inviteSent, isFrench],
	)

	const filteredData = useMemo(() => {
		if (!searchQuery.trim()) return leaderboardData
		const q = searchQuery.trim().toLowerCase()
		return leaderboardData.filter((e) => e.name.toLowerCase().includes(q))
	}, [leaderboardData, searchQuery])

	if (isLoading) {
		return (
			<div className='flex h-[60vh] items-center justify-center'>
				<Loader2 className='h-8 w-8 animate-spin text-orange-500' />
			</div>
		)
	}

	if (error && leaderboardData.length === 0) {
		return (
			<div className='flex h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center'>
				<div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50'>
					<AlertCircle className='h-8 w-8 text-red-500' />
				</div>
				<div>
					<h3 className='text-lg font-bold text-zinc-950'>{isFrench ? 'Oups !' : 'Oops!'}</h3>
					<p className='max-w-sm text-sm text-zinc-500'>{error}</p>
				</div>
				<button onClick={() => fetchLeaderboard()} className='rounded-xl bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-95'>
					{isFrench ? 'Réessayer' : 'Try Again'}
				</button>
			</div>
		)
	}

	return (
		<>
			<style>{`
        @media (max-width: 767px) {
          body.lb-modal-open nav,
          body.lb-modal-open [class*="bottom-nav"],
          body.lb-modal-open div[class*="fixed"][class*="bottom-0"],
          body.lb-modal-open footer[class*="fixed"] {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(110%) !important;
            transition: transform .2s ease, opacity .2s ease !important;
          }
        }
      `}</style>

			<div className='mx-auto w-full max-w-5xl pb-28'>
				{/* Soft error banner */}
				{error && (
					<div className='mx-4 mb-4 flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-xs font-bold text-orange-600 sm:mx-0'>
						<AlertCircle className='h-4 w-4 shrink-0' />
						<span className='truncate'>{error}</span>
					</div>
				)}

				{/* Header */}
				<div className='flex flex-col gap-4 px-4 pt-4 sm:px-0 md:flex-row md:items-end md:justify-between'>
					<div className='space-y-2'>
						<div className='inline-flex w-fit items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 sm:text-[11px]'>
							<Trophy className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
							{isFrench ? 'Classement Voyageurs' : 'Traveler Standings'}
						</div>
						<h1 className='text-2xl font-black tracking-tight text-zinc-950 sm:text-4xl'>Leaderboard</h1>
						<p className='max-w-xl text-sm leading-6 text-zinc-500 sm:text-base'>{isFrench ? 'Gagnez des points en planifiant vos voyages et en rejoignant des groupes.' : 'Earn points by planning trips and joining groups.'}</p>
					</div>

					{/* Your rank card */}
					<div className='flex items-center justify-between gap-4 rounded-[24px] border border-orange-100 bg-orange-50/60 p-4 md:min-w-[280px]'>
						<div className='flex min-w-0 items-center gap-3'>
							<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20'>
								<Trophy className='h-5 w-5' />
							</div>
							<div className='min-w-0'>
								<p className='text-[10px] font-bold uppercase tracking-wider text-orange-600/70'>{isFrench ? 'Votre Rang' : 'Your Rank'}</p>
								<span className='block text-2xl font-black text-zinc-950'>{typeof user.rank === 'number' ? `#${user.rank}` : '#-'}</span>
							</div>
						</div>
						<div className='text-right'>
							<p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>XP</p>
							<p className='text-base font-black text-zinc-950'>{Number(user.xp || 0).toLocaleString()}</p>
						</div>
					</div>
				</div>

				{/* Filters row */}
				<div className='mt-4 flex flex-col gap-3 px-4 sm:px-0 lg:flex-row lg:items-center lg:gap-4'>
					<div className='flex-1'>
						<div className='flex gap-2 rounded-2xl bg-zinc-100 p-1'>
							{CATEGORIES.map((cat) => {
								const Icon = cat.icon
								const isActive = activeCategory === cat.id
								return (
									<button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition-all sm:text-sm ${isActive ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
										<Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-orange-500' : ''}`} />
										<span className='truncate'>{isFrench ? (cat.id === 'global' ? 'Global' : cat.id === 'friends' ? 'Amis' : 'Ville') : cat.label}</span>
									</button>
								)
							})}
						</div>
					</div>

					<div className='flex gap-3 lg:w-auto'>
						<div className='relative flex-1 lg:w-64'>
							<Search className='absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
							<input type='text' placeholder={isFrench ? 'Rechercher un voyageur...' : 'Search a traveler...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='h-12 w-full rounded-2xl border-none bg-zinc-100 pl-11 pr-4 text-sm font-medium text-zinc-900 placeholder-zinc-500 outline-none focus:ring-2 focus:ring-orange-500/20' />
						</div>
						<button onClick={() => fetchLeaderboard(true)} className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200' title={isFrench ? 'Actualiser' : 'Refresh'}>
							<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
						</button>
					</div>
				</div>

				{/* Leaderboard list */}
				<div className='mt-5 px-4 sm:px-0'>
					<div className='overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-sm sm:rounded-[32px]'>
						<div className='divide-y divide-zinc-100'>
							{filteredData.map((entry) => (
								<button
									key={entry.id}
									type='button'
									onClick={() => {
										setInviteSent(false)
										setSelectedUser(entry)
									}}
									className={`flex w-full items-center justify-between p-3 text-left transition-colors active:bg-zinc-100 sm:p-5 lg:p-6 ${entry.isCurrentUser ? 'bg-orange-50/60 ring-1 ring-inset ring-orange-100' : 'hover:bg-zinc-50/60'}`}>
									<div className='flex-1 w-full flex min-w-0 items-center space-x-3'>
										<RankBadge rank={entry.rank} />

										<div className='h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-2 ring-white shadow-sm sm:h-12 sm:w-12'>
											<img src={entry.avatarUrl} alt={entry.name} className='h-full w-full object-cover' loading='lazy' />
										</div>

										<div className='flex-1'>
											<div className='flex items-center'>
												<h3 className='truncate text-sm font-black text-zinc-950 sm:text-base max-w-30'>{entry.name}</h3>
												{entry.isCurrentUser && <span className='shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600'>{isFrench ? 'Vous' : 'You'}</span>}
											</div>
											<div className='mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold sm:text-xs'>
												<span className='truncate uppercase tracking-wider text-zinc-500'>{entry.label}</span>
												<span className='text-orange-600'>· LVL {entry.level}</span>
												<span className='text-zinc-400'>
													· {entry.groupsJoined} {isFrench ? 'groupes' : 'groups'}
												</span>
											</div>
										</div>
										<div className='shrink-0 text-right'>
											<p className='text-[10px] font-black uppercase tracking-widest text-zinc-400'>XP</p>
											<p className='text-sm font-black tabular-nums text-zinc-950 sm:text-base'>{entry.xp.toLocaleString()}</p>
										</div>
									</div>
								</button>
							))}

							{filteredData.length === 0 && (
								<div className='flex flex-col items-center justify-center py-16 text-center sm:py-24'>
									<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-50'>
										<Search className='h-7 w-7 text-zinc-300' />
									</div>
									<h3 className='text-base font-bold text-zinc-950 sm:text-lg'>{isFrench ? 'Aucun résultat' : 'No results found'}</h3>
									<p className='mt-1 px-6 text-xs text-zinc-500 sm:text-sm'>{isFrench ? 'Essayez avec un autre nom.' : 'Try searching for another name.'}</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Info cards */}
				<div className='mt-5 grid grid-cols-1 gap-4 px-4 sm:gap-6 sm:px-0 md:grid-cols-2'>
					<div className='overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-5 transition-all hover:border-orange-200 hover:shadow-lg sm:p-8'>
						<div className='space-y-4'>
							<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600'>
								<Flame className='h-6 w-6' />
							</div>
							<div>
								<h3 className='text-lg font-black text-zinc-950 sm:text-xl'>{isFrench ? 'Communauté Active' : 'Active Community'}</h3>
								<p className='mt-1 text-xs text-zinc-500 sm:text-sm'>{isFrench ? `${leaderboardData.length} voyageurs classés en direct.` : `${leaderboardData.length} travelers currently ranked live.`}</p>
							</div>
							<button className='flex items-center gap-1.5 text-xs font-bold text-orange-600 sm:text-sm'>
								{isFrench ? 'Voir le classement' : 'See leaderboard'}
								<ArrowUpRight className='h-4 w-4' />
							</button>
						</div>
					</div>

					<div className='overflow-hidden rounded-[24px] border border-zinc-200 bg-white p-5 transition-all hover:border-amber-200 hover:shadow-lg sm:p-8'>
						<div className='space-y-4'>
							<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600'>
								<Zap className='h-6 w-6' />
							</div>
							<div>
								<h3 className='text-lg font-black text-zinc-950 sm:text-xl'>{isFrench ? 'Classement Backend' : 'Backend Ranking'}</h3>
								<p className='mt-1 text-xs text-zinc-500 sm:text-sm'>{isFrench ? 'Basé sur les vrais XP, scores et groupes.' : 'Based on real XP, scores, and group activity.'}</p>
							</div>
							<button className='flex items-center gap-1.5 text-xs font-bold text-amber-600 sm:text-sm'>
								{isFrench ? 'Données en direct' : 'Live data'}
								<ArrowUpRight className='h-4 w-4' />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* User detail modal */}
			{selectedUser && (
				<div className='fixed inset-0 z-[100] bg-zinc-950/50 backdrop-blur-[6px]' onClick={() => setSelectedUser(null)}>
					<div className='flex h-full w-full items-end justify-center sm:items-center sm:p-4'>
						<div onClick={(e) => e.stopPropagation()} className='relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[30px] bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-[440px] sm:rounded-[32px]'>
							<div className='flex justify-center pt-3 sm:hidden'>
								<div className='h-1.5 w-12 rounded-full bg-zinc-200' />
							</div>

							<button onClick={() => setSelectedUser(null)} className='absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200'>
								<X className='h-4 w-4 stroke-[2.5px]' />
							</button>

							<div className='overflow-y-auto px-5 pb-8 pt-5 sm:px-8 sm:pb-8 sm:pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
								<div className='mb-5 flex flex-col items-center text-center'>
									<div className='mb-4 h-24 w-24 overflow-hidden rounded-[28px] bg-zinc-100 ring-4 ring-white shadow-xl sm:h-28 sm:w-28'>
										<img src={selectedUser.avatarUrl} alt={selectedUser.name} className='h-full w-full object-cover' />
									</div>
									<h2 className='text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl'>{selectedUser.name}</h2>
									<p className='mt-1 text-xs font-bold uppercase tracking-[0.22em] text-orange-600 sm:text-sm'>{selectedUser.label}</p>
									{selectedUser.isCurrentUser && (
										<div className='mt-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-600'>
											<Compass className='h-3.5 w-3.5' />
											{isFrench ? 'Votre profil' : 'Your profile'}
										</div>
									)}
								</div>

								<div className='grid grid-cols-2 gap-3'>
									<div className='rounded-[18px] bg-zinc-50 p-4'>
										<p className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>{isFrench ? 'Rang' : 'Rank'}</p>
										<p className='mt-1 text-xl font-black text-zinc-950'>#{selectedUser.rank}</p>
									</div>
									<div className='rounded-[18px] bg-zinc-50 p-4'>
										<p className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>{isFrench ? 'Niveau' : 'Level'}</p>
										<p className='mt-1 text-xl font-black text-zinc-950'>{selectedUser.level}</p>
									</div>
									<div className='rounded-[18px] bg-zinc-50 p-4'>
										<p className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>XP</p>
										<p className='mt-1 text-xl font-black text-zinc-950'>{selectedUser.xp.toLocaleString()}</p>
									</div>
									<div className='rounded-[18px] bg-zinc-50 p-4'>
										<p className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>Score</p>
										<p className='mt-1 text-xl font-black text-zinc-950'>{selectedUser.score.toLocaleString()}</p>
									</div>
								</div>

								<div className='mt-4 grid grid-cols-1 gap-3'>
									<div className='rounded-[18px] border border-zinc-200 bg-white p-4'>
										<div className='flex items-center gap-3'>
											<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600'>
												<FolderKanban className='h-5 w-5' />
											</div>
											<div>
												<p className='text-xs font-bold uppercase tracking-wider text-zinc-400'>{isFrench ? 'Groupes créés' : 'Groups created'}</p>
												<p className='text-lg font-black text-zinc-950'>{selectedUser.groupsCreated}</p>
											</div>
										</div>
									</div>

									<div className='rounded-[18px] border border-zinc-200 bg-white p-4'>
										<div className='flex items-center gap-3'>
											<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600'>
												<UserPlus className='h-5 w-5' />
											</div>
											<div>
												<p className='text-xs font-bold uppercase tracking-wider text-zinc-400'>{isFrench ? 'Groupes rejoints' : 'Groups joined'}</p>
												<p className='text-lg font-black text-zinc-950'>{selectedUser.groupsJoined}</p>
											</div>
										</div>
									</div>

									<div className='rounded-[18px] border border-zinc-200 bg-white p-4'>
										<div className='flex items-center gap-3'>
											<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600'>
												<MapPin className='h-5 w-5' />
											</div>
											<div>
												<p className='text-xs font-bold uppercase tracking-wider text-zinc-400'>{isFrench ? 'Statut' : 'Status'}</p>
												<div className='mt-1 flex items-center gap-2 text-sm font-bold text-zinc-950'>
													<span className='h-2.5 w-2.5 rounded-full bg-green-500' />
													{isFrench ? 'Actif sur Trippple' : 'Active on Trippple'}
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className={`mt-5 grid gap-3 ${!selectedUser.isCurrentUser ? 'grid-cols-2' : 'grid-cols-1'}`}>
									{!selectedUser.isCurrentUser && (
										<button onClick={() => handleInviteFriend(selectedUser)} disabled={inviteLoading || inviteSent} className={`flex w-full items-center justify-center gap-2 rounded-[18px] px-4 py-4 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-[0.98] disabled:opacity-70 sm:text-sm ${inviteSent ? 'bg-green-500' : 'bg-orange-500 hover:bg-orange-600'}`}>
											{inviteLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Bell className='h-4 w-4' />}
											{inviteSent ? (isFrench ? 'Envoyée !' : 'Sent!') : isFrench ? 'Inviter' : 'Invite'}
										</button>
									)}

									<button onClick={() => setSelectedUser(null)} className='w-full rounded-[18px] bg-zinc-950 py-4 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-[0.98] sm:text-sm'>
										{isFrench ? 'Fermer' : 'Close'}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
