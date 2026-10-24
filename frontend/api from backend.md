# Backend API Endpoints (Required by Frontend)

## Authentication
- **POST** `/register` : Registers a new user
- **POST** `/login` : Authenticates a user and returns a token
- **POST** `/refresh` : Refreshes the authentication token
- **POST** `/logout` : Logs out the current user

## Users & Leaderboard
- **GET** `/users/leaderboard` : Fetches leaderboard entries

## Trips & Flights
- **GET** `/trips` : Fetches public trips
- **POST** `/flights/search` : Searches for flights
- **GET** `/cities` : Fetches city options

## Groups & Social
- **GET** `/groups/search` : Searches for groups based on parameters
- **GET** `/groups` : Fetches all groups
- **POST** `/groups` : Creates a new group
- **GET** `/groups/:groupId` : Fetches details of a specific group
- **PATCH** `/groups/:groupId` : Updates a specific group
- **DELETE** `/groups/:groupId` : Deletes a specific group
- **POST** `/groups/:groupId/join` : Requests to join a group
- **DELETE** `/groups/:groupId/join` : Cancels a join request

## Group Members & Management
- **PATCH** `/groups/:groupId/members/:userId/review` : Reviews a join request (accept/reject)
- **PATCH** `/groups/:groupId/members/:userId/role` : Updates a member's role
- **DELETE** `/groups/:groupId/members/:userId` : Removes a member from the group
- **GET** `/user/groups` : Fetches groups the current user is a member of
- **GET** `/user/groups/managed` : Fetches groups managed by the user
- **GET** `/user/groups/requests` : Fetches pending incoming join requests for managed groups

## Group Messaging
- **GET** `/groups/:groupId/messages` : Fetches chat history for a group
- **POST** `/groups/:groupId/messages` : Sends a message to a group chat

## Notifications
- **GET** `/notifications` : Fetches user notifications
- **PATCH** `/notifications/:notificationId/read` : Marks a notification as read
- **PATCH** `/notifications/read-all` : Marks all notifications as read

## Bookings
- **GET** `/bookings` : Fetches public bookings

## Agent & AI
- **POST** `/agent/hero` : Main Hero Agent prompt processing (Intent detection)
- **GET** `/agent/hero` : Alternative GET for Hero Agent prompt
- **POST** `/agent/chat` : Handles chatbot messaging replies

## Gamification
- **GET** `/gamification/overview` : Fetches user's gamification stats (XP, level, score)
- **GET** `/gamification/settings` : Fetches user's gamification settings
- **PATCH** `/gamification/settings` : Updates user's gamification settings
- **POST** `/gamification/events` : Tracks a gamification event
