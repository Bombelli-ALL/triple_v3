import { MapPin, RefreshCw, Star, Loader2 } from 'lucide-react'
import type { MatchSessionResult } from '@/types/match'
import { useState } from 'react'

type MatchSummaryProps = {
  result: MatchSessionResult
  onRestart: () => void
}

export default function MatchSummary({ result, onRestart }: MatchSummaryProps) {
  const main = result.topPicks[0] ?? null
  const [isRestarting, setIsRestarting] = useState(false)

  const handleRestart = () => {
    setIsRestarting(true)
    setTimeout(() => {
      onRestart()
    }, 300)
  }

  // ── IDLE / NO RESULT FALLBACK ───────────────────────────────────────────
  if (!main) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col h-full w-full bg-zinc-50 items-center justify-center p-8">
        <p className="text-zinc-500 font-medium">No perfect picks found.</p>
        <button
          onClick={onRestart}
          className="mt-6 flex items-center justify-center gap-2 w-12 h-12 rounded-full bg-zinc-900 text-white hover:bg-orange-500 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // ── ACTIVE / FULL SCREEN PREMIUM MATCH ──────────────────────────────────
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end overflow-hidden bg-zinc-950 touch-none select-none animate-in fade-in duration-500">
      
      {/* 1. Full-Bleed Background Image taking the entire screen */}
      <img 
        src={main.image} 
        alt={main.title} 
        className="absolute inset-0 w-full h-full object-cover z-0" 
      />

      {/* 2. Premium Dark Gradient Overlay (stretches higher up for readability) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

      {/* 3. Content overlay (Locked to the bottom, pushing up) */}
      <div className="relative z-20 p-6 sm:p-8 w-full pb-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-500/30 text-[10px] font-extrabold uppercase tracking-widest text-orange-400 shadow-sm">
          Perfect Match
        </div>

        {/* Title & Tags */}
        <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-tight mb-3">
          {main.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {main.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-zinc-200 whitespace-nowrap shadow-sm">
              {tag}
            </span>
          ))}
        </div>

        {/* Location & Rating */}
        <div className="flex items-center gap-4 text-zinc-300 text-sm font-medium mb-6">
          <span className="flex items-center gap-1.5 shrink-0">
            <MapPin className="w-4 h-4 text-orange-400" /> {main.city}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
          <span className="flex items-center gap-1.5 shrink-0">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {main.rating.toFixed(1)}
          </span>
        </div>

        {/* Subtle Session Stats */}
        <div className="text-xs font-medium text-zinc-400 mb-6">
          You swiped <strong className="text-white">{result.totalSwiped}</strong> spots to find this match.
        </div>

        {/* Large Premium Button inside the image */}
        <button
          onClick={handleRestart}
          className="group flex items-center justify-center gap-3 w-full h-[60px] rounded-full bg-white text-zinc-950 text-sm font-black tracking-tight hover:bg-orange-500 hover:text-white active:scale-95 transition-all duration-300 shadow-lg"
        >
          {isRestarting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
          )}
          {isRestarting ? 'RESETTING...' : 'START NEW SESSION'}
        </button>
        
      </div>
    </div>
  )
}