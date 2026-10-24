import { useTranslation } from 'react-i18next'
import PlanCards from '@/components/PlanCards'
import MarketingPageHero from '@/components/MarketingPageHero'
import EditorialPageLayout from '@/components/EditorialPageLayout'
import { resolveAppLocale, type AppLocale } from '@/lib/locale'

type PricingCopy = {
	hero: { leading: string; accent: string; trailing: string; description: string }
	faqTitle: string
	faq: Array<{ q: string; a: string }>
}

const copyByLocale: Record<AppLocale, PricingCopy> = {
	en: {
		hero: { leading: 'Simple', accent: 'pricing', trailing: '', description: 'Plan your trips for free. Premium comes with an invite code from the Trippple team.' },
		faqTitle: 'Questions',
		faq: [
			{ q: 'How do I get Premium?', a: 'Enter an invite code when you sign up, or on this page once you are signed in. Each code gives you one month of Premium.' },
			{ q: 'Where do I find a code?', a: 'Codes are shared by the Trippple team, for example at events or through partners. Ask us if you would like one.' },
			{ q: 'What happens when Premium ends?', a: 'You go back to the Free plan. Your trips, groups and settings stay exactly as they are.' },
		],
	},
	fr: {
		hero: { leading: 'Des prix', accent: 'simples', trailing: '', description: 'Planifiez vos voyages gratuitement. Premium s’obtient avec un code d’invitation de l’équipe Trippple.' },
		faqTitle: 'Questions',
		faq: [
			{ q: 'Comment obtenir Premium ?', a: 'Saisissez un code d’invitation à l’inscription, ou sur cette page une fois connecté. Chaque code donne un mois de Premium.' },
			{ q: 'Où trouver un code ?', a: 'Les codes sont partagés par l’équipe Trippple, par exemple lors d’événements ou via des partenaires. Demandez-nous si vous en voulez un.' },
			{ q: 'Que se passe-t-il à la fin de Premium ?', a: 'Vous revenez au plan gratuit. Vos voyages, groupes et réglages restent intacts.' },
		],
	},
	es: {
		hero: { leading: 'Precios', accent: 'sencillos', trailing: '', description: 'Planifica tus viajes gratis. Premium se consigue con un código de invitación del equipo de Trippple.' },
		faqTitle: 'Preguntas',
		faq: [
			{ q: '¿Cómo consigo Premium?', a: 'Introduce un código de invitación al registrarte, o en esta página una vez dentro. Cada código da un mes de Premium.' },
			{ q: '¿Dónde encuentro un código?', a: 'El equipo de Trippple comparte los códigos, por ejemplo en eventos o con socios. Pídenos uno si te interesa.' },
			{ q: '¿Qué pasa cuando termina Premium?', a: 'Vuelves al plan gratuito. Tus viajes, grupos y ajustes se quedan como están.' },
		],
	},
	ar: {
		hero: { leading: 'أسعار', accent: 'بسيطة', trailing: '', description: 'خطط لرحلاتك مجانًا. يمكنك الحصول على Premium برمز دعوة من فريق Trippple.' },
		faqTitle: 'أسئلة',
		faq: [
			{ q: 'كيف أحصل على Premium؟', a: 'أدخل رمز الدعوة عند التسجيل، أو في هذه الصفحة بعد تسجيل الدخول. كل رمز يمنحك شهرًا من Premium.' },
			{ q: 'أين أجد رمزًا؟', a: 'يشارك فريق Trippple الرموز، مثلًا في الفعاليات أو عبر الشركاء. اطلب منا رمزًا إن أردت.' },
			{ q: 'ماذا يحدث عند انتهاء Premium؟', a: 'تعود إلى الخطة المجانية، وتبقى رحلاتك ومجموعاتك وإعداداتك كما هي.' },
		],
	},
}

export default function Pricing() {
	const { i18n } = useTranslation()
	const copy = copyByLocale[resolveAppLocale(i18n.resolvedLanguage)]

	return (
		<EditorialPageLayout dir={i18n.dir()} className='bg-white'>
			<MarketingPageHero titleLeading={copy.hero.leading} titleAccent={copy.hero.accent} titleTrailing={copy.hero.trailing} description={copy.hero.description} />

			<section className='mx-auto max-w-5xl px-4 pb-12 pt-4 sm:px-6 sm:pb-16'>
				<PlanCards />
			</section>

			<section className='mx-auto max-w-3xl px-4 pb-20 sm:px-6'>
				<h2 className='text-xl font-semibold tracking-tight text-zinc-900'>{copy.faqTitle}</h2>
				<dl className='mt-4 divide-y divide-zinc-200 border-y border-zinc-200'>
					{copy.faq.map((item) => (
						<div key={item.q} className='py-5'>
							<dt className='text-[15px] font-medium text-zinc-900'>{item.q}</dt>
							<dd className='mt-1.5 text-sm leading-6 text-zinc-600'>{item.a}</dd>
						</div>
					))}
				</dl>
			</section>
		</EditorialPageLayout>
	)
}
