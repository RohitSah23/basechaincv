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
const GRID_SIZE = 16;
const TARGET_EMOJI = "✅";
const DECOY_EMOJIS = ["❌", "🔥", "💣", "😂", "💀", "⚠️", "🍕", "🐍", "👀", "🧠", "👻", "😈"];
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
    setGrid(Array(GRID_SIZE).fill("")); // Clean visuals during wait
    
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
    
    // We only track "Session Runs" locally for now in this view? 
    // Actually let's keep the leaderboard component below powered by the API or local?
    // User wants "in leaderboard we show rank fid points". 
    // The component below is "Top Reactions". Let's keep it local for instant feedback
    // but the MAIN leaderboard tab is global.
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
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none bg-zinc-900/50 p-6 rounded-[40px] border border-white/5 shadow-2xl backdrop-blur-3xl">
      
      {/* 1. Glass HUD */}
      <div className="w-full grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-lg">
           <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Current Streak</span>
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-yellow-400 to-orange-500 font-mono">
                {streak}
              </span>
           </div>
           <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-yellow-400/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
             <Zap className="h-5 w-5 text-yellow-400" fill="currentColor" />
           </div>
        </div>

        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-lg">
           <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Last Score</span>
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-blue-500 font-mono">
                {score}
              </span>
           </div>
           <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 flex items-center justify-center border border-blue-500/30">
             <Trophy className="h-5 w-5 text-cyan-400" fill="currentColor" />
           </div>
        </div>
      </div>

      {/* 2. The Game Grid */}
      <div className="relative w-full max-w-[360px] aspect-square">
        {/* Waiting State Pulse */}
        {gameState === "waiting" && (
           <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-24 h-24 bg-white/5 rounded-full animate-ping opacity-20"></div>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md animate-pulse">
                <Timer className="h-6 w-6 text-white/50" />
              </div>
           </div>
        )}

        {/* Start Overlay */}
        {gameState === "idle" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center">
              <div className="mb-6 relative">
                 <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
                 <Target className="h-16 w-16 text-blue-400 relative z-10" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Base Catch</h1>
              <p className="text-white/60 text-sm mb-8 font-medium">Tap <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{TARGET_EMOJI}</span> instantly.</p>
              
              <button 
                onClick={startNewGame}
                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-2xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                   PLAY NOW <Zap className="h-4 w-4 fill-black" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
        )}

        {/* Game Over Overlay */}
        {gameState === "done" && feedback === "wrong" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-xl rounded-3xl p-6 border border-red-500/20 text-center animate-in zoom-in-95 duration-200">
               <div className="text-6xl mb-4 animate-bounce">💀</div>
               <h2 className="text-3xl font-black text-rose-500 mb-1">FAIL!</h2>
               <p className="text-rose-200/60 font-medium mb-6">Wrong emoji tapped</p>
               
               <button 
                 onClick={startNewGame}
                 className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-colors flex items-center gap-2 shadow-lg shadow-rose-900/50"
               >
                 <RotateCcw className="h-4 w-4" /> Try Again
               </button>
            </div>
        )}

        {/* Grid Cells */}
        <div className={`grid grid-cols-4 gap-3 w-full h-full transition-all duration-500 ${gameState === "waiting" ? "scale-95 opacity-50 blur-[2px]" : "scale-100 opacity-100 blur-0"}`}>
          {grid.map((emoji, idx) => {
            const isTarget = emoji === TARGET_EMOJI;
            const isCorrect = feedback === "correct" && isTarget;
            // Only dim if feedback is showing and this isn't the one
            const isDimmed = feedback !== "none" && !isTarget;

            return (
              <div
                key={idx}
                onPointerDown={() => handleTap(idx)}
                className={`
                  relative rounded-2xl flex items-center justify-center text-3xl sm:text-4xl
                  transition-all duration-200 cursor-pointer
                  border border-white/5 shadow-sm
                  ${gameState === "ready" ? "hover:scale-[1.02] active:scale-95 bg-white/5 dark:bg-white/5 hover:bg-white/10" : ""}
                  ${gameState === "waiting" ? "bg-transparent border-transparent" : ""}
                  ${isCorrect ? "bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] scale-110 z-10" : ""}
                  ${isDimmed ? "opacity-30 scale-90 grayscale" : ""}
                `}
              >
                  {gameState !== "waiting" && emoji}
                  
                  {/* Burst effect on success */}
                  {isCorrect && (
                    <div className="absolute inset-0 rounded-2xl animate-ping bg-emerald-400 opacity-20 duration-500"></div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Leaderboard Card */}
      <div className="w-full mt-10 p-1">
        <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
           <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                 <Medal className="h-4 w-4 text-purple-400" />
                 <span className="text-xs font-bold uppercase tracking-wider">Top Reactions</span>
              </div>
              {leaderboard.bestTime && (
                <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                   BEST: {Math.floor(leaderboard.bestTime)}MS
                </div>
              )}
           </div>

           <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
              {leaderboard.topScores.length === 0 ? (
                 <div className="p-8 text-center text-white/20 text-sm">
                    No scores yet. <br/> Be the first legend!
                 </div>
              ) : (
                <table className="w-full text-left text-sm">
                   <tbody className="divide-y divide-white/5">
                      {leaderboard.topScores.map((entry, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                           <td className="py-3 px-4 w-12 text-center font-mono text-white/30 text-xs">
                             #{i+1}
                           </td>
                           <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white/90">{entry.score}</span>
                                <span className="text-[10px] bg-white/10 px-1 rounded text-white/50">PTS</span>
                              </div>
                           </td>
                           <td className="py-3 px-4 text-right text-white/50 font-mono text-xs">
                              {Math.floor(entry.time)}ms
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>
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
