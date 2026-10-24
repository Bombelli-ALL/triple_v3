import Navbar from './Navbar'
import Footer from './Footer'
import { Outlet } from 'react-router-dom'
import ChatBot from '../ChatBot'

export default function Layout() {
	return (
		<div className='relative min-h-screen overflow-x-hidden bg-white'>
			<div className='relative z-20'>
				<Navbar />
			</div>
			<main className='flex-1 pb-20'>
				<Outlet />
			</main>
			<ChatBot />
			<Footer />
		</div>
	)
}
