// useShowRouteAction.ts
import { useCallback } from 'react'
import type { ShowRouteAction, ShowRouteActionResult, RouteWaypoint, TripRoute } from './types'
import { DEMO_TRIPS, normalizeWaypoints } from './mapUtils'

interface UseShowRouteActionOptions {
  onRoute: (route: TripRoute, source: 'trip' | 'waypoints' | 'ai', label?: string) => void
  onError: (msg: string) => void
}

export function useShowRouteAction({ onRoute, onError }: UseShowRouteActionOptions) {
  const dispatch = useCallback(
    (action: ShowRouteAction): ShowRouteActionResult => {
      if (action.type !== 'SHOW_ROUTE') {
        const err = `Unknown action type: ${(action as any).type}`
        onError(err)
        return { ok: false, error: err }
      }

      const { payload } = action

      // Case 1: tripId provided
      if (payload.tripId) {
        const trip = DEMO_TRIPS.find(t => t.id === payload.tripId)
        if (!trip) {
          const err = `Trip "${payload.tripId}" not found.`
          onError(err)
          return { ok: false, error: err }
        }
        if (!trip.route || !normalizeWaypoints(trip.route).length) {
          const err = `Trip "${trip.title}" has no route data.`
          onError(err)
          return { ok: false, error: err }
        }
        onRoute(trip.route, 'trip', `Route loaded — ${trip.title}`)
        return { ok: true, source: 'trip', label: trip.title }
      }

      // Case 2: explicit waypoints provided
      if (payload.waypoints && payload.waypoints.length >= 2) {
        const wps: RouteWaypoint[] = payload.waypoints.map(w => ({
          lat: w.lat,
          lng: w.lng,
          label: w.label,
        }))
        const route: TripRoute = {
          tripId: `ai-${Date.now()}`,
          waypoints: wps,
        }
        onRoute(route, 'ai', 'Route loaded')
        return { ok: true, source: 'ai' }
      }

      const err = 'Invalid SHOW_ROUTE payload: provide tripId or at least 2 waypoints.'
      onError(err)
      return { ok: false, error: err }
    },
    [onRoute, onError],
  )

  return { dispatch }
}