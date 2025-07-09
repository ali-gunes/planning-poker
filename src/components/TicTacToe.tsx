import React, { useState, useEffect } from 'react';

interface TicTacToeProps {
  theme?: string;
}

export const TicTacToe: React.FC<TicTacToeProps> = ({ theme = 'default' }) => {
  // Board state: null = empty, 'X' = player, 'O' = AI
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true); // true = player's turn (X), false = AI's turn (O)
  const [winner, setWinner] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'draw'>('playing');
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [draws, setDraws] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Load scores from localStorage on mount
  useEffect(() => {
    const savedScores = localStorage.getItem('ticTacToeScores');
    if (savedScores) {
      const scores = JSON.parse(savedScores);
      setPlayerScore(scores.player || 0);
      setAiScore(scores.ai || 0);
      setDraws(scores.draws || 0);
    }
  }, []);
  
  // Save scores to localStorage when they change
  useEffect(() => {
    localStorage.setItem('ticTacToeScores', JSON.stringify({
      player: playerScore,
      ai: aiScore,
      draws: draws
    }));
  }, [playerScore, aiScore, draws]);
  
  // Check for winner
  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    
    return null;
  };
  
  // Check if board is full
  const isBoardFull = (squares: (string | null)[]) => {
    return squares.every(square => square !== null);
  };
  
  // Handle AI move
  useEffect(() => {
    if (!isXNext && !winner && gameStatus === 'playing') {
      const timeoutId = setTimeout(() => {
        const newBoard = [...board];
        let move: number;
        
        switch (difficulty) {
          case 'easy':
            move = makeRandomMove(newBoard);
            break;
          case 'hard':
            move = makeBestMove(newBoard);
            break;
          case 'medium':
          default:
            // 50% chance of making the best move, 50% chance of making a random move
            move = Math.random() > 0.5 ? makeBestMove(newBoard) : makeRandomMove(newBoard);
            break;
        }
        
        newBoard[move] = 'O';
        setBoard(newBoard);
        
        const nextWinner = calculateWinner(newBoard);
        if (nextWinner) {
          setWinner(nextWinner);
          setGameStatus('won');
          if (nextWinner === 'X') {
            setPlayerScore(prev => prev + 1);
          } else {
            setAiScore(prev => prev + 1);
          }
        } else if (isBoardFull(newBoard)) {
          setGameStatus('draw');
          setDraws(prev => prev + 1);
        } else {
          setIsXNext(true);
        }
      }, 600); // Delay AI move for better UX
      
      return () => clearTimeout(timeoutId);
    }
  }, [isXNext, winner, board, difficulty, gameStatus]);
  
  // Make a random move (for easy AI)
  const makeRandomMove = (squares: (string | null)[]) => {
    const emptySquares = squares
      .map((square, index) => (square === null ? index : null))
      .filter(index => index !== null) as number[];
    
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  };
  
  // Make the best move (for hard AI) using minimax algorithm
  const makeBestMove = (squares: (string | null)[]) => {
    // First check if AI can win in the next move
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        const boardCopy = [...squares];
        boardCopy[i] = 'O';
        if (calculateWinner(boardCopy) === 'O') {
          return i;
        }
      }
    }
    
    // Then check if player can win in the next move and block them
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        const boardCopy = [...squares];
        boardCopy[i] = 'X';
        if (calculateWinner(boardCopy) === 'X') {
          return i;
        }
      }
    }
    
    // Try to take the center
    if (squares[4] === null) {
      return 4;
    }
    
    // Try to take the corners
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(corner => squares[corner] === null);
    if (emptyCorners.length > 0) {
      return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }
    
    // Take any edge
    const edges = [1, 3, 5, 7];
    const emptyEdges = edges.filter(edge => squares[edge] === null);
    if (emptyEdges.length > 0) {
      return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
    }
    
    // If all else fails, make a random move
    return makeRandomMove(squares);
  };
  
  // Handle player move
  const handleClick = (index: number) => {
    if (board[index] || !isXNext || winner || gameStatus !== 'playing') {
      return;
    }
    
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    
    const nextWinner = calculateWinner(newBoard);
    if (nextWinner) {
      setWinner(nextWinner);
      setGameStatus('won');
      if (nextWinner === 'X') {
        setPlayerScore(prev => prev + 1);
      } else {
        setAiScore(prev => prev + 1);
      }
    } else if (isBoardFull(newBoard)) {
      setGameStatus('draw');
      setDraws(prev => prev + 1);
    } else {
      setIsXNext(false);
    }
  };
  
  // Reset the game
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setGameStatus('playing');
  };
  
  // Reset all scores
  const resetScores = () => {
    setPlayerScore(0);
    setAiScore(0);
    setDraws(0);
  };
  
  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'synthwave':
        return {
          boardBg: 'bg-purple-900/30 border-neon-blue',
          cellBorder: 'border-blue-500/50',
          xColor: 'text-neon-blue',
          oColor: 'text-neon-pink',
          hoverBg: 'hover:bg-purple-800/30',
          buttonBg: 'bg-purple-900/50 hover:bg-purple-800/70 border border-blue-500/50',
          activeButtonBg: 'bg-blue-600/50 border-blue-400',
          winnerText: 'text-neon-blue',
        };
      case 'retro90s':
        return {
          boardBg: 'bg-blue-900 border-2 border-cyan-400',
          cellBorder: 'border-cyan-500',
          xColor: 'text-yellow-300',
          oColor: 'text-cyan-400',
          hoverBg: 'hover:bg-blue-800',
          buttonBg: 'bg-blue-800 hover:bg-blue-700 border-2 border-cyan-400',
          activeButtonBg: 'bg-cyan-600 border-cyan-300',
          winnerText: 'text-yellow-300',
        };
      default:
        return {
          boardBg: 'bg-gray-800 border-gray-600',
          cellBorder: 'border-gray-600',
          xColor: 'text-blue-400',
          oColor: 'text-red-400',
          hoverBg: 'hover:bg-gray-700',
          buttonBg: 'bg-gray-700 hover:bg-gray-600',
          activeButtonBg: 'bg-blue-600',
          winnerText: 'text-blue-400',
        };
    }
  };
  
  const styles = getThemeStyles();
  
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg">
      <h3 className={`text-xl font-bold mb-2 ${styles.winnerText}`}>Tic-Tac-Toe</h3>
      
      {/* Explanation text */}
      <p className="text-gray-400 text-sm text-center mb-4">
        Arkadaşlarınızın efor vermelerini beklerken Tic-Tac-Toe ile vakit geçirebilirsiniz.
      </p>
      
      <div className={`mb-4 flex items-center justify-between w-full max-w-xs`}>
        <div className="text-center">
          <div className={`text-lg font-bold ${styles.xColor}`}>Siz (X)</div>
          <div className="text-2xl font-bold text-white">{playerScore}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-400">Berabere</div>
          <div className="text-2xl font-bold text-white">{draws}</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${styles.oColor}`}>AI (O)</div>
          <div className="text-2xl font-bold text-white">{aiScore}</div>
        </div>
      </div>
      
      {/* Game status */}
      <div className="h-8 mb-2">
        {gameStatus === 'won' && (
          <div className={`text-lg font-bold ${winner === 'X' ? styles.xColor : styles.oColor}`}>
            {winner === 'X' ? 'Kazandınız!' : 'AI kazandı!'}
          </div>
        )}
        {gameStatus === 'draw' && (
          <div className="text-lg font-bold text-gray-400">Berabere!</div>
        )}
        {gameStatus === 'playing' && (
          <div className={`text-lg ${isXNext ? styles.xColor : styles.oColor}`}>
            {isXNext ? 'Sıra sizde (X)' : 'AI düşünüyor...'}
          </div>
        )}
      </div>
      
      {/* Game board */}
      <div className={`grid grid-cols-3 gap-1 border ${styles.boardBg} p-2 rounded-md mb-4`}>
        {board.map((cell, index) => (
          <button
            key={index}
            className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl md:text-4xl font-bold border ${styles.cellBorder} ${!cell && isXNext && gameStatus === 'playing' ? styles.hoverBg : ''} tictactoe-button`}
            onClick={() => handleClick(index)}
            disabled={!!cell || !isXNext || gameStatus !== 'playing'}
          >
            {cell === 'X' && <span className={styles.xColor}>X</span>}
            {cell === 'O' && <span className={styles.oColor}>O</span>}
          </button>
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <div className="flex justify-between gap-2">
          <button
            onClick={resetGame}
            className={`px-4 py-2 rounded ${styles.buttonBg} text-white flex-1 relative tictactoe-button`}
          >
            {gameStatus !== 'playing' && theme === 'synthwave' && (
              <>
                <span className="absolute -left-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❮</span>
                <span className="absolute -right-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❯</span>
              </>
            )}
            {gameStatus !== 'playing' && theme === 'retro90s' && (
              <>
                <span className="absolute -left-3 text-yellow-300">◀</span>
                <span className="absolute -right-3 text-yellow-300">▶</span>
              </>
            )}
            Yeni Oyun
          </button>
          <button
            onClick={resetScores}
            className={`px-4 py-2 rounded ${styles.buttonBg} text-white flex-1 relative tictactoe-button`}
          >
            Skorları Sıfırla
          </button>
        </div>
        
        <div className="flex justify-between gap-2 mt-2">
          <button
            onClick={() => setDifficulty('easy')}
            className={`px-2 py-1 rounded text-sm ${difficulty === 'easy' ? styles.activeButtonBg : styles.buttonBg} text-white flex-1 relative tictactoe-button`}
          >
            {difficulty === 'easy' && theme === 'synthwave' && (
              <>
                <span className="absolute -left-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❮</span>
                <span className="absolute -right-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❯</span>
              </>
            )}
            {difficulty === 'easy' && theme === 'retro90s' && (
              <>
                <span className="absolute -left-3 text-yellow-300">◀</span>
                <span className="absolute -right-3 text-yellow-300">▶</span>
              </>
            )}
            Kolay
          </button>
          <button
            onClick={() => setDifficulty('medium')}
            className={`px-2 py-1 rounded text-sm ${difficulty === 'medium' ? styles.activeButtonBg : styles.buttonBg} text-white flex-1 relative tictactoe-button`}
          >
            {difficulty === 'medium' && theme === 'synthwave' && (
              <>
                <span className="absolute -left-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❮</span>
                <span className="absolute -right-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❯</span>
              </>
            )}
            {difficulty === 'medium' && theme === 'retro90s' && (
              <>
                <span className="absolute -left-3 text-yellow-300">◀</span>
                <span className="absolute -right-3 text-yellow-300">▶</span>
              </>
            )}
            Orta
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`px-2 py-1 rounded text-sm ${difficulty === 'hard' ? styles.activeButtonBg : styles.buttonBg} text-white flex-1 relative tictactoe-button`}
          >
            {difficulty === 'hard' && theme === 'synthwave' && (
              <>
                <span className="absolute -left-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❮</span>
                <span className="absolute -right-3 text-neon-blue" style={{ textShadow: '0 0 5px var(--neon-blue)' }}>❯</span>
              </>
            )}
            {difficulty === 'hard' && theme === 'retro90s' && (
              <>
                <span className="absolute -left-3 text-yellow-300">◀</span>
                <span className="absolute -right-3 text-yellow-300">▶</span>
              </>
            )}
            Zor
          </button>
        </div>
      </div>
    </div>
  );
}; 