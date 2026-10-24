import { useTranslation } from 'react-i18next'
import { Compass, Clock3, Mountain, Route, SunMedium } from 'lucide-react'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type ItineraryCopy = {
	hero: {
		leading: string
		accent: string
		trailing: string
		description: string
	}
	introTitle: string
	introText: string
	collections: Array<{ title: string; text: string }>
	featuredTitle: string
	featuredText: string
	featuredDays: Array<{ title: string; text: string }>
	seasonTitle: string
	seasonText: string
	seasons: Array<{ title: string; text: string }>
	closingTitle: string
	closingText: string
}

const copyByLocale: Record<AppLocale, ItineraryCopy> = {
	en: {
		hero: {
			leading: 'Discover Our',
			accent: 'Curated',
			trailing: 'Route Thinking',
			description:
				'These itineraries now read like polished travel narratives, helping visitors feel the logic, beauty, and emotional pace behind every Morocco route.',
		},
		introTitle: 'A great itinerary sells a feeling, not only a sequence.',
		introText:
			'This page is now built to show how Trippple thinks about routes: not as checklists, but as carefully staged movements through cities, landscapes, pauses, and memorable transitions.',
		collections: [
			{ title: 'City-led escapes', text: 'Shorter routes built around one strong urban identity, with enough space for cafés, rooftops, courtyards, and slower walks.' },
			{ title: 'Imperial connections', text: 'Journeys that let historic cities speak to one another, creating rhythm between architecture, memory, and atmosphere.' },
			{ title: 'Contrast-driven travel', text: 'Routes that deliberately move between medina density, mountain air, desert quiet, and coastal openness.' },
		],
		featuredTitle: 'How a premium route is narrated',
		featuredText:
			'Instead of listing destinations mechanically, the route is framed as an unfolding experience. Each day gives the next one more meaning.',
		featuredDays: [
			{ title: 'Day one settles the tone', text: 'Arrival should not feel rushed. The first chapter introduces taste, comfort, and orientation.' },
			{ title: 'Day two opens the city', text: 'This is where deeper culture, textures, and human encounters start to build emotional value.' },
			{ title: 'Day three widens the horizon', text: 'The route expands into viewpoints, landscapes, or quieter reflections that prevent the trip from feeling repetitive.' },
			{ title: 'Day four leaves a signature', text: 'A premium itinerary ends with a moment the traveler will remember vividly and describe easily to others.' },
		],
		seasonTitle: 'The route should also respect season and mood.',
		seasonText:
			'Good itinerary writing proves that Trippple understands temperature, light, crowd rhythm, and the emotional difference between a spring city break and a summer escape.',
		seasons: [
			{ title: 'Spring balance', text: 'Ideal for imperial cities, gardens, terraces, and medina walks that want softness and color.' },
			{ title: 'Summer contrast', text: 'Better when heat is balanced with coastlines, riad calm, evening rooftops, and slower daytime pacing.' },
			{ title: 'Autumn depth', text: 'Perfect for layered cultural routes, food moments, and more reflective journeys across cities and landscapes.' },
		],
		closingTitle: 'Why this page matters',
		closingText:
			'When the itinerary page feels finished, the customer feels guided by taste rather than by automation. That impression is exactly what turns browsing into trust.',
	},
	fr: {
		hero: {
			leading: 'Découvrez Notre',
			accent: 'Lecture',
			trailing: 'Des Itinéraires',
			description:
				'Ces itinéraires se lisent maintenant comme des récits de voyage soignés, pour faire sentir au visiteur la logique, la beauté et le rythme émotionnel de chaque route marocaine.',
		},
		introTitle: 'Un grand itinéraire vend une sensation, pas seulement une suite.',
		introText:
			'La page montre désormais comment Trippple pense les routes: non comme des checklists, mais comme des mouvements travaillés entre villes, paysages, pauses et transitions mémorables.',
		collections: [
			{ title: 'Échappées centrées sur la ville', text: 'Des parcours plus courts fondés sur une identité urbaine forte, avec de la place pour les cafés, les patios et les marches lentes.' },
			{ title: 'Connexions impériales', text: 'Des voyages où les villes historiques dialoguent entre elles pour créer du rythme entre architecture, mémoire et atmosphère.' },
			{ title: 'Voyages par contraste', text: 'Des routes qui passent volontairement de la densité de la médina à l’air de la montagne, au calme du désert et à l’ouverture du littoral.' },
		],
		featuredTitle: 'Comment raconter une route premium',
		featuredText:
			'Au lieu d’aligner des destinations, l’itinéraire devient une expérience qui se déploie. Chaque journée donne plus de sens à la suivante.',
		featuredDays: [
			{ title: 'Le premier jour pose le ton', text: 'L’arrivée ne doit pas sembler précipitée. Le premier chapitre installe le goût, le confort et l’orientation.' },
			{ title: 'Le deuxième jour ouvre la ville', text: 'C’est là que la culture plus profonde, les textures et les rencontres humaines créent de la valeur émotionnelle.' },
			{ title: 'Le troisième jour élargit l’horizon', text: 'La route s’ouvre vers des vues, des paysages ou des respirations plus calmes pour éviter toute répétition.' },
			{ title: 'Le quatrième jour laisse une signature', text: 'Un itinéraire premium se termine sur un moment que le voyageur retiendra et saura raconter.' },
		],
		seasonTitle: 'La route doit aussi respecter la saison et l’humeur du voyage.',
		seasonText:
			'Une bonne écriture d’itinéraire prouve que Trippple comprend la température, la lumière, le rythme de fréquentation et la différence émotionnelle entre un city break de printemps et une échappée d’été.',
		seasons: [
			{ title: 'Équilibre du printemps', text: 'Idéal pour les villes impériales, les jardins, les terrasses et les promenades en médina.' },
			{ title: "Contraste d'été", text: 'Plus juste quand la chaleur est équilibrée par la côte, la fraîcheur du riad, les rooftops du soir et des journées plus lentes.' },
			{ title: "Profondeur d'automne", text: 'Parfait pour des routes culturelles plus riches, des moments food et des voyages plus réfléchis.' },
		],
		closingTitle: 'Pourquoi cette page compte',
		closingText:
			'Quand la page itinéraires paraît aboutie, le client a l’impression d’être guidé par du goût plutôt que par de l’automatisation. C’est exactement ce qui transforme la curiosité en confiance.',
	},
	es: {
		hero: {
			leading: 'Descubre Nuestra',
			accent: 'Mirada',
			trailing: 'Sobre Las Rutas',
			description:
				'Estos itinerarios ahora se leen como relatos de viaje pulidos, ayudando al visitante a sentir la lógica, la belleza y el ritmo emocional de cada recorrido por Marruecos.',
		},
		introTitle: 'Un gran itinerario vende una sensación, no solo una secuencia.',
		introText:
			'La página muestra ahora cómo piensa Trippple las rutas: no como listas de pasos, sino como movimientos bien compuestos entre ciudades, paisajes, pausas y transiciones memorables.',
		collections: [
			{ title: 'Escapadas centradas en ciudad', text: 'Rutas más cortas construidas sobre una identidad urbana fuerte, con espacio para cafés, patios, terrazas y paseos lentos.' },
			{ title: 'Conexiones imperiales', text: 'Viajes que permiten que las ciudades históricas dialoguen entre sí y creen ritmo entre arquitectura, memoria y atmósfera.' },
			{ title: 'Viajes de contraste', text: 'Rutas que pasan deliberadamente de la densidad de la medina al aire de la montaña, el silencio del desierto y la apertura de la costa.' },
		],
		featuredTitle: 'Cómo se narra una ruta premium',
		featuredText:
			'En lugar de enumerar destinos de forma mecánica, la ruta se presenta como una experiencia que se despliega. Cada día da más sentido al siguiente.',
		featuredDays: [
			{ title: 'El primer día fija el tono', text: 'La llegada no debe sentirse apresurada. El primer capítulo presenta gusto, confort y orientación.' },
			{ title: 'El segundo día abre la ciudad', text: 'Aquí es donde la cultura profunda, las texturas y los encuentros humanos empiezan a dar valor emocional.' },
			{ title: 'El tercer día amplía el horizonte', text: 'La ruta se abre hacia paisajes, vistas o pausas más serenas para evitar la repetición.' },
			{ title: 'El cuarto día deja una firma', text: 'Un itinerario premium termina con un momento que el viajero recordará con facilidad.' },
		],
		seasonTitle: 'La ruta también debe respetar la estación y el estado de ánimo.',
		seasonText:
			'Una buena escritura de itinerario demuestra que Trippple entiende la temperatura, la luz, el ritmo del flujo turístico y la diferencia emocional entre una escapada de primavera y un viaje de verano.',
		seasons: [
			{ title: 'Equilibrio de primavera', text: 'Ideal para ciudades imperiales, jardines, terrazas y paseos por la medina con suavidad y color.' },
			{ title: 'Contraste de verano', text: 'Funciona mejor cuando el calor se equilibra con costa, calma de riad, rooftops nocturnos y un ritmo más lento.' },
			{ title: 'Profundidad de otoño', text: 'Perfecto para rutas culturales más ricas, momentos gastronómicos y viajes más reflexivos.' },
		],
		closingTitle: 'Por qué esta página importa',
		closingText:
			'Cuando la página de itinerarios se siente acabada, el cliente percibe gusto y criterio, no automatización. Esa sensación es la que convierte la curiosidad en confianza.',
	},
	ar: {
		hero: {
			leading: 'اكتشف',
			accent: 'منطق',
			trailing: 'المسارات',
			description:
				'أصبحت هذه المسارات تُقرأ الآن كقصص سفر مصقولة، بحيث يشعر الزائر بمنطق كل طريق وجماله وإيقاعه العاطفي داخل المغرب.',
		},
		introTitle: 'المسار الرائع يبيع إحساسًا، لا مجرد ترتيب.',
		introText:
			'تعرض الصفحة الآن كيف يفكر Trippple في الرحلات: ليس كقائمة نقاط، بل كحركة مدروسة بين المدن والمناظر والتوقفات والانتقالات التي تبقى في الذاكرة.',
		collections: [
			{ title: 'هروب تقوده المدينة', text: 'مسارات أقصر مبنية على هوية حضرية قوية، مع مساحة للمقاهي والساحات والتراسات والمشي الهادئ.' },
			{ title: 'وصلات إمبراطورية', text: 'رحلات تجعل المدن التاريخية تتحدث مع بعضها لتخلق إيقاعًا بين العمارة والذاكرة والأجواء.' },
			{ title: 'سفر قائم على التباين', text: 'طرق تنتقل عمدًا من كثافة المدينة القديمة إلى هواء الجبال، وهدوء الصحراء، وانفتاح الساحل.' },
		],
		featuredTitle: 'كيف تُروى الرحلة الفاخرة',
		featuredText:
			'بدلًا من سرد الوجهات بشكل آلي، يصبح المسار تجربة تتكشف تدريجيًا. كل يوم يعطي اليوم الذي يليه معنى أكبر.',
		featuredDays: [
			{ title: 'اليوم الأول يحدد النبرة', text: 'الوصول لا يجب أن يكون متعجلًا. البداية الجيدة تقدم الذوق والراحة والاتجاه.' },
			{ title: 'اليوم الثاني يفتح المدينة', text: 'هنا تبدأ الثقافة العميقة والملمس الإنساني واللقاءات التي تصنع قيمة عاطفية.' },
			{ title: 'اليوم الثالث يوسع الأفق', text: 'يتجه المسار نحو مشاهد أوسع أو لحظات أكثر هدوءًا حتى لا تبدو الرحلة متكررة.' },
			{ title: 'اليوم الرابع يترك توقيعًا', text: 'الرحلة المميزة تنتهي بلحظة يسهل على المسافر تذكرها وحكيها.' },
		],
		seasonTitle: 'المسار الجيد يحترم أيضًا الفصل والمزاج.',
		seasonText:
			'الكتابة القوية للمسارات تثبت أن Trippple يفهم الحرارة والضوء وإيقاع الزوار والفرق العاطفي بين رحلة ربيعية داخل المدن وهروب صيفي خفيف.',
		seasons: [
			{ title: 'توازن الربيع', text: 'مثالي للمدن الإمبراطورية والحدائق والتراسات والمشي الهادئ في المدينة القديمة.' },
			{ title: 'تباين الصيف', text: 'ينجح أكثر عندما تتوازن الحرارة مع الساحل وهدوء الرياضات والأسطح المسائية والإيقاع الأبطأ.' },
			{ title: 'عمق الخريف', text: 'مناسب للمسارات الثقافية الأعمق ولحظات الطعام والرحلات الأكثر تأملًا.' },
		],
		closingTitle: 'لماذا تهم هذه الصفحة',
		closingText:
			'عندما تبدو صفحة المسارات مكتملة، يشعر العميل أنه موجه بذوق لا بآلية. وهذا بالضبط ما يحول التصفح إلى ثقة.',
	},
}

