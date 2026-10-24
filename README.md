# Trippple — AI-Powered Morocco Travel Companion

[Visit the live app](https://triple.nexdevo.com)

Trippple is a Morocco-first AI travel SaaS platform built to help visitors explore the country with confidence. From one prompt, travelers can create a tailored trip plan, discover places and local guides, compare booking options, connect with travel groups, and receive help from an AI concierge.

The platform addresses a real gap in Morocco's travel ecosystem: travelers need one intelligent, local-first service that makes planning and navigating a trip simpler. By bringing itinerary planning, local discovery, group travel, guides, and booking support together, Trippple can help many travelers make safer, more informed, and more memorable journeys across Morocco.

## Highlights

- **AI travel concierge** for trip planning, questions, guide discovery, group travel, and booking suggestions
- **Personalized trip planning** with itineraries, destinations, attractions, and travel preferences
- **Social travel** through groups, membership requests, group chat, and traveler matching
- **Booking support** for travel services and flight-search experiences
- **Local discovery** for Moroccan cities, regions, attractions, and guides
- **Gamification** with XP, quests, streaks, and leaderboards
- **Secure accounts** with JWT authentication and Google OAuth
- **User and admin workspaces** for managing the platform experience

## Live Application

The deployed application is available at **[triple.nexdevo.com](https://triple.nexdevo.com)**.

Scan the QR code to open the live application:

[![QR code for triple.nexdevo.com](qrcode.png)](https://triple.nexdevo.com)

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, REST API |
| Data | PostgreSQL, Prisma |
| AI | Ollama with Gemma models, with Gemini API support |
| Authentication | JWT and Google OAuth 2.0 |
| Deployment | Docker and Nginx |

## Project Structure

```text
.
├── frontend/   # React web application
├── backend/    # NestJS API and Prisma database layer
└── deploy/     # Docker and deployment configuration
```

## Run Locally

### Prerequisites

- Node.js 20 or newer
- PostgreSQL
- Ollama with a Gemma model, or a Gemini API key for AI features

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
npm run generate
npm run migrate
npm run seed
npm run start:dev
```

Set the values in `backend/.env`, including `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and your AI provider key.

### 2. Configure the frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

For local development, set the frontend API URL in `frontend/.env`:

```env
VITE_PUBLIC_API_URL="http://localhost:3000/api"
```

The frontend development server will print its local URL, typically `http://localhost:5173`.

## Useful Commands

| Location | Command | Purpose |
| --- | --- | --- |
| `frontend` | `npm run build` | Create a production frontend build |
| `frontend` | `npm run lint` | Lint frontend source files |
| `backend` | `npm run build` | Generate Prisma client and build the API |
| `backend` | `npm run test` | Run backend tests |
| `backend` | `npm run start:dev` | Start the API in watch mode |

## API

The local API is served under `http://localhost:3000/api`. Main feature areas include authentication, trips, bookings, groups, notifications, travel content, flights, gamification, and the AI agent.

For a detailed list of backend endpoints, see [backend/ENDPOINTS.md](backend/ENDPOINTS.md).

## Hackathon Team

This project was built by:

1. Zakaria Alliouate
2. Abderrahman El Bissari
3. Mohamed Amine Jabri
4. Alaa Eddine Erradi

## License

Trippple is released under the [MIT License](LICENSE).
