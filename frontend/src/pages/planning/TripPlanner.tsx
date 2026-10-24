import { useTranslation } from 'react-i18next'
import { Compass, Gem, MapPinned, Star, TimerReset } from 'lucide-react'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type TripPlannerCopy = {
	hero: {
		leading: string
		accent: string
		trailing: string
		description: string
	}
	introTitle: string
	introText: string
	promises: Array<{ title: string; text: string }>
	narrativeTitle: string
	narrativeText: string
	narrativeSteps: Array<{ title: string; text: string }>
	styleTitle: string
	styleText: string
	styles: string[]
	closingTitle: string
	closingText: string
}

const copyByLocale: Record<AppLocale, TripPlannerCopy> = {
	en: {
		hero: {
			leading: 'Shape Your',
			accent: 'Moroccan',
			trailing: 'Trip Story',
			description:
				'Trip Planner is the editorial heart of your route: clear, local, reassuring, and designed to turn scattered travel ideas into a premium Morocco narrative.',
		},
		introTitle: 'A plan should feel intelligent before it feels busy.',
		introText:
			'This page now speaks like a trusted planner. Instead of asking visitors to fill fields immediately, it explains what a great Morocco trip needs: rhythm, local context, and a sense of confidence from the very first day.',
		promises: [
			{ title: 'Clear from the start', text: 'The route begins with strong orientation, so visitors understand where they are going and why each stop matters.' },
			{ title: 'Local in tone', text: 'Every suggestion is framed with Moroccan texture: medinas, terraces, artisan districts, day pacing, and cultural nuance.' },
			{ title: 'Comfort without overload', text: 'The language stays premium and useful, helping travelers feel guided without drowning them in options.' },
		],
		narrativeTitle: 'What the planning experience now communicates',
		narrativeText:
			'The message is simple: Trippple does not just generate movement from one point to another. It shapes a journey that feels considered, elegant, and emotionally easy to trust.',
		narrativeSteps: [
			{ title: 'Before arrival', text: 'The tone prepares guests for Morocco with clarity, warmth, and a sense of anticipation rather than stress.' },
			{ title: 'During the route', text: 'The story of the trip balances iconic moments with quieter discoveries, giving the itinerary more character and depth.' },
			{ title: 'After the plan is set', text: 'The visitor should feel that their route is coherent, memorable, and shaped for a premium experience instead of a generic checklist.' },
		],
		styleTitle: 'Planning styles we can speak to',
		styleText:
			'The editorial direction stays flexible enough to support different traveler personalities while keeping one polished brand voice.',
		styles: ['Slow medina days', 'Refined food moments', 'Desert contrast', 'Imperial city flow', 'Design-led stays', 'Soft luxury pacing'],
		closingTitle: 'The final impression',
		closingText:
			'A strong planner page makes the customer feel seen. It suggests that the trip will be organized with taste, paced with care, and shaped by people who understand how Morocco should be experienced.',
	},
	fr: {
		hero: {
			leading: 'Dessinez Votre',
			accent: 'Voyage',
			trailing: 'Marocain',
			description:
				'Trip Planner devient ici le cœur éditorial du parcours: clair, local, rassurant, et pensé pour transformer une idée de voyage en récit premium au Maroc.',
		},
		introTitle: 'Un bon plan doit paraître intelligent avant de paraître chargé.',
		introText:
			'Cette page parle maintenant comme un vrai planificateur de confiance. Au lieu de pousser le visiteur vers des champs à remplir, elle explique ce qu’un grand voyage au Maroc demande: du rythme, du contexte local, et un sentiment de sérénité dès le départ.',
		promises: [
			{ title: 'Clair dès les premières lignes', text: 'L’itinéraire commence avec une orientation solide pour que le visiteur comprenne la logique du voyage.' },
			{ title: 'Vraiment ancré au Maroc', text: 'Le ton évoque les médinas, les terrasses, les artisans, les pauses justes et la nuance culturelle.' },
			{ title: 'Premium sans surcharge', text: 'Le discours reste élégant et utile pour guider sans noyer le client sous des choix artificiels.' },
		],
		narrativeTitle: 'Ce que l’expérience de planning raconte désormais',
		narrativeText:
			'Le message devient simple: Trippple ne relie pas juste des points sur une carte. La plateforme compose un voyage cohérent, élégant et facile à faire confiance.',
		narrativeSteps: [
			{ title: "Avant l'arrivée", text: 'Le ton prépare le voyageur au Maroc avec clarté, chaleur et envie, sans créer de stress.' },
			{ title: 'Pendant le parcours', text: 'Le récit équilibre les grands incontournables et les découvertes plus calmes pour donner du relief à la route.' },
			{ title: 'Une fois le plan posé', text: 'Le visiteur doit sentir que sa route est cohérente, mémorable et pensée pour une vraie expérience premium.' },
		],
		styleTitle: 'Les styles de voyage que cette page peut porter',
		styleText:
			'La direction éditoriale reste assez souple pour parler à plusieurs profils de voyageurs tout en gardant une seule voix de marque.',
		styles: ['Journées médina lentes', 'Moments food raffinés', 'Contraste désert', 'Flux des villes impériales', 'Séjours design', 'Rythme soft luxury'],
		closingTitle: 'L’impression finale',
		closingText:
			'Une bonne page de planning donne au client le sentiment d’être compris. Elle laisse penser que son voyage sera organisé avec goût, rythmé avec soin, et conçu par des gens qui savent comment le Maroc se vit.',
	},
	es: {
		hero: {
			leading: 'Diseña Tu',
			accent: 'Viaje',
			trailing: 'Marroquí',
			description:
				'Trip Planner se convierte aquí en el corazón editorial del recorrido: claro, local, tranquilizador y pensado para transformar una idea de viaje en una historia premium por Marruecos.',
		},
		introTitle: 'Un buen plan debe sentirse inteligente antes de sentirse lleno.',
		introText:
			'Ahora esta página habla como un planificador de confianza. En lugar de empujar al visitante hacia formularios, explica lo que necesita un gran viaje por Marruecos: ritmo, contexto local y sensación de seguridad desde el primer momento.',
		promises: [
			{ title: 'Claridad desde el inicio', text: 'La ruta empieza con una orientación fuerte para que el visitante entienda hacia dónde va y por qué cada parada importa.' },
			{ title: 'Tono realmente local', text: 'La narrativa respira Marruecos: medinas, terrazas, artesanos, pausas bien elegidas y matices culturales.' },
			{ title: 'Premium sin ruido', text: 'El lenguaje sigue siendo elegante y útil, guiando sin saturar al cliente con opciones vacías.' },
		],
		narrativeTitle: 'Lo que ahora comunica la experiencia de planificación',
		narrativeText:
			'El mensaje es simple: Trippple no solo mueve al viajero de un punto a otro. Construye un viaje coherente, atractivo y fácil de confiar.',
		narrativeSteps: [
			{ title: 'Antes de llegar', text: 'El tono prepara al viajero para Marruecos con claridad, calidez y expectativa, no con estrés.' },
			{ title: 'Durante la ruta', text: 'La historia del viaje equilibra momentos icónicos con descubrimientos más tranquilos para dar más carácter al itinerario.' },
			{ title: 'Cuando el plan ya está definido', text: 'El visitante debe sentir que su ruta es coherente, memorable y diseñada para una experiencia premium.' },
		],
		styleTitle: 'Estilos de viaje a los que puede hablar esta página',
		styleText:
			'La dirección editorial es flexible para acompañar distintas personalidades viajeras manteniendo una sola voz refinada.',
		styles: ['Días lentos de medina', 'Momentos gastronómicos refinados', 'Contraste del desierto', 'Flujo de ciudades imperiales', 'Estancias con diseño', 'Ritmo soft luxury'],
		closingTitle: 'La impresión final',
		closingText:
			'Una gran página de planificación hace que el cliente se sienta comprendido. Sugiere que su viaje será organizado con gusto, medido con cuidado y pensado por personas que saben cómo debe vivirse Marruecos.',
	},
	ar: {
		hero: {
			leading: 'اصنع',
			accent: 'رحلتك',
			trailing: 'المغربية',
			description:
				'تتحول صفحة Trip Planner هنا إلى القلب التحريري للرحلة: واضحة، محلية، مطمئنة، ومصممة لتحويل فكرة السفر إلى قصة مغربية فاخرة.',
		},
		introTitle: 'الخطة الجيدة يجب أن تبدو ذكية قبل أن تبدو مزدحمة.',
		introText:
			'هذه الصفحة تتحدث الآن كأنها مخطط موثوق. بدلًا من دفع الزائر مباشرة إلى نماذج وحقول، تشرح له ما الذي يصنع رحلة مغربية ممتازة: الإيقاع، والسياق المحلي، والشعور بالاطمئنان منذ البداية.',
		promises: [
			{ title: 'وضوح من أول لحظة', text: 'يبدأ المسار بإحساس واضح بالاتجاه حتى يفهم الزائر إلى أين يذهب ولماذا لكل محطة قيمة.' },
			{ title: 'نبرة مغربية حقيقية', text: 'الخطاب يحمل روح المغرب: المدينة القديمة، التراسات، الحرفيون، وتفاصيل الثقافة اليومية.' },
			{ title: 'فخامة بلا فوضى', text: 'اللغة تبقى راقية ومفيدة، تقود العميل دون أن تغرقه بخيارات وهمية.' },
		],
		narrativeTitle: 'ما الذي تقوله تجربة التخطيط الآن',
		narrativeText:
			'الرسالة أصبحت واضحة: Trippple لا ينقل المسافر من نقطة إلى نقطة فقط، بل يصوغ رحلة متماسكة وأنيقة وسهلة الثقة.',
		narrativeSteps: [
			{ title: 'قبل الوصول', text: 'النبرة تهيئ المسافر للمغرب بوضوح ودفء وشعور بالحماس بدل القلق.' },
			{ title: 'أثناء المسار', text: 'قصة الرحلة توازن بين اللحظات الأيقونية والاكتشافات الهادئة لتعطي المسار عمقًا وشخصية.' },
			{ title: 'بعد تثبيت الخطة', text: 'يجب أن يشعر الزائر بأن رحلته متماسكة ولا تُنسى ومصممة لتجربة مميزة فعلًا.' },
		],
		styleTitle: 'أنماط السفر التي يمكن أن تتحدث لها الصفحة',
		styleText:
			'الاتجاه التحريري مرن بما يكفي ليخاطب شخصيات سفر مختلفة مع الحفاظ على صوت علامة واحد وأنيق.',
		styles: ['أيام مدينة عتيقة هادئة', 'لحظات طعام راقية', 'تباين الصحراء', 'سلاسة المدن الإمبراطورية', 'إقامات بتصميم جميل', 'إيقاع soft luxury'],
		closingTitle: 'الانطباع الأخير',
		closingText:
			'الصفحة القوية في التخطيط تجعل العميل يشعر بأنه مفهوم. وتوحي له بأن رحلته ستُنظم بذوق، وتُوزن بعناية، ويصممها أشخاص يعرفون كيف يجب أن يُعاش المغرب.',
	},
}

