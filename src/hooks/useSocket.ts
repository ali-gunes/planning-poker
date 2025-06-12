import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (roomId: string, name: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!name || !roomId) return;

        console.log(`Attempting to connect socket for user: ${name} in room: ${roomId}`);
        
        // Ensure this environment variable is set in Vercel
        const SOCKET_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const newSocket = io(SOCKET_URL, {
            path: "/api/socket",
            transports: ["websocket"] // Force websocket connection, prevent polling
        });

        newSocket.on("connect", () => {
            console.log("Socket connected successfully:", newSocket.id);
            newSocket.emit("join_room", { roomId, name });
        });

        newSocket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        newSocket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });

        setSocket(newSocket);

        return () => {
            console.log("Cleaning up socket connection.");
            newSocket.disconnect();
        };

    }, [roomId, name]);

    return socket;
}; 