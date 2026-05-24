"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { 
  Sparkles, 
  Leaf, 
  Sun, 
  Clock, 
  Info, 
  Droplets,
  CheckCircle2,
  ChevronDown 
} from "lucide-react";

// 🌟 Supabase Setup 🌟
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function NaturalRoutinePage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [masterPlan, setMasterPlan] = useState<any>(null);
  const [localAiRoutine, setLocalAiRoutine] = useState<any>(null); 
  const [expandedRoutineItem, setExpandedRoutineItem] = useState<number | null>(null); 

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      try {
        const { data: masterData } = await supabase
          .from("master_glow_plans")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (masterData) setMasterPlan(masterData);

        // 🚨 MAGIC FIX: Changed from 'user_scans' to 'daily_scans' 🚨
        const { data: scanData } = await supabase
          .from("daily_scans")
          .select("analysis_result")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        let aiRoutine = null;

        if (scanData && scanData.length > 0 && scanData[0].analysis_result) {
           try {
              const parsedScan = JSON.parse(scanData[0].analysis_result);
              if (parsedScan.routine) aiRoutine = parsedScan.routine;
           } catch(e) {}
        }

        if (!aiRoutine) {
            const savedAnalysis = localStorage.getItem("glow_analysis");
            if (savedAnalysis) {
                try {
                    const parsedLocal = JSON.parse(savedAnalysis);
                    if (parsedLocal.routine) aiRoutine = parsedLocal.routine;
                    else if (parsedLocal.raw) {
                        let cleanText = parsedLocal.raw.replace(/[\`]{3}json/gi, "").replace(/[\`]{3}/g, "").trim();
                        const parsedRaw = JSON.parse(cleanText);
                        if (parsedRaw.routine) aiRoutine = parsedRaw.routine;
                    }
                } catch(e) {}
            }
        }

        if (aiRoutine) setLocalAiRoutine(aiRoutine);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const toggleExpand = (index: number) => {
    setExpandedRoutineItem(expandedRoutineItem === index ? null : index);
  };

  // 🌟 AI-এর অরিজিনাল রুটিন থেকে Preparation Steps খুঁজে বের করার স্মার্ট লজিক 🌟
  const getRealPreparationSteps = (item: any) => {
    let dbSteps = item.preparation || item.steps || item.preparation_steps || item.instructions;
    if (Array.isArray(dbSteps) && dbSteps.length > 0) return dbSteps;
    if (typeof dbSteps === 'string') return dbSteps.split('\n').filter((s: string) => s.trim() !== '');

    if (localAiRoutine) {
        const stepLower = item.step?.toLowerCase() || item.time?.toLowerCase() || item.product_type?.toLowerCase() || "";
        
        if (stepLower.includes("morning") || stepLower.includes("am")) {
           if (localAiRoutine.morning?.steps) return localAiRoutine.morning.steps;
           if (Array.isArray(localAiRoutine.morning)) return localAiRoutine.morning;
        }
        if (stepLower.includes("afternoon") || stepLower.includes("mid")) {
           if (localAiRoutine.afternoon?.steps) return localAiRoutine.afternoon.steps;
        }
        if (stepLower.includes("night") || stepLower.includes("pm")) {
           if (localAiRoutine.night?.steps) return localAiRoutine.night.steps;
           if (Array.isArray(localAiRoutine.night)) return localAiRoutine.night;
        }
    }

    return [
        "AI is currently finalizing the exact measurements for this ingredient.",
        "Please follow standard natural application methods in the meantime."
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030306] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!masterPlan) {
    return (
      <div className="min-h-screen bg-[#030306] flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">No Routine Found</h2>
        <p className="text-zinc-400 mt-2">Please scan your face first to generate your 30-Day Natural Protocol.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030306] text-zinc-100 p-6 md:p-10 pb-24 font-sans selection:bg-emerald-500/30">
      
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
            <Leaf className="w-64 h-64 rotate-12" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3" /> Scientifically Curated Natural Plan
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">
                THE GLOW <span className="text-emerald-500">ROUTINE</span>
              </h1>
              <p className="text-zinc-500 max-w-xl text-sm md:text-base leading-relaxed">
                Your bespoke 30-day aesthetic blueprint, generated by AI using 100% organic and homemade ingredients.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] print:hidden"
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Left Column: Natural Cosmetics */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sun className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Skin Care Ritual</h2>
            </div>

            <div className="space-y-6">
              {masterPlan.cosmetic_routine?.map((item: any, idx: number) => {
                
                // 🌟 আসল AI স্টেপস বের করা হচ্ছে 🌟
                const finalSteps = getRealPreparationSteps(item);

                return (
                  <div key={idx} className="group bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 transition-all hover:bg-zinc-900/50 hover:border-emerald-500/30 print:break-inside-avoid">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{item.step || "Step"}</span>
                        <h3 className="text-2xl font-bold text-white leading-tight pr-4">{item.product_type || item.title || "Natural Remedy"}</h3>
                      </div>
                      <span className="text-4xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors italic">0{idx + 1}</span>
                    </div>

                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                      {item.reason || item.description || "Helps rejuvenate and repair skin naturally."}
                    </p>

                    {/* Preparation Steps Button */}
                    {finalSteps && finalSteps.length > 0 && (
                      <>
                        <button
                          onClick={() => toggleExpand(idx)}
                          className="w-full py-4 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-all print:hidden mt-2"
                        >
                          <span>PREPARATION STEPS</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedRoutineItem === idx ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div
                          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${
                            expandedRoutineItem === idx ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <ul className="text-sm text-zinc-300 space-y-3 pl-2 border-t border-white/10 pt-4">
                            {finalSteps.map((step: string, sIdx: number) => (
                              <li key={sIdx} className="flex items-start gap-3 leading-relaxed">
                                <span className="text-emerald-500 mt-0.5">•</span> 
                                <span>{step.replace(/^- /, '').replace(/^• /, '')}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Healing Diet Plan */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Droplets className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Healing Diet Plan</h2>
            </div>

            <div className="space-y-6">
              {masterPlan.diet_plan?.map((item: any, idx: number) => (
                <div key={idx} className="group bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 transition-all hover:bg-zinc-900/50 hover:border-cyan-500/30 print:break-inside-avoid">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-cyan-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.time || "Daily"}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white leading-tight pr-4">{item.food || "Healthy Meal"}</h3>
                    </div>
                    <span className="text-4xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors italic">0{idx + 1}</span>
                  </div>

                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {item.benefit || "Improves overall skin health from within."}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 rounded-[2rem] p-8 mt-10 print:break-inside-avoid">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Pro Tip</span>
              </div>
              <p className="text-sm text-emerald-100/80 leading-relaxed italic">
                "Consistency is the key to natural healing. Natural ingredients take 14-21 days to show visible cellular changes. Trust the process."
              </p>
            </div>
          </div>

        </div>

        {/* Legal Disclaimer */}
        <div className="mt-20 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4 print:break-inside-avoid">
          <Info className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Medical Disclaimer</p>
            <p className="text-[11px] text-amber-200/60 leading-relaxed">
              The routines and diet plans provided by GlowryAI are strictly based on natural, homemade remedies and are for informational purposes only. This app does not provide medical advice, diagnosis, or treatment. Always consult with a qualified dermatologist or healthcare provider before starting any new skincare or dietary regimen, especially if you have pre-existing conditions or allergies.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}