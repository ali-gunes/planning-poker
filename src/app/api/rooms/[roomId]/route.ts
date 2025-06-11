import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { roomId: string } }
) {
    try {
        const { roomId } = params;

        const roomExists = await redis.exists(`room:${roomId}`);

        if (!roomExists) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        return NextResponse.json({ roomId });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
} 