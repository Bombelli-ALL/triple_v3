import { useTranslation } from 'react-i18next'
import { Building2, MoonStar, Music4, Compass } from 'lucide-react'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type RooftopCopy = {
	hero: { leading: string; accent: string; trailing: string; description: string }
	introTitle: string
	introText: string
	cities: Array<{ title: string; text: string }>
	nightTitle: string
	nightText: string
	nightNotes: Array<{ title: string; text: string }>
	closingTitle: string
	closingText: string
}

const copyByLocale: Record<AppLocale, RooftopCopy> = {
	en: {
		hero: {
			leading: 'See The',
			accent: 'Nightlife',
			trailing: 'From Above',
			description:
				'Rooftop Parties is now positioned as an atmosphere page: elegant, urban, and focused on how Moroccan nights feel when the city opens beneath you.',
		},
		introTitle: 'A rooftop is not just a venue. It is a point of view.',
		introText:
			'This page now sells elevation, mood, and city perspective. It frames nightlife as a refined social scene shaped by light, skyline, music, and the emotional power of being above the noise.',
		cities: [
			{ title: 'Marrakech heat', text: 'Warm air, palms, low evening light, and a nightlife mood that leans sensual and cinematic.' },
			{ title: 'Casablanca polish', text: 'Sharper, more metropolitan, more fashion-led, and ideal for customers imagining premium urban energy.' },
			{ title: 'Tangier and the north', text: 'A rooftop in the north can feel windier, more literary, and more tied to horizon and sea than spectacle alone.' },
		],
		nightTitle: 'What a premium rooftop page should suggest',
		nightText:
			'It should help the visitor imagine the sequence of the evening: the arrival, the first view, the shift in light, the music level, and the feeling of staying longer than planned.',
		nightNotes: [
			{ title: 'Before the first drink', text: 'The mood starts with anticipation, architecture, and the first city view rather than with volume alone.' },
			{ title: 'During the evening', text: 'The best rooftop atmosphere feels social, stylish, and vibrant without crossing into visual chaos.' },
			{ title: 'When the night settles', text: 'A memorable venue leaves the impression of taste, perspective, and a city seen from its most flattering angle.' },
		],
		closingTitle: 'The selling power of this page',
		closingText:
			'When rooftop content feels mature and cinematic, it raises the whole application. It tells customers that Trippple knows where nightlife becomes part of the travel identity, not just an extra activity.',
	},
	fr: {
		hero: {
			leading: 'Regardez La',
			accent: 'Nuit',
			trailing: "Depuis Les Toits",
			description:
				'Rooftop Parties devient une page d’atmosphère: urbaine, élégante, et centrée sur la sensation d’une nuit marocaine quand la ville s’ouvre sous les yeux.',
		},
		introTitle: 'Un rooftop n’est pas seulement un lieu. C’est un point de vue.',
		introText:
			'La page vend désormais l’élévation, l’ambiance et la perspective urbaine. Elle présente la nuit comme une scène sociale raffinée, portée par la lumière, la skyline et la musique.',
		cities: [
			{ title: 'La chaleur de Marrakech', text: 'Air tiède, palmiers, lumière rasante du soir et une vie nocturne plus sensuelle et cinématographique.' },
			{ title: 'Le poli de Casablanca', text: 'Plus net, plus métropolitain, plus mode, et parfait pour imaginer une énergie urbaine premium.' },
			{ title: 'Tanger et le nord', text: 'Au nord, un rooftop peut paraître plus aérien, plus littéraire, davantage tourné vers l’horizon et la mer.' },
		],
		nightTitle: 'Ce qu’une bonne page rooftops doit suggérer',
		nightText:
			'Elle doit faire imaginer la séquence de la soirée: l’arrivée, la première vue, le changement de lumière, le niveau musical, et l’envie de rester plus longtemps.',
		nightNotes: [
			{ title: 'Avant le premier verre', text: 'L’ambiance commence par l’architecture, l’attente et la première lecture de la ville.' },
			{ title: 'Pendant la soirée', text: 'Le meilleur rooftop reste social, stylé et vivant sans tomber dans le chaos visuel.' },
			{ title: 'Quand la nuit se pose', text: 'Le lieu mémorable laisse une impression de goût, de perspective et d’élégance urbaine.' },
		],
		closingTitle: 'La force commerciale de cette page',
		closingText:
			'Quand le contenu rooftops paraît mature et cinématographique, toute l’application monte en gamme. Elle laisse penser que Trippple sait où la nuit devient une partie de l’identité du voyage.',
	},
	es: {
		hero: {
			leading: 'Mira La',
			accent: 'Noche',
			trailing: 'Desde Arriba',
			description:
				'Rooftop Parties se convierte en una página de atmósfera: urbana, elegante y centrada en cómo se siente una noche marroquí cuando la ciudad se abre bajo tus pies.',
		},
		introTitle: 'Un rooftop no es solo un lugar. Es un punto de vista.',
		introText:
			'La página vende ahora elevación, ambiente y perspectiva urbana. Presenta la vida nocturna como una escena cuidada, definida por la luz, la línea del cielo y la música.',
		cities: [
			{ title: 'El calor de Marrakech', text: 'Aire templado, palmeras, luz baja al atardecer y una noche más sensual y cinematográfica.' },
			{ title: 'La precisión de Casablanca', text: 'Más metropolitana, más pulida y más alineada con una energía urbana premium.' },
			{ title: 'Tánger y el norte', text: 'En el norte, un rooftop puede sentirse más abierto, más literario y más unido al horizonte y al mar.' },
		],
		nightTitle: 'Lo que debe sugerir una gran página de rooftops',
		nightText:
			'Debe ayudar a imaginar la secuencia completa de la noche: llegada, primera vista, cambio de luz, música y deseo de quedarse más tiempo.',
		nightNotes: [
			{ title: 'Antes de la primera copa', text: 'La atmósfera empieza con la arquitectura, la expectativa y la primera lectura de la ciudad.' },
			{ title: 'Durante la noche', text: 'El mejor rooftop se siente social, estilizado y vibrante sin caer en el caos visual.' },
			{ title: 'Cuando la noche madura', text: 'El lugar memorable deja sensación de gusto, perspectiva y una ciudad vista desde su mejor ángulo.' },
		],
		closingTitle: 'El poder comercial de esta página',
		closingText:
			'Cuando el contenido de rooftops se siente maduro y cinematográfico, eleva toda la aplicación. Hace pensar que Trippple sabe dónde la noche forma parte de la identidad del viaje.',
	},
	ar: {
		hero: {
			leading: 'شاهد',
			accent: 'الليل',
			trailing: 'من الأعلى',
			description:
				'تتحول Rooftop Parties إلى صفحة أجواء: حضرية، أنيقة، ومركزة على إحساس الليل المغربي حين تنفتح المدينة تحتك.',
		},
		introTitle: 'السطح ليس مجرد مكان. إنه زاوية نظر.',
		introText:
			'تبيع الصفحة الآن الارتفاع والمزاج ومنظور المدينة. فهي تقدم الحياة الليلية كمشهد اجتماعي راقٍ تصنعه الإضاءة والخط الأفقي والموسيقى.',
		cities: [
			{ title: 'حرارة مراكش', text: 'هواء دافئ ونخيل وضوء غارب وحياة ليلية أكثر حسية وسينمائية.' },
			{ title: 'أناقة الدار البيضاء', text: 'مشهد أكثر حضرية وصقلًا ومناسب لمن يتخيل طاقة مدينة فاخرة.' },
			{ title: 'طنجة والشمال', text: 'في الشمال قد يبدو السطح أكثر هواءً وأكثر ارتباطًا بالأفق والبحر من مجرد العرض.' },
		],
		nightTitle: 'ما الذي يجب أن توحي به صفحة الأسطح',
		nightText:
			'ينبغي أن تساعد الزائر على تخيل تسلسل الليلة: الوصول، أول إطلالة، تغير الضوء، مستوى الموسيقى، والرغبة في البقاء أكثر.',
		nightNotes: [
			{ title: 'قبل أول مشروب', text: 'يبدأ المزاج بالعمارة والانتظار وأول قراءة للمدينة لا بالصوت فقط.' },
			{ title: 'أثناء السهرة', text: 'أفضل سطح يكون اجتماعيًا وأنيقًا ونابضًا من دون فوضى بصرية.' },
			{ title: 'حين يستقر الليل', text: 'المكان الذي لا ينسى يترك إحساسًا بالذوق والمنظور ومدينة تُرى من أجمل زاوية.' },
		],
		closingTitle: 'القوة البيعية لهذه الصفحة',
		closingText:
			'حين يبدو محتوى الأسطح ناضجًا وسينمائيًا، ترتفع قيمة التطبيق كله. فهو يوحي بأن Trippple يعرف أين تصبح الحياة الليلية جزءًا من هوية الرحلة لا مجرد نشاط إضافي.',
	},
}

