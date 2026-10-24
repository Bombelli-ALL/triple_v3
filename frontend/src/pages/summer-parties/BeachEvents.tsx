import { useTranslation } from 'react-i18next'
import { Flame, Sun, Waves } from 'lucide-react'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type BeachCopy = {
	hero: { leading: string; accent: string; trailing: string; description: string }
	introTitle: string
	introText: string
	coasts: Array<{ title: string; text: string }>
	atmosphereTitle: string
	atmosphereText: string
	atmospheres: Array<{ title: string; text: string }>
	closingTitle: string
	closingText: string
}

const copyByLocale: Record<AppLocale, BeachCopy> = {
	en: {
		hero: {
			leading: 'Feel The',
			accent: 'Coastal',
			trailing: 'Summer Pulse',
			description:
				'Beach Events is now written as a summer editorial: atmospheric, desirable, and focused on how Morocco’s coastline feels when music, light, and travel energy come together.',
		},
		introTitle: 'The coast should sound like a mood before it sounds like a schedule.',
		introText:
			'This page no longer behaves like an event listing. It now sells a feeling: Atlantic light, sea breeze, warm evenings, and the kind of summer momentum that makes a destination feel alive.',
		coasts: [
			{ title: 'Atlantic rhythm', text: 'Essaouira and Taghazout carry surf energy, salt in the air, and a social vibe that feels relaxed yet magnetic.' },
			{ title: 'Mediterranean calm', text: 'Northern beaches suggest cleaner light, quieter elegance, and a more intimate summer mood.' },
			{ title: 'Southern spectacle', text: 'Further south, the coast becomes wider, more cinematic, and ideal for travelers chasing wind, openness, and memorable contrast.' },
		],
		atmosphereTitle: 'What visitors should imagine here',
		atmosphereText:
			'The narrative should make people picture evenings by the water, curated crowds, music that belongs to the place, and the freedom of a summer night that feels safe and unforgettable.',
		atmospheres: [
			{ title: 'Sunset entry', text: 'The mood begins before the event itself, with golden light, arrival rituals, and a sense of anticipation.' },
			{ title: 'Night by the shore', text: 'The coast becomes social without becoming chaotic, giving travelers something vibrant yet still tasteful.' },
			{ title: 'Morning after', text: 'A strong beach-event page also implies recovery: breakfast, sea air, slower mornings, and balance.' },
		],
		closingTitle: 'Why this page helps conversion',
		closingText:
			'When summer content feels immersive instead of generic, the customer stops thinking about tickets and starts imagining themselves already there.',
	},
	fr: {
		hero: {
			leading: 'Ressentez',
			accent: "L'Été",
			trailing: 'Du Littoral',
			description:
				'Beach Events devient ici un éditorial d’été: atmosphérique, désirable, et centré sur la sensation unique des côtes marocaines quand la musique, la lumière et le voyage se rencontrent.',
		},
		introTitle: 'La côte doit d’abord sonner comme une ambiance, pas comme un planning.',
		introText:
			'Cette page ne se comporte plus comme une simple liste d’événements. Elle vend une sensation: lumière atlantique, brise marine, soirées chaudes et énergie estivale.',
		coasts: [
			{ title: 'Rythme atlantique', text: 'Essaouira et Taghazout portent une énergie surf, salée, libre, à la fois détendue et magnétique.' },
			{ title: 'Calme méditerranéen', text: 'Le nord évoque une lumière plus nette, une élégance plus tranquille et un été plus intime.' },
			{ title: 'Spectacle du sud', text: 'Plus au sud, la côte devient plus cinématographique, plus large, idéale pour ceux qui veulent du vent et de l’espace.' },
		],
		atmosphereTitle: 'Ce que le visiteur doit imaginer',
		atmosphereText:
			'Le récit doit faire voir des soirées au bord de l’eau, des foules choisies, une musique qui appartient au lieu, et la liberté d’une nuit d’été sûre et mémorable.',
		atmospheres: [
			{ title: 'Entrée au coucher du soleil', text: 'L’ambiance commence avant même l’événement, avec la lumière dorée, l’arrivée et l’attente.' },
			{ title: 'La nuit face à la mer', text: 'Le littoral devient social sans devenir chaotique, ce qui garde une forme de raffinement.' },
			{ title: 'Le lendemain matin', text: 'Une bonne page suggère aussi la récupération: petit-déjeuner, air marin, matin lent et équilibre.' },
		],
		closingTitle: 'Pourquoi cette page aide à convertir',
		closingText:
			'Quand le contenu d’été devient immersif au lieu d’être générique, le client cesse de penser au simple événement et commence à s’imaginer déjà sur place.',
	},
	es: {
		hero: {
			leading: 'Siente El',
			accent: 'Pulso',
			trailing: 'Del Verano Costero',
			description:
				'Beach Events se convierte aquí en un editorial de verano: atmosférico, deseable y centrado en cómo se siente la costa marroquí cuando se unen música, luz y energía viajera.',
		},
		introTitle: 'La costa debe sentirse primero como un ambiente, no como un calendario.',
		introText:
			'La página ya no funciona como una lista de eventos. Ahora vende una sensación: luz atlántica, brisa marina, noches cálidas y una energía de verano que hace que el destino parezca vivo.',
		coasts: [
			{ title: 'Ritmo atlántico', text: 'Essaouira y Taghazout transmiten energía surf, sal en el aire y una vida social relajada pero magnética.' },
			{ title: 'Calma mediterránea', text: 'Las playas del norte sugieren una luz más limpia, una elegancia más serena y un verano más íntimo.' },
			{ title: 'Espectáculo del sur', text: 'Más al sur, la costa se vuelve más amplia y cinematográfica, perfecta para viajeros que buscan viento y contraste.' },
		],
		atmosphereTitle: 'Lo que el visitante debe imaginar aquí',
		atmosphereText:
			'La narrativa debe hacer pensar en tardes frente al agua, música que pertenece al lugar y noches de verano vibrantes pero seguras.',
		atmospheres: [
			{ title: 'Entrada al atardecer', text: 'La emoción empieza antes del evento, con luz dorada, llegada pausada y expectativa.' },
			{ title: 'La noche junto al mar', text: 'La costa se vuelve social sin volverse caótica, y eso hace que siga sintiéndose cuidada.' },
			{ title: 'La mañana siguiente', text: 'Una buena página también sugiere recuperación: desayuno, aire salado, mañanas lentas y equilibrio.' },
		],
		closingTitle: 'Por qué esta página ayuda a convertir',
		closingText:
			'Cuando el contenido de verano se siente inmersivo y no genérico, el cliente deja de pensar en entradas y empieza a imaginarse ya en la escena.',
	},
	ar: {
		hero: {
			leading: 'عِش',
			accent: 'نبض',
			trailing: 'الصيف الساحلي',
			description:
				'تتحول Beach Events هنا إلى صفحة صيفية تحريرية: مليئة بالأجواء، مرغوبة بصريًا، ومركزة على إحساس الساحل المغربي حين تجتمع الموسيقى والضوء والطاقة.',
		},
		introTitle: 'الساحل يجب أن يُسمع كأجواء قبل أن يُقرأ كبرنامج.',
		introText:
			'لم تعد الصفحة مجرد قائمة فعاليات. بل أصبحت تبيع إحساسًا: ضوء الأطلسي، نسيم البحر، الليالي الدافئة، والإيقاع الصيفي الذي يجعل الوجهة تبدو حيّة.',
		coasts: [
			{ title: 'إيقاع الأطلسي', text: 'الصويرة وتغازوت تحملان طاقة ركوب الأمواج والهواء المالح وأجواء اجتماعية مريحة لكنها جاذبة.' },
			{ title: 'هدوء المتوسط', text: 'شمال المغرب يقترح ضوءًا أنقى وأناقة أكثر هدوءًا ومزاجًا صيفيًا أكثر خصوصية.' },
			{ title: 'مشهد الجنوب', text: 'كلما نزلت جنوبًا أصبح الساحل أوسع وأكثر سينمائية، ومناسبًا لمن يبحث عن الريح والانفتاح والتباين.' },
		],
		atmosphereTitle: 'ما الذي يجب أن يتخيله الزائر هنا',
		atmosphereText:
			'يجب أن تجعل الصفحة الزائر يرى أمسيات بجانب الماء، وحشودًا منسقة، وموسيقى تنتمي للمكان، وليلة صيفية نابضة لكن مطمئنة.',
		atmospheres: [
			{ title: 'بداية الغروب', text: 'يبدأ المزاج قبل الفعالية نفسها، مع الضوء الذهبي ولحظة الوصول والشعور بالانتظار الجميل.' },
			{ title: 'الليل على الشاطئ', text: 'يصبح الساحل اجتماعيًا من دون فوضى، فيحافظ على طابعه الجذاب والأنيق.' },
			{ title: 'صباح اليوم التالي', text: 'الصفحة الجيدة توحي أيضًا بالاستعادة: فطور، هواء بحري، وصباح أبطأ ومتوازن.' },
		],
		closingTitle: 'لماذا تساعد هذه الصفحة على الإقناع',
		closingText:
			'عندما يبدو محتوى الصيف غامرًا بدل أن يكون عامًا، يتوقف العميل عن التفكير في الحدث فقط ويبدأ بتخيّل نفسه بالفعل هناك.',
	},
}

export default function BeachEvents() {
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
							<Waves className='h-3.5 w-3.5' />
							Beach mood
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em]'>{copy.introTitle}</h2>
						<p className='mt-4 text-sm leading-8 text-zinc-300'>{copy.introText}</p>
					</div>

					<div className='grid gap-4'>
						{copy.coasts.map((item) => (
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
						<h2 className='text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.atmosphereTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.atmosphereText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-3'>
						{copy.atmospheres.map((item, index) => {
							const icons = [Sun, Waves, Flame]
							const Icon = icons[index] ?? Sun
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
