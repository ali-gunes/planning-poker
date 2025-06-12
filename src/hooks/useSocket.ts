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
            console.log("%cSocket connected successfully:", "color: #22c55e", newSocket.id);
            newSocket.emit("join_room", { roomId, name });
        });

        newSocket.on("disconnect", (reason) => {
            console.warn("Socket disconnected:", reason);
        });

        newSocket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        // Reconnection events for more detailed logging
        newSocket.io.on("reconnect_attempt", (attempt) => {
            console.log(`Socket reconnect attempt #${attempt}`);
        });

        newSocket.io.on("reconnect", (attempt) => {
            console.log(`%cSocket reconnected successfully after ${attempt} attempts`, "color: #22c55e");
        });

        newSocket.io.on("reconnect_error", (error) => {
            console.error("Socket reconnection error:", error);
        });

        newSocket.io.on("reconnect_failed", () => {
            console.error("Socket reconnection failed permanently.");
        });

        setSocket(newSocket);

        return () => {
            console.log("Cleaning up socket connection.");
            newSocket.disconnect();
        };

    }, [roomId, name]);

    return socket;
}; 