export default function RooftopParties() {
	const { i18n } = useTranslation()
	const locale = resolveAppLocale(i18n.resolvedLanguage)
	const copy = copyByLocale[locale]

	return (
		<EditorialPageLayout dir={i18n.dir()} className='bg-white'>
			<MarketingPageHero
				titleLeading={copy.hero.leading}
				titleAccent={copy.hero.accent}
				titleTrailing={copy.hero.trailing}
				description={copy.hero.description}
			/>

			<section className='mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20'>
				<div className='grid gap-6 lg:grid-cols-[0.95fr_1.05fr]'>
					<div className='rounded-[32px] border border-zinc-200 bg-zinc-950 p-8 text-white shadow-[0_24px_60px_rgba(24,24,27,0.18)]'>
						<div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300'>
							<Building2 className='h-3.5 w-3.5' />
							Rooftop mood
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em]'>{copy.introTitle}</h2>
						<p className='mt-4 text-sm leading-8 text-zinc-300'>{copy.introText}</p>
					</div>

					<div className='grid gap-4'>
						{copy.cities.map((item) => (
							<article key={item.title} className='rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(24,24,27,0.05)]'>
								<h3 className='text-lg font-semibold text-zinc-950'>{item.title}</h3>
								<p className='mt-3 text-sm leading-7 text-zinc-600'>{item.text}</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:py-8'>
				<div className='rounded-[36px] border border-zinc-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_45%,#fafafa_100%)] p-8 shadow-[0_24px_70px_rgba(24,24,27,0.06)] lg:p-10'>
					<div className='max-w-3xl'>
						<h2 className='text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.nightTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.nightText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-3'>
						{copy.nightNotes.map((item, index) => {
							const icons = [Compass, Music4, MoonStar]
							const Icon = icons[index] ?? Compass
							return (
								<article key={item.title} className='rounded-[28px] border border-white/90 bg-white/90 p-6 backdrop-blur'>
									<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500'>
										<Icon className='h-5 w-5' />
									</div>
									<h3 className='mt-4 text-lg font-semibold text-zinc-950'>{item.title}</h3>
									<p className='mt-3 text-sm leading-7 text-zinc-600'>{item.text}</p>
								</article>
							)
						})}
					</div>

					<div className='mt-10 rounded-[28px] border border-zinc-200 bg-white p-7'>
						<h3 className='text-2xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.closingTitle}</h3>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.closingText}</p>
					</div>
				</div>
			</section>
		</EditorialPageLayout>
	)
}
