import Navbar from './Navbar'

/**
 * MapLayout — used only for the /maps route
 * - No footer (map fills full viewport)
 * - Navbar fixed at top
 * - Content starts exactly below navbar
 */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-white">
      {/* Navbar — fixed height, always on top */}
      <div className="relative z-20 shrink-0">
        <Navbar />
      </div>

      {/* Map fills remaining height exactly */}
      <main className="flex-1 overflow-hidden relative z-10">
        {children}
      </main>
      {/* No footer */}
    </div>
  )
}