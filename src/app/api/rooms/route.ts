import { redis } from "@/lib/redis";
import { REDIS_TTL } from "@/lib/constants";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

interface CreateRoomRequest {
    name: string;
    role: 'participant' | 'observer';
    votingPreset: 'fibonacci' | 'days' | 'hours' | 'yesno';
    timerDuration: number;
    autoReveal: boolean;
    quoteSystemType: 'none' | 'ci-team' | 'custom';
    customQuotes?: any;
}

// Generate a secure random token
const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export async function POST(request: Request) {
    try {
        const { name, role = 'participant', votingPreset, timerDuration, autoReveal, quoteSystemType = 'ci-team', customQuotes } = (await request.json()) as CreateRoomRequest;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const roomId = nanoid(6); // 6-character room ID
        const ownerToken = generateToken();

        const room = {
            owner: name,
            votingPreset,
            timerDuration,
            autoReveal,
            quoteSystemType,
            customQuotes: quoteSystemType === 'custom' ? customQuotes ?? null : null,
            state: "lobby", // initial state
            participants: [{ 
                name, 
                hasVoted: false, 
                connectionId: "pending", 
                status: 'active',
                role: role
            }],
            votes: [{ name, vote: null }],
            ownerStatus: 'active',
            ownerVotes: [],
            ownerToken,
        };

        // Use redis.set with JSON.stringify to match the format in socket.ts
        await redis.set(`room:${roomId}`, JSON.stringify(room), { ex: REDIS_TTL.ROOM });

        // Return both the roomId and the ownerToken
        return NextResponse.json({ roomId, ownerToken });

    } catch (error) {
        console.error('[API_CREATE_ROOM_ERROR]', error);
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
} 