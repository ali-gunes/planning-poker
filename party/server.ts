import type * as Party from "partykit/server";
import { redis } from "@/lib/redis";
import { REDIS_TTL } from "@/lib/constants";

// --- START OF TYPES ---
// These types should ideally be shared between client and server
interface Participant {
  name: string;
  hasVoted: boolean;
  connectionId?: string; // Track connection ID
  status: 'active' | 'inactive'; // Track participant status
}

interface Vote {
  name: string;
  vote: number | string | null;
}

interface OwnerVote {
  voter: string;
  candidate: string;
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
  disconnectionTimers?: Record<string, number>; // Track disconnection timers by name
  ownerStatus: 'active' | 'grace' | 'voting'; // Track owner status
  graceEndTime?: number; // When grace period ends (timestamp)
  ownerVotes: OwnerVote[]; // Votes for new owner
  previousOwner?: string; // Store previous owner name for reclamation
  ownerToken?: string; // Secure token for owner authentication
}
// --- END OF TYPES ---

// Time in milliseconds to wait before marking a user as inactive after disconnect
const DISCONNECT_TIMEOUT = 10000; // 10 seconds

// Time in milliseconds for owner grace period
const OWNER_GRACE_PERIOD = 60000; // 1 minute

// Generate a secure random token
const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const getRoom = async (roomId: string): Promise<Room | null> => {
  const data = await redis.get(`room:${roomId}`);
  if (!data) return null;
  
  // Parse the JSON string if it's a string
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`[ERROR] Failed to parse room data for ${roomId}:`, e);
      return null;
    }
  }
  
  return data as Room;
};

const setRoom = (roomId: string, roomData: Room | object) => {
  // Set the room data with a TTL from constants
  return redis.set(`room:${roomId}`, roomData, { ex: REDIS_TTL.ROOM });
};

