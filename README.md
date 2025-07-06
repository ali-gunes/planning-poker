# Planning Poker

A real-time planning poker application for agile teams to estimate tasks collaboratively. Built with modern web technologies and designed for seamless team collaboration.

![Planning Poker App](public/planning-poker.svg)

## Key Features

### Room Management
* Create private rooms and share invite links.
* Owner dashboard with session controls.
* Rooms auto-expire after 6 h using Redis TTL.

### Voting System
* Presets: Fibonacci, Days, Hours, Yes/No.
* Real-time hidden voting with reveal & stats.

### Confidence Auction 💰 *(v1.6+)*
* Optional chip-based side game that lets players wager on their own estimate confidence.
* Every participant starts with **5 chips** and can bet **0–3 chips** before votes are revealed (disabled for Yes/No rounds).
* Payouts after reveal:
  * **Jackpot** – exact match → **+2× wager**
  * **Close** – ±1 card → **+ wager**
  * **Near** – ±2 cards → **0**
  * **Miss** – >2 cards / non-numeric → **− wager**
* Chip balances persist during the session (can go negative) and are displayed next to each name, plus an optional leaderboard.
* Room owner can toggle Confidence Auction on/off in *Room Settings*.

### Ownership Transfer
* 2-minute grace timer when the owner leaves.
* "Kral Düştü" notification + live countdown.
* Democratic election if the owner doesn't return.
* Animated coronation for the new owner.

### Quote System 💬 *(v1.4+)*
* Three modes selectable via *Alıntı Sistemi* panel:
  * **Yok** – disabled.
  * **C&I Hatırası** – built-in nostalgia pack.
  * **Özel** – upload your own JSON pack.
* Quotes appear inline while voting or after reveal (based on result).
* Smart selection (medianLow / medianHigh / consensus / hugeDifference / general).
* JSON uploads are validated client-side and stored in `localStorage`.
* Progress/status indicator below the *Upload JSON* button.
* Dedicated guide page at `/help/custom-quotes` with:
  * Gallery of available GIFs (`/public/gifs`).
  * Quote object template.
  * Live preview card.

### Moderation 🔇 *(v1.5+)*
* Room owner can mute / un-mute participants via kebab menu.
* Muted users stay in the list with a red 🔇 icon, cannot vote, and see a warning message.
* Mute status is persisted in Redis, so refresh / reconnect does not bypass it.

### Themes & Audio
* Built-in themes: **Modern**, **Retro 90s**, **Synthwave** (toggle via palette icon).
* Theme-aware components (buttons, cards, toasts, etc.).
* Optional background music per theme with a tiny Visualizer.

### Reliability
* WebSocket heartbeat (25 s ping/pong) to survive Cloudflare idle timeouts.
* Optional `lightningcss-linux-x64-gnu` dependency fixes Vercel builds on ARM.

### Developer UX
* Custom toast system & changelog component.
* ESLint/TypeScript strict mode – no `any`s.
* Dev & prod parity via PartyKit `npm run dev`.

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Real-time Communication**: PartyKit (WebSockets)
- **Data Persistence**: Redis (Upstash) with TTL
- **Deployment**: Vercel

# Planning Poker Quotes System

This directory contains JSON files for the quotes system in the Planning Poker application.

## Available Files

- `ci-team.json`: Default quotes for the C&I team
- `sample-template.json`: A template you can use to create your own quotes
- `schema.json`: JSON Schema for validation

## How to Create Your Own Quotes

1. Download the `sample-template.json` file
2. Modify it with your team's information and quotes
3. Make sure your animation GIFs are placed in the `/public/gifs/` directory
4. Validate your JSON against the schema
5. Upload your JSON when selecting the "Özel" (Custom) option in the application

## Quote Categories

The quotes system supports different categories of quotes that are shown based on voting results:

- **medianLowQuotes**: Shown when the average vote is below the median of the voting cards
- **medianHighQuotes**: Shown when the average vote is above the median of the voting cards
- **generalQuotes**: Shown in general cases
- **consensusQuotes**: Shown when all team members vote the same
- **hugeDifferenceQuotes**: Shown when there's a significant difference between votes (max >= 3 * min)

## Settings

You can control when quotes are shown using the settings object:

```json
"settings": {
  "showOnGeneral": true,
  "showOnMedianLow": true,
  "showOnMedianHigh": true,
  "showOnConsensus": true,
  "showOnHugeDifference": true,
  "quoteProbability": 0.7
}
```

- Set any category to `false` to disable quotes for that scenario
- Adjust `quoteProbability` (0.0-1.0) to control how often quotes appear

## Quote Format

Each quote must follow this format:

```json
{
  "id": "unique-id",
  "name": "Team Member Name",
  "role": "Team Member Role",
  "quote": "The quote text goes here",
  "animation": "animation-file.gif",
  "color": "from-color-shade to-color-shade"
}
```

- `id`: A unique identifier for the team member
- `name`: The display name of the team member
- `role`: The role of the team member in the team
- `quote`: The actual quote text
- `animation`: Filename of a GIF in the `/public/gifs/` directory
- `color`: Tailwind CSS gradient colors for the modal background

## Color Options

You can use any Tailwind CSS color with shades from 50-900. Examples:

- `from-blue-500 to-cyan-600`
- `from-green-400 to-emerald-700`
- `from-red-500 to-orange-600`
- `from-purple-500 to-pink-600`


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
 