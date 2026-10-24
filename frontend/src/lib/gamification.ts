import api from '@/lib/api'

export type GamificationQuestStatus = 'completed' | 'in-progress' | 'up-next'

export type GamificationQuest = {
  id: string
  title: string
  description: string
  xp: number
  status: GamificationQuestStatus
  progress: number
  progressLabel: string
  href: string
  actionLabel: string
}

export type GamificationLeaderboardEntry = {
  id: string
  name: string
  label: string
  xp: number
  isCurrentUser?: boolean
}

export type GamificationOverview = {
  settings: {
    gamificationEnabled: boolean
  }
  context: {
    city: string
    durationDays: number
  }
  summary: {
    totalXp: number
    rankLabel: string
    streakDays: number
    completedQuests: number
    liveQuests: number
    nextQuests: number
    nextUnlock: string | null
  }
  quests: GamificationQuest[]
  leaderboard: GamificationLeaderboardEntry[]
}

export type GamificationSettings = {
  gamificationEnabled: boolean
}

export const GAMIFICATION_EVENT_TYPES = [
  'ROUTE_BUILT',
  'AI_PROMPT_SENT',
  'LOCAL_SPOT_MATCHED',
  'GROUP_SCOUTED',
  'MAP_PREVIEWED',
] as const

export type GamificationEventType = (typeof GAMIFICATION_EVENT_TYPES)[number]

type TrackGamificationEventResponse = {
  tracked: boolean
  type: GamificationEventType
  amount: number
  overview: GamificationOverview
}

export async function fetchGamificationOverview() {
  const response = await api.get<GamificationOverview>('/gamification/overview')
  return response.data
}

export async function fetchGamificationSettings() {
  const response = await api.get<GamificationSettings>('/gamification/settings')
  return response.data
}

export async function updateGamificationSettings(enabled: boolean) {
  const response = await api.patch<GamificationSettings>('/gamification/settings', {
    enabled,
  })
  return response.data
}

export async function trackGamificationEvent(
  type: GamificationEventType,
  amount = 1,
) {
  try {
    const response = await api.post<TrackGamificationEventResponse>('/gamification/events', {
      type,
      amount,
    })
    return response.data
  } catch (err) {
    // Silently fail if gamification is not yet implemented on the backend
    console.warn(`Gamification event ${type} could not be tracked (backend may not support it yet).`)
    return null
  }
}
