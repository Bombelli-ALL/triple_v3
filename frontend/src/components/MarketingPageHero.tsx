import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ZellijLineBackground from './ZellijLineBackground'

type MarketingPageHeroProps = {
	titleLeading: string
	titleAccent: string
	titleTrailing: string
	description: string
}

export default function MarketingPageHero({
	titleLeading,
	titleAccent,
	titleTrailing,
	description,
}: MarketingPageHeroProps) {
	const { i18n } = useTranslation()
	const [heroReady, setHeroReady] = useState(false)

	useEffect(() => {
		const id = window.requestAnimationFrame(() => {
			setHeroReady(true)
		})

		return () => window.cancelAnimationFrame(id)
	}, [])

	return (
		<section
			dir={i18n.dir()}
			data-marketing-hero
			className='relative overflow-hidden bg-white pt-[104px] pb-28 sm:pt-[112px] lg:pt-[120px]'
		>
			<ZellijLineBackground />

			<div
				className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_42%)] transition-opacity duration-1000 ${
					heroReady ? 'opacity-100' : 'opacity-0'
				}`}
			/>
			<div
				className={`pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-orange-50/30 blur-3xl transition-all duration-1000 sm:h-[520px] sm:w-[520px] ${
					heroReady ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
				}`}
			/>

			<div className='relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6'>
				<div className='mx-auto max-w-[1080px] text-center'>
					<h1
						className={`text-[38px] font-semibold leading-[0.96] tracking-[-0.05em] text-zinc-950 sm:text-[54px] lg:text-[76px] xl:text-[84px] ${
							heroReady ? 'hero-fade-up hero-delay-1' : 'opacity-0'
						}`}
					>
						<span className='block'>
							{titleLeading}{' '}
							<span
								className='inline-block text-orange-500'
								style={{
									fontFamily: '"Dancing Script", cursive',
									fontWeight: 700,
									letterSpacing: '-0.01em',
								}}
							>
								{titleAccent}
							</span>
						</span>
						<span className='block'>{titleTrailing}</span>
					</h1>

					<p
						className={`mx-auto mt-5 max-w-[860px] text-sm leading-7 text-zinc-600 sm:text-[17px] sm:leading-8 lg:mt-6 ${
							heroReady ? 'hero-fade-up hero-delay-2' : 'opacity-0'
						}`}
						style={{
							fontFamily:
								'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
							fontWeight: 400,
							letterSpacing: '-0.01em',
						}}
					>
						{description}
					</p>
				</div>
			</div>

			<style>{`
				.hero-fade-up {
					animation: heroFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
				}

				.hero-delay-1 {
					animation-delay: 0.04s;
				}

				.hero-delay-2 {
					animation-delay: 0.12s;
				}

				@keyframes heroFadeUp {
					from {
						opacity: 0;
						transform: translate3d(0, 22px, 0);
					}

					to {
						opacity: 1;
						transform: translate3d(0, 0, 0);
					}
				}
			`}</style>
		</section>
	)
}
