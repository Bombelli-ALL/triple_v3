import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Check, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { apiErrorMessage, formatPlanEnd, getMyPlan, redeemCode, type PlanInfo } from '@/lib/plan'

// Keep in sync with PREMIUM_FEATURES in lib/plan.ts (what the app actually locks)
const FREE_FEATURES = ['Your trip dashboard and budget', 'Day-by-day itineraries for any Moroccan city', 'Live map with real places and photos', 'Match local spots', 'Travel assistant chat']
const PREMIUM_FEATURES = ['Everything in Free', 'Travel groups and group chat', 'Leaderboard', 'Transport: trains and flights', 'Trip planner', '360° view', 'Premium badge on your profile']

function FeatureList({ items, dark }: { items: string[]; dark?: boolean }) {
	return (
		<ul className='mt-6 space-y-3'>
			{items.map((item) => (
				<li key={item} className={`flex items-start gap-2.5 text-sm ${dark ? 'text-zinc-300' : 'text-zinc-600'}`}>
					<Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? 'text-orange-400' : 'text-orange-500'}`} />
					{item}
				</li>
			))}
		</ul>
	)
}

function CurrentTag({ dark }: { dark?: boolean }) {
	return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${dark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-700'}`}>Your plan</span>
}

/** Free vs Premium, aware of the signed-in user's real plan */
export default function PlanCards() {
	const { user, token, setUser } = useAuthStore()
	const navigate = useNavigate()
	const [plan, setPlan] = useState<PlanInfo | null>(null)
	const [loadingPlan, setLoadingPlan] = useState(false)
	const [code, setCode] = useState('')
	const [codeError, setCodeError] = useState('')
	const [redeeming, setRedeeming] = useState(false)

	useEffect(() => {
		if (!user) {
			setPlan(null)
			return
		}
		let cancelled = false
		setLoadingPlan(true)
		getMyPlan(token)
			.then(({ data }) => !cancelled && setPlan(data))
			.catch(() => !cancelled && setPlan(null))
			.finally(() => !cancelled && setLoadingPlan(false))
		return () => {
			cancelled = true
		}
	}, [user, token])

	const submitCode = async (event: React.FormEvent) => {
		event.preventDefault()
		const trimmed = code.trim()
		if (!trimmed || redeeming) return
		if (!user) {
			navigate(`/register?ref=${encodeURIComponent(trimmed)}`)
			return
		}
		try {
			setRedeeming(true)
			setCodeError('')
			const { data } = await redeemCode(trimmed, token)
			setPlan(data)
			if (user) setUser({ ...user, plan: data.plan, premiumUntil: data.premiumUntil })
			setCode('')
			toast.success('Premium is active. Enjoy!')
		} catch (error) {
			setCodeError(apiErrorMessage(error, 'This code is not valid.'))
		} finally {
			setRedeeming(false)
		}
	}

	const isPremium = Boolean(plan?.isPremium)
	const isFree = Boolean(user && plan && !plan.isPremium)
	const premiumEnd = plan ? formatPlanEnd(plan) : null

	return (
		<div className='mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-2'>
			{/* Free */}
			<article className='flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8'>
				<div className='flex items-center justify-between gap-3'>
					<h3 className='text-lg font-semibold text-zinc-900'>Free</h3>
					{isFree && <CurrentTag />}
				</div>
				<p className='mt-1 text-sm text-zinc-500'>Everything you need to plan a trip.</p>
				<p className='mt-6 text-4xl font-semibold tracking-tight text-zinc-900'>
					0 DH<span className='text-base font-normal text-zinc-500'> forever</span>
				</p>
				<FeatureList items={FREE_FEATURES} />
				<div className='mt-auto pt-8'>
					{!user ? (
						<Link to='/register' className='flex h-11 items-center justify-center rounded-xl border border-zinc-900 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white'>
							Sign up free
						</Link>
					) : (
						<p className='flex h-11 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-500'>{isPremium ? 'Included in Premium' : 'You are on this plan'}</p>
					)}
				</div>
			</article>

			{/* Premium */}
			<article className='flex flex-col rounded-2xl bg-zinc-950 p-6 text-white sm:p-8'>
				<div className='flex items-center justify-between gap-3'>
					<h3 className='text-lg font-semibold'>Premium</h3>
					{isPremium ? <CurrentTag dark /> : <span className='rounded-full bg-orange-500 px-2.5 py-1 text-xs font-medium text-white'>By invitation</span>}
				</div>
				<p className='mt-1 text-sm text-zinc-400'>For travelers who want a little more.</p>
				<p className='mt-6 text-4xl font-semibold tracking-tight'>
					1 month<span className='text-base font-normal text-zinc-400'> with an invite code</span>
				</p>
				<FeatureList items={PREMIUM_FEATURES} dark />

				<div className='mt-auto pt-8'>
					{loadingPlan ? (
						<div className='flex h-11 items-center justify-center text-zinc-400'>
							<Loader2 className='h-4 w-4 animate-spin' />
						</div>
					) : isPremium ? (
						<div className='rounded-xl bg-white/5 px-4 py-3 text-sm'>
							<p className='font-medium'>Premium is active</p>
							<p className='mt-0.5 text-zinc-400'>
								{premiumEnd === 'No end date' ? 'No end date' : `Until ${premiumEnd}`}
								{plan?.daysLeft != null && ` · ${plan.daysLeft} ${plan.daysLeft === 1 ? 'day' : 'days'} left`}
							</p>
						</div>
					) : (
						<form onSubmit={submitCode}>
							{plan?.expired && <p className='mb-3 text-sm text-zinc-400'>Your Premium has ended. Use a new code to continue.</p>}
							<label htmlFor='plan-invite-code' className='text-sm text-zinc-300'>
								Invite code
							</label>
							<div className='mt-2 flex gap-2'>
								<input
									id='plan-invite-code'
									value={code}
									onChange={(event) => {
										setCode(event.target.value)
										setCodeError('')
									}}
									placeholder='TRIP-XXXX-XXXX'
									autoComplete='off'
									className='h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm uppercase tracking-wider text-white outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 focus:border-orange-400'
								/>
								<button type='submit' disabled={!code.trim() || redeeming} className='inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50'>
									{redeeming && <Loader2 className='h-4 w-4 animate-spin' />}
									{user ? 'Activate' : 'Continue'}
								</button>
							</div>
							{codeError ? <p className='mt-2 text-sm text-red-400'>{codeError}</p> : <p className='mt-2 text-xs text-zinc-500'>No code? Ask the Trippple team for one.</p>}
						</form>
					)}
				</div>
			</article>
		</div>
	)
}
