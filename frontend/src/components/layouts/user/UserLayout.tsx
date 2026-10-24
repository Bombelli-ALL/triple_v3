import { Component, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWindowSize } from '@/hooks/useWindowSize'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import MobileDrawer from './MobileDrawer'
import AgentBubble from './AgentBubble'

class AgentBubbleBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
	state = { hasError: false }

	static getDerivedStateFromError() {
		return { hasError: true }
	}

	componentDidCatch(error: unknown, info: unknown) {
		console.error('AgentBubble crashed', error, info)
	}

	render() {
		if (this.state.hasError) return null
		return this.props.children
	}
}

export default function UserLayout() {
	const { i18n } = useTranslation()
	const { isMobile, isDesktop } = useWindowSize()
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isDrawerOpen, setIsDrawerOpen] = useState(false)
	const location = useLocation()

	return (
		<>
		<style>
				{`
					body {
						overflow: hidden;
					}
				`}
			</style>
			<div className='flex h-dvh overflow-hidden bg-bg text-text' dir={i18n.dir()}>
				<div className='relative z-40'>
					{isDesktop ? <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} /> : <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />}
				</div>

				<div className='flex min-h-0 min-w-0 flex-1 flex-col duration-300 ease-in-out'>
					<div className='relative z-30'>
						<TopBar onMenuClick={() => setIsDrawerOpen(true)} />
					</div>

					<main className='min-h-0 flex-1 overflow-hidden'>
						<div key={location.pathname} className={`animate-fade-in h-full w-full overflow-y-auto ${location.pathname === '/user/maps' ? 'p-0' : 'p-4 pb-24 md:p-8'}`}>
							<Outlet />
						</div>
					</main>

					{isMobile ? <BottomNav /> : null}
					<AgentBubbleBoundary>
						<AgentBubble />
					</AgentBubbleBoundary>
				</div>

				<style>{`
        .animate-fade-in {
          animation: fadeIn 200ms ease-out both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 767px) {
          /* Smooth scale animation on tap */
          .active-press:active {
            transform: scale(0.92);
          }
        }
      `}</style>
			</div>
		</>
	)
}
