import { useEffect, useRef, type ReactNode } from 'react'

type EditorialPageLayoutProps = {
	children: ReactNode
	dir?: 'ltr' | 'rtl' | 'auto'
	className?: string
}

export default function EditorialPageLayout({
	children,
	dir,
	className,
}: EditorialPageLayoutProps) {
	const rootRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const root = rootRef.current
		if (!root) return

		const sections = Array.from(root.children).filter((child): child is HTMLElement => {
			return child instanceof HTMLElement && child.tagName.toLowerCase() === 'section' && !child.hasAttribute('data-marketing-hero')
		})

		if (sections.length === 0) return

		sections.forEach((section, index) => {
			section.classList.add('editorial-page-section')
			section.style.setProperty('--section-reveal-delay', `${Math.min(index * 90, 360)}ms`)
		})

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
		if (prefersReducedMotion) {
			sections.forEach((section) => {
				section.classList.add('editorial-page-section-visible')
			})
			return
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return

					const target = entry.target as HTMLElement
					target.classList.add('editorial-page-section-visible')
					observer.unobserve(target)
				})
			},
			{
				threshold: 0.16,
				rootMargin: '0px 0px -8% 0px',
			},
		)

		sections.forEach((section) => {
			observer.observe(section)
		})

		return () => observer.disconnect()
	}, [])

	return (
		<div ref={rootRef} dir={dir} className={className}>
			{children}
			<style>{`
				.editorial-page-section {
					opacity: 0;
					transform: translate3d(0, 22px, 0) scale(0.985);
					filter: blur(10px);
					will-change: transform, opacity, filter;
				}

				.editorial-page-section-visible {
					animation: editorialPageFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
					animation-delay: var(--section-reveal-delay, 0ms);
				}

				@keyframes editorialPageFadeUp {
					from {
						opacity: 0;
						transform: translate3d(0, 22px, 0) scale(0.985);
						filter: blur(10px);
					}

					to {
						opacity: 1;
						transform: translate3d(0, 0, 0) scale(1);
						filter: blur(0);
					}
				}
			`}</style>
		</div>
	)
}
