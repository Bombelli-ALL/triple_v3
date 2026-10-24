import React, { useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight, FileText, Menu } from 'lucide-react'
import { useWindowSize } from '@/hooks/useWindowSize'

export interface LegalSection {
	id: string
	title: string
	content: React.ReactNode
}

interface LegalPageLayoutProps {
	title: string
	description: string
	lastUpdated: string
	icon?: React.ReactNode
	sections: LegalSection[]
}

export default function LegalPageLayout({ title, description, lastUpdated, icon, sections }: LegalPageLayoutProps) {
	const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '')
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const { isDesktop } = useWindowSize()

	// Auto-scroll to top on mount
	useEffect(() => {
		window.scrollTo(0, 0)
	}, [])

	// Track which section is in view
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				let maxVisibleRatio = 0
				let bestMatch = ''
				entries.forEach((entry) => {
					if (entry.isIntersecting && entry.intersectionRatio > maxVisibleRatio) {
						maxVisibleRatio = entry.intersectionRatio
						bestMatch = entry.target.id
					}
				})
				if (bestMatch) setActiveSection(bestMatch)
			},
			{ rootMargin: '-100px 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
		)
		sections.forEach((section) => {
			const el = document.getElementById(section.id)
			if (el) observer.observe(el)
		})
		return () => observer.disconnect()
	}, [sections])

	const scrollToSection = (id: string) => {
		setMobileMenuOpen(false)
		const el = document.getElementById(id)
		if (el) {
			const y = el.getBoundingClientRect().top + window.scrollY - 90
			window.scrollTo({ top: y, behavior: 'smooth' })
			setActiveSection(id)
		}
	}

	return (
		<div className='min-h-screen bg-[#FAFAFA] selection:bg-zinc-200'>
			{/* Desktop two-column layout */}
			{isDesktop ? (
				<div className='flex max-w-[1400px] mx-auto'>
					{/* ── LEFT: permanently sticky sidebar ── */}
					<aside
						className='w-[420px] shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-zinc-100 bg-[#FAFAFA] px-10 py-16'
						style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
					>
						{/* Badge */}
						<div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm mb-8'>
							{icon ?? <FileText className='w-4 h-4 text-zinc-400' />}
							<span className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>Legal Information</span>
						</div>

						{/* Title */}
						<h1 className='text-4xl font-black tracking-tight text-zinc-900 leading-[1.1] mb-5'>
							{title}
						</h1>

						{/* Description */}
						<p className='text-[15px] text-zinc-500 leading-relaxed mb-6'>
							{description}
						</p>

						{/* Last Updated */}
						<div className='flex items-center gap-2 text-xs text-zinc-400 font-medium mb-12 pb-12 border-b border-zinc-100'>
							<CheckCircle2 className='w-3.5 h-3.5 text-zinc-300 shrink-0' />
							<span>Last updated: {lastUpdated}</span>
						</div>

						{/* Navigation */}
						<p className='text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-4 px-1'>Contents</p>
						<nav className='flex flex-col gap-0.5'>
							{sections.map((section) => {
								const isActive = activeSection === section.id
								return (
									<button
										key={section.id}
										onClick={() => scrollToSection(section.id)}
										className={`
											group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200
											${isActive
												? 'bg-white text-zinc-900 shadow-sm shadow-zinc-100 border border-zinc-100'
												: 'text-zinc-500 hover:bg-white/60 hover:text-zinc-800'
											}
										`}
									>
										<div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? 'bg-zinc-900' : 'bg-zinc-300 group-hover:bg-zinc-400'}`} />
										{section.title}
									</button>
								)
							})}
						</nav>
					</aside>

					{/* ── RIGHT: scrollable content ── */}
					<main className='flex-1 min-w-0 px-16 pt-24 pb-32'>
						<style>{`
							.prose h2 { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.025em; margin-top: 3.5rem; margin-bottom: 1.25rem; color: #18181b; }
							.prose h3 { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.01em; margin-top: 2rem; margin-bottom: 0.75rem; color: #27272a; }
							.prose p { color: #52525b; line-height: 1.8; margin-bottom: 1.25rem; }
							.prose ul { margin-top: 1rem; margin-bottom: 1rem; padding-left: 1.25rem; }
							.prose li { color: #52525b; margin-bottom: 0.6rem; padding-left: 0.25rem; }
							.prose li::marker { color: #d4d4d8; }
							.prose strong { color: #18181b; font-weight: 600; }
							.prose a { color: #09090b; text-decoration-color: #e4e4e7; text-underline-offset: 3px; transition: all 0.15s; font-weight: 500; }
							.prose a:hover { color: #f97316; text-decoration-color: #fed7aa; }
						`}</style>

						<div className='prose max-w-2xl'>
							{sections.map((section) => (
								<section key={section.id} id={section.id} className='scroll-mt-28 pb-10 mb-2 border-b border-zinc-100 last:border-0'>
									<h2>{section.title}</h2>
									{section.content}
								</section>
							))}
						</div>

						{/* Footer strip */}
						<div className='max-w-2xl mt-20 pt-10 border-t border-zinc-200 flex flex-col sm:flex-row gap-5 items-center justify-between'>
							<div className='flex items-center gap-3 text-sm text-zinc-500'>
								<div className='w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center shrink-0 text-base'>👋</div>
								<p>Still have questions?{' '}
									<a href='mailto:support@trippple.com' className='text-zinc-900 border-b border-zinc-300 hover:border-zinc-900 transition-colors'>
										Contact our team
									</a>
								</p>
							</div>
							<button
								onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
								className='px-5 py-2 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 shadow-sm transition-all active:scale-95 uppercase tracking-wide whitespace-nowrap'
							>
								Back to top
							</button>
						</div>
					</main>
				</div>
			) : (
				/* ── MOBILE layout ── */
				<div className='px-5 pt-24 pb-28'>
					{/* Mobile Header */}
					<header className='mb-8'>
						<div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm mb-6'>
							{icon ?? <FileText className='w-4 h-4 text-zinc-400' />}
							<span className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>Legal Information</span>
						</div>
						<h1 className='text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 leading-[1.1] mb-4'>{title}</h1>
						<p className='text-base text-zinc-500 leading-relaxed mb-4'>{description}</p>
						<div className='flex items-center gap-2 text-xs text-zinc-400 font-medium'>
							<CheckCircle2 className='w-3.5 h-3.5 text-zinc-300' />
							<span>Last updated: {lastUpdated}</span>
						</div>
					</header>

					{/* Mobile sticky nav bar */}
					<div className='sticky top-16 z-40 mb-8'>
						<div className='bg-white/90 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-sm overflow-hidden'>
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className='flex items-center justify-between w-full px-4 py-3.5'
							>
								<div className='flex items-center gap-2.5'>
									<Menu className='w-4 h-4 text-zinc-400' />
									<span className='font-semibold text-zinc-800 text-sm'>
										{sections.find((s) => s.id === activeSection)?.title || 'Contents'}
									</span>
								</div>
								<ChevronRight className={`w-4 h-4 text-zinc-300 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-90' : ''}`} />
							</button>

							{mobileMenuOpen && (
								<nav className='border-t border-zinc-100 flex flex-col gap-0.5 p-2 max-h-[55vh] overflow-y-auto'>
									{sections.map((section) => (
										<button
											key={section.id}
											onClick={() => scrollToSection(section.id)}
											className={`
												flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-left transition-colors
												${activeSection === section.id ? 'bg-zinc-50 text-zinc-900 font-bold' : 'text-zinc-500 font-medium hover:bg-zinc-50 hover:text-zinc-800'}
											`}
										>
											<div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeSection === section.id ? 'bg-zinc-900' : 'bg-zinc-300'}`} />
											{section.title}
										</button>
									))}
								</nav>
							)}
						</div>
					</div>

					{/* Mobile content */}
					<style>{`
						.prose h2 { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; margin-top: 3rem; margin-bottom: 1rem; color: #18181b; }
						.prose h3 { font-weight: 700; margin-top: 1.75rem; margin-bottom: 0.75rem; color: #27272a; }
						.prose p { color: #52525b; line-height: 1.75; margin-bottom: 1.25rem; }
						.prose ul { padding-left: 1.25rem; margin: 1rem 0; }
						.prose li { color: #52525b; margin-bottom: 0.5rem; }
						.prose li::marker { color: #d4d4d8; }
						.prose strong { color: #18181b; font-weight: 600; }
					`}</style>
					<div className='prose max-w-none'>
						{sections.map((section) => (
							<section key={section.id} id={section.id} className='scroll-mt-28 pb-8 border-b border-zinc-100 last:border-0'>
								<h2>{section.title}</h2>
								{section.content}
							</section>
						))}
					</div>

					<div className='mt-16 pt-8 border-t border-zinc-200 text-center'>
						<button
							onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
							className='px-6 py-2.5 rounded-full bg-white border border-zinc-200 text-xs font-bold text-zinc-500 hover:text-zinc-900 shadow-sm transition-all uppercase tracking-wide'
						>
							Back to top
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
