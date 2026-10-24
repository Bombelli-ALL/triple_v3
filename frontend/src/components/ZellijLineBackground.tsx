/*
 * Login mobile fixes:
 * - Fixed Auto Login button layout and spacing for mobile devices.
 * - Enabled Guide login and upgraded the Login UI with a premium, responsive design.
 * - Normalized Zellij background visibility across Pricing, Collaboration, and FAQ sections.
 * - Cleaned up Hero.tsx by removing 100+ lines of dead code and optimizing Swiper.
 */
export default function ZellijLineBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.35]"
        viewBox="0 0 1600 1000"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="zellijRealPattern" width="220" height="220" patternUnits="userSpaceOnUse">
            <g stroke="rgba(37,99,235,0.26)" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="110,22 124,60 110,72 96,60" />
              <polygon points="178,42 162,74 150,68 154,34" />
              <polygon points="198,110 160,124 148,110 160,96" />
              <polygon points="178,178 150,152 154,140 166,146" />
              <polygon points="110,198 96,160 110,148 124,160" />
              <polygon points="42,178 70,152 66,140 54,146" />
              <polygon points="22,110 60,96 72,110 60,124" />
              <polygon points="42,42 70,68 66,80 54,74" />
              <polygon points="110,72 138,80 148,110 138,140 110,148 82,140 72,110 82,80" />
              <polygon points="124,60 150,68 154,34 138,46" />
              <polygon points="162,74 160,96 190,88 188,70" />
              <polygon points="160,124 150,152 166,146 172,128" />
              <polygon points="96,160 70,152 66,140 82,140" />
              <polygon points="60,124 60,96 30,100 28,120" />
              <polygon points="60,96 66,80 46,60 42,84" />
              <polygon points="96,60 82,80 70,68 84,46" />
              <polygon points="0,0 22,12 28,22 12,28 0,0" />
              <polygon points="0,0 38,0 28,22 22,12" />
              <polygon points="0,0 0,38 22,28 12,22" />
              <polygon points="220,0 198,12 192,22 208,28 220,0" />
              <polygon points="220,0 182,0 192,22 198,12" />
              <polygon points="220,0 220,38 198,28 208,22" />
              <polygon points="0,220 22,208 28,198 12,192 0,220" />
              <polygon points="0,220 38,220 28,198 22,208" />
              <polygon points="0,220 0,182 22,192 12,198" />
              <polygon points="220,220 198,208 192,198 208,192 220,220" />
              <polygon points="220,220 182,220 192,198 198,208" />
              <polygon points="220,220 220,182 198,192 208,198" />
              <polygon points="110,0 124,14 110,22 96,14" />
              <polygon points="84,0 96,14 82,30 68,10" />
              <polygon points="136,0 124,14 138,30 152,10" />
              <polygon points="110,220 124,206 110,198 96,206" />
              <polygon points="84,220 96,206 82,190 68,210" />
              <polygon points="136,220 124,206 138,190 152,210" />
              <polygon points="0,110 14,96 22,110 14,124" />
              <polygon points="0,84 14,96 30,82 10,68" />
              <polygon points="0,136 14,124 30,138 10,152" />
              <polygon points="220,110 206,96 198,110 206,124" />
              <polygon points="220,84 206,96 190,82 210,68" />
              <polygon points="220,136 206,124 190,138 210,152" />
              <line x1="28" y1="22" x2="42" y2="42" />
              <line x1="192" y1="22" x2="178" y2="42" />
              <line x1="28" y1="198" x2="42" y2="178" />
              <line x1="192" y1="198" x2="178" y2="178" />
              <line x1="68" y1="10" x2="54" y2="34" />
              <line x1="152" y1="10" x2="166" y2="34" />
              <line x1="68" y1="210" x2="54" y2="186" />
              <line x1="152" y1="210" x2="166" y2="186" />
              <line x1="10" y1="68" x2="34" y2="54" />
              <line x1="10" y1="152" x2="34" y2="166" />
              <line x1="210" y1="68" x2="186" y2="54" />
              <line x1="210" y1="152" x2="186" y2="166" />
            </g>
          </pattern>

          <radialGradient
            id="leftGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(300 260) rotate(90) scale(360 420)"
          >
            <stop stopColor="rgba(59,130,246,0.10)" />
            <stop offset="1" stopColor="rgba(59,130,246,0)" />
          </radialGradient>

          <radialGradient
            id="rightGlow"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1280 240) rotate(90) scale(340 420)"
          >
            <stop stopColor="rgba(249,115,22,0.08)" />
            <stop offset="1" stopColor="rgba(249,115,22,0)" />
          </radialGradient>

          <linearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="58%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.97)" />
          </linearGradient>
        </defs>

        <rect width="1600" height="1000" fill="url(#zellijRealPattern)" />
        <rect width="1600" height="1000" fill="url(#leftGlow)" />
        <rect width="1600" height="1000" fill="url(#rightGlow)" />
        <rect width="1600" height="1000" fill="url(#heroFade)" />
      </svg>
    </div>
  )
}