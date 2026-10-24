import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
export default function NotFound() {
	const { t } = useTranslation()

	return (
		<main className='flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-sm px-4 pt-16 selection:bg-zinc-100'>
			<h1 className='text-8xl md:text-[10rem] font-black text-zinc-900 tracking-tighter'>404</h1>
			<div className='h-1.5 w-12 rounded-full bg-zinc-900 my-8 shadow-sm'></div>
			<p className='text-2xl md:text-3xl font-bold text-zinc-800 tracking-tight'>{t('404.title')}</p>
			<p className='text-sm md:text-base mt-4 text-zinc-500 max-w-md text-center leading-relaxed font-medium'>{t('404.description')}</p>
			<div className='flex flex-col sm:flex-row items-center gap-4 mt-12'>
				<Link to='/' className='w-full sm:w-auto bg-zinc-900 hover:bg-black px-10 py-4 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center'>
					{t('404.returnHome')}
				</Link>
				<Link to='/faqs' className='w-full sm:w-auto border border-zinc-200 px-10 py-4 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center'>
					{t('404.support')}
				</Link>
			</div>
		</main>
	)
}
