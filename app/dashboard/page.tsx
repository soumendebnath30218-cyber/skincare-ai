"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2, Circle, Droplets, Moon, Sun, Wind, Camera, Loader2, ArrowUpRight, ArrowDownRight, Share2, Sparkles, ArrowRight, Activity } from "lucide-react";
import { toPng } from "html-to-image"; 
import React from "react";

// 🌟 Supabase কানেকশন 🌟
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type Task = {
  id: number;
  text: string;
  completed: boolean;
  icon: React.ReactNode; 
};

type TaskFromDB = {
  id: number;
  text: string;
  completed: boolean;
  icon: string; 
};

type AnalysisResult = {
  score?: number;
  basic_flaws?: string[];
  raw?: string;
  glow_index?: number; 
  symmetry_score?: number;
  golden_ratio_match?: number;
  melanin_evenness?: string;
};

type Analysis = {
  score: number;
  basic_flaws: string[];
  routine: string;
  glow_index: number;
  symmetry_score: number;
  golden_ratio_match: number;
  melanin_evenness: string;
  todays_current_problems: string[];
  todays_solution: string;
  premium_30_day_cosmetic: { step: string; product_type: string; reason: string }[];
  premium_30_day_diet: { time: string; food: string; benefit: string }[];
  disclaimer: string;
};

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [scanHistory, setScanHistory] = useState<
    { day: string; score: number }[]
  >([]);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // 🚨 React Strict Mode Fix 🚨
  const isProcessingRef = useRef(false);

  const [glowIndex, setGlowIndex] = useState<number | null>(null);
  const [symmetryScore, setSymmetryScore] = useState<number | null>(null);
  const [goldenRatioMatch, setGoldenRatioMatch] = useState<number | null>(null);
  const [melaninEvenness, setMelaninEvenness] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Drink 3L Water", completed: false, icon: <Droplets className="w-4 h-4" /> },
    { id: 2, text: "AM Skincare Routine", completed: false, icon: <Sun className="w-4 h-4" /> },
    { id: 3, text: "10 Mins Face Yoga", completed: false, icon: <Wind className="w-4 h-4" /> },
    { id: 4, text: "PM Skincare Routine", completed: false, icon: <Moon className="w-4 h-4" /> },
  ]);
  const [yesterdayScore, setYesterdayScore] = useState(6.75);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    const initializeDashboard = async () => {
      // 🚨 Prevent double execution in React Strict Mode 🚨
      if (!user || isProcessingRef.current) return;
      isProcessingRef.current = true;

      const localData = localStorage.getItem("glow_analysis");
      const localImage = localStorage.getItem("glow_image");

      if (localData) {
        try {
            const parsedData = JSON.parse(localData);
            // 🚨 Clear local storage IMMEDIATELY before async save starts 🚨
            localStorage.removeItem("glow_analysis");

            setAnalysis(parsedData);
            setGlowIndex(parsedData.glow_index || null);
            setSymmetryScore(parsedData.symmetry_score || null);
            setGoldenRatioMatch(parsedData.golden_ratio_match || null);
            setMelaninEvenness(parsedData.melanin_evenness || null);

            if (localImage) setImage(localImage);
            
            // 🚨 STEP 1 IMPLEMENTED: Commented out to prevent dashboard from inserting duplicate data 🚨
            // await saveNewScanToDB(parsedData);
        } catch (e) {
            console.error("Local data parse error", e);
        }
      } else {
        await fetchLatestFromDB(user.id);
      }
      await fetchAllScanHistory(user.id);
      await fetchUserRoutine(user.id);
      setIsLoadingDB(false);
      isProcessingRef.current = false; // Reset processing state
  };

    if (isLoaded && user) {
      initializeDashboard();
    }
  }, [isLoaded, isSignedIn, user, router]);

  const fetchLatestFromDB = async (userId: string) => {
    try {
      const { data: dbData, error } = await supabase
        .from("user_scans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (dbData && dbData.length > 0) {
        const latestData = dbData[0];
        setAnalysis({
          score: latestData.score,
          basic_flaws: latestData.problems || [],
          routine: "", 
          glow_index: latestData.glow_index || 0,
          symmetry_score: latestData.symmetry_score || 0,
          golden_ratio_match: latestData.golden_ratio_match || 0,
          melanin_evenness: latestData.melanin_evenness || "",
          todays_current_problems: [], 
          todays_solution: "", 
          premium_30_day_cosmetic: [], 
          premium_30_day_diet: [], 
          disclaimer: "", 
        });
        setGlowIndex(latestData.glow_index || null);
        setSymmetryScore(latestData.symmetry_score || null);
        setGoldenRatioMatch(latestData.golden_ratio_match || null);
        setMelaninEvenness(latestData.melanin_evenness || null);

        const lastImage = localStorage.getItem("glow_image");
        setImage(lastImage || user?.imageUrl || "");
      }
    } catch (err) {
      console.error("Database fetch exception:", err);
    }
  };

  const saveNewScanToDB = async (newAnalysis: AnalysisResult) => {
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      const scanData: any = {
        user_id: user.id,
        score: newAnalysis.score || 0,
        problems: newAnalysis.basic_flaws || [],
        symmetry_score: newAnalysis.symmetry_score || null,
        golden_ratio_match: newAnalysis.golden_ratio_match || null,
        melanin_evenness: newAnalysis.melanin_evenness || null
      };

      if (newAnalysis.glow_index) {
          scanData.glow_index = newAnalysis.glow_index;
      }

      const { error } = await supabase.from("user_scans").insert([scanData]);

      if (!error) {
        // Removed duplicate localStorage wipe here since it's now at the top
        await fetchAllScanHistory(user.id);
        await fetchUserRoutine(user.id);
      } else {
        console.error("Supabase Insert Error:", error);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchAllScanHistory = async (userId: string) => {
    try {
      const { data: dbData, error } = await supabase
        .from("user_scans")
        .select("created_at, score")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (dbData && !error) {
        const formattedData = dbData.map((scan, index) => ({
          day: `Day ${index + 1}`,
          score: scan.score,
        }));
        setScanHistory(formattedData);
        if (formattedData.length > 1) {
          setYesterdayScore(formattedData[formattedData.length - 2].score);
        } else if (formattedData.length === 1) {
          setYesterdayScore(formattedData[0].score);
        }
      }
    } catch (err) {
      console.error("Fetch all scan history error:", err);
    }
  };

  const getIconComponent = (iconString: string): React.ReactNode => {
    switch (iconString) {
      case "<Droplets className=\"w-4 h-4\" />": return <Droplets className="w-4 h-4" />;
      case "<Sun className=\"w-4 h-4\" />": return <Sun className="w-4 h-4" />;
      case "<Wind className=\"w-4 h-4\" />": return <Wind className="w-4 h-4" />;
      case "<Moon className=\"w-4 h-4\" />": return <Moon className="w-4 h-4" />;
      default: return null;
    }
  };

  const getIconString = (iconComponent: React.ReactNode): string => {
    if (React.isValidElement(iconComponent)) {
      if (iconComponent.type === Droplets) return "<Droplets className=\"w-4 h-4\" />";
      if (iconComponent.type === Sun) return "<Sun className=\"w-4 h-4\" />";
      if (iconComponent.type === Wind) return "<Wind className=\"w-4 h-4\" />";
      if (iconComponent.type === Moon) return "<Moon className=\"w-4 h-4\" />";
    }
    return "";
  };

  const fetchUserRoutine = async (userId: string) => {
    try {
      const { data: routineData, error } = await supabase
        .from("user_routines")
        .select("tasks")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (routineData && routineData.length > 0 && routineData[0].tasks) {
        const tasksFromDb: TaskFromDB[] = routineData[0].tasks;
        const formattedTasks: Task[] = tasksFromDb.map(task => ({
          ...task,
          icon: getIconComponent(task.icon),
        }));
        setTasks(formattedTasks);
      } else {
        await createDefaultRoutine(userId);
      }
    } catch (err) {
      console.error("Fetch user routine error:", err);
      await createDefaultRoutine(userId);
    }
  };

  const createDefaultRoutine = async (userId: string) => {
    const defaultTasksStrings: TaskFromDB[] = [
      { id: 1, text: "Drink 3L Water", completed: false, icon: "<Droplets className=\"w-4 h-4\" />" },
      { id: 2, text: "AM Skincare Routine", completed: false, icon: "<Sun className=\"w-4 h-4\" />" },
      { id: 3, text: "10 Mins Face Yoga", completed: false, icon: "<Wind className=\"w-4 h-4\" />" },
      { id: 4, text: "PM Skincare Routine", completed: false, icon: "<Moon className=\"w-4 h-4\" />" },
    ];
    try {
      const { error } = await supabase
        .from("user_routines")
        .insert([{
          user_id: userId,
          tasks: defaultTasksStrings,
        }]);
      if (!error) {
        setTasks(defaultTasksStrings.map(task => ({ ...task, icon: getIconComponent(task.icon) })));
      }
    } catch (err) {
      console.error("Create default routine error:", err);
    }
  };

  const toggleTask = async (id: number) => {
    if (!user) return;
    const updatedTasks = tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);

    const updatedTasksForDB = updatedTasks.map(task => ({
      ...task,
      icon: getIconString(task.icon),
    }));

    try {
      const { error } = await supabase
        .from("user_routines")
        .update({ tasks: updatedTasksForDB })
        .eq("user_id", user.id);
      if (error) {
        console.error("Error updating task completion:", error);
        setTasks(tasks);
      }
    } catch (err) {
      console.error("Error updating task completion:", err);
      setTasks(tasks);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        backgroundColor: "#09090b", 
        pixelRatio: 2 
      });

      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "glowup-progress.png", { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "My GlowUp Journey",
          text: "Consistency is key! Check out my progress on GlowryAI.",
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "my-glowup-journey.png";
        link.click();
      }
    } catch (error) {
      console.error("Capture failed:", error);
      const shareText = `My GlowUp Progress ✨\nDay 1: ${dayOneScore} ↗ Current: ${currentScore}`;
      navigator.clipboard.writeText(shareText);
      alert("Image generation failed. Progress copied to clipboard!");
    }
  };

  const currentScore = analysis?.score || 6.85;
  const dayOneScore = scanHistory.length > 0 ? scanHistory[0].score : 0;
  const scoreImprovement = (currentScore - yesterdayScore).toFixed(2);

  // 🌟 Last 7 Days Filter Logic 🌟
  const last7DaysData = scanHistory.slice(-7);

  // 🌟 PURE VISUAL Comparison Dynamic Logic (No Words) 🌟
  const diffValue = parseFloat(scoreImprovement);
  const isPositive = diffValue > 0;
  const isNegative = diffValue < 0;

  let TrendIcon = ArrowRight;
  let iconColor = "text-cyan-400";
  let trackGradient = "from-cyan-500/0 via-cyan-500/50 to-cyan-500/0";
  let iconShadow = "shadow-[0_0_20px_rgba(34,211,238,0.4)]";

  if (isPositive) {
    TrendIcon = ArrowUpRight;
    iconColor = "text-emerald-400";
    trackGradient = "from-emerald-500/0 via-emerald-500/50 to-emerald-500/0";
    iconShadow = "shadow-[0_0_20px_rgba(52,211,153,0.4)]";
  } else if (isNegative) {
    TrendIcon = ArrowDownRight;
    iconColor = "text-rose-400";
    trackGradient = "from-rose-500/0 via-rose-500/50 to-rose-500/0";
    iconShadow = "shadow-[0_0_20px_rgba(244,63,94,0.4)]";
  }

  if (!isLoaded || isLoadingDB) {
  return (
      <div className="flex h-screen w-full items-center justify-center bg-[#030306]">
         <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
  );
}

  if (!analysis) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center px-4 text-center bg-[#030306]">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-zinc-900/50 p-10 shadow-2xl backdrop-blur-sm">
           <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
             <Camera className="h-8 w-8" />
           </div>
           <h2 className="mb-2 text-2xl font-bold text-white">No Reports Yet</h2>
           <p className="mb-8 text-sm text-zinc-400">Start your first biometric scan to track your glow-up journey.</p>
           <Link href="/dashboard/scanner" className="inline-block w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-bold text-black transition-transform hover:scale-105">
              Start Your First Scan
           </Link>
        </div>
      </div>
    );
  }

  return (
    // 🌟 Full Page Smooth Animation 🌟
    <div className="text-zinc-100 font-sans p-6 md:p-10 pb-20 w-full bg-[#030306] min-h-screen relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* 🌟 Background Glowing Orbs 🌟 */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="flex items-center justify-between mb-8 relative z-10">
        <div>
           <h1 className="text-xl font-black tracking-tight text-white hidden md:block uppercase">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 ml-auto">
           {isSaving ? (
              <span className="text-[10px] font-bold text-amber-400 animate-pulse bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 uppercase tracking-widest">
                Syncing Data...
              </span>
           ) : (
              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-2 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20 uppercase tracking-widest">
                 <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                 Cloud Synced
              </span>
           )}
           <UserButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">

        <Link href="/dashboard/protocol" className="group relative flex w-full items-center justify-between rounded-[2rem] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 p-6 sm:p-8 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]">
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

           <div className="flex items-center gap-4 md:gap-6 relative z-10">
             <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:scale-110 transition-transform">
               <Sparkles className="h-6 w-6 md:h-8 md:w-8" />
             </div>
             <div>
               <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tight">30-Day Glow Protocol</h2>
               <p className="text-[10px] md:text-xs text-cyan-400 uppercase font-bold tracking-widest mt-1">YOUR 30-DAY NATURAL HEALING & SKINCARE BLUEPRINT</p>
             </div>
           </div>

           <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white group-hover:bg-cyan-400 group-hover:text-black transition-colors relative z-10">
             <ArrowRight className="h-5 w-5" />
           </div>
        </Link>

        {/* Profile Card */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform duration-1000 group-hover:scale-110">
            <h2 className="text-9xl font-black italic">PRO</h2>
          </div>

          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse" />
            <img src={image || user?.imageUrl || ""} className="w-28 h-28 object-cover rounded-full border-2 border-cyan-500/50 relative z-10 shadow-[0_0_20px_rgba(34,211,238,0.4)]" alt="Profile" />
          </div>

          <div className="text-center md:text-left relative z-10">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">GLOW-UP PHASE 1</h2>
            <p className="text-zinc-500 mt-1 uppercase tracking-[0.3em] text-[9px] font-bold">Identity Verified: {user?.firstName}</p>
          </div>

          <div className="md:ml-auto text-center md:text-right relative z-10">
            <h2 className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{analysis.score}<span className="text-lg text-zinc-600">/10</span></h2>
            <p className="text-[9px] text-emerald-400 uppercase font-bold mt-1 tracking-[0.2em]">Latest Biometric Scan</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="bg-zinc-950/50 backdrop-blur-lg border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/60 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.1)] cursor-default">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Glow Index</h3>
            <p className="text-3xl md:text-4xl font-black text-white">{analysis.score ? (analysis.score * 10).toFixed(0) : "--"} <span className="text-sm md:text-lg text-zinc-600">%</span></p>
          </div>
          <div className="bg-zinc-950/50 backdrop-blur-lg border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/60 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.1)] cursor-default">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Symmetry</h3>
            <p className="text-3xl md:text-4xl font-black text-white">{analysis.symmetry_score?.toFixed(1) || "--"}<span className="text-sm md:text-lg text-zinc-600">%</span></p>
          </div>
          <div className="bg-zinc-950/50 backdrop-blur-lg border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/60 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.1)] cursor-default">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Golden Ratio</h3>
            <p className="text-3xl md:text-4xl font-black text-white">{analysis.golden_ratio_match?.toFixed(2) || "--"}</p>
          </div>
          <div className="bg-zinc-950/50 backdrop-blur-lg border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/60 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.1)] cursor-default">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Melanin</h3>
            <p className="text-2xl md:text-3xl font-black text-cyan-400 capitalize">{analysis.melanin_evenness || "--"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-50"></div>
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Last 7 Days (Overview)</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(52,211,153,0.2)]">Live Data</span>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {/* 🌟 ADVANCED GLOWING LINE CHART 🌟 */}
                <AreaChart data={last7DaysData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScoreOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} hide={true} />
                  
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.9)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", boxShadow: "0 0 30px rgba(52,211,153,0.2)" }}
                    itemStyle={{ color: "#34d399", fontWeight: "900", fontSize: "16px" }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#34d399"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorScoreOverview)"
                    filter="url(#glowLine)"
                    animationBegin={300}
                    animationDuration={2000}
                    animationEasing="ease-out"
                    dot={{ r: 5, fill: "#09090b", stroke: "#34d399", strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: "#22d3ee", stroke: "#fff", strokeWidth: 3, className: "animate-pulse" }}
                    label={{ position: 'top', fill: '#f4f4f5', fontSize: 12, fontWeight: '900', dy: -12 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

            <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Daily Tasks</h3>
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    task.completed 
                      ? "bg-emerald-500/10 border-emerald-500/30 opacity-70 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
                      : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                  }`}
                    >
                  <div className="flex items-center gap-3">
                    <div className={task.completed ? "text-emerald-400" : "text-zinc-500"}>{task.icon}</div>
                    <span className={`text-xs font-medium ${task.completed ? "text-emerald-400/80 line-through" : "text-zinc-300"}`}>{task.text}</span>
                  </div>
                  {task.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-zinc-800" />}
                </button>
              ))}
            </div>
            <Link href="/dashboard/scanner" className="mt-8 block w-full text-center py-4 rounded-xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-cyan-400 hover:border-cyan-400/50 transition-all hover:bg-cyan-500/5">
               + Retake Biometric Scan
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 🌟 PURE VISUAL COMPARISON CARD (NO WORDS IN MIDDLE) 🌟 */}
            <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
              
              {/* Dynamic Background Flare */}
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-b from-cyan-500/10 to-transparent rounded-full blur-[60px] pointer-events-none transition-all group-hover:from-cyan-500/20"></div>

              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-10 relative z-10 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Comparison Insights
              </h3>

              {/* Central Pill UI */}
              <div className="relative z-10 bg-black/40 border border-white/5 rounded-full p-2 flex items-center justify-between shadow-inner">
                
                {/* YESTERDAY */}
                <div className="pl-6 py-2 flex flex-col justify-center">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-[0.2em] mb-1">Yesterday</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{yesterdayScore}</span>
                    <span className="text-xs text-zinc-600 font-bold">/10</span>
                  </div>
                </div>

                {/* VISUAL CONNECTION LINE (No words) */}
                <div className="flex-1 px-4 flex items-center justify-center relative">
                  <div className={`w-full h-[2px] bg-gradient-to-r ${trackGradient} relative overflow-hidden rounded-full`}>
                    {/* Running light pulse animation */}
                    <div className="absolute top-0 left-0 w-1/3 h-full bg-white opacity-50 blur-[2px] animate-[bg-pan_2s_linear_infinite]"></div>
                  </div>
                  {/* Floating Icon Base */}
                  <div className={`absolute bg-zinc-900 border border-white/10 w-10 h-10 rounded-full flex items-center justify-center z-10 ${iconShadow} transition-all duration-500`}>
                     <TrendIcon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                </div>

                {/* TODAY */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-full px-8 py-4 flex flex-col justify-center items-end relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                  <div className="absolute inset-0 bg-cyan-400/5 animate-pulse"></div>
                  <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-[0.2em] mb-1 relative z-10">Today</span>
                  <div className="flex items-baseline gap-1 relative z-10">
                    <span className="text-3xl font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{currentScore}</span>
                    <span className="text-xs text-cyan-700 font-bold">/10</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 🌸 SAFE DESIGN VIRAL SHARE CARD (CRASH-FREE) 🌸 */}
            <div ref={shareCardRef} className="p-8 rounded-[2.5rem] bg-[#09090b] border border-[#ffffff1a] text-center relative overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:20px_20px]"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-black italic tracking-tighter text-white mb-2">
                  My <span className="text-[#f472b6] drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]">GlowUp Journey</span>
                </h3>
                <p className="text-[10px] text-[#a1a1aa] mb-6 uppercase tracking-widest font-bold">Generated by GlowryAI</p>

                <div className="flex items-center justify-center gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-[10px] text-[#71717a] font-bold uppercase mb-1">Day 1</p>
                    <span className="text-4xl font-black text-[#22d3ee] drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">{dayOneScore}</span>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#10b981] mt-4" />
                  <div className="text-center">
                    <p className="text-[10px] text-[#71717a] font-bold uppercase mb-1">Current</p>
                    <span className="text-4xl font-black text-[#10b981] drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">{currentScore}</span>
                  </div>
                </div>

                <button
                  onClick={handleShare}
                  className="bg-gradient-to-r from-[#ec4899] to-[#f43f5e] px-8 py-3.5 rounded-full text-xs font-black text-white uppercase tracking-widest shadow-[0_10px_25px_rgba(236,72,153,0.4)] hover:scale-105 hover:shadow-[0_10px_35px_rgba(236,72,153,0.6)] transition-all flex items-center gap-2 mx-auto"
                >
                  <Share2 className="w-4 h-4" /> Share Progress
                </button>
              </div>
            </div>

        </div>
      </div>
      
      {/* Required for the new running light animation */}
      <style jsx global>{`
        @keyframes bg-pan {
          0% { left: -50%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 150%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}