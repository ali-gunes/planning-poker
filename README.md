# Planning Poker Web App - Action Plan

This document outlines the steps to build our real-time planning poker web application.

## Core Features

1.  **Room Creation:** A user can create a room and get an invite link.
2.  **Joining a Room:** Users with the invite link can join the room.
3.  **Voting:**
    *   The room owner (or a Product Owner) can start a voting round.
    *   Participants vote using Fibonacci numbers (e.g., by clicking on cards).
4.  **Revealing Votes:**
    *   The room owner can reveal the votes.
    *   When revealed, the app should show everyone's votes.
    *   It should also show the average, max, and min votes.
    *   It should indicate if there's a consensus.
5.  **New Round:** The room owner can start a new round.

## Tech Stack

*   **Framework:** Next.js with TypeScript
*   **Styling:** Tailwind CSS
*   **Real-time Communication:** Socket.IO
*   **Data Store:** Redis (using `ioredis`)
*   **Deployment:** Vercel

## Development Plan

### Phase 1: Project Setup & Basic UI

1.  [x] Initialize a new Next.js project with TypeScript and Tailwind CSS.
2.  [x] Create the basic UI layout: a main page for creating/joining rooms.
3.  [x] Design the UI for the poker room itself (participant list, voting cards, results area).

### Phase 2: Room Management (Backend)

1.  [x] Set up a Redis client connection.
2.  [x] Create API routes for:
    *   `POST /api/rooms`: Create a new room, return a unique room ID and an invite link.
    *   `GET /api/rooms/[roomId]`: Get details for a specific room (to check if it exists).
3.  [x] Define the data structure for a "Room" in Redis (e.g., using a Hash). It should store participants, votes, and the current state of the game.

### Phase 3: Real-time Communication with Socket.IO

1.  [x] Set up a Socket.IO server within the Next.js app.
2.  [x] Implement WebSocket events for:
    *   `connection`: When a user connects.
    *   `join_room`: When a user joins a specific room.
    *   `user_joined`: Broadcast to others when a new user joins.
    *   `user_left`: Broadcast when a user disconnects.
    *   `start_round`: To start a new voting round.
    *   `user_voted`: When a user casts a vote.
    *   `reveal_votes`: To show all votes.
    *   `new_round`: To reset for a new round of voting.
3.  [x] Handle state changes and broadcast updates to all clients in a room.

### Phase 4: Frontend Logic

1.  [x] Implement the client-side logic for creating a room and redirecting to the room page.
2.  [x] Implement the logic for joining a room from an invite link.
3.  [x] Connect the frontend to the Socket.IO server.
4.  [x] Create React components for:
    *   The home page (create room).
    *   The room page, which will contain:
        *   A list of participants.
        *   Voting cards (Fibonacci sequence).
        *   Controls for the room owner (Start Round, Reveal Votes, New Round).
        *   A display area for votes and results (avg, min, max, consensus).
5.  [x] Manage client-side state based on WebSocket events from the server.

### Phase 5: Polishing and Deployment

1.  [ ] Refine the UI/UX to make it look modern and intuitive.
2.  [ ] Add error handling (e.g., room not found, invalid name).
3.  [x] Prepare for Vercel deployment (environment variables for Redis connection).
4.  [ ] Test thoroughly.
5.  [ ] Deploy!
 