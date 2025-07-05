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
  role: 'participant' | 'observer'; // Track participant role
  muted: boolean;
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
  quoteSystemType: string;
  customQuotes: any;
}
// --- END OF TYPES ---

// Time in milliseconds to wait before marking a user as inactive after disconnect
const DISCONNECT_TIMEOUT = 30000; // 30 seconds grace period for reconnection

// Time in milliseconds for owner grace period
const OWNER_GRACE_PERIOD = 120000; // 2 minutes

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

// Add a function to select a random quote type based on voting results
function selectQuoteType(votes: Vote[], votingPreset: string): string {
  // Filter out observers' votes and convert to numeric
  const numericVotes = votes
    .filter(vote => typeof vote.vote === 'number')
    .map(vote => vote.vote as number);
  
  if (numericVotes.length === 0) {
    return 'general';
  }
  
  // Check for consensus
  const uniqueVotes = new Set(numericVotes);
  if (uniqueVotes.size === 1) {
    return 'consensus';
  }
  
  // Check for huge difference
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);
  if (min > 0 && max >= min * 4) {
    return 'hugeDifference';
  }
  
  // Get the voting stack to find the median
  const votingStacks = {
    fibonacci: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    hours: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40],
    yesno: ['Evet', 'Hayır']
  };
  
  if (votingPreset === 'yesno') {
    return 'general';
  }
  
  const numericStack = votingStacks[votingPreset as keyof typeof votingStacks] as number[];
  
  // Find the median of the voting stack
  const sortedStack = [...numericStack].sort((a, b) => a - b);
  const midIndex = Math.floor(sortedStack.length / 2);
  const median = sortedStack.length % 2 === 0
    ? (sortedStack[midIndex - 1] + sortedStack[midIndex]) / 2
    : sortedStack[midIndex];
  
  // Calculate average of votes
  const sum = numericVotes.reduce((acc, v) => acc + v, 0);
  const average = sum / numericVotes.length;
  
  // Check if average is above or below median
  if (average > median) {
    return 'medianHigh';
  } else if (average < median) {
    return 'medianLow';
  }
  
  return 'general';
}

export default class PokerServer implements Party.Server {
  // Store disconnection timers and owner grace period timers
  private disconnectionTimers: Map<string, NodeJS.Timeout> = new Map();
  private ownerGraceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    //console.log(`[CONNECT] user: ${conn.id} connected to room: ${this.room.id}`);
  }
  
  async onClose(conn: Party.Connection) {
    //console.log(`[DISCONNECT] user: ${conn.id} disconnected from room: ${this.room.id}`);
    
    // Get the current room state
    const roomState = await getRoom(this.room.id);
    if (!roomState) return;
    
    // Find the participant with this connection ID
    const participantIndex = roomState.participants.findIndex(p => p.connectionId === conn.id);
    
    if (participantIndex !== -1) {
      const participant = roomState.participants[participantIndex];
      //console.log(`[DISCONNECT] Participant: ${participant.name} disconnected from room: ${this.room.id}`);
      
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
            //console.log(`[TIMEOUT] Marking participant: ${participant.name} as inactive in room: ${this.room.id}`);
            currentRoomState.participants[currentParticipantIndex].status = 'inactive';
            
            // If this is the owner and still in active status, start grace period
            if (isOwner && currentRoomState.ownerStatus === 'active') {
              //console.log(`[OWNER_GRACE] Starting grace period for owner: ${participant.name}`);
              currentRoomState.ownerStatus = 'grace';
              currentRoomState.graceEndTime = Date.now() + OWNER_GRACE_PERIOD;
              currentRoomState.previousOwner = participant.name;
              
              //console.log(`[DEBUG_GRACE] Owner status set to: ${currentRoomState.ownerStatus}`);
              //console.log(`[DEBUG_GRACE] Grace end time set to: ${new Date(currentRoomState.graceEndTime).toISOString()}`);
              //console.log(`[DEBUG_GRACE] Previous owner set to: ${currentRoomState.previousOwner}`);
              
              // Set a timer to start voting after grace period
              const ownerGraceTimer = setTimeout(async () => {
                const updatedRoomState = await getRoom(this.room.id);
                if (!updatedRoomState) return;
                
                // Only proceed if still in grace period
                if (updatedRoomState.ownerStatus === 'grace') {
                  //console.log(`[OWNER_VOTING] Grace period ended for owner: ${participant.name}, starting voting`);
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
              //console.log(`[DEBUG_GRACE] Broadcasting owner_grace_started message`);
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
              //console.log(`[DEBUG_STATUS] Broadcasting owner_status_changed message with status: ${currentRoomState.ownerStatus}`);
              //console.log(`[DEBUG_STATUS] Grace end time: ${currentRoomState.graceEndTime ? new Date(currentRoomState.graceEndTime).toISOString() : 'undefined'}`);
              
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
    try {
      const msg = JSON.parse(message);
      //console.log(`[MESSAGE] Received message type: ${msg.type} from ${sender.id}`);

      // Heartbeat handling
      if (msg.type === "ping") {
        sender.send(JSON.stringify({ type: "pong" }));
        return;
      }

      // Handle join room message
      if (msg.type === "join_room") {
        const { name, role = 'participant' } = msg;
        
        if (!name) {
          sender.send(JSON.stringify({ type: "name_error", error: "İsim boş olamaz!" }));
          return;
        }
        
        let roomState = await getRoom(this.room.id);
        
        if (!roomState) {
          sender.send(JSON.stringify({ 
            type: "room_error", 
            error: "Oda bulunamadı!" 
          }));
          return;
        }
        
        // Check if this is the room owner with a pending connection
        const isPendingOwner = roomState.owner === name && 
          roomState.participants.some(p => p.name === name && p.connectionId === "pending");
        
        if (isPendingOwner) {
          // This is the owner connecting for the first time
          const ownerParticipant = roomState.participants.find(p => p.name === name);
          if (ownerParticipant) {
            ownerParticipant.connectionId = sender.id;
            ownerParticipant.role = role;
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
                previousOwner: roomState.previousOwner,
                quoteSystemType: roomState.quoteSystemType,
                customQuotes: roomState.customQuotes
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
        }
        
        // Check if name is already taken by an active user with a different connection ID
        const existingActiveParticipant = roomState.participants.find(p => 
          p.name === name && 
          p.status === 'active' && 
          p.connectionId !== sender.id && 
          p.connectionId !== "pending" && 
          p.connectionId !== undefined
        );
        
        if (existingActiveParticipant) {
          sender.send(JSON.stringify({ 
            type: "name_error", 
            error: "Bu isim zaten kullanımda! Lütfen başka bir isim seçin." 
          }));
          return;
        }
        
        // Check if this is a reconnection (same name, but disconnected)
        const disconnectedParticipant = roomState.participants.find(p => 
          p.name === name && 
          (p.connectionId === undefined || p.connectionId === "pending")
        );
        
        if (disconnectedParticipant) {
          //console.log(`[INFO] Participant "${name}" is reconnecting to room ${this.room.id}`);
          disconnectedParticipant.connectionId = sender.id;
          disconnectedParticipant.status = 'active';
          disconnectedParticipant.role = role || disconnectedParticipant.role || 'participant';
          await setRoom(this.room.id, roomState);
        } else {
          // This is a new participant
          const isParticipant = roomState.participants.some(p => p.name === name);
          if (!isParticipant) {
              roomState.participants.push({ 
                name, 
                hasVoted: false, 
                connectionId: sender.id,
                status: 'active',
                role: role || 'participant',
                muted: false
              });
              if (!roomState.votes.some(v => v.name === name)) {
                  roomState.votes.push({ name, vote: null });
              }
              await setRoom(this.room.id, roomState);
          }
        }
        
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
            previousOwner: roomState.previousOwner,
            quoteSystemType: roomState.quoteSystemType,
            customQuotes: roomState.customQuotes
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

      // Handle user vote message
      if (msg.type === "user_voted") {
        const { name, vote, role } = msg;
        let roomState = await getRoom(this.room.id);
        
        if (!roomState) return;
        
        // Make sure this is a valid vote
        if (typeof name !== 'string' || vote === undefined) {
          return;
        }
        
        // Make sure we're in voting state
        if (roomState.state !== 'voting') {
          return;
        }
        
        // Find the participant
        const participant = roomState.participants.find(p => p.name === name);
        
        // Only allow participants who are not observers and not muted
        if (!participant || participant.role === 'observer' || participant.muted) {
          return;
        }
        
        // Update the vote
        participant.hasVoted = true;
        
        // Find and update the vote in the votes array
        const voteIndex = roomState.votes.findIndex(v => v.name === name);
        if (voteIndex !== -1) {
          roomState.votes[voteIndex].vote = vote;
        } else {
          roomState.votes.push({ name, vote });
        }
        
        await setRoom(this.room.id, roomState);
        
        // Broadcast updated participants to everyone
        this.room.broadcast(JSON.stringify({ 
          type: "update_participants", 
          payload: roomState.participants 
        }));
        
        return;
      }

      // Handle start_round message
      if (msg.type === 'start_round') {
        let roomState = await getRoom(this.room.id);
        if (roomState && roomState.state === 'lobby') {
          roomState.state = 'voting';
          // Timer logic can be re-introduced here if needed
          await setRoom(this.room.id, roomState);
          
          // Send the round_started event for UI updates
          this.room.broadcast(JSON.stringify({ type: 'round_started', payload: { state: roomState.state }}));
          
          // Send the start_round event with quoteType for the quote system
          this.room.broadcast(JSON.stringify({ 
            type: 'start_round',
            quoteType: 'general'
          }));
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
        //console.log(`[UPDATE_SETTINGS] Request from ${ownerName}:`, { votingPreset, timerDuration, autoReveal });
        
        let roomState = await getRoom(this.room.id);
        
        if (!roomState) {
          //console.log(`[UPDATE_SETTINGS] Room ${this.room.id} not found`);
          return;
        }
        
        //console.log(`[UPDATE_SETTINGS] Room owner: ${roomState.owner}, Request from: ${ownerName}, State: ${roomState.state}`);
        
        if (roomState && roomState.owner === ownerName && (roomState.state === 'lobby' || roomState.state === 'revealed')) {
          roomState.votingPreset = votingPreset;
          roomState.timerDuration = timerDuration;
          roomState.autoReveal = autoReveal;
          
          await setRoom(this.room.id, roomState);
          //console.log(`[UPDATE_SETTINGS] Settings updated successfully`);
          
          const updatedSettings = {
            votingPreset: roomState.votingPreset,
            timerDuration: roomState.timerDuration,
            autoReveal: roomState.autoReveal,
            state: roomState.state,
          };
          
          this.room.broadcast(JSON.stringify({ type: 'room_settings_updated', payload: updatedSettings }));
          //console.log(`[UPDATE_SETTINGS] Broadcast sent:`, updatedSettings);
        } else {
          //console.log(`[UPDATE_SETTINGS] Permission denied or invalid state`);
        }
      }

      // Handle explicit leave room message
      if (msg.type === "leave_room") {
        const { name } = msg;
        let roomState = await getRoom(this.room.id);
        
        if (!roomState) return;
        
        const participant = roomState.participants.find(p => p.name === name);
        if (participant) {
          //console.log(`[LEAVE] Participant "${name}" marked inactive in room ${this.room.id}`);

          const isOwner = roomState.owner === name;

          participant.status = 'inactive';
          participant.connectionId = undefined;
          participant.hasVoted = false;
          // Clear vote
          roomState.votes = roomState.votes.filter(v => v.name !== name);
          
          // If this is the owner, start grace period immediately
          if (isOwner && roomState.ownerStatus === 'active') {
            //console.log(`[OWNER_GRACE] Owner "${name}" left, starting grace period`);
            roomState.ownerStatus = 'grace';
            roomState.graceEndTime = Date.now() + OWNER_GRACE_PERIOD;
            roomState.previousOwner = name;
            
            // Set a timer to start voting after grace period
            const ownerGraceTimer = setTimeout(async () => {
              const updatedRoomState = await getRoom(this.room.id);
              if (!updatedRoomState) return;
              
              // Only proceed if still in grace period
              if (updatedRoomState.ownerStatus === 'grace') {
                //console.log(`[OWNER_VOTING] Grace period ended for owner: ${name}, starting voting`);
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
            //console.log(`[DEBUG_STATUS] Broadcasting owner_status_changed message with status: ${roomState.ownerStatus}`);
            //console.log(`[DEBUG_STATUS] Grace end time: ${roomState.graceEndTime ? new Date(roomState.graceEndTime).toISOString() : 'undefined'}`);
            
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
          //console.log(`[OWNER_RECLAIM] Previous owner "${name}" is reclaiming ownership`);
          
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
          //console.log(`[OWNER_ELECTED] New owner elected: ${newOwner}`);
          
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

      // Handle reveal votes message
      if (msg.type === "reveal_votes") {
        let roomState = await getRoom(this.room.id);
        if (!roomState) return;
        
        // Get the sender's name
        const senderParticipant = roomState.participants.find(p => p.connectionId === sender.id);
        if (!senderParticipant) return;
        const senderName = senderParticipant.name;
        
        // Only owner can reveal votes
        if (roomState.owner !== senderName) {
          return;
        }
        
        // Make sure we're in voting state
        if (roomState.state !== 'voting') {
          return;
        }
        
        // Filter out observers' votes
        const participantVotes = roomState.votes.filter(vote => {
          const participant = roomState.participants.find(p => p.name === vote.name);
          return participant && participant.role !== 'observer';
        });
        
        // Update room state
        roomState.state = 'revealed';
        await setRoom(this.room.id, roomState);
        
        // Select the appropriate quote type based on voting results
        const quoteType = selectQuoteType(participantVotes, roomState.votingPreset);
        
        // Broadcast revealed votes to everyone
        this.room.broadcast(JSON.stringify({ 
          type: "votes_revealed", 
          payload: participantVotes 
        }));
        
        // Send the reveal_votes event with selected quoteType for the quote system
        this.room.broadcast(JSON.stringify({ 
          type: "reveal_votes", 
          votes: participantVotes,
          roomSettings: {
            votingPreset: roomState.votingPreset
          },
          quoteType: quoteType
        }));
        
        return;
      }

      // Owner toggles mute state for a participant
      if (msg.type === "toggle_mute_user") {
        const { target } = msg;
        if (typeof target !== 'string') return;

        const roomState = await getRoom(this.room.id);
        if (!roomState) return;

        // Identify sender as participant
        const senderParticipant = roomState.participants.find(p => p.connectionId === sender.id);
        if (!senderParticipant || senderParticipant.name !== roomState.owner) {
          // Not authorized
          sender.send(JSON.stringify({ type: "mute_error", error: "Yetkisiz istek" }));
          return;
        }

        // Can't mute self (owner)
        if (target === roomState.owner) return;

        // Find target participant
        const targetIndex = roomState.participants.findIndex(p => p.name === target);
        if (targetIndex === -1) return;

        const participant = roomState.participants[targetIndex];
        participant.muted = !participant.muted;

        if (participant.muted) {
          // Clear any existing vote
          participant.hasVoted = false;
          roomState.votes = roomState.votes.filter(v => v.name !== target);
        }

        await setRoom(this.room.id, roomState);

        // Notify everyone
        this.room.broadcast(JSON.stringify({ type: "update_participants", payload: roomState.participants }));

        // Notify target user
        if (participant.connectionId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const targetConn = (this.room as any).get?.(participant.connectionId);
          if (targetConn) {
            targetConn.send(JSON.stringify({ type: participant.muted ? "silenced" : "unsilenced" }));
          }
        }
      }
    } catch (e) {
      console.error(`[ERROR] Error processing message:`, e);
    }
  }
} 