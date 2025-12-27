"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Trophy, Target, Zap, RotateCcw, Share2, Medal } from "lucide-react";

// --- Types ---
type GameState = "idle" | "waiting" | "ready" | "done";

interface ScoreEntry {
  score: number;
  time: number; // reaction time in ms
  date: number; // timestamp
}

interface LeaderboardData {
  topScores: ScoreEntry[]; // Max 10
  bestTime: number | null; // Min reaction time
}

// --- Constants & Config ---
const GRID_SIZE = 16;
const TARGET_EMOJI = "✅";
const DECOY_EMOJIS = ["❌", "🔥", "💣", "😂", "💀", "⚠️", "🍕", "🐍", "👀", "🧠", "👻", "😈"];
const BASE_SCORE_MAX = 1000;
const STREAK_BONUS = 100;

// --- Helper Functions ---
const getRandomDelay = () => Math.floor(Math.random() * (3500 - 1500 + 1) + 1500); // 1.5s - 3.5s

const generateGrid = (): string[] => {
  const grid = new Array(GRID_SIZE).fill(null);
  const targetIndex = Math.floor(Math.random() * GRID_SIZE);
  
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i === targetIndex) {
      grid[i] = TARGET_EMOJI;
    } else {
      const randomDecoy = DECOY_EMOJIS[Math.floor(Math.random() * DECOY_EMOJIS.length)];
      grid[i] = randomDecoy;
    }
  }
  return grid;
};

// --- Storage Logic ---
const STORAGE_KEY = "emoji_reaction_grid_data";

const loadLeaderboard = (): LeaderboardData => {
  if (typeof window === "undefined") return { topScores: [], bestTime: null };
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : { topScores: [], bestTime: null };
};

const saveLeaderboard = (data: LeaderboardData) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

export default function EmojiReactionGame() {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>("idle");
  const [grid, setGrid] = useState<string[]>(Array(GRID_SIZE).fill("❓"));
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({ topScores: [], bestTime: null });
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none");

  // --- Refs ---
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Load leaderboard on mount
    setLeaderboard(loadLeaderboard());
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // --- Game Loop Logic ---

  const startGame = useCallback(() => {
    setGameState("waiting");
    setFeedback("none");
    setGrid(Array(GRID_SIZE).fill("...")); // Loading/Waiting state visual
    // Keep streak and score if coming from a "correct" continue, but reset if it was a fail.
    // Actually, logic says: "Correct tap -> score + streak... Wrong tap -> instant fail".
    // So "startGame" is called initially or after a fail (new game) or after a success (next round).
    // Let's differentiate "nextRound" vs "newGame".
  }, []);

  const startNewGame = () => {
    setScore(0);
    setStreak(0);
    setLastReactionTime(null);
    nextRound();
  };

  const nextRound = () => {
    setGameState("waiting");
    setFeedback("none");
    // Show waiting state (maybe empty grid or spinners)
    setGrid(Array(GRID_SIZE).fill("⏳"));
    
    const delay = getRandomDelay();
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      const newGrid = generateGrid();
      setGrid(newGrid);
      setGameState("ready");
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleTap = (index: number) => {
    if (gameState !== "ready") return;

    const clickedEmoji = grid[index];
    const endTime = performance.now();
    const reactionTime = endTime - startTimeRef.current;
    
    if (clickedEmoji === TARGET_EMOJI) {
      // Correct!
      handleSuccess(reactionTime);
    } else {
      // Wrong!
      handleFail(reactionTime); // Fail time doesn't really matter for score, but maybe for stats
    }
  };

  const handleSuccess = (timeMs: number) => {
    // 1. Calculate Score
    // baseScore = max(0, 1000 - reactionTime)
    const baseScore = Math.max(0, 1000 - timeMs);
    // finalScore = baseScore + (streak * 100) -> Wait, user says "Correct tap -> streak + 1". 
    // Is score cumulative for a session? Or per round?
    // "Top scores stored locally". Usually "Score" implies total game score or max single-reaction score?
    // User says: "Correct tap -> score + streak... Result Conditions... Score calculated... Leaderboard updated".
    // And "Wrong tap -> instant fail... Round ends immediately... No score saved".
    // This implies the "Score" on the leaderboard is likely the "Single Round Score" OR the "Total Session Score before failing".
    // "Streak Bonus: finalScore = baseScore + (streak * 100)".
    // If it's a "Result shown" after EVERY correct tap, maybe it's just a reaction test tool.
    // BUT "Wrong tap -> Round ends... Streak resets".
    // Let's assume High Score is based on the *Score calculated for that specific tap*? Or the *Total Score accumulated in a streak*?
    // "Score calculated ... Leaderboard updated" on Correct Emoji.
    // If I tap 5 times, do I get 5 entries in leaderboard? Probably not efficient.
    // Maybe Leaderboard is for "Highest Single Tap Score" or "Longest Streak"?
    // User says "sorted by highest score".
    // Let's assume it's "Single Round Score" (Reaction + Streak Bonus). 
    // So a fast reaction with high streak = massive score.
    // Let's implement it that way.

    const newStreak = streak + 1;
    const finalRoundScore = Math.floor(baseScore + (newStreak * 100)); // Ensure integer

    setLastReactionTime(timeMs);
    setScore(finalRoundScore);
    setStreak(newStreak);
    setFeedback("correct");
    
    // Update Leaderboard
    updateLeaderboard(finalRoundScore, timeMs);

    // Auto-proceed or wait?
    // User: "Game States... done -> Result shown".
    // User: "Correct Emoji -> .. Streak increased .. Leaderboard updated".
    // User: "Wrong Emoji -> Round ends immediately .. Streak resets".
    // It seems like if correct, we might want to continue to keep the streak?
    // "idle -> waiting -> ready -> done" implies a single cycle?
    // But "Streak" implies multiple rounds.
    // So: Correct -> Show Result (briefly?) -> Waiting -> Ready...
    // Let's stick to: Correct -> Show Feedback -> Auto-Transition to Waiting (Next Round).
    // If Wrong -> Show Feedback -> Go to Idle/Game Over.

    setGameState("done"); 
    
    // Auto restart after correct match (to keep flow)
    timeoutRef.current = setTimeout(() => {
      nextRound();
    }, 1500); // 1.5s delay to see result
  };

  const handleFail = (_timeMs: number) => {
    setFeedback("wrong");
    setStreak(0); // Reset streak
    // Score not saved
    setGameState("done"); // Game Over
    // Don't auto-restart, let user reflect.
  };

  const updateLeaderboard = (newScore: number, timeMs: number) => {
    const currentData = loadLeaderboard();
    
    // Update Best Time
    const previousBest = currentData.bestTime || Infinity;
    const newBestTime = Math.min(previousBest, timeMs);

    // Update Scores
    const newEntry: ScoreEntry = { score: newScore, time: timeMs, date: Date.now() };
    const allScores = [...currentData.topScores, newEntry];
    // Sort desc by score
    allScores.sort((a, b) => b.score - a.score);
    // Keep top 10
    const top10 = allScores.slice(0, 10);

    const newData: LeaderboardData = {
      topScores: top10,
      bestTime: newBestTime === Infinity ? null : newBestTime
    };

    saveLeaderboard(newData);
    setLeaderboard(newData);
  };

  // --- Render Helpers ---
  const getCellClass = (emoji: string, index: number) => {
    // Base classes
    let classes = "aspect-square flex items-center justify-center text-2xl sm:text-4xl bg-white/10 dark:bg-black/20 rounded-xl cursor-pointer transition-all duration-100 select-none shadow-sm backdrop-blur-sm border border-white/10";
    
    // Active state
    if (gameState === "ready") {
      classes += " active:scale-95 hover:bg-white/20 dark:hover:bg-white/10";
    }

    // Feedback state
    if (gameState === "done") {
      if (emoji === TARGET_EMOJI && feedback === "correct") {
        classes += " bg-green-500/50 border-green-400 text-white animate-pulse scale-105";
      } else if (emoji !== TARGET_EMOJI && feedback === "wrong" && grid[index] === TARGET_EMOJI) {
         // Show where the correct one was if they missed
         classes += " bg-yellow-500/50 border-yellow-400 opacity-80";
      } else if (feedback === "wrong" && grid[index] !== TARGET_EMOJI) {
        // If they clicked this one and it was wrong... simpler logic: just highlight clicked? 
        // We don't track clicked index in state easily unless we add it. 
        // For now, assume global "wrong" feedback turns whole grid red or something?
        // Let's just keep it simple.
      }
    }

    return classes;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center">
      {/* Header / HUD */}
      <div className="w-full flex justify-between items-center mb-6 p-4 bg-white/50 dark:bg-black/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/20">
        <div className="flex flex-col items-start">
           <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Streak</span>
           <div className="flex items-center gap-2 text-2xl font-bold text-orange-500">
             <Zap className="h-6 w-6 fill-current" />
             {streak}
           </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Score</span>
           <div className="flex items-center gap-2 text-2xl font-bold text-blue-500">
             <Trophy className="h-6 w-6 fill-current" />
             {score}
           </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative mb-8">
        <div className={`grid grid-cols-4 gap-3 transition-opacity duration-300 ${gameState === "waiting" ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {grid.map((emoji, index) => (
            <div
              key={index}
              onPointerDown={() => handleTap(index)}
              className={getCellClass(emoji, index)}
            >
              {gameState === "waiting" ? "❓" : emoji}
            </div>
          ))}
        </div>

        {/* Overlays */}
        {gameState === "idle" && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl z-10 p-6 text-center">
             <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Emoji Reaction</h2>
             <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs">Tap <span className="text-2xl align-middle">✅</span> as fast as you can. Avoid the decoys!</p>
             <button 
               onClick={startNewGame}
               className="px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2"
             >
               <Target className="h-5 w-5" /> Start Game
             </button>
           </div>
        )}

        {gameState === "done" && feedback === "wrong" && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-sm rounded-2xl z-10 animate-in fade-in zoom-in duration-200">
             <div className="text-6xl mb-4">💀</div>
             <h3 className="text-2xl font-bold text-white mb-2">Game Over!</h3>
             <p className="text-white/80 mb-6">Streak Broken</p>
             <button 
               onClick={startNewGame}
               className="px-6 py-2 bg-white text-red-600 font-bold rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
             >
               <RotateCcw className="h-4 w-4" /> Try Again
             </button>
           </div>
        )}
        
        {/* Waiting State Overlay for "Get Ready" effect if desired, but opacity handle is decent */}
      </div>

      {/* Stats / Leaderboard */}
      <div className="w-full bg-white/50 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/20">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <Medal className="h-4 w-4" /> Top Scores
        </h3>
        
        {/* Best Time */}
        {leaderboard.bestTime && (
            <div className="mb-4 flex justify-between items-center bg-green-100/50 dark:bg-green-900/20 p-2 rounded-lg">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">⚡ Best Reaction</span>
                <span className="text-base font-bold text-green-700 dark:text-green-300">{Math.floor(leaderboard.bestTime)}ms</span>
            </div>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {leaderboard.topScores.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No scores yet. Be the first!</p>
          ) : (
            leaderboard.topScores.map((entry, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-white/40 dark:hover:bg-white/5 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-800' : i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{Math.floor(entry.time)}ms</span>
                </div>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{entry.score} pts</span>
              </div>
            ))
          )}
        </div>
      </div>
      
      <p className="mt-8 text-xs text-gray-400 text-center">
        Tap the <span className="font-bold text-gray-500">{TARGET_EMOJI}</span>. Ignore the decoys. <br/> Faster reaction = Higher score!
      </p>
    </div>
  );
}
