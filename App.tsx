import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import Controls from './components/Controls';
import { Player, GameStatus, AIDifficulty, BoardState, Move } from './types';
import { createEmptyGrid, checkWin, getLocalAIMove, BOARD_SIZE } from './services/gameLogic';
import { getGeminiMove } from './services/geminiService';

const App: React.FC = () => {
  // Game State
  const [grid, setGrid] = useState<Player[][]>(createEmptyGrid());
  const [history, setHistory] = useState<BoardState[]>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.Playing);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [winningLine, setWinningLine] = useState<{x:number, y:number}[] | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  
  // Settings
  const [difficulty, setDifficulty] = useState<AIDifficulty>(AIDifficulty.LocalHard);
  const [zoomLevel, setZoomLevel] = useState<number>(0.9); // Default zoom slightly out for mobile
  
  // AI State
  const [isThinking, setIsThinking] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);

  // Initialize Zoom based on screen width
  useEffect(() => {
    if (window.innerWidth < 768) {
      setZoomLevel(0.65); // Mobile optimized start
    } else {
      setZoomLevel(1.0);
    }
  }, []);

  const makeMove = useCallback((x: number, y: number, player: Player) => {
    if (grid[y][x] !== Player.None) return;

    // Save history for Undo
    setHistory(prev => [
      ...prev,
      {
        grid: grid.map(row => [...row]),
        moves: [], // We only need grid snapshot mostly for this simple implementation
        status,
        winner,
        currentPlayer
      }
    ]);

    // Update Grid
    const newGrid = grid.map(row => [...row]);
    newGrid[y][x] = player;
    setGrid(newGrid);
    setLastMove({ x, y, player, turnNumber: history.length + 1 });

    // Check Win
    if (checkWin(newGrid, { x, y }, player)) {
      setStatus(GameStatus.Won);
      setWinner(player);
      // In a real implementation we would calculate the exact winning line coords for highlighting
      // For now we highlight the last move specifically
      setWinningLine([{x, y}]); // Placeholder for visual effect trigger
      return;
    }

    // Check Draw
    const isFull = newGrid.every(row => row.every(cell => cell !== Player.None));
    if (isFull) {
        setStatus(GameStatus.Draw);
        return;
    }

    // Next Turn
    setCurrentPlayer(player === Player.Black ? Player.White : Player.Black);
  }, [grid, history, status, currentPlayer, winner]);

  // AI Logic Trigger
  useEffect(() => {
    if (status !== GameStatus.Playing || currentPlayer === Player.Black) return; // Assume Human is Black (moves first)

    const executeAIMove = async () => {
      setIsThinking(true);
      setGeminiAnalysis(null);

      // Delay for local AI to feel natural, or actual await for Gemini
      const isLocal = difficulty !== AIDifficulty.GeminiPro;
      
      if (isLocal) {
        setTimeout(() => {
           const move = getLocalAIMove(grid, currentPlayer);
           makeMove(move.x, move.y, currentPlayer);
           setIsThinking(false);
        }, 600);
      } else {
        // Gemini AI
        try {
            const result = await getGeminiMove(grid, currentPlayer, difficulty);
            if (result) {
                makeMove(result.x, result.y, currentPlayer);
                setGeminiAnalysis(result.reasoning);
            } else {
                // Fallback to local if Gemini fails
                console.warn("Gemini failed, falling back to local");
                const move = getLocalAIMove(grid, currentPlayer);
                makeMove(move.x, move.y, currentPlayer);
            }
        } catch (e) {
            const move = getLocalAIMove(grid, currentPlayer);
            makeMove(move.x, move.y, currentPlayer);
        } finally {
            setIsThinking(false);
        }
      }
    };

    executeAIMove();
  }, [currentPlayer, status, difficulty, grid, makeMove]);


  const handleCellClick = (x: number, y: number) => {
    if (isThinking || status !== GameStatus.Playing) return;
    makeMove(x, y, currentPlayer);
  };

  const handleUndo = () => {
    if (history.length === 0 || isThinking) return;
    
    // Undo 2 steps (Human -> AI -> Human) so it's Human's turn again
    // If playing against human (not implemented here but logic holds), undo 1
    const stepsBack = 2;
    
    if (history.length < stepsBack) {
        // Reset to start
        handleNewGame();
        return;
    }

    const prevBoardState = history[history.length - stepsBack];
    setGrid(prevBoardState.grid);
    setCurrentPlayer(prevBoardState.currentPlayer);
    setStatus(GameStatus.Playing);
    setWinner(null);
    setWinningLine(null);
    setLastMove(null); // Simplified, ideally retrieve from history
    setHistory(prev => prev.slice(0, prev.length - stepsBack));
    setGeminiAnalysis(null);
  };

  const handleNewGame = () => {
    setGrid(createEmptyGrid());
    setHistory([]);
    setStatus(GameStatus.Playing);
    setCurrentPlayer(Player.Black);
    setWinner(null);
    setLastMove(null);
    setWinningLine(null);
    setGeminiAnalysis(null);
  };

  return (
    <div className="flex flex-col h-full bg-stone-100">
      <Controls 
        difficulty={difficulty} 
        setDifficulty={setDifficulty}
        onUndo={handleUndo}
        onNewGame={handleNewGame}
        onZoomChange={setZoomLevel}
        zoomLevel={zoomLevel}
        isThinking={isThinking}
        geminiAnalysis={geminiAnalysis}
        currentPlayer={currentPlayer}
      />
      
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        {status === GameStatus.Won && winner && (
           <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
             <div className="bg-white p-8 rounded-2xl shadow-2xl transform scale-110 text-center">
                <h2 className="text-4xl font-black text-stone-800 mb-2">
                    {winner === Player.Black ? 'Black Wins!' : 'White Wins!'}
                </h2>
                <p className="text-stone-500 mb-6">Game Over</p>
                <button 
                    onClick={handleNewGame} 
                    className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition"
                >
                    Play Again
                </button>
             </div>
           </div>
        )}
        
        <Board 
            grid={grid} 
            lastMove={lastMove} 
            winningLine={winningLine}
            onCellClick={handleCellClick}
            status={status}
            zoomLevel={zoomLevel}
        />
      </div>
      
      {/* Credits/Footer */}
      <div className="p-2 text-center text-stone-400 text-xs">
         React + Tailwind + Gemini AI
      </div>
    </div>
  );
};

export default App;