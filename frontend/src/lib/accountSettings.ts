type AccountUserSeed = {
  name?: string | null
  email?: string | null
}

export type UserAccountSettings = {
  displayName: string
  homeCity: string
  phone: string
  preferredLanguage: 'English' | 'French' | 'Arabic'
  travelStyle: 'Balanced' | 'Cultural' | 'Adventure' | 'Social'
  budgetMode: 'Flexible' | 'Mid-range' | 'Smart saver'
  emailUpdates: boolean
  aiSuggestions: boolean
  groupAlerts: boolean
  gamificationEnabled: boolean
}

export const ACCOUNT_SETTINGS_STORAGE_KEY = 'trippple-account-settings'
export const ACCOUNT_SETTINGS_UPDATED_EVENT = 'trippple-settings-updated'

export function getDefaultAccountSettings(user?: AccountUserSeed): UserAccountSettings {
  return {
    displayName: user?.name?.trim() || 'Traveler',
    homeCity: 'Fez',
    phone: '+212 6 00 00 00 00',
    preferredLanguage: 'English',
    travelStyle: 'Balanced',
    budgetMode: 'Mid-range',
    emailUpdates: true,
    aiSuggestions: true,
    groupAlerts: true,
    gamificationEnabled: true,
  }
}

export function loadAccountSettings(user?: AccountUserSeed): UserAccountSettings {
  const defaults = getDefaultAccountSettings(user)

  if (typeof window === 'undefined') return defaults

  try {
    const raw = window.localStorage.getItem(ACCOUNT_SETTINGS_STORAGE_KEY)
    if (!raw) return defaults

    const parsed = JSON.parse(raw) as Partial<UserAccountSettings>
    return {
      ...defaults,
      ...parsed,
      displayName: parsed.displayName?.trim() || defaults.displayName,
    }
  } catch {
    return defaults
  }
}

export function saveAccountSettings(settings: UserAccountSettings) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(ACCOUNT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(ACCOUNT_SETTINGS_UPDATED_EVENT))
}
