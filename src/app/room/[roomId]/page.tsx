"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { NamePromptModal } from "@/components/NamePromptModal";

const fibonacci = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

interface Participant {
  name: string;
  hasVoted: boolean;
}

interface Vote {
    name: string;
    vote: number;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params ? (params.roomId as string) : "";
  const [name, setName] = useState("");
  const socket = useSocket(roomId, name);
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    const storedName = sessionStorage.getItem("username");
    if (storedName) {
      setName(storedName);
    } else {
      setIsNameModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("update_participants", (participants: Participant[]) => {
      setParticipants(participants);
    });
    
    socket.on("votes_revealed", (revealedVotes: Vote[]) => {
        setVotes(revealedVotes);
        setRevealed(true);
    });

    socket.on("new_round_started", (participants: Participant[]) => {
        setRevealed(false);
        setVotes([]);
        setSelectedVote(null);
        setParticipants(participants);
    });

    return () => {
      socket.off("update_participants");
      socket.off("votes_revealed");
      socket.off("new_round_started");
    }
  }, [socket]);
  
  const handleNameSubmit = (submittedName: string) => {
    const trimmedName = submittedName.trim();
    setName(trimmedName);
    sessionStorage.setItem("username", trimmedName);
    setIsNameModalOpen(false);
  };

  const handleVote = (vote: number) => {
    if (socket && !revealed) {
      setSelectedVote(vote);
      socket.emit("user_voted", { roomId, name, vote });
    }
  };

  const handleRevealVotes = () => {
    if (socket) {
        socket.emit("reveal_votes", { roomId });
    }
  };

  const handleNewRound = () => {
    if (socket) {
        socket.emit("new_round", { roomId });
    }
  };

  const voteCounts = useMemo(() => {
    if (!revealed) return { average: 0, min: 0, max: 0 };
    const numericVotes = votes.map(v => v.vote);
    if (numericVotes.length === 0) return { average: 0, min: 0, max: 0 };
    
    const sum = numericVotes.reduce((acc, v) => acc + v, 0);
    const average = sum / numericVotes.length;
    const min = Math.min(...numericVotes);
    const max = Math.max(...numericVotes);
    
    return { average: average.toFixed(1), min, max };
  }, [votes, revealed]);


  return (
    <>
      <NamePromptModal
        isOpen={isNameModalOpen}
        onClose={() => {}} // Don't allow closing without a name
        onSubmit={handleNameSubmit}
      />
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
        <header className="w-full max-w-6xl mx-auto flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Planning Poker</h1>
          <div className="text-lg">
            Room: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{roomId}</span>
          </div>
        </header>

        <main className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Participants Panel */}
          <aside className="md:col-span-1 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Participants ({participants.length})</h2>
            <ul className="space-y-3">
              {participants.map((p) => (
                <li key={p.name} className="flex items-center justify-between">
                  <span>{p.name}</span>
                  <span className={`w-3 h-3 rounded-full ${p.hasVoted ? "bg-green-500" : "bg-gray-500"}`} title={p.hasVoted ? "Voted" : "Waiting..."}></span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Voting Area */}
          <section className="md:col-span-3 bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold mb-8">
              {revealed ? "Votes" : "Cast your vote"}
            </h2>

            {revealed ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {votes.map((vote, i) => (
                      <div key={i} className="flex flex-col items-center">
                          <div className="w-24 h-36 bg-white text-black rounded-lg flex items-center justify-center text-4xl font-bold">
                              {vote.vote}
                          </div>
                          <span className="mt-2 text-lg">{vote.name}</span>
                      </div>
                  ))}
                </div>
                <div className="mt-8 text-xl w-full flex justify-around">
                    <span>Min: <span className="font-bold">{voteCounts.min}</span></span>
                    <span className="font-bold text-2xl">Average: {voteCounts.average}</span>
                    <span>Max: <span className="font-bold">{voteCounts.max}</span></span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {fibonacci.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleVote(value)}
                    className={`w-24 h-36 rounded-lg flex items-center justify-center text-4xl font-bold transition-transform transform hover:-translate-y-1 ${selectedVote === value ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-12 flex gap-4">
              <button onClick={handleRevealVotes} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Reveal Votes
              </button>
              <button onClick={handleNewRound} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                New Round
              </button>
            </div>
          </section>
        </main>
      </div>
    </>
  );
} 