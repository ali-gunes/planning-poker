import { Server, type Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "@/lib/redis";

// --- START OF TYPES ---
// These are the types that are used in the application.
// In a real-world application, these would be in a separate file.

interface Participant {
    name: string;
    hasVoted: boolean;
}

interface Vote {
    name: string;
    vote: number | null;
}

interface Room {
    owner: string;
    votingPreset: 'fibonacci' | 'days' | 'hours';
    timerDuration: number;
    autoReveal: boolean;
    state: 'lobby' | 'voting' | 'revealed';
    participants: Participant[];
    votes: Vote[];
    timerEndsAt?: number;
}
// --- END OF TYPES ---

interface SocketServer extends HTTPServer {
  io?: Server | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

const getRoom = async (roomId: string): Promise<Room | null> => {
    const roomData = await redis.get(`room:${roomId}`);
    return roomData ? JSON.parse(roomData) : null;
};

const setRoom = (roomId: string, roomData: Room | object) => {
    return redis.set(`room:${roomId}`, JSON.stringify(roomData));
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*", // Allow all origins for simplicity, can be restricted later
      methods: ["GET", "POST"]
    }
  });
  res.socket.server.io = io;

  console.log("Socket server instance created. Waiting for connections.");

  io.on("connection", (socket: Socket) => {
    console.log(`[CONNECTION] New client connected: ${socket.id}`);

    socket.on("join_room", async ({ roomId, name }: { roomId: string, name: string }) => {
        console.log(`[JOIN_ROOM] User: "${name}" attempting to join Room: "${roomId}"`);
        await socket.join(roomId);
        const room = await getRoom(roomId);
        
        if (!room) {
            console.error(`[JOIN_ROOM] CRITICAL: Room not found for id ${roomId}`);
            // Optionally, emit an error back to the client
            socket.emit("error", { message: `Room ${roomId} not found.` });
            return;
        }
        
        console.log(`[JOIN_ROOM] Initial participants for room ${roomId}:`, JSON.stringify(room.participants));

        const isParticipant = room.participants.some(p => p.name === name);
        if (!isParticipant) {
            console.log(`[JOIN_ROOM] User "${name}" is new. Adding to participants.`);
            room.participants.push({ name, hasVoted: false });
            if (!room.votes.some(v => v.name === name)) {
                room.votes.push({ name, vote: null });
            }
        } else {
            console.log(`[JOIN_ROOM] User "${name}" is already a participant.`);
        }
        
        console.log(`[JOIN_ROOM] Participants after update for room ${roomId}:`, JSON.stringify(room.participants));

        await setRoom(roomId, room);
        
        const settings = {
            owner: room.owner,
            votingPreset: room.votingPreset,
            timerDuration: room.timerDuration,
            autoReveal: room.autoReveal,
            state: room.state,
        };

        // Send the complete initial state to the user who just joined
        console.log(`[JOIN_ROOM] Emitting 'initial_state' to ${socket.id} with ${room.participants.length} participants.`);
        socket.emit("initial_state", { settings, participants: room.participants });

        // Let everyone else in the room know about the new participant
        console.log(`[JOIN_ROOM] Emitting 'update_participants' to room ${roomId} (except sender) with ${room.participants.length} participants.`);
        socket.to(roomId).emit("update_participants", room.participants);

        if (room.state === 'revealed') {
            const revealedVotes = room.votes.filter(v => v.vote !== null);
            console.log(`[JOIN_ROOM] Emitting 'votes_revealed' for revealed room:`, revealedVotes);
            io.to(roomId).emit("votes_revealed", revealedVotes);
        }
    });

    socket.on("start_round", async ({ roomId }: { roomId: string }) => {
        console.log(`[start_round] received for room: ${roomId}`);
        const room = await getRoom(roomId);
        if (room && room.state === 'lobby') {
            room.state = 'voting';
            if (room.timerDuration > 0) {
                room.timerEndsAt = Date.now() + room.timerDuration * 1000;
            }
            await setRoom(roomId, room);
            console.log(`[start_round] emitting 'round_started' and 'room_settings'`);
            io.to(roomId).emit("round_started");
            io.to(roomId).emit("room_settings", { state: room.state });
        } else {
            console.warn(`[start_round] failed. Room state was not 'lobby'. Current state: ${room?.state}`);
        }
    });

    socket.on("user_voted", async ({ roomId, name, vote }: { roomId: string, name: string, vote: number }) => {
        console.log(`[user_voted] received for room: ${roomId}, user: ${name}, vote: ${vote}`);
        const room = await getRoom(roomId);
        if (room && room.state === 'voting') {
            const participant = room.participants.find(p => p.name === name);
            if (participant) participant.hasVoted = true;

            const userVote = room.votes.find(v => v.name === name);
            if (userVote) userVote.vote = vote;

            await setRoom(roomId, room);
            console.log(`[user_voted] emitting 'update_participants':`, room.participants);
            io.to(roomId).emit("update_participants", room.participants);
        } else {
            console.warn(`[user_voted] failed. Room state was not 'voting'. Current state: ${room?.state}`);
        }
    });

    socket.on("reveal_votes", async ({ roomId }: { roomId: string }) => {
        console.log(`[reveal_votes] received for room: ${roomId}`);
        const room = await getRoom(roomId);
        if (room && room.state === 'voting') {
            room.state = 'revealed';
            await setRoom(roomId, room);
            const revealedVotes = room.votes.filter(v => v.vote !== null);
            console.log(`[reveal_votes] emitting 'votes_revealed':`, revealedVotes);
            io.to(roomId).emit("votes_revealed", revealedVotes);
            console.log(`[reveal_votes] emitting 'room_settings'`);
            io.to(roomId).emit("room_settings", { state: room.state });
        } else {
            console.warn(`[reveal_votes] failed. Room state was not 'voting'. Current state: ${room?.state}`);
        }
    });

    socket.on("new_round", async ({ roomId }: { roomId: string }) => {
        console.log(`[new_round] received for room: ${roomId}`);
        const room = await getRoom(roomId);
        if (room && room.state === 'revealed') {
            room.state = 'lobby';
            room.participants.forEach(p => p.hasVoted = false);
            room.votes.forEach(v => v.vote = null);
            delete room.timerEndsAt;

            await setRoom(roomId, room);
            console.log(`[new_round] emitting 'new_round_started':`, room.participants);
            io.to(roomId).emit("new_round_started", room.participants);
            console.log(`[new_round] emitting 'room_settings'`);
            io.to(roomId).emit("room_settings", { state: room.state });
        } else {
            console.warn(`[new_round] failed. Room state was not 'revealed'. Current state: ${room?.state}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket Disconnected]: ${socket.id}`);
    });
  });

  console.log("Socket server initialized correctly");
  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default ioHandler; 