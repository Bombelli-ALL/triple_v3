import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { Flame, Heart, MapPin, Undo2, X, Star } from 'lucide-react'
import type { MatchSessionResult, SwipeDecision, SwipeDirection, TripSwipeItem } from '@/types/match'

type Props = {
  items: TripSwipeItem[]
  onComplete: (result: MatchSessionResult) => void
  onDecision?: (direction: SwipeDirection, trip: TripSwipeItem) => void
}

type HistoryEntry = { card: TripSwipeItem; direction: SwipeDirection }

// Memoized Card Content for performance
const CardContent = memo(({ card, round, deckLength }: { card: TripSwipeItem, round: number, deckLength: number }) => (
  <div className="w-full h-full relative select-none flex flex-col rounded-3xl overflow-hidden bg-gray-900" style={{ transform: 'translateZ(0)' }}>
    {/* Image on own layer */}
    <img
      src={card.image}
      alt={card.title}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      draggable={false}
      style={{ willChange: 'transform' }}
      onError={(e) => {
        const el = e.currentTarget
        if (!el.dataset.fallback) {
          el.dataset.fallback = '1'
          el.src = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800`
        }
      }}
    />

    {/* Simple linear gradient instead of complex blurs */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 pointer-events-none" />

    {/* Top Badges (Solid colors, no blur) */}
    <div className="absolute top-4 left-4 flex gap-2 pointer-events-none z-20">
      <span className="bg-white text-gray-900 text-[11px] px-3 py-1 rounded-full font-bold shadow-sm">
        {card.country}
      </span>
    </div>
    
    <div className="absolute top-4 right-4 pointer-events-none z-20">
      <span className="bg-orange-500 text-white text-[11px] px-3 py-1 rounded-full font-bold shadow-sm uppercase tracking-wider">
        {card.tripType?.replace('-', ' ') ?? 'trip'}
      </span>
    </div>

    {/* Bottom Overlay Area */}
    <div className="mt-auto px-5 pb-[104px] pt-10 pointer-events-none relative z-20">
      <div className="mb-2">
        <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight line-clamp-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {card.title}
        </h2>

        <div className="flex items-center gap-4 mt-2 mb-2">
          <span className="flex items-center gap-1.5 text-white/90 text-[13px] font-semibold">
            <MapPin className="w-4 h-4 text-orange-400" />
            {card.city}
          </span>
          <span className="flex items-center gap-1.5 text-yellow-400 text-[13px] font-bold">
            <Star className="w-3.5 h-3.5 fill-yellow-400" />
            {card.rating}
          </span>
        </div>

        <p className="text-white/80 text-[14px] leading-relaxed line-clamp-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {card.description}
        </p>
      </div>

      <div className="flex justify-start opacity-50 mt-2">
         <span className="text-white text-[10px] uppercase tracking-widest font-bold">
           Round {round} • {deckLength} remaining
         </span>
      </div>
    </div>
  </div>
))

CardContent.displayName = 'CardContent'

export default function SwipeDeck({ items, onComplete, onDecision }: Props) {
  const [deck, setDeck] = useState(items)
  const [liked, setLiked] = useState<TripSwipeItem[]>([])
  const [skipped, setSkipped] = useState<TripSwipeItem[]>([])
  const [round, setRound] = useState(1)
  const [decisions, setDecisions] = useState<SwipeDecision[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [busy, setBusy] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    setDeck(items); setLiked([]); setSkipped([]); setRound(1)
    setDecisions([]); setHistory([]); setBusy(false); doneRef.current = false
  }, [items])

  // Optimize motion values
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rot = useTransform(mx, [-300, 300], [-15, 15], { clamp: false })
  
  // Fast opacity transforms
  const likeOp = useTransform(mx, [60, 160], [0, 1])
  const nopeOp = useTransform(mx, [-160, -60], [1, 0])
  const superOp = useTransform(my, [-160, -60], [1, 0])

  const card = deck[0]

  const finish = useCallback((l: TripSwipeItem[], s: TripSwipeItem[], d: SwipeDecision[]) => {
    if (l.length > 1) { setDeck(l); setLiked([]); setRound(r => r + 1); doneRef.current = false; return }
    if (doneRef.current) return
    doneRef.current = true
    onComplete({ likedTrips: l, skippedTrips: s, topPicks: l.slice(0, 3), totalSwiped: d.length, decisions: d })
  }, [onComplete])

  const swipe = useCallback(async (dir: 'left' | 'right' | 'up') => {
    if (!card || busy) return
    setBusy(true)
    
    // Snappy 60fps exit animation
    const duration = 0.25
    animate(mx, dir === 'right' ? 800 : dir === 'left' ? -800 : 0, { duration, ease: 'easeIn' })
    animate(my, dir === 'up' ? -1000 : 0, { duration, ease: 'easeIn' })
    
    await new Promise(r => setTimeout(r, duration * 1000 + 20))
    mx.set(0); my.set(0)

    const direction: SwipeDirection = dir === 'up' ? 'right' : dir
    const dec: SwipeDecision = { tripId: card.id, direction, timestamp: Date.now() }
    const nD = [...decisions, dec]
    const nL = direction === 'right' ? [...liked, card] : liked
    const nS = direction === 'left' ? [...skipped, card] : skipped
    const nDeck = deck.slice(1)

    setDecisions(nD); setLiked(nL); setSkipped(nS); setDeck(nDeck)
    setHistory(p => [...p, { card, direction }])
    onDecision?.(direction, card)
    if (nDeck.length === 0) finish(nL, nS, nD)
    setBusy(false)
  }, [card, busy, mx, my, decisions, liked, skipped, deck, onDecision, finish])

  const onDragEnd = useCallback((_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    if (busy) return
    const threshold = 100
    const velocityThreshold = 400 // easier flick
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) return void swipe('right')
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) return void swipe('left')
    if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) return void swipe('up')
    
    // Very fast snap back
    animate(mx, 0, { type: 'spring', stiffness: 700, damping: 35, mass: 0.8 })
    animate(my, 0, { type: 'spring', stiffness: 700, damping: 35, mass: 0.8 })
  }, [busy, swipe, mx, my])

  const undo = useCallback(() => {
    if (!history.length || busy) return
    const last = history[history.length - 1]
    setHistory(p => p.slice(0, -1)); setDecisions(p => p.slice(0, -1))
    setDeck(p => [last.card, ...p])
    if (last.direction === 'right') setLiked(p => p.filter(t => t.id !== last.card.id))
    else setSkipped(p => p.filter(t => t.id !== last.card.id))
    doneRef.current = false
  }, [history, busy])

  if (!card) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5">
            <Heart className="w-9 h-9 text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No more trips!</h3>
          <p className="text-gray-400 text-sm">Update your search or preferences.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 overflow-hidden py-2 min-h-0 bg-transparent">
      
      <div className="relative w-full max-w-[420px] h-full flex flex-col min-h-0">

        <div className="flex-1 relative min-h-0">
          
          <AnimatePresence>
            {/* Background card preview - simplified for perf */}
            {deck.length > 1 && (
              <div
                key="bg-card"
                className="absolute inset-x-3 inset-y-2 rounded-3xl overflow-hidden pointer-events-none bg-gray-200 opacity-60 z-0"
                style={{ transform: 'scale(0.95) translateY(10px)' }}
              >
                <img src={deck[1].image} alt="" className="w-full h-full object-cover" draggable={false} loading="lazy" />
              </div>
            )}
          </AnimatePresence>

          {/* Active card */}
          <motion.div
            key={card.id + '-' + round}
            className="absolute inset-0 z-10 will-change-transform shadow-lg"
            style={{ x: mx, y: my, rotate: rot, transformOrigin: 'bottom center' }}
            drag={!busy}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.9} // Higher elasticity for lighter feel
            onDragEnd={onDragEnd}
            dragMomentum={false} // Disable momentum for strictly localized drag
          >
            {/* Stamps */}
            <motion.div
              className="absolute top-10 left-6 z-30 border-[6px] border-emerald-400 text-emerald-400 font-extrabold text-4xl px-4 py-1 rounded-xl uppercase tracking-widest pointer-events-none select-none bg-black/30"
              style={{ opacity: likeOp, rotate: -15, willChange: 'opacity' }}
            >LIKE</motion.div>

            <motion.div
              className="absolute top-10 right-6 z-30 border-[6px] border-rose-400 text-rose-400 font-extrabold text-4xl px-4 py-1 rounded-xl uppercase tracking-widest pointer-events-none select-none bg-black/30"
              style={{ opacity: nopeOp, rotate: 15, willChange: 'opacity' }}
            >NOPE</motion.div>

            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 border-[6px] border-sky-400 text-sky-400 font-extrabold text-4xl px-5 py-2 rounded-xl uppercase tracking-[0.2em] pointer-events-none select-none bg-black/30"
              style={{ opacity: superOp, willChange: 'opacity' }}
            >SUPER</motion.div>

            {/* Memoized full-bleed card content */}
            <CardContent card={card} round={round} deckLength={deck.length} />

            {/* ── Buttons INSIDE the card (Solid colors, NO backdrop-blur) ── */}
            <div className="absolute inset-x-0 bottom-6 px-5 flex items-center justify-between gap-2 pointer-events-auto z-40" style={{ transform: 'translateZ(0)' }}>
              <button
                onClick={(e) => { e.stopPropagation(); undo() }}
                disabled={!history.length || busy}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-black/60 text-yellow-400 border border-white/10 transition-transform active:scale-90 disabled:opacity-20"
              >
                <Undo2 className="w-5 h-5" strokeWidth={3} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); swipe('left') }}
                disabled={busy}
                className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center border border-white/10 text-rose-500 transition-transform active:scale-90 disabled:opacity-20"
              >
                <X className="w-8 h-8" strokeWidth={3} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); swipe('right') }}
                disabled={busy}
                className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-xl flex items-center justify-center text-white transition-transform active:scale-90 disabled:opacity-20 ring-4 ring-black/20"
              >
                <Heart className="w-10 h-10 fill-white" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); swipe('up') }}
                disabled={busy}
                className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center border border-white/10 text-sky-400 transition-transform active:scale-90 disabled:opacity-20"
              >
                <Flame className="w-8 h-8 fill-sky-400/20" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