export default class PokerServer implements Party.Server {
  // Store disconnection timers and owner grace period timers
  private disconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
  private ownerGraceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[CONNECT] user: ${conn.id} connected to room: ${this.room.id}`);
  }
  
  async onClose(conn: Party.Connection) {
    console.log(`[DISCONNECT] user: ${conn.id} disconnected from room: ${this.room.id}`);
    
    // Get the current room state
    const roomState = await getRoom(this.room.id);
    if (!roomState) return;
    
    // Find the participant with this connection ID
    const participantIndex = roomState.participants.findIndex(p => p.connectionId === conn.id);
    
    if (participantIndex !== -1) {
      const participant = roomState.participants[participantIndex];
      console.log(`[DISCONNECT] Participant: ${participant.name} disconnected from room: ${this.room.id}`);
      
      // Check if this is the room owner
      const isOwner = participant.name === roomState.owner;
      
      // Set a timer to mark the user as inactive after DISCONNECT_TIMEOUT
      const timer = setTimeout(async () => {
        const currentRoomState = await getRoom(this.room.id);
        if (!currentRoomState) return;
        
        const currentParticipantIndex = currentRoomState.participants.findIndex(
          p => p.name === participant.name
        );
        
        if (currentParticipantIndex !== -1) {
          // Check if they're still disconnected
          const currentParticipant = currentRoomState.participants[currentParticipantIndex];
          if (!currentParticipant.connectionId || currentParticipant.connectionId === conn.id) {
            console.log(`[TIMEOUT] Marking participant: ${participant.name} as inactive in room: ${this.room.id}`);
            currentRoomState.participants[currentParticipantIndex].status = 'inactive';
            
            // If this is the owner and still in active status, start grace period
            if (isOwner && currentRoomState.ownerStatus === 'active') {
              console.log(`[OWNER_GRACE] Starting grace period for owner: ${participant.name}`);
              currentRoomState.ownerStatus = 'grace';
              currentRoomState.graceEndTime = Date.now() + OWNER_GRACE_PERIOD;
              currentRoomState.previousOwner = participant.name;
              
              // Set a timer to start voting after grace period
              const ownerGraceTimer = setTimeout(async () => {
                const updatedRoomState = await getRoom(this.room.id);
                if (!updatedRoomState) return;
                
                // Only proceed if still in grace period
                if (updatedRoomState.ownerStatus === 'grace') {
                  console.log(`[OWNER_VOTING] Grace period ended for owner: ${participant.name}, starting voting`);
                  updatedRoomState.ownerStatus = 'voting';
                  updatedRoomState.ownerVotes = [];
                  await setRoom(this.room.id, updatedRoomState);
                  
                  // Notify all participants that voting has started
                  this.room.broadcast(JSON.stringify({ 
                    type: "owner_voting_started",
                    payload: {
                      previousOwner: updatedRoomState.previousOwner,
                      participants: updatedRoomState.participants.filter(p => 
                        p.status === 'active' && p.name !== updatedRoomState.previousOwner
                      )
                    }
                  }));
                }
                
                // Clear the timer reference
                this.ownerGraceTimers.delete(this.room.id);
              }, OWNER_GRACE_PERIOD);
              
              // Store the timer
              this.ownerGraceTimers.set(this.room.id, ownerGraceTimer);
              
              // Notify participants about grace period
              this.room.broadcast(JSON.stringify({ 
                type: "owner_grace_started", 
                payload: {
                  owner: participant.name,
                  graceEndTime: currentRoomState.graceEndTime
                }
              }));
            }
            
            await setRoom(this.room.id, currentRoomState);
            
            // Notify other participants
            this.room.broadcast(JSON.stringify({ 
              type: "update_participants", 
              payload: currentRoomState.participants 
            }));
            
            // If owner status changed, also broadcast that
            if (isOwner && currentRoomState.ownerStatus !== 'active') {
              this.room.broadcast(JSON.stringify({ 
                type: "owner_status_changed", 
                payload: {
                  status: currentRoomState.ownerStatus,
                  graceEndTime: currentRoomState.graceEndTime
                }
              }));
            }
          }
        }
        
        // Clear the timer from our map
        this.disconnectionTimers.delete(participant.name);
      }, DISCONNECT_TIMEOUT);
      
      // Store the timer
      this.disconnectionTimers.set(participant.name, timer);
      
      // Update the connection ID to undefined but keep status as active for now
      roomState.participants[participantIndex].connectionId = undefined;
      
      // Save the updated room state
      await setRoom(this.room.id, roomState);
      
      // Notify other participants about the update
      this.room.broadcast(JSON.stringify({ 
        type: "update_participants", 
        payload: roomState.participants 
      }));
    }
  }
  
  async onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message);

    if (msg.type === "join_room") {
      const { name } = msg;
      let roomState = await getRoom(this.room.id);

      if (!roomState) {
        // Room doesn't exist, send error
        console.log(`[ERROR] Room ${this.room.id} not found`);
        sender.send(JSON.stringify({ 
          type: "room_error", 
          error: "Bu oda mevcut değil. Lütfen doğru oda ID'sini kontrol edin." 
        }));
        return;
      }
      
      // If there's a pending disconnection timer for this user, clear it
      if (this.disconnectionTimers.has(name)) {
        clearTimeout(this.disconnectionTimers.get(name));
        this.disconnectionTimers.delete(name);
        console.log(`[INFO] Cleared disconnection timer for ${name}`);
      }
      
      // Special case: If this is the room owner's first connection, update their connectionId
      if (roomState.owner === name) {
        const ownerParticipant = roomState.participants.find(p => 
          p.name === name && p.connectionId === "pending"
        );
        
        if (ownerParticipant) {
          console.log(`[INFO] Room owner "${name}" is connecting for the first time, updating connectionId`);
          ownerParticipant.connectionId = sender.id;
          ownerParticipant.status = 'active';
          await setRoom(this.room.id, roomState);
          
          // Send initial state to the owner
          sender.send(JSON.stringify({ 
            type: "initial_state", 
            settings: {
              owner: roomState.owner,
              votingPreset: roomState.votingPreset,
              timerDuration: roomState.timerDuration,
              autoReveal: roomState.autoReveal,
              state: roomState.state,
            }, 
            participants: roomState.participants 
          }));
          
          // Let everyone else know
          this.room.broadcast(JSON.stringify({ 
            type: "update_participants", 
            payload: roomState.participants 
          }), [sender.id]);
          
          if (roomState.state === 'revealed') {
            const revealedVotes = roomState.votes.filter(v => v.vote !== null);
            this.room.broadcast(JSON.stringify({ type: "votes_revealed", payload: revealedVotes }));
          }
          
          return;
        }
      }
      
      // Check if a participant with the same name already exists
      // Ignore participants with connectionId = "pending" as they are placeholders
      const existingParticipant = roomState.participants.find(p => 
        p.name === name && p.connectionId !== "pending" && p.connectionId !== undefined
      );
      
      if (existingParticipant) {
        console.log(`[ERROR] Participant with name "${name}" already exists in room ${this.room.id}`);
        sender.send(JSON.stringify({
          type: "name_error",
          error: "Bu isimde bir katılımcı zaten odada mevcut. Lütfen farklı bir isim seçin."
        }));
        return;
      }
      
      // Check if this is the previous owner returning during grace period or voting
      const isPreviousOwner = name === roomState.previousOwner && 
        (roomState.ownerStatus === 'grace' || roomState.ownerStatus === 'voting');
      
      if (isPreviousOwner) {
        console.log(`[OWNER_RETURN] Previous owner "${name}" is returning to room ${this.room.id}`);
        
        // Update the owner's connection ID
        const previousOwnerIndex = roomState.participants.findIndex(p => p.name === name);
        
        if (previousOwnerIndex !== -1) {
          // Update existing participant
          roomState.participants[previousOwnerIndex].connectionId = sender.id;
          roomState.participants[previousOwnerIndex].status = 'active';
        } else {
          // Add the owner back to participants list
          roomState.participants.push({ 
            name, 
            hasVoted: false, 
            connectionId: sender.id,
            status: 'active'
          });
          
          if (!roomState.votes.some(v => v.name === name)) {
            roomState.votes.push({ name, vote: null });
          }
        }
        
        // Send a special notification to the returning owner
        sender.send(JSON.stringify({
          type: "owner_can_reclaim",
          payload: {
            previousOwner: name,
            graceEndTime: roomState.graceEndTime
          }
        }));
        
        await setRoom(this.room.id, roomState);
        
        // Send initial state
        sender.send(JSON.stringify({ 
          type: "initial_state", 
          settings: {
            owner: roomState.owner,
            votingPreset: roomState.votingPreset,
            timerDuration: roomState.timerDuration,
            autoReveal: roomState.autoReveal,
            state: roomState.state,
            ownerStatus: roomState.ownerStatus,
            graceEndTime: roomState.graceEndTime,
            previousOwner: roomState.previousOwner
          }, 
          participants: roomState.participants 
        }));
        
        // Let everyone else know
        this.room.broadcast(JSON.stringify({ 
          type: "update_participants", 
          payload: roomState.participants 
        }), [sender.id]);
        
        return;
      }
      
      // Check if this is a reconnection (same name, but disconnected)
      const disconnectedParticipant = roomState.participants.find(p => 
        p.name === name && p.connectionId === undefined
      );
      
      if (disconnectedParticipant) {
        console.log(`[INFO] Participant "${name}" is reconnecting to room ${this.room.id}`);
        disconnectedParticipant.connectionId = sender.id;
        disconnectedParticipant.status = 'active';
        await setRoom(this.room.id, roomState);
      } else {
        // This is a new participant
        const isParticipant = roomState.participants.some(p => p.name === name);
        if (!isParticipant) {
            roomState.participants.push({ 
              name, 
              hasVoted: false, 
              connectionId: sender.id,
              status: 'active'
            });
            if (!roomState.votes.some(v => v.name === name)) {
                roomState.votes.push({ name, vote: null });
            }
            await setRoom(this.room.id, roomState);
        }
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

    // Handle explicit leave room message
    if (msg.type === "leave_room") {
      const { name } = msg;
      let roomState = await getRoom(this.room.id);
      
      if (!roomState) return;
      
      // Find and remove the participant
      const participantIndex = roomState.participants.findIndex(p => p.name === name);
      
      if (participantIndex !== -1) {
        console.log(`[LEAVE] Participant "${name}" is leaving room ${this.room.id}`);
        
        // Check if this is the owner
        const isOwner = roomState.owner === name;
        
        // Remove participant from the list
        roomState.participants.splice(participantIndex, 1);
        
        // Remove their vote as well
        const voteIndex = roomState.votes.findIndex(v => v.name === name);
        if (voteIndex !== -1) {
          roomState.votes.splice(voteIndex, 1);
        }
        
        // If this is the owner, start grace period immediately
        if (isOwner && roomState.ownerStatus === 'active') {
          console.log(`[OWNER_GRACE] Owner "${name}" left, starting grace period`);
          roomState.ownerStatus = 'grace';
          roomState.graceEndTime = Date.now() + OWNER_GRACE_PERIOD;
          roomState.previousOwner = name;
          
          // Set a timer to start voting after grace period
          const ownerGraceTimer = setTimeout(async () => {
            const updatedRoomState = await getRoom(this.room.id);
            if (!updatedRoomState) return;
            
            // Only proceed if still in grace period
            if (updatedRoomState.ownerStatus === 'grace') {
              console.log(`[OWNER_VOTING] Grace period ended for owner: ${name}, starting voting`);
              updatedRoomState.ownerStatus = 'voting';
              updatedRoomState.ownerVotes = [];
              await setRoom(this.room.id, updatedRoomState);
              
              // Notify all participants that voting has started
              this.room.broadcast(JSON.stringify({ 
                type: "owner_voting_started",
                payload: {
                  previousOwner: updatedRoomState.previousOwner,
                  participants: updatedRoomState.participants.filter(p => 
                    p.status === 'active' && p.name !== updatedRoomState.previousOwner
                  )
                }
              }));
            }
            
            // Clear the timer reference
            this.ownerGraceTimers.delete(this.room.id);
          }, OWNER_GRACE_PERIOD);
          
          // Store the timer
          this.ownerGraceTimers.set(this.room.id, ownerGraceTimer);
          
          // Notify participants about grace period
          this.room.broadcast(JSON.stringify({ 
            type: "owner_grace_started", 
            payload: {
              owner: name,
              graceEndTime: roomState.graceEndTime
            }
          }));
        }
        
        await setRoom(this.room.id, roomState);
        
        // Notify other participants
        this.room.broadcast(JSON.stringify({ 
          type: "update_participants", 
          payload: roomState.participants 
        }));
        
        // If owner status changed, also broadcast that
        if (isOwner && roomState.ownerStatus !== 'active') {
          this.room.broadcast(JSON.stringify({ 
            type: "owner_status_changed", 
            payload: {
              status: roomState.ownerStatus,
              graceEndTime: roomState.graceEndTime
            }
          }));
        }
      }
    }

    // Handle owner reclamation
    if (msg.type === "reclaim_ownership") {
      const { name, ownerToken } = msg;
      let roomState = await getRoom(this.room.id);
      
      if (!roomState) return;
      
      // Check if this is the previous owner and we're in grace period or voting
      const isPreviousOwner = roomState.previousOwner === name && 
          (roomState.ownerStatus === 'grace' || roomState.ownerStatus === 'voting');
      
      // Verify the owner token if provided
      const isTokenValid = ownerToken && roomState.ownerToken === ownerToken;
      
      // Allow reclamation if it's the previous owner during grace/voting OR if the token is valid
      if (isPreviousOwner || isTokenValid) {
        console.log(`[OWNER_RECLAIM] Previous owner "${name}" is reclaiming ownership`);
        
        // Restore ownership
        roomState.owner = name;
        roomState.ownerStatus = 'active';
        roomState.previousOwner = undefined;
        roomState.graceEndTime = undefined;
        roomState.ownerVotes = [];
        
        // Clear any pending grace timer
        if (this.ownerGraceTimers.has(this.room.id)) {
          clearTimeout(this.ownerGraceTimers.get(this.room.id));
          this.ownerGraceTimers.delete(this.room.id);
        }
        
        await setRoom(this.room.id, roomState);
        
        // Notify all participants
        this.room.broadcast(JSON.stringify({ 
          type: "owner_reclaimed", 
          payload: {
            owner: name
          }
        }));
      } else {
        // Send error if token is invalid
        sender.send(JSON.stringify({
          type: "reclaim_error",
          error: "Krallık geri alınamadı. Yetkiniz yok."
        }));
      }
    }

    // Handle owner voting
    if (msg.type === "vote_for_owner") {
      const { voter, candidate } = msg;
      let roomState = await getRoom(this.room.id);
      
      if (!roomState || roomState.ownerStatus !== 'voting') return;
      
      // Check if voter is an active participant
      const voterParticipant = roomState.participants.find(p => 
        p.name === voter && p.status === 'active'
      );
      
      if (!voterParticipant) return;
      
      // Check if candidate is an active participant
      const candidateParticipant = roomState.participants.find(p => 
        p.name === candidate && p.status === 'active'
      );
      
      if (!candidateParticipant) return;
      
      // Remove any existing vote from this voter
      roomState.ownerVotes = roomState.ownerVotes.filter(vote => vote.voter !== voter);
      
      // Add the new vote
      roomState.ownerVotes.push({ voter, candidate });
      
      // Calculate vote counts
      const voteCounts = new Map<string, number>();
      for (const vote of roomState.ownerVotes) {
        voteCounts.set(vote.candidate, (voteCounts.get(vote.candidate) || 0) + 1);
      }
      
      // Get active participants count (excluding previous owner)
      const activeParticipantsCount = roomState.participants.filter(p => 
        p.status === 'active' && p.name !== roomState.previousOwner
      ).length;
      
      // Check if any candidate has majority
      let newOwner: string | null = null;
      for (const [candidate, count] of voteCounts.entries()) {
        if (count > activeParticipantsCount / 2) {
          newOwner = candidate;
          break;
        }
      }
      
      // If we have a new owner with majority
      if (newOwner) {
        console.log(`[OWNER_ELECTED] New owner elected: ${newOwner}`);
        
        // First notify all participants about the election result
        this.room.broadcast(JSON.stringify({ 
          type: "owner_elected", 
          payload: {
            owner: newOwner,
            voteCounts: Object.fromEntries(voteCounts)
          }
        }));
        
        // Delay the actual owner update to allow for the coronation animation
        setTimeout(async () => {
          // Get the latest room state
          const updatedRoomState = await getRoom(this.room.id);
          if (!updatedRoomState) return;
          
          // Only update if still in voting state
          if (updatedRoomState.ownerStatus === 'voting') {
            updatedRoomState.owner = newOwner;
            updatedRoomState.ownerStatus = 'active';
            updatedRoomState.previousOwner = undefined;
            updatedRoomState.graceEndTime = undefined;
            updatedRoomState.ownerVotes = [];
            
            await setRoom(this.room.id, updatedRoomState);
            
            // Notify all participants about the finalized owner change
            this.room.broadcast(JSON.stringify({ 
              type: "owner_change_finalized", 
              payload: {
                owner: newOwner
              }
            }));
          }
        }, 6000); // 6 seconds delay (5 for animation + 1 buffer)
      } else {
        // Just update the votes
        await setRoom(this.room.id, roomState);
        
        // Notify about vote update
        this.room.broadcast(JSON.stringify({ 
          type: "owner_votes_updated", 
          payload: {
            votes: roomState.ownerVotes,
            voteCounts: Object.fromEntries(voteCounts),
            requiredVotes: Math.floor(activeParticipantsCount / 2) + 1
          }
        }));
      }
    }
  }
} 