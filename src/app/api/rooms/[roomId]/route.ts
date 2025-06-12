import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { roomId: string } }
): Promise<NextResponse> {
    try {
        const { roomId } = params;

        const roomData = await redis.get(`room:${roomId}`);

        if (!roomData) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const room = JSON.parse(roomData);

        // Return some basic info, not the whole room object for security
        return NextResponse.json({ 
            roomId, 
            owner: room.owner,
            participantsCount: room.participants.length 
        });

    } catch (error) {
        console.error(`[API_ROOM_GET_ERROR] roomId: ${params.roomId}`, error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
} 