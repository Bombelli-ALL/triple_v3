# Backend API Endpoints Requirements

This document outlines the required backend API endpoints based on the analysis of the current frontend implementation. These endpoints are necessary for integrating the user-related features and ensuring a smooth user experience.

## User & Authentication

Endpoints for managing user identity, sessions, and roles.

*   `POST /api/auth/login`: Authenticate user and return token + role.
*   `POST /api/auth/register`: Create a new user account.
*   `GET /api/auth/me`: Get current authenticated user details.
*   `GET /api/user/profile/:id`: Get public profile of a user (used in Groups and Leaderboard).
*   `PUT /api/user/profile`: Update user profile (display name, avatar, bio, etc.).
*   `GET /api/user/settings`: Get user account settings (preferences, notification toggles).
*   `PUT /api/user/settings`: Update user account settings.

## Gamification & Leaderboard

Endpoints for tracking user progress, rewards, and social competition.

*   `GET /api/gamification/stats`: Get user's current XP, level, score, rank, active streaks, and current quests.
*   `POST /api/gamification/track`: Track gamification events (e.g., `GROUP_SCOUTED`, `MAP_INTERACTED`, `AI_PROMPT_SENT`).
*   `GET /api/gamification/settings`: Get user's gamification visibility settings.
*   `PUT /api/gamification/settings`: Update user's gamification visibility settings.
*   `GET /api/users/leaderboard`: Get leaderboard data (categories: `global`, `friends`, `city`).

## Trips & Itineraries

Endpoints for generating and managing user trip plans and itineraries.

*   `POST /api/trips/generate`: Generate a full trip plan based on a prompt, city, duration, and budget (AI-powered).
*   `GET /api/user/trips`: Get the list of user's past, saved, and draft trip plans.
*   `GET /api/user/trips/:id`: Get detailed information for a specific trip plan.
*   `POST /api/user/trips`: Save a generated or custom trip plan to the user's account.
*   `PUT /api/user/trips/:id`: Update/customize an existing trip plan.
*   `DELETE /api/user/trips/:id`: Remove a trip plan.
*   `GET /api/trips`: Get trip suggestions/matches for the "Match" feature.

## Bookings

Endpoints for managing reservations across different services.

*   `GET /api/user/bookings`: Get all active and past bookings for the user.
*   `POST /api/bookings`: Create a new booking (types: `flight`, `riad`, `transport`, `activity`).
*   `GET /api/bookings/:id`: Get details of a specific booking.
*   `DELETE /api/bookings/:id`: Cancel an existing booking.

## Groups & Social

Endpoints for community discovery, membership, and interaction.

*   `GET /api/groups`: Search and filter travel groups.
*   `GET /api/groups/:id`: Get detailed group info including destination, dates, and member list.
*   `POST /api/groups/:id/join`: Request to join a group.
*   `DELETE /api/groups/:id/join`: Cancel a join request.
*   `GET /api/user/groups`: Get groups where the user is a member or has a pending request.
*   `GET /api/groups/:id/messages`: Fetch chat history for a specific group.
*   `POST /api/groups/:id/messages`: Send a message to a group chat.

## Maps & POIs

Endpoints for location-based data and navigation.

*   `GET /api/map/pois`: Get points of interest based on category, bounds, or search query.
*   `GET /api/user/pinned-locations`: Get user's manually added pins on the map.
*   `POST /api/user/pinned-locations`: Save a new manual pin to the user's map.
*   `GET /api/map/route`: (Optional) Backend proxy or custom logic for route calculations.

## AI Concierge

The primary endpoint for the AI-driven assistant experience.

*   `POST /api/agent/hero`: The main interface for the hero agent, handling intent detection, follow-up questions, and providing context-aware suggestions.
