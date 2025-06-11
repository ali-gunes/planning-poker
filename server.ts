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

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] New connection: ${socket.id}`);

    socket.on("join_room", async ({ roomId, name }) => {
        socket.join(roomId);
        console.log(`[Socket.IO] Socket ${socket.id} (${name}) joined room ${roomId}`);

        socketIdToUser.set(socket.id, { roomId, name });

        await redis.hset(`participants:${roomId}`, { [name]: "" });

        const participantVotes = await redis.hgetall(`participants:${roomId}`);
        const participantsStatus = Object.entries(participantVotes).map(([pName, pVote]) => ({
          name: pName,
          hasVoted: pVote !== "",
        }));

        io.to(roomId).emit("update_participants", participantsStatus);
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