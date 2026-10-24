import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion'
import { Search, X, Heart, Flame, Undo2, Compass, MapPin, SlidersHorizontal } from 'lucide-react';

const trips = [
  {
    id: 1,
    title: "Explore the ancient medinas of Fez",
    description: "Wander through centuries-old streets, discover hidden souks, and taste authentic Moroccan cuisine in the heart of Fez...",
    location: "Fez, Morocco",
    country: "Morocco",
    category: "culture",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800"
  },
  {
    id: 2,
    title: "Sunset camel trek in Merzouga dunes",
    description: "Experience the magic of the Sahara desert with a guided camel trek through golden dunes at sunset...",
    location: "Merzouga, Morocco",
    country: "Morocco",
    category: "adventure",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800"
  },
  {
    id: 3,
    title: "Beach & surf escape in Agadir",
    description: "Enjoy pristine Atlantic beaches, world-class surf spots, and fresh seafood along Agadir's stunning coastline...",
    location: "Agadir, Morocco",
    country: "Morocco",
    category: "beach",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
  }
];

export default function MatchTrips() {
  const [cards, setCards] = useState(trips);
  const [history, setHistory] = useState<typeof trips>([]);
  const [progress, setProgress] = useState(0);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setProgress(75), 300);
    return () => clearTimeout(timer);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map motion values to visual changes
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  
  // Stamps opacity
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [-20, -100], [0, 1]);

  const activeCard = cards[0];
  const controls = useAnimation();

  const handleDragEnd = async (_e: any, info: PanInfo) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    const isRightSwipe = info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold;
    const isLeftSwipe = info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold;
    const isUpSwipe = info.offset.y < -swipeThreshold || info.velocity.y < -velocityThreshold;

    if (isRightSwipe) {
      await handleSwipe('right');
    } else if (isLeftSwipe) {
      await handleSwipe('left');
    } else if (isUpSwipe) {
      await handleSwipe('up');
    } else {
      // Snap back if threshold not met
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const handleSwipe = async (dir: 'left' | 'right' | 'up') => {
    const xDist = dir === 'right' ? window.innerWidth : dir === 'left' ? -window.innerWidth : 0;
    const yDist = dir === 'up' ? -window.innerHeight : 0;

    await controls.start({
      x: xDist,
      y: yDist,
      transition: { duration: 0.4, ease: "easeOut" }
    });

    // Reset position instantly for the next card
    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0 });

    setHistory(prev => [activeCard, ...prev]);
    setCards(prev => prev.slice(1));
  };

  const handleAction = async (dir: 'left' | 'right' | 'up') => {
    if (!activeCard) return;
    const xDist = dir === 'right' ? 200 : dir === 'left' ? -200 : 0;
    const yDist = dir === 'up' ? -200 : 0;

    // Trigger visual feedback first
    await controls.start({
      x: xDist,
      y: yDist,
      opacity: 0,
      rotate: dir === 'right' ? 18 : dir === 'left' ? -18 : 0,
      transition: { duration: 0.3 }
    });

    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });

    setHistory(prev => [activeCard, ...prev]);
    setCards(prev => prev.slice(1));
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[0];
    setHistory(prev => prev.slice(1));
    setCards(prev => [last, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col relative overflow-hidden font-sans text-gray-900 pb-20 sm:pb-0">
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-5xl mx-auto px-4 pt-8 pb-4 z-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">Match Trips</h1>
        <p className="text-[#6B7280] mt-2 text-sm sm:text-base">
          Search something like <span className="font-bold text-[#111827]">beach in Agadir</span> or <span className="font-bold text-[#111827]">culture in Fez</span>.
        </p>

        {/* SEARCH BAR */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 relative">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search: city break in Tangier, adventure in Merzouga..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition-all text-sm sm:text-base placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 sm:shrink-0 justify-between sm:justify-start">
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-3 rounded-full hover:bg-gray-100 transition-colors">
              Clear
            </button>
            <button className="bg-[#F97316] hover:bg-orange-600 text-white px-8 py-3.5 rounded-full font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
              Search
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 rounded-full text-xs font-semibold shadow-sm">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Using your preferences
            </span>
          </div>
          <button className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
            Remove filters
          </button>
        </div>
      </div>

      {/* MATCHING INDICATOR / PROGRESS */}
      <div className="w-full max-w-5xl mx-auto px-4 mb-2 z-10">
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-1.5 text-gray-900 font-bold text-sm">
            <Compass className="w-4 h-4 text-orange-500" />
            <span>Round 1</span>
          </div>
          <span className="text-gray-500 text-sm font-medium">Suggestions: {cards.length}</span>
        </div>
      </div>

      {/* SWIPE DECK AREA */}
      <div className="flex-1 flex flex-col justify-center items-center w-full relative -mt-4 sm:mt-0 z-0 px-4">
        
        <div className="relative w-full max-w-[380px] aspect-[4/5] max-h-[600px] flex items-center justify-center">
          <AnimatePresence>
            {cards.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-xl w-full h-full border border-gray-100"
              >
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
                <p className="text-gray-500 text-sm mb-6">You've seen all the trips matching your current preferences.</p>
                <button 
                  onClick={() => setCards(trips)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:bg-orange-600 transition-colors w-full"
                >
                  Reload Suggestions
                </button>
              </motion.div>
            )}
            
            {cards.slice(0, 2).reverse().map((card, index) => {
              const isTop = index === cards.slice(0, 2).length - 1;

              return (
                <motion.div
                  key={card.id}
                  className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden shadow-black/5"
                  style={{
                    x: isTop ? x : 0,
                    y: isTop ? y : 0,
                    rotate: isTop ? rotate : 0,
                    zIndex: isTop ? 10 : 0,
                  }}
                  animate={controls}
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  // animate={{ scale: isTop ? 1 : 0.95, opacity: 1, y: isTop ? 0 : 20 }} - Removed duplicated animate prop
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  dragElastic={1}
                >
                  {/* Card Content Wrapper (pointer events ignored when dragging to not interfere) */}
                  <div className="w-full h-full flex flex-col pointer-events-none select-none relative">
                    
                    {/* Stamps */}
                    {isTop && (
                      <>
                        {/* LIKE Stamp */}
                        <motion.div 
                          className="absolute top-10 left-6 z-20 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-1 rounded-xl uppercase tracking-widest origin-top-left"
                          style={{ opacity: likeOpacity, rotate: -15 }}
                        >
                          Like
                        </motion.div>
                        {/* NOPE Stamp */}
                        <motion.div 
                          className="absolute top-10 right-6 z-20 border-4 border-rose-500 text-rose-500 font-black text-4xl px-4 py-1 rounded-xl uppercase tracking-widest origin-top-right"
                          style={{ opacity: nopeOpacity, rotate: 15 }}
                        >
                          Nope
                        </motion.div>
                        {/* SUPER LIKE Stamp */}
                        <motion.div 
                          className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 border-4 border-blue-500 text-blue-500 font-black text-3xl px-4 py-1 rounded-xl uppercase tracking-widest"
                          style={{ opacity: superLikeOpacity, rotate: -5 }}
                        >
                          Super
                        </motion.div>
                      </>
                    )}

                    {/* Image Area */}
                    <div className="relative h-[55%] w-full bg-gray-200">
                      <img 
                        src={card.image} 
                        alt={card.title} 
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-gray-900 text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                        {card.country}
                      </div>
                      <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm capitalize">
                        {card.category}
                      </div>
                    </div>

                    {/* Info Area */}
                    <div className="flex-1 p-5 lg:p-6 bg-white flex flex-col">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight line-clamp-2">
                          {card.title}
                        </h2>
                      </div>
                      
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                        {card.description}
                      </p>

                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center text-gray-500 text-sm font-medium">
                          <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                          {card.location}
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                          <span className="text-orange-400">★</span>
                          <span className="font-bold text-gray-900 text-sm">{card.rating}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* SWIPE ACTION BUTTONS */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 z-10">
          <button 
            onClick={undo}
            disabled={history.length === 0}
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all active:scale-95 ${history.length === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400'}`}
          >
            <Undo2 className="w-5 h-5" strokeWidth={2.5} />
          </button>
          
          <button 
            onClick={() => handleAction('left')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100 text-rose-500 hover:bg-rose-50 transition-all active:scale-90 shadow-rose-500/10 group"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" strokeWidth={3} />
          </button>
          
          <button 
            onClick={() => handleAction('right')}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-bl from-orange-400 to-orange-500 shadow-xl shadow-orange-500/30 flex items-center justify-center text-white hover:scale-105 transition-all active:scale-90 group border-2 border-white/20"
          >
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform fill-white" strokeWidth={2} />
          </button>
          
          <button 
            onClick={() => handleAction('up')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100 text-blue-500 hover:bg-blue-50 transition-all active:scale-90 shadow-blue-500/10 group"
          >
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform fill-blue-100" strokeWidth={2.5} />
          </button>
        </div>

      </div>

      {/* FLOATING ACTION BUTTON */}
      <button className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-orange-500 text-white w-14 h-14 rounded-full shadow-xl shadow-orange-500/30 flex items-center justify-center hover:bg-orange-600 hover:scale-105 transition-all active:scale-95 z-50">
        <Compass className="w-6 h-6" />
      </button>

    </div>
  );
}