export default function TripPlanner() {
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
				<div className='grid gap-8 lg:grid-cols-[1.15fr_0.85fr]'>
					<div className='rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_22px_60px_rgba(24,24,27,0.06)]'>
						<div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600'>
							<Compass className='h-3.5 w-3.5' />
							Planning
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.introTitle}</h2>
						<p className='mt-4 max-w-3xl text-base leading-8 text-zinc-600'>{copy.introText}</p>
					</div>

					<div className='grid gap-4'>
						{copy.promises.map((item, index) => {
							const icons = [MapPinned, Gem, TimerReset]
							const Icon = icons[index] ?? Star
							return (
								<article key={item.title} className='rounded-[28px] border border-zinc-200 bg-zinc-50/70 p-6 shadow-[0_16px_40px_rgba(24,24,27,0.04)]'>
									<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm'>
										<Icon className='h-5 w-5' />
									</div>
									<h3 className='mt-4 text-lg font-semibold text-zinc-950'>{item.title}</h3>
									<p className='mt-2 text-sm leading-7 text-zinc-600'>{item.text}</p>
								</article>
							)
						})}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:py-8'>
				<div className='rounded-[36px] border border-zinc-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_45%,#fafafa_100%)] p-8 shadow-[0_24px_70px_rgba(24,24,27,0.06)] lg:p-10'>
					<div className='max-w-3xl'>
						<div className='inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600'>
							<Star className='h-3.5 w-3.5 text-orange-500' />
							Editorial flow
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.narrativeTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.narrativeText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-3'>
						{copy.narrativeSteps.map((step, index) => (
							<article key={step.title} className='rounded-[26px] border border-white/90 bg-white/90 p-6 shadow-sm backdrop-blur'>
								<div className='text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500'>0{index + 1}</div>
								<h3 className='mt-4 text-lg font-semibold text-zinc-950'>{step.title}</h3>
								<p className='mt-3 text-sm leading-7 text-zinc-600'>{step.text}</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20'>
				<div className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
					<div className='rounded-[32px] border border-zinc-200 bg-zinc-950 p-8 text-white shadow-[0_24px_60px_rgba(24,24,27,0.18)]'>
						<h2 className='text-3xl font-semibold tracking-[-0.05em]'>{copy.styleTitle}</h2>
						<p className='mt-4 text-sm leading-8 text-zinc-300'>{copy.styleText}</p>
					</div>

					<div className='rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)]'>
						<div className='flex flex-wrap gap-3'>
							{copy.styles.map((style) => (
								<span key={style} className='rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700'>
									{style}
								</span>
							))}
						</div>
						<h3 className='mt-8 text-2xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.closingTitle}</h3>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.closingText}</p>
					</div>
				</div>
			</section>
		</EditorialPageLayout>
	)
}
