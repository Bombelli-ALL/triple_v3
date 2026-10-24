import { useTranslation } from 'react-i18next'
import { LifeBuoy, ShieldCheck, Compass } from 'lucide-react'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type FAQsCopy = {
	hero: { leading: string; accent: string; trailing: string; description: string }
	introTitle: string
	introText: string
	faqs: Array<{ question: string; answer: string }>
	closingTitle: string
	closingText: string
}

const copyByLocale: Record<AppLocale, FAQsCopy> = {
	en: {
		hero: {
			leading: 'Find The',
			accent: 'Answers',
			trailing: 'That Reassure',
			description:
				'FAQs is now designed as a reassurance page: calm, direct, and structured to remove hesitation while keeping the Trippple tone premium and clear.',
		},
		introTitle: 'A strong FAQ page answers doubt before it turns into hesitation.',
		introText:
			'This page is no longer just a support block. It now works as a confidence layer for the whole application, clarifying what Trippple is, how it helps, and why travelers can rely on it.',
		faqs: [
			{ question: 'What does Trippple actually help me do?', answer: 'Trippple helps travelers shape a Morocco trip with more clarity, stronger local context, and a more premium sense of direction from planning to on-the-ground decisions.' },
			{ question: 'Is the platform only useful before I travel?', answer: 'No. The application is positioned as a companion before, during, and around the journey, so that planning, orientation, and local reading all feel connected.' },
			{ question: 'Why does the app speak so much about local context?', answer: 'Because context creates confidence. Visitors do not only need locations; they need help understanding rhythm, etiquette, safety, and atmosphere.' },
			{ question: 'How should I read the Premium offer?', answer: 'Premium is framed as more comfort, more guidance, and more refined support, not simply as a bigger list of unlocked items.' },
			{ question: 'Do the editorial pages matter for conversion?', answer: 'Yes. They create trust, taste, and product maturity, which makes the customer imagine using the service instead of only scanning features.' },
			{ question: 'What makes Trippple different from a generic itinerary tool?', answer: 'Its positioning is more local, more emotionally guided, and more aware of the real texture of travel in Morocco.' },
		],
		closingTitle: 'The role of this page',
		closingText:
			'When the FAQ page feels polished, the whole product feels prepared. It tells the customer that Trippple has already thought through the questions they have not even asked yet.',
	},
	fr: {
		hero: {
			leading: 'Trouvez Des',
			accent: 'Réponses',
			trailing: 'Qui Rassurent',
			description:
				'FAQs devient une page de réassurance: calme, directe, et structurée pour lever les hésitations tout en gardant un ton premium et clair.',
		},
		introTitle: 'Une bonne FAQ répond au doute avant qu’il ne devienne un frein.',
		introText:
			'Cette page n’est plus un simple bloc support. Elle agit maintenant comme une couche de confiance pour toute l’application en expliquant ce qu’est Trippple, comment la plateforme aide, et pourquoi on peut s’y fier.',
		faqs: [
			{ question: 'À quoi Trippple m’aide concrètement ?', answer: 'Trippple aide à construire un voyage au Maroc avec plus de clarté, plus de contexte local et une direction plus premium de la préparation jusqu’aux décisions sur place.' },
			{ question: 'La plateforme sert-elle seulement avant le départ ?', answer: 'Non. L’application se positionne comme un compagnon avant, pendant et autour du voyage pour relier planning, orientation et lecture locale.' },
			{ question: 'Pourquoi l’app insiste-t-elle autant sur le contexte local ?', answer: 'Parce que le contexte crée la confiance. Les visiteurs n’ont pas seulement besoin de lieux, mais aussi de rythme, d’étiquette, de sécurité et d’ambiance.' },
			{ question: 'Comment faut-il comprendre l’offre Premium ?', answer: 'Premium est présenté comme plus de confort, plus de guidance et un accompagnement plus raffiné, pas seulement comme une liste d’options débloquées.' },
			{ question: 'Les pages éditoriales comptent-elles vraiment pour la conversion ?', answer: 'Oui. Elles installent la confiance, le goût et la maturité du produit, ce qui pousse le client à s’imaginer avec le service.' },
			{ question: 'Qu’est-ce qui différencie Trippple d’un outil d’itinéraire générique ?', answer: 'Son positionnement est plus local, plus émotionnellement guidé, et plus conscient de la vraie texture du voyage au Maroc.' },
		],
		closingTitle: 'Le rôle de cette page',
		closingText:
			'Quand la FAQ paraît soignée, tout le produit semble prêt. Elle fait comprendre au client que Trippple a déjà pensé aux questions qu’il ne s’est pas encore posées.',
	},
	es: {
		hero: {
			leading: 'Encuentra',
			accent: 'Respuestas',
			trailing: 'Que Tranquilizan',
			description:
				'FAQs se convierte en una página de confianza: tranquila, directa y estructurada para eliminar dudas sin perder el tono premium y claro de Trippple.',
		},
		introTitle: 'Una buena FAQ responde a la duda antes de que se convierta en freno.',
		introText:
			'Esta página ya no es solo un bloque de soporte. Ahora funciona como una capa de confianza para toda la aplicación, explicando qué es Trippple, cómo ayuda y por qué el viajero puede apoyarse en ella.',
		faqs: [
			{ question: '¿Para qué me ayuda realmente Trippple?', answer: 'Trippple ayuda a construir un viaje por Marruecos con más claridad, más contexto local y una dirección más premium desde la planificación hasta las decisiones en ruta.' },
			{ question: '¿La plataforma sirve solo antes del viaje?', answer: 'No. La aplicación se plantea como un acompañante antes, durante y alrededor de la experiencia para conectar planificación, orientación y lectura local.' },
			{ question: '¿Por qué la app insiste tanto en el contexto local?', answer: 'Porque el contexto genera confianza. El viajero no necesita solo lugares; necesita entender ritmo, etiqueta, seguridad y atmósfera.' },
			{ question: '¿Cómo debería leer la oferta Premium?', answer: 'Premium se presenta como más comodidad, más guía y un apoyo más refinado, no solo como una lista mayor de elementos desbloqueados.' },
			{ question: '¿Las páginas editoriales realmente ayudan a convertir?', answer: 'Sí. Generan confianza, gusto y madurez de producto, haciendo que el cliente imagine usar el servicio en lugar de solo comparar funciones.' },
			{ question: '¿Qué diferencia a Trippple de una herramienta genérica de itinerarios?', answer: 'Su posicionamiento es más local, más guiado emocionalmente y más consciente de la textura real del viaje en Marruecos.' },
		],
		closingTitle: 'El papel de esta página',
		closingText:
			'Cuando la FAQ se siente pulida, todo el producto parece preparado. Le dice al cliente que Trippple ya pensó en las preguntas que todavía no ha formulado.',
	},
	ar: {
		hero: {
			leading: 'اعثر على',
			accent: 'إجابات',
			trailing: 'تطمئنك',
			description:
				'تتحول FAQs إلى صفحة طمأنة: هادئة، مباشرة، ومصممة لإزالة التردد مع الحفاظ على نبرة Trippple الواضحة والراقية.',
		},
		introTitle: 'صفحة الأسئلة القوية تجيب عن الشك قبل أن يتحول إلى تردد.',
		introText:
			'لم تعد هذه الصفحة مجرد جزء دعم. إنها الآن طبقة ثقة للتطبيق كله، توضح ما هو Trippple، وكيف يساعد، ولماذا يمكن للمسافر الاعتماد عليه.',
		faqs: [
			{ question: 'ما الذي يساعدني Trippple على فعله فعليًا؟', answer: 'يساعد Trippple في بناء رحلة إلى المغرب بوضوح أكبر وسياق محلي أقوى وإحساس أكثر فخامة من التخطيط حتى القرارات أثناء الرحلة.' },
			{ question: 'هل المنصة مفيدة فقط قبل السفر؟', answer: 'لا. التطبيق متموضع كرفيق قبل الرحلة وأثناءها وحولها، بحيث يبقى التخطيط والفهم المحلي والتنقل مترابطين.' },
			{ question: 'لماذا يتحدث التطبيق كثيرًا عن السياق المحلي؟', answer: 'لأن السياق يصنع الثقة. فالمسافر لا يحتاج إلى الأماكن فقط، بل إلى فهم الإيقاع والآداب والأمان والأجواء.' },
			{ question: 'كيف يجب أن أفهم عرض Premium؟', answer: 'يُقدَّم Premium على أنه مزيد من الراحة والتوجيه والدعم المصقول، لا مجرد قائمة أكبر من العناصر المفتوحة.' },
			{ question: 'هل الصفحات التحريرية مهمة فعلًا للإقناع؟', answer: 'نعم. فهي تخلق الثقة والذوق ونضج المنتج، وتجعل العميل يتخيل نفسه يستخدم الخدمة بدلًا من مجرد مقارنة الوظائف.' },
			{ question: 'ما الذي يميز Trippple عن أداة رحلات عامة؟', answer: 'تموضعه أكثر محلية، وأكثر وعيًا بالعاطفة، وأكثر فهمًا لملمس السفر الحقيقي في المغرب.' },
		],
		closingTitle: 'دور هذه الصفحة',
		closingText:
			'عندما تبدو صفحة الأسئلة مصقولة، يبدو المنتج كله جاهزًا. فهي تقول للعميل إن Trippple فكّر مسبقًا في الأسئلة التي لم يطرحها بعد.',
	},
}

export default function FAQs() {
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
							<LifeBuoy className='h-3.5 w-3.5' />
							Support
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.introTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.introText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-2'>
						{copy.faqs.map((item, index) => {
							const icons = [Compass, ShieldCheck]
							const Icon = icons[index % 2] ?? Compass
							return (
								<article key={item.question} className='rounded-[28px] border border-zinc-200 bg-zinc-50/70 p-6'>
									<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm'>
										<Icon className='h-5 w-5' />
									</div>
									<h3 className='mt-4 text-lg font-semibold text-zinc-950'>{item.question}</h3>
									<p className='mt-3 text-sm leading-7 text-zinc-600'>{item.answer}</p>
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
