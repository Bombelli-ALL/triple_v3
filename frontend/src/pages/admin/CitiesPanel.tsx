import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { apiErrorMessage, getCityCoverage, getCitySyncStatus, startCitySync, type CityCoverage, type CitySyncStatus } from '@/lib/plan'
import { Panel } from './adminUi'

/** Admin control to preload every Moroccan city with real places, with live progress */
export default function CitiesPanel() {
	const [cities, setCities] = useState<CityCoverage[] | null>(null)
	const [sync, setSync] = useState<CitySyncStatus | null>(null)
	const [starting, setStarting] = useState(false)

	const refresh = useCallback(async () => {
		const [coverage, status] = await Promise.all([getCityCoverage(), getCitySyncStatus()])
		setCities(coverage.data)
		setSync(status.data)
		return status.data
	}, [])

	useEffect(() => {
		refresh().catch(() => setCities([]))
	}, [refresh])

	// Poll while the background job runs
	useEffect(() => {
		if (!sync?.running) return
		const timer = window.setInterval(() => {
			refresh()
				.then((status) => {
					if (!status.running) toast.success(`Done: ${status.placesAdded} places added`)
				})
				.catch(() => undefined)
		}, 2500)
		return () => window.clearInterval(timer)
	}, [sync?.running, refresh])

	const start = async () => {
		try {
			setStarting(true)
			const { data } = await startCitySync()
			setSync(data)
		} catch (error) {
			toast.error(apiErrorMessage(error, 'Could not start loading cities.'))
		} finally {
			setStarting(false)
		}
	}

	const totalPlaces = cities?.reduce((sum, city) => sum + city.places, 0) ?? 0
	const emptyCities = cities?.filter((city) => city.places === 0).length ?? 0
	const progress = sync && sync.total ? Math.round((sync.done / sync.total) * 100) : 0

	return (
		<Panel title='Cities & places' action={<span className='text-sm text-zinc-500'>{cities ? `${cities.length} cities · ${totalPlaces} places` : ''}</span>}>
			<p className='text-sm text-zinc-500'>Load real places with photos (sights, culture, nature, food and cafés) for over 40 Moroccan cities. Cities that already have places are only topped up.</p>

			{sync?.running ? (
				<div className='mt-4'>
					<div className='mb-1.5 flex justify-between text-sm'>
						<span className='text-zinc-700'>Loading {sync.current ?? '…'}</span>
						<span className='tabular-nums text-zinc-500'>
							{sync.done} / {sync.total}
						</span>
					</div>
					<div className='h-2 overflow-hidden rounded-full bg-zinc-100'>
						<div className='h-full rounded-full bg-orange-500 transition-all' style={{ width: `${progress}%` }} />
					</div>
					<p className='mt-1.5 text-xs text-zinc-400'>{sync.placesAdded} places added so far. You can leave this page.</p>
				</div>
			) : (
				<div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center'>
					<button type='button' onClick={() => void start()} disabled={starting} className='inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50'>
						{starting && <Loader2 className='h-4 w-4 animate-spin' />}
						Load all Moroccan cities
					</button>
					{sync?.finishedAt && (
						<span className='text-xs text-zinc-500'>
							Last run added {sync.placesAdded} places{sync.failed.length ? ` · not found: ${sync.failed.join(', ')}` : ''}
						</span>
					)}
				</div>
			)}

			{cities && cities.length > 0 && (
				<div className='mt-5 border-t border-zinc-100 pt-4'>
					{emptyCities > 0 && <p className='mb-2 text-xs text-zinc-500'>{emptyCities} cities have no places yet.</p>}
					<ul className='flex flex-wrap gap-1.5'>
						{cities.map((city) => (
							<li key={city.id} className={`rounded-full px-2.5 py-1 text-xs ${city.places ? 'bg-zinc-100 text-zinc-700' : 'bg-orange-50 text-orange-700'}`}>
								{city.name} <span className='tabular-nums text-zinc-400'>{city.places}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</Panel>
	)
}
