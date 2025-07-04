import React from "react";

interface Participant {
    name: string;
    hasVoted: boolean;
    status?: 'active' | 'inactive';
    role?: 'participant' | 'observer';
}

interface ParticipantsListProps {
    participants: Participant[];
    currentUser: string;
    ownerName?: string;
}

export function ParticipantsList({ participants, currentUser, ownerName }: ParticipantsListProps) {
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
                                            ? 'Oy kullandı'
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
                                {participant.role === 'participant' && participant.hasVoted && (
                                    <span className="text-green-500" title="Oy kullandı">✓</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 