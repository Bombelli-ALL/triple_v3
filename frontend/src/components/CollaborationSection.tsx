import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Calendar, DollarSign, Camera, CheckCircle2, Compass, MapPinned, ShieldCheck, UserRoundSearch, BadgeInfo } from 'lucide-react'
import ZellijLineBackground from './ZellijLineBackground'

type FeatureTab = 'collaboration' | 'booking' | 'information' | 'guide'

export default function CollaborationSection() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<FeatureTab>('collaboration')
  const [isVisible, setIsVisible] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const switchTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current)
      }
    }
  }, [])

  const handleTabChange = (tab: FeatureTab) => {
    if (tab === activeTab) return

    setIsSwitching(true)
    setActiveTab(tab)

    if (switchTimeoutRef.current) {
      window.clearTimeout(switchTimeoutRef.current)
    }

    switchTimeoutRef.current = window.setTimeout(() => {
      setIsSwitching(false)
    }, 420)
  }

  const sections = {
    collaboration: {
      badge: t('colab.badge'),
      title: 'Group collaboration',
      subtitle: 'made effortless.',
      desc: 'Keep chats, plans, and trip details in one shared space.',
      activeLabel: t('colab.activeFriends'),
      image: '/assets/images/collaboration_mockup.png',
      topIcon: <Users className="h-4 w-4 text-orange-500" />,
      benefits: [
        {
          icon: <Calendar className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Shared dates',
          desc: 'Coordinate schedules and trip availability with everyone in one place.',
        },
        {
          icon: <DollarSign className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Budget tracking',
          desc: 'Keep spending visible and aligned across the whole group trip.',
        },
        {
          icon: <Camera className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Photo sharing',
          desc: 'Collect memories, trip inspiration, and references in one shared flow.',
        },
        {
          icon: <CheckCircle2 className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Cleaner planning',
          desc: 'Reduce chaos and keep decisions organized without endless chat threads.',
        },
      ],
    },
    booking: {
      badge: 'Easy booking',
      title: 'Trip booking',
      subtitle: 'from one prompt.',
      desc: 'Generate a plan, shortlist stays, and move faster.',
      activeLabel: 'Shortlist ready',
      image: '/assets/images/ai_booking_mockup.png',
      topIcon: <Compass className="h-4 w-4 text-orange-500" />,
      benefits: [
        {
          icon: <Compass className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Smart intent',
          desc: 'Understand what the traveler wants before showing the right next actions.',
        },
        {
          icon: <Calendar className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Trip itinerary',
          desc: 'Turn one idea into a clearer structure for the whole trip.',
        },
        {
          icon: <DollarSign className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Booking picks',
          desc: 'Surface better options faster with a premium booking shortlist.',
        },
        {
          icon: <CheckCircle2 className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Fast flow',
          desc: 'Move from prompt to action with less friction and fewer steps.',
        },
      ],
    },
    information: {
      badge: 'Travel Info',
      title: 'Travel answers',
      subtitle: 'in real time.',
      desc: 'Get clear route tips, place info, and useful guidance.',
      activeLabel: 'Live insights',
      image: '/assets/images/travel_info_mockup.png',
      topIcon: <BadgeInfo className="h-4 w-4 text-orange-500" />,
      benefits: [
        {
          icon: <MapPinned className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Place guidance',
          desc: 'Help travelers understand where to go and what matters nearby.',
        },
        {
          icon: <ShieldCheck className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Safer choices',
          desc: 'Support better travel decisions with more helpful context.',
        },
        {
          icon: <CheckCircle2 className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Clear answers',
          desc: 'Respond to travel questions with cleaner and more useful guidance.',
        },
        {
          icon: <Camera className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Better discovery',
          desc: 'Make exploring destinations feel easier and more inspiring.',
        },
      ],
    },
    guide: {
      badge: 'Guide Discovery',
      title: 'Local guides',
      subtitle: 'made simple.',
      desc: 'Find trusted local help and better experiences nearby.',
      activeLabel: 'Trusted help',
      image: '/assets/images/guide_discovery_mockup.png',
      topIcon: <UserRoundSearch className="h-4 w-4 text-orange-500" />,
      benefits: [
        {
          icon: <UserRoundSearch className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Guide search',
          desc: 'Discover local experts faster when travelers need real human support.',
        },
        {
          icon: <MapPinned className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Nearby options',
          desc: 'Surface relevant guide choices based on destination and context.',
        },
        {
          icon: <Users className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Human help',
          desc: 'Plan on your own, with trusted local help when you need it.',
        },
        {
          icon: <CheckCircle2 className="h-4.5 w-4.5 text-orange-500" />,
          text: 'Trusted picks',
          desc: 'Guide users toward more reliable and higher-quality local experiences.',
        },
      ],
    },
  }

  const current = sections[activeTab]

  return (
    <section
      ref={sectionRef}
      className="relative z-10 overflow-hidden bg-white py-14 lg:py-18"
      dir={i18n.dir()}
    >
      <ZellijLineBackground />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-44 bg-gradient-to-b from-white/60 via-white/40 to-transparent sm:h-52 lg:h-56" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),rgba(255,255,255,0.18)_18%,rgba(255,255,255,0.04)_38%,transparent_72%)]" />
      <div
        className={`pointer-events-none absolute inset-0 z-[1] transition-opacity duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-transparent" />
        <div className="absolute left-1/2 top-8 h-135 w-135 -translate-x-1/2 rounded-full bg-orange-50/15 blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`mx-auto mb-8 max-w-3xl text-center ${
            isVisible ? 'hero-fade-up hero-delay-1' : 'opacity-0'
          }`}
        >

          <h2
            className={`mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-zinc-950 sm:text-5xl lg:text-[56px] ${
              isVisible ? 'hero-fade-up hero-delay-3' : 'opacity-0'
            }`}
          >
            Explore the main services
            <br />
            <span className="text-zinc-400">inside Trippple</span>
          </h2>

          <p
            className={`mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base ${
              isVisible ? 'hero-fade-up hero-delay-4' : 'opacity-0'
            }`}
            style={{
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            Planning, booking, travel answers, and local discovery in one premium flow.
          </p>
        </div>

        <div
          className={`mb-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 ${
            isVisible ? 'hero-fade-up hero-delay-4' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={() => handleTabChange('collaboration')}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              activeTab === 'collaboration'
                ? 'bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)]'
                : 'border border-zinc-200 bg-white/95 text-zinc-600 hover:border-orange-200 hover:text-zinc-900'
            }`}
          >
            Collaboration
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('booking')}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              activeTab === 'booking'
                ? 'bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)]'
                : 'border border-zinc-200 bg-white/95 text-zinc-600 hover:border-orange-200 hover:text-zinc-900'
            }`}
          >
            Easy booking
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('information')}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              activeTab === 'information'
                ? 'bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)]'
                : 'border border-zinc-200 bg-white/95 text-zinc-600 hover:border-orange-200 hover:text-zinc-900'
            }`}
          >
            Information
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('guide')}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              activeTab === 'guide'
                ? 'bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)]'
                : 'border border-zinc-200 bg-white/95 text-zinc-600 hover:border-orange-200 hover:text-zinc-900'
            }`}
          >
            Guide Discovery
          </button>
        </div>

        <div
          className={`relative overflow-hidden rounded-[28px] border border-zinc-100/80 bg-white/82 p-4 shadow-[0_16px_42px_rgba(15,23,42,0.05)] backdrop-blur-[4px] sm:p-7 lg:rounded-4xl lg:p-10 ${
            isVisible ? 'hero-fade-up hero-delay-5' : 'opacity-0'
          }`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/88 to-transparent" />
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-orange-100/28 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-orange-100/18 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 flex min-w-0 flex-col gap-5 lg:order-1">
              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3.5 py-2 text-[11px] font-semibold text-zinc-700 shadow-sm transition-all duration-500 ${
                  isSwitching ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
                } sm:text-xs`}
              >
                {current.topIcon}
                {current.badge}
              </div>

              <h2
                className={`text-[30px] font-light leading-[1.02] tracking-[-0.03em] text-zinc-950 transition-all duration-500 ease-out sm:text-[40px] lg:text-[52px] ${
                  isSwitching ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
                }`}
                style={{
                  fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
              >
                {current.title} <br />
                <span className="text-zinc-400">{current.subtitle}</span>
              </h2>

              <p
                className={`max-w-lg text-[15px] leading-7 text-zinc-600 transition-all duration-500 ease-out sm:text-[17px] ${
                  isSwitching ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
                }`}
                style={{
                  fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}
              >
                {current.desc}
              </p>

              <ul className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {current.benefits.map((benefit, index) => (
                  <li
                    key={`${activeTab}-${index}`}
                    className={`flex items-start gap-3 rounded-2xl transition-all duration-500 ease-out ${
                      isSwitching ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
                    }`}
                    style={{ transitionDelay: `${isSwitching ? 0 : index * 55}ms` }}
                  >
                    <div className="mt-1 shrink-0">{benefit.icon}</div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{benefit.text}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-600">{benefit.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative order-1 flex justify-center lg:order-2 lg:justify-end">
              <div className="absolute left-2 top-2 h-[85%] w-[85%] rounded-[24px] bg-orange-50/80 sm:left-5 sm:top-5 sm:rounded-[34px]" />

              <div className="relative z-10 w-full max-w-[320px] sm:max-w-[370px]">
                <div
                  className={`overflow-hidden rounded-[26px] border-[6px] border-zinc-900 bg-white shadow-2xl transition-all duration-500 ease-out sm:rounded-[36px] sm:border-[7px] ${
                    isSwitching ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'
                  }`}
                >
                  <img
                    key={current.image}
                    src={current.image}
                    alt={current.title}
                    className="h-[340px] w-full object-cover sm:h-[430px]"
                    loading="eager"
                    decoding="async"
                  />
                </div>

                <div
                  className={`absolute right-0 top-4 z-20 rounded-2xl border border-zinc-100 bg-white px-3 py-2.5 shadow-xl transition-all duration-500 ease-out ${
                    isSwitching ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
                  } sm:-right-5 sm:top-6 sm:px-4 sm:py-3 lg:-right-4`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    <span className="text-[11px] font-bold text-zinc-800 sm:text-xs">
                      {current.activeLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-20 -top-20 h-105 w-105 rounded-full bg-linear-to-br from-orange-100/30 to-transparent blur-2xl" />
          </div>
        </div>
      </div>

      <style>{`
        .hero-fade-up {
          animation: heroFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity;
        }

        .hero-delay-1 {
          animation-delay: 0.08s;
        }

        .hero-delay-2 {
          animation-delay: 0.18s;
        }

        .hero-delay-3 {
          animation-delay: 0.3s;
        }

        .hero-delay-4 {
          animation-delay: 0.42s;
        }

        .hero-delay-5 {
          animation-delay: 0.56s;
        }

        @keyframes heroFadeUp {
          0% {
            opacity: 0;
            transform: translate3d(0, 22px, 0) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </section>
  )
}