export default function Itineraries() {
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
				<div className='rounded-[36px] border border-zinc-200 bg-white p-8 shadow-[0_24px_70px_rgba(24,24,27,0.06)] lg:p-10'>
					<div className='max-w-3xl'>
						<div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600'>
							<Route className='h-3.5 w-3.5' />
							Itineraries
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.introTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.introText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-3'>
						{copy.collections.map((item) => (
							<article key={item.title} className='rounded-[28px] border border-zinc-200 bg-zinc-50/70 p-6'>
								<h3 className='text-lg font-semibold text-zinc-950'>{item.title}</h3>
								<p className='mt-3 text-sm leading-7 text-zinc-600'>{item.text}</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:py-8'>
				<div className='grid gap-6 lg:grid-cols-[0.92fr_1.08fr]'>
					<div className='rounded-[32px] border border-zinc-200 bg-zinc-950 p-8 text-white shadow-[0_24px_60px_rgba(24,24,27,0.18)]'>
						<div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300'>
							<Compass className='h-3.5 w-3.5' />
							Signature route
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em]'>{copy.featuredTitle}</h2>
						<p className='mt-4 text-sm leading-8 text-zinc-300'>{copy.featuredText}</p>
					</div>

					<div className='grid gap-4'>
						{copy.featuredDays.map((day, index) => (
							<article key={day.title} className='rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(24,24,27,0.05)]'>
								<div className='flex items-center gap-3'>
									<div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-500'>
										<Clock3 className='h-4.5 w-4.5' />
									</div>
									<div className='text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400'>0{index + 1}</div>
								</div>
								<h3 className='mt-4 text-lg font-semibold text-zinc-950'>{day.title}</h3>
								<p className='mt-3 text-sm leading-7 text-zinc-600'>{day.text}</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20'>
				<div className='rounded-[36px] border border-zinc-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_55%,#fafafa_100%)] p-8 shadow-[0_24px_70px_rgba(24,24,27,0.06)] lg:p-10'>
					<div className='max-w-3xl'>
						<h2 className='text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.seasonTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.seasonText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-3'>
						{copy.seasons.map((item, index) => {
							const icons = [SunMedium, Mountain, Compass]
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
