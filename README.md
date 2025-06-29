# Planning Poker

A real-time planning poker application for agile teams to estimate tasks collaboratively. Built with modern web technologies and designed for seamless team collaboration.

![Planning Poker App](public/planning-poker.svg)

## Features

- **Room Management**
  - Create private planning poker rooms
  - Join existing rooms via invite links
  - Verify room existence before joining
  - Room owner controls for managing the session

- **Voting System**
  - Multiple voting presets (Fibonacci, days, hours, yes/no)
  - Real-time voting with immediate feedback
  - Hidden votes until reveal phase
  - Statistical analysis (average, min, max, consensus detection)

- **User Experience**
  - Clean, responsive interface for desktop and mobile
  - Character cards with team-specific quotes
  - Non-repetitive quote selection algorithm
  - Simple, intuitive controls for all participants

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Real-time Communication**: PartyKit (WebSockets)
- **Data Persistence**: Redis (Upstash)
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

Built with ❤️ and ☕️ for the C&I team.
 