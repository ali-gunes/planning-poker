import React from "react";

interface Participant {
    name: string;
    hasVoted: boolean;
    status?: 'active' | 'inactive';
}

interface ParticipantsListProps {
    participants: Participant[];
    currentUser: string;
    gameState: string;
}

export function ParticipantsList({ participants, currentUser, gameState }: ParticipantsListProps) {
    return (
        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Katılımcılar ({participants.length})</h2>
            <ul className="space-y-1">
                {participants.map((participant) => (
                    <li 
                        key={participant.name}
                        className={`py-1 px-2 rounded flex justify-between items-center ${
                            participant.name === currentUser ? "bg-blue-100" : ""
                        } ${participant.status === 'inactive' ? "opacity-50" : ""}`}
                    >
                        <div className="flex items-center">
                            <span className="mr-2">{participant.name}</span>
                            {participant.status === 'inactive' && (
                                <span className="text-xs text-gray-500">(çevrimdışı)</span>
                            )}
                            {participant.name === currentUser && (
                                <span className="text-xs text-blue-500">(sen)</span>
                            )}
                        </div>
                        {gameState !== "lobby" && (
                            <div className="flex items-center">
                                {participant.hasVoted ? (
                                    <span className="text-green-500 text-sm">
                                        ✓ Oyladı
                                    </span>
                                ) : (
                                    <span className="text-gray-400 text-sm">
                                        Bekliyor...
                                    </span>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
} 