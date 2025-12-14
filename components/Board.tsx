import React, { useRef, useState, useEffect } from 'react';
import { Player, Coordinate, Move, GameStatus } from '../types';
import { BOARD_SIZE } from '../services/gameLogic';

interface BoardProps {
  grid: Player[][];
  lastMove: Move | null;
  winningLine: Coordinate[] | null;
  onCellClick: (x: number, y: number) => void;
  status: GameStatus;
  zoomLevel: number;
}

const Board: React.FC<BoardProps> = ({ grid, lastMove, winningLine, onCellClick, status, zoomLevel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate cell size based on zoom
  const baseCellSize = 32; // base px
  
  const isWinningCell = (x: number, y: number) => {
    if (!winningLine) return false;
    return winningLine.some(coord => coord.x === x && coord.y === y);
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto no-scrollbar touch-pan-x touch-pan-y bg-amber-200/30 rounded-lg shadow-inner border border-stone-300 mx-auto transition-transform duration-200 ease-out"
      style={{
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div 
        className="relative bg-[#e3cd96] shadow-2xl rounded-sm"
        style={{
          width: `${BOARD_SIZE * baseCellSize}px`,
          height: `${BOARD_SIZE * baseCellSize}px`,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Grid Lines */}
        <div className="absolute inset-0 pointer-events-none p-4">
            {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <React.Fragment key={i}>
                    {/* Horizontal */}
                    <div 
                        className="absolute bg-stone-800/80"
                        style={{
                            height: '1px',
                            left: `${baseCellSize / 2}px`,
                            right: `${baseCellSize / 2}px`,
                            top: `${baseCellSize * i + baseCellSize / 2}px`
                        }}
                    />
                    {/* Vertical */}
                    <div 
                        className="absolute bg-stone-800/80"
                        style={{
                            width: '1px',
                            top: `${baseCellSize / 2}px`,
                            bottom: `${baseCellSize / 2}px`,
                            left: `${baseCellSize * i + baseCellSize / 2}px`
                        }}
                    />
                </React.Fragment>
            ))}
             {/* Star Points (Hoshi) */}
             {[3, 7, 11].map(y => [3, 7, 11].map(x => (
                 <div 
                    key={`star-${x}-${y}`}
                    className="absolute w-2 h-2 bg-stone-900 rounded-full -ml-1 -mt-1"
                    style={{
                        left: `${x * baseCellSize + baseCellSize / 2}px`,
                        top: `${y * baseCellSize + baseCellSize / 2}px`
                    }}
                 />
             )))}
        </div>

        {/* Clickable Area & Stones */}
        <div 
            className="absolute inset-0 grid"
            style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`
            }}
        >
            {grid.map((row, y) => (
                row.map((cell, x) => (
                    <div 
                        key={`${x}-${y}`}
                        onClick={() => status === GameStatus.Playing && onCellClick(x, y)}
                        className={`
                            relative flex items-center justify-center cursor-pointer
                            ${status === GameStatus.Playing && cell === Player.None ? 'hover:bg-black/5' : ''}
                        `}
                    >
                        {/* Shadow for placed stones */}
                        {cell !== Player.None && (
                            <div className="absolute w-[80%] h-[80%] rounded-full bg-black/20 translate-y-1 translate-x-1 blur-[2px]" />
                        )}

                        {/* The Stone */}
                        {cell !== Player.None && (
                            <div 
                                className={`
                                    w-[85%] h-[85%] rounded-full shadow-inner z-10
                                    transition-all duration-300 ease-out transform scale-100
                                    ${cell === Player.Black 
                                        ? 'bg-gradient-to-br from-stone-700 to-black ring-1 ring-black' 
                                        : 'bg-gradient-to-br from-white to-stone-200 ring-1 ring-stone-300'
                                    }
                                    ${lastMove?.x === x && lastMove?.y === y ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                                    ${isWinningCell(x, y) ? 'animate-pulse ring-4 ring-green-500 ring-offset-2' : ''}
                                `}
                            >
                                {/* Specular highlight for realism */}
                                <div className={`absolute top-[15%] left-[15%] w-[25%] h-[25%] rounded-full bg-gradient-to-br from-white/80 to-transparent ${cell === Player.Black ? 'opacity-30' : 'opacity-80'}`} />
                            </div>
                        )}
                        
                        {/* Last move marker dot if needed, but ring is better */}
                        {lastMove?.x === x && lastMove?.y === y && cell !== Player.None && (
                           <div className={`absolute w-2 h-2 rounded-full z-20 ${cell === Player.Black ? 'bg-white/50' : 'bg-black/50'}`} />
                        )}

                    </div>
                ))
            ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
