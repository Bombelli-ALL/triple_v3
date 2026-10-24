import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
	ArrowLeft,
	Crown,
	Image as ImageIcon,
	MapPin,
	RefreshCw,
	Search,
	Send,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
	getPublicGroup,
	listGroupMessages,
	sendGroupMessage,
	type GroupMembershipRole,
} from '@/lib/travelApi'

type Role = 'owner' | 'admin' | 'member'

interface Member {
	id: string
	name: string
	avatar: string
	role: Role
	bio?: string
	city?: string
}

interface Group {
	id: string
	name: string
	destination: string
	image: string
	dates: string
	description: string
	members: Member[]
	maxMembers: number
	interests: string[]
	adminId: string
}

interface ChatMessage {
	id: string
	senderId: string
	senderName?: string
	text: string
	time: string
}

const fallbackCurrentUser: Omit<Member, 'id'> = {
	name: 'Demo Traveler',
	avatar: 'https://i.pravatar.cc/150?u=demo-traveler',
	role: 'member',
	bio: 'Travel lover, café hunter, and weekend explorer.',
	city: 'Rabat',
}

const normalizeValue = (value?: string | null) => String(value ?? '').trim().toLowerCase()

export default function GroupChatPage() {
	const navigate = useNavigate()
	const location = useLocation()
	const { id } = useParams()
	const { user } = useAuthStore()
	const messagesEndRef = useRef<HTMLDivElement | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)

	const locationState = location.state as
		| {
				group?: Group
		  }
		| undefined

	const [group, setGroup] = useState<Group | null>(locationState?.group ?? null)

	const currentUser: Member = {
		id: String(user?.id ?? ''),
		name: user?.name ?? fallbackCurrentUser.name,
		avatar: (user as { avatar?: string | null } | null)?.avatar || fallbackCurrentUser.avatar,
		role: 'member',
		bio: fallbackCurrentUser.bio,
		city: fallbackCurrentUser.city,
	}

	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [input, setInput] = useState('')
	const [memberSearch, setMemberSearch] = useState('')
	const [selectedMember, setSelectedMember] = useState<Member | null>(null)
	const [chatNotice, setChatNotice] = useState<string | null>(null)
	const [isSending, setIsSending] = useState(false)
	const [isLoadingChat, setIsLoadingChat] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)

	const resolvedCurrentMember = useMemo(() => {
		if (!group) return currentUser

		const byId = group.members.find(
			(member) =>
				normalizeValue(member.id) &&
				normalizeValue(member.id) === normalizeValue(currentUser.id),
		)
		if (byId) return byId

		const byName = group.members.find(
			(member) =>
				normalizeValue(member.name) &&
				normalizeValue(member.name) === normalizeValue(currentUser.name),
		)
		if (byName) return byName

		return currentUser
	}, [group, currentUser])

	const membersWithMe = useMemo(() => {
		if (!group) return currentUser.id ? [currentUser] : []

		const exists = group.members.some(
			(member) =>
				(normalizeValue(member.id) &&
					normalizeValue(member.id) === normalizeValue(currentUser.id)) ||
				(normalizeValue(member.name) &&
					normalizeValue(member.name) === normalizeValue(currentUser.name)),
		)

		if (exists) return group.members
		return currentUser.id ? [...group.members, currentUser] : group.members
	}, [group, currentUser])

	const filteredMembers = useMemo(() => {
		const q = memberSearch.trim().toLowerCase()
		if (!q) return membersWithMe

		return membersWithMe.filter((member) =>
			[member.name, member.city, member.bio].join(' ').toLowerCase().includes(q),
		)
	}, [memberSearch, membersWithMe])

	const getMemberByMessage = (message: ChatMessage) => {
		return (
			membersWithMe.find(
				(member) =>
					(normalizeValue(member.id) &&
						normalizeValue(member.id) === normalizeValue(message.senderId)) ||
					(normalizeValue(member.name) &&
						normalizeValue(member.name) === normalizeValue(message.senderName)),
			) ?? resolvedCurrentMember
		)
	}

	const isOwnMessage = (message: ChatMessage) => {
		const senderId = normalizeValue(message.senderId)
		const senderName = normalizeValue(message.senderName)
		const authId = normalizeValue(currentUser.id)
		const authName = normalizeValue(currentUser.name)
		const resolvedId = normalizeValue(resolvedCurrentMember.id)
		const resolvedName = normalizeValue(resolvedCurrentMember.name)

		return Boolean(
			(senderId && authId && senderId === authId) ||
				(senderId && resolvedId && senderId === resolvedId) ||
				(senderName && authName && senderName === authName) ||
				(senderName && resolvedName && senderName === resolvedName),
		)
	}

	const admin =
		membersWithMe.find((member) => member.role === 'owner') ??
		membersWithMe.find((member) => member.role === 'admin')

	const isAdmin =
		['owner', 'admin'].includes(resolvedCurrentMember.role) ||
		normalizeValue(currentUser.id) === normalizeValue(group?.adminId)

	const fetchChatData = useCallback(
		async (showLoader = false) => {
			if (!id) return

			if (showLoader) {
				setIsLoadingChat(true)
			} else {
				setIsRefreshing(true)
			}

			try {
				const [groupRes, messagesRes] = await Promise.all([
					getPublicGroup(id),
					listGroupMessages(id),
				])
				const detail = groupRes.data

				const mapRole = (role: GroupMembershipRole): Role => {
					if (role === 'OWNER') return 'owner'
					if (role === 'ADMIN') return 'admin'
					return 'member'
				}

				const members: Member[] =
					detail.members.length > 0
						? detail.members.map((member) => ({
								id: String(member.id),
								name: member.name,
								avatar: member.avatarUrl || `https://i.pravatar.cc/150?u=${member.id}`,
								role: mapRole(member.role),
								city: detail.city.name,
								bio:
									typeof member.preferences === 'string'
										? member.preferences
										: 'Trippple traveler',
						  }))
						: [
								{
									id: `${detail.id}-host`,
									name: `${detail.city.name} Host`,
									avatar: `https://i.pravatar.cc/150?u=${detail.id}-host`,
									role: 'owner',
									city: detail.city.name,
									bio: `Trip coordinator for ${detail.city.name}.`,
								},
						  ]

				setGroup({
					id: String(detail.id),
					name: locationState?.group?.name ?? `${detail.city.name} travel circle`,
					destination: detail.city.name,
					image:
						locationState?.group?.image ||
						'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
					dates: `${new Date(detail.startDate).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
					})} - ${new Date(detail.endDate).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					})}`,
					description:
						locationState?.group?.description ?? `Live chat for ${detail.city.name} travelers.`,
					members,
					maxMembers: detail.capacity,
					interests: locationState?.group?.interests ?? ['Travel', detail.city.name],
					adminId: String(
						members.find((member) => member.role === 'owner')?.id ??
							members.find((member) => member.role === 'admin')?.id ??
							`${detail.id}-host`,
					),
				})

				setMessages(
					messagesRes.data.messages.map((message) => ({
						id: String(message.id),
						senderId: String(message.user.id),
						senderName: message.user.name,
						text: message.message,
						time: new Date(message.createdAt).toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						}),
					})),
				)

				setChatNotice(null)
			} catch {
				setChatNotice('Could not load the live group chat.')
			} finally {
				setIsLoadingChat(false)
				setIsRefreshing(false)
			}
		},
		[id, locationState?.group],
	)

	useEffect(() => {
		void fetchChatData(true)
	}, [fetchChatData])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
	}, [messages])

	useEffect(() => {
		const previousHtmlOverflow = document.documentElement.style.overflow
		const previousBodyOverflow = document.body.style.overflow

		document.documentElement.style.overflow = 'hidden'
		document.body.style.overflow = 'hidden'

		return () => {
			document.documentElement.style.overflow = previousHtmlOverflow
			document.body.style.overflow = previousBodyOverflow
		}
	}, [])

	useEffect(() => {
		document.body.setAttribute('data-hide-bottom-nav', 'true')

		const possibleSelectors = [
			'[data-mobile-bottom-nav="true"]',
			'[data-bottom-nav="true"]',
			'#mobile-bottom-nav',
			'.mobile-bottom-nav',
		]

		const hiddenElements = possibleSelectors
			.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))
			.filter((el, index, arr) => arr.indexOf(el) === index)

		const previousStyles = hiddenElements.map((el) => ({
			el,
			display: el.style.display,
			visibility: el.style.visibility,
			pointerEvents: el.style.pointerEvents,
		}))

		hiddenElements.forEach((el) => {
			el.style.display = 'none'
			el.style.visibility = 'hidden'
			el.style.pointerEvents = 'none'
		})

		return () => {
			document.body.removeAttribute('data-hide-bottom-nav')
			previousStyles.forEach(({ el, display, visibility, pointerEvents }) => {
				el.style.display = display
				el.style.visibility = visibility
				el.style.pointerEvents = pointerEvents
			})
		}
	}, [])

	const autoResizeTextarea = () => {
		const el = textareaRef.current
		if (!el) return
		el.style.height = '0px'
		el.style.height = `${Math.min(el.scrollHeight, 84)}px`
	}

	useEffect(() => {
		autoResizeTextarea()
	}, [input])

	const refreshConversation = async () => {
		if (isRefreshing || isLoadingChat) return
		await fetchChatData(false)
	}

	const sendMessage = async () => {
		const text = input.trim()
		if (!text || !id || isSending) return

		setIsSending(true)
		try {
			const { data } = await sendGroupMessage(id, text)
			setMessages((prev) => [
				...prev,
				{
					id: String(data.id),
					senderId: String(data.user.id),
					senderName: data.user.name ?? currentUser.name,
					text: data.message,
					time: new Date(data.createdAt).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					}),
				},
			])
			setInput('')
			setChatNotice(null)
		} catch {
			setChatNotice('Could not send the message. Try again.')
		} finally {
			setIsSending(false)
		}
	}

	const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			void sendMessage()
		}
	}

	const goBackToGroupPage = () => {
		if (window.history.length > 1) {
			navigate(-1)
			return
		}
		navigate('/user/groups')
	}

	if (isLoadingChat || !group) {
		return (
			<div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-112px)] items-center justify-center rounded-[22px] border border-zinc-200 bg-white text-sm text-zinc-500">
				Loading group chat...
			</div>
		)
	}

	return (
		<div className="h-[calc(100vh-140px)] md:h-[calc(100vh-112px)] overflow-hidden pt-0 md:pt-1 pb-12 md:pb-3">
			<div className="flex h-full min-h-0 flex-col overflow-hidden">
				<div className="grid h-full min-h-0 grid-cols-1 gap-2 md:gap-3 overflow-hidden pb-1 md:pb-2 xl:grid-cols-[minmax(0,1fr)_250px]">
					<section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] md:rounded-[22px] border border-zinc-200 bg-white shadow-sm">
						<div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-3 md:px-4 py-2.5 md:py-3">
							<div className="flex min-w-0 items-center gap-2.5 md:gap-3">
								<button
									onClick={goBackToGroupPage}
									className="flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-xl md:rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
									aria-label="Back to group page"
								>
									<ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
								</button>

								<img
									src={group.image}
									alt={group.name}
									className="h-8 w-8 md:h-10 md:w-10 shrink-0 rounded-xl md:rounded-2xl object-cover"
								/>

								<div className="min-w-0">
									<h1 className="truncate text-[13px] md:text-[15px] font-bold text-zinc-950">
										{group.name}
									</h1>

									<div className="mt-0.5 md:mt-1 flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-[10px] md:text-[11px] text-zinc-500">
										<span className="inline-flex items-center gap-1">
											<MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-orange-500" />
											{group.destination}
										</span>
										<span>{group.dates}</span>
										<span>{membersWithMe.length} members</span>
									</div>
								</div>
							</div>

							<div className="flex shrink-0 items-center gap-2">
								<button
									onClick={() => void refreshConversation()}
									disabled={isRefreshing || isLoadingChat}
									className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl md:rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
									aria-label="Refresh conversation"
									title="Refresh conversation"
								>
									<RefreshCw
										className={`h-3.5 w-3.5 md:h-3 md:w-3 ${
											isRefreshing ? 'animate-spin' : ''
										}`}
									/>
								</button>

								<div className="hidden shrink-0 items-center gap-2 xl:flex">
									<button className="rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50">
										Group info
									</button>

									<button
										disabled={!isAdmin}
										className={`rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition ${
											isAdmin
												? 'bg-orange-500 text-white hover:bg-orange-600'
												: 'cursor-not-allowed border border-zinc-200 bg-zinc-50 text-zinc-400'
										}`}
									>
										{isAdmin ? 'Invite people' : 'Only admin can invite'}
									</button>
								</div>
							</div>
						</div>

						<div className="min-h-0 flex-1 overflow-hidden bg-[#fcfcfd]">
							<div className="flex h-full min-h-0 flex-col">
								{chatNotice && (
									<div className="border-b border-zinc-100 bg-orange-50 px-3 md:px-4 py-2 text-[10px] md:text-[11px] text-orange-700">
										{chatNotice}
									</div>
								)}

								<div className="min-h-0 flex-1 overflow-y-auto px-3 md:px-4 py-2 md:py-3">
									<div className="mx-auto flex w-full max-w-[860px] flex-col gap-2.5 md:gap-3">
										{messages.map((message) => {
											const sender = getMemberByMessage(message)
											const isMine = isOwnMessage(message)

											return (
												<div
													key={message.id}
													className={`flex items-end gap-2 ${
														isMine ? 'justify-end' : 'justify-start'
													}`}
												>
													{!isMine && (
														<button
															onClick={() => setSelectedMember(sender)}
															className="shrink-0"
														>
															<img
																src={sender.avatar}
																alt={sender.name}
																className="h-6 w-6 md:h-7 md:w-7 rounded-full object-cover ring-1 ring-zinc-200"
															/>
														</button>
													)}

													<div
														className={`max-w-[76%] md:max-w-[68%] rounded-[16px] md:rounded-[18px] px-3 py-2 shadow-sm ${
															isMine
																? 'rounded-br-md bg-orange-500 text-white'
																: 'rounded-bl-md border border-zinc-200 bg-white text-zinc-900'
														}`}
													>
														{!isMine && (
															<div className="mb-1 flex items-center gap-2">
																<button
																	onClick={() => setSelectedMember(sender)}
																	className="text-left text-[10px] md:text-[11px] font-semibold text-zinc-900 transition hover:text-orange-600"
																>
																	{sender.name}
																</button>

																{sender.role !== 'member' && (
																	<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-1.5 py-0.5 text-[8px] font-semibold text-orange-700">
																		<Crown className="h-2.5 w-2.5" />
																		{sender.role === 'owner' ? 'Owner' : 'Admin'}
																	</span>
																)}
															</div>
														)}

														<p className="whitespace-pre-wrap break-words text-[11px] md:text-[12px] leading-5">
															{message.text}
														</p>

														<p
															className={`mt-1 text-[8px] md:text-[9px] ${
																isMine ? 'text-white/75' : 'text-zinc-400'
															}`}
														>
															{message.time}
														</p>
													</div>

													{isMine && (
														<button
															onClick={() => setSelectedMember(resolvedCurrentMember)}
															className="shrink-0"
														>
															<img
																src={resolvedCurrentMember.avatar}
																alt={resolvedCurrentMember.name}
																className="h-6 w-6 md:h-7 md:w-7 rounded-full object-cover ring-1 ring-zinc-200"
															/>
														</button>
													)}
												</div>
											)
										})}

										<div ref={messagesEndRef} />
									</div>
								</div>

								<div className="shrink-0 border-t border-zinc-100 bg-white px-3 md:px-4 py-2">
									<div className="mx-auto flex w-full max-w-[860px] items-end gap-2 rounded-[18px] md:rounded-[20px] border border-zinc-200 bg-white px-3 py-2 shadow-sm">
										<button className="flex h-8 w-8 md:h-8.5 md:w-8.5 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100">
											<ImageIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
										</button>

										<textarea
											ref={textareaRef}
											value={input}
											onChange={(e) => setInput(e.target.value)}
											onKeyDown={onKeyDown}
											rows={1}
											placeholder="Write a message..."
											className="max-h-[84px] min-h-[30px] md:min-h-[32px] flex-1 resize-none bg-transparent py-1 text-[11px] md:text-[12px] text-zinc-900 outline-none placeholder:text-zinc-400"
										/>

										<button
											onClick={() => void sendMessage()}
											disabled={isSending}
											className="flex h-8 w-8 md:h-8.5 md:w-8.5 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
										>
											<Send className="h-3.5 w-3.5" />
										</button>
									</div>
								</div>
							</div>
						</div>
					</section>

					<aside className="hidden h-full min-h-0 overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-sm xl:flex xl:flex-col">
						<div className="shrink-0 border-b border-zinc-100 px-4 py-4">
							<h2 className="text-[15px] font-bold text-zinc-950">Members</h2>
							<p className="mt-1 text-[11px] text-zinc-500">
								Group members and profile access.
							</p>

							<div className="relative mt-3">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
								<input
									value={memberSearch}
									onChange={(e) => setMemberSearch(e.target.value)}
									placeholder="Search members..."
									className="h-9 w-full rounded-2xl border border-zinc-200 bg-white pl-9 pr-3 text-[11px] text-zinc-900 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
								/>
							</div>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
							<div className="space-y-1">
								{filteredMembers.map((member) => {
									const isSelected = selectedMember?.id === member.id
									const isMe =
										(normalizeValue(member.id) &&
											normalizeValue(member.id) === normalizeValue(resolvedCurrentMember.id)) ||
										(normalizeValue(member.name) &&
											normalizeValue(member.name) === normalizeValue(resolvedCurrentMember.name))

									return (
										<button
											key={member.id}
											onClick={() => setSelectedMember(member)}
											className={`flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left transition ${
												isSelected ? 'bg-orange-50' : 'hover:bg-zinc-50'
											}`}
										>
											<img
												src={member.avatar}
												alt={member.name}
												className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-200"
											/>

											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-1.5">
													<p className="truncate text-[12px] font-semibold text-zinc-900">
														{member.name}
													</p>

													{member.role !== 'member' && (
														<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-1.5 py-0.5 text-[8px] font-semibold text-orange-700">
															<Crown className="h-2.5 w-2.5" />
															{member.role === 'owner' ? 'Owner' : 'Admin'}
														</span>
													)}

													{isMe && (
														<span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-semibold text-zinc-600">
															You
														</span>
													)}
												</div>

												<p className="mt-0.5 truncate text-[10px] text-zinc-500">
													{member.city ?? 'Morocco'}
												</p>
											</div>
										</button>
									)
								})}
							</div>
						</div>

						<div className="shrink-0 border-t border-zinc-100 px-3 py-3">
							<div className="rounded-2xl bg-zinc-50 p-3">
								<p className="text-[11px] font-semibold text-zinc-900">Group admin</p>
								<p className="mt-1 text-[11px] leading-5 text-zinc-500">
									{admin?.name ?? 'Group owner'} manages access and member approvals.
								</p>
							</div>

							<Link
								to="/user/groups"
								className="mt-2.5 flex h-9 items-center justify-center gap-2 rounded-2xl bg-orange-500 text-[11px] font-semibold text-white transition hover:bg-orange-600"
							>
								<ArrowLeft className="h-3.5 w-3.5" />
								Back to groups
							</Link>
						</div>
					</aside>
				</div>
			</div>

			{selectedMember && (
				<div
					className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5"
					onClick={() => setSelectedMember(null)}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="w-full rounded-t-[22px] bg-white p-4 shadow-2xl sm:max-w-sm sm:rounded-[22px]"
					>
						<div className="flex items-start gap-3">
							<img
								src={selectedMember.avatar}
								alt={selectedMember.name}
								className="h-12 w-12 rounded-full object-cover"
							/>

							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-center gap-2">
									<h3 className="text-[15px] font-bold text-zinc-950">
										{selectedMember.name}
									</h3>

									{selectedMember.role !== 'member' && (
										<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[9px] font-semibold text-orange-700">
											<Crown className="h-3 w-3" />
											{selectedMember.role === 'owner' ? 'Owner' : 'Admin'}
										</span>
									)}
								</div>

								<p className="mt-1 text-[12px] text-zinc-500">{selectedMember.city}</p>
							</div>
						</div>

						<div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
							<p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
								Bio
							</p>
							<p className="mt-2 text-[12px] leading-5 text-zinc-600">
								{selectedMember.bio ?? 'Traveler profile.'}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}