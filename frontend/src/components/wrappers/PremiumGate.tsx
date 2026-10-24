import { Link, Outlet, useLocation } from 'react-router-dom'
import { Check, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { PREMIUM_FEATURES, canUsePremium, premiumFeatureFor } from '@/lib/plan'

/** Shows the page for Premium users and admins, and an upgrade screen for everyone else */
export default function PremiumGate() {
	const { user } = useAuthStore()
	const location = useLocation()
	const feature = premiumFeatureFor(location.pathname)

	if (!feature || canUsePremium(user)) return <Outlet />

	return (
		<div className='mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center py-8'>
			<div className='rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8'>
				<span className='flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white'>
					<Lock className='h-5 w-5' />
				</span>
				<p className='mt-5 text-sm font-medium text-orange-600'>Premium</p>
				<h1 className='mt-1 text-2xl font-semibold tracking-tight text-zinc-900'>{feature.name}</h1>
				<p className='mt-2 text-[15px] leading-6 text-zinc-600'>{feature.description}</p>

				<div className='mt-6 border-t border-zinc-100 pt-5'>
					<p className='text-sm font-medium text-zinc-900'>Premium also unlocks</p>
					<ul className='mt-3 space-y-2'>
						{Object.entries(PREMIUM_FEATURES)
							.filter(([path]) => path !== feature.path)
							.map(([path, entry]) => (
								<li key={path} className='flex items-center gap-2 text-sm text-zinc-600'>
									<Check className='h-4 w-4 shrink-0 text-orange-500' />
									{entry.name}
								</li>
							))}
					</ul>
				</div>

				<div className='mt-7 flex flex-col gap-2 sm:flex-row'>
					<Link to='/pricing' className='flex h-11 items-center justify-center rounded-xl bg-orange-500 sm:flex-1 text-sm font-semibold text-white transition hover:bg-orange-600'>
						Unlock with an invite code
					</Link>
					<Link to='/user/dashboard' className='flex h-11 items-center justify-center rounded-xl border border-zinc-200 sm:flex-1 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50'>
						Back to dashboard
					</Link>
				</div>
			</div>
		</div>
	)
}
