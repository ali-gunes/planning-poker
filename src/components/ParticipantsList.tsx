import React from "react";

interface Participant {
    name: string;
    hasVoted: boolean;
    status?: 'active' | 'inactive';
}

interface ParticipantsListProps {
    participants: Participant[];
    currentUser: string;
    ownerName?: string;
}

export function ParticipantsList({ participants, currentUser, ownerName }: ParticipantsListProps) {
    return (
        <>
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Katılımcılar ({participants.length})</h2>
            <ul className="space-y-3">
                {participants.map((p) => (
                    <li key={p.name} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-md">
                        <span className="font-medium">
                            {p.name} {p.name === currentUser && "(Siz)"} {p.name === ownerName && "👑"} {p.status === 'inactive' && "💤"}
                        </span>
                        <span className={`w-3 h-3 rounded-full transition-colors ${p.hasVoted ? "bg-green-400" : "bg-gray-500"}`} title={p.hasVoted ? "Oyladı" : "Bekleniyor..."}></span>
                    </li>
                ))}
            </ul>
        </>
    );
} 