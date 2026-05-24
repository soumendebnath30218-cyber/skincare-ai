"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Sparkles, Activity, Leaf, Droplets, Target, ShieldCheck, Clock, Info } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function GlowProtocolPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [masterPlan, setMasterPlan] = useState<any>(null);
  const [latestScan, setLatestScan] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchProtocolData() {
      try {
        const { data: masterData } = await supabase
          .from("master_glow_plans")
          .select("*")
          .eq("user_id", userId)
          .single();

        const { data: dailyData } = await supabase
          .from("daily_scans")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (masterData) setMasterPlan(masterData);
        if (dailyData && dailyData.length > 0) setLatestScan(dailyData[0]);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProtocolData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030306] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!masterPlan) {
    return (
      <div className="min-h-screen bg-[#030306] flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">No Protocol Found</h2>
        <p className="text-zinc-400 mt-2">Please go to the scanner and complete your first scan to unlock your Natural Glow Protocol.</p>
      </div>
    );
  }

  // 🌟 Parsing Daily Analysis Data 🌟
  let todayProblems = [];
  
  try {
    const parsedAnalysis = JSON.parse(latestScan?.analysis_result || "{}");
    todayProblems = parsedAnalysis.issues || ["Data sync pending..."];
  } catch {
    todayProblems = ["Data sync pending..."];
  }

  if (!Array.isArray(todayProblems)) {
    todayProblems = ["Data format error, please scan again."];
  }

  return (
    <div className="min-h-screen bg-[#030306] text-zinc-100 p-6 md:p-10 pb-24 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10 space-y-8 mt-5">
        
        <header className="text-center space-y-2 mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest flex items-center justify-center gap-3">
            <Sparkles className="text-emerald-400 w-8 h-8" />
            Daily Analysis
          </h1>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-[0.3em]">100% Natural & Homemade Routine</p>
        </header>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
          
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Daily Tracking Report
          </h2>

          <div className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2">Yesterday vs Today</h3>
              <p className="text-sm text-emerald-100 font-medium leading-relaxed">
                {latestScan?.improvement_status || "Establishing your baseline scan..."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Today's Focus
                </h3>
                <ul className="space-y-3">
                  {todayProblems?.map((problem: string, idx: number) => (
                    <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                      <span className="text-rose-500 mt-1">•</span> {problem}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> TODAY'S EXTRA CARE
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Stick strictly to your 30-Day Natural Protocol below. Hydration and natural ingredients are your primary goals for today.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-center mb-6">
            The 30-Day Master Plan
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 relative group hover:border-emerald-500/50 transition-colors">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-400" /> Natural Skin Care
              </h3>
              <div className="space-y-4">
                
                {masterPlan.cosmetic_routine?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                    <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-1 pl-2">{item.step || "Step"}</p>
                    <p className="text-lg font-semibold text-zinc-100 pl-2">
                        {item.product_type || item.title || "Natural Remedy"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-2 pl-2 leading-relaxed">{item.reason}</p>
                  </div>
                ))}

              </div>
            </div>

            <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 relative group hover:border-cyan-500/50 transition-colors">
              <div className="absolute inset-0 bg-cyan-500/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" /> Healing Diet
              </h3>
              <div className="space-y-4">
                {masterPlan.diet_plan?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50"></div>
                    <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest mb-1 flex items-center gap-1 pl-2">
                      <Clock className="w-3 h-3" /> {item.time || "Daily"}
                    </p>
                    <p className="text-lg font-semibold text-zinc-100 pl-2">{item.food || "Healthy Meal"}</p>
                    <p className="text-xs text-zinc-400 mt-2 pl-2 leading-relaxed">{item.benefit}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-12 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
           <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
           <p className="text-xs text-amber-200/80 leading-relaxed">
             <strong>Disclaimer:</strong> The routines and diet plans provided by GlowryAI are strictly based on natural, homemade remedies and are for informational purposes only. This app does not provide medical advice. Always consult with a qualified dermatologist or healthcare provider before starting any new regimen.
           </p>
        </div>

      </div>
    </div>
  );
}