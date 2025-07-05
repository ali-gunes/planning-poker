# Confidence Auction Mini-Game

A chip-based side game that runs alongside Planning Poker, encouraging players to express confidence in their own estimates.

---
## 1. Overview
* **Metric:** 10 % trimmed mean (drop highest + lowest numeric vote when ≥ 5 votes, else median).
  If the resulting mean is _fractional_, **round it to the nearest deck value** before applying payouts.
* **Start Bankroll:** 5 chips per participant.
* **Wager Range:** 0 – 3 chips slider shown while votes are hidden.
* **Payout Bands (numeric presets)**

| Distance from trimmed mean | Result label | Chip delta |
| --- | --- | --- |
| Exactly equal | **Jackpot** | + wager × 2 |
| ≤ 1 card | Close | + wager |
| ≤ 2 cards | Near | 0 |
| > 2 cards / not numeric | Miss | − wager |

* **Yes/No preset:** Confidence Auction is **disabled** for Yes/No rounds – the wager slider is hidden and chips remain unchanged.
* Muted users & observers cannot wager.
* Negative chip balances allowed (shows red).

---
## 2. Data Model Changes
```ts
interface Participant {
  name: string;
  hasVoted: boolean;
  status: 'active' | 'inactive';
  role: 'participant' | 'observer';
  muted?: boolean;
  chips: number;      // new — persistent across session
  wager: number;      // temp — cleared each reveal
}
```
Room state already lives in Redis, so `chips` persist across reconnects.

---
## 3. New WebSocket Messages
| Direction | `type` | Payload | Purpose |
|-----------|--------|---------|---------|
| client→server | `confidence_wager` | `{ amount: number }` | Player sets/updates wager before reveal. |
| server→clients | `chip_update` | `{ name: string; chips: number }[]` | Broadcast after payout so UIs refresh. |

(All messages use existing PartyKit channel.)

---
## 4. Server-Side Logic (PartyKit)
1. **Join room** ⇒ initialise `chips = 5`, `wager = 0` if undefined.
2. **`confidence_wager` handler**
   * Ignore if muted/observer/round not in `voting`.
   * Clamp `amount` 0‒3; store in participant.
3. **On `reveal_votes`**
   * Compute trimmed mean (fallback median/YesNo logic).
   * For each participant:
     * Determine distance band ➜ delta (table above).
     * `participant.chips += delta; participant.wager = 0`.
   * `setRoom` and broadcast `chip_update`.

---
## 5. Client-Side UI
* **Voting Card Component**
  * When user selects a card, show small slider (0–3 chips, default 0).
  * Send `confidence_wager` whenever slider moves.
* **Participant List**
  * Display `💰 {chips}` next to each name.
  * Chip count coloured red when `< 0`.
* **Leaderboard (optional)**
  * Under participants list, sort descending chips, show top 3.
* **Toasts**
  * Jackpot: "🎉 {name} gained {delta} chips!".
  * Negative balance warning: "Borçtasın 🔻".
* **Room Settings Modal**
  * Toggle "Confidence Auction" (bool). When off, wagers UI hidden; chips frozen.

---
## 6. Edge Cases & Safeguards
* <3 numeric votes ⇒ median used.
* If player disconnects before reveal, wager defaults to 0.
* Muted players and observers can see chips but slider is disabled.
* Chips reset only when owner ends room or everyone leaves (room TTL).

---
## 7. Implementation Checklist
- [ ] Extend `Participant` interface & seed chips.
- [ ] Add server handlers (`confidence_wager`, payout in `reveal_votes`).
- [ ] Broadcast `chip_update` message.
- [ ] Slider UI & message emit (client).
- [ ] Display chips & leaderboard.
- [ ] Room-settings toggle & gating.
- [ ] Update README & Changelog after release.

Happy betting! 💸 

3. Fractional trimmed mean  
   • _Round_ to the nearest deck value so it becomes a normal card.  
   • Distance is still measured by deck index after rounding.

6. Yes/No preset  
   • Auction OFF: wagers unavailable; no chips gained or lost. 