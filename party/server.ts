import type * as Party from "partykit/server";
import { redis } from "@/lib/redis";

// --- START OF TYPES ---
// These types should ideally be shared between client and server
interface Participant {
  name: string;
  hasVoted: boolean;
}

interface Vote {
  name: string;
  vote: number | string | null;
}

interface Room {
  owner: string;
  votingPreset: 'fibonacci' | 'days' | 'hours' | 'yesno';
  timerDuration: number;
  autoReveal: boolean;
  state: 'lobby' | 'voting' | 'revealed';
  participants: Participant[];
  votes: Vote[];
  timerEndsAt?: number;
}
// --- END OF TYPES ---

const getRoom = async (roomId: string): Promise<Room | null> => {
  return await redis.get(`room:${roomId}`);
};

const setRoom = (roomId: string, roomData: Room | object) => {
  return redis.set(`room:${roomId}`, roomData);
};

export default class PokerServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[CONNECT] user: ${conn.id} connected to room: ${this.room.id}`);
  }
  
  async onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message);

    if (msg.type === "join_room") {
      const { name } = msg;
      let roomState = await getRoom(this.room.id);

      if (!roomState) {
        // This shouldn't happen if room is created first, but as a fallback:
        roomState = {
          owner: name,
          votingPreset: 'fibonacci',
          timerDuration: 0,
          autoReveal: false,
          state: 'lobby',
          participants: [],
          votes: [],
        };
        console.log(`[FALLBACK] Creating new room state for ${this.room.id}`);
      }
      
      const isParticipant = roomState.participants.some(p => p.name === name);
      if (!isParticipant) {
          roomState.participants.push({ name, hasVoted: false });
          if (!roomState.votes.some(v => v.name === name)) {
              roomState.votes.push({ name, vote: null });
          }
          await setRoom(this.room.id, roomState);
      }

      const settings = {
        owner: roomState.owner,
        votingPreset: roomState.votingPreset,
        timerDuration: roomState.timerDuration,
        autoReveal: roomState.autoReveal,
        state: roomState.state,
      };

      // Send initial state to the user who just joined
      sender.send(JSON.stringify({ type: "initial_state", settings, participants: roomState.participants }));
      
      // Let everyone else know
      this.room.broadcast(JSON.stringify({ type: "update_participants", payload: roomState.participants }), [sender.id]);

      if (roomState.state === 'revealed') {
        const revealedVotes = roomState.votes.filter(v => v.vote !== null);
        this.room.broadcast(JSON.stringify({ type: "votes_revealed", payload: revealedVotes }));
      }
    }

    if (msg.type === 'start_round') {
      let roomState = await getRoom(this.room.id);
      if (roomState && roomState.state === 'lobby') {
        roomState.state = 'voting';
        // Timer logic can be re-introduced here if needed
        await setRoom(this.room.id, roomState);
        this.room.broadcast(JSON.stringify({ type: 'round_started', payload: { state: roomState.state }}));
      }
    }
    
    if (msg.type === 'user_voted') {
      const { name, vote } = msg;
      let roomState = await getRoom(this.room.id);
      if (roomState && roomState.state === 'voting') {
        const p = roomState.participants.find(p => p.name === name);
        if (p) p.hasVoted = true;
        const v = roomState.votes.find(v => v.name === name);
        if (v) v.vote = vote;
        await setRoom(this.room.id, roomState);
        this.room.broadcast(JSON.stringify({ type: 'update_participants', payload: roomState.participants }));
      }
    }

    if (msg.type === 'reveal_votes') {
      let roomState = await getRoom(this.room.id);
      if (roomState && roomState.state === 'voting') {
        roomState.state = 'revealed';
        await setRoom(this.room.id, roomState);
        const revealedVotes = roomState.votes.filter(v => v.vote !== null);
        this.room.broadcast(JSON.stringify({ type: 'votes_revealed', payload: revealedVotes }));
        this.room.broadcast(JSON.stringify({ type: 'room_settings', payload: { state: roomState.state } }));
      }
    }

    if (msg.type === 'new_round') {
      let roomState = await getRoom(this.room.id);
      if (roomState && roomState.state === 'revealed') {
        roomState.state = 'lobby';
        roomState.participants.forEach(p => p.hasVoted = false);
        roomState.votes.forEach(v => v.vote = null);
        await setRoom(this.room.id, roomState);
        this.room.broadcast(JSON.stringify({ type: 'new_round_started', payload: roomState.participants }));
        this.room.broadcast(JSON.stringify({ type: 'room_settings', payload: { state: roomState.state } }));
      }
    }

    if (msg.type === 'update_room_settings') {
      const { votingPreset, timerDuration, autoReveal, ownerName } = msg;
      console.log(`[UPDATE_SETTINGS] Request from ${ownerName}:`, { votingPreset, timerDuration, autoReveal });
      
      let roomState = await getRoom(this.room.id);
      
      if (!roomState) {
        console.log(`[UPDATE_SETTINGS] Room ${this.room.id} not found`);
        return;
      }
      
      console.log(`[UPDATE_SETTINGS] Room owner: ${roomState.owner}, Request from: ${ownerName}, State: ${roomState.state}`);
      
      if (roomState && roomState.owner === ownerName && (roomState.state === 'lobby' || roomState.state === 'revealed')) {
        roomState.votingPreset = votingPreset;
        roomState.timerDuration = timerDuration;
        roomState.autoReveal = autoReveal;
        
        await setRoom(this.room.id, roomState);
        console.log(`[UPDATE_SETTINGS] Settings updated successfully`);
        
        const updatedSettings = {
          votingPreset: roomState.votingPreset,
          timerDuration: roomState.timerDuration,
          autoReveal: roomState.autoReveal,
          state: roomState.state,
        };
        
        this.room.broadcast(JSON.stringify({ type: 'room_settings_updated', payload: updatedSettings }));
        console.log(`[UPDATE_SETTINGS] Broadcast sent:`, updatedSettings);
      } else {
        console.log(`[UPDATE_SETTINGS] Permission denied or invalid state`);
      }
    }
  }
} 