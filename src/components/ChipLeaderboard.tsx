import React, { useEffect, useRef, useState } from 'react';

interface Participant {
  name: string;
  chips?: number;
  role?: 'participant' | 'observer';
}

interface ChipLeaderboardProps {
  participants: Participant[];
  roomId: string; // Add roomId prop for localStorage key
}

export function ChipLeaderboard({ participants, roomId }: ChipLeaderboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const board = [...participants]
    .filter(p => p.role !== 'observer')
    .sort((a, b) => (b.chips ?? 0) - (a.chips ?? 0));

  // Store previous chip counts to compute delta arrows
  const prevChipsRef = useRef<Record<string, number>>({});
  const deltaRef = useRef<Record<string, number>>({});

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`leaderboard-collapsed-${roomId}`);
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, [roomId]);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`leaderboard-collapsed-${roomId}`, isCollapsed.toString());
  }, [isCollapsed, roomId]);

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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="mt-6 bg-gray-700/50 rounded-lg shadow-inner overflow-hidden">
      <div 
        className="p-3 flex justify-between items-center cursor-pointer"
        onClick={toggleCollapse}
      >
        <h4 className="font-semibold text-yellow-300">Jeton Sıralaması</h4>
        <button className="text-gray-400 hover:text-white transition-colors">
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4">
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
      )}
    </div>
  );
} 