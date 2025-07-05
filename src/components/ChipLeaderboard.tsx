import React from 'react';

interface Participant {
  name: string;
  chips?: number;
  role?: 'participant' | 'observer';
}

export function ChipLeaderboard({ participants }: { participants: Participant[] }) {
  const board = [...participants]
    .filter(p => p.role !== 'observer')
    .sort((a, b) => (b.chips ?? 0) - (a.chips ?? 0));

  if (board.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg shadow-inner">
      <h4 className="text-center font-semibold mb-3 text-yellow-300">Jeton Sıralaması</h4>
      <ul className="space-y-1 text-sm">
        {board.map(p => (
          <li key={p.name} className="flex justify-between">
            <span className="font-medium">{p.name}</span>
            <span className={`${(p.chips ?? 0) < 0 ? 'text-red-400' : 'text-yellow-300'}`}>💰 {p.chips ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 