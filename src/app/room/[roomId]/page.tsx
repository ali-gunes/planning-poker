/* eslint-disable @typescript-eslint/no-unused-vars */

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
import { useToast } from '@/contexts/ToastContext';
import { useQuoteSystem } from '@/contexts/QuoteContext';
import { InlineQuoteCard } from '@/components/InlineQuoteCard';
import { ChipLeaderboard } from "@/components/ChipLeaderboard";
import { VotingCardBar } from "@/components/VotingCardBar";
import { TicTacToe } from "@/components/TicTacToe";
import { useTheme } from "@/contexts/ThemeContext";

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
    muted?: boolean;
    chips?: number;
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
    auctionEnabled?: boolean;
    state: string;
    ownerStatus?: 'active' | 'grace' | 'voting';
    graceEndTime?: number;
    previousOwner?: string;
    quoteSystemType?: string;
    customQuotes?: string[];
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
    const [wager, setWager] = useState<number>(0);

    // Mobile sidebar visibility
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    // Computed helper: is the current user the room owner?
    const isOwner = roomSettings?.owner === name;
    const isPreviousOwner = roomSettings?.previousOwner === name;
    const coffeeCard: string = '☕️';
    const votingCards = roomSettings ? [coffeeCard, ...votingStacks[roomSettings.votingPreset]] : [];
    const isMuted = participants.find(p=>p.name===name)?.muted;

    const { showToast } = useToast();
    const { showQuoteForType, setQuoteSystemType, uploadCustomQuotes } = useQuoteSystem();

    // Move useTheme hook call to the top level
    const { theme } = useTheme();

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
            const data = JSON.parse(event.data);
            //console.log("📥 Received message:", data);
            
            if (data.type === "initial_state") {
                //console.log("🏠 Setting initial room settings:", data.settings);
                setRoomSettings(data.settings);
                setParticipants(data.participants);
                setGameState(data.settings.state);
                // Apply quote system from room settings
                if (data.settings.quoteSystemType) {
                    if (data.settings.quoteSystemType === 'custom' && data.settings.customQuotes) {
                        uploadCustomQuotes(JSON.stringify(data.settings.customQuotes));
                    } else {
                        setQuoteSystemType(data.settings.quoteSystemType);
                    }
                }
            }
            if (data.type === "update_participants") {
                setParticipants(data.payload);
            }
            if (data.type === "votes_revealed") {
                setVotes(data.payload);
                setGameState("revealed");
                setWager(0);
            }
            if (data.type === "new_round_started") {
                setGameState("voting");
                setVotes([]);
                setSelectedVote(null);
                setParticipants(data.payload);
                if (roomSettings && roomSettings.timerDuration > 0) setTimer(roomSettings.timerDuration);
                
                // We'll show quotes in the start_round handler instead
            }
            if (data.type === "round_started") {
                setGameState("voting");
                setSelectedVote(null);
                if (roomSettings && roomSettings.timerDuration > 0) setTimer(roomSettings.timerDuration);
            }
            if (data.type === "room_settings") {
                setRoomSettings(prev => ({ ...prev, ...data.payload }));
                setGameState(data.payload.state);
            }
            if (data.type === "room_settings_updated") {
                //console.log("Received settings update:", data.payload);
                setRoomSettings(prev => ({ ...prev, ...data.payload }));
                setGameState(data.payload.state);
            }
            if (data.type === "room_error") {
                const errorParam = encodeURIComponent(data.error);
                router.push(`/?error=${errorParam}`);
            }
            if (data.type === "name_error") {
                //console.log("Name error:", data.error);
                setNameError(data.error);
                setIsNameModalOpen(true);
            }
            
            // Special message for returning owner
            if (data.type === "owner_can_reclaim") {
                //console.log("Owner can reclaim:", data.payload);
                // Force update the isPreviousOwner state
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        previousOwner: data.payload.previousOwner,
                        graceEndTime: data.payload.graceEndTime
                    };
                });
            }
            
            // Owner transfer messages
            if (data.type === "owner_grace_started") {
                //console.log("🔴 Owner grace period started:", data.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    const newSettings: RoomSettings = { 
                        ...prev, 
                        ownerStatus: 'grace',
                        graceEndTime: data.payload.graceEndTime,
                        previousOwner: data.payload.owner
                    };
                    //console.log("🔴 Updated room settings for grace period:", newSettings);
                    return newSettings;
                });
            }
            
            if (data.type === "owner_status_changed") {
                //console.log("🔴 Owner status changed:", data.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    const newSettings: RoomSettings = { 
                        ...prev, 
                        ownerStatus: data.payload.status as 'active' | 'grace' | 'voting',
                        graceEndTime: data.payload.graceEndTime
                    };
                    //console.log("🔴 Updated room settings for status change:", newSettings);
                    return newSettings;
                });
            }
            
            if (data.type === "reclaim_error") {
                console.error("Reclaim error:", data.error);
                alert(data.error);
            }
            
            if (data.type === "owner_voting_started") {
                //console.log("Owner voting started:", data.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return { 
                        ...prev, 
                        ownerStatus: 'voting',
                        previousOwner: data.payload.previousOwner
                    };
                });
                setOwnerVotes([]);
                setOwnerVoteCounts({});
                setRequiredVotes(Math.floor(data.payload.participants.length / 2) + 1);
            }
            
            if (data.type === "owner_votes_updated") {
                //console.log("Owner votes updated:", data.payload);
                setOwnerVotes(data.payload.votes);
                setOwnerVoteCounts(data.payload.voteCounts);
                setRequiredVotes(data.payload.requiredVotes);
            }
            
            if (data.type === "owner_elected") {
                //console.log("New owner elected:", data.payload);
                // Don't change the owner yet, just update the vote counts
                // This allows time for the coronation animation
                setOwnerVoteCounts(data.payload.voteCounts);
            }
            
            if (data.type === "owner_change_finalized") {
                //console.log("Owner change finalized:", data.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return { 
                        ...prev, 
                        owner: data.payload.owner,
                        ownerStatus: 'active',
                        previousOwner: undefined,
                        graceEndTime: undefined
                    };
                });
                setOwnerVotes([]);
                setOwnerVoteCounts({});
            }
            
            if (data.type === "owner_reclaimed") {
                //console.log("Owner reclaimed:", data.payload);
                setRoomSettings(prev => {
                    if (!prev) return prev;
                    return { 
                        ...prev, 
                        owner: data.payload.owner,
                        ownerStatus: 'active',
                        previousOwner: undefined,
                        graceEndTime: undefined
                    };
                });
                setOwnerVotes([]);
                setOwnerVoteCounts({});
            }

            if (data.type === "reveal_votes") {
                setGameState('revealed');
                setVotes(data.votes);
                
                // Show quote based on the server-provided quote type
                if (data.quoteType) {
                    showQuoteForType(data.quoteType);
                }
            }

            if (data.type === "new_round") {
                // Don't show quotes on new round, only when voting begins
                setGameState('waiting');
                setVotes([]);
                setSelectedVote(null);
                setWager(0);
                setTimer(0);
            }

            if (data.type === "start_round") {
                setGameState('voting');
                setVotes([]);
                setSelectedVote(null);
                
                // Show quote based on the server-provided quote type
                if (data.quoteType) {
                    showQuoteForType(data.quoteType);
                }
            }

            if (data.type === "kicked") {
                showToast("Oda sahibi tarafından çıkarıldınız.", "error", 5000, "top-center");
                router.push("/");
                socket?.close();
                return;
            }

            if (data.type === "chip_update") {
                setParticipants(prev => prev.map(p => {
                    const updated = data.payload.find((u: {name:string; chips:number})=>u.name===p.name);
                    return updated ? { ...p, chips: updated.chips } : p;
                }));

                const transactions = data.payload.filter((u: {delta:number})=>u.delta!==0);
                transactions.forEach((u: {name:string; delta:number}, idx: number) => {
                    setTimeout(()=>{
                        showToast(`${u.name} ${u.delta>0?'+':'-'}${Math.abs(u.delta)} çip ${u.delta>0?'kazandı':'kaybetti'}`, u.delta>0?'success':'error', 1500, 'top-center');
                    }, idx*600);
                });
            }
        };

        socket.addEventListener("message", handleMessage);

        return () => {
          socket.removeEventListener("message", handleMessage);
        }
    }, [socket, roomSettings, router, showQuoteForType, setQuoteSystemType, uploadCustomQuotes, showToast]);
  
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
        const isMuted = participants.find(p=>p.name===name)?.muted;
        if (socket && gameState === 'voting' && role === 'participant' && !isMuted) {
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
            showToast("Davet linki panoya kopyalandı!", "success", 3000, "bottom-center");
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

    const handleSettingsUpdate = (settings: RoomSettingsUpdate & { auctionEnabled?: boolean }) => {
        //console.log("🔧 handleSettingsUpdate called with:", settings);
        //console.log("🔍 Socket state:", socket ? "connected" : "not connected");
        //console.log("👑 Is owner:", isOwner);
        //console.log("👤 Owner name:", name);
        
        if (socket && isOwner) {
            const message = { 
                type: "update_room_settings", 
                ...settings,
                auctionEnabled: settings.auctionEnabled,
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

    const handleToggleMuteParticipant = (target: string) => {
        if (!socket || !isOwner) return;
        socket.send(JSON.stringify({ type: 'toggle_mute_user', target }));
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
        const numericVotes = allVotes.filter((v): v is number => typeof v === 'number');
        if (numericVotes.length === 0) {
            return { average: 0, min: 0, max: 0, consensus, hugeDifference: false, isYesNo, majority, majorityValue };
        }
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

    const [showTicTacToe, setShowTicTacToe] = useState<boolean>(false);
    
    // Reset TicTacToe visibility when a new round starts
    useEffect(() => {
        if (gameState === 'voting') {
            setShowTicTacToe(false);
        }
    }, [gameState]);

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
                        autoReveal: roomSettings.autoReveal,
                        auctionEnabled: roomSettings.auctionEnabled,
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
                        <h1 className="text-2xl md:text-3xl font-bold">Planlama Pokeri</h1>
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

                {/* Mobile toggle for participants sidebar */}
                <button
                    onClick={() => setSidebarVisible(prev => !prev)}
                    className="lg:hidden mb-4 px-4 py-2 bg-gray-800 text-white rounded-md shadow-md w-full"
                >
                    {isSidebarVisible ? 'Oda Bilgilerini Gizle' : 'Oda Bilgilerini Göster'}
                </button>

                <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Panel: Participants & Controls */}
                    <aside className={`${isSidebarVisible ? 'block' : 'hidden'} lg:block lg:col-span-1 bg-gray-800/50 rounded-lg p-6 h-fit shadow-2xl`}>
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
                                    
                                   
                                        <div className="text-sm text-blue-400 mt-1">
                                            {(!roomSettings.quoteSystemType || roomSettings.quoteSystemType === 'none') && '🚫 Alıntılar Kapalı'}
                                            {roomSettings.quoteSystemType === 'ci-team' && '🍔 C&I Hatırası'}
                                            {roomSettings.quoteSystemType === 'custom' && '📁 Özel'}
                                        </div>
                                    
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
                            auctionEnabled={roomSettings?.auctionEnabled === true}
                            onToggleMute={handleToggleMuteParticipant}
                        />

                        {/* Leaderboard */}
                        {roomSettings?.auctionEnabled === true && (
                          <ChipLeaderboard participants={participants} />
                        )}
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
                                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                                            {votes.map((vote, i) => (
                                                <div key={i} className="flex flex-col items-center text-center">
                                                    <div className="w-16 h-24 md:w-20 md:h-28 bg-white text-gray-900 rounded-lg flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg transform transition-transform hover:scale-105">{vote.vote}</div>
                                                    <span className="mt-1 text-sm md:text-base font-medium">{vote.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {!voteCounts.isYesNo && (
                                            <div className="mt-4 text-base md:text-lg w-full flex justify-around items-center bg-gray-900/50 p-2 md:p-3 rounded-lg">
                                                <span>Min: <span className="font-bold text-blue-400">{voteCounts.min}</span></span>
                                                <span className="font-bold text-lg md:text-xl">Ortalama: {voteCounts.average}</span>
                                                <span>Max: <span className="font-bold text-blue-400">{voteCounts.max}</span></span>
                                            </div>
                                        )}
                                        {voteCounts.isYesNo && (
                                            <div className="mt-4 text-base md:text-lg w-full flex justify-center items-center bg-gray-900/50 p-2 md:p-3 rounded-lg">
                                                <span className="font-bold text-lg md:text-xl">Evet/Hayır Oylaması</span>
                                            </div>
                                        )}
                                        {voteCounts.consensus && (
                                            <div className="mt-4 flex flex-col items-center gap-3">
                                                <div className="text-green-400 font-bold text-xl md:text-2xl animate-pulse">OY BİRLİĞİ!</div>
                                                <Image 
                                                    src="/gifs/mark-dancing.gif" 
                                                    //src="/gifs/dicaprio-clapping.gif" 
                                                    alt="DiCaprio Clapping" 
                                                    width={250}
                                                    height={200}
                                                    className="rounded-lg shadow-lg"
                                                    unoptimized={true}
                                                />
                                                <div className="text-yellow-400 font-bold text-sm md:text-base">🎉 Mükemmel uyum! 🎉</div>
                                            </div>
                                        )}
                                        
                                        {voteCounts.majority && !voteCounts.consensus && (
                                            <div className="mt-4 flex flex-col items-center gap-3">
                                                <div className="text-blue-400 font-bold text-xl md:text-2xl animate-pulse">ÇOĞUNLUK KARARI!</div>
                                                <Image 
                                                    src="/gifs/pillow-man.gif" 
                                                    alt="Majority Vote" 
                                                    width={250}
                                                    height={200}
                                                    className="rounded-lg shadow-lg"
                                                    unoptimized={true}
                                                />
                                                <div className="text-blue-300 font-bold text-sm md:text-base">
                                                    Çoğunluk &quot;{voteCounts.majorityValue}&quot; oyunu verdi!
                                                </div>
                                            </div>
                                        )}
                                        
                                        {voteCounts.hugeDifference && !voteCounts.consensus && !voteCounts.majority && (
                                            <div className="mt-4 flex flex-col items-center gap-3">
                                                <div className="text-red-400 font-bold text-xl md:text-2xl animate-pulse">BÜYÜK FARK!</div>
                                                <Image 
                                                    src="/gifs/surprised-pikachu.gif" 
                                                    alt="Surprised Pikachu" 
                                                    width={250}
                                                    height={200}
                                                    className="rounded-lg shadow-lg"
                                                    unoptimized={true}
                                                />
                                                <div className="text-orange-400 font-bold text-sm md:text-base">Bu kadar fark olur mu?</div>
                                            </div>
                                        )}
                                        
                                        {/* Inline quote card below result GIFs */}
                                        <InlineQuoteCard variant="revealed" />
                                    </div>
                                ) : (
                                /* Voting State */
                                    <>
                                      {/* Confidence Auction Wager Slider */}
                                      {gameState === 'voting' && role === 'participant' && !isMuted && roomSettings?.auctionEnabled === true && roomSettings?.votingPreset !== 'yesno' && selectedVote !== null && (participants.find(p=>p.name===name)?.chips ?? 0) > -10 && (
                                        <div className="mt-6 flex flex-col items-center gap-2">
                                            <label htmlFor="wagerRange" className="text-sm text-gray-300">Bahis: {wager} çip</label>
                                            <input
                                              id="wagerRange"
                                              type="range"
                                              min={0}
                                              max={Math.min(3, 10 + (participants.find(p=>p.name===name)?.chips ?? 0))}
                                              value={wager}
                                              onChange={(e)=>{
                                                  const val = Number(e.target.value);
                                                  setWager(val);
                                                  if(socket){
                                                    socket.send(JSON.stringify({ type: 'confidence_wager', amount: val }));
                                                  }
                                              }}
                                              className="w-48 accent-yellow-500"
                                            />
                                        </div>
                                      )}
                                      
                                      {/* Show TicTacToe when quotes are disabled */}
                                      {gameState === 'voting' && (!roomSettings?.quoteSystemType || roomSettings?.quoteSystemType === 'none') ? (
                                        <div className="mt-8">
                                          <TicTacToe theme={theme} />
                                        </div>
                                      ) : gameState === 'voting' ? (
                                        /* Show quotes with TicTacToe toggle button */
                                        <>
                                          {/* General quote card below voting cards */}
                                          {!showTicTacToe && <InlineQuoteCard variant="voting" />}
                                          
                                          {/* TicTacToe toggle button */}
                                          <div className="mt-4 flex justify-center">
                                            <button
                                              onClick={() => setShowTicTacToe(!showTicTacToe)}
                                              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm flex items-center gap-2 transition-all"
                                            >
                                              {showTicTacToe ? (
                                                <>
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                  </svg>
                                                  Alıntıları Göster
                                                </>
                                              ) : (
                                                <>
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                  </svg>
                                                  Tic-Tac-Toe Oyna
                                                </>
                                              )}
                                            </button>
                                          </div>
                                          
                                          {/* TicTacToe game when toggled */}
                                          {showTicTacToe && (
                                            <div className="mt-4 border-t border-gray-700 pt-4">
                                              <TicTacToe theme={theme} />
                                            </div>
                                          )}
                                        </>
                                      ) : null}
                                    </>
                                )}
                                {(role === 'observer' || isMuted) && (
                                    <div className="mt-4 text-center text-gray-400">
                                        {role === 'observer' && (
                                            <p>Gözlemci rolündesiniz. Oy kullanamazsınız.</p>
                                        )}
                                        {isMuted && (
                                            <p>Oda sahibi tarafından susturuldunuz. Oy kullanamazsınız.</p>
                                        )}
                                    </div>
                                )}
                                
                            </>
                        )}
                    </section>
                </main>
            </div>
            {/* Use a stable key to prevent remounting between rounds */}
            <VotingCardBar
                key={`voting-cards-${roomId}`}
                cards={votingCards}
                selected={selectedVote}
                disabled={gameState !== 'voting' || role === 'observer' || !!isMuted}
                onSelect={handleVote}
                roomId={roomId}
                gameState={gameState}
            />
        </>
    );
} 