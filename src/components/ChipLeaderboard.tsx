import React, { useEffect, useRef } from 'react';

interface Participant {
  name: string;
  chips?: number;
  role?: 'participant' | 'observer';
}

export function ChipLeaderboard({ participants }: { participants: Participant[] }) {
  const board = [...participants]
    .filter(p => p.role !== 'observer')
    .sort((a, b) => (b.chips ?? 0) - (a.chips ?? 0));

  // Store previous chip counts to compute delta arrows
  const prevChipsRef = useRef<Record<string, number>>({});
  const deltaRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const newChips: Record<string, number> = {};
    const newDelta: Record<string, number> = { ...deltaRef.current };

    participants.forEach(p => {
      const prev = prevChipsRef.current[p.name] ?? p.chips ?? 0;
      const current = p.chips ?? 0;
      newChips[p.name] = current;

      if (current !== prev) {
        newDelta[p.name] = current - prev;
      }
    });

    prevChipsRef.current = newChips;
    deltaRef.current = newDelta;
  }, [participants]);

  if (board.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg shadow-inner">
      <h4 className="text-center font-semibold mb-3 text-yellow-300">Jeton Sıralaması</h4>
      <ul className="space-y-1 text-sm">
        {board.map((p, idx) => {
          const delta = deltaRef.current[p.name] ?? 0;
          const deltaIcon = delta > 0 ? '▲' : delta < 0 ? '▼' : '•';
          const deltaColor = delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-400';

          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;

          return (
            <li key={p.name} className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 text-center">{medal}</span>
                <span className="font-medium">{p.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`${deltaColor} w-3 text-center`} title={delta !== 0 ? `Δ ${delta}` : 'Değişiklik yok'}>{deltaIcon}</span>
                <span className={`${(p.chips ?? 0) < 0 ? 'text-red-400' : 'text-yellow-300'}`}>💰 {p.chips ?? 0}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 