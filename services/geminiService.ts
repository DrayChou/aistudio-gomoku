import { GoogleGenAI, Type } from "@google/genai";
import { Player, Coordinate, GeminiMoveResponse } from '../types';
import { BOARD_SIZE } from './gameLogic';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Convert grid to a readable format for the LLM
const gridToString = (grid: Player[][]): string => {
  let s = "";
  // Add column headers for clarity (A-O)
  s += "   " + Array.from({length: BOARD_SIZE}, (_, i) => String.fromCharCode(65 + i)).join(" ") + "\n";
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    s += (y + 1).toString().padStart(2, ' ') + " ";
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = grid[y][x];
      if (cell === Player.None) s += ". ";
      else if (cell === Player.Black) s += "X "; // Black
      else if (cell === Player.White) s += "O "; // White
    }
    s += "\n";
  }
  return s;
};

export const getGeminiMove = async (
  grid: Player[][], 
  aiPlayer: Player,
  difficulty: string
): Promise<GeminiMoveResponse | null> => {
  const client = getClient();
  if (!client) return null;

  const playerSymbol = aiPlayer === Player.Black ? "X (Black)" : "O (White)";
  const opponentSymbol = aiPlayer === Player.Black ? "O (White)" : "X (Black)";
  const boardStr = gridToString(grid);

  const prompt = `
    You are a Gomoku (Five-in-a-Row) Grandmaster. 
    The board size is 15x15.
    
    Current Board State:
    ${boardStr}
    
    You are playing as ${playerSymbol}.
    Your opponent is ${opponentSymbol}.
    
    Task: Analyze the board and determine the absolute best coordinate for your next move.
    
    Strategy:
    1. Look for immediate wins (5 in a row).
    2. Block opponent's immediate wins.
    3. Look for "Open 4" or "Double 3" attacks.
    4. Control the center if opening.
    
    Return a JSON object strictly adhering to this schema.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.INTEGER, description: "X coordinate (0-14, corresponding to Columns A-O)" },
            y: { type: Type.INTEGER, description: "Y coordinate (0-14, corresponding to Rows 1-15)" },
            reasoning: { type: Type.STRING, description: "Short strategic explanation for the move." },
          },
          required: ["x", "y", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as GeminiMoveResponse;
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};