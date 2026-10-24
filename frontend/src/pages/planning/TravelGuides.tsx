import { useTranslation } from 'react-i18next'
import { BookOpen, Languages, ShieldCheck, Utensils } from 'lucide-react'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type GuidesCopy = {
	hero: {
		leading: string
		accent: string
		trailing: string
		description: string
	}
	introTitle: string
	introText: string
	categories: Array<{ title: string; text: string }>
	guideTitle: string
	guideText: string
	guideHighlights: Array<{ title: string; text: string }>
	phraseTitle: string
	phraseText: string
	phrases: string[]
	closingTitle: string
	closingText: string
}

const copyByLocale: Record<AppLocale, GuidesCopy> = {
	en: {
		hero: {
			leading: 'Travel With',
			accent: 'Local',
			trailing: 'Context',
			description:
				'Travel Guides now feel like a premium editorial library: cultural, useful, calming, and designed to make every Morocco decision feel more informed.',
		},
		introTitle: 'Good travel advice should lower anxiety and raise curiosity.',
		introText:
			'This page is built as a knowledge space rather than a content dump. It tells the traveler that Trippple understands not only where to go, but how Morocco is lived, interpreted, and navigated.',
		categories: [
			{ title: 'Culture and etiquette', text: 'Guidance that helps visitors move with respect, read the room, and appreciate Moroccan hospitality with confidence.' },
			{ title: 'Food and ritual', text: 'More than restaurant lists, this angle explains timing, table culture, tea moments, and how to recognize memorable local experiences.' },
			{ title: 'Safety and orientation', text: 'The tone reassures travelers with practical awareness, not fear, giving them the calm feeling of being well briefed.' },
		],
		guideTitle: 'What this guide section now communicates',
		guideText:
			'The content signals that the brand is well informed, locally grounded, and capable of making Morocco feel more readable to a first-time guest.',
		guideHighlights: [
			{ title: 'Before the trip', text: 'The traveler learns what to expect socially, culturally, and practically before stepping into the country.' },
			{ title: 'Inside the journey', text: 'Guides become a companion that explains moments the traveler is actively living: how to greet, order, negotiate, and move.' },
			{ title: 'After the first surprise', text: 'The page keeps its value because it helps the guest go beyond the obvious and notice texture, nuance, and meaning.' },
		],
		phraseTitle: 'Even a few words can change the emotional quality of a trip.',
		phraseText:
			'Small language touches make visitors feel more connected and more respectful. That alone makes the platform look more thoughtful.',
		phrases: ['Salam alaykum', 'Shukran', 'La bas?', 'Bslama', 'Atay b’naana', 'Inchallah'],
		closingTitle: 'Why this page elevates the application',
		closingText:
			'When the guide page feels mature, the whole product feels smarter. It turns Trippple from a planning tool into a travel companion with genuine local intelligence.',
	},
	fr: {
		hero: {
			leading: 'Voyager Avec',
			accent: 'Du',
			trailing: 'Contexte Local',
			description:
				'Travel Guides prend désormais la forme d’une bibliothèque éditoriale premium: culturelle, utile, rassurante, et conçue pour rendre chaque décision au Maroc plus éclairée.',
		},
		introTitle: 'Un bon guide doit réduire le stress et augmenter la curiosité.',
		introText:
			'La page fonctionne comme un espace de connaissance, pas comme un empilement de contenus. Elle montre que Trippple comprend non seulement où aller, mais aussi comment le Maroc se vit, se lit et se traverse.',
		categories: [
			{ title: 'Culture et étiquette', text: 'Des repères pour bouger avec respect, lire les codes, et apprécier l’hospitalité marocaine avec assurance.' },
			{ title: 'Cuisine et rituels', text: 'Au-delà des listes d’adresses, la page explique les moments, le rythme des repas, le thé, et la valeur des expériences locales.' },
			{ title: 'Sécurité et orientation', text: 'Le ton rassure avec une vigilance pratique, sans peur, pour donner la sensation d’être bien briefé.' },
		],
		guideTitle: 'Ce que raconte maintenant cette section',
		guideText:
			'Le contenu montre que la marque est informée, ancrée localement, et capable de rendre le Maroc plus lisible pour un premier voyageur.',
		guideHighlights: [
			{ title: 'Avant le départ', text: 'Le voyageur comprend ce qui l’attend sur le plan social, culturel et pratique avant même d’arriver.' },
			{ title: 'Pendant la route', text: 'Les guides deviennent un compagnon qui éclaire les situations vécues: saluer, commander, négocier, se déplacer.' },
			{ title: 'Après la première surprise', text: 'La page garde sa valeur parce qu’elle aide à aller au-delà de l’évidence et à remarquer les nuances.' },
		],
		phraseTitle: 'Quelques mots bien choisis changent déjà la qualité émotionnelle du voyage.',
		phraseText:
			'De petites touches de langue rendent l’expérience plus respectueuse et plus connectée. C’est aussi ce qui rend la plateforme plus fine.',
		phrases: ['Salam alaykum', 'Shukran', 'La bas?', 'Bslama', 'Atay b’naana', 'Inchallah'],
		closingTitle: "Pourquoi cette page élève toute l'application",
		closingText:
			'Quand la page guides semble aboutie, tout le produit paraît plus intelligent. Trippple ne ressemble plus seulement à un outil de planning, mais à un compagnon de voyage vraiment local.',
	},
	es: {
		hero: {
			leading: 'Viaja Con',
			accent: 'Contexto',
			trailing: 'Local',
			description:
				'Travel Guides adopta ahora la forma de una biblioteca editorial premium: cultural, útil, tranquilizadora y pensada para que cada decisión en Marruecos se sienta más clara.',
		},
		introTitle: 'Un buen consejo de viaje debe bajar la ansiedad y subir la curiosidad.',
		introText:
			'La página funciona como un espacio de conocimiento y no como una acumulación de contenido. Le dice al viajero que Trippple entiende no solo adónde ir, sino también cómo se vive y se interpreta Marruecos.',
		categories: [
			{ title: 'Cultura y etiqueta', text: 'Guías para moverse con respeto, leer mejor el entorno y disfrutar la hospitalidad marroquí con seguridad.' },
			{ title: 'Comida y ritual', text: 'Más que listas de restaurantes, esta mirada explica momentos, horarios, té, mesa y señales de una experiencia local memorable.' },
			{ title: 'Seguridad y orientación', text: 'El tono tranquiliza con atención práctica, no con miedo, dando la sensación de estar bien acompañado.' },
		],
		guideTitle: 'Lo que ahora comunica esta sección',
		guideText:
			'El contenido deja claro que la marca está bien informada, conectada con lo local y preparada para hacer que Marruecos se sienta más legible para un visitante nuevo.',
		guideHighlights: [
			{ title: 'Antes del viaje', text: 'El viajero entiende qué esperar a nivel social, cultural y práctico antes de llegar.' },
			{ title: 'Dentro de la experiencia', text: 'Las guías funcionan como un acompañamiento que explica momentos reales: saludar, pedir, negociar y desplazarse.' },
			{ title: 'Después de la primera sorpresa', text: 'La página sigue siendo valiosa porque ayuda a ver textura, matices y significado más allá de lo evidente.' },
		],
		phraseTitle: 'Unas pocas palabras pueden cambiar la calidad emocional del viaje.',
		phraseText:
			'Pequeños gestos lingüísticos hacen que el visitante se sienta más conectado y más respetuoso. Eso también hace que la plataforma parezca más pensada.',
		phrases: ['Salam alaykum', 'Shukran', 'La bas?', 'Bslama', 'Atay b’naana', 'Inchallah'],
		closingTitle: 'Por qué esta página eleva la aplicación',
		closingText:
			'Cuando la página de guías se siente madura, todo el producto se siente más inteligente. Trippple deja de parecer solo una herramienta de planificación y pasa a ser un compañero de viaje con criterio local.',
	},
	ar: {
		hero: {
			leading: 'سافر',
			accent: 'بسياق',
			trailing: 'محلي',
			description:
				'تأخذ Travel Guides الآن شكل مكتبة تحريرية فاخرة: ثقافية، مفيدة، مطمئنة، ومصممة لتجعل كل قرار في المغرب أكثر وضوحًا.',
		},
		introTitle: 'النصيحة الجيدة في السفر يجب أن تخفف القلق وتزيد الفضول.',
		introText:
			'هذه الصفحة ليست تجميعًا للمحتوى، بل مساحة معرفة. وهي تقول للمسافر إن Trippple لا يعرف فقط أين يذهب، بل يفهم أيضًا كيف يُعاش المغرب ويُقرأ ويُتنقل فيه.',
		categories: [
			{ title: 'الثقافة وآداب التعامل', text: 'إرشادات تساعد الزائر على التحرك باحترام وقراءة الأجواء وفهم الضيافة المغربية بثقة.' },
			{ title: 'الطعام والطقوس', text: 'أكثر من مجرد عناوين مطاعم، فالصفحة تشرح توقيتات الأكل، والجلوس، والشاي، وما الذي يجعل التجربة المحلية لا تُنسى.' },
			{ title: 'الأمان وفهم المكان', text: 'النبرة تطمئن المسافر بوعي عملي لا بالخوف، وتمنحه إحساسًا بأنه مهيأ جيدًا.' },
		],
		guideTitle: 'ما الذي تقوله هذه الصفحة الآن',
		guideText:
			'المحتوى يثبت أن العلامة مطلعة ومرتبطة بالمحلي وقادرة على جعل المغرب أكثر قابلية للفهم بالنسبة للزائر لأول مرة.',
		guideHighlights: [
			{ title: 'قبل الرحلة', text: 'يتعرف المسافر على ما ينتظره اجتماعيًا وثقافيًا وعمليًا قبل أن يصل.' },
			{ title: 'داخل الرحلة', text: 'تتحول الأدلة إلى رفيق يشرح اللحظات الحية: كيف يحيي ويطلب ويتفاوض ويتنقل.' },
			{ title: 'بعد الدهشة الأولى', text: 'تحافظ الصفحة على قيمتها لأنها تساعد الضيف على رؤية المعنى والتفاصيل وراء الواضح.' },
		],
		phraseTitle: 'حتى بضع كلمات يمكن أن تغيّر الجودة العاطفية للرحلة.',
		phraseText:
			'اللمسات اللغوية الصغيرة تجعل الزائر أكثر اتصالًا وأكثر احترامًا. وهذا وحده يجعل المنصة تبدو أكثر ذكاءً.',
		phrases: ['Salam alaykum', 'Shukran', 'La bas?', 'Bslama', 'Atay b’naana', 'Inchallah'],
		closingTitle: 'لماذا ترفع هذه الصفحة قيمة التطبيق',
		closingText:
			'عندما تبدو صفحة الأدلة ناضجة، يبدو المنتج كله أذكى. وهكذا تتحول Trippple من أداة تخطيط فقط إلى رفيق سفر يملك معرفة محلية حقيقية.',
	},
}

