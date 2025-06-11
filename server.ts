import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { redis } from "./src/lib/redis";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// A simple in-memory store for socket ID to user details
const socketIdToUser = new Map<string, { roomId: string; name:string }>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    // We don't need a custom path anymore
  });

  // Store server-side timers
  const roomTimers = new Map<string, NodeJS.Timeout>();

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] New connection: ${socket.id}`);

    socket.on("join_room", async ({ roomId, name }) => {
        socket.join(roomId);
        console.log(`[Socket.IO] Socket ${socket.id} (${name}) joined room ${roomId}`);

        socketIdToUser.set(socket.id, { roomId, name });

        await redis.hset(`participants:${roomId}`, { [name]: "" });

        const roomSettings = await redis.hgetall(`room:${roomId}`);
        const participantVotes = await redis.hgetall(`participants:${roomId}`);
        
        const participantsStatus = Object.entries(participantVotes).map(([pName, pVote]) => ({
          name: pName,
          hasVoted: pVote !== "",
        }));

        // Send room settings to the user who just joined
        socket.emit("room_settings", roomSettings);

        // Send updated participant list to everyone
        io.to(roomId).emit("update_participants", participantsStatus);
      });

      socket.on("start_round", async ({ roomId }) => {
        console.log(`[Socket.IO] Starting round for room ${roomId}`);
        await redis.hset(`room:${roomId}`, { state: "voting" });
        io.to(roomId).emit("round_started");

        const roomSettings = await redis.hgetall(`room:${roomId}`);
        const timerDuration = parseInt(roomSettings.timerDuration, 10);
        const autoReveal = roomSettings.autoReveal === "true";

        if (timerDuration > 0) {
            // Clear any existing timer for this room
            if (roomTimers.has(roomId)) {
                clearTimeout(roomTimers.get(roomId));
            }

            const timer = setTimeout(async () => {
                console.log(`[Socket.IO] Timer ended for room ${roomId}`);
                if (autoReveal) {
                    // Re-fetch votes and broadcast
                    const participantVotes = await redis.hgetall(`participants:${roomId}`);
                    const votes = Object.entries(participantVotes)
                      .filter(([, vote]) => vote !== "")
                      .map(([name, vote]) => ({ name, vote: parseInt(vote, 10) }));
                    
                    await redis.hset(`room:${roomId}`, { state: "revealed" });
                    io.to(roomId).emit("votes_revealed", votes);
                }
                roomTimers.delete(roomId);
            }, timerDuration * 1000);

            roomTimers.set(roomId, timer);
        }
      });

      socket.on("user_voted", async ({ roomId, name, vote }) => {
        await redis.hset(`participants:${roomId}`, { [name]: vote });

        const participantVotes = await redis.hgetall(`participants:${roomId}`);
        const participantsStatus = Object.entries(participantVotes).map(([pName, pVote]) => ({
          name: pName,
          hasVoted: pVote !== "",
        }));

        io.to(roomId).emit("update_participants", participantsStatus);
      });

      socket.on("reveal_votes", async ({ roomId }) => {
        await redis.hset(`room:${roomId}`, { state: "revealed" });

        const participantVotes = await redis.hgetall(`participants:${roomId}`);
        const votes = Object.entries(participantVotes)
          .filter(([, vote]) => vote !== "")
          .map(([name, vote]) => ({ name, vote: parseInt(vote, 10) }));

        io.to(roomId).emit("votes_revealed", votes);
      });

      socket.on("new_round", async ({ roomId }) => {
        const participants = await redis.hkeys(`participants:${roomId}`);
        const pipeline = redis.pipeline();
        for (const p of participants) {
          pipeline.hset(`participants:${roomId}`, p, "");
        }
        pipeline.hset(`room:${roomId}`, { state: "voting" });
        await pipeline.exec();

        const participantVotes = await redis.hgetall(`participants:${roomId}`);
        const participantsStatus = Object.entries(participantVotes).map(([pName, pVote]) => ({
          name: pName,
          hasVoted: pVote !== "",
        }));

        io.to(roomId).emit("new_round_started", participantsStatus);
      });

      socket.on("disconnect", async () => {
        console.log(`[Socket.IO] Socket disconnected: ${socket.id}`);
        const user = socketIdToUser.get(socket.id);
        if (user) {
          const { roomId, name } = user;
          await redis.hdel(`participants:${roomId}`, name);
          socketIdToUser.delete(socket.id);

          const participantVotes = await redis.hgetall(`participants:${roomId}`);
          const participantsStatus = Object.entries(participantVotes).map(([pName, pVote]) => ({
            name: pName,
            hasVoted: pVote !== "",
          }));

          io.to(roomId).emit("update_participants", participantsStatus);
        }
      });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
}); 