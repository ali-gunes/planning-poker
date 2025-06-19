import { useEffect, useState, useRef } from "react";
import PartySocket from "partysocket";

export const useSocket = (roomId: string, name: string) => {
    const [socket, setSocket] = useState<PartySocket | null>(null);
    const nameRef = useRef(name);
    nameRef.current = name;

    useEffect(() => {
        if (!roomId) return;

        // This is a special flag that Next.js sets for server-side rendering.
        // We only want to connect on the client-side.
        if (typeof window === "undefined") {
            return;
        }
        
        console.log(`Attempting to connect to PartySocket for room: ${roomId}`);
        
        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
        console.log(`🔌 Creating PartySocket connection to: ${host}`);
        
        const newSocket = new PartySocket({
            host: host,
            room: roomId,
        });

        newSocket.onopen = () => {
            console.log("%cPartySocket connected successfully!", "color: #22c55e");
            console.log(`✅ Connected to PartyKit host: ${host}`);
            // Only join if we have a name
            if (nameRef.current) {
                console.log(`📤 Sending join_room message for: ${nameRef.current}`);
                newSocket.send(JSON.stringify({ type: "join_room", name: nameRef.current }));
            }
        };

        newSocket.onmessage = (event) => {
            console.log("📨 Received message from PartyKit:", JSON.parse(event.data));
        };

        newSocket.onclose = (event) => {
            console.warn("PartySocket disconnected:", event);
        };

        newSocket.onerror = (error) => {
            console.error("PartySocket connection error:", error);
        };

        setSocket(newSocket);

        return () => {
            console.log("Cleaning up PartySocket connection.");
            newSocket.close();
        };

    }, [roomId]); // Reconnect only if roomId changes

    useEffect(() => {
        // When the name is finally available (after the modal), join the room
        if (socket && socket.readyState === WebSocket.OPEN && name) {
            socket.send(JSON.stringify({ type: "join_room", name }));
        }
    }, [name, socket]);


    return socket;
}; 