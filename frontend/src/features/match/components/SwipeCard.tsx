import { memo, useEffect, useRef, useState } from 'react'
import { MapPin, Star, Wallet, Wifi } from 'lucide-react'
import type { SwipeDirection, TripSwipeItem } from '@/types/match'
import { usePrefersReducedMotion } from '@/features/match/utils/usePrefersReducedMotion'

export type SwipeRequest = {
  id: number
  direction: SwipeDirection
}

type SwipeCardProps = {
  trip: TripSwipeItem
  onSwipe: (direction: SwipeDirection) => void
  swipeRequest: SwipeRequest | null
}

type GestureAxis = 'undecided' | 'horizontal' | 'vertical'

type GestureThresholds = {
  intentThresholdPx: number
  axisRatio: number
  swipeTriggerPx: number
}

const SWIPE_MOTION = {
  swipeDistancePx: 560,
  swipeRotateDeg: 13,
  dragRotateDivisor: 26,
  springTransition: 'transform 300ms cubic-bezier(0.2, 0.9, 0.2, 1)',
  fadeTransition: 'opacity 200ms ease-out',
  scaleTransition: 'scale 240ms cubic-bezier(0.2, 0.9, 0.2, 1)',
} as const

const GESTURE_THRESHOLD_BY_POINTER: Record<string, GestureThresholds> = {
  touch: {
    intentThresholdPx: 13,
    axisRatio: 1.24,
    swipeTriggerPx: 98,
  },
  mouse: {
    intentThresholdPx: 9,
    axisRatio: 1.12,
    swipeTriggerPx: 84,
  },
  pen: {
    intentThresholdPx: 11,
    axisRatio: 1.16,
    swipeTriggerPx: 90,
  },
  default: {
    intentThresholdPx: 11,
    axisRatio: 1.16,
    swipeTriggerPx: 90,
  },
}

function getGestureThresholds(pointerType: string | null) {
  if (!pointerType) return GESTURE_THRESHOLD_BY_POINTER.default
  return GESTURE_THRESHOLD_BY_POINTER[pointerType] ?? GESTURE_THRESHOLD_BY_POINTER.default
}

function truncateDescription(text: string, maxLength = 100) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}...`
}

function SwipeCard({ trip, onSwipe, swipeRequest }: SwipeCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [swipeDir, setSwipeDir] = useState<SwipeDirection | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const pointerTypeRef = useRef<string | null>(null)
  const thresholdsRef = useRef<GestureThresholds>(GESTURE_THRESHOLD_BY_POINTER.default)
  const gestureAxisRef = useRef<GestureAxis>('undecided')
  const isDraggingRef = useRef(false)
  const dragRef = useRef({ x: 0, y: 0 })
  const pendingDragRef = useRef<{ x: number; y: number } | null>(null)
  const dragFrameRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const flushDragFrame = () => {
    dragFrameRef.current = null
    if (!pendingDragRef.current) return
    const next = pendingDragRef.current
    pendingDragRef.current = null
    dragRef.current = next
    setDrag((prev) => (prev.x === next.x && prev.y === next.y ? prev : next))
  }

  useEffect(() => {
    setDrag({ x: 0, y: 0 })
    setIsDragging(false)
    setSwipeDir(null)
    gestureAxisRef.current = 'undecided'
    isDraggingRef.current = false
    dragRef.current = { x: 0, y: 0 }
    pendingDragRef.current = null
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current)
      dragFrameRef.current = null
    }
    startRef.current = null
    pointerIdRef.current = null
    pointerTypeRef.current = null
  }, [trip.id])

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current)
    }
  }, [])

  useEffect(() => {
    if (!swipeRequest || isDragging || swipeDir) return
    setSwipeDir(swipeRequest.direction)
    onSwipe(swipeRequest.direction)
  }, [isDragging, onSwipe, swipeDir, swipeRequest])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeDir) return
    setIsDragging(true)
    isDraggingRef.current = true
    gestureAxisRef.current = 'undecided'
    startRef.current = { x: event.clientX, y: event.clientY }
    pointerIdRef.current = event.pointerId
    pointerTypeRef.current = event.pointerType || null
    thresholdsRef.current = getGestureThresholds(pointerTypeRef.current)
    containerRef.current = event.currentTarget
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !startRef.current) return
    const dx = event.clientX - startRef.current.x
    const dy = event.clientY - startRef.current.y
    const thresholds = thresholdsRef.current

    if (gestureAxisRef.current === 'undecided') {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (absX < thresholds.intentThresholdPx && absY < thresholds.intentThresholdPx) return

      if (absX > absY * thresholds.axisRatio) {
        gestureAxisRef.current = 'horizontal'

        if (pointerIdRef.current !== null && containerRef.current) {
          containerRef.current.setPointerCapture(pointerIdRef.current)
        }
      } else if (absY > absX * thresholds.axisRatio) {
        gestureAxisRef.current = 'vertical'
        return
      } else {
        return
      }
    }

    if (gestureAxisRef.current === 'vertical') return
    pendingDragRef.current = { x: dx, y: dy * 0.3 }
    if (dragFrameRef.current === null) {
      dragFrameRef.current = requestAnimationFrame(flushDragFrame)
    }
  }

  const resetDrag = () => {
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current)
      dragFrameRef.current = null
    }
    pendingDragRef.current = null
    setDrag({ x: 0, y: 0 })
    setIsDragging(false)
    isDraggingRef.current = false
    gestureAxisRef.current = 'undecided'
    dragRef.current = { x: 0, y: 0 }
    startRef.current = null
    pointerIdRef.current = null
    pointerTypeRef.current = null
  }

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return

    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current)
      flushDragFrame()
    }

    if (gestureAxisRef.current !== 'horizontal') {
      resetDrag()
      return
    }

    const thresholds = thresholdsRef.current
    const dragX = dragRef.current.x

    if (Math.abs(dragX) > thresholds.swipeTriggerPx) {
      setIsDragging(false)
      isDraggingRef.current = false
      gestureAxisRef.current = 'undecided'
      startRef.current = null
      pointerIdRef.current = null
      pointerTypeRef.current = null
      const direction: SwipeDirection = dragX > 0 ? 'right' : 'left'
      setSwipeDir(direction)
      onSwipe(direction)
    } else {
      resetDrag()
    }
  }

  const dragX = drag.x
  const dragY = drag.y
  const dragStrength = Math.min(Math.abs(dragX) / 220, 1)
  const overlayOpacity = Math.min(Math.abs(dragX) / 120, 1)
  const showRejectOverlay = dragX < -30
  const showChooseOverlay = dragX > 30
  const cardOpacity = swipeDir ? 0 : 1 - dragStrength * 0.08
  const cardScale = swipeDir ? 0.98 : isDragging ? 1 - dragStrength * 0.015 : 1
  const transformStyle = swipeDir
    ? prefersReducedMotion
      ? `translateX(${swipeDir === 'right' ? SWIPE_MOTION.swipeDistancePx : -SWIPE_MOTION.swipeDistancePx}px)`
      : `translateX(${swipeDir === 'right' ? SWIPE_MOTION.swipeDistancePx : -SWIPE_MOTION.swipeDistancePx}px) rotate(${swipeDir === 'right' ? SWIPE_MOTION.swipeRotateDeg : -SWIPE_MOTION.swipeRotateDeg}deg) scale(${cardScale})`
    : prefersReducedMotion
      ? `translate3d(${dragX}px, ${dragY}px, 0)`
      : `translate3d(${dragX}px, ${dragY}px, 0) rotate(${dragX / SWIPE_MOTION.dragRotateDivisor}deg) scale(${cardScale})`
  const transitionStyle = isDragging
    ? 'none'
    : prefersReducedMotion
      ? 'transform 160ms ease-out, opacity 140ms linear'
      : `${SWIPE_MOTION.springTransition}, ${SWIPE_MOTION.fadeTransition}, ${SWIPE_MOTION.scaleTransition}`

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
      style={{
        transform: transformStyle,
        opacity: cardOpacity,
        transition: transitionStyle,
        touchAction: 'pan-y',
        willChange: 'transform, opacity',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="relative h-[46%]">
        <img src={trip.image} alt={trip.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

        <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-zinc-700">
          {trip.city}
        </div>

        <div className="absolute right-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold text-white">
          {trip.tripType}
        </div>

        {showRejectOverlay && (
          <div
            className="absolute left-3 top-14 rounded-xl border-2 border-red-500 bg-white/90 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-red-500"
            style={{ opacity: overlayOpacity }}
          >
            Pass
          </div>
        )}

        {showChooseOverlay && (
          <div
            className="absolute right-3 top-14 rounded-xl border-2 border-emerald-500 bg-white/90 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-600"
            style={{ opacity: overlayOpacity }}
          >
            Choose
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold leading-tight text-zinc-900">{trip.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{truncateDescription(trip.description)}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-current" />
            {trip.rating.toFixed(1)}
          </div>
        </div>

        <div className="grid gap-2 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-zinc-400" />
            {trip.city}, {trip.country}
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-zinc-400" />
            {trip.budget}
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-zinc-400" />
            {trip.wifi ? 'Wi-Fi available' : 'No Wi-Fi'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {trip.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(SwipeCard)
