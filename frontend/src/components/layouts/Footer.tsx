import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Facebook, Twitter, Instagram, Mail, ArrowRight } from 'lucide-react'

export default function Footer() {
  const { t, i18n } = useTranslation()

  return (
    <footer
      className="relative w-full overflow-hidden border-t border-gray-100 bg-white pt-20 pb-10"
      dir={i18n.dir()}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 z-0 h-135 w-135 -translate-x-1/2 rounded-full bg-orange-50/30 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 border-b border-gray-100 pb-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group mb-6 flex items-center gap-2">
              <span className="text-orange-500 transition-transform duration-200 group-hover:scale-110">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 12L21 4L17 12L21 20L3 12Z" />
                </svg>
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900">Trippple</span>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-gray-500 transition-colors hover:text-gray-700">
              {t('footer.tagline')}
            </p>

            <div className="mt-8 flex items-center gap-4">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-xl bg-gray-50 p-2 text-gray-400 transition-all duration-200 hover:bg-orange-50 hover:text-orange-500"
                  aria-label={`Social link ${i + 1}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-6 text-[13px] font-bold uppercase tracking-widest text-gray-900">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-4">
              {[
                { label: t('nav.home'), to: '/' },
                { label: t('nav.planning'), to: '/planning/trip-planner' },
                { label: t('nav.pricing'), to: '/pricing' },
                { label: t('nav.faqs'), to: '/faqs' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-gray-500 transition-colors hover:text-orange-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-6 text-[13px] font-bold uppercase tracking-widest text-gray-900">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-4">
              <li>
                <Link to="/privacy-policy" className="text-sm text-gray-500 transition-colors hover:text-orange-500">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-gray-500 transition-colors hover:text-orange-500">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="mb-6 text-[13px] font-bold uppercase tracking-widest text-gray-900">
              {t('footer.newsletter')}
            </h4>
            <p className="mb-6 text-sm tracking-tight text-gray-500">
              {t('footer.newsletterDesc')}
            </p>

            <form className="group relative">
              <input
                type="email"
                placeholder={t('footer.newsletterPlaceholder')}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-4 pr-12 text-base transition-all focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 sm:text-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 flex w-10 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors duration-200 hover:bg-orange-500"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 pt-10 md:flex-row">
          <p className="text-xs font-medium tracking-tight text-gray-400">
            {t('footer.rights')}
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Mail size={14} className="text-orange-500/60" />
              <span>hello@trippple.com</span>
            </div>

            <div className="hidden h-4 w-px bg-gray-100 md:block"></div>

            <p className="text-xs font-medium text-gray-400">
              {t('footer.bottomTagline')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}