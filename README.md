# Planning Poker

A real-time planning poker application for agile teams to estimate tasks collaboratively. Built with modern web technologies and designed for seamless team collaboration.

![Planning Poker App](public/planning-poker.svg)

## Features

- **Room Management**
  - Create private planning poker rooms
  - Join existing rooms via invite links
  - Verify room existence before joining
  - Room owner controls for managing the session
  - Automatic room expiration after 6 hours (Redis TTL)

- **Voting System**
  - Multiple voting presets (Fibonacci, days, hours, yes/no)
  - Real-time voting with immediate feedback
  - Hidden votes until reveal phase
  - Statistical analysis (average, min, max, consensus detection)

- **Room Ownership System**
  - Intelligent handling of disconnections vs. refreshes
  - 2-minute grace period when room owner disconnects
  - Visual "Kral Düştü" (King has fallen) notification with countdown
  - Democratic voting system for new owner selection
  - Secure token-based owner authentication
  - Visual coronation ceremony for newly elected owners

- **User Experience**
  - Clean, responsive interface for desktop and mobile
  - Character cards with team-specific quotes
  - Non-repetitive quote selection algorithm
  - Simple, intuitive controls for all participants
  - Visual indicators for offline/inactive users
  - Animated transitions for owner changes

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Real-time Communication**: PartyKit (WebSockets)
- **Data Persistence**: Redis (Upstash) with TTL
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Redis instance (or Upstash account)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/planning-poker.git
   cd planning-poker
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   ```
   # Create a .env.local file with:
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   NEXT_PUBLIC_PARTYKIT_HOST=your_partykit_host_or_localhost:1999
   ```

### Development

Run the development server:
```bash
npm run dev
# or
yarn dev
```

Run PartyKit server locally:
```bash
npx partykit dev
```

### Deployment

Deploy to Vercel:
```bash
npm run build
npm run deploy
```

## Room Ownership System

The application features a sophisticated room ownership transfer system:

1. **Owner Disconnection**:
   - When the room owner disconnects, a 2-minute grace period begins
   - A "Kral Düştü" (King has fallen) notification appears with countdown
   - If the owner returns during this period, they can reclaim ownership

2. **Democratic Voting**:
   - If the owner doesn't return, voting for a new owner begins
   - All active participants can vote for a new room owner
   - A majority vote is required to elect a new owner
   - Visual indicators show vote progress and required threshold

3. **Owner Coronation**:
   - When a new owner is elected, a coronation animation plays
   - The new owner receives full room control privileges
   - Secure token-based authentication prevents impersonation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

Built with ❤️ and ☕️ for the C&I team.
 