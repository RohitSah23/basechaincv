"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMiniApp } from "@neynar/react";
import { Zap, Trophy, Timer, RotateCcw, Medal, Target } from "lucide-react";

// --- Types ---
type GameState = "idle" | "waiting" | "ready" | "done";

interface ScoreEntry {
  score: number;
  time: number;
  date: number;
}

interface LeaderboardData {
  topScores: ScoreEntry[];
  bestTime: number | null;
}

// --- Constants ---
const GRID_SIZE = 25;
const TARGET_EMOJI = "✅";
const DECOY_EMOJIS = ["❌", "🔥", "💣", "💀", "🍕", "🐍", "👀", "🧠", "👻", "😈", "💎", "🚀", "🍆"];
const STORAGE_KEY = "emoji_reaction_grid_data";

// --- Helpers ---
const getRandomDelay = () => Math.floor(Math.random() * (3500 - 1500 + 1) + 1500);

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
  const [gameState, setGameState] = useState<GameState>("idle");
  const [grid, setGrid] = useState<string[]>(Array(GRID_SIZE).fill("❓"));
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({ topScores: [], bestTime: null });
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none");
  const [targetIndex, setTargetIndex] = useState<number>(-1);

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLeaderboard(loadLeaderboard());
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startNewGame = () => {
    setScore(0);
    setStreak(0);
    setGameState("waiting");
    nextRound();
  };

  const nextRound = useCallback(() => {
    setGameState("waiting");
    setFeedback("none");
    setGrid(Array(GRID_SIZE).fill("?")); // Show ? during wait
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    const delay = getRandomDelay();
    
    timeoutRef.current = setTimeout(() => {
      const newGrid = generateGrid();
      const newTargetIndex = newGrid.indexOf(TARGET_EMOJI);
      setGrid(newGrid);
      setTargetIndex(newTargetIndex);
      setGameState("ready");
      startTimeRef.current = performance.now();
    }, delay);
  }, []);

  const handleTap = (index: number) => {
    if (gameState !== "ready") return;

    const reactionTime = performance.now() - startTimeRef.current;
    
    if (grid[index] === TARGET_EMOJI) {
      handleSuccess(reactionTime);
    } else {
      handleFail();
    }
  };

  const { context } = useMiniApp();

  const handleSuccess = (timeMs: number) => {
    const baseScore = Math.max(0, 1000 - timeMs);
    const newStreak = streak + 1;
    const roundScore = Math.floor(baseScore + (newStreak * 100));

    setScore((prev) => {
       const newTotal = prev + roundScore;
       
       // Submit to API
       if (context?.user) {
         fetch("/api/score", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ 
             fid: context.user.fid, 
             score: newTotal, 
             time: timeMs 
           }),
         }).catch(err => console.error("Score submit failed", err));
       }
       
       return newTotal;
    });

    setStreak(newStreak);
    setFeedback("correct");
    setGameState("done"); 

    // Update Local Leaderboard for visual consistency immediately
    const currentData = loadLeaderboard();
    const newBestTime = Math.min(currentData.bestTime || Infinity, timeMs);
    
    const newEntry: ScoreEntry = { score: roundScore, time: timeMs, date: Date.now() };
    const allScores = [...currentData.topScores, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    
    const newData = { topScores: allScores, bestTime: newBestTime };
    saveLeaderboard(newData);
    setLeaderboard(newData);

    timeoutRef.current = setTimeout(nextRound, 1200);
  };

  const handleFail = () => {
    setFeedback("wrong");
    setStreak(0);
    setGameState("done");
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none">
      
      {/* 1. Minimal HUD */}
      <div className="w-full flex items-center justify-between px-4 mb-8">
         <div className="flex flex-col items-start">
             <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 mb-1">Streak</span>
             <div className="flex items-center gap-2">
                 <Zap className="h-4 w-4 text-orange-500" fill="currentColor" />
                 <span className="text-3xl font-black text-gray-900 dark:text-white font-mono leading-none">{streak}</span>
             </div>
         </div>

         <div className="flex flex-col items-end">
             <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 mb-1">Score</span>
             <div className="flex items-center gap-2">
                 <span className="text-3xl font-black text-gray-900 dark:text-white font-mono leading-none">{score}</span>
                 <Trophy className="h-4 w-4 text-blue-500" fill="currentColor" />
             </div>
         </div>
      </div>

      {/* 2. The Game Grid */}
      <div className="relative w-full max-w-[360px] aspect-square">
        
  

        {/* Game Over Overlay */}
        {gameState === "done" && feedback === "wrong" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-black/80 backdrop-blur-xl rounded-[30px] p-6 border border-red-100 dark:border-red-500/30 text-center animate-in zoom-in-95 duration-200">
               <div className="text-7xl mb-6 animate-bounce drop-shadow-md">💀</div>
               <h2 className="text-4xl font-black text-rose-600 dark:text-rose-500 mb-1 tracking-tight">GAME OVER</h2>
               <p className="text-rose-900/60 dark:text-rose-200/60 font-medium mb-8">Reflexes too slow!</p>
               
               <button 
                 onClick={startNewGame}
                 className="px-8 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-500 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-rose-500/40"
               >
                 <RotateCcw className="h-5 w-5" /> Try Again
               </button>
            </div>
        )}

        {/* Grid Cells */}
        <div className={`grid grid-cols-5 gap-3 w-full h-full p-2 transition-all duration-500 ${gameState === "waiting" ? "scale-95 opacity-50 blur-[2px]" : "scale-100 opacity-100 blur-0"}`}>
          {grid.map((emoji, idx) => {
            const isTarget = emoji === TARGET_EMOJI;
            const isCorrect = feedback === "correct" && isTarget;
            const isDimmed = feedback !== "none" && !isTarget;

            return (
              <div
                key={idx}
                onPointerDown={() => handleTap(idx)}
                className={`
                  relative rounded-2xl flex items-center justify-center text-3xl sm:text-4xl
                  transition-all duration-150 cursor-pointer select-none
                  border shadow-sm
                  bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5
                  ${gameState === "ready" ? "hover:scale-[1.05] active:scale-95 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md" : ""}
                  ${gameState === "idle" ? "bg-transparent border-transparent" : ""}
                  ${isCorrect ? "!bg-emerald-100 dark:!bg-emerald-500/20 !border-emerald-500 text-emerald-100 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] scale-110 z-10" : ""}
                  ${isDimmed ? "opacity-20 scale-90 blur-[1px] grayscale" : ""}
                `}
              >
                  <span className={`drop-shadow-sm filter font-bold ${gameState === "waiting" ? "animate-pulse text-indigo-500 dark:text-blue-400" : ""}`}>
                     {emoji}
                  </span>
                  
                  {/* Burst effect on success */}
                  {isCorrect && (
                    <>
                        <div className="absolute inset-0 rounded-2xl animate-ping bg-emerald-400 opacity-20 duration-500"></div>
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400 opacity-50 animate-pulse"></div>
                    </>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Button - Moved Below */}
      {gameState === "idle" && (
         <div className="mt-4 animate-in slide-in-from-top-4 duration-500">
             <button 
               onClick={startNewGame}
               className="group flex items-center gap-3 px-6 py-2 bg-primary dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl hover:shadow-gray-500/20 dark:hover:shadow-white/20"
             >
               <span>Let's Catch Now</span>
               <span className="bg-white/20 dark:bg-black/10 rounded-lg p-1">
                  <Zap className="h-4 w-4 fill-current" />
               </span>
             </button>
         </div>
      )}
      
      {/* 3. Session Best (Minimalist List) */}
      <div className="w-full mt-12 max-w-[320px]">
         <div className="flex items-center justify-between mb-4 px-2">
             <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Session Best (Top 10)</span>
             {leaderboard.bestTime && (
                <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                   PB: {Math.floor(leaderboard.bestTime)}ms
                </span>
             )}
         </div>

         <div className="flex flex-col gap-2">
             {leaderboard.topScores.length === 0 ? (
                 <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                    <span className="text-xs text-gray-300 dark:text-gray-700">No games played yet</span>
                 </div>
             ) : (
                leaderboard.topScores.slice(0, 10).map((entry, i) => (
                   <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                       <div className="flex items-center gap-3">
                           <span className={`
                              text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full
                              ${i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500 dark:text-black' : 
                                i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-white dark:text-black' : 
                                i === 2 ? 'bg-orange-50 text-orange-600 dark:bg-orange-600 dark:text-black' : 
                                'bg-gray-50 text-gray-400 dark:bg-white/10 dark:text-white/50'}
                           `}>
                              {i + 1}
                           </span>
                           <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                              {entry.score} <span className="text-[10px] text-gray-400 dark:text-white/40 font-normal ml-0.5">XP</span>
                           </span>
                       </div>
                       <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                           {Math.floor(entry.time)}ms
                       </span>
                   </div>
                ))
             )}
         </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
