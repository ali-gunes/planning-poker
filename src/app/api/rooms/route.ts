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
    auctionEnabled?: boolean;
    quoteSystemType: 'none' | 'ci-team' | 'custom';
    customQuotes?: Record<string, unknown>;
    theme?: 'macos' | 'default';
}

// Generate a secure random token
const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export async function POST(request: Request) {
    try {
        const { name, role = 'participant', votingPreset, timerDuration, autoReveal, auctionEnabled = false, quoteSystemType = 'ci-team', customQuotes, theme } = (await request.json()) as CreateRoomRequest;

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
            auctionEnabled,
            quoteSystemType,
            customQuotes: quoteSystemType === 'custom' ? customQuotes ?? null : null,
            state: "lobby", // initial state
            participants: [{ 
                name, 
                hasVoted: false, 
                connectionId: "pending", 
                status: 'active',
                role: role,
                muted: false,
                chips: 5,
                wager: 0
            }],
            votes: [{ name, vote: null }],
            ownerStatus: 'active',
            ownerVotes: [],
            ownerToken,
        };

        // Use redis.set with JSON.stringify to match the format in socket.ts
        await redis.set(`room:${roomId}`, JSON.stringify(room), { ex: REDIS_TTL.ROOM });

        // Update statistics hash in Redis
        const themeKey = theme === 'macos' ? 'macosLightThemeCount' : 'modernDarkThemeCount';
        
        // Determine voting system key based on votingPreset
        let votingSystemKey: string;
        switch (votingPreset) {
            case 'hours':
                votingSystemKey = 'hourSystemCount';
                break;
            case 'days':
                votingSystemKey = 'daySystemCount';
                break;
            case 'fibonacci':
                votingSystemKey = 'fibonacciSystemCount';
                break;
            case 'yesno':
                votingSystemKey = 'yesNoSystemCount';
                break;
            default:
                votingSystemKey = 'hourSystemCount'; // fallback to hours
        }
        
        // Get current UTC epoch timestamp
        const currentEpoch = Math.floor(Date.now() / 1000);
        
        await redis.hincrby('statistics', 'totalCreatedRooms', 1);
        await redis.hincrby('statistics', themeKey, 1);
        await redis.hincrby('statistics', votingSystemKey, 1);
        await redis.hset('statistics', { lastRoomCreatedAt: currentEpoch.toString() });

        // Return both the roomId and the ownerToken
        return NextResponse.json({ roomId, ownerToken });

    } catch (error) {
        console.error('[API_CREATE_ROOM_ERROR]', error);
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
} 