import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Participant {
  name: string;
  hasVoted: boolean;
  status?: 'active' | 'inactive';
}

interface OwnerVote {
  voter: string;
  candidate: string;
}

interface VoteCounts {
  [candidate: string]: number;
}

interface OwnerVotingPanelProps {
  participants: Participant[];
  currentUser: string;
  previousOwner?: string;
  votes: OwnerVote[];
  voteCounts: VoteCounts;
  requiredVotes: number;
  onVote: (candidate: string) => void;
}

export function OwnerVotingPanel({
  participants,
  currentUser,
  previousOwner,
  votes,
  voteCounts,
  requiredVotes,
  onVote
}: OwnerVotingPanelProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [newOwnerSelected, setNewOwnerSelected] = useState<string | null>(null);
  const [showCoronation, setShowCoronation] = useState(false);
  const [coronationCountdown, setCoronationCountdown] = useState(5);
  
  // Get active participants excluding the previous owner
  const eligibleCandidates = participants.filter(p => 
    p.status === 'active' && 
    p.name !== previousOwner
  );
  
  // Check if current user has already voted
  const currentUserVote = votes.find(v => v.voter === currentUser);
  
  // Check if any candidate has reached the required votes
  useEffect(() => {
    Object.entries(voteCounts).forEach(([candidate, count]) => {
      if (count >= requiredVotes && !newOwnerSelected && !showCoronation) {
        setNewOwnerSelected(candidate);
        setShowCoronation(true);
        
        // Start the 5 second countdown
        const countdownInterval = setInterval(() => {
          setCoronationCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Hide coronation after 5 seconds
        setTimeout(() => {
          setShowCoronation(false);
        }, 5000);
      }
    });
  }, [voteCounts, requiredVotes, newOwnerSelected, showCoronation]);
  
  // Handle vote submission
  const handleVote = () => {
    if (selectedCandidate) {
      onVote(selectedCandidate);
    }
  };
  
  // If a new owner has been selected, show the coronation animation
  if (showCoronation && newOwnerSelected) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto my-8">
        <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-4">👑 YENİ KRAL SEÇİLDİ! 👑</div>
        
        <div className="relative w-full max-w-md mb-6">
          <Image 
            src="/gifs/coronation.gif" 
            alt="Coronation" 
            width={500}
            height={300}
            className="rounded-lg shadow-2xl border-4 border-yellow-700"
            unoptimized={true}
          />
          
          {/* Countdown overlay */}
          <div className="absolute bottom-4 right-4 bg-black/70 rounded-full w-10 h-10 flex items-center justify-center">
            <span className="text-white font-bold text-xl">{coronationCountdown}</span>
          </div>
        </div>
        
        <div className="bg-yellow-900/70 p-6 rounded-lg text-center w-full max-w-md">
          <h3 className="text-3xl font-bold text-white mb-4">
            {newOwnerSelected}
          </h3>
          <p className="text-yellow-300 text-xl">
            Odanın yeni kralı olarak taç giydi!
          </p>
        </div>
      </div>
    );
  }
  
  // Regular voting UI
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto my-8">
      <div className="text-4xl md:text-5xl font-bold text-blue-500 mb-4">👑 YENİ KRAL SEÇİMİ 👑</div>
      
      <div className="relative w-full max-w-md mb-6">
        <Image 
          src="/gifs/no-power.gif" 
          alt="No Power" 
          width={500}
          height={300}
          className="rounded-lg shadow-2xl border-4 border-blue-700"
          unoptimized={true}
        />
      </div>
      
      <div className="bg-indigo-900/70 p-6 rounded-lg w-full max-w-md mb-6">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          {previousOwner} krallığı bıraktı!
        </h3>
        
        {currentUserVote ? (
          <div className="mb-4 text-center">
            <p className="text-yellow-300 text-lg">
              Oyunuzu <span className="font-bold">{currentUserVote.candidate}</span> için kullandınız.
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              onClick={() => setSelectedCandidate(null)}
            >
              Oyumu Değiştir
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-yellow-300 text-center mb-4 text-lg">
              Lütfen yeni kralı seçin:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {eligibleCandidates.map(candidate => (
                <button
                  key={candidate.name}
                  className={`p-3 rounded-md border ${
                    selectedCandidate === candidate.name
                      ? 'bg-indigo-600 border-white text-white'
                      : 'bg-indigo-800/50 border-indigo-700 text-gray-300 hover:bg-indigo-700/50'
                  } transition-all transform hover:scale-105`}
                  onClick={() => setSelectedCandidate(candidate.name)}
                >
                  {candidate.name}
                  {voteCounts[candidate.name] > 0 && (
                    <span className="ml-2 bg-indigo-500 px-2 py-0.5 rounded-full text-xs">
                      {voteCounts[candidate.name]} oy
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {selectedCandidate && (
              <div className="mt-6 text-center">
                <button
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-bold"
                  onClick={handleVote}
                >
                  Oyla
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-gray-900/70 p-4 rounded-lg w-full max-w-md">
        <h4 className="text-white font-semibold mb-3 text-center">Oy Durumu</h4>
        <div className="space-y-3">
          {Object.entries(voteCounts).length > 0 ? (
            Object.entries(voteCounts).map(([candidate, count]) => (
              <div key={candidate} className="flex items-center justify-between text-gray-300">
                <span className="font-medium">{candidate}:</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-700 rounded-full h-3 mr-2">
                    <div 
                      className="bg-blue-500 h-3 rounded-full" 
                      style={{ width: `${Math.min(100, (count / requiredVotes) * 100)}%` }}
                    ></div>
                  </div>
                  <span>{count}/{requiredVotes}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">Henüz oy kullanılmadı</p>
          )}
          
          <div className="text-center mt-4 text-yellow-300">
            Yeni kral seçimi için <span className="font-bold">{requiredVotes}</span> oy gerekli
          </div>
        </div>
      </div>
    </div>
  );
} 