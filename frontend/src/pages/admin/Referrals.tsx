import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Copy, Loader2, Trash2 } from 'lucide-react'
import {
	apiErrorMessage,
	createReferralCode,
	deleteReferralCode,
	listReferralCodes,
	referralLink,
	setReferralCodeActive,
	type ReferralCode,
} from '@/lib/plan'
import { PageHeader, Panel } from './adminUi'
import { formatDate, relativeTime } from './adminFormat'

function codeState(code: ReferralCode) {
	if (!code.active) return { label: 'Paused', className: 'bg-zinc-100 text-zinc-500' }
	if (code.expiresAt && new Date(code.expiresAt) <= new Date()) return { label: 'Expired', className: 'bg-zinc-100 text-zinc-500' }
	if (code.maxUses != null && code.usedCount >= code.maxUses) return { label: 'Used up', className: 'bg-zinc-100 text-zinc-500' }
	return { label: 'Active', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
}

function CopyButton({ value, label }: { value: string; label: string }) {
	const [copied, setCopied] = useState(false)
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {
			toast.error('Could not copy. Select the text and copy it manually.')
		}
	}
	return (
		<button type='button' onClick={() => void copy()} className='inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50'>
			{copied ? <Check className='h-3.5 w-3.5 text-emerald-600' /> : <Copy className='h-3.5 w-3.5' />}
			{copied ? 'Copied' : label}
		</button>
	)
}

function CreateCodeForm({ onCreated }: { onCreated: (code: ReferralCode) => void }) {
	const [label, setLabel] = useState('')
	const [premiumDays, setPremiumDays] = useState(30)
	const [maxUses, setMaxUses] = useState('')
	const [expiresAt, setExpiresAt] = useState('')
	const [customCode, setCustomCode] = useState('')
	const [saving, setSaving] = useState(false)

	const submit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (saving) return
		try {
			setSaving(true)
			const { data } = await createReferralCode({
				label: label.trim() || undefined,
				premiumDays,
				maxUses: maxUses.trim() ? Number(maxUses) : null,
				expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
				code: customCode.trim() || undefined,
			})
			onCreated(data)
			setLabel('')
			setMaxUses('')
			setExpiresAt('')
			setCustomCode('')
			toast.success(`Code ${data.code} created`)
		} catch (error) {
			toast.error(apiErrorMessage(error, 'Could not create the code.'))
		} finally {
			setSaving(false)
		}
	}

	const input = 'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-900'

	return (
		<Panel title='New invite code'>
			<form onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
				<label className='block sm:col-span-2'>
					<span className='text-sm text-zinc-700'>Name (only you see it)</span>
					<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder='e.g. Instagram giveaway' maxLength={80} className={`mt-1.5 ${input}`} />
				</label>
				<label className='block'>
					<span className='text-sm text-zinc-700'>Premium length</span>
					<select value={premiumDays} onChange={(event) => setPremiumDays(Number(event.target.value))} className={`mt-1.5 ${input}`}>
						<option value={7}>1 week</option>
						<option value={30}>1 month</option>
						<option value={90}>3 months</option>
						<option value={365}>1 year</option>
					</select>
				</label>
				<label className='block'>
					<span className='text-sm text-zinc-700'>How many people can use it</span>
					<input type='number' min={1} value={maxUses} onChange={(event) => setMaxUses(event.target.value)} placeholder='No limit' className={`mt-1.5 ${input}`} />
				</label>
				<label className='block'>
					<span className='text-sm text-zinc-700'>Stops working after</span>
					<input type='date' value={expiresAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setExpiresAt(event.target.value)} className={`mt-1.5 ${input}`} />
				</label>
				<label className='block'>
					<span className='text-sm text-zinc-700'>Custom code</span>
					<input value={customCode} onChange={(event) => setCustomCode(event.target.value.toUpperCase())} placeholder='Leave empty for a random one' maxLength={32} className={`mt-1.5 uppercase placeholder:normal-case ${input}`} />
				</label>
				<div className='sm:col-span-2'>
					<button type='submit' disabled={saving} className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50'>
						{saving && <Loader2 className='h-4 w-4 animate-spin' />}
						Create code
					</button>
				</div>
			</form>
		</Panel>
	)
}

export default function AdminReferrals() {
	const [codes, setCodes] = useState<ReferralCode[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [busyId, setBusyId] = useState<string | null>(null)

	useEffect(() => {
		listReferralCodes()
			.then(({ data }) => setCodes(data))
			.catch(() => setError('Could not load invite codes. Please refresh.'))
	}, [])

	const toggle = async (code: ReferralCode) => {
		try {
			setBusyId(code.id)
			const { data } = await setReferralCodeActive(code.id, !code.active)
			setCodes((prev) => prev?.map((entry) => (entry.id === code.id ? { ...entry, active: data.active } : entry)) ?? null)
		} catch (requestError) {
			toast.error(apiErrorMessage(requestError, 'Could not update the code.'))
		} finally {
			setBusyId(null)
		}
	}

	const remove = async (code: ReferralCode) => {
		if (!window.confirm(`Delete ${code.code}? People who already used it keep their Premium.`)) return
		try {
			setBusyId(code.id)
			await deleteReferralCode(code.id)
			setCodes((prev) => prev?.filter((entry) => entry.id !== code.id) ?? null)
			toast.success('Code deleted')
		} catch (requestError) {
			toast.error(apiErrorMessage(requestError, 'Could not delete the code.'))
		} finally {
			setBusyId(null)
		}
	}

	return (
		<>
			<PageHeader title='Invite codes' description='Share a code or link. Each person who signs up with it gets Premium.' />

			<div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start'>
				<CreateCodeForm onCreated={(code) => setCodes((prev) => [{ ...code, createdBy: null, redemptions: [] }, ...(prev ?? [])])} />

				<div>
					{error && <p className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</p>}
					{!codes && !error ? (
						<div className='flex min-h-[30vh] items-center justify-center text-zinc-400'>
							<Loader2 className='h-5 w-5 animate-spin' aria-label='Loading' />
						</div>
					) : codes && codes.length === 0 ? (
						<p className='rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500'>No codes yet. Create your first one to start inviting people.</p>
					) : (
						<ul className='space-y-3'>
							{codes?.map((code) => {
								const state = codeState(code)
								return (
									<li key={code.id} className='rounded-xl border border-zinc-200 bg-white p-4 sm:p-5'>
										<div className='flex flex-wrap items-start justify-between gap-3'>
											<div className='min-w-0'>
												<div className='flex items-center gap-2'>
													<p className='font-mono text-[15px] font-semibold tracking-wide text-zinc-900'>{code.code}</p>
													<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${state.className}`}>{state.label}</span>
												</div>
												<p className='mt-1 text-sm text-zinc-500'>
													{code.label ? `${code.label} · ` : ''}
													{code.premiumDays === 30 ? '1 month' : `${code.premiumDays} days`} of Premium
													{code.expiresAt ? ` · until ${formatDate(code.expiresAt)}` : ''}
												</p>
											</div>
											<div className='text-right'>
												<p className='text-lg font-semibold tabular-nums text-zinc-900'>
													{code.usedCount}
													<span className='text-sm font-normal text-zinc-400'> / {code.maxUses ?? '∞'}</span>
												</p>
												<p className='text-xs text-zinc-500'>used</p>
											</div>
										</div>

										{code.maxUses != null && (
											<div className='mt-3 h-1 overflow-hidden rounded-full bg-zinc-100'>
												<div className='h-full rounded-full bg-orange-500' style={{ width: `${Math.min(100, (code.usedCount / code.maxUses) * 100)}%` }} />
											</div>
										)}

										{code.redemptions.length > 0 && (
											<p className='mt-3 truncate text-xs text-zinc-500'>
												Last used by {code.redemptions[0].user.name} · {relativeTime(code.redemptions[0].redeemedAt)}
											</p>
										)}

										<div className='mt-4 flex flex-wrap items-center gap-2'>
											<CopyButton value={referralLink(code.code)} label='Copy link' />
											<CopyButton value={code.code} label='Copy code' />
											<div className='ml-auto flex items-center gap-1'>
												<button type='button' onClick={() => void toggle(code)} disabled={busyId === code.id} className='h-8 rounded-lg px-2.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50'>
													{code.active ? 'Pause' : 'Resume'}
												</button>
												<button type='button' onClick={() => void remove(code)} disabled={busyId === code.id} aria-label={`Delete ${code.code}`} className='flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50'>
													<Trash2 className='h-4 w-4' />
												</button>
											</div>
										</div>
									</li>
								)
							})}
						</ul>
					)}
				</div>
			</div>
		</>
	)
}
