import { useTranslation } from 'react-i18next'
import { Drum, Music2, Compass, TentTree } from 'lucide-react'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type FestivalCopy = {
	hero: { leading: string; accent: string; trailing: string; description: string }
	introTitle: string
	introText: string
	pillars: Array<{ title: string; text: string }>
	calendarTitle: string
	calendarText: string
	seasons: Array<{ title: string; text: string }>
	closingTitle: string
	closingText: string
}

const copyByLocale: Record<AppLocale, FestivalCopy> = {
	en: {
		hero: {
			leading: 'Enter The',
			accent: 'Festival',
			trailing: 'Calendar',
			description:
				'Festival Guide now reads like cultural curation: less like a ticket board, more like an invitation to experience Morocco through music, gathering, and atmosphere.',
		},
		introTitle: 'A festival page should feel cultural before it feels commercial.',
		introText:
			'This page now positions festivals as moments of identity. It tells the visitor that Morocco is not only a destination to visit, but a place to hear, feel, and join for a few unforgettable days.',
		pillars: [
			{ title: 'Sacred and soulful', text: 'Some festivals carry memory, spirituality, and the feeling of listening inside historic space.' },
			{ title: 'Open-air and social', text: 'Others feel larger, louder, and more urban, giving travelers a stronger sense of public summer energy.' },
			{ title: 'Regional and rooted', text: 'The strongest editorial angle reminds visitors that each city celebrates differently, with its own rhythm and cultural code.' },
		],
		calendarTitle: 'What the festival calendar should communicate',
		calendarText:
			'It should make clear that timing changes the whole trip. A route built around a festival feels more vivid, more emotional, and more unique than a standard stay.',
		seasons: [
			{ title: 'Spring openings', text: 'The season starts with refinement, world music, sacred tones, and city culture at a gentler pace.' },
			{ title: 'Summer peak', text: 'This is the moment for open-air stages, beach crowds, late nights, and high-energy city atmospheres.' },
			{ title: 'Late-season depth', text: 'Toward the end of summer, festivals can feel richer, more selective, and more tied to place than spectacle.' },
		],
		closingTitle: 'The final signal to the customer',
		closingText:
			'When this page feels curated, the application suggests cultural intelligence. It tells the traveler that Trippple understands when a trip should revolve around a moment, not just a map.',
	},
	fr: {
		hero: {
			leading: 'Entrez Dans',
			accent: 'Le',
			trailing: 'Calendrier Des Festivals',
			description:
				'Festival Guide se lit maintenant comme une vraie curation culturelle: moins comme un tableau de tickets, davantage comme une invitation à vivre le Maroc par la musique et les rassemblements.',
		},
		introTitle: 'Une page festivals doit paraître culturelle avant de paraître commerciale.',
		introText:
			'La page place désormais les festivals comme des moments d’identité. Elle dit au visiteur que le Maroc n’est pas seulement une destination à voir, mais un lieu à entendre et à ressentir.',
		pillars: [
			{ title: 'Sacré et sensible', text: 'Certains festivals portent la mémoire, la spiritualité et le sentiment d’écouter dans un lieu chargé d’histoire.' },
			{ title: 'Open air et collectif', text: 'D’autres sont plus vastes, plus urbains, plus bruyants, et donnent une vraie énergie publique d’été.' },
			{ title: 'Régional et enraciné', text: 'La meilleure lecture éditoriale rappelle que chaque ville célèbre autrement, avec son propre code culturel.' },
		],
		calendarTitle: 'Ce que le calendrier doit faire comprendre',
		calendarText:
			'Il doit montrer que le timing change toute la nature du voyage. Une route pensée autour d’un festival devient plus vive, plus émotionnelle et plus singulière.',
		seasons: [
			{ title: 'Ouvertures de printemps', text: 'La saison démarre avec plus de finesse, de musiques du monde et de culture urbaine posée.' },
			{ title: "Pic d'été", text: 'C’est le moment des scènes en plein air, des foules du soir et d’une ville plus électrique.' },
			{ title: 'Fin de saison plus profonde', text: 'Vers la fin de l’été, les festivals peuvent sembler plus choisis, plus riches, et plus liés au lieu qu’au simple spectacle.' },
		],
		closingTitle: 'Le signal final envoyé au client',
		closingText:
			'Quand cette page paraît bien curée, toute l’application gagne en intelligence culturelle. Elle montre que Trippple sait quand un voyage doit tourner autour d’un moment plutôt que d’une simple carte.',
	},
	es: {
		hero: {
			leading: 'Entra En',
			accent: 'El',
			trailing: 'Calendario De Festivales',
			description:
				'Festival Guide se lee ahora como una curación cultural real: menos como un tablón de entradas y más como una invitación a vivir Marruecos a través de la música y el encuentro.',
		},
		introTitle: 'Una página de festivales debe sentirse cultural antes que comercial.',
		introText:
			'La página presenta ahora los festivales como momentos de identidad. Le dice al visitante que Marruecos no es solo un destino para ver, sino un lugar para escuchar y compartir.',
		pillars: [
			{ title: 'Sagrado y sensible', text: 'Algunos festivales llevan memoria, espiritualidad y la sensación de escuchar dentro de un espacio histórico.' },
			{ title: 'Abierto y social', text: 'Otros son más grandes, más urbanos y más sonoros, y transmiten mejor la energía pública del verano.' },
			{ title: 'Regional y arraigado', text: 'El mejor ángulo editorial recuerda que cada ciudad celebra de forma distinta, con su propio código cultural.' },
		],
		calendarTitle: 'Lo que debe comunicar el calendario',
		calendarText:
			'Debe dejar claro que el momento del viaje cambia toda la experiencia. Una ruta construida alrededor de un festival se siente más viva y más singular.',
		seasons: [
			{ title: 'Aperturas de primavera', text: 'La temporada empieza con más refinamiento, músicas del mundo y cultura urbana a un ritmo suave.' },
			{ title: 'Pico de verano', text: 'Es el momento de escenarios al aire libre, noches largas y ciudades con mucha energía.' },
			{ title: 'Profundidad al final de temporada', text: 'Hacia el final del verano, los festivales pueden sentirse más selectivos y más conectados con el lugar.' },
		],
		closingTitle: 'La señal final para el cliente',
		closingText:
			'Cuando esta página se siente curada, toda la aplicación parece culturalmente más inteligente. Muestra que Trippple sabe cuándo un viaje debe girar alrededor de un momento y no solo de un mapa.',
	},
	ar: {
		hero: {
			leading: 'ادخل إلى',
			accent: 'رزنامة',
			trailing: 'المهرجانات',
			description:
				'تُقرأ Festival Guide الآن كتنسيق ثقافي حقيقي: أقل شبهًا بلوحة تذاكر وأكثر قربًا من دعوة لعيش المغرب عبر الموسيقى والتجمع والأجواء.',
		},
		introTitle: 'صفحة المهرجانات يجب أن تبدو ثقافية قبل أن تبدو تجارية.',
		introText:
			'تقدّم الصفحة الآن المهرجانات كلحظات هوية. وتقول للزائر إن المغرب ليس فقط مكانًا يُزار، بل مكان يُسمع ويُعاش ويُشارك.',
		pillars: [
			{ title: 'روحي وعميق', text: 'بعض المهرجانات يحمل الذاكرة والروحانية وإحساس الاستماع داخل فضاء تاريخي.' },
			{ title: 'مفتوح واجتماعي', text: 'وبعضها الآخر أوسع وأكثر حضرية وصخبًا، ويعطي طاقة صيفية جماعية أقوى.' },
			{ title: 'محلي ومتجذر', text: 'أفضل زاوية تحريرية تذكّر بأن كل مدينة تحتفل بطريقتها وإيقاعها الخاص.' },
		],
		calendarTitle: 'ما الذي يجب أن تقوله الروزنامة',
		calendarText:
			'يجب أن تُظهر أن توقيت الرحلة يغيّر طبيعتها بالكامل. فالمسار المبني حول مهرجان يبدو أكثر حياة وأقوى عاطفيًا وأكثر فرادة.',
		seasons: [
			{ title: 'بدايات الربيع', text: 'تبدأ المرحلة بنبرة أكثر رقيًا وموسيقى عالمية وثقافة مدينية أكثر هدوءًا.' },
			{ title: 'ذروة الصيف', text: 'هنا تأتي المسارح المفتوحة والليالي الطويلة والطاقة العالية في المدن.' },
			{ title: 'عمق نهاية الموسم', text: 'في آخر الصيف قد تبدو المهرجانات أكثر انتقائية وأكثر ارتباطًا بالمكان من مجرد العرض.' },
		],
		closingTitle: 'الإشارة الأخيرة للعميل',
		closingText:
			'عندما تبدو هذه الصفحة منسقة جيدًا، توحي بأن التطبيق يملك ذكاءً ثقافيًا. وتُظهر أن Trippple يعرف متى يجب أن تدور الرحلة حول لحظة لا حول خريطة فقط.',
	},
}

export default function FestivalGuide() {
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
					<div className='rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_22px_60px_rgba(24,24,27,0.06)]'>
						<div className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600'>
							<Music2 className='h-3.5 w-3.5' />
							Festival mood
						</div>
						<h2 className='mt-5 text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.introTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.introText}</p>
					</div>

					<div className='grid gap-4'>
						{copy.pillars.map((item) => (
							<article key={item.title} className='rounded-[28px] border border-zinc-200 bg-zinc-50/70 p-6'>
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
						<h2 className='text-3xl font-semibold tracking-[-0.05em] text-zinc-950'>{copy.calendarTitle}</h2>
						<p className='mt-4 text-base leading-8 text-zinc-600'>{copy.calendarText}</p>
					</div>

					<div className='mt-10 grid gap-4 lg:grid-cols-3'>
						{copy.seasons.map((item, index) => {
							const icons = [Compass, TentTree, Drum]
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
