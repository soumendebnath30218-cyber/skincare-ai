"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2, Circle, Droplets, Moon, Sun, Wind, Camera, Loader2, ArrowUpRight, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
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

// 🌟 FIX: AnalysisResult-এ নতুন ৪টি ফিল্ড অ্যাড করা হলো 🌟
type AnalysisResult = {
  score?: number;
  basic_flaws?: string[];
  raw?: string;
  skin_age?: number;
  symmetry_score?: number;
  golden_ratio_match?: number;
  melanin_evenness?: string;
};

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [scanHistory, setScanHistory] = useState<
    { day: string; score: number }[]
  >([]);
  const shareCardRef = useRef<HTMLDivElement>(null); 

  const [skinAge, setSkinAge] = useState<number | null>(null);
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
      if (!user) return;

      const localData = localStorage.getItem("glow_analysis");
      const localImage = localStorage.getItem("glow_image");

      if (localData) {
        const parsedData = JSON.parse(localData);
        setAnalysis(parsedData);
        
        // 🌟 FIX: লোকাল স্টোরেজ থেকে ডেটা নিয়ে সরাসরি স্ক্রিনে দেখানো 🌟
        setSkinAge(parsedData.skin_age || null);
        setSymmetryScore(parsedData.symmetry_score || null);
        setGoldenRatioMatch(parsedData.golden_ratio_match || null);
        setMelaninEvenness(parsedData.melanin_evenness || null);

        if (localImage) setImage(localImage);

        await saveNewScanToDB(parsedData);
      } else {
        await fetchLatestFromDB(user.id);
      }
      await fetchAllScanHistory(user.id); 
      await fetchUserRoutine(user.id); 
      setIsLoadingDB(false);
    };

    if (isLoaded && user) {
      initializeDashboard();
    }
  }, [isLoaded, isSignedIn, user, router]);

  const fetchLatestFromDB = async (userId: string) => {
    try {
      const { data: dbData, error } = await supabase
        .from("user_scans")
        .select("*, skin_age, symmetry_score, golden_ratio_match, melanin_evenness")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (dbData && dbData.length > 0) {
        const latestData = dbData[0];
        setAnalysis({
          score: latestData.score,
          basic_flaws: latestData.problems || [] 
        });
        setSkinAge(latestData.skin_age);
        setSymmetryScore(latestData.symmetry_score);
        setGoldenRatioMatch(latestData.golden_ratio_match);
        setMelaninEvenness(latestData.melanin_evenness);
        
        const lastImage = localStorage.getItem("glow_image");
        setImage(lastImage || user?.imageUrl || "");
      } else if (error) {
        console.error("Database fetch error:", error);
      }
    } catch (err) {
      console.error("Database fetch exception:", err);
    }
  };

  const saveNewScanToDB = async (newAnalysis: AnalysisResult) => {
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      // 🌟 FIX: ডেটাবেসে সেভ করার সময় নতুন ৪টে প্রো-ডেটাও পাঠানো হচ্ছে 🌟
      const { error } = await supabase
        .from("user_scans")
        .insert([{
          user_id: user.id,
          score: newAnalysis.score || 0,
          problems: newAnalysis.basic_flaws || [], 
          skin_age: newAnalysis.skin_age || null,
          symmetry_score: newAnalysis.symmetry_score || null,
          golden_ratio_match: newAnalysis.golden_ratio_match || null,
          melanin_evenness: newAnalysis.melanin_evenness || null
        }]);

      if (!error) {
        localStorage.removeItem("glow_analysis"); 
        await fetchAllScanHistory(user.id); 
        await fetchUserRoutine(user.id); 
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
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#030306", 
      });
      const image = canvas.toDataURL("image/png");

      if (navigator.share) {
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], "my-glowup-journey.png", { type: "image/png" });

        await navigator.share({
          files: [file],
          title: "My GlowUp Journey",
          text: `Check out my progress! Day 1: ${dayOneScore}, Current: ${currentScore}`,
        });
      } else {
        const link = document.createElement("a");
        link.href = image;
        link.download = "my-glowup-journey.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error sharing or capturing image:", error);
    }
  };

  const currentScore = analysis?.score || 6.85; 
  const dayOneScore = scanHistory.length > 0 ? scanHistory[0].score : 0; 
  const scoreImprovement = (currentScore - yesterdayScore).toFixed(2);

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
           <Link href="/upload" className="inline-block w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-bold text-black transition-transform hover:scale-105">
              Start Your First Scan
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="text-zinc-100 font-sans p-6 md:p-10 pb-20 w-full bg-[#030306] min-h-screen">

      <header className="flex items-center justify-between mb-8">
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

      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">

        {/* Profile Card */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <h2 className="text-9xl font-black italic">PRO</h2>
          </div>

          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
            <img src={image || user?.imageUrl || ""} className="w-28 h-28 object-cover rounded-full border-2 border-cyan-500/50 relative z-10" alt="Profile" />
          </div>

          <div className="text-center md:text-left relative z-10">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">GLOW-UP PHASE 1</h2>
            <p className="text-zinc-500 mt-1 uppercase tracking-[0.3em] text-[9px] font-bold">Identity Verified: {user?.firstName}</p>
          </div>

          <div className="md:ml-auto text-center md:text-right relative z-10">
            <h2 className="text-5xl font-black text-cyan-400">{analysis.score}<span className="text-lg text-zinc-600">/10</span></h2>
            <p className="text-[9px] text-emerald-400 uppercase font-bold mt-1 tracking-[0.2em]">Latest Biometric Scan</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/50">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Skin Age</h3>
            <p className="text-3xl md:text-4xl font-black text-white">{skinAge || "--"} <span className="text-sm md:text-lg text-zinc-600">YRS</span></p>
          </div>
          <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/50">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Symmetry</h3>
            <p className="text-3xl md:text-4xl font-black text-white">{symmetryScore || "--"}<span className="text-sm md:text-lg text-zinc-600">%</span></p>
          </div>
          <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/50">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Golden Ratio</h3>
            <p className="text-3xl md:text-4xl font-black text-white">{goldenRatioMatch || "--"}</p>
          </div>
            <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-6 text-center flex flex-col justify-center transition-all hover:bg-zinc-900/50">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Melanin</h3>
            <p className="text-2xl md:text-3xl font-black text-cyan-400 capitalize">{melaninEvenness || "--"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Score Chart */}
          <div className="lg:col-span-2 bg-zinc-950/50 border border-white/5 rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Analysis History</h3>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full font-bold">Stable Progress</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scanHistory}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="day" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", border: "1px solid #ffffff10", borderRadius: "12px" }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Protocol */}
            <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Daily Protocol</h3>
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    task.completed ? "bg-emerald-500/10 border-emerald-500/20 opacity-60" : "bg-white/5 border-white/5 hover:border-white/10"
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
            <Link href="/upload" className="mt-8 block w-full text-center py-4 rounded-xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white/20 transition-all">
               + Retake Biometric Scan
            </Link>
          </div>
        </div>

        {/* Comparison Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-950/50 border border-white/5 rounded-[2rem] p-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Comparison Insights</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-zinc-400">Yesterday</p>
                        <p className="text-3xl font-black text-white">{yesterdayScore}<span className="text-lg text-zinc-600">/10</span></p>
                    </div>
                    <div className="text-center">
                        <ArrowUpRight className="w-6 h-6 text-emerald-400 mx-auto" />
                        <p className="text-xs text-emerald-400 font-bold uppercase mt-1">Improved by</p>
                        <p className="text-xl font-bold text-emerald-400">{scoreImprovement}</p>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-400">Today</p>
                        <p className="text-3xl font-black text-cyan-400">{currentScore}<span className="text-lg text-zinc-600">/10</span></p>
                    </div>
                </div>
            </div>

            {/* Viral Share Card */}
            <div ref={shareCardRef} className="relative p-8 rounded-[2rem] overflow-hidden bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-emerald-900/40 backdrop-blur-xl border border-white/10 shadow-2xl group">
                <div className="absolute inset-0 z-0 opacity-20" style={{backgroundImage: 'url(\"data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'%3E%3C/circle%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'%3E%3C/circle%3E%3C/g%3E%3C/svg%3E\")'}}>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">
                        My <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">GlowUp Journey</span>
                    </h3>
                    <p className="text-sm text-zinc-300 mb-6">Share your progress with friends!</p>

                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className="text-3xl font-extrabold text-cyan-300">Day 1: {dayOneScore}</span>
                        <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                        <span className="text-3xl font-extrabold text-emerald-300">Current: {currentScore}</span>
                    </div>

                    <button
                        onClick={handleShare}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm uppercase tracking-widest shadow-lg transform transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Progress
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}