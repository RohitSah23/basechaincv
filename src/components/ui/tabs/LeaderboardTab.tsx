"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Medal, Crown } from "lucide-react";

// --- Types ---
interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  score: number;
  reaction_time: number;
}

export function LeaderboardTab() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/score")
      .then(res => res.json())
      .then(json => {
         if(json.leaderboard) {
            setData(json.leaderboard);
         }
      })
      .catch(err => console.error("Leaderboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 dark:text-white/50 space-y-4">
        <div className="relative">
             <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary relative z-10"></div>
        </div>
        <p className="text-xs font-mono uppercase tracking-widest animate-pulse">Loading Scores...</p>
      </div>
    );
  }

  // Split top 3 and the rest
  const topThree = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div className="w-full max-w-xl mx-auto pb-24 px-6 min-h-[calc(100vh-140px)] flex flex-col items-center">
        {/* Header */}
        <div className="mb-8 text-center w-full">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Hall of Fame
          </h2>
          <p className="text-gray-500 dark:text-white/40 text-sm font-medium tracking-wide">Global Top Scorers</p>
        </div>

        {data.length === 0 ? (
          <div className="w-full text-center py-16 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl">
            <div className="w-16 h-16 mx-auto bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-gray-300 dark:text-white/20" />
            </div>
            <p className="text-gray-500 dark:text-white/60 font-medium">No champions yet.</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Be the first to claim the throne!</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-3 mb-8 items-end">
               {/* 2nd Place */}
               <div className="flex flex-col items-center order-1">
                   {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} />}
               </div>
               
               {/* 1st Place */}
               <div className="flex flex-col items-center -mt-8 relative z-10 order-2 w-full">
                   {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} />}
               </div>

               {/* 3rd Place */}
               <div className="flex flex-col items-center order-3">
                   {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} />}
               </div>
            </div>

            {/* The Rest List */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-3 pl-2 opacity-50">
                  <Medal className="h-3 w-3 text-gray-400 dark:text-white" />
                  <span className="text-xs font-bold text-gray-500 dark:text-white uppercase tracking-widest">Runner Ups</span>
               </div>
               
               {rest.map((entry) => (
                  <ListEntry key={entry.fid} entry={entry} />
               ))}
               
               {rest.length === 0 && topThree.length > 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-white/20 text-xs italic">
                      That&apos;s everyone so far!
                  </div>
               )}
            </div>
          </div>
        )}
    </div>
  );
}

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry, rank: number }) {
    const isFirst = rank === 1;
    const isSecond = rank === 2;

    const rankColor = isFirst ? "text-yellow-600 dark:text-yellow-400" : isSecond ? "text-gray-500 dark:text-gray-400" : "text-orange-500 dark:text-orange-400";
    const bgColor = isFirst ? "bg-yellow-50 dark:bg-yellow-500/10" : isSecond ? "bg-gray-50 dark:bg-white/5" : "bg-orange-50 dark:bg-orange-500/10";
    const borderColor = isFirst ? "border-yellow-200 dark:border-yellow-500/20" : isSecond ? "border-gray-200 dark:border-white/10" : "border-orange-200 dark:border-orange-500/20";
    
    return (
        <div className={`w-full flex flex-col items-center ${isFirst ? 'scale-110 origin-bottom' : ''}`}>
             <div className="relative mb-2">
                 <div className={`relative p-1 rounded-full border-2 ${borderColor} ${isFirst ? 'shadow-lg shadow-yellow-500/20' : ''}`}>
                    <img 
                      src={entry.pfp_url || `https://avatar.vercel.sh/${entry.username}`} 
                      alt={entry.username}
                      className="w-12 h-12 rounded-full bg-gray-100 dark:bg-black/50 object-cover"
                    />
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center w-5 h-5 rounded-full ${bgColor} border ${borderColor} text-[10px] font-bold ${rankColor}`}>
                        {rank}
                    </div>
                 </div>
                 {isFirst && <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-5 w-5 text-yellow-500 fill-yellow-500" />}
             </div>
             
             <div className={`w-full rounded-2xl p-3 text-center flex flex-col items-center ${bgColor} border ${borderColor}`}>
                 <div className="text-gray-900 dark:text-white font-bold text-xs truncate w-full mb-1">
                     {entry.display_name?.split(' ')[0] || entry.username}
                 </div>
                 <div className={`font-black text-lg ${rankColor}`}>
                     {entry.score}
                 </div>
                 <div className="text-[10px] text-gray-400 dark:text-white/30 font-mono">
                     {Math.floor(entry.reaction_time)}ms
                 </div>
             </div>
        </div>
    );
}

function ListEntry({ entry }: { entry: LeaderboardEntry }) {
    return (
        <div className="group relative p-3 rounded-xl flex items-center justify-between transition-all hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.99]">
              <div className="flex items-center gap-4">
                <div className="w-6 flex justify-center text-gray-400 dark:text-gray-600 font-mono font-bold text-xs">
                   #{entry.rank}
                </div>
                
                <img 
                    src={entry.pfp_url || `https://avatar.vercel.sh/${entry.username}`} 
                    alt="" 
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 object-cover" 
                />
                
                <div className="flex flex-col">
                   <span className="text-sm font-bold text-gray-900 dark:text-white">
                       {entry.display_name || entry.username}
                   </span>
                   <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                      ID: {entry.fid}
                   </span>
                </div>
              </div>

              <div className="text-right">
                  <div className="text-gray-900 dark:text-white font-bold text-base">
                      {entry.score}
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                      {Math.floor(entry.reaction_time)}ms
                  </div>
              </div>
        </div>
    );
}
