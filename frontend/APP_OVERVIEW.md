# Trippple — Full App Overview

Trippple is a premium, AI‑powered travel companion that takes a single prompt and turns it into an actionable trip plan, booking suggestions, and collaboration options. It blends AI planning with real people (guides + co‑travelers), and delivers everything inside a polished user dashboard.

---

## 1) What We Are

**Trippple** is a travel platform focused on:
- **Smart trip planning** (itinerary + budget + logistics)
- **All‑in‑one booking** (stays, transport, activities, rentals)
- **Collaboration** (group trips, matching, shared planning)
- **Local guides** (verified guide discovery)

It is designed for fast decision‑making: users can go from idea → plan → booking in a single flow.

---

## 2) What We Have Right Now (Current State)

### Landing Page (Marketing)
- Premium hero with animated placeholder input
- AI prompt → preloader → dashboard transition
- Feature sections (problem, MVP, CTA, collaboration, pricing, FAQ)

### Dashboard (User)
- AI response panel (intent + follow‑up question)
- Booking suggestion cards
- Trips overview (cards + status + budget)
- Recent activity feed
- User bottom navigation (Maps, Match, Trips, Groups, etc.)
- Floating AI chat panel (right‑side)

### Admin Area
- Admin routes and layout are set (dashboards, users, trips, analytics)

---

## 3) Core UX Flow

**1. User prompt on landing page**
- User types the trip idea
- Premium preloader appears
- User is routed to user dashboard

**2. AI response appears in dashboard**
- Agent classifies intent
- Generates recommendations + follow‑up question
- Shows booking suggestions instantly

**3. User continues into booking / collaboration / guides**

---

## 4) AI Agent Structure (Intent‑Driven)

The agent classifies the user request into one of the following **intent types**:

- **booking** → Build a trip plan + shortlist booking options
- **information** → Answer question + suggest conversion into trip
- **collaboration** → Match or open trip room
- **guide** → Suggest guides or nearby alternatives
- **new_trip** → Ask to create a trip if none exists

### AI Outputs
Each AI response returns:
- `answer` (short plan or summary)
- `intent`
- `followUpQuestion` (if more info needed)
- `bookings[]` (shortlist of options)

---

## 5) Feature Set (Planned + Live)

### Planning
- Itinerary generation
- Budget estimation
- Suggested routes & daily schedules

### Booking
- Flights, stays, activities, transport, rentals
- Price bands + verified providers

### Collaboration
- Trip rooms for group planning
- Matching travelers by vibe + budget
- Shared itinerary and voting

### Guides
- Guide discovery by region + budget
- Alternatives if no exact match

### AI Assistant
- Prompt‑based planning
- Intent detection
- Follow‑up questions for missing info

---

## 6) Technical Architecture

### Frontend
- **React + Vite + TypeScript + Tailwind**
- Animated hero + premium UI components
- User + Admin layout shells

### Backend
- **NestJS** for API
- **Prisma + PostgreSQL** for data
- **pgvector** for embeddings
- Authentication with JWT

### AI
- **Groq API** (free tier)
- Local fallback embeddings if no key

---

## 7) Key Routes

- `/` — Landing page
- `/user/*` — User system (dashboard, maps, trips, groups, match, AI)
- `/admin/*` — Admin system

---

## 8) Key API Endpoints

- `POST /api/agent/hero`
  - Input: `{ prompt }`
  - Output: `{ answer, intent, followUpQuestion?, bookings[] }`

---

## 9) Current Limitations / Next Steps

### Current
- Dataset quality needs cleanup / enrichment
- Fonts need fixes
- Agent still uses fallback if Groq key fails

### Next Steps
- True booking integration (providers + checkout)
- Collaboration matching engine
- Guide database + availability
- Real‑time trip rooms

---

## 10) Premium Experience Goals

- Fast prompts → instant value
- Soft transitions + animation
- High‑trust UI with verified provider badges
- Simple, clear CTAs that drive conversion

---

## 11) Deployment Notes

- Frontend + backend are a monorepo
- Railway supports split services (frontend + backend)
- Environment variables should be configured per service

---

## 12) Summary (1‑Line Pitch)

> “Trippple is the AI travel agent that books, plans, and connects travelers in one seamless flow.”
