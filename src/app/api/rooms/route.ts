import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { name, votingPreset, timerDuration, autoReveal } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const roomId = nanoid(6); // 6-character room ID

        const roomData = {
            owner: name,
            created_at: new Date().toISOString(),
            votingPreset: votingPreset || "fibonacci",
            timerDuration: timerDuration || 0,
            autoReveal: autoReveal || false,
            state: "lobby", // initial state
        };

        // Use a Redis pipeline to create the room and set an expiration
        const pipeline = redis.pipeline();
        pipeline.hset(`room:${roomId}`, roomData);
        pipeline.expire(`room:${roomId}`, 60 * 60 * 24); // 24 hours

        await pipeline.exec();

        return NextResponse.json({ roomId });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 