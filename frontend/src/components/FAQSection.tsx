import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, HelpCircle } from 'lucide-react'
import ZellijLineBackground from './ZellijLineBackground'
import { useChatBotStore } from '@/stores/chatBotStore'

export default function FAQSection() {
	const { t, i18n } = useTranslation()
	const { setOpen } = useChatBotStore()
	const sectionRef = useRef<HTMLElement | null>(null)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		const node = sectionRef.current
		if (!node) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true)
					observer.unobserve(entry.target)
				}
			},
			{
				threshold: 0.14,
				rootMargin: '0px 0px -8% 0px',
			},
		)

		observer.observe(node)

		return () => observer.disconnect()
	}, [])

	const faqs = [
		{ question: t('faq.q1'), answer: t('faq.a1') },
		{ question: t('faq.q2'), answer: t('faq.a2') },
		{ question: t('faq.q4'), answer: t('faq.a4') },
	]

	return (
		<section ref={sectionRef} className='relative w-full overflow-hidden bg-white px-4 py-16 md:px-8 md:py-24' dir={i18n.dir()}>
			<ZellijLineBackground />

			<div className='pointer-events-none absolute inset-x-0 top-0 z-1 h-40 bg-gradient-to-b from-white/60 via-white/40 to-transparent sm:h-48 md:h-56' />
			<div className='pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),rgba(255,255,255,0.18)_18%,rgba(255,255,255,0.04)_40%,transparent_74%)]' />
			<div className={`pointer-events-none absolute inset-0 z-1 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
				<div className='absolute inset-0 bg-transparent' />
				<div className='absolute left-1/2 top-8 h-120 w-120 -translate-x-1/2 rounded-full bg-orange-50/15 blur-3xl opacity-50 sm:h-135 sm:w-135' />
			</div>

			<div className='relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:items-start md:gap-16 lg:gap-24'>
				<div className={`h-fit w-full md:sticky md:top-28 md:w-1/3 ${isVisible ? 'hero-fade-up hero-delay-1' : 'opacity-0'} rtl:text-left rtl:md:text-right text-left md:text-left`}>
					<div className={`inline-flex items-center rounded-full border border-orange-100 bg-orange-50/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-500 backdrop-blur-sm sm:text-xs ${isVisible ? 'hero-fade-up hero-delay-2' : 'opacity-0'}`}>{t('faq.badge', 'FAQ')}</div>

					<h2 className={`mt-5 mb-4 text-3xl font-semibold tracking-tight text-slate-900 md:mb-6 md:text-5xl ${isVisible ? 'hero-fade-up hero-delay-3' : 'opacity-0'}`}>{t('faq.title')}</h2>

					<p className={`max-w-sm text-[15px] leading-7 text-slate-500 md:text-lg ${isVisible ? 'hero-fade-up hero-delay-4' : 'opacity-0'}`}>{t('faq.subtitle')}</p>
				</div>

				<div className={`w-full md:w-2/3 ${isVisible ? 'hero-fade-up hero-delay-3' : 'opacity-0'}`}>
					{faqs.map((faq, index) => (
						<div key={index} className={`w-full border-b border-slate-200 py-6 ${isVisible ? 'hero-fade-up' : 'opacity-0'}`} style={{ animationDelay: `${0.22 + index * 0.12}s` }}>
							<h3 className={`text-base font-semibold text-orange-500 md:text-lg rtl:text-left rtl:md:text-right text-left`}>{faq.question}</h3>

							<p className={`mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base rtl:text-left rtl:md:text-right text-left`}>{faq.answer}</p>
						</div>
					))}

					<div className={`mt-8 flex flex-col items-start gap-4 pt-2 ${isVisible ? 'hero-fade-up hero-delay-5' : 'opacity-0'}`}>
						<div className='flex items-center gap-2'>
							<HelpCircle className='h-5 w-5 shrink-0 text-orange-500' />
							<p className={`text-sm font-medium text-slate-700 md:text-base rtl:text-left rtl:md:text-right text-left`}>{t('faq.ctaTitle', 'Still have questions?')}</p>
						</div>

						<button onClick={() => setOpen(true)} className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition hover:border-orange-300 hover:bg-orange-50 active:scale-95'>
							<span>{t('faq.ctaButton', 'Talk to our assistant')}</span>
							<ChevronRight className='h-4 w-4 rtl:rotate-180' />
						</button>
					</div>
				</div>
			</div>

			<style>{`
				.hero-fade-up {
					animation: heroFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
					will-change: transform, opacity;
				}

				.hero-delay-1 {
					animation-delay: 0.08s;
				}

				.hero-delay-2 {
					animation-delay: 0.18s;
				}

				.hero-delay-3 {
					animation-delay: 0.3s;
				}

				.hero-delay-4 {
					animation-delay: 0.42s;
				}

				.hero-delay-5 {
					animation-delay: 0.56s;
				}

				@keyframes heroFadeUp {
					0% {
						opacity: 0;
						transform: translate3d(0, 22px, 0) scale(0.985);
						filter: blur(8px);
					}
					100% {
						opacity: 1;
						transform: translate3d(0, 0, 0) scale(1);
						filter: blur(0);
					}
				}
			`}</style>
		</section>
	)
}
