# Trippple — AI‑Powered Travel Companion

Trippple is a premium, AI‑driven travel platform that turns a single prompt into a tailored travel plan, booking shortlist, and collaboration options. Start on the landing page, describe your trip, and get routed into a dashboard that handles the rest.

## What’s Live

- **AI Trip Agent** (Groq‑powered) that understands intent:
  - `booking` — builds a travel plan + booking shortlist
  - `information` — answers questions and nudges conversion
  - `collaboration` — helps match and join trip groups
  - `guide` — finds guides or suggests nearby options
  - `new_trip` — asks to create a new trip when none exist
- **Hero → Dashboard flow** with a premium preloader
- **Dashboard view** that displays agent response + booking suggestions
- **User & Admin areas** with layouts and navigation

## Product Flow (MVP)

1. User enters a prompt on the landing page
2. Preloader appears (premium transition)
3. User is routed to `/dashboard`
4. Agent response + booking suggestions render

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind
- **Backend:** NestJS + Prisma + PostgreSQL
- **AI:** Groq API (OpenAI‑compatible)

## Key Routes

- `/` Landing page
- `/dashboard` AI results dashboard (user flow)
- `/admin/*` Admin suite
- `/user/*` User suite

## API

- `POST /api/agent/hero`
  - Body: `{ "prompt": "Plan a 3‑day Marrakech trip" }`
  - Response: `{ answer, intent, followUpQuestion?, bookings[] }`

## Local Setup

### 1) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Environment variables

Create your own `.env` files (they are ignored by git).

**backend/.env**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hackathon"
JWT_SECRET="super-secure-secret"
JWT_REFRESH_SECRET="super-secure-refresh-secret"
GROQ_API_KEY="<your_groq_api_key>"
GROQ_MODEL="llama-3.1-8b-instant"
```

**frontend/.env**
```
VITE_PUBLIC_API_URL="http://localhost:3000/api"
```

### 3) Prisma

```bash
cd backend
npm run generate
```

### 4) Run the app

```bash
# backend
cd backend
npm run start:dev

# frontend
cd ../frontend
npm run dev
```

## Design & UX Notes

- Landing page + hero designed for premium conversion
- Preloader uses the brand palette and soft gradients
- Typed placeholder animation enhances perceived intelligence

## Roadmap (Near‑Term)

- Full agent orchestration by intent
- Booking engine integration
- Collaboration matching and trip rooms
- Guide discovery + availability
- Personalized onboarding

---

If you want specific demo flows or data seeded, add them and the agent will surface them on the dashboard.
