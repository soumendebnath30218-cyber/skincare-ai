"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { ExternalLink, Moon, Sun, ShieldCheck, Info, Loader2, Camera } from "lucide-react";
import Link from "next/link";

// 🌟 Supabase কানেকশন 🌟
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type RoutineItem = {
  step: string;
  name: string;
  ingredient: string;
  purpose: string;
  link: string;
};

export default function GlowProtocolPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [flaws, setFlaws] = useState<string[]>([]);
  const [amRoutine, setAmRoutine] = useState<RoutineItem[]>([]);
  const [pmRoutine, setPmRoutine] = useState<RoutineItem[]>([]);

  useEffect(() => {
    const fetchUserFlaws = async () => {
      if (!user) return;
      try {
        // 🌟 FIX: Fetching from user_scans, requesting 'problems', and removed .single() 🌟
        const { data: dbData, error } = await supabase
          .from("user_scans")
          .select("problems")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (dbData && dbData.length > 0) {
          const latestData = dbData[0];
          
          // JSONB ডেটা ঠিকঠাক হ্যান্ডেল করার জন্য সেফটি লজিক
          let parsedFlaws: string[] = [];
          try {
            if (Array.isArray(latestData.problems)) {
              parsedFlaws = latestData.problems;
            } else if (typeof latestData.problems === 'string') {
              parsedFlaws = JSON.parse(latestData.problems);
            }
          } catch (e) {
            parsedFlaws = [];
          }

          setFlaws(parsedFlaws);
          generateDynamicRoutine(parsedFlaws);
        } else if (error) {
          console.error("Database fetch error:", error);
        }
      } catch (err) {
        console.error("Error fetching flaws:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && user) {
      fetchUserFlaws();
    }
  }, [isLoaded, user]);

  // 🌟 ইউজারের স্ক্যান করা সমস্যার ওপর ভিত্তি করে প্রোডাক্ট সাজানোর লজিক 🌟
  const generateDynamicRoutine = (userFlaws: string[]) => {
    const flawsText = userFlaws.join(" ").toLowerCase();
    
    // AM Routine (সকালের রুটিন)
    const newAm: RoutineItem[] = [
      { step: "01", name: "Hydrating Gentle Cleanser", ingredient: "Hyaluronic Acid + Ceramides", purpose: "Removes nighttime oils without damaging the skin barrier.", link: "#" }
    ];

    if (flawsText.includes("acne") || flawsText.includes("blemish") || flawsText.includes("pore")) {
      newAm.push({ step: "02", name: "Acne Control Serum", ingredient: "2% Salicylic Acid (BHA)", purpose: "Clears sub-surface congestion and minimizes pores.", link: "#" });
    } else if (flawsText.includes("dark") || flawsText.includes("pigment") || flawsText.includes("redness")) {
      newAm.push({ step: "02", name: "Antioxidant Defense Serum", ingredient: "15% L-Ascorbic Acid (Vit C)", purpose: "Brightens uneven tone and protects against UV damage.", link: "#" });
    } else {
      newAm.push({ step: "02", name: "Barrier Support Serum", ingredient: "Niacinamide 10%", purpose: "Evens out skin texture and controls excess sebum.", link: "#" });
    }

    newAm.push({ step: "03", name: "Matte Sunshield SPF 50", ingredient: "Zinc Oxide + Niacinamide", purpose: "Prevents aging and locks in the morning treatment.", link: "#" });
    setAmRoutine(newAm);

    // PM Routine (রাতের রুটিন)
    const newPm: RoutineItem[] = [
      { step: "01", name: "Deep Pore Cleansing Balm", ingredient: "Squalane based", purpose: "Melts away SPF, makeup, and daily pollution.", link: "#" }
    ];

    if (flawsText.includes("wrinkle") || flawsText.includes("line") || flawsText.includes("aging")) {
      newPm.push({ step: "02", name: "Cellular Repair Treatment", ingredient: "0.1% Retinol", purpose: "Accelerates cell turnover and improves facial texture.", link: "#" });
    } else {
      newPm.push({ step: "02", name: "Gentle Exfoliator", ingredient: "Lactic Acid (AHA)", purpose: "Gently removes dead skin cells for a morning glow.", link: "#" });
    }

    newPm.push({ step: "03", name: "Barrier Repair Moisturizer", ingredient: "Peptides + Ceramides", purpose: "Restores hydration and elasticity overnight.", link: "#" });
    setPmRoutine(newPm);
  };

  // লোডিং স্ট্যাটাস
  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#030306]">
         <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  // যদি স্ক্যান ডেটা না থাকে
  if (flaws.length === 0) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center px-4 text-center bg-[#030306]">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-zinc-900/50 p-10 shadow-2xl backdrop-blur-sm">
           <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
             <Camera className="h-8 w-8" />
           </div>
           <h2 className="mb-2 text-2xl font-bold text-white">Unlock Your Protocol</h2>
           <p className="mb-8 text-sm text-zinc-400">Scan your face to generate your personalized 30-Day AM/PM aesthetic routine.</p>
           <Link href="/upload" className="inline-block w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-bold text-black transition-transform hover:scale-105">
              Take Biometric Scan
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 p-6 md:p-10">
      
      {/* হেডার সেকশন */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-cyan-950/40 to-transparent p-8 rounded-[2.5rem] border border-cyan-500/20 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">The Glow Protocol</h2>
          <p className="text-zinc-400 mt-2 text-sm">Your bespoke 30-day aesthetic blueprint, generated by AI.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
           <ShieldCheck className="w-4 h-4 text-emerald-400" />
           <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest text-[10px]">Scientifically Curated</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Morning Routine (AM) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sun className="w-6 h-6" />
            </span>
            <div>
               <h3 className="text-xl font-bold text-white tracking-tight">Morning Routine</h3>
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Protection & Hydration</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {amRoutine.map((item, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950/50 p-6 transition-all hover:bg-white/[0.02] hover:border-amber-500/30">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                   <span className="text-6xl font-black italic text-white">{item.step}</span>
                </div>
                <div className="relative z-10">
                  <span className="inline-block mb-3 px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold text-amber-400 uppercase tracking-widest border border-white/5">
                    {item.ingredient}
                  </span>
                  <h4 className="text-lg font-bold text-white mb-2">{item.name}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">{item.purpose}</p>
                  
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-amber-500 hover:text-black hover:border-amber-500 shadow-lg">
                    <ExternalLink className="w-4 h-4" />
                    Get it on Amazon
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Night Routine (PM) */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Moon className="w-6 h-6" />
            </span>
            <div>
               <h3 className="text-xl font-bold text-white tracking-tight">Night Routine</h3>
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Repair & Recovery</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {pmRoutine.map((item, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950/50 p-6 transition-all hover:bg-white/[0.02] hover:border-indigo-500/30">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                   <span className="text-6xl font-black italic text-white">{item.step}</span>
                </div>
                <div className="relative z-10">
                  <span className="inline-block mb-3 px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold text-indigo-400 uppercase tracking-widest border border-white/5">
                    {item.ingredient}
                  </span>
                  <h4 className="text-lg font-bold text-white mb-2">{item.name}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">{item.purpose}</p>
                  
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-indigo-500 hover:text-white hover:border-indigo-500 shadow-lg">
                    <ExternalLink className="w-4 h-4" />
                    Shop Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- IMPORTANT: MEDICAL DISCLAIMER --- */}
      <div className="mt-12 p-6 rounded-3xl border border-white/5 bg-white/[0.02] max-w-3xl mx-auto backdrop-blur-md">
        <div className="flex gap-4 items-start">
          <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Medical Disclaimer</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed italic">
              *The Glow Protocol is an AI-generated cosmetic routine inspired by clinical dermatology standards. 
              GlowAI provides cosmetic suggestions, not medical diagnosis or advice. 
              Results may vary based on individual biology. Always perform a patch test on a small area of skin before applying new ingredients fully. 
              Consult a certified healthcare professional for clinical skin conditions or severe acne.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}