import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, Globe, Mail, MapPin, Phone, Save, Shield, SlidersHorizontal, Compass, UserRound } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  getDefaultAccountSettings,
  loadAccountSettings,
  saveAccountSettings,
  type UserAccountSettings,
} from '@/lib/accountSettings'
import { fetchGamificationSettings, updateGamificationSettings } from '@/lib/gamification'

type ToggleCardProps = {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleCard({ title, description, checked, onChange, disabled = false }: ToggleCardProps) {
  return (
    <button
      type='button'
      onClick={() => {
        if (!disabled) onChange(!checked)
      }}
      disabled={disabled}
      className={`flex w-full items-start justify-between gap-4 rounded-[20px] border p-4 text-left transition ${
        checked ? 'border-orange-200 bg-orange-50' : 'border-zinc-200 bg-white hover:bg-zinc-50'
      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      <div>
        <p className='text-sm font-semibold text-zinc-950'>{title}</p>
        <p className='mt-1 text-sm leading-6 text-zinc-500'>{description}</p>
      </div>

      <span
        className={`relative mt-1 inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-zinc-950' : 'bg-zinc-200'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}

type SaveState = 'idle' | 'local' | 'account' | 'error'

export default function UserSettings() {
  const { user, setUser } = useAuthStore()
  const [settings, setSettings] = useState<UserAccountSettings>(() =>
    getDefaultAccountSettings(user ?? undefined),
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [gamificationBusy, setGamificationBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    const localSettings = loadAccountSettings(user ?? undefined)
    setSettings(localSettings)

    async function loadRemoteGamificationSetting() {
      try {
        const remoteSettings = await fetchGamificationSettings()
        if (!mounted) return

        setSettings((prev) => ({
          ...prev,
          gamificationEnabled: remoteSettings.gamificationEnabled,
        }))
      } catch {
        if (!mounted) return
      }
    }

    loadRemoteGamificationSetting()

    return () => {
      mounted = false
    }
  }, [user])

  function updateSetting<Key extends keyof UserAccountSettings>(key: Key, value: UserAccountSettings[Key]) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    setSaveState('idle')
  }

  async function updateGamificationSetting(checked: boolean) {
    const previousValue = settings.gamificationEnabled
    const nextSettings = {
      ...settings,
      gamificationEnabled: checked,
    }

    setSettings(nextSettings)
    setGamificationBusy(true)
    setSaveState('idle')

    try {
      const response = await updateGamificationSettings(checked)
      const syncedSettings = {
        ...nextSettings,
        gamificationEnabled: response.gamificationEnabled,
      }

      setSettings(syncedSettings)
      saveAccountSettings(syncedSettings)
      setSaveState('account')
    } catch {
      setSettings((prev) => ({
        ...prev,
        gamificationEnabled: previousValue,
      }))
      setSaveState('error')
    } finally {
      setGamificationBusy(false)
    }
  }

  function handleSave() {
    saveAccountSettings(settings)

    if (user) {
      setUser({
        ...user,
        name: settings.displayName,
      })
    }

    setSaveState('local')
  }

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <section className='rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_4px_20px_rgba(24,24,27,0.04)] sm:p-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600'>
              <SlidersHorizontal className='h-3.5 w-3.5' />
              Account settings
            </div>
            <h1 className='mt-3 text-2xl font-semibold tracking-[-0.05em] text-zinc-950 sm:text-3xl'>
              Tune your travel experience
            </h1>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-zinc-500'>
              Manage your profile details, trip preferences, notifications, and whether your
              travel rewards stay visible on the dashboard.
            </p>
          </div>

          <button
            type='button'
            onClick={handleSave}
            className='inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800'
          >
            Save changes
            <Save className='h-4 w-4' />
          </button>
        </div>

        {saveState === 'account' ? (
          <div className='mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            Travel rewards preference saved to your account.
          </div>
        ) : null}

        {saveState === 'local' ? (
          <div className='mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            Profile details saved locally on this device.
          </div>
        ) : null}

        {saveState === 'error' ? (
          <div className='mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700'>
            <Bell className='h-3.5 w-3.5' />
            Could not sync travel progress. Please try again.
          </div>
        ) : null}
      </section>

      <section className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-4'>
          <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_4px_18px_rgba(24,24,27,0.04)]'>
            <div className='mb-4 flex items-center gap-2'>
              <UserRound className='h-4 w-4 text-orange-500' />
              <h2 className='text-base font-semibold text-zinc-950'>Profile</h2>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <label className='block'>
                <span className='text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>
                  Display name
                </span>
                <input
                  value={settings.displayName}
                  onChange={(e) => updateSetting('displayName', e.target.value)}
                  className='mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:bg-white'
                />
              </label>

              <label className='block'>
                <span className='text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>
                  Home city
                </span>
                <input
                  value={settings.homeCity}
                  onChange={(e) => updateSetting('homeCity', e.target.value)}
                  className='mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:bg-white'
                />
              </label>

              <div className='rounded-[20px] border border-zinc-200 bg-zinc-50 p-4'>
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>
                  <Mail className='h-4 w-4 text-orange-500' />
                  Email
                </div>
                <p className='mt-3 text-sm font-semibold text-zinc-950'>{user?.email || 'Not connected'}</p>
                <p className='mt-1 text-xs text-zinc-500'>Managed by your authentication account.</p>
              </div>

              <div className='rounded-[20px] border border-zinc-200 bg-zinc-50 p-4'>
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>
                  <Phone className='h-4 w-4 text-orange-500' />
                  Phone
                </div>
                <input
                  value={settings.phone}
                  onChange={(e) => updateSetting('phone', e.target.value)}
                  className='mt-3 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300'
                />
              </div>
            </div>
          </div>

          <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_4px_18px_rgba(24,24,27,0.04)]'>
            <div className='mb-4 flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-orange-500' />
              <h2 className='text-base font-semibold text-zinc-950'>Trip profile</h2>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <label className='block'>
                <span className='text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>
                  Preferred language
                </span>
                <select
                  value={settings.preferredLanguage}
                  onChange={(e) =>
                    updateSetting(
                      'preferredLanguage',
                      e.target.value as UserAccountSettings['preferredLanguage'],
                    )
                  }
                  className='mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:bg-white'
                >
                  <option value='English'>English</option>
                  <option value='French'>French</option>
                  <option value='Arabic'>Arabic</option>
                </select>
              </label>

              <label className='block'>
                <span className='text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>
                  Travel style
                </span>
                <select
                  value={settings.travelStyle}
                  onChange={(e) =>
                    updateSetting('travelStyle', e.target.value as UserAccountSettings['travelStyle'])
                  }
                  className='mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:bg-white'
                >
                  <option value='Balanced'>Balanced</option>
                  <option value='Cultural'>Cultural</option>
                  <option value='Adventure'>Adventure</option>
                  <option value='Social'>Social</option>
                </select>
              </label>

              <label className='block'>
                <span className='text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400'>
                  Budget mode
                </span>
                <select
                  value={settings.budgetMode}
                  onChange={(e) =>
                    updateSetting('budgetMode', e.target.value as UserAccountSettings['budgetMode'])
                  }
                  className='mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:bg-white'
                >
                  <option value='Flexible'>Flexible</option>
                  <option value='Mid-range'>Mid-range</option>
                  <option value='Smart saver'>Smart saver</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_4px_18px_rgba(24,24,27,0.04)]'>
            <div className='mb-4 flex items-center gap-2'>
              <Compass className='h-4 w-4 text-orange-500' />
              <h2 className='text-base font-semibold text-zinc-950'>Experience controls</h2>
            </div>

            <div className='space-y-3'>
              <ToggleCard
                title='Show travel progress and rewards'
                description={
                  gamificationBusy
                    ? 'Syncing your travel rewards preference...'
                    : 'Show your goals, XP, and leaderboard directly on the dashboard.'
                }
                checked={settings.gamificationEnabled}
                onChange={updateGamificationSetting}
                disabled={gamificationBusy}
              />
              <ToggleCard
                title='Trip suggestions'
                description='Show suggestions for places and stays while you plan.'
                checked={settings.aiSuggestions}
                onChange={(checked) => updateSetting('aiSuggestions', checked)}
              />
              <ToggleCard
                title='Group match alerts'
                description='Receive nudges when a public group looks relevant for your destination and vibe.'
                checked={settings.groupAlerts}
                onChange={(checked) => updateSetting('groupAlerts', checked)}
              />
              <ToggleCard
                title='Email updates'
                description='Get high-value email reminders about itinerary changes and new planning opportunities.'
                checked={settings.emailUpdates}
                onChange={(checked) => updateSetting('emailUpdates', checked)}
              />
            </div>
          </div>

          <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_4px_18px_rgba(24,24,27,0.04)]'>
            <div className='mb-4 flex items-center gap-2'>
              <Globe className='h-4 w-4 text-orange-500' />
              <h2 className='text-base font-semibold text-zinc-950'>Account snapshot</h2>
            </div>

            <div className='space-y-3'>
              {[
                { label: 'Role', value: user?.role || 'TRAVELER' },
                { label: 'Primary city', value: settings.homeCity },
                { label: 'Travel rewards', value: settings.gamificationEnabled ? 'Visible' : 'Hidden' },
              ].map((item) => (
                <div
                  key={item.label}
                  className='flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3'
                >
                  <span className='text-sm text-zinc-500'>{item.label}</span>
                  <span className='text-sm font-semibold text-zinc-950'>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_4px_18px_rgba(24,24,27,0.04)]'>
            <div className='mb-4 flex items-center gap-2'>
              <Shield className='h-4 w-4 text-orange-500' />
              <h2 className='text-base font-semibold text-zinc-950'>Security</h2>
            </div>

            <div className='rounded-[20px] border border-zinc-200 bg-zinc-50 p-4'>
              <div className='flex items-start gap-3'>
                <Bell className='mt-0.5 h-4 w-4 text-orange-500' />
                <div>
                  <p className='text-sm font-semibold text-zinc-950'>Session protected</p>
                  <p className='mt-1 text-sm leading-6 text-zinc-500'>
                    Your travel rewards toggle now syncs with the backend. The rest of the
                    profile controls still stay local until the broader account settings API is
                    connected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
