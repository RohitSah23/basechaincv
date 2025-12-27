"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Medal, Timer, Calendar } from "lucide-react";

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
         console.log("Leaderboard data:", json);
         if(json.leaderboard) {
            setData(json.leaderboard);
         }
      })
      .catch(err => console.error("Leaderboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-white/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto pb-4 px-4 min-h-[calc(100vh-140px)]">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
          Global Ranking
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Top Players by Score</p>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
            <Trophy className="h-12 w-12 mx-auto text-gray-600 mb-3 opacity-50" />
            <p className="text-gray-500">No records yet.</p>
            <p className="text-xs text-gray-600 mt-1">Play a game to set a score!</p>
          </div>
        ) : (
          data.map((entry, index) => (
            <div 
              key={index}
              className={`
                relative p-4 rounded-xl border flex items-center justify-between transition-all
                ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 shadow-yellow-500/10 shadow-lg' : 
                  index === 1 ? 'bg-white/5 border-white/10' : 
                  index === 2 ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent hover:bg-white/5'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm
                  ${index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/50' : 
                    index === 1 ? 'bg-gray-300 text-gray-800' : 
                    index === 2 ? 'bg-orange-400 text-orange-900' : 'text-gray-500 bg-white/5'}
                `}>
                  #{entry.rank}
                </div>

                {entry.pfp_url && (
                  <img src={entry.pfp_url} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                )}
                
                <div>
                  <div className="font-bold text-md text-white/90">
                    {entry.display_name || entry.username}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-wide">
                    <span className="font-mono">FID: {entry.fid}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" /> {Math.floor(entry.reaction_time)}ms
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                  <div className="font-black text-lg text-emerald-400">{entry.score}</div>
                  <div className="text-[10px] text-white/30">PTS</div>
              </div>

              {index === 0 && <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-lg absolute top-2 right-2 opacity-20" fill="currentColor" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
