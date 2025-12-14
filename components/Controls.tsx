import React from 'react';
import { AIDifficulty, Player } from '../types';

interface ControlsProps {
  difficulty: AIDifficulty;
  setDifficulty: (d: AIDifficulty) => void;
  onUndo: () => void;
  onNewGame: () => void;
  onZoomChange: (zoom: number) => void;
  zoomLevel: number;
  isThinking: boolean;
  geminiAnalysis: string | null;
  currentPlayer: Player;
}

const Controls: React.FC<ControlsProps> = ({ 
  difficulty, 
  setDifficulty, 
  onUndo, 
  onNewGame,
  onZoomChange,
  zoomLevel,
  isThinking,
  geminiAnalysis,
  currentPlayer
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white shadow-lg rounded-xl w-full max-w-4xl mx-auto mt-2 z-10">
      
      {/* Top Row: Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-700 to-stone-500 hidden sm:block">
                Zen Gomoku
            </h1>
            <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase
                ${isThinking ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-stone-100 text-stone-600'}
            `}>
                {isThinking ? 'AI Thinking...' : (currentPlayer === Player.Black ? 'Black Turn' : 'White Turn')}
            </div>
        </div>

        <div className="flex items-center gap-2">
             <button 
                onClick={onUndo}
                disabled={isThinking}
                className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 active:scale-95 transition disabled:opacity-50"
             >
                Undo
             </button>
             <button 
                onClick={onNewGame}
                className="px-4 py-2 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-black active:scale-95 transition shadow-lg shadow-stone-300"
             >
                New Game
             </button>
        </div>
      </div>

      {/* Middle Row: Settings */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-stone-50 p-3 rounded-lg border border-stone-100">
        
        {/* Difficulty Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-stone-400 uppercase">Opponent</label>
            <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}
                className="flex-1 sm:flex-none p-2 text-sm bg-white border border-stone-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            >
                <option value={AIDifficulty.LocalEasy}>Local (Easy)</option>
                <option value={AIDifficulty.LocalHard}>Local (Hard)</option>
                <option value={AIDifficulty.GeminiPro}>Gemini AI (Pro)</option>
            </select>
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <label className="text-xs font-bold text-stone-400 uppercase">Zoom</label>
             <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value={zoomLevel}
                onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                className="flex-1 w-full sm:w-32 accent-stone-700"
             />
        </div>
      </div>

      {/* Analysis Box */}
      {geminiAnalysis && (
          <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100 italic animate-fade-in">
              <span className="font-bold not-italic mr-1">Gemini:</span>
              "{geminiAnalysis}"
          </div>
      )}
    </div>
  );
};

export default Controls;
