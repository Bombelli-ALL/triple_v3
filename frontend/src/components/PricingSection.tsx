import { useTranslation } from 'react-i18next'
import PlanCards from './PlanCards'

export default function PricingSection() {
  const { t, i18n } = useTranslation()

  return (
    <section id="pricing" className="bg-white px-4 py-16 sm:py-24" dir={i18n.dir()}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center sm:mb-14">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">{t('pricing.title')}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500 sm:text-base">{t('pricing.subtitle')}</p>
        </div>
        <PlanCards />
      </div>
    </section>
  )
}