export default function TravelGuides() {
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
				<div className='grid gap-6 lg:grid-cols-[0.92fr_1.08fr]'>
					<div className='rounded-[32px] border border-zinc-200 bg-zinc-950 p-8 text-white shadow-[0_24px_60px_rgba(24,24,27,0.18)]'>
						<div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300'>
							<BookOpen className='h-3.5 w-3.5' />
							Guides
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em]'>{copy.introTitle}</h2>
						<p className='mt-4 text-sm leading-8 text-zinc-300'>{copy.introText}</p>
					</div>

					<div className='grid gap-4'>
						{copy.categories.map((item, index) => {
							const icons = [Languages, Utensils, ShieldCheck]
							const Icon = icons[index] ?? BookOpen
							return (
								<article key={item.title} className='rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(24,24,27,0.05)]'>
									<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500'>
										<Icon className='h-5 w-5' />
									</div>
									<h3 className='mt-4 text-lg font-semibold text-zinc-950'>{item.title}</h3>
									<p className='mt-3 text-sm leading-7 text-zinc-600'>{item.text}</p>
								</article>
							)
						})}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:py-8'>
				<div className='rounded-[36px] border border-zinc-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_45%,#fafafa_100%)] p-8 shadow-[0_24px_70px_rgba(24,24,27,0.06)] lg:p-10'>
					<div className='max-w-3xl'>
						<h2 className='text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.guideTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.guideText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-3'>
						{copy.guideHighlights.map((item) => (
							<article key={item.title} className='rounded-[28px] border border-white/90 bg-white/90 p-6 backdrop-blur'>
								<h3 className='text-lg font-semibold text-zinc-950'>{item.title}</h3>
								<p className='mt-3 text-sm leading-7 text-zinc-600'>{item.text}</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className='mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20'>
				<div className='grid gap-6 lg:grid-cols-[1.02fr_0.98fr]'>
					<div className='rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(24,24,27,0.06)]'>
						<h2 className='text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.phraseTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.phraseText}</p>
						<div className='mt-8 flex flex-wrap gap-3'>
							{copy.phrases.map((phrase) => (
								<span key={phrase} className='rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700'>
									{phrase}
								</span>
							))}
						</div>
					</div>

					<div className='rounded-[32px] border border-zinc-200 bg-zinc-950 p-8 text-white shadow-[0_24px_60px_rgba(24,24,27,0.18)]'>
						<h3 className='text-3xl font-semibold tracking-[-0.05em]'>{copy.closingTitle}</h3>
						<p className='mt-4 text-sm leading-8 text-zinc-300'>{copy.closingText}</p>
					</div>
				</div>
			</section>
		</EditorialPageLayout>
	)
}
