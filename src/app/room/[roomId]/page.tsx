"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";
import { NamePromptModal } from "@/components/NamePromptModal";
import { DenizModal } from "@/components/DenizModal";

const votingStacks = {
    fibonacci: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    days: [1, 2, 3, 4, 5, 6, 7, 8],
    hours: [4, 8, 12, 16, 24, 32, 40, 48, 56, 64]
};

interface Participant { name: string; hasVoted: boolean; }
interface Vote { name: string; vote: number; }
interface RoomSettings {
    owner: string;
    votingPreset: keyof typeof votingStacks;
    timerDuration: number;
    autoReveal: boolean;
    state: string;
}

export default function RoomPage() {
    const params = useParams();
    const roomId = params ? (params.roomId as string) : "";
    const [name, setName] = useState("");
    const socket = useSocket(roomId, name);
    
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [selectedVote, setSelectedVote] = useState<number | null>(null);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null);
    const [gameState, setGameState] = useState("lobby"); // lobby, voting, revealed
    const [timer, setTimer] = useState(0);
    const [isDenizModalOpen, setIsDenizModalOpen] = useState(false);

    const isOwner = roomSettings?.owner === name;
    const votingCards = roomSettings ? votingStacks[roomSettings.votingPreset] : [];

    useEffect(() => {
        const storedName = sessionStorage.getItem("username");
        if (storedName) {
            setName(storedName);
        } else {
            setIsNameModalOpen(true);
        }
    }, []);

    const handleRevealVotes = useCallback(() => {
        if (socket) {
            console.log("handleRevealVotes called");
            socket.send(JSON.stringify({ type: "reveal_votes", roomId }));
        }
    }, [socket, roomId]);

    useEffect(() => {
        let countdown: NodeJS.Timeout;
        if (gameState === 'voting' && timer > 0) {
            countdown = setInterval(() => {
                setTimer(prev => {
                    const newTime = prev > 0 ? prev - 1 : 0;
                    if (newTime === 0 && isOwner && roomSettings?.autoReveal) {
                        handleRevealVotes();
                    }
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(countdown);
    }, [gameState, timer, isOwner, roomSettings?.autoReveal, handleRevealVotes]);

    useEffect(() => {
        if (!socket) return;
        
        const handleMessage = (event: MessageEvent) => {
            const msg = JSON.parse(event.data);
            
            if (msg.type === "initial_state") {
                setRoomSettings(msg.settings);
                setParticipants(msg.participants);
                setGameState(msg.settings.state);
            }
            if (msg.type === "update_participants") {
                setParticipants(msg.payload);
            }
            if (msg.type === "votes_revealed") {
                setVotes(msg.payload);
                setGameState("revealed");
            }
            if (msg.type === "new_round_started") {
                setGameState("voting");
                setVotes([]);
                setSelectedVote(null);
                setParticipants(msg.payload);
                if (roomSettings) setTimer(roomSettings.timerDuration);
            }
            if (msg.type === "round_started") {
                setGameState("voting");
                setSelectedVote(null);
                if (roomSettings) setTimer(roomSettings.timerDuration);
            }
            if (msg.type === "room_settings") {
                setRoomSettings(prev => ({ ...prev, ...msg.payload }));
                setGameState(msg.payload.state);
            }
        };

        socket.addEventListener("message", handleMessage);

        return () => {
          socket.removeEventListener("message", handleMessage);
        }
    }, [socket, roomSettings]);
  
    const handleNameSubmit = (submittedName: string) => {
        const trimmedName = submittedName.trim();
        setName(trimmedName);
        sessionStorage.setItem("username", trimmedName);
        setIsNameModalOpen(false);
    };

    const handleVote = (vote: number) => {
        if (socket && gameState === 'voting') {
            setSelectedVote(vote);
            socket.send(JSON.stringify({ type: "user_voted", roomId, name, vote }));
        }
    };

    const handleNewRound = () => {
        if (socket) socket.send(JSON.stringify({ type: "new_round", roomId }));
    };

    const handleStartRound = () => {
        if (socket && isOwner) socket.send(JSON.stringify({ type: "start_round", roomId }));
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("Davet linki panoya kopyalandı!");
        });
    };

    const handleDenizCard = () => {
        setIsDenizModalOpen(true);
    };

    const voteCounts = useMemo(() => {
        if (gameState !== 'revealed') return { average: 0, min: 0, max: 0, consensus: false };
        const numericVotes = votes.map(v => v.vote);
        if (numericVotes.length === 0) return { average: 0, min: 0, max: 0, consensus: false };
        
        const sum = numericVotes.reduce((acc, v) => acc + v, 0);
        const average = sum / numericVotes.length;
        const min = Math.min(...numericVotes);
        const max = Math.max(...numericVotes);
        const consensus = new Set(numericVotes).size === 1;
        
        return { average: average.toFixed(1), min, max, consensus };
    }, [votes, gameState]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <>
            <NamePromptModal isOpen={isNameModalOpen} onSubmit={handleNameSubmit} />
            <DenizModal isOpen={isDenizModalOpen} onClose={() => setIsDenizModalOpen(false)} />
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 md:p-8">
                
                {/* Header */}
                <header className="w-full max-w-7xl mx-auto flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Image 
                            src="/planning-poker.svg" 
                            alt="Planlama Pokeri Logo" 
                            width={40}
                            height={40}
                            className="w-8 h-8 md:w-10 md:h-10" 
                        />
                        <h1 className="text-2xl md:text-3xl font-bold">C&I Planlama Pokeri</h1>
                    </div>
                    {timer > 0 && gameState === 'voting' && (
                        <div className="text-2xl font-mono bg-red-800 text-white px-4 py-2 rounded-lg shadow-lg">{formatTime(timer)}</div>
                    )}
                    <div className="flex items-center gap-4">
                        <div className="text-lg bg-gray-800 px-3 py-1 rounded-md">
                            Oda: <span className="font-mono text-blue-400">{roomId}</span>
                        </div>
                        <button onClick={handleCopyToClipboard} className="px-4 py-1 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-all transform hover:scale-105">
                            Davet Et
                        </button>
                    </div>
                </header>

                <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Panel: Participants & Controls */}
                    <aside className="lg:col-span-1 bg-gray-800/50 rounded-lg p-6 h-fit shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Katılımcılar ({participants.length})</h2>
                        <ul className="space-y-3">
                            {participants.map((p) => (
                                <li key={p.name} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-md">
                                    <span className="font-medium">{p.name} {p.name === name && "(Siz)"} {p.name === roomSettings?.owner && "👑"}</span>
                                    <span className={`w-3 h-3 rounded-full transition-colors ${p.hasVoted ? "bg-green-400" : "bg-gray-500"}`} title={p.hasVoted ? "Oyladı" : "Bekleniyor..."}></span>
                                </li>
                            ))}
                        </ul>
                         <div className="mt-8 pt-4 border-t border-gray-700 flex flex-col gap-3">
                            {isOwner && gameState === 'lobby' && (
                                <button onClick={handleStartRound} className="w-full px-6 py-2 bg-yellow-500 text-black font-bold rounded-md hover:bg-yellow-600 transition-all transform hover:scale-105">Turu Başlat</button>
                            )}
                            {isOwner && gameState === 'voting' && (
                                <button onClick={handleRevealVotes} className="w-full px-6 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-all transform hover:scale-105">Oyları Göster</button>
                            )}
                            {isOwner && gameState === 'revealed' && (
                                <button onClick={handleNewRound} className="w-full px-6 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-all transform hover:scale-105">Yeni Tur</button>
                            )}
                        </div>
                    </aside>

                    {/* Right Panel: Voting Area */}
                    <section className="lg:col-span-3 bg-gray-800/50 rounded-lg p-6 md:p-8 flex flex-col items-center justify-center min-h-[50vh] shadow-2xl">
                        <h2 className="text-3xl font-bold mb-8 text-center">
                            {gameState === 'revealed' && "Oylar"}
                            {gameState === 'voting' && "Oyunuzu kullanın"}
                            {gameState === 'lobby' && "Turun başlaması bekleniyor..."}
                        </h2>

                        {/* Revealed State */}
                        {gameState === 'revealed' ? (
                            <div className="flex flex-col items-center gap-6 w-full">
                                <div className="flex flex-wrap justify-center gap-4">
                                    {votes.map((vote, i) => (
                                        <div key={i} className="flex flex-col items-center text-center">
                                            <div className="w-24 h-36 bg-white text-gray-900 rounded-lg flex items-center justify-center text-4xl font-bold shadow-lg transform transition-transform hover:scale-105">{vote.vote}</div>
                                            <span className="mt-2 text-lg font-medium">{vote.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 text-xl w-full flex justify-around items-center bg-gray-900/50 p-4 rounded-lg">
                                    <span>Min: <span className="font-bold text-blue-400">{voteCounts.min}</span></span>
                                    <span className="font-bold text-2xl">Ortalama: {voteCounts.average}</span>
                                    <span>Max: <span className="font-bold text-blue-400">{voteCounts.max}</span></span>
                                </div>
                                {voteCounts.consensus && (
                                    <div className="mt-6 flex flex-col items-center gap-4">
                                        <div className="text-green-400 font-bold text-2xl animate-pulse">OY BİRLİĞİ!</div>
                                        <Image 
                                            src="/gifs/dicaprio-clapping.gif" 
                                            alt="DiCaprio Clapping" 
                                            width={250}
                                            height={200}
                                            className="rounded-lg shadow-lg"
                                            unoptimized={true}
                                        />
                                        <div className="text-yellow-400 font-bold text-lg">🎉 Mükemmel uyum! 🎉</div>
                                    </div>
                                )}
                                
                                {/* Deniz Card */}
                                <div className="mt-6">
                                    <button
                                        onClick={handleDenizCard}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        🤔 Deniz Kartını Oyna
                                    </button>
                                </div>
                            </div>
                        ) : (
                        /* Voting State */
                            <div className="flex flex-wrap justify-center gap-4">
                                {votingCards.map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => handleVote(value)}
                                        disabled={gameState !== 'voting'}
                                        className={`w-28 h-40 rounded-xl flex items-center justify-center text-4xl font-bold transition-all duration-200 shadow-lg
                                            ${ gameState !== 'voting'
                                                ? "bg-gray-700 cursor-not-allowed text-gray-500"
                                                : selectedVote === value
                                                ? "bg-blue-600 text-white ring-4 ring-blue-400 transform -translate-y-2"
                                                : "bg-gray-800 text-blue-400 hover:bg-gray-700 hover:-translate-y-1"
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
} 