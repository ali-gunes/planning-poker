import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

interface CreateRoomRequest {
    name: string;
    votingPreset: 'fibonacci' | 'days' | 'hours' | 'yesno';
    timerDuration: number;
    autoReveal: boolean;
}

export async function POST(request: Request) {
    try {
        const { name, votingPreset, timerDuration, autoReveal } = (await request.json()) as CreateRoomRequest;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const roomId = nanoid(6); // 6-character room ID

        const room = {
            owner: name,
            votingPreset,
            timerDuration,
            autoReveal,
            state: "lobby", // initial state
            participants: [{ name, hasVoted: false }],
            votes: [{ name, vote: null }],
        };

        // Use redis.set with JSON.stringify to match the format in socket.ts
        await redis.set(`room:${roomId}`, JSON.stringify(room));

        return NextResponse.json({ roomId });

    } catch (error) {
        console.error('[API_CREATE_ROOM_ERROR]', error);
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
} 