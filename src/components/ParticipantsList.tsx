import React, { useState, useRef, useEffect } from "react";

interface Participant {
    name: string;
    hasVoted: boolean;
    status?: 'active' | 'inactive';
    role?: 'participant' | 'observer';
    muted?: boolean;
}

interface ParticipantsListProps {
    participants: Participant[];
    currentUser: string;
    ownerName?: string;
    onToggleMute?: (name:string)=>void;
}

export function ParticipantsList({ participants, currentUser, ownerName, onToggleMute }: ParticipantsListProps) {
    const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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
                    // Debug log for each participant
                    console.log(`Participant ${participant.name}: role=${participant.role}, hasVoted=${participant.hasVoted}`);
                    
                    return (
                        <div 
                            key={participant.name} 
                            className={`flex items-center justify-between p-2 rounded-md ${
                                participant.status === 'inactive' ? 'bg-gray-800/30 text-gray-500' : 'bg-gray-800/50'
                            } ${participant.name === currentUser ? 'border border-blue-500/50' : ''}`}
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
                                <span className={`font-medium ${participant.name === currentUser ? 'text-blue-400' : ''}`}>
                                    <span title={participant.role === 'observer' ? 'Gözlemci' : 'Katılımcı'}>
                                        {participant.role === 'observer' ? '👁️ ' : '👥 '}
                                    </span>
                                    {participant.name}
                                    {participant.name === ownerName && <span className="ml-2 text-yellow-500" title="Oda sahibi">👑</span>}
                                    {participant.name === currentUser && <span className="ml-1 text-xs text-gray-400">(siz)</span>}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* {participant.role === 'observer' && (
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Gözlemci</span>
                                )} */}
                                {participant.muted && (
                                    <span className="text-red-400" title="Susturuldu">🔇</span>
                                )}
                                {!participant.muted && participant.role === 'participant' && participant.hasVoted && (
                                    <span className="text-green-500" title="Oy kullandı">✓</span>
                                )}
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