import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Globe, Compass, Star, ArrowUpRight, Eye, MapPinned } from "lucide-react";
import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GMAP_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

/* ─── Types ───────────────────────────────────────────── */
type Place = {
  id: number;
  name: string;
  arabic: string;
  landmark: string;
  tagline: string;
  description: string;
  longDescription: string;
  rating: string;
  imageUrl: string;
  lat: number;
  lng: number;
};

/* ─── STATIC DATA ──────────────────────────────────────── */
const PLACES: Place[] = [
  {
    id: 1,
    name: "Marrakech",
    arabic: "مراكش",
    landmark: "Jemaa el-Fna",
    tagline: "The Red City",
    description: "The beating heart of Marrakech, legendary for its life and street food.",
    longDescription: "Jemaa el-Fna is the beating heart of Marrakech. By day it's vibrant, by night it's magical with performers, food stalls, and storytellers.",
    rating: "4.9",
    imageUrl: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=900&q=80&fit=crop",
    lat: 31.6258,
    lng: -7.9891,
  },
  {
    id: 2,
    name: "Chefchaouen",
    arabic: "شفشاون",
    landmark: "Blue Medina",
    tagline: "The Blue Pearl",
    description: "Walk through the iconic blue-painted streets in 360°.",
    longDescription: "Chefchaouen is famous for its calming blue walls and peaceful mountain atmosphere. One of the most photogenic cities in the world.",
    rating: "4.8",
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80&fit=crop",
    lat: 35.1688,
    lng: -5.2636,
  },
  {
    id: 3,
    name: "Fès",
    arabic: "فاس",
    landmark: "Bab Bou Jeloud",
    tagline: "Spiritual Capital",
    description: "Dive into the oldest and most complex medina in the world.",
    longDescription: "Fès is home to the oldest university and one of the most complex medinas ever built. Enter through the legendary Blue Gate.",
    rating: "4.8",
    imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=80&fit=crop",
    lat: 34.0617,
    lng: -4.9845,
  },
  {
    id: 4,
    name: "Merzouga",
    arabic: "مرزوكة",
    landmark: "Erg Chebbi",
    tagline: "The Golden Dunes",
    description: "Feel the infinite dunes of the Moroccan Sahara.",
    longDescription: "Merzouga offers one of the most breathtaking desert landscapes in the world with golden dunes stretching to infinity.",
    rating: "4.9",
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80&fit=crop",
    lat: 31.0991,
    lng: -4.0114,
  },
  {
    id: 5,
    name: "Casablanca",
    arabic: "الدار البيضاء",
    landmark: "Hassan II Mosque",
    tagline: "Modern Giant",
    description: "Explore the largest mosque in Africa over the ocean.",
    longDescription: "Hassan II Mosque stands over the Atlantic Ocean, combining traditional Moroccan craftsmanship with modern engineering.",
    rating: "4.7",
    imageUrl: "https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=900&q=80&fit=crop",
    lat: 33.6084,
    lng: -7.6322,
  },
  {
    id: 6,
    name: "Ouarzazate",
    arabic: "ورزازات",
    landmark: "Ait Ben Haddou",
    tagline: "Film Kingdom",
    description: "Discover the famous ksar used in movies like Gladiator.",
    longDescription: "Ait Ben Haddou is a UNESCO World Heritage site and one of the most iconic desert kasbahs in Morocco.",
    rating: "4.8",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&fit=crop",
    lat: 31.0475,
    lng: -7.1293,
  },
];

/* ─── Components ───────────────────────────────────────── */
function Stars({ rating }: { rating: string }) {
  const n = Math.round(parseFloat(rating));
  return (
    <div className="flex items-center gap-0.5 text-orange-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="w-3 h-3" fill={i <= n ? "currentColor" : "none"} strokeWidth={i <= n ? 0 : 2} />
      ))}
    </div>
  );
}

export default function View360() {
  const [active, setActive] = useState<Place | null>(null);
  const [quotaError, setQuotaError] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || "",
    libraries: GMAP_LIBRARIES,
  });

  const panoRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!isLoaded || !active || !panoRef.current) return;

    const service = new google.maps.StreetViewService();
    // Specialized radius for desert/remote areas
    const searchRadius = active.id === 4 || active.id === 6 ? 1000 : 300;

    service.getPanorama({
      location: { lat: active.lat, lng: active.lng },
      radius: searchRadius,
      source: google.maps.StreetViewSource.OUTDOOR
    }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
        if (!instanceRef.current) {
          instanceRef.current = new google.maps.StreetViewPanorama(panoRef.current!, {
            position: data.location.latLng,
            visible: true,
            addressControl: false,
            enableCloseButton: false,
            showRoadLabels: true,
          });
        } else {
          instanceRef.current.setPosition(data.location.latLng);
        }
      } else if ((status as string) === "OVER_QUERY_LIMIT") {
        console.error("Google Maps Quota Exceeded (429)");
        setQuotaError(true);
      } else {
        // Fallback to exact
        if (!instanceRef.current) {
          instanceRef.current = new google.maps.StreetViewPanorama(panoRef.current!, {
            position: { lat: active.lat, lng: active.lng },
            visible: true,
            addressControl: false,
            enableCloseButton: false,
          });
        } else {
          instanceRef.current.setPosition({ lat: active.lat, lng: active.lng });
        }
      }
    });

  }, [isLoaded, active]);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  return (
    <div className="min-h-screen px-4 py-6 font-['Manrope',sans-serif] md:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] border border-[#e8dfd2] bg-[linear-gradient(135deg,#fffdf9_0%,#f8f1e7_52%,#efe2cf_100%)] px-5 py-6 shadow-[0_22px_70px_rgba(61,42,18,0.08)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[40%] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_58%)]" />
          <div className="pointer-events-none absolute -left-8 top-8 h-28 w-28 rounded-full bg-white/50 blur-2xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="mt-5 max-w-2xl text-[2rem] font-semibold leading-[0.92] tracking-[-0.06em] text-[#17120b] sm:text-[2.6rem] lg:text-[3.4rem]">
                Explore Moroccan landmarks in a cleaner,
                <span className="block text-[#a76427]"> more premium 360 experience.</span>
              </h1>

              <p className="mt-4 max-w-xl text-[13px] leading-6 text-[#6f6254] sm:text-[14px]">
                Choose a destination, open Street View instantly, and move through Morocco’s most iconic places with a calmer and more refined interface.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-[22px] border border-white/70 bg-white/78 px-4 py-4 shadow-[0_10px_30px_rgba(32,24,16,0.05)] backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d8a74]">Places</p>
                <p className="mt-2 text-[1.5rem] font-semibold tracking-[-0.05em] text-[#17120b]">{PLACES.length}</p>
              </div>
              <div className="rounded-[22px] border border-white/70 bg-white/78 px-4 py-4 shadow-[0_10px_30px_rgba(32,24,16,0.05)] backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d8a74]">Mode</p>
                <p className="mt-2 text-[1.1rem] font-semibold tracking-[-0.04em] text-[#17120b]">Street View</p>
              </div>
              <div className="col-span-2 rounded-[22px] border border-white/70 bg-white/78 px-4 py-4 shadow-[0_10px_30px_rgba(32,24,16,0.05)] backdrop-blur sm:col-span-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#c26b1b]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9d8a74]">Status</p>
                </div>
                <p className="mt-2 text-[1.1rem] font-semibold tracking-[-0.04em] text-[#17120b]">Verified</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between gap-4 px-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aa7a43]">Select A City</p>
            <p className="mt-1 text-sm text-[#7b6d5f]">Open any destination to launch the immersive viewer.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#eadfcf] bg-white px-4 py-2 text-[11px] font-semibold text-[#6f6254] shadow-sm sm:flex">
            <MapPinned className="h-4 w-4 text-[#c26b1b]" />
            Premium navigation
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PLACES.map((place) => (
          <button
            key={place.id}
            onClick={() => setActive(place)}
            className="group relative flex h-80 flex-col overflow-hidden rounded-[30px] border border-[#ece3d6] bg-white text-left shadow-[0_18px_50px_rgba(40,28,18,0.05)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#ddc5a5] hover:shadow-[0_28px_70px_rgba(58,38,20,0.12)]"
          >
            <div className="relative h-48 overflow-hidden shrink-0">
              <img src={place.imageUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt={place.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0a]/88 via-[#0f0d0a]/18 to-transparent" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/82 backdrop-blur-sm">
                  {place.tagline}
                </span>
                <div className="rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-[#17120b] shadow-sm">
                  {place.rating}
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <h2 className="text-[1.45rem] font-semibold leading-none tracking-[-0.05em] text-white">
                  {place.name}
                </h2>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">{place.landmark}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between p-5">
              <p className="line-clamp-3 text-[12px] leading-6 text-[#6f6254]">{place.description}</p>
              <div className="flex items-center justify-between border-t border-[#f2ece4] pt-4">
                <div className="flex items-center gap-3">
                  <Stars rating={place.rating} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b7a68]">Open 360</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f1e8] text-[#a76324] transition-all duration-300 group-hover:bg-[#17120b] group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </button>
        ))}
        </div>
      </div>

      {/* Viewer Portal */}
      {active && createPortal(
        <div className="fixed inset-0 w-full h-[100dvh] z-[99999] bg-white animate-in fade-in zoom-in-95 duration-500 overflow-hidden font-['Manrope',sans-serif]">
          <div className="absolute top-6 left-6 right-6 z-50 flex items-start justify-between pointer-events-none">
            <div className="bg-white/90 backdrop-blur-2xl border border-white/50 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-4 pointer-events-auto">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900 font-extrabold text-[14px] tracking-tight leading-none uppercase flex items-center gap-2">
                  {active.name} <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                </h2>
                <p className="text-gray-400 text-[9px] font-bold tracking-widest uppercase mt-1 leading-none">{active.landmark}</p>
              </div>
            </div>
            <button onClick={() => setActive(null)} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-2xl border border-white/50 shadow-xl pointer-events-auto group flex items-center justify-center">
              <X className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </button>
          </div>

          <div className="w-full h-full relative">
            <div ref={panoRef} className="w-full h-full" />
            {!isLoaded && <div className="absolute inset-0 flex items-center justify-center bg-white z-10 font-black uppercase text-[10px] tracking-widest text-orange-500">Loading Tour...</div>}
            
            {quotaError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
                <h3 className="text-gray-900 text-lg font-black uppercase tracking-tight">Quota Exceeded (429)</h3>
                <p className="text-gray-400 text-[11px] font-medium leading-relaxed max-w-xs mt-2">
                  Daily free limit reached for your Google API Key. Please enable billing or check your Quota in Google Cloud Console.
                </p>
                <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-500 transition-colors">
                  Refresh & Retry
                </button>
              </div>
            )}

            {loadError && !quotaError && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 px-8 text-center text-red-500 font-black text-[10px] tracking-widest">Connection Error: Disable AdBlock</div>}
          </div>

          <div className="absolute bottom-8 left-6 right-6 z-50 flex items-end justify-between pointer-events-none gap-6">
            <div className="bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-5 hidden lg:flex items-start gap-4 pointer-events-auto max-w-xl">
               <Eye className="w-4 h-4 text-orange-400 shrink-0 mt-1" />
               <p className="text-gray-500 text-[12px] font-medium italic leading-relaxed">"{active.longDescription}"</p>
            </div>
            <button onClick={() => setActive(null)} className="w-full sm:w-auto h-12 px-10 rounded-xl bg-orange-500 hover:bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 pointer-events-auto flex items-center justify-center gap-3">
              Exit Experience <ArrowUpRight className="w-4 h-4 opacity-50" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
