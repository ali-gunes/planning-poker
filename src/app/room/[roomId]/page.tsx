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
import { ParticipantsList } from "@/components/ParticipantsList";
import { OwnerGraceCountdown } from "@/components/OwnerGraceCountdown";
import { OwnerVotingPanel } from "@/components/OwnerVotingPanel";
import { ThemeSelector } from "@/components/ThemeSelector";

const votingStacks = {
    fibonacci: [1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    days: [1, 2, 3, 4, 5, 6, 7, 8],
    hours: [1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 36, 40, 48, 56, 64],
    yesno: ["Evet", "Hayır"]
};

interface Participant { 
    name: string; 
    hasVoted: boolean; 
    status?: 'active' | 'inactive';
    role?: 'participant' | 'observer';
}

interface Vote { name: string; vote: number | string; }

interface OwnerVote {
  voter: string;
  candidate: string;
}

interface RoomSettings {
    owner: string;
    votingPreset: keyof typeof votingStacks;
    timerDuration: number;
    autoReveal: boolean;
    state: string;
    ownerStatus?: 'active' | 'grace' | 'voting';
    graceEndTime?: number;
    previousOwner?: string;
}

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params ? (params.roomId as string) : "";
    const [name, setName] = useState("");
    const [role, setRole] = useState<'participant' | 'observer'>('participant');
    const socket = useSocket(roomId, name, role);
    
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
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
    
    // Owner transfer state
    const [ownerVotes, setOwnerVotes] = useState<OwnerVote[]>([]);
    const [ownerVoteCounts, setOwnerVoteCounts] = useState<{[candidate: string]: number}>({});
    const [requiredVotes, setRequiredVotes] = useState(0);

    const isOwner = roomSettings?.owner === name;
    const isPreviousOwner = roomSettings?.previousOwner === name;
    const votingCards = roomSettings ? votingStacks[roomSettings.votingPreset] : [];

    useEffect(() => {
        const storedName = sessionStorage.getItem("username");
        const storedRole = sessionStorage.getItem("userRole") as 'participant' | 'observer' | null;
        if (storedName) {
            setName(storedName);
        } else {
            setIsNameModalOpen(true);
        }
        if (storedRole) {
            setRole(storedRole);
        }
    }, []);

    const handleRevealVotes = useCallback(() => {
        if (socket) {
            //console.log("handleRevealVotes called");
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
            //console.log("📨 Received message:", msg.type, msg);
            
            if (msg.type === "initial_state") {
                //console.log("🏠 Setting initial room settings:", msg.settings);
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
                if (roomSettings && roomSettings.timerDuration > 0) setTimer(roomSettings.timerDuration);
            }
            if (msg.type === "round_started") {
                setGameState("voting");
                setSelectedVote(null);
                if (roomSettings && roomSettings.timerDuration > 0) setTimer(roomSettings.timerDuration);
            }
            if (msg.type === "room_settings") {
                setRoomSettings(prev => ({ ...prev, ...msg.payload }));
                setGameState(msg.payload.state);
            }
            if (msg.type === "room_settings_updated") {
                //console.log("Received settings update:", msg.payload);
                setRoomSettings(prev => ({ ...prev, ...msg.payload }));
                setGameState(msg.payload.state);
            }
            if (msg.type === "room_error") {
                const errorParam = encodeURIComponent(msg.error);
                router.push(`/?error=${errorParam}`);
            }
            if (msg.type === "name_error") {
                //console.log("Name error:", msg.error);
                setNameError(msg.error);
                setIsNameModalOpen(true);
            }
            
            // Special message for returning owner
            if (msg.type === "owner_can_reclaim") {
                //console.log("Owner can reclaim:", msg.payload);
                // Force update the isPreviousOwner state
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        previousOwner: msg.payload.previousOwner,
                        graceEndTime: msg.payload.graceEndTime
                    };
                });
            }
            
            // Owner transfer messages
            if (msg.type === "owner_grace_started") {
                //console.log("🔴 Owner grace period started:", msg.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    const newSettings: RoomSettings = { 
                        ...prev, 
                        ownerStatus: 'grace',
                        graceEndTime: msg.payload.graceEndTime,
                        previousOwner: msg.payload.owner
                    };
                    //console.log("🔴 Updated room settings for grace period:", newSettings);
                    return newSettings;
                });
            }
            
            if (msg.type === "owner_status_changed") {
                //console.log("🔴 Owner status changed:", msg.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    const newSettings: RoomSettings = { 
                        ...prev, 
                        ownerStatus: msg.payload.status as 'active' | 'grace' | 'voting',
                        graceEndTime: msg.payload.graceEndTime
                    };
                    //console.log("🔴 Updated room settings for status change:", newSettings);
                    return newSettings;
                });
            }
            
            if (msg.type === "reclaim_error") {
                console.error("Reclaim error:", msg.error);
                alert(msg.error);
            }
            
            if (msg.type === "owner_voting_started") {
                //console.log("Owner voting started:", msg.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return { 
                        ...prev, 
                        ownerStatus: 'voting',
                        previousOwner: msg.payload.previousOwner
                    };
                });
                setOwnerVotes([]);
                setOwnerVoteCounts({});
                setRequiredVotes(Math.floor(msg.payload.participants.length / 2) + 1);
            }
            
            if (msg.type === "owner_votes_updated") {
                //console.log("Owner votes updated:", msg.payload);
                setOwnerVotes(msg.payload.votes);
                setOwnerVoteCounts(msg.payload.voteCounts);
                setRequiredVotes(msg.payload.requiredVotes);
            }
            
            if (msg.type === "owner_elected") {
                //console.log("New owner elected:", msg.payload);
                // Don't change the owner yet, just update the vote counts
                // This allows time for the coronation animation
                setOwnerVoteCounts(msg.payload.voteCounts);
            }
            
            if (msg.type === "owner_change_finalized") {
                //console.log("Owner change finalized:", msg.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return { 
                        ...prev, 
                        owner: msg.payload.owner,
                        ownerStatus: 'active',
                        previousOwner: undefined,
                        graceEndTime: undefined
                    };
                });
                setOwnerVotes([]);
                setOwnerVoteCounts({});
            }
            
            if (msg.type === "owner_reclaimed") {
                //console.log("Owner reclaimed:", msg.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return { 
                        ...prev, 
                        owner: msg.payload.owner,
                        ownerStatus: 'active',
                        previousOwner: undefined,
                        graceEndTime: undefined
                    };
                });
                setOwnerVotes([]);
                setOwnerVoteCounts({});
            }
        };

        socket.addEventListener("message", handleMessage);

        return () => {
          socket.removeEventListener("message", handleMessage);
        }
    }, [socket, roomSettings, router]);
  
    const handleNameSubmit = (submittedName: string, submittedRole: 'participant' | 'observer') => {
        const trimmedName = submittedName.trim();
        setName(trimmedName);
        setRole(submittedRole);
        sessionStorage.setItem("username", trimmedName);
        sessionStorage.setItem("userRole", submittedRole);
        setNameError(null);
        setIsNameModalOpen(false);
    };

    const handleVote = (vote: number | string) => {
        // Only allow participants (not observers) to vote
        if (socket && gameState === 'voting' && role === 'participant') {
            //console.log(`Sending vote: ${vote} for user ${name} with role ${role}`);
            setSelectedVote(vote);
            socket.send(JSON.stringify({ type: "user_voted", roomId, name, vote, role }));
        } else {
            console.log(`Cannot vote: socket=${!!socket}, gameState=${gameState}, role=${role}`);
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
        //console.log("🔧 handleSettingsUpdate called with:", settings);
        //console.log("🔍 Socket state:", socket ? "connected" : "not connected");
        //console.log("👑 Is owner:", isOwner);
        //console.log("👤 Owner name:", name);
        
        if (socket && isOwner) {
            const message = { 
                type: "update_room_settings", 
                ...settings,
                ownerName: name
            };
            //console.log("📤 Sending message to PartyKit:", message);
            socket.send(JSON.stringify(message));
        } else {
            if (!socket) console.error("No socket connection");
            if (!isOwner) console.error("Not room owner");
        }
    };

    const handleVoteForOwner = (candidate: string) => {
        if (socket && roomSettings?.ownerStatus === 'voting') {
            //console.log(`Voting for new owner: ${candidate}`);
            socket.send(JSON.stringify({
                type: "vote_for_owner",
                voter: name,
                candidate
            }));
        }
    };

    const handleReclaimOwnership = () => {
        if (socket && isPreviousOwner) {
            // Get the owner token from sessionStorage
            const ownerToken = sessionStorage.getItem(`owner_token_${roomId}`);
            
            //console.log("Reclaiming ownership");
            socket.send(JSON.stringify({
                type: "reclaim_ownership",
                name,
                ownerToken
            }));
        }
    };

    const voteCounts = useMemo(() => {
        if (gameState !== 'revealed') return { average: 0, min: 0, max: 0, consensus: false, hugeDifference: false, isYesNo: false, majority: false, majorityValue: null };
        
        // Filter out observers' votes for calculation
        const participantVotes = votes.filter(v => {
            const participant = participants.find(p => p.name === v.name);
            return participant && participant.role !== 'observer';
        });
        
        const allVotes = participantVotes.map(v => v.vote);
        if (allVotes.length === 0) return { average: 0, min: 0, max: 0, consensus: false, hugeDifference: false, isYesNo: false, majority: false, majorityValue: null };
        
        const consensus = new Set(allVotes).size === 1;
        const isYesNo = roomSettings?.votingPreset === 'yesno';
        
        // Check for majority (more than 50% of votes are the same)
        let majority = false;
        let majorityValue = null;
        
        if (!consensus) { // Only check for majority if there's no consensus
            const voteCounts = allVotes.reduce((acc, vote) => {
                acc[vote] = (acc[vote] || 0) + 1;
                return acc;
            }, {} as Record<string | number, number>);
            
            const entries = Object.entries(voteCounts);
            const totalVotes = allVotes.length;
            
            for (const [value, count] of entries) {
                if (count > totalVotes / 2) { // More than 50%
                    majority = true;
                    majorityValue = value;
                    break;
                }
            }
        }
        
        if (isYesNo) {
            // For Yes/No votes, don't calculate numeric statistics
            return { average: 0, min: 0, max: 0, consensus, hugeDifference: false, isYesNo, majority, majorityValue };
        }
        
        // For numeric votes
        const numericVotes = allVotes as number[];
        const sum = numericVotes.reduce((acc, v) => acc + v, 0);
        const average = sum / numericVotes.length;
        const min = Math.min(...numericVotes);
        const max = Math.max(...numericVotes);
        const hugeDifference = min > 0 && max >= min * 3; // Check if max is at least 3x min
        
        return { average: average.toFixed(1), min, max, consensus, hugeDifference, isYesNo, majority, majorityValue };
    }, [votes, gameState, roomSettings?.votingPreset, participants]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <>
            <NamePromptModal 
                isOpen={isNameModalOpen} 
                onSubmit={handleNameSubmit} 
                error={nameError}
            />
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
                        
                        <ThemeSelector />
                    </div>
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
                                    {roomSettings.timerDuration > 0 ? (
                                        <div className="text-sm text-blue-400 mt-1">
                                            ⏱️ {roomSettings.timerDuration < 60 ? `${roomSettings.timerDuration} sn` : `${Math.floor(roomSettings.timerDuration / 60)} dk`}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-400 mt-1">
                                            ⏱️ Süresiz
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Owner Reclaim Button */}
                        {isPreviousOwner && (roomSettings?.ownerStatus === 'grace' || roomSettings?.ownerStatus === 'voting') && (
                            <div className="mb-6 text-center">
                                <button 
                                    onClick={handleReclaimOwnership}
                                    className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-md hover:bg-yellow-600 transition-all transform hover:scale-105 animate-pulse"
                                >
                                    👑 Krallığını Geri Al
                                </button>
                            </div>
                        )}
                        
                        {/* Owner Controls - Moved above participants list */}
                        {isOwner && (
                            <div className="mb-6 flex flex-col gap-3 w-full">
                                {gameState === 'lobby' && (
                                    <button onClick={handleStartRound} className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-md hover:bg-yellow-600 transition-all transform hover:scale-105">
                                        Turu Başlat
                                    </button>
                                )}
                                {gameState === 'voting' && (
                                    <button onClick={handleRevealVotes} className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-all transform hover:scale-105">
                                        Oyları Göster
                                    </button>
                                )}
                                {gameState === 'revealed' && (
                                    <button onClick={handleNewRound} className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-all transform hover:scale-105">
                                        Yeni Tur
                                    </button>
                                )}
                                {(gameState === 'lobby' || gameState === 'revealed') && (
                                    <button onClick={() => {
                                        //console.log("⚙️ Opening settings modal. Current settings:", roomSettings);
                                        setIsSettingsModalOpen(true);
                                    }} className="w-full px-6 py-3 bg-purple-500 text-white font-bold rounded-md hover:bg-purple-600 transition-all transform hover:scale-105">
                                        ⚙️ Oda Ayarları
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* Replace the old participants list with ParticipantsList component */}
                        <ParticipantsList 
                            participants={participants} 
                            currentUser={name} 
                            ownerName={roomSettings?.owner}
                        />
                    </aside>

                    {/* Right Panel: Voting Area */}
                    <section className="lg:col-span-3 bg-gray-800/50 rounded-lg p-6 md:p-8 flex flex-col items-center justify-center min-h-[50vh] shadow-2xl">
                        {/* Debug log */}
                        {(() => { 
                            //console.log("🔴 Rendering voting area, roomSettings:", JSON.stringify(roomSettings, null, 2));
                            //console.log("🔴 Owner status:", roomSettings?.ownerStatus);
                            //console.log("🔴 Grace end time:", roomSettings?.graceEndTime);
                            //console.log("🔴 Should show grace countdown:", roomSettings?.ownerStatus === 'grace' && !!roomSettings?.graceEndTime);
                            return null; 
                        })()}
                        
                        {/* Owner Grace Period Countdown - Moved to main area */}
                        {(roomSettings?.ownerStatus === 'grace' && roomSettings.graceEndTime) && (
                            <OwnerGraceCountdown 
                                ownerName={roomSettings.previousOwner || 'Eski kral'} 
                                graceEndTime={roomSettings.graceEndTime} 
                            />
                        )}

                        {/* Fallback for when owner is inactive but grace period hasn't started */}
                        {roomSettings?.owner && 
                         participants.find(p => p.name === roomSettings.owner)?.status === 'inactive' && 
                         roomSettings.ownerStatus === 'active' && (
                            <div className="bg-red-900/70 p-6 rounded-lg text-center w-full max-w-md animate-pulse">
                                <div className="text-3xl font-bold text-red-300 mb-4">⚠️ Oda Sahibi Çevrimdışı ⚠️</div>
                                <p className="text-white">
                                    Oda sahibi şu anda çevrimdışı. Kısa süre içinde &quot;Kral Düştü&quot; ekranı görünecektir.
                                </p>
                            </div>
                        )}

                        {/* Owner Voting Panel - Moved to main area */}
                        {roomSettings?.ownerStatus === 'voting' && (
                            <OwnerVotingPanel
                                participants={participants}
                                currentUser={name}
                                previousOwner={roomSettings.previousOwner}
                                votes={ownerVotes}
                                voteCounts={ownerVoteCounts}
                                requiredVotes={requiredVotes}
                                onVote={handleVoteForOwner}
                            />
                        )}

                        {/* Only show regular voting UI if not in grace period or voting for new owner */}
                        {(!roomSettings?.ownerStatus || roomSettings.ownerStatus === 'active') && (
                            <>
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
                                        
                                        {voteCounts.majority && !voteCounts.consensus && (
                                            <div className="mt-6 flex flex-col items-center gap-4">
                                                <div className="text-blue-400 font-bold text-2xl animate-pulse">ÇOĞUNLUK KARARI!</div>
                                                <Image 
                                                    src="/gifs/pillow-man.gif" 
                                                    alt="Majority Vote" 
                                                    width={250}
                                                    height={200}
                                                    className="rounded-lg shadow-lg"
                                                    unoptimized={true}
                                                />
                                                <div className="text-blue-300 font-bold text-lg">
                                                    Çoğunluk &quot;{voteCounts.majorityValue}&quot; oyunu verdi!
                                                </div>
                                            </div>
                                        )}
                                        
                                        {voteCounts.hugeDifference && !voteCounts.consensus && !voteCounts.majority && (
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
                                                disabled={gameState !== 'voting' || role === 'observer'}
                                                className={`w-28 h-40 rounded-xl flex items-center justify-center text-4xl font-bold transition-all duration-200 shadow-lg
                                                    ${ gameState !== 'voting'
                                                        ? "bg-gray-700 cursor-not-allowed text-gray-500"
                                                        : role === 'observer'
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
                                {role === 'observer' && (
                                    <div className="mt-4 text-center text-gray-400">
                                        <p>Gözlemci rolündesiniz. Oy kullanamazsınız.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
} 