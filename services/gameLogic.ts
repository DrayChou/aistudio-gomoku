import { Player, Coordinate, BoardState, GameStatus } from '../types';

export const BOARD_SIZE = 15;

export const createEmptyGrid = (): Player[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None));
};

export const checkWin = (grid: Player[][], lastMove: Coordinate, player: Player): boolean => {
  const { x, y } = lastMove;
  const directions = [
    [1, 0],   // Horizontal
    [0, 1],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1],  // Diagonal /
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    // Check forward
    let i = 1;
    while (true) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE || grid[ny][nx] !== player) break;
      count++;
      i++;
    }

    // Check backward
    i = 1;
    while (true) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE || grid[ny][nx] !== player) break;
      count++;
      i++;
    }

    if (count >= 5) return true;
  }

  return false;
};

// --- Local AI Logic ---

// Evaluate a specific position for a player
const evaluatePosition = (grid: Player[][], x: number, y: number, player: Player): number => {
  let score = 0;
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  
  // Weights
  const weights = {
    5: 100000,
    open4: 10000,
    closed4: 1000,
    open3: 1000,
    closed3: 100,
    open2: 100,
    closed2: 10
  };

  for (const [dx, dy] of directions) {
    // Check line in this direction
    let consecutive = 0;
    let openEnds = 0;

    // Scan the line segments around this point
    // This is a simplified evaluator that looks for patterns
    
    // Check forward
    let i = 1;
    while (i <= 4) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
      if (grid[ny][nx] === player) {
        consecutive++;
      } else if (grid[ny][nx] === Player.None) {
        openEnds++;
        break;
      } else {
        break; // Blocked
      }
      i++;
    }
    
    // Check backward
    i = 1;
    while (i <= 4) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) break;
      if (grid[ny][nx] === player) {
        consecutive++;
      } else if (grid[ny][nx] === Player.None) {
        openEnds++;
        break;
      } else {
        break; // Blocked
      }
      i++;
    }

    // Assign score based on pattern
    const totalStones = consecutive + 1; // +1 for the move being considered
    
    if (totalStones >= 5) score += weights[5];
    else if (totalStones === 4) {
      if (openEnds >= 2) score += weights.open4;
      else if (openEnds === 1) score += weights.closed4;
    } else if (totalStones === 3) {
      if (openEnds >= 2) score += weights.open3;
      else if (openEnds === 1) score += weights.closed3;
    } else if (totalStones === 2) {
      if (openEnds >= 2) score += weights.open2;
      else if (openEnds === 1) score += weights.closed2;
    }
  }

  // Central bias
  const center = Math.floor(BOARD_SIZE / 2);
  const dist = Math.abs(x - center) + Math.abs(y - center);
  score += (20 - dist); // Tiny preference for center

  return score;
};

export const getLocalAIMove = (grid: Player[][], aiPlayer: Player): Coordinate => {
  let bestScore = -Infinity;
  let bestMoves: Coordinate[] = [];
  const opponent = aiPlayer === Player.Black ? Player.White : Player.Black;

  // Optimization: Only consider moves near existing stones (unless board is empty)
  const candidateMoves: Coordinate[] = [];
  let hasStones = false;

  for(let y=0; y<BOARD_SIZE; y++) {
    for(let x=0; x<BOARD_SIZE; x++) {
      if(grid[y][x] !== Player.None) {
        hasStones = true;
        // Add neighbors to candidates
        for(let dy=-1; dy<=1; dy++){
          for(let dx=-1; dx<=1; dx++){
            if(dx===0 && dy===0) continue;
            const nx = x+dx;
            const ny = y+dy;
            if(nx >=0 && nx < BOARD_SIZE && ny >=0 && ny < BOARD_SIZE && grid[ny][nx] === Player.None) {
               // Avoid duplicates (simplistic check, better to use Set of strings)
               if(!candidateMoves.some(m => m.x === nx && m.y === ny)) {
                 candidateMoves.push({x: nx, y: ny});
               }
            }
          }
        }
      }
    }
  }

  if (!hasStones) {
    return { x: Math.floor(BOARD_SIZE/2), y: Math.floor(BOARD_SIZE/2) };
  }

  // If no neighbors found (shouldn't happen if hasStones), fallback to all empty
  const movesToEvaluate = candidateMoves.length > 0 ? candidateMoves : []; 
  // If fallback needed (rare)
  if(movesToEvaluate.length === 0) {
      for(let y=0; y<BOARD_SIZE; y++) {
          for(let x=0; x<BOARD_SIZE; x++) {
              if(grid[y][x] === Player.None) movesToEvaluate.push({x, y});
          }
      }
  }


  for (const move of movesToEvaluate) {
    const { x, y } = move;

    // Score for offense (AI makes this move)
    const offenseScore = evaluatePosition(grid, x, y, aiPlayer);
    
    // Score for defense (Opponent makes this move, how dangerous is it?)
    // We heavily weight blocking a win
    const defenseScore = evaluatePosition(grid, x, y, opponent);

    // Dynamic weighting: Blocking a win is critical, but winning yourself is better
    let totalScore = offenseScore + defenseScore;

    // Boost defense if opponent is about to win
    if (defenseScore >= 10000) totalScore += 5000; 
    
    // Boost offense if we can win
    if (offenseScore >= 100000) totalScore += 200000;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMoves = [move];
    } else if (totalScore === bestScore) {
      bestMoves.push(move);
    }
  }

  // Randomize among equal best moves to feel natural
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};
