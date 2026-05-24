"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import fpPromise from '@fingerprintjs/fingerprintjs';
import { 
  ScanFace, Sun, Maximize, ShieldCheck, AlertCircle, Lock, Activity, RefreshCcw, CheckCircle2, Clock, Trophy, Sparkles, AlertOctagon
} from "lucide-react";

// 🌟 DEVELOPER TEST MODE 🌟
const IS_TESTING = false; 
const COOLDOWN_MS = IS_TESTING ? 60 * 1000 : 24 * 60 * 60 * 1000; 
const MAX_SCANS = IS_TESTING ? 999 : 30; 
const SUBSCRIPTION_DURATION_MS = IS_TESTING ? 30 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

// 🌟 Supabase কানেকশন 🌟
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type AfterCapturePhase = "setup" | "analyzing" | "result";
type AnalyzeSkinResponse = { analysis?: any; error?: string; success?: boolean; error_type?: string; message?: string };

type AnalysisResult = {
  score?: number;
  basic_flaws?: string[];
  locked_flaws?: number;
  raw?: string;
  routine?: string;
  skin_age?: number;
  symmetry_score?: number;
  golden_ratio_match?: number;
  melanin_evenness?: string;
};

const SKIN_ANALYSIS_FAILURE_MESSAGE = "Analysis failed. Please try again.";
const HYPE_STEPS = ["Calibrating Biometric Sensors...", "Analyzing Canthal Tilt...", "Evaluating Golden Ratio...", "Detecting Micro-Texture...", "Mapping Dermatological Profile..."];

async function compressImageDataUrl(dataUrl: string, maxDimension = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth; let height = img.naturalHeight;
      if (width <= 0 || height <= 0) return reject(new Error("Invalid image dimensions"));
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) { height = Math.round((height * maxDimension) / width); width = maxDimension; }
        else { width = Math.round((width * maxDimension) / height); height = maxDimension; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });
}

function parseAnalysisData(rawText: string): AnalysisResult {
  try {
    let cleanText = rawText.replace(/[\`]{3}json/gi, "").replace(/[\`]{3}/g, "").trim();
    const parsed = JSON.parse(cleanText);
    
    let finalRoutine = "AM: Gentle Cleanser, Vitamin C, SPF. PM: Double Cleanse, Retinol, Moisturizer.";
    if (parsed.routine) {
      if (typeof parsed.routine === "string") {
        finalRoutine = parsed.routine;
      } else if (typeof parsed.routine === "object") {
        const am = parsed.routine.morning || parsed.routine.am || parsed.routine.AM || "Gentle Cleanser, SPF";
        const pm = parsed.routine.night || parsed.routine.pm || parsed.routine.PM || "Cleanser, Moisturizer";
        finalRoutine = `AM: ${am} | PM: ${pm}`;
      }
    }

    return { 
      score: parsed.score || parsed.rating, 
      basic_flaws: parsed.issues || parsed.basic_flaws || parsed.concerns, 
      routine: finalRoutine, 
      raw: rawText,
      skin_age: parsed.skin_age,
      symmetry_score: parsed.symmetry_score,
      golden_ratio_match: parsed.golden_ratio_match,
      melanin_evenness: parsed.melanin_evenness
    };
  } catch (e) { 
    // 🚨 ডামি ডেটা রিমুভ করা হয়েছে। এখন এরর হলে ডাইরেক্ট Error থ্রো করবে। 🚨
    throw new Error("Failed to parse AI response.");
  }
}

export default function ScannerPage() {
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const isProUser = isSignedIn; 

  const [isInitializing, setIsInitializing] = useState(true);
  const webcamRef = useRef<Webcam>(null);
  
  const [metrics, setMetrics] = useState({
    lighting: "Checking...",
    angle: "Checking...",
    clarity: "Checking...",
    authenticity: "Checking...",
  });
  const [forceScan, setForceScan] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [afterCapture, setAfterCapture] = useState<AfterCapturePhase>("setup");
  const [hypeIndex, setHypeIndex] = useState(0);
  const [skinAnalysis, setSkinAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [minWaitDone, setMinWaitDone] = useState(false);

  // 🌟 Fingerprint + Limit State 🌟
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);

  // 🌟 PRO LIMIT & CYCLE STATES 🌟
  const [proCooldownEnd, setProCooldownEnd] = useState<number | null>(null);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState<boolean>(false);

  const analysisAbortRef = useRef<AbortController | null>(null);

  // 🌟 পেজ লোড হলেই Fingerprint + LocalStorage + Supabase চেক করবে 🌟
  useEffect(() => {
    const initFingerprintAndCheckLimit = async () => {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        const currentFingerprint = result.visitorId;
        setFingerprint(currentFingerprint);

        if (isSignedIn && userId) {
          // 🌟 0. CHECK SUBSCRIPTION VALIDITY (30 Days) 🌟
          const { data: masterData } = await supabase
            .from("master_glow_plans")
            .select("created_at")
            .eq("user_id", userId)
            .single();

          if (masterData && masterData.created_at) {
            const purchaseDate = new Date(masterData.created_at).getTime();
            const now = Date.now();
            if (now - purchaseDate > SUBSCRIPTION_DURATION_MS) {
              setIsSubscriptionExpired(true);
              setIsCheckingLimit(false);
              return; 
            }
          }

          // 🌟 1. TOTAL SCANS LIMIT CHECK (30 Scans) 🌟
          const { count, error: countError } = await supabase
            .from("user_scans")
            .select('*', { count: 'exact', head: true })
            .eq("user_id", userId);
            
          if (!countError && count !== null) {
            setTotalScans(count);
          }

          // 🌟 2. PRO USER 24-HOUR LIMIT CHECK 🌟
          const { data } = await supabase
            .from("user_scans")
            .select("created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (data && data.length > 0 && data[0].created_at) {
            const lastScanTime = new Date(data[0].created_at).getTime();
            const timeSinceLastScan = Date.now() - lastScanTime;
            
            if (timeSinceLastScan < COOLDOWN_MS) {
              setProCooldownEnd(lastScanTime + COOLDOWN_MS);
            }
          }
        } else {
          // 🌟 FREE USER LIFETIME LIMIT CHECK 🌟
          const localLimit = localStorage.getItem("free_scan_used");
          if (localLimit === "true") {
            setHasReachedLimit(true);
            setIsCheckingLimit(false);
            return;
          }

          const { data } = await supabase
            .from("user_scans")
            .select("id")
            .eq("fingerprint_id", currentFingerprint)
            .limit(1);

          if (data && data.length > 0) {
            setHasReachedLimit(true);
            localStorage.setItem("free_scan_used", "true"); 
          }
        }
      } catch (err) {
        console.error("Fingerprint/Limit error:", err);
      } finally {
        setIsCheckingLimit(false); 
      }
    };

    initFingerprintAndCheckLimit();
  }, [isSignedIn, userId]);

  // 🌟 COUNTDOWN TIMER LOGIC 🌟
  useEffect(() => {
    if (!proCooldownEnd) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = proCooldownEnd - now;
      
      if (diff <= 0) {
        setProCooldownEnd(null);
        setTimeLeft("");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [proCooldownEnd]);


  useEffect(() => {
    if (afterCapture === "setup" && !hasReachedLimit && !isCheckingLimit && !isSubscriptionExpired && !proCooldownEnd && totalScans < MAX_SCANS) {
      const initTimer = setTimeout(() => {
        setIsInitializing(false);
        setTimeout(() => setMetrics(m => ({ ...m, lighting: "Optimal" })), 800);
        setTimeout(() => setMetrics(m => ({ ...m, angle: "Perfect" })), 1600);
        setTimeout(() => setMetrics(m => ({ ...m, clarity: "Sharp" })), 2400);
        setTimeout(() => {
          setMetrics(m => ({ ...m, authenticity: "Natural Skin" })); 
        }, 3200);
      }, 3500); 
      return () => clearTimeout(initTimer);
    }
  }, [afterCapture, hasReachedLimit, isCheckingLimit, isSubscriptionExpired, proCooldownEnd, totalScans]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (afterCapture === "analyzing") {
      interval = setInterval(() => setHypeIndex((prev) => (prev + 1) % HYPE_STEPS.length), 1500);
    }
    return () => clearInterval(interval);
  }, [afterCapture]);

  useEffect(() => {
    if (afterCapture === "analyzing" && minWaitDone && !isScanning) {
      setAfterCapture("result");
    }
  }, [afterCapture, minWaitDone, isScanning]);

  const isLocked = (metrics.authenticity === "Checking..." || metrics.authenticity === "Makeup Detected") && !forceScan;

  const beginAnalysisSequence = useCallback(async (dataUrl: string) => {
    if (isScanning || hasReachedLimit || isCheckingLimit || proCooldownEnd || totalScans >= MAX_SCANS || isSubscriptionExpired) return;
    
    analysisAbortRef.current?.abort(); 
    const ac = new AbortController(); 
    analysisAbortRef.current = ac;
    
    setCapturedImage(dataUrl);
    setSkinAnalysis(null);
    setAnalysisError(null);
    setMinWaitDone(false);
    setAfterCapture("analyzing");
    setIsScanning(true);
    
    setTimeout(() => setMinWaitDone(true), 4500);

    let payload = dataUrl;
    try {
      payload = await compressImageDataUrl(dataUrl);
    } catch {}

    const savedAnalysis = localStorage.getItem("glow_analysis");
    let previousScore = null;
    let previousIssues = null;
    if (savedAnalysis) {
      try {
        const parsed = JSON.parse(savedAnalysis);
        previousScore = parsed.score;
        previousIssues = parsed.basic_flaws ? parsed.basic_flaws.join(", ") : null;
      } catch (e) {}
    }

    try {
      const res = await fetch("/api/analyze-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: payload,
          previousScore: previousScore,
          previousIssues: previousIssues
        }),
        signal: ac.signal,
      });

      let data: AnalyzeSkinResponse;
      try {
        data = await res.json();
      } catch {
        if (!ac.signal.aborted) setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
        setIsScanning(false);
        return;
      }
      
      if (ac.signal.aborted) return;
      
      if (!res.ok || data.success === false) {

        // 🌟 Catch Subscription Expired Error from API 🌟
        if (data.error_type === "subscription_expired") {
            setIsSubscriptionExpired(true);
            setAfterCapture("setup"); 
            setIsScanning(false);
            return;
        }

        // 🌟 5-STRIKES SILENT BLOCK LOGIC 🌟
        let currentStrikes = parseInt(localStorage.getItem("invalid_scan_count") || "0");
        currentStrikes += 1;
        localStorage.setItem("invalid_scan_count", currentStrikes.toString());

        if (currentStrikes >= 5) {
            localStorage.setItem("free_scan_used", "true");
            setHasReachedLimit(true);
            
            if (!isSignedIn && fingerprint) {
                const strikeOutData = {
                  user_id: null, 
                  fingerprint_id: fingerprint,         
                  score: 0,
                  problems: ["Blocked: Invalid Image Abuse"],
                  symmetry_score: null,
                  golden_ratio_match: null,
                  melanin_evenness: null
                };
                supabase.from("user_scans").insert([strikeOutData]).then();
            }
            setIsScanning(false);
            return; 
        }

        if (data.error_type === "invalid_face" && data.error) {
          setAnalysisError(data.error);
        } else {
          setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
        }
        setIsScanning(false);
        return;
      }

      let rawAiText = data.analysis ? data.analysis : data;
      if (typeof rawAiText !== 'string') {
          rawAiText = JSON.stringify(rawAiText);
      }

      const parsedData = parseAnalysisData(rawAiText.trim());
      setSkinAnalysis(parsedData);
      localStorage.setItem("glow_analysis", JSON.stringify(parsedData));
      localStorage.setItem("glow_image", payload);
      localStorage.setItem("glow_quiz_completed", "true");

      // 🌟 Mark scan as used for Free Users 🌟
      if (!isSignedIn) {
          localStorage.setItem("free_scan_used", "true");
      }

      // 🌟 Save to Supabase 🌟
      const scanData = {
        user_id: isSignedIn ? userId : null, 
        fingerprint_id: fingerprint,         
        score: parsedData.score || 0,
        problems: parsedData.basic_flaws || [],
        symmetry_score: parsedData.symmetry_score || null,
        golden_ratio_match: parsedData.golden_ratio_match || null,
        melanin_evenness: parsedData.melanin_evenness || null
      };
      
      supabase.from("user_scans").insert([scanData]).then(({ error }) => {
          if (error) {
              console.error("Supabase Save Error:", error);
          } else if (isSignedIn) {
              setTotalScans(prev => prev + 1);
          }
      });

    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, hasReachedLimit, isCheckingLimit, fingerprint, isSignedIn, userId, proCooldownEnd, totalScans, isSubscriptionExpired]);

  const handleScan = () => {
    if (isLocked) return;
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      beginAnalysisSequence(imageSrc);
    } else {
      alert("Failed to capture picture. Please check camera permission.");
    }
  };

  const handleUnlockReport = () => {
    if (!isSignedIn) {
      openSignIn({ fallbackRedirectUrl: "/dashboard" });
    } else {
      router.push("/dashboard");
    }
  };

  const handleSecretReset = async () => {
    localStorage.removeItem("free_scan_used");
    localStorage.removeItem("glow_quiz_completed");
    localStorage.removeItem("invalid_scan_count"); 
    
    if (fingerprint) {
        await supabase.from("user_scans").delete().eq("fingerprint_id", fingerprint);
    }
    if (userId) {
        await supabase.from("user_scans").delete().eq("user_id", userId);
        await supabase.from("master_glow_plans").delete().eq("user_id", userId);
    }
    
    setHasReachedLimit(false);
    setIsSubscriptionExpired(false);
    alert("✅ Limits & Strikes Reset Successfully! You can test again.");
    window.location.reload();
  };

  const resetScanner = () => {
    setSkinAnalysis(null);
    setCapturedImage(null);
    setAfterCapture("setup");
    setHypeIndex(0);
    setAnalysisError(null);
    setIsScanning(false);
    setMinWaitDone(false);
    setIsInitializing(true);
    setForceScan(false);
    setMetrics({ lighting: "Checking...", angle: "Checking...", clarity: "Checking...", authenticity: "Checking..." });
  };

  const potentialScore = Math.min(9.6, (skinAnalysis?.score || 7.5) + 1.5).toFixed(1);

  // 🌟 LOADING UI 🌟
  if (isCheckingLimit) {
      return (
          <div className="flex h-screen w-full flex-col items-center justify-center bg-[#030306]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
      );
  }

  // 🌟 FREE USER LIMIT UI 🌟
  if (hasReachedLimit && !isProUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center px-4 text-center bg-[#030306]">
        <div className="max-w-md w-full rounded-3xl border border-rose-500/20 bg-zinc-900/50 p-10 shadow-[0_0_40px_rgba(244,63,94,0.1)] backdrop-blur-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
           <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
             <Lock className="h-8 w-8" />
           </div>
           <h2 className="mb-2 text-2xl font-black text-white italic">Free Scan Limit Reached</h2>
           <p className="mb-8 text-sm text-zinc-400">You have already used your lifetime free biometric scan on this device. Upgrade to PRO for unlimited scans and your 30-Day Master Plan.</p>
           <button onClick={() => openSignIn({ fallbackRedirectUrl: "/dashboard" } as any)} className="inline-block w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-bold text-black transition-transform hover:scale-105 uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(52,211,153,0.4)]">
             Unlock PRO Access
           </button>
           <button onClick={() => window.location.href = '/'} className="mt-4 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
             Go Back to Home
           </button>

           <button onClick={handleSecretReset} className="absolute bottom-2 right-2 text-[8px] text-zinc-800 hover:text-red-500 opacity-50 cursor-pointer">
               Reset (Test Mode)
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030306] flex items-center justify-center p-6 pb-24 text-zinc-100 font-sans overflow-hidden">
      
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[min(100%,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),transparent)] blur-3xl" aria-hidden />
      
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center">

        <header className="absolute top-0 left-0 right-0 z-40 mx-auto flex w-full max-w-md items-center justify-between px-2 py-8 sm:px-0">
          <span className="text-lg font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-200 to-emerald-300 bg-clip-text text-transparent tracking-tighter">GlowryAI</span>
          </span>
          {isSignedIn && (
            <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer">
              Go to Dashboard
            </button>
          )}
        </header>

        {afterCapture === "setup" && (
          <>
            <AnimatePresence>
              {isInitializing && !isSubscriptionExpired && totalScans < MAX_SCANS && (!proCooldownEnd || Date.now() > proCooldownEnd) && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8"
                >
                  <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="space-y-8 max-w-lg">
                     <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                        <div className="absolute inset-0 bg-cyan-500/30 blur-[40px] rounded-full animate-pulse"></div>
                        <ScanFace className="w-20 h-20 text-cyan-400 relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                     </div>
                     <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 drop-shadow-lg">
                        Initializing Bio-Optics
                     </h2>
                     <div className="space-y-5 bg-white/[0.03] border border-white/10 p-6 rounded-3xl backdrop-blur-sm shadow-2xl">
                        <p className="text-cyan-400 text-sm md:text-base font-black uppercase tracking-[0.3em] drop-shadow-md">Sensor Calibration in progress...</p>
                        <p className="text-zinc-300 text-sm md:text-base font-medium leading-relaxed">&quot;For clinical accuracy, ensure your face is free of heavy makeup and sweat.&quot;</p>
                     </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-md space-y-6 pt-32">
               
               {/* 🌟 0. SUBSCRIPTION EXPIRED UI 🌟 */}
               {isSubscriptionExpired ? (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-10 rounded-[1.5rem] bg-zinc-900 border border-rose-500/30 flex flex-col items-center justify-center gap-4 text-center px-6 shadow-[0_0_40px_rgba(244,63,94,0.1)] relative overflow-hidden z-50">
                      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                      <AlertOctagon className="w-12 h-12 text-rose-500" />
                      <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Subscription Expired</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">Your 30-Day Master Plan validity has ended. Please renew your subscription to start a new glow-up cycle.</p>
                      <button onClick={() => router.push("/dashboard")} className="w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(244,63,94,0.4)]">Renew Now</button>
                      <button onClick={handleSecretReset} className="mt-4 text-[8px] text-zinc-500 hover:text-red-500 opacity-80 cursor-pointer">Reset Limit (Test Mode)</button>
                   </motion.div>
               ) : totalScans >= MAX_SCANS ? (
                  // 🌟 1. CYCLE LIMIT UI (30/30) 🌟
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-10 rounded-[1.5rem] bg-zinc-900 border border-emerald-500/30 flex flex-col items-center justify-center gap-4 text-center px-6 shadow-[0_0_40px_rgba(52,211,153,0.1)] z-50 relative">
                      <div className="relative"><Trophy className="w-12 h-12 text-emerald-400 animate-bounce" /><Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-cyan-400" /></div>
                      <h3 className="text-xl font-black text-white uppercase italic">Journey Complete!</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">You have successfully completed your {MAX_SCANS}-day aesthetic cycle. Your data is archived in your dashboard.</p>
                      <button onClick={() => router.push("/dashboard")} className="w-full rounded-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors">View Master Report</button>
                      <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-2">Renew subscription for next cycle</p>
                      <button onClick={handleSecretReset} className="mt-4 text-[8px] text-zinc-500 hover:text-red-500 opacity-80 cursor-pointer">Reset Limit (Test Mode)</button>
                  </motion.div>
               ) : proCooldownEnd && Date.now() < proCooldownEnd ? (
                  // 🌟 2. DAILY 24-HOUR COOLDOWN UI 🌟
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-8 rounded-[1.5rem] bg-zinc-900/80 border border-amber-500/30 flex flex-col items-center justify-center gap-3 text-center px-4 shadow-[0_0_30px_rgba(245,158,11,0.1)] z-50 relative">
                      <Clock className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
                      <h3 className="text-lg font-black text-white uppercase italic tracking-wider">Rest Your Skin</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-2">Scan {totalScans}/{MAX_SCANS} complete. The AI needs time to track actual biological changes.</p>
                      <div className="bg-black/60 px-6 py-3 rounded-full border border-white/10 shadow-inner">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Next Scan Available In</p>
                          <p className="text-2xl font-black text-amber-400 tracking-tighter">{timeLeft}</p>
                      </div>
                      <button onClick={handleSecretReset} className="mt-4 text-[8px] text-zinc-500 hover:text-red-500 opacity-80 cursor-pointer">Reset Limit (Test Mode)</button>
                  </motion.div>
               ) : (
                  // 🌟 3. NORMAL LIVE SCANNER UI 🌟
                  <>
                     <div className="text-center">
                        <h1 className="text-3xl font-black text-white uppercase italic tracking-wider drop-shadow-lg">Smart Scanner</h1>
                        <p className="text-xs text-cyan-500 font-black uppercase tracking-[0.4em] mt-2">Phase 2: Live Analysis</p>
                     </div>

                     <div className="relative aspect-[3/4] bg-zinc-950 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ facingMode: "user" }}
                          className="absolute inset-0 w-full h-full object-cover opacity-80 transform scale-x-[-1]"
                        />
                        
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="w-full h-[2px] bg-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,1)] animate-scan-line"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-cyan-500/40 rounded-[50%]"></div>
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay"></div>
                        </div>

                        {!isInitializing && (
                          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-6 left-0 right-0 px-5 z-40">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                                <Sun className={`w-5 h-5 ${metrics.lighting === "Optimal" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Lighting</p>
                                  <p className="text-xs font-black text-white">{metrics.lighting}</p>
                                </div>
                              </div>
                              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                                <Maximize className={`w-5 h-5 ${metrics.angle === "Perfect" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Angle</p>
                                  <p className="text-xs font-black text-white">{metrics.angle}</p>
                                </div>
                              </div>
                              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                                <ShieldCheck className={`w-5 h-5 ${metrics.clarity === "Sharp" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Clarity</p>
                                  <p className="text-xs font-black text-white">{metrics.clarity}</p>
                                </div>
                              </div>
                              <div className={`bg-black/60 backdrop-blur-xl border p-3 rounded-2xl flex items-center gap-3 transition-colors duration-500 ${metrics.authenticity === "Makeup Detected" ? "border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]" : metrics.authenticity === "Natural Skin" ? "border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "border-white/10"}`}>
                                <AlertCircle className={`w-5 h-5 ${metrics.authenticity === "Makeup Detected" ? "text-rose-500 animate-pulse" : metrics.authenticity === "Natural Skin" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Authenticity</p>
                                  <p className={`text-xs font-black ${metrics.authenticity === "Makeup Detected" ? "text-rose-400" : metrics.authenticity === "Natural Skin" ? "text-emerald-400" : "text-white"}`}>{metrics.authenticity}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {!isInitializing && (
                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-6 left-0 right-0 px-6 z-40 space-y-4">
                            
                            {metrics.authenticity === "Makeup Detected" && !forceScan && (
                              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center backdrop-blur-md">
                                <p className="text-xs font-black text-rose-400 uppercase tracking-widest leading-relaxed">Natural skin required for analysis.</p>
                              </div>
                            )}

                            {metrics.authenticity === "Makeup Detected" && !forceScan && (
                              <button onClick={() => setForceScan(true)} className="w-full text-center text-[11px] text-zinc-400 font-bold underline underline-offset-4 hover:text-white transition-colors">
                                My face is clean (Force Scan)
                              </button>
                            )}

                            <button
                              onClick={handleScan}
                              disabled={isLocked || isScanning}
                              className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all duration-300 ${
                                isLocked 
                                  ? "bg-zinc-900/80 text-zinc-600 border border-white/5 cursor-not-allowed backdrop-blur-md" 
                                  : "bg-white text-black hover:bg-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] shadow-xl"
                              }`}
                            >
                              {isLocked ? (
                                <><Lock className="w-5 h-5" /> Scan Locked</>
                              ) : (
                                <><ScanFace className="w-5 h-5" /> Initiate Scan {isProUser && `(${totalScans + 1}/${MAX_SCANS})`}</>
                              )}
                            </button>
                          </motion.div>
                        )}
                     </div>
                  </>
               )}
            </div>
          </>
        )}

        {(afterCapture === "analyzing" || (afterCapture === "result" && isScanning)) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="py-12 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10" />
              <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <div className="absolute inset-4 rounded-full border-b-4 border-emerald-400 animate-reverse-spin" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 animate-pulse transition-all duration-500 h-6">{HYPE_STEPS[hypeIndex]}</p>
              <p className="text-xs text-zinc-500">Our neural network is processing your bio-data...</p>
            </div>
          </motion.div>
        )}

        {afterCapture === "result" && !isScanning && capturedImage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pt-12">
            
            <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 flex justify-center max-h-[30vh] aspect-[4/3] w-2/3 mx-auto mt-2">
              <img src={capturedImage} alt="Your scan" className="w-full h-full object-cover opacity-50 grayscale transform scale-x-[-1]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent"></div>
            </div>

            <div className="-mt-12 relative z-10 space-y-5">
              {analysisError ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center">
                  <p className="text-sm text-red-300">{analysisError}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative flex items-center justify-center bg-zinc-950 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.15)] p-2">
                        <svg className="w-36 h-36 transform -rotate-90">
                          <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                          <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={2 * Math.PI * 64} strokeDashoffset={(2 * Math.PI * 64) - (((skinAnalysis?.score || 7.5) / 10) * (2 * Math.PI * 64))} className="text-cyan-400 transition-all duration-[2000ms] ease-out drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-4xl font-black text-white tracking-tighter">{skinAnalysis?.score || 7.5}</span>
                          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mt-1">Rating</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl shadow-inner">
                      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Initial Detection
                      </h3>
                      <ul className="space-y-4">
                        {(skinAnalysis?.basic_flaws || ["Textural irregularities", "Slight dehydration", "Uneven skin tone"]).map((flaw, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                            {flaw}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className={`relative bg-zinc-900/50 border border-white/10 rounded-[2rem] p-6 space-y-6 transition-all duration-500 ${!userId ? 'blur-md select-none opacity-50' : ''}`}>
                       <div className="bg-white/5 rounded-2xl p-4">
                         <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3" /> Routine</p>
                         <p className="text-sm text-zinc-300">{skinAnalysis?.routine || "AM: Gentle Cleanser, Vitamin C, SPF. PM: Double Cleanse, Retinol, Night Cream."}</p>
                       </div>
                       
                       <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-transparent p-1 mt-6 shadow-[0_0_20px_rgba(52,211,153,0.15)] group cursor-default transition-all">
                          <div className="bg-zinc-950/80 rounded-xl p-5 backdrop-blur-sm h-full w-full">
                              <div className="flex justify-between items-center mb-4 relative z-10">
                                <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                  <Activity className="w-4 h-4" /> Geometry & Ratio Map
                                </h3>
                                <span className="px-2 py-1 rounded bg-emerald-500/20 text-[9px] text-emerald-300 font-bold tracking-widest border border-emerald-500/30">PRO UNLOCKED</span>
                              </div>
                              <div className="relative h-44 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                 <img src={capturedImage} alt="Symmetry Unlocked" className="absolute inset-0 w-full h-full object-cover opacity-80 transform scale-x-[-1]" />
                                 
                                 <div className="absolute inset-0 flex items-center justify-center opacity-80">
                                   <div className="w-[1px] h-full bg-cyan-400/80 shadow-[0_0_10px_#22d3ee]"></div>
                                   <div className="h-[1px] w-full bg-cyan-400/80 absolute shadow-[0_0_10px_#22d3ee]"></div>
                                   <div className="w-28 h-36 border border-emerald-400/60 rounded-[40%] absolute shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                                   <div className="w-full h-[1px] bg-amber-500/60 absolute translate-y-8"></div>
                                 </div>
                                 
                                 <div className="absolute bottom-2 left-2 right-2 flex justify-between z-20">
                                    <div className="bg-black/70 backdrop-blur-md px-2 py-1 rounded border border-emerald-500/30 text-emerald-300 text-[9px] font-bold">
                                      Symmetry: {skinAnalysis?.symmetry_score ? `${skinAnalysis.symmetry_score}%` : '--'}
                                    </div>
                                    <div className="bg-black/70 backdrop-blur-md px-2 py-1 rounded border border-cyan-500/30 text-cyan-300 text-[9px] font-bold">
                                      Ratio: {skinAnalysis?.golden_ratio_match || '--'}
                                    </div>
                                 </div>
                              </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-cyan-900/30 via-zinc-950 to-zinc-950 p-1 border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] text-center mt-8">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                     
                     <div className="p-6 pt-8">
                       <div className="relative w-32 h-32 mx-auto mb-6 group cursor-default">
                         <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-pulse blur-xl"></div>
                         <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-emerald-400/50 relative z-10 bg-black">
                           <img src={capturedImage} className="w-full h-full object-cover saturate-200 brightness-125 scale-110 transform scale-x-[-1] transition-all duration-700" />
                         </div>
                         <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-emerald-400 to-cyan-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest z-20 shadow-[0_4px_15px_rgba(52,211,153,0.5)]">
                           {potentialScore}/10 POTENTIAL
                         </div>
                       </div>
                       
                       <h3 className="text-xl font-extrabold text-white mb-2 bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">Your Full Aesthetic Profile</h3>
                       <p className="text-xs text-zinc-400 mb-6 leading-relaxed px-2">Your personalized 30-Day Glow-Up Plan and symmetry report are now active.</p>

                       <button onClick={handleUnlockReport} className="group relative inline-flex w-full items-center justify-center rounded-2xl py-4 text-sm font-black text-slate-950 transition-all hover:scale-[1.02] active:scale-[0.98]">
                         <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-bg-pan opacity-100" />
                         <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.6)] blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                         <span className="relative flex items-center gap-2 uppercase tracking-widest">Go To Pro Dashboard</span>
                       </button>

                       <div className="mb-6 border-t border-white/5 pt-5 text-left mt-6">
                         <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Deep Aesthetic Analysis</h4>
                         <div className="space-y-3 select-none">
                             <div className="flex gap-3 items-center">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400"/>
                                <span className="text-xs text-emerald-200">Dermal Elasticity: High</span>
                             </div>
                             <div className="flex gap-3 items-center"><CheckCircle2 className="h-4 w-4 text-cyan-400"/><span className="text-xs text-cyan-200">Melanin Evenness: {skinAnalysis?.melanin_evenness || '--'}</span></div>
                             <div className="flex gap-3 items-center"><CheckCircle2 className="h-4 w-4 text-teal-400"/><span className="text-xs text-teal-200">Collagen Levels: Optimal</span></div>
                         </div>
                       </div>
                     </div>
                  </div>

                  <div className="flex justify-center mt-4 relative z-10">
                     <button onClick={handleSecretReset} className="text-[8px] text-zinc-800 hover:text-red-500 opacity-50 cursor-pointer">
                        Reset Device Limit (Test Mode)
                     </button>
                  </div>

                  <p className="mt-8 pb-4 text-center text-[9px] leading-relaxed text-zinc-600 px-4">Glow AI provides cosmetic routines based on AI analysis, not medical advice. Consult a dermatologist for clinical skin conditions.</p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {afterCapture === "result" && (
          <div className="w-full flex justify-center mt-8 relative z-10">
            <button onClick={resetScanner} className="w-full py-4 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold uppercase text-xs flex justify-center items-center gap-2 hover:bg-zinc-800">
              <RefreshCcw className="w-4 h-4" /> Scan Again
            </button>
          </div>
        )}

      </main>

      <style jsx global>{`
        @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-reverse-spin { animation: reverse-spin 1s linear infinite; }
        @keyframes bg-pan { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .animate-bg-pan { animation: bg-pan 3s linear infinite; }
        @keyframes scan-line { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        .animate-scan-line { position: absolute; width: 100%; animation: scan-line 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}