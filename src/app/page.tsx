"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [roomIdToJoin, setRoomIdToJoin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedName = sessionStorage.getItem("username");
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem("username", name.trim());

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const { roomId } = await res.json();
        router.push(`/room/${roomId}`);
      } else {
        const error = await res.json();
        alert(`Error creating room: ${error.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!roomIdToJoin.trim()) {
      alert("Please enter a Room ID.");
      return;
    }
    sessionStorage.setItem("username", name.trim());
    router.push(`/room/${roomIdToJoin.trim()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Planning Poker Online
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            Create a room and invite your team to estimate tasks together.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-4xl justify-center">
          {/* Create Room */}
          <div className="p-8 border border-gray-700 rounded-lg flex flex-col gap-4 items-center w-full max-w-sm">
            <h2 className="text-2xl font-semibold">Create a New Room</h2>
            <button
              onClick={handleCreateRoom}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-blue-900 disabled:cursor-not-allowed"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Creating..." : "Create Room"}
            </button>
          </div>

          <div className="text-xl font-semibold">OR</div>

          {/* Join Room */}
          <div className="p-8 border border-gray-700 rounded-lg flex flex-col gap-4 items-center w-full max-w-sm">
            <h2 className="text-2xl font-semibold">Join an Existing Room</h2>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-green-900 disabled:cursor-not-allowed"
              disabled={!roomIdToJoin.trim() || !name.trim()}
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
