"use client";

import React, { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import { Flame, Trophy, Lock, CheckCircle2, Star, CalendarDays, TrendingUp, Calendar, Camera, Loader2, Activity } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type ScanData = {
  id: number;
  score: number;
  problems: any; // 🌟 FIX: Changed from flaws to problems
  created_at: string;
};

export default function ProgressMapPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [history, setHistory] = useState<ScanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }
    const fetchHistory = async () => {
      if (!user) return;
      try {
        // 🌟 FIX: Fetching from user_scans 🌟
        const { data, error } = await supabase
          .from("user_scans")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        if (data && !error) setHistory(data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (isLoaded && user) fetchHistory();
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#030306]">
         <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center px-4 text-center bg-[#030306]">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-zinc-900/50 p-10 shadow-2xl backdrop-blur-sm">
           <Camera className="mx-auto h-8 w-8 text-cyan-400 mb-6" />
           <h2 className="mb-2 text-2xl font-bold text-white">No Journey Started</h2>
           <p className="mb-8 text-sm text-zinc-400">Start your biometric scans to unlock your progress map.</p>
           <Link href="/" className="inline-block w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-bold text-black transition-transform hover:scale-105">
              Start Tracking Now
           </Link>
        </div>
      </div>
    );
  }

  const currentStreak = history.length; 
  const totalDays = 30;
  const chartData = history.map((scan, index) => ({
    name: `Day ${index + 1}`,
    dateStr: new Date(scan.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: Number(scan.score),
  }));

  const latestScore = chartData[chartData.length - 1].score;
  const scoreDiff = (latestScore - chartData[0].score).toFixed(2);
  const isImproved = Number(scoreDiff) >= 0;

  const milestones = [
    { id: 1, days: 3, title: "Bronze Glow", status: currentStreak >= 3 ? "unlocked" : "locked", color: "from-orange-500/20 to-red-500/5", border: "border-orange-500/30", iconColor: "text-orange-400" },
    { id: 2, days: 7, title: "Silver Radiance", status: currentStreak >= 7 ? "unlocked" : "locked", color: "from-zinc-400/20 to-zinc-600/5", border: "border-zinc-500/30", iconColor: "text-zinc-300" },
    { id: 3, days: 21, title: "Gold Symmetry", status: currentStreak >= 21 ? "unlocked" : "locked", color: "from-amber-400/20 to-yellow-600/5", border: "border-amber-500/30", iconColor: "text-amber-400" },
    { id: 4, days: 30, title: "Diamond Apex", status: currentStreak >= 30 ? "unlocked" : "locked", color: "from-cyan-400/20 to-blue-600/5", border: "border-cyan-500/30", iconColor: "text-cyan-400" },
  ];

  return (
    <div className="text-zinc-100 font-sans p-6 md:p-10 pb-20 w-full bg-[#030306] min-h-screen">
      
      {/* 🌟 শয়তান সাদা লাইন তাড়ানোর চূড়ান্ত ব্যবস্থা 🌟 */}
      <style>{`
        ::-webkit-scrollbar { width: 6px !important; }
        ::-webkit-scrollbar-track { background: #030306 !important; }
        ::-webkit-scrollbar-thumb { background: #18181b !important; border-radius: 10px !important; }
        ::-webkit-scrollbar-thumb:hover { background: #22d3ee !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px !important; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #22d3ee !important; }
      `}</style>

      <header className="flex items-center justify-between mb-10 max-w-5xl mx-auto">
        <div>
           <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Progress Map</h1>
           <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Biometric Evolution Tracker</p>
        </div>
        <UserButton />
      </header>

      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Streak Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600/20 via-red-950/40 to-zinc-950 p-8 rounded-[2.5rem] border border-orange-500/20 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                <h2 className="text-sm font-bold text-orange-400 uppercase tracking-widest">Active Streak</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-black text-white tracking-tighter">{currentStreak}</span>
                <span className="text-xl text-zinc-400 font-bold uppercase tracking-widest">Scans</span>
              </div>
            </div>
            <div className="relative flex items-center justify-center bg-black/40 p-4 rounded-full border border-white/5">
               <svg className="w-24 h-24 transform -rotate-90">
                   <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                   <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                     strokeDasharray={2 * Math.PI * 40}
                     strokeDashoffset={(2 * Math.PI * 40) - ((Math.min(currentStreak, totalDays) / totalDays) * (2 * Math.PI * 40))}
                     className="text-orange-500 transition-all duration-1500" 
                   />
               </svg>
               <div className="absolute font-black text-white">{Math.round((Math.min(currentStreak, totalDays)/totalDays)*100)}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Chart */}
           <div className="lg:col-span-2 bg-zinc-950/60 border border-white/5 rounded-[2rem] p-8">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Trajectory</h3>
               <span className={`text-[10px] px-3 py-1 rounded-full font-bold ${isImproved ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                 {isImproved ? "+" : ""}{scoreDiff} Total
               </span>
             </div>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorScoreLive" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                   <XAxis dataKey="dateStr" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                   <Tooltip contentStyle={{ backgroundColor: "#09090b", border: "1px solid #ffffff10", borderRadius: "16px" }} />
                   <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={4} fill="url(#colorScoreLive)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </div>

           {/* Badges */}
           <div className="grid grid-cols-2 gap-4 h-fit">
              {milestones.map((badge) => (
                <div key={badge.id} className={`relative rounded-2xl border p-4 flex flex-col items-center text-center ${badge.status === "unlocked" ? `${badge.color} ${badge.border}` : "bg-zinc-950 border-white/5 opacity-50 grayscale"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-black/50 border ${badge.status === "unlocked" ? badge.border : "border-white/5"}`}>
                     <Star className={`w-5 h-5 ${badge.status === "unlocked" ? badge.iconColor : "text-zinc-600"} ${badge.status === "unlocked" ? "fill-current" : ""}`} />
                  </div>
                  <h4 className="text-[10px] font-bold text-white leading-tight">{badge.title}</h4>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Journey */}
           <div className="bg-zinc-950/50 border border-white/5 p-8 rounded-[2.5rem]">
              <h3 className="text-base font-bold text-white mb-6">30-Day Journey</h3>
              <div className="grid grid-cols-6 gap-2">
                 {[...Array(totalDays)].map((_, i) => (
                   <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold ${i + 1 <= currentStreak ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-black/40 text-zinc-700 border border-white/5"}`}>
                     {i + 1 <= currentStreak ? <Flame className="w-4 h-4" /> : i + 1}
                   </div>
                 ))}
              </div>
           </div>

           {/* 🌟 হিস্ট্রি লগ 🌟 */}
           <div className="bg-zinc-950/60 border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">Scan Log</h3>
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {[...history].reverse().map((scan) => {
                    const date = new Date(scan.created_at);
                    
                    // 🌟 FIX: Safely parse 'problems' (JSONB or String) 🌟
                    let parsedProblems: string[] = [];
                    try {
                      if (Array.isArray(scan.problems)) {
                        parsedProblems = scan.problems;
                      } else if (typeof scan.problems === 'string') {
                        parsedProblems = JSON.parse(scan.problems);
                      }
                    } catch (e) {
                      parsedProblems = [];
                    }
                    
                    return (
                       <div key={scan.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                                   {date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                   {parsedProblems.map((problem: string, i: number) => (
                                      <span key={i} className="text-[8px] font-bold uppercase tracking-wider bg-cyan-400/10 text-cyan-400 px-2 py-1 rounded-md border border-cyan-400/20">
                                         {problem}
                                      </span>
                                   ))}
                                </div>
                             </div>
                             <span className="text-2xl font-black text-white">{scan.score}</span>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}