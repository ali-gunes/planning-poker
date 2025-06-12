import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
  try {
    // Manually parse roomId from the URL as a workaround for the build issue
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1];

    if (!roomId) {
        return NextResponse.json({ error: "Room ID missing from URL" }, { status: 400 });
    }

    const roomData = await redis.get(`room:${roomId}`);

    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = JSON.parse(roomData);

    return NextResponse.json({
      roomId,
      exists: true,
      owner: room.owner,
      participantsCount: room.participants.length,
    });

  } catch (error) {
    console.error(`[API_ROOM_GET_ERROR]`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 