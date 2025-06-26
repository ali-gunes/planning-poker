"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";
import { NamePromptModal } from "@/components/NamePromptModal";
import { DenizModal } from "@/components/DenizModal";
import { EzgiModal } from "@/components/EzgiModal";
import { OnurModal } from "@/components/OnurModal";
import { KubilayModal } from "@/components/KubilayModal";
import { RoomSettingsModal, type RoomSettingsUpdate } from "@/components/RoomSettingsModal";

const votingStacks = {
    fibonacci: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    days: [1, 2, 3, 4, 5, 6, 7, 8],
    hours: [4, 8, 12, 16, 24, 32, 40, 48, 56, 64],
    yesno: ["Evet", "Hayır"]
};

interface Participant { name: string; hasVoted: boolean; }
interface Vote { name: string; vote: number | string; }
interface RoomSettings {
    owner: string;
    votingPreset: keyof typeof votingStacks;
    timerDuration: number;
    autoReveal: boolean;
    state: string;
}

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params ? (params.roomId as string) : "";
    const [name, setName] = useState("");
    const socket = useSocket(roomId, name);
    
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [selectedVote, setSelectedVote] = useState<number | string | null>(null);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null);
    const [gameState, setGameState] = useState("lobby"); // lobby, voting, revealed
    const [timer, setTimer] = useState(0);
    const [isDenizModalOpen, setIsDenizModalOpen] = useState(false);
    const [isEzgiModalOpen, setIsEzgiModalOpen] = useState(false);
    const [isOnurModalOpen, setIsOnurModalOpen] = useState(false);
    const [isKubilayModalOpen, setIsKubilayModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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
            console.log("📨 Received message:", msg.type, msg);
            
            if (msg.type === "initial_state") {
                console.log("🏠 Setting initial room settings:", msg.settings);
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
            if (msg.type === "room_settings_updated") {
                console.log("Received settings update:", msg.payload);
                setRoomSettings(prev => ({ ...prev, ...msg.payload }));
                setGameState(msg.payload.state);
            }
            if (msg.type === "room_error") {
                const errorParam = encodeURIComponent(msg.error);
                router.push(`/?error=${errorParam}`);
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

    const handleVote = (vote: number | string) => {
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

    const handleEzgiCard = () => {
        setIsEzgiModalOpen(true);
    };

    const handleOnurCard = () => {
        setIsOnurModalOpen(true);
    };

    const handleKubilayCard = () => {
        setIsKubilayModalOpen(true);
    };

    const handleSettingsUpdate = (settings: RoomSettingsUpdate) => {
        console.log("🔧 handleSettingsUpdate called with:", settings);
        console.log("🔍 Socket state:", socket ? "connected" : "not connected");
        console.log("👑 Is owner:", isOwner);
        console.log("👤 Owner name:", name);
        
        if (socket && isOwner) {
            const message = { 
                type: "update_room_settings", 
                ...settings,
                ownerName: name
            };
            console.log("📤 Sending message to PartyKit:", message);
            socket.send(JSON.stringify(message));
        } else {
            if (!socket) console.error("❌ No socket connection");
            if (!isOwner) console.error("❌ Not room owner");
        }
    };

    const voteCounts = useMemo(() => {
        if (gameState !== 'revealed') return { average: 0, min: 0, max: 0, consensus: false, hugeDifference: false, isYesNo: false };
        const allVotes = votes.map(v => v.vote);
        if (allVotes.length === 0) return { average: 0, min: 0, max: 0, consensus: false, hugeDifference: false, isYesNo: false };
        
        const consensus = new Set(allVotes).size === 1;
        const isYesNo = roomSettings?.votingPreset === 'yesno';
        
        if (isYesNo) {
            // For Yes/No votes, don't calculate numeric statistics
            return { average: 0, min: 0, max: 0, consensus, hugeDifference: false, isYesNo };
        }
        
        // For numeric votes
        const numericVotes = allVotes as number[];
        const sum = numericVotes.reduce((acc, v) => acc + v, 0);
        const average = sum / numericVotes.length;
        const min = Math.min(...numericVotes);
        const max = Math.max(...numericVotes);
        const hugeDifference = min > 0 && max >= min * 3; // Check if max is at least 3x min
        
        return { average: average.toFixed(1), min, max, consensus, hugeDifference, isYesNo };
    }, [votes, gameState, roomSettings?.votingPreset]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <>
            <NamePromptModal isOpen={isNameModalOpen} onSubmit={handleNameSubmit} />
            <DenizModal isOpen={isDenizModalOpen} onClose={() => setIsDenizModalOpen(false)} />
            <EzgiModal isOpen={isEzgiModalOpen} onClose={() => setIsEzgiModalOpen(false)} />
            <OnurModal isOpen={isOnurModalOpen} onClose={() => setIsOnurModalOpen(false)} />
            <KubilayModal isOpen={isKubilayModalOpen} onClose={() => setIsKubilayModalOpen(false)} />
            {roomSettings && (
                <RoomSettingsModal 
                    isOpen={isSettingsModalOpen} 
                    onClose={() => setIsSettingsModalOpen(false)}
                    onSave={handleSettingsUpdate}
                    currentSettings={{
                        votingPreset: roomSettings.votingPreset,
                        timerDuration: roomSettings.timerDuration,
                        autoReveal: roomSettings.autoReveal
                    }}
                />
            )}
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 md:p-8">
                
                {/* Header */}
                <header className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
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
                    
                    {/* Room info and controls */}
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
                        {timer > 0 && gameState === 'voting' && (
                            <div className="text-xl font-mono bg-red-800 text-white px-4 py-2 rounded-lg shadow-lg order-first md:order-none">{formatTime(timer)}</div>
                        )}
                        
                        <div className="text-lg bg-gray-800 px-3 py-1 rounded-md">
                            Oda: <span className="font-mono text-blue-400">{roomId}</span>
                        </div>
                        
                        <button onClick={handleCopyToClipboard} className="px-4 py-1 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-all transform hover:scale-105">
                            Davet Et
                        </button>
                    </div>
                    
                    {/* Owner Controls - Responsive */}
                    {isOwner && (
                        <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto md:ml-0 border-t md:border-t-0 border-gray-600 pt-3 md:pt-0">
                            {gameState === 'lobby' && (
                                <button onClick={handleStartRound} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-md hover:bg-yellow-600 transition-all transform hover:scale-105 text-sm">
                                    🚀 Turu Başlat
                                </button>
                            )}
                            {gameState === 'voting' && (
                                <button onClick={handleRevealVotes} className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-all transform hover:scale-105 text-sm">
                                    Oyları Göster
                                </button>
                            )}
                            {gameState === 'revealed' && (
                                <button onClick={handleNewRound} className="px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-all transform hover:scale-105 text-sm">
                                    🔄 Yeni Tur
                                </button>
                            )}
                            {(gameState === 'lobby' || gameState === 'revealed') && (
                                <button onClick={() => {
                                    console.log("⚙️ Opening settings modal. Current settings:", roomSettings);
                                    setIsSettingsModalOpen(true);
                                }} className="px-4 py-2 bg-purple-500 text-white font-bold rounded-md hover:bg-purple-600 transition-all transform hover:scale-105 text-sm">
                                    ⚙️ Oda Ayarları
                                </button>
                            )}
                        </div>
                    )}
                </header>

                <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Panel: Participants & Controls */}
                    <aside className="lg:col-span-1 bg-gray-800/50 rounded-lg p-6 h-fit shadow-2xl">
                        {/* Voting System Info */}
                        {roomSettings && (
                            <div className="mb-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className="text-center">
                                    <div className="text-sm text-gray-400 mb-1">Oylama sistemi</div>
                                    <div className="font-semibold text-white">
                                        {roomSettings.votingPreset === 'fibonacci' && '🔢 Fibonacci'}
                                        {roomSettings.votingPreset === 'days' && '📅 Günler'}
                                        {roomSettings.votingPreset === 'hours' && '⏰ Saatler'}
                                        {roomSettings.votingPreset === 'yesno' && '✅ Evet/Hayır'}
                                    </div>
                                    {roomSettings.timerDuration > 0 && (
                                        <div className="text-sm text-blue-400 mt-1">
                                            ⏱️ {roomSettings.timerDuration < 60 ? `${roomSettings.timerDuration} sn` : `${Math.floor(roomSettings.timerDuration / 60)} dk`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Katılımcılar ({participants.length})</h2>
                        <ul className="space-y-3">
                            {participants.map((p) => (
                                <li key={p.name} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-md">
                                    <span className="font-medium">{p.name} {p.name === name && "(Siz)"} {p.name === roomSettings?.owner && "👑"}</span>
                                    <span className={`w-3 h-3 rounded-full transition-colors ${p.hasVoted ? "bg-green-400" : "bg-gray-500"}`} title={p.hasVoted ? "Oyladı" : "Bekleniyor..."}></span>
                                </li>
                            ))}
                        </ul>
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
                                {!voteCounts.isYesNo && (
                                    <div className="mt-6 text-xl w-full flex justify-around items-center bg-gray-900/50 p-4 rounded-lg">
                                        <span>Min: <span className="font-bold text-blue-400">{voteCounts.min}</span></span>
                                        <span className="font-bold text-2xl">Ortalama: {voteCounts.average}</span>
                                        <span>Max: <span className="font-bold text-blue-400">{voteCounts.max}</span></span>
                                    </div>
                                )}
                                {voteCounts.isYesNo && (
                                    <div className="mt-6 text-xl w-full flex justify-center items-center bg-gray-900/50 p-4 rounded-lg">
                                        <span className="font-bold text-2xl">Evet/Hayır Oylaması</span>
                                    </div>
                                )}
                                {voteCounts.consensus && (
                                    <div className="mt-6 flex flex-col items-center gap-4">
                                        <div className="text-green-400 font-bold text-2xl animate-pulse">OY BİRLİĞİ!</div>
                                        <Image 
                                            src="/gifs/mark-dancing.gif" 
                                            //src="/gifs/dicaprio-clapping.gif" 
                                            alt="DiCaprio Clapping" 
                                            width={250}
                                            height={200}
                                            className="rounded-lg shadow-lg"
                                            unoptimized={true}
                                        />
                                        <div className="text-yellow-400 font-bold text-lg">🎉 Mükemmel uyum! 🎉</div>
                                    </div>
                                )}
                                
                                {voteCounts.hugeDifference && !voteCounts.consensus && (
                                    <div className="mt-6 flex flex-col items-center gap-4">
                                        <div className="text-red-400 font-bold text-2xl animate-pulse">BÜYÜK FARK!</div>
                                        <Image 
                                            src="/gifs/surprised-pikachu.gif" 
                                            alt="Surprised Pikachu" 
                                            width={250}
                                            height={200}
                                            className="rounded-lg shadow-lg"
                                            unoptimized={true}
                                        />
                                        <div className="text-orange-400 font-bold text-lg">Bu kadar fark olur mu?</div>
                                    </div>
                                )}
                                
                                {/* Character Cards */}
                                <div className="mt-6 flex flex-wrap justify-center gap-4">
                                    <button
                                        onClick={handleDenizCard}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        ⚔ Deniz Kartını Oyna
                                    </button>
                                    <button
                                        onClick={handleEzgiCard}
                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        🛡️ Ezgi Kartını Oyna
                                    </button>
                                    <button
                                        onClick={handleOnurCard}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        💻 Onur Kartını Oyna
                                    </button>
                                    <button
                                        onClick={handleKubilayCard}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        🚀 Kubilay Kartını Oyna
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