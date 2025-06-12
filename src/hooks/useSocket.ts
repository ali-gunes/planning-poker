import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (roomId: string, name: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!name || !roomId) return;

        // This is a special flag that Next.js sets for server-side rendering.
        // We only want to connect on the client-side.
        if (typeof window === "undefined") {
            return;
        }
        
        console.log(`Attempting to connect socket for user: ${name} in room: ${roomId}`);
        
        const newSocket = io(window.location.origin, {
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