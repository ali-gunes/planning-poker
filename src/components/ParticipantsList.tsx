import React, { useState, useRef, useEffect, useMemo } from "react";
import { TrophyIcon } from '@heroicons/react/24/solid';
import { useTheme, ThemeType } from "../contexts/ThemeContext";

interface Participant {
    name: string;
    hasVoted: boolean;
    status?: 'active' | 'inactive';
    role?: 'participant' | 'observer';
    muted?: boolean;
    chips?: number;
}

interface ParticipantsListProps {
    participants: Participant[];
    currentUser: string;
    ownerName?: string;
    onToggleMute?: (name:string)=>void;
    auctionEnabled?: boolean;
}

export function ParticipantsList({ participants, currentUser, ownerName, onToggleMute, auctionEnabled = false }: ParticipantsListProps) {
    const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Theme hook for dynamic colors
    const { theme } = useTheme();

    // Map theme → highlight color
    const themeColors: Record<ThemeType, string> = {
        default: 'text-amber-400',
        retro90s: 'text-yellow-300',
        nordic: 'text-sky-400',
        synthwave: 'text-fuchsia-400',
        macos: 'text-blue-500',
    };

    const ringColors: Record<ThemeType, string> = {
        default: 'ring-amber-400/60',
        retro90s: 'ring-yellow-300/60',
        nordic: 'ring-sky-400/60',
        synthwave: 'ring-fuchsia-400/60',
        macos: 'ring-blue-500/60',
    };

    // Determine chip leader(s) - wrapped in useMemo to avoid dependency changes on every render
    const leaders = useMemo(() => {
        if (!auctionEnabled) return [];
        const maxChips = Math.max(...participants.map(p => p.chips ?? 0));
        return participants.filter(p => (p.role !== 'observer') && ((p.chips ?? 0) === maxChips));
    }, [participants, auctionEnabled]);

    // Confetti on lead change (unique leader only)
    const prevLeadersRef = useRef<string[]>([]);
    useEffect(() => {
        const current = leaders.map(l => l.name).sort();
        const prev = prevLeadersRef.current;

        // Trigger confetti only when there is a change and we have a single clear leader
        if (auctionEnabled && prev.length && JSON.stringify(prev) !== JSON.stringify(current) && current.length === 1) {
            (async () => {
                try {
                    const confetti = (await import('canvas-confetti')).default;
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.2 },
                    });
                } catch (err) {
                    console.error('Failed to load confetti', err);
                }
            })();
        }
        prevLeadersRef.current = current;
    }, [leaders, auctionEnabled]);

    // Close menu on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpenFor(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Sort participants: owner first, then active, then inactive
    const sortedParticipants = [...participants].sort((a, b) => {
        if (a.name === ownerName) return -1;
        if (b.name === ownerName) return 1;
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return a.name.localeCompare(b.name);
    });
    
    // Debug log to check participant roles
    console.log("Participants with roles:", sortedParticipants);
    
    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold mb-3">Katılımcılar ({participants.length})</h3>
            <div className="space-y-2">
                {sortedParticipants.map((participant) => {
                    const isLeader = auctionEnabled && leaders.some(l => l.name === participant.name);
                    const uniqueLeader = auctionEnabled && isLeader && leaders.length === 1;

                    // Debug log for each participant
                    console.log(`Participant ${participant.name}: role=${participant.role}, hasVoted=${participant.hasVoted}`);
                    
                    return (
                        <div 
                            key={participant.name} 
                            className={`flex items-center justify-between p-2 rounded-md ${
                                participant.status === 'inactive' ? 'bg-gray-800/30 text-gray-500' : 'bg-gray-800/50'
                            } ${participant.name === currentUser ? 'border border-blue-500/50' : ''} ${isLeader ? (theme === 'retro90s' ? 'border-2 border-yellow-300' : `ring-2 ring-offset-1 ${ringColors[theme]}`) : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${
                                    participant.status === 'inactive' 
                                        ? 'bg-gray-500' 
                                        : participant.role === 'participant' && participant.hasVoted
                                            ? 'bg-green-500'
                                            : 'bg-blue-500'
                                }`} title={
                                    participant.status === 'inactive' 
                                        ? 'Çevrimdışı' 
                                        : participant.role === 'participant' && participant.hasVoted
                                            ? 'Oy'
                                            : 'Çevrimiçi ancak oy kullanmadı'
                                }></div>
                                <span className={`font-medium ${participant.name === currentUser ? 'text-blue-400' : ''} ${isLeader ? 'font-bold ' + themeColors[theme] : ''}`}>
                                    <span title={participant.role === 'observer' ? 'Gözlemci' : 'Katılımcı'}>
                                        {participant.role === 'observer' ? '👁️ ' : '👥 '}
                                    </span>
                                    {isLeader && (
                                        <TrophyIcon 
                                            className={`${uniqueLeader ? themeColors[theme] : 'text-gray-300'} ${uniqueLeader ? 'w-4 h-4' : 'w-3 h-3'} inline-block mr-1 drop-shadow`} 
                                            title={uniqueLeader ? 'Jeton Lideri' : 'Liderle Berabere'}
                                        />
                                    )}
                                    {participant.name}
                                    {participant.name === ownerName && <span className="ml-2 text-yellow-500" title="Oda sahibi">👑</span>}
                                    {participant.name === currentUser && <span className="ml-1 text-xs text-gray-400">(siz)</span>}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Chip balance removed to declutter list */}
                                {participant.muted && (
                                    <span className="text-red-400" title="Susturuldu">🔇</span>
                                )}
                                {!participant.muted && participant.role === 'participant' && participant.hasVoted && (
                                    <span className="text-green-500" title="Oy kullandı">✓</span>
                                )}
                                {/*auctionEnabled && participant.role !== 'observer' && (
                                    <span className={`${(participant.chips ?? 0) < 0 ? 'text-red-400' : 'text-yellow-300'} text-sm`} title="Jeton sayısı">💰 {participant.chips ?? 0}</span>
                                )*/}
                                {currentUser === ownerName && participant.name !== ownerName && (
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() => setMenuOpenFor(menuOpenFor === participant.name ? null : participant.name)}
                                            className="text-gray-400 hover:text-gray-200 px-1"
                                            title="Aksiyonlar"
                                        >
                                            ⋯
                                        </button>
                                        {menuOpenFor === participant.name && (
                                            <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
                                                <button
                                                    onClick={() => {
                                                        onToggleMute?.(participant.name);
                                                        setMenuOpenFor(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700"
                                                >
                                                    {participant.muted ? '🔊 Suskunluğu Bitir' : '🔇 Kullanıcıyı Sustur'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 