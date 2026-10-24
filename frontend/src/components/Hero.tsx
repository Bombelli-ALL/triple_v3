'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, FreeMode } from 'swiper/modules'
// @ts-ignore
import 'swiper/css'
// @ts-ignore
import 'swiper/css/free-mode'

import { ArrowRight, CalendarDays, Check, ChevronLeft, Clock3, MapPin, Search, Compass, Users, Wallet, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { saveMyPreferences } from '@/lib/travelApi'
import {
  requestHeroPlanner,
  type HeroAgentResponse,
  type HeroPlannerRequest,
  type StoredHeroPlannerResult,
} from '@/lib/agent'
import {
  HERO_AGENT_NOTICE_KEY,
  HERO_LATEST_TRIP_ID_KEY,
  HERO_PENDING_MAP_OPEN_KEY,
  HERO_PLANNER_REQUEST_KEY,
  HERO_PLANNER_RESULT_KEY,
  HERO_POST_LOGIN_ROUTE_KEY,
  HERO_PROMPT_CONTEXT_KEY,
  removeHeroStorage,
  writeHeroStorage,
} from '@/lib/heroGeneratedTrip'
import ZellijLineBackground from './ZellijLineBackground'

const travelImages = [
  { id: 1, src: '/assets/places/m3.jpeg', alt: 'Morocco place 1' },
  { id: 2, src: '/assets/places/m4.jpeg', alt: 'Morocco place 2' },
  { id: 3, src: '/assets/places/m5.jpeg', alt: 'Morocco place 3' },
  { id: 4, src: '/assets/places/m6.jpeg', alt: 'Morocco place 4' },
  { id: 5, src: '/assets/places/m7.jpeg', alt: 'Morocco place 5' },
  { id: 6, src: '/assets/places/m3.jpeg', alt: 'Morocco place 6' },
  { id: 7, src: '/assets/places/m4.jpeg', alt: 'Morocco place 7' },
  { id: 8, src: '/assets/places/m5.jpeg', alt: 'Morocco place 8' },
]

const repeatedImages = [...travelImages, ...travelImages, ...travelImages]

const featureKeys = [
  'hero.feature1',
  'hero.feature2',
  'hero.feature3',
  'hero.feature4',
  'hero.feature5',
  'hero.feature6',
]

const placeholders = ['Où souhaitez-vous aller ?', 'Chefchaouen', 'Tangier', 'Fez', 'Marrakech']

type IntentType = 'dashboard' | 'match' | 'booking' | 'guide' | 'collab' | 'info'
type PlaceCategory =
  | 'coffee'
  | 'restaurant'
  | 'riad'
  | 'hotel'
  | 'jardin'
  | 'place'
  | 'transport'
  | 'activity'
  | 'trip'
  | 'general'

type SheetStep = 1 | 2 | 3 | 4 | 5 | 6

type SelectedCity = {
  placeId: string
  name: string
  address: string
  lat: number | null
  lng: number | null
}

type PreferenceForm = {
  interests: string[]
  durationDays: number | null
  customDurationDays: string
  budgetDh: number | null
  budgetLabel: string | null
  customBudgetDh: string
  adults: number
  children: number
  extraCity: string
}

type GoogleAutocompleteSuggestion = {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
  lat?: number | null
  lng?: number | null
}

function ImageCard({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className: string
}) {
  const [hasError, setHasError] = useState(false)

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[18px] bg-white shadow-[0_8px_28px_rgba(24,24,27,0.10)] sm:rounded-[22px] ${className}`}
    >
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setHasError(true)}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-100 via-white to-orange-100">
          <span className="px-3 text-center text-[10px] font-semibold text-zinc-500 sm:text-xs">
            {alt}
          </span>
        </div>
      )}
    </div>
  )
}

function TypePlaceholder() {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    let typingTimeout: number | undefined
    let fadeTimeout: number | undefined
    let resetTimeout: number | undefined

    const fullText = placeholders[index]

    if (text.length < fullText.length) {
      typingTimeout = window.setTimeout(() => {
        setText(fullText.slice(0, text.length + 1))
      }, 40)
    } else {
      fadeTimeout = window.setTimeout(() => {
        setIsFading(true)
        resetTimeout = window.setTimeout(() => {
          setIsFading(false)
          setText('')
          setIndex((prev) => (prev + 1) % placeholders.length)
        }, 350)
      }, 1200)
    }

    return () => {
      if (typingTimeout) window.clearTimeout(typingTimeout)
      if (fadeTimeout) window.clearTimeout(fadeTimeout)
      if (resetTimeout) window.clearTimeout(resetTimeout)
    }
  }, [index, text])

  return (
    <span
      className="pointer-events-none select-none text-zinc-400 transition-opacity duration-300 ease-out"
      style={{ opacity: isFading ? 0 : 1 }}
    >
      {text}
    </span>
  )
}

function StepSummaryItem({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-3 text-zinc-400">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
        {icon}
      </div>
      <span className="text-[15px] font-medium">{label}</span>
    </div>
  )
}

function Counter({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrease}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:h-11 sm:w-11 sm:text-xl"
      >
        -
      </button>
      <div className="min-w-[46px] text-center text-[24px] font-semibold tracking-[-0.04em] text-zinc-950 sm:min-w-[56px] sm:text-[28px]">
        {value}
      </div>
      <button
        type="button"
        onClick={onIncrease}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:h-11 sm:w-11 sm:text-xl"
      >
        +
      </button>
    </div>
  )
}

const preferenceOptions = [
  { id: 'popular', label: 'Popular', emoji: '📌' },
  { id: 'museum', label: 'Museum', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'foodie', label: 'Foodie', emoji: '🍕' },
  { id: 'history', label: 'History', emoji: '🏺' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
]

const durationOptions = [
  { id: 'weekend', label: 'Weekend', days: 2, subtitle: 'Quick premium escape' },
  { id: 'short', label: '3 Days', days: 3, subtitle: 'Short city experience' },
  { id: 'classic', label: '5 Days', days: 5, subtitle: 'Balanced trip flow' },
  { id: 'full', label: '7 Days', days: 7, subtitle: 'Full travel week' },
  { id: 'extended', label: '10 Days', days: 10, subtitle: 'Deeper discovery' },
]

const budgetOptions = [
  {
    id: 'budget',
    label: 'Budget',
    rangeLabel: 'Under 1,500 MAD',
    value: 1500,
    subtitle: 'Smart low-cost plan',
  },
  {
    id: 'comfort',
    label: 'Comfort',
    rangeLabel: '1,500 - 4,000 MAD',
    value: 4000,
    subtitle: 'Balanced stay and food',
  },
  {
    id: 'premium',
    label: 'Premium',
    rangeLabel: '4,000 - 8,000 MAD',
    value: 8000,
    subtitle: 'Better hotels and experiences',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    rangeLabel: '8,000+ MAD',
    value: 12000,
    subtitle: 'High-end trip style',
  },
]

function TripOnboardingSheet({
  open,
  cityName,
  step,
  data,
  onClose,
  onBack,
  onToggleInterest,
  onSetDuration,
  onSetCustomDuration,
  onSetBudget,
  onSetCustomBudget,
  onSetAdults,
  onSetChildren,
  onSetExtraCity,
  onContinueFromPreferences,
  onContinueFromDuration,
  onContinueFromBudget,
  onContinueFromTravelers,
  onFinish,
  isSubmitting,
}: {
  open: boolean
  cityName: string
  step: SheetStep
  data: PreferenceForm
  onClose: () => void
  onBack: () => void
  onToggleInterest: (value: string) => void
  onSetDuration: (value: number | null) => void
  onSetCustomDuration: (value: string) => void
  onSetBudget: (budgetDh: number | null, budgetLabel: string | null) => void
  onSetCustomBudget: (value: string) => void
  onSetAdults: (value: number) => void
  onSetChildren: (value: number) => void
  onSetExtraCity: (value: string) => void
  onContinueFromPreferences: () => void
  onContinueFromDuration: () => void
  onContinueFromBudget: () => void
  onContinueFromTravelers: () => void
  onFinish: () => void
  isSubmitting: boolean
}) {
  const parsedCustomDuration = Number(data.customDurationDays)
  const durationValid =
    data.durationDays !== null ||
    (Number.isFinite(parsedCustomDuration) && parsedCustomDuration > 0)

  const parsedCustomBudget = Number(data.customBudgetDh)
  const budgetValid =
    data.budgetDh !== null || (Number.isFinite(parsedCustomBudget) && parsedCustomBudget > 0)

  const travelersTotal = data.adults + data.children

  return (
    <div
      className={`fixed inset-0 z-[90] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#f8f3ee]/78 backdrop-blur-md transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[720px] rounded-t-[28px] bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 sm:rounded-t-[34px] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-zinc-200" />

        <div className="flex max-h-[84vh] flex-col">
          <div className="shrink-0 px-4 pb-3 pt-4 sm:px-7 sm:pb-4 sm:pt-5">
            {step !== 6 && (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{cityName}</span>
                  </div>

                  {step === 1 && (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                          <Compass className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Trip setup</p>
                          <h3 className="text-[24px] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[34px]">
                            Trip Preferences
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-500">What should your trip be about?</p>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Trip duration</p>
                          <h3 className="text-[24px] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[34px]">
                            Trip Duration
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-500">Choose a preset or enter your own duration</p>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Trip budget</p>
                          <h3 className="text-[24px] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[34px]">
                            Price Range
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-500">Choose a budget or enter your own amount</p>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Travelers</p>
                          <h3 className="text-[24px] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[34px]">
                            Who’s Going?
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-500">Set adults and children for this trip</p>
                    </>
                  )}

                  {step === 5 && (
                    <>
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">Optional stop</p>
                          <h3 className="text-[24px] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[34px]">
                            Add Another City
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-500">Optional: add a city to visit after {cityName}</p>
                    </>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-7">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {preferenceOptions.map((item) => {
                    const active = data.interests.includes(item.label)

                    return (
                      <button
                        key={item.id}
                        onClick={() => onToggleInterest(item.label)}
                        className={`flex min-h-[60px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_8px_24px_rgba(24,24,27,0.16)]'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-sm font-semibold">{item.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 rounded-[24px] border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-zinc-900">Trip Duration</p>
                      <p className="text-sm text-zinc-500">Choose your dates or trip length next</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-3">
                  {durationOptions.map((item) => {
                    const active = data.durationDays === item.days

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSetDuration(item.days)
                          onSetCustomDuration('')
                        }}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                          active
                            ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_8px_24px_rgba(24,24,27,0.16)]'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              active ? 'bg-white/10' : 'bg-zinc-100'
                            }`}
                          >
                            <Clock3 className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-base font-semibold">{item.label}</p>
                            <p className={`text-sm ${active ? 'text-white/70' : 'text-zinc-500'}`}>
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {active && (
                          <div className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.05)]">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-zinc-950">Custom duration</p>
                      <p className="text-sm text-zinc-500">Enter your own number of days</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={data.customDurationDays}
                      onChange={(e) => {
                        onSetCustomDuration(e.target.value)
                        onSetDuration(null)
                      }}
                      placeholder="e.g. 6"
                      className="h-10 w-full bg-transparent text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                    <span className="shrink-0 text-sm font-medium text-zinc-500">days</span>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-3">
                  {budgetOptions.map((item) => {
                    const active = data.budgetDh === item.value

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSetBudget(item.value, item.rangeLabel)
                          onSetCustomBudget('')
                        }}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                          active
                            ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_8px_24px_rgba(24,24,27,0.16)]'
                            : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              active ? 'bg-white/10' : 'bg-zinc-100'
                            }`}
                          >
                            <Wallet className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-base font-semibold">{item.label}</p>
                            <p className={`text-sm ${active ? 'text-white/70' : 'text-zinc-500'}`}>
                              {item.rangeLabel}
                            </p>
                            <p
                              className={`mt-1 text-xs ${
                                active ? 'text-white/55' : 'text-zinc-400'
                              }`}
                            >
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        {active && (
                          <div className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-4 shadow-[0_8px_24px_rgba(24,24,27,0.05)]">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-zinc-950">Custom budget</p>
                      <p className="text-sm text-zinc-500">Enter your own total budget</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={data.customBudgetDh}
                      onChange={(e) => {
                        onSetCustomBudget(e.target.value)
                        onSetBudget(null, null)
                      }}
                      placeholder="e.g. 5000"
                      className="h-10 w-full bg-transparent text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                    <span className="shrink-0 text-sm font-medium text-zinc-500">MAD</span>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-[0_12px_30px_rgba(24,24,27,0.06)] sm:p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-[24px] border border-zinc-200 bg-zinc-50 px-4 py-4">
                    <div>
                      <p className="text-base font-semibold text-zinc-950">Number of adults</p>
                      <p className="mt-1 text-sm text-zinc-500">Main travelers</p>
                    </div>

                    <Counter
                      value={data.adults}
                      onDecrease={() => onSetAdults(Math.max(1, data.adults - 1))}
                      onIncrease={() => onSetAdults(Math.min(12, data.adults + 1))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-[24px] border border-zinc-200 bg-zinc-50 px-4 py-4">
                    <div>
                      <p className="text-base font-semibold text-zinc-950">Number of children</p>
                      <p className="mt-1 text-sm text-zinc-500">Optional</p>
                    </div>

                    <Counter
                      value={data.children}
                      onDecrease={() => onSetChildren(Math.max(0, data.children - 1))}
                      onIncrease={() => onSetChildren(Math.min(12, data.children + 1))}
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <span className="font-semibold text-zinc-900">{travelersTotal}</span>
                    <span>traveler{travelersTotal > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{data.adults} adult{data.adults > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{data.children} child{data.children > 1 ? 'ren' : ''}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-[0_12px_30px_rgba(24,24,27,0.06)] sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-zinc-950">Optional city after {cityName}</p>
                    <p className="text-sm text-zinc-500">Leave empty if you only want one destination</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <input
                    type="text"
                    value={data.extraCity}
                    onChange={(e) => onSetExtraCity(e.target.value)}
                    placeholder="e.g. Chefchaouen"
                    className="h-10 w-full bg-transparent text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="py-2">
                <div className="space-y-5">
                  <StepSummaryItem icon={<Compass className="h-4 w-4" />} label="Trip Preferences" />
                  <StepSummaryItem icon={<CalendarDays className="h-4 w-4" />} label="Trip Duration" />
                  <StepSummaryItem icon={<Wallet className="h-4 w-4" />} label="Price Range" />
                  <StepSummaryItem icon={<Users className="h-4 w-4" />} label="Who’s Going?" />
                  <StepSummaryItem icon={<MapPin className="h-4 w-4" />} label="Optional extra city" />

                  <div className="flex items-start gap-3">
                    <div className="relative mt-0.5 flex h-6 w-6 items-center justify-center">
                      <span className="absolute h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </div>

                    <div>
                      <p className="text-[24px] font-semibold tracking-[-0.04em] text-zinc-950 sm:text-[28px]">
                        Planning your trip
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Trip preferences saved! We’re setting up your experience now.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 overflow-hidden rounded-full bg-zinc-100">
                  <div className="hero-loader h-2 rounded-full bg-linear-to-r from-orange-500 via-amber-400 to-orange-300" />
                </div>
              </div>
            )}
          </div>

          {step !== 6 && (
            <div className="shrink-0 border-t border-zinc-100 bg-white px-4 pb-4 pt-3 sm:px-7 sm:pb-6">
              {step === 1 && (
                <div className="flex gap-3">
                  <button
                    onClick={onContinueFromPreferences}
                    className="flex h-[54px] flex-1 items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Continue
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="flex gap-3">
                  <button
                    onClick={onBack}
                    className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={onContinueFromDuration}
                    disabled={!durationValid}
                    className="flex h-[54px] flex-1 items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continue
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex gap-3">
                  <button
                    onClick={onBack}
                    className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={onContinueFromBudget}
                    disabled={!budgetValid}
                    className="flex h-[54px] flex-1 items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continue
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              )}

              {step === 4 && (
                <div className="flex gap-3">
                  <button
                    onClick={onBack}
                    className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={onContinueFromTravelers}
                    className="flex h-[54px] flex-1 items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Continue
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              )}

              {step === 5 && (
                <div className="flex gap-3">
                  <button
                    onClick={onBack}
                    className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    onClick={onFinish}
                    disabled={isSubmitting}
                    className="flex h-[54px] flex-1 items-center justify-center gap-3 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Loading...' : 'Create Trip'}
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const [cityQuery, setCityQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetStep, setSheetStep] = useState<SheetStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const [autocompleteLoading, setAutocompleteLoading] = useState(false)
  const [autocompleteError, setAutocompleteError] = useState('')
  const [googleSuggestions, setGoogleSuggestions] = useState<GoogleAutocompleteSuggestion[]>([])
  const [form, setForm] = useState<PreferenceForm>({
    interests: [],
    durationDays: null,
    customDurationDays: '',
    budgetDh: null,
    budgetLabel: null,
    customBudgetDh: '',
    adults: 2,
    children: 0,
    extraCity: '',
  })

  const desktopInputWrapRef = useRef<HTMLDivElement | null>(null)
  const mobileInputWrapRef = useRef<HTMLDivElement | null>(null)
  const debounceRef = useRef<number | null>(null)

  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const filteredSuggestions = useMemo(() => {
    return googleSuggestions
  }, [googleSuggestions])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setHeroReady(true)
    })

    return () => window.cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const insideDesktop = desktopInputWrapRef.current?.contains(target)
      const insideMobile = mobileInputWrapRef.current?.contains(target)

      if (!insideDesktop && !insideMobile) {
        setSuggestionsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedCity && cityQuery.trim() !== selectedCity.name.trim()) {
      setSelectedCity(null)
    }
  }, [cityQuery, selectedCity])

  useEffect(() => {
    const query = cityQuery.trim()

    if (!query) {
      setGoogleSuggestions([])
      setAutocompleteError('')
      setAutocompleteLoading(false)
      return
    }

    if (query.length < 2) {
      setGoogleSuggestions([])
      setAutocompleteError('')
      return
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        setAutocompleteLoading(true)
        setAutocompleteError('')

        const response = await api.get('/cities', {
          params: { limit: 100 },
        })

        const q = query.toLowerCase()
        const nextSuggestions: GoogleAutocompleteSuggestion[] = (Array.isArray(response.data) ? response.data : [])
          .filter((city: any) => {
            const name = String(city?.name ?? '').toLowerCase()
            const slug = String(city?.slug ?? '').toLowerCase()
            const description = String(city?.description ?? '').toLowerCase()
            return name.includes(q) || slug.includes(q) || description.includes(q)
          })
          .slice(0, 6)
          .map((city: any) => ({
            placeId: String(city.id),
            mainText: String(city.name ?? ''),
            secondaryText: 'Morocco',
            fullText: String(city.name ?? ''),
            lat: typeof city.lat === 'number' ? city.lat : null,
            lng: typeof city.lng === 'number' ? city.lng : null,
          }))

        setGoogleSuggestions(nextSuggestions)
      } catch (error) {
        console.error('City autocomplete error:', error)
        setGoogleSuggestions([])
        setAutocompleteError('Could not load cities')
      } finally {
        setAutocompleteLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [cityQuery])

  const resetForm = () => {
    setForm({
      interests: [],
      durationDays: null,
      customDurationDays: '',
      budgetDh: null,
      budgetLabel: null,
      customBudgetDh: '',
      adults: 2,
      children: 0,
      extraCity: '',
    })
  }

  const savePromptContext = (payload: {
    intent: IntentType
    city: string
    category: PlaceCategory
    preferences?: PreferenceForm
    durationDays?: number | null
    budgetDh?: number | null
    selectedCity?: SelectedCity | null
  }) => {
    writeHeroStorage(HERO_PROMPT_CONTEXT_KEY, JSON.stringify(payload))
  }

  const buildPlannerRequest = (
    city: string,
    preferences: PreferenceForm,
    citySelection: SelectedCity | null,
  ): HeroPlannerRequest => {
    const customDuration = Number(preferences.customDurationDays)
    const customBudget = Number(preferences.customBudgetDh)

    return {
      ownerUserId: user?.id,
      city,
      placeId: citySelection?.placeId,
      lat: citySelection?.lat ?? null,
      lng: citySelection?.lng ?? null,
      interests: preferences.interests,
      durationDays:
        preferences.durationDays ??
        (Number.isFinite(customDuration) && customDuration > 0 ? customDuration : 5),
      budgetDh:
        preferences.budgetDh ??
        (Number.isFinite(customBudget) && customBudget > 0 ? customBudget : null),
      adults: preferences.adults,
      children: preferences.children,
      extraCity: preferences.extraCity.trim() || undefined,
    }
  }

  const storePlannerResult = (
    request: HeroPlannerRequest,
    response: HeroAgentResponse,
  ) => {
    const payload: StoredHeroPlannerResult = {
      request,
      response,
      generatedAt: new Date().toISOString(),
    }

    writeHeroStorage(HERO_PLANNER_RESULT_KEY, JSON.stringify(payload))
    removeHeroStorage(HERO_PLANNER_REQUEST_KEY)
    const tripAction = response.actions?.find((action) => action.payload?.tripId)
    if (tripAction?.payload?.tripId) {
      writeHeroStorage(HERO_LATEST_TRIP_ID_KEY, String(tripAction.payload.tripId))
    }
    writeHeroStorage(HERO_AGENT_NOTICE_KEY, response.answer || 'Got it. I’m building your agenda now.')
    window.dispatchEvent(new CustomEvent('hero-planner-ready'))
  }

  const getPlannerTripId = (response: HeroAgentResponse) => {
    const actionWithTrip = response.actions?.find((action) => action.payload?.tripId)
    const tripId = actionWithTrip?.payload?.tripId
    return typeof tripId === 'string' && tripId.trim() ? tripId : null
  }

  const handleSelectCity = async (suggestion: GoogleAutocompleteSuggestion) => {
    const city: SelectedCity = {
      placeId: suggestion.placeId,
      name: suggestion.mainText || suggestion.fullText,
      address: suggestion.fullText || suggestion.mainText || 'Morocco',
      lat: suggestion.lat ?? null,
      lng: suggestion.lng ?? null,
    }

    setSelectedCity(city)
    setCityQuery(city.name)
    setSuggestionsOpen(false)
    setGoogleSuggestions([])
    setAutocompleteLoading(false)
  }

  const resolveCityBeforeSheet = async () => {
    if (selectedCity && cityQuery.trim() === selectedCity.name.trim()) {
      return selectedCity
    }

    const rawCity = cityQuery.trim()
    if (!rawCity) return null

    const firstSuggestion = googleSuggestions[0]

    if (firstSuggestion && firstSuggestion.fullText.toLowerCase().includes(rawCity.toLowerCase())) {
      const city: SelectedCity = {
        placeId: firstSuggestion.placeId,
        name: firstSuggestion.mainText || rawCity,
        address: firstSuggestion.fullText,
        lat: firstSuggestion.lat ?? null,
        lng: firstSuggestion.lng ?? null,
      }

      setSelectedCity(city)
      return city
    }

    const manualCity: SelectedCity = {
      placeId: rawCity.toLowerCase().replace(/\s+/g, '-'),
      name: rawCity,
      address: rawCity,
      lat: null,
      lng: null,
    }

    setSelectedCity(manualCity)
    return manualCity
  }

  const handleSubmit = async () => {
    if (!cityQuery.trim() || isLoading) return

    const city = await resolveCityBeforeSheet()
    if (!city) return

    setSheetStep(1)
    setSheetOpen(true)
  }

  const handleFinishFlow = async () => {
    const city = selectedCity?.name || cityQuery.trim()
    if (!city || isLoading) return

    setSheetStep(6)
    setIsLoading(true)

    const plannerRequest = buildPlannerRequest(city, form, selectedCity)

    savePromptContext({
      intent: 'dashboard',
      city,
      category: 'trip',
      preferences: form,
      durationDays: plannerRequest.durationDays,
      budgetDh: plannerRequest.budgetDh ?? null,
      selectedCity,
    })

    if (user) {
      // Keep the account's dashboard in sync with what was just asked for
      void saveMyPreferences({
        city,
        durationDays: Math.min(30, plannerRequest.durationDays),
        budgetDh: plannerRequest.budgetDh ?? null,
        adults: Math.max(1, plannerRequest.adults),
        children: plannerRequest.children,
        interests: plannerRequest.interests,
      }).catch((error) => console.error('Saving travel preferences failed:', error))
    }

    const finalizeFlow = (target: string) => {
      setSheetOpen(false)
      setIsLoading(false)
      setCityQuery('')
      setSelectedCity(null)
      setGoogleSuggestions([])
      resetForm()
      navigate(target)
    }

    if (!user) {
      writeHeroStorage(HERO_PLANNER_REQUEST_KEY, JSON.stringify(plannerRequest))
      writeHeroStorage(HERO_POST_LOGIN_ROUTE_KEY, '/user/trip-plan')
      finalizeFlow('/login')
      return
    }

    try {
      const { data } = await requestHeroPlanner<HeroAgentResponse>(plannerRequest)
      storePlannerResult(plannerRequest, data)
      const tripId = getPlannerTripId(data)
      if (tripId) {
        finalizeFlow(`/user/maps?trip=${encodeURIComponent(tripId)}`)
        return
      }
      writeHeroStorage(HERO_PENDING_MAP_OPEN_KEY, 'true')
    } catch (error) {
      console.error('Hero planner request failed:', error)
      removeHeroStorage(HERO_PLANNER_RESULT_KEY)
      writeHeroStorage(HERO_PENDING_MAP_OPEN_KEY, 'true')
      writeHeroStorage(HERO_AGENT_NOTICE_KEY, 'Got it. I’m building your agenda now.')
      window.dispatchEvent(new CustomEvent('hero-planner-ready'))
    }

    finalizeFlow('/user/trip-plan')
  }

  const showSuggestions =
    suggestionsOpen && cityQuery.trim().length > 0 && filteredSuggestions.length > 0

  return (
    <>
      <section className="relative overflow-visible bg-white pt-[92px] sm:pt-[96px] lg:pt-[104px]">
        <ZellijLineBackground />

        <div
          className={`absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_42%)] transition-opacity duration-1000 ${
            heroReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-orange-50/30 blur-3xl transition-all duration-1000 ${
            heroReady ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        />

        <div className="relative z-10 mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6">
          <div className="relative overflow-visible bg-transparent px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-14">
            <div className="relative mx-auto flex min-h-[760px] max-w-[1120px] flex-col items-center text-center sm:min-h-[780px] lg:min-h-[820px] xl:min-h-[860px]">
              <h1
                className={`mx-auto mt-2 max-w-[920px] text-[36px] font-semibold leading-[0.96] tracking-[-0.05em] text-zinc-950 sm:mt-4 sm:text-[52px] lg:mt-6 lg:text-[72px] xl:text-[80px] ${
                  heroReady ? 'hero-fade-up hero-delay-1' : 'opacity-0'
                }`}
              >
                <span className="block">
                  {t('hero.title1')}{' '}
                  <span
                    className="inline-block text-orange-500"
                    style={{
                      fontFamily: '"Dancing Script", cursive',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {t('hero.title2')}
                  </span>
                </span>
                <span className="block">{t('hero.title3')}</span>
              </h1>

              <p
                className={`mx-auto mt-5 max-w-[760px] px-2 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8 lg:mt-6 lg:text-[16px] ${
                  heroReady ? 'hero-fade-up hero-delay-2' : 'opacity-0'
                }`}
                style={{
                  fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}
              >
                {t('hero.description')}
              </p>

              <div
                className={`relative z-[60] mt-8 w-full max-w-[760px] px-1 sm:mt-8 sm:px-0 lg:max-w-[780px] ${
                  heroReady ? 'hero-fade-up hero-delay-3' : 'opacity-0'
                }`}
              >
                <div className="sm:hidden">
                  <div ref={mobileInputWrapRef} className="relative mx-auto w-full max-w-[330px]">
                    <div className="relative z-[70] rounded-full border border-zinc-200 bg-white p-1.5 shadow-[0_14px_34px_rgba(24,24,27,0.08)]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.26)]">
                          <MapPin className="h-4 w-4" />
                        </div>

                        <div className="relative min-w-0 flex-1 text-left">
                          <input
                            type="text"
                            inputMode="search"
                            autoComplete="off"
                            value={cityQuery}
                            onChange={(e) => {
                              setCityQuery(e.target.value)
                              setSuggestionsOpen(true)
                            }}
                            onFocus={() => setSuggestionsOpen(true)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                void handleSubmit()
                              }
                            }}
                            className="h-[42px] w-full bg-transparent pr-1 text-[16px] font-medium text-zinc-800 outline-none"
                          />
                          {!cityQuery && (
                            <div className="pointer-events-none absolute inset-0 flex items-center">
                              <span className="text-[16px]">
                                <TypePlaceholder />
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => void handleSubmit()}
                          disabled={isLoading}
                          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.26)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {showSuggestions && (
                      <div className="absolute left-0 right-0 top-[62px] z-[80] overflow-hidden rounded-[20px] border border-zinc-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                        {filteredSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            type="button"
                            onClick={() => void handleSelectCity(suggestion)}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-zinc-50"
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900">
                                {suggestion.mainText}
                              </p>
                              <p className="truncate text-xs text-zinc-500">
                                {suggestion.secondaryText}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {autocompleteLoading && cityQuery.trim().length > 1 && (
                      <div className="mt-3 text-center text-xs font-medium text-zinc-400">
                        Loading places...
                      </div>
                    )}

                    {autocompleteError && cityQuery.trim().length > 1 && (
                      <div className="mt-3 text-center text-xs font-medium text-red-500">
                        {autocompleteError}
                      </div>
                    )}
                  </div>
                </div>

                <div ref={desktopInputWrapRef} className="relative hidden sm:block">
                  <div className="relative z-[70] mx-auto w-full max-w-[760px] rounded-full border border-zinc-200 bg-white p-2 shadow-[0_16px_40px_rgba(24,24,27,0.08)] lg:max-w-[780px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] lg:h-[48px] lg:w-[48px]">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>

                      <div className="relative min-w-0 flex-1 text-left">
                        <input
                          type="text"
                          value={cityQuery}
                          onChange={(e) => {
                            setCityQuery(e.target.value)
                            setSuggestionsOpen(true)
                          }}
                          onFocus={() => setSuggestionsOpen(true)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              void handleSubmit()
                            }
                          }}
                          className="h-[46px] w-full bg-transparent pr-2 text-[15px] font-medium text-zinc-800 outline-none lg:h-[48px] lg:text-[16px]"
                        />
                        {!cityQuery && (
                          <div className="pointer-events-none absolute inset-0 flex items-center">
                            <span className="text-[15px] font-medium text-zinc-400 lg:text-[16px]">
                              <TypePlaceholder />
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => void handleSubmit()}
                        disabled={isLoading}
                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition hover:scale-[1.02] hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70 lg:h-[48px] lg:w-[48px]"
                      >
                        <Search className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {showSuggestions && (
                    <div className="absolute left-1/2 top-[74px] z-[80] w-full max-w-[760px] -translate-x-1/2 overflow-hidden rounded-[22px] border border-zinc-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] lg:max-w-[780px]">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          onClick={() => void handleSelectCity(suggestion)}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-zinc-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {suggestion.mainText}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {suggestion.secondaryText}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {autocompleteLoading && cityQuery.trim().length > 1 && (
                    <div className="mt-3 text-center text-xs font-medium text-zinc-400">
                      Loading places...
                    </div>
                  )}

                  {autocompleteError && cityQuery.trim().length > 1 && (
                    <div className="mt-3 text-center text-xs font-medium text-red-500">
                      {autocompleteError}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`mt-10 grid w-full max-w-[980px] grid-cols-2 gap-y-4 text-zinc-400 sm:mt-12 sm:grid-cols-3 lg:mt-14 lg:grid-cols-6 ${
                  heroReady ? 'hero-fade-up hero-delay-4' : 'opacity-0'
                }`}
              >
                {featureKeys.map((item) => (
                  <div key={item} className="text-center text-xs font-semibold tracking-tight sm:text-sm">
                    {t(item)}
                  </div>
                ))}
              </div>

              <div
                className={`relative mt-10 w-full overflow-x-hidden overflow-y-visible pb-8 sm:mt-12 sm:pb-10 lg:mt-14 lg:pb-12 ${
                  heroReady ? 'hero-fade-up hero-delay-5' : 'opacity-0'
                }`}
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-white to-transparent sm:w-20" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-white to-transparent sm:w-20" />

                <div className="w-full relative px-1 sm:px-2 overflow-hidden">
                  <Swiper
                    modules={[Autoplay, FreeMode]}
                    spaceBetween={16}
                    slidesPerView="auto"
                    loop={true}
                    speed={2300}
                    grabCursor={true}
                    freeMode={true}
                    allowTouchMove={true}
                    watchSlidesProgress={true}
                    loopAdditionalSlides={10}
                    autoplay={{
                      delay: 0,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: false,
                    }}
                    className="overflow-visible! flex items-center"
                  >
                    {repeatedImages.map((image, index) => (
                      <SwiperSlide
                        key={`${image.id}-${index}`}
                        className="!w-auto"
                      >
                        <div className="flex justify-center pb-4">
                          <ImageCard
                            src={image.src}
                            alt={image.alt}
                            className="h-[140px] w-[140px] sm:h-[180px] sm:w-[180px] lg:h-[220px] lg:w-[220px] object-cover"
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TripOnboardingSheet
          open={sheetOpen}
          cityName={selectedCity?.name || cityQuery || 'Your destination'}
          step={sheetStep}
          data={form}
          isSubmitting={isLoading}
          onClose={() => {
            setSheetOpen(false)
            setIsLoading(false)
            resetForm()
          }}
          onBack={() => setSheetStep((prev) => Math.max(1, prev - 1) as SheetStep)}
          onToggleInterest={(value) => {
            setForm((prev) => ({
              ...prev,
              interests: prev.interests.includes(value)
                ? prev.interests.filter((item) => item !== value)
                : [...prev.interests, value],
            }))
          }}
          onSetDuration={(value) =>
            setForm((prev) => ({
              ...prev,
              durationDays: value,
            }))
          }
          onSetCustomDuration={(value) =>
            setForm((prev) => ({
              ...prev,
              customDurationDays: value,
            }))
          }
          onSetBudget={(budgetDh, budgetLabel) =>
            setForm((prev) => ({
              ...prev,
              budgetDh,
              budgetLabel,
            }))
          }
          onSetCustomBudget={(value) =>
            setForm((prev) => ({
              ...prev,
              customBudgetDh: value,
            }))
          }
          onSetAdults={(value) =>
            setForm((prev) => ({
              ...prev,
              adults: value,
            }))
          }
          onSetChildren={(value) =>
            setForm((prev) => ({
              ...prev,
              children: value,
            }))
          }
          onSetExtraCity={(value) =>
            setForm((prev) => ({
              ...prev,
              extraCity: value,
            }))
          }
          onContinueFromPreferences={() => setSheetStep(2)}
          onContinueFromDuration={() => setSheetStep(3)}
          onContinueFromBudget={() => setSheetStep(4)}
          onContinueFromTravelers={() => setSheetStep(5)}
          onFinish={handleFinishFlow}
        />
      </section>

      <style>{`
        .hero-loader {
          width: 100%;
          transform-origin: left center;
          animation: heroProgress 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes heroProgress {
          from {
            transform: scaleX(0.12);
          }
          to {
            transform: scaleX(1);
          }
        }

        .hero-fade-up {
          animation: heroFadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .hero-delay-1 {
          animation-delay: 0.04s;
        }

        .hero-delay-2 {
          animation-delay: 0.12s;
        }

        .hero-delay-3 {
          animation-delay: 0.2s;
        }

        .hero-delay-4 {
          animation-delay: 0.28s;
        }

        .hero-delay-5 {
          animation-delay: 0.36s;
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translate3d(0, 22px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </>
  )
}
