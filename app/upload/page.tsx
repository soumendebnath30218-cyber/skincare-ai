"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import fpPromise from '@fingerprintjs/fingerprintjs';
import {
  UploadCloud, CheckCircle2, XCircle, AlertTriangle, Sparkles, ArrowRight, Activity, RefreshCcw, Lock, Clock, Trophy, AlertOctagon
} from "lucide-react";
import UpgradeButton from "@/components/UpgradeButton";

// 🌟 HYBRID ENGINE IMPORTS 🌟
import { checkImageBrightness } from '@/utils/imageUtils';
import { initializeMediaPipe, scanFaceWithMediaPipe } from '@/utils/mediaPipeHelper';
import { calculateFaceScore } from '@/utils/faceMath';

// 🌟 DEVELOPER TEST MODE 🌟
const IS_TESTING = true; 
const COOLDOWN_MS = IS_TESTING ? 60 * 1000 : 24 * 60 * 60 * 1000; 
const MAX_SCANS = IS_TESTING ? 999 : 30; 
const SUBSCRIPTION_DURATION_MS = IS_TESTING ? 30 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type AfterCapturePhase = "setup" | "quiz" | "analyzing" | "result";
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

const SKIN_ANALYSIS_FAILURE_MESSAGE = "Analysis failed due to high server traffic. Please try again or check your internet connection.";
const HYPE_STEPS = ["Detecting facial thirds...", "Analyzing skin texture & tone...", "Evaluating golden ratio symmetry...", "Identifying dermal patterns...", "Checking hydration levels...", "Finalizing your aesthetic profile..."];

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
    
    let finalRoutine = "Compiling 100% natural routine..."; 
    if (parsed.routine) {
      if (typeof parsed.routine === "string") {
        finalRoutine = parsed.routine;
      } else if (typeof parsed.routine === "object") {
        let amTitle = "Morning Care";
        if (parsed.routine.morning && parsed.routine.morning.title) amTitle = parsed.routine.morning.title;
        else if (typeof parsed.routine.morning === 'string') amTitle = parsed.routine.morning;

        let pmTitle = "Night Care";
        if (parsed.routine.night && parsed.routine.night.title) pmTitle = parsed.routine.night.title;
        else if (typeof parsed.routine.night === 'string') pmTitle = parsed.routine.night;

        finalRoutine = `☀️ AM: ${amTitle}  |  🌙 PM: ${pmTitle}`;
      }
    }
    
    let extractedIssues = ["Pending detailed scan..."];
    if (Array.isArray(parsed.issues) && parsed.issues.length > 0) extractedIssues = parsed.issues;
    else if (Array.isArray(parsed.basic_flaws) && parsed.basic_flaws.length > 0) extractedIssues = parsed.basic_flaws;
    else if (Array.isArray(parsed.concerns) && parsed.concerns.length > 0) extractedIssues = parsed.concerns;

    return { 
      score: parsed.score || parsed.rating || 0, 
      basic_flaws: extractedIssues, 
      routine: finalRoutine, 
      raw: rawText,
      skin_age: parsed.skin_age,
      symmetry_score: parsed.symmetry_score,
      golden_ratio_match: parsed.golden_ratio_match,
      melanin_evenness: parsed.melanin_evenness
    };
  } catch (e) { 
    throw new Error("Failed to parse AI response.");
  }
}

export default function UploadPage() {
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const { openSignIn } = useClerk(); 

  const isProUser = isSignedIn; 

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [afterCapture, setAfterCapture] = useState<AfterCapturePhase>("setup");
  const [quizStep, setQuizStep] = useState(0);
  const [hypeIndex, setHypeIndex] = useState(0);
  const [skinAnalysis, setSkinAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [minWaitDone, setMinWaitDone] = useState(false);
  
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);

  const [proCooldownEnd, setProCooldownEnd] = useState<number | null>(null);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);
  
  const scanLockRef = useRef(false);
  const dbInsertLockRef = useRef(false);

  // 🌟 PRE-LOAD MEDIAPIPE ENGINE 🌟
  useEffect(() => {
    initializeMediaPipe();
  }, []);

  useEffect(() => {
    if (IS_TESTING) {
      localStorage.removeItem("invalid_scan_count");
      localStorage.removeItem("free_scan_used");
    }
  }, []);

  useEffect(() => {
    const initFingerprintAndCheckLimit = async () => {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        const currentFingerprint = result.visitorId;
        setFingerprint(currentFingerprint);

        if (isSignedIn && userId) {
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

          const { count, error: countError } = await supabase
            .from("user_scans")
            .select('*', { count: 'exact', head: true })
            .eq("user_id", userId);
            
          if (!countError && count !== null) {
            setTotalScans(count);
          }

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
    let interval: NodeJS.Timeout;
    if (afterCapture === "analyzing") {
      interval = setInterval(() => setHypeIndex((prev) => (prev + 1) % HYPE_STEPS.length), 1500);
    }
    return () => clearInterval(interval);
  }, [afterCapture]);

  useEffect(() => {
    if (afterCapture === "analyzing" && minWaitDone && !isAnalyzing) {
      setAfterCapture("result");
    }
  }, [afterCapture, minWaitDone, isAnalyzing]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);

      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const beginAnalysisSequence = useCallback(async (dataUrl: string, mpScore?: number, mpSymmetry?: number) => {
    if (scanLockRef.current || isAnalyzing || isCheckingLimit || isSubscriptionExpired || proCooldownEnd || totalScans >= MAX_SCANS) return;
    if (hasReachedLimit && !isProUser) return;

    scanLockRef.current = true; 
    dbInsertLockRef.current = false; 

    analysisAbortRef.current?.abort(); 
    const ac = new AbortController(); 
    analysisAbortRef.current = ac;
    
    setCapturedImage(dataUrl);
    setSkinAnalysis(null);
    setAnalysisError(null);
    setMinWaitDone(false);
    setIsAnalyzing(true);

    const hasCompletedQuiz = localStorage.getItem("glow_quiz_completed");
    
    if (isProUser || hasCompletedQuiz) {
      setAfterCapture("analyzing");
      setTimeout(() => setMinWaitDone(true), 4500);
    } else {
      setAfterCapture("quiz");
      setQuizStep(1);
    }

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
          previousIssues: previousIssues,
          mediaPipeScore: mpScore,
          mediaPipeSymmetry: mpSymmetry
        }),
        signal: ac.signal,
      });

      let data: AnalyzeSkinResponse;
      try {
        data = await res.json();
      } catch {
        if (!ac.signal.aborted) setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
        setIsAnalyzing(false);
        setAfterCapture("result");
        return;
      }

      if (ac.signal.aborted) return;
      
      if (!res.ok || data.success === false) {
        
        if (data.error_type === "subscription_expired") {
            setIsSubscriptionExpired(true);
            setAfterCapture("setup"); 
            setIsAnalyzing(false);
            return;
        }

        if (data.error_type === "invalid_face" && data.error) {
          setAnalysisError(data.error);
          setIsAnalyzing(false);
          setAfterCapture("result");
          return;
        }

        let currentStrikes = parseInt(localStorage.getItem("invalid_scan_count") || "0");
        currentStrikes += 1;
        localStorage.setItem("invalid_scan_count", currentStrikes.toString());

        if (currentStrikes >= 5) {
            localStorage.setItem("free_scan_used", "true");
            setHasReachedLimit(true);
            
            if (!isSignedIn && fingerprint && !dbInsertLockRef.current) {
                dbInsertLockRef.current = true;
                const strikeOutData = {
                  user_id: null, 
                  fingerprint_id: fingerprint,        
                  score: 0,
                  problems: ["Blocked: Invalid Image Abuse"],
                  symmetry_score: null,
                  golden_ratio_match: null,
                  melanin_evenness: null
                };
                await supabase.from("user_scans").insert([strikeOutData]);
            }
            if (!isProUser) {
              setIsAnalyzing(false);
              return; 
            }
        }

        setAnalysisError(data.error || SKIN_ANALYSIS_FAILURE_MESSAGE);
        setIsAnalyzing(false);
        setAfterCapture("result");
        return;
      }
      
      let rawAiText = data.analysis ? data.analysis : data;
      if (typeof rawAiText !== 'string') {
          rawAiText = JSON.stringify(rawAiText);
      }
      
      const parsedResult = parseAnalysisData(rawAiText.trim());
      setSkinAnalysis(parsedResult);
      
      localStorage.setItem("glow_analysis", JSON.stringify(parsedResult));
      localStorage.setItem("glow_image", payload);

      if (!isSignedIn) {
          localStorage.setItem("free_scan_used", "true");
      }

      const scanData = {
        user_id: isSignedIn ? userId : null, 
        fingerprint_id: fingerprint,        
        score: parsedResult.score || 0,
        problems: parsedResult.basic_flaws || [],
        symmetry_score: parsedResult.symmetry_score || null,
        golden_ratio_match: parsedResult.golden_ratio_match || null,
        melanin_evenness: parsedResult.melanin_evenness || null
      };
      
      if (!dbInsertLockRef.current) {
          dbInsertLockRef.current = true; 
          
          const { error } = await supabase.from("user_scans").insert([scanData]);
          if (error) {
            console.error("Supabase Save Error:", error);
          } else if (isSignedIn) {
            setTotalScans(prev => prev + 1);
          }
      } else {
          console.warn("🚫 Blocked Duplicate Insert.");
      }

    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
      }
    } finally {
      setIsAnalyzing(false);
      scanLockRef.current = false; 
      setAfterCapture((prev) => prev === "quiz" ? prev : "result");
      setMinWaitDone(true);
    }
  }, [isAnalyzing, isProUser, isSignedIn, fingerprint, userId, hasReachedLimit, isCheckingLimit, proCooldownEnd, totalScans, isSubscriptionExpired]);

  // 🌟 MODIFIED HYBRID FUNCTION: Premium English Copy 🌟
  const handleAnalyzeClick = () => {
    if (!base64Image) return;

    const img = new Image();
    img.src = base64Image;
    img.onload = async () => {
        // Layer 1: Light Checker
        const brightness = checkImageBrightness(img);
        
        if (brightness < 70) {
            const proceedAnyway = window.confirm(
                "⚠️ Low light detected! For clinical accuracy, we recommend using a well-lit image.\n\nDo you want to proceed with this image anyway?"
            );
            
            if (!proceedAnyway) {
                return; 
            }
        }

        setIsAnalyzing(true);

        // Layer 2: MediaPipe Scanner
        const result = await scanFaceWithMediaPipe(img);
        let mpScore = 0;
        let mpSymmetry = 0;

        if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
            const scoreData = calculateFaceScore(result.faceLandmarks);
            mpScore = scoreData.baseScore;
            mpSymmetry = scoreData.symmetry;
            
            // Layer 3: Main API Data Transfer
            beginAnalysisSequence(base64Image, mpScore, mpSymmetry);
        } else {
            setIsAnalyzing(false);
            alert("⚠️ Facial mapping failed! Please ensure you upload a clear, front-facing image.");
        }
    };
  };

  const nextQuizStep = () => {
    if (quizStep < 2) {
      setQuizStep(quizStep + 1);
    } else {
      localStorage.setItem("glow_quiz_completed", "true");
      setAfterCapture("analyzing");
      setTimeout(() => setMinWaitDone(true), 4500); 
    }
  };

  const resetUpload = () => {
    if ((proCooldownEnd && Date.now() < proCooldownEnd) || totalScans >= MAX_SCANS || isSubscriptionExpired) {
       setAfterCapture("setup");
       return;
    }

    setSkinAnalysis(null);
    setCapturedImage(null);
    setBase64Image(null);
    setAfterCapture("setup");
    setQuizStep(0);
    setHypeIndex(0);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setMinWaitDone(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUnlockReport = () => {
    if (!isSignedIn) {
      openSignIn({ fallbackRedirectUrl: "/dashboard" } as any);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSecretReset = async () => {
    localStorage.removeItem("free_scan_used");
    localStorage.removeItem("glow_quiz_completed");
    localStorage.removeItem("invalid_scan_count"); 
    localStorage.removeItem("glow_analysis"); 
    
    if (fingerprint) {
        await supabase.from("user_scans").delete().eq("fingerprint_id", fingerprint);
    }
    if (userId) {
        await supabase.from("user_scans").delete().eq("user_id", userId);
        await supabase.from("master_glow_plans").delete().eq("user_id", userId);
        await supabase.from("daily_scans").delete().eq("user_id", userId); 
    }
    
    setHasReachedLimit(false);
    setIsSubscriptionExpired(false);
    alert("✅ Limits & Master Plan Reset Successfully! You can test again.");
    window.location.reload();
  };

  const potentialScore = Math.min(9.6, (skinAnalysis?.score || 7.5) + 1.5).toFixed(1);

  if (isCheckingLimit) {
      return (
          <div className="flex h-screen w-full flex-col items-center justify-center bg-[#030306]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
      );
  }

  if (hasReachedLimit && !isProUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center px-4 text-center bg-[#030306]">
        <div className="max-w-md w-full rounded-3xl border border-rose-500/20 bg-zinc-900/50 p-10 shadow-[0_0_40px_rgba(244,63,94,0.1)] backdrop-blur-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
           <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
             <Lock className="h-8 w-8" />
           </div>
           <h2 className="mb-2 text-2xl font-black text-white italic">Free Scan Limit Reached</h2>
           <p className="mb-8 text-sm text-zinc-400">You have already used your lifetime free biometric scan on this device. Upgrade to PRO for unlimited daily scans and your 30-Day Master Plan.</p>
           <UpgradeButton
             title="Unlock PRO Access"
             className="inline-block w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-bold text-black transition-transform hover:scale-105 uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(52,211,153,0.4)]"
           />
           <button onClick={() => window.location.href = '/'} className="mt-4 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">
             Go Back to Home
           </button>
           <button onClick={handleSecretReset} className="absolute bottom-2 right-2 text-[8px] text-zinc-800 hover:text-red-500 opacity-50">
               Reset (Test Mode)
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030306] text-zinc-100 font-sans p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[min(100%,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),transparent)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 right-[-10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.12),transparent)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-[-10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(52,211,153,0.1),transparent)] blur-3xl" aria-hidden />

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-white uppercase italic tracking-wider drop-shadow-lg">
                Upload Bio-Data
              </h1>
              <p className="text-xs text-cyan-500 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Clinical Rules Apply
              </p>
            </div>
            
            {isSubscriptionExpired ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-10 rounded-[1.5rem] bg-zinc-900 border border-rose-500/30 flex flex-col items-center justify-center gap-4 text-center px-6 shadow-[0_0_40px_rgba(244,63,94,0.1)] relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                   <AlertOctagon className="w-12 h-12 text-rose-500" />
                   <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Subscription Expired</h3>
                   <p className="text-xs text-zinc-400 leading-relaxed">Your 30-Day Master Plan validity has ended. Please renew your subscription to start a new glow-up cycle.</p>
                   <button onClick={() => router.push("/dashboard")} className="w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(244,63,94,0.4)]">Renew Now</button>
                </motion.div>
            ) : totalScans >= MAX_SCANS ? (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-10 rounded-[1.5rem] bg-zinc-900 border border-emerald-500/30 flex flex-col items-center justify-center gap-4 text-center px-6 shadow-[0_0_40px_rgba(52,211,153,0.1)]">
                   <div className="relative"><Trophy className="w-12 h-12 text-emerald-400 animate-bounce" /><Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-cyan-400" /></div>
                   <h3 className="text-xl font-black text-white uppercase italic">Journey Complete!</h3>
                   <p className="text-xs text-zinc-400 leading-relaxed">You have successfully completed your {MAX_SCANS}-day aesthetic cycle. Your data is archived in your dashboard.</p>
                   <button onClick={() => router.push("/dashboard")} className="w-full rounded-full bg-white text-black py-4 font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors">View Master Report</button>
                   <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mt-2">Renew subscription for next cycle</p>
               </motion.div>
            ) : proCooldownEnd && Date.now() < proCooldownEnd ? (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full py-8 rounded-[1.5rem] bg-zinc-900/80 border border-amber-500/30 flex flex-col items-center justify-center gap-3 text-center px-4 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                   <Clock className="w-10 h-10 text-amber-400 mb-2 animate-pulse" />
                   <h3 className="text-lg font-black text-white uppercase italic tracking-wider">Rest Your Skin</h3>
                   <p className="text-xs text-zinc-400 leading-relaxed mb-2">Scan {totalScans}/{MAX_SCANS} complete. The AI needs time to track actual biological changes.</p>
                   <div className="bg-black/60 px-6 py-3 rounded-full border border-white/10 shadow-inner">
                       <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Next Scan Available In</p>
                       <p className="text-2xl font-black text-amber-400 tracking-tighter">{timeLeft}</p>
                   </div>
               </motion.div>
            ) : (
              <>
                <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-5">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/10 pb-3">
                    Photo Requirements
                  </h3>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-white uppercase">Good Lighting</p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">Face a window. Natural daylight gives the most accurate results.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-white uppercase">No Makeup</p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">Ensure skin is completely bare. Foundation hides true micro-texture.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />

                {!capturedImage ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-5 rounded-[1.5rem] bg-zinc-900 border border-dashed border-cyan-500/50 hover:bg-zinc-800 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <UploadCloud className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-300">Select Image from Gallery</span>
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div className="relative aspect-[3/4] bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={capturedImage} alt="Selected" className="w-full h-full object-cover opacity-90" />

                      <button
                        onClick={() => { setCapturedImage(null); setBase64Image(null); }}
                        className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/20 hover:bg-rose-500/20 hover:border-rose-500 transition-colors"
                      >
                        <XCircle className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <button
                      onClick={handleAnalyzeClick}
                      disabled={isAnalyzing || isCheckingLimit}
                      className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all ${
                        isAnalyzing || isCheckingLimit ? "bg-zinc-800 text-zinc-400 cursor-not-allowed" : "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]"
                      }`}
                    >
                      {isAnalyzing ? (
                        <span className="animate-pulse flex items-center gap-2"><Sparkles className="w-5 h-5" /> Processing...</span>
                      ) : (
                        <>{isProUser ? `Start Scan ${totalScans + 1}/${MAX_SCANS}` : 'Analyze Uploaded Data'} <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {afterCapture === "quiz" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="py-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8 px-2">
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"><span>Scan Status: Processing</span><span>Step {quizStep} of 2</span></div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500" style={{ width: `${(quizStep / 2) * 100}%` }} /></div>
            </div>
            {quizStep === 1 ? (
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-white tracking-tight">What is your primary skin concern?</h3>
                <div className="grid grid-cols-1 gap-3">
                  {["Acne & Blemishes", "Fine Lines & Wrinkles", "Dark Spots & Pigmentation", "Dryness & Texture"].map((opt) => (
                    <button key={opt} onClick={nextQuizStep} className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/50 hover:bg-white/10">
                      <span className="relative z-10 text-sm font-medium text-zinc-300 group-hover:text-white">&quot;{opt}&quot;</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-white tracking-tight">How does your skin feel by midday?</h3>
                <div className="grid grid-cols-1 gap-3">
                  {["Oily or Shiny", "Tight and Dry", "Oily on T-Zone only", "Balanced and Normal"].map((opt) => (
                    <button key={opt} onClick={nextQuizStep} className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/50 hover:bg-white/10">
                      <span className="relative z-10 text-sm font-medium text-zinc-300 group-hover:text-white">&quot;{opt}&quot;</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {(afterCapture === "analyzing" || (afterCapture === "result" && isAnalyzing)) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="py-12 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10" />
              <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <div className="absolute inset-4 rounded-full border-b-4 border-emerald-400 animate-reverse-spin" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 animate-pulse transition-all duration-500 h-6">{HYPE_STEPS[hypeIndex]}</p>
              <p className="text-xs text-zinc-500">Our neural network is mapping your facial features...</p>
            </div>
          </motion.div>
        )}

        {afterCapture === "result" && !isAnalyzing && capturedImage && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            
            <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 flex justify-center max-h-[30vh] aspect-[4/3] w-2/3 mx-auto mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Your scan" className="w-full h-full object-cover opacity-50 grayscale" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent"></div>
            </div>

            <div className="-mt-12 relative z-10 space-y-5">
              {analysisError ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center">
                  <p className="text-sm font-bold text-red-300">{analysisError}</p>
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
                    
                    <div className={`relative bg-zinc-900/50 border border-white/10 rounded-[2rem] p-6 space-y-6 transition-all duration-500`}>
                       <div className="bg-white/5 rounded-2xl p-4">
                         <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3" /> Routine</p>
                         <p className="text-sm text-zinc-300">{skinAnalysis?.routine || "AM: Gentle Cleanser, Vitamin C, SPF. PM: Double Cleanse, Retinol, Night Cream."}</p>
                       </div>
                       
                       {isProUser ? (
                           <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-transparent p-1 mt-6 shadow-[0_0_20px_rgba(52,211,153,0.15)] group cursor-default transition-all">
                              <div className="bg-zinc-950/80 rounded-xl p-5 backdrop-blur-sm h-full w-full">
                                  <div className="flex justify-between items-center mb-4 relative z-10">
                                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                      <Activity className="w-4 h-4" /> Geometry & Ratio Map
                                    </h3>
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-[9px] text-emerald-300 font-bold tracking-widest border border-emerald-500/30">PRO UNLOCKED</span>
                                  </div>
                                  <div className="relative h-44 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                     {/* eslint-disable-next-line @next/next/no-img-element */}
                                     <img src={capturedImage} alt="Symmetry Unlocked" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                     
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
                       ) : (
                           <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-1 mt-6 shadow-[0_0_20px_rgba(245,158,11,0.1)] group cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                              <div className="bg-zinc-950/80 rounded-xl p-5 backdrop-blur-sm h-full w-full">
                                  <div className="flex justify-between items-center mb-4 relative z-10">
                                      <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                      <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                                      Geometry & Ratio Map
                                      </h3>
                                      <span className="px-2 py-1 rounded bg-amber-500/20 text-[9px] text-amber-300 font-bold tracking-widest border border-amber-500/30">LOCKED</span>
                                  </div>
                                  <div className="relative h-44 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={capturedImage} alt="Symmetry" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px] grayscale transition-all duration-700 group-hover:blur-[1px]" />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-60">
                                          <div className="w-[1px] h-full bg-cyan-400/50"></div>
                                          <div className="h-[1px] w-full bg-cyan-400/50 absolute"></div>
                                          <div className="w-28 h-36 border border-amber-400/40 rounded-[40%] absolute"></div>
                                          <div className="w-16 h-20 border border-emerald-400/30 rounded-full absolute -translate-y-6"></div>
                                          <div className="w-full h-[1px] bg-amber-500/40 absolute translate-y-8"></div>
                                      </div>
                                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                                          <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                                          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                          </div>
                                          <span className="text-[10px] text-zinc-300 font-bold tracking-widest uppercase">Facial Geometry Hidden</span>
                                      </div>
                                  </div>
                              </div>
                           </div>
                       )}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-cyan-900/30 via-zinc-950 to-zinc-950 p-1 border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] text-center mt-8">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                     
                     <div className="p-6 pt-8">
                       <div className="relative w-32 h-32 mx-auto mb-6 group cursor-default">
                         <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-pulse blur-xl"></div>
                         <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-emerald-400/50 relative z-10 bg-black">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={capturedImage} className={`w-full h-full object-cover saturate-200 brightness-125 scale-110 transition-all duration-700 ${isProUser ? '' : 'blur-[3px] group-hover:blur-[1.5px]'}`} />
                           {!isProUser && (
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                               <svg className="w-8 h-8 text-white/60 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm3 7H7V7a3 3 0 016 0v2z" /></svg>
                             </div>
                           )}
                         </div>
                         <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-emerald-400 to-cyan-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest z-20 shadow-[0_4px_15px_rgba(52,211,153,0.5)]">
                           {potentialScore}/10 POTENTIAL
                         </div>
                       </div>
                       
                       <h3 className="text-xl font-extrabold text-white mb-2 bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                         {isProUser ? "Your Full Aesthetic Profile" : "Reveal Your Potential Face"}
                       </h3>
                       <p className="text-xs text-zinc-400 mb-6 leading-relaxed px-2">
                         {isProUser ? "Your personalized 30-Day Glow-Up Plan and symmetry report are now active." : "Unlock your personalized 30-Day Glow-Up Plan, view your full symmetry report, and reveal your highest aesthetic potential."}
                       </p>

                       {isProUser ? (
                         <button onClick={handleUnlockReport} className="group relative inline-flex w-full items-center justify-center rounded-2xl py-4 text-sm font-black text-slate-950 transition-all hover:scale-[1.02] active:scale-[0.98]">
                           <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-bg-pan opacity-100" />
                           <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.6)] blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                           <span className="relative flex items-center gap-2 uppercase tracking-widest">Go To Pro Dashboard</span>
                         </button>
                       ) : (
                         <UpgradeButton
                           title="Unlock Everything - $9.99"
                           className="group relative inline-flex w-full items-center justify-center rounded-2xl py-4 text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest shadow-[0_0_25px_rgba(34,211,238,0.6)]"
                         />
                       )}

                       <div className="mb-6 border-t border-white/5 pt-5 text-left mt-6">
                         <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Deep Aesthetic Analysis</h4>
                         
                         {isProUser ? (
                           <div className="space-y-3 select-none">
                               <div className="flex gap-3 items-center">
                                 <CheckCircle2 className="h-4 w-4 text-emerald-400"/>
                                 <span className="text-xs text-emerald-200">Dermal Elasticity: High</span>
                               </div>
                               <div className="flex gap-3 items-center"><CheckCircle2 className="h-4 w-4 text-cyan-400"/><span className="text-xs text-cyan-200">Melanin Evenness: {skinAnalysis?.melanin_evenness || '--'}</span></div>
                               <div className="flex gap-3 items-center"><CheckCircle2 className="h-4 w-4 text-teal-400"/><span className="text-xs text-teal-200">Collagen Levels: Optimal</span></div>
                           </div>
                         ) : (
                           <div className="space-y-3 blur-[4px] opacity-40 select-none pointer-events-none">
                               <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-3/4"></div></div>
                               <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-5/6"></div></div>
                               <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-2/3"></div></div>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>

                  <div className="flex justify-center mt-4 relative z-10">
                     <button onClick={handleSecretReset} className="text-[8px] text-zinc-800 hover:text-red-500 opacity-50">
                        Reset Device Limit (Test Mode)
                      </button>
                  </div>

                  <p className="mt-4 pb-4 text-center text-[9px] leading-relaxed text-zinc-600 px-4">Glow AI provides 100% natural and home made routines based on AI analysis, not medical advice. Consult a dermatologist for clinical skin conditions.</p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {afterCapture === "result" && (
          <div className="w-full flex justify-center mt-2 relative z-10">
            <button onClick={resetUpload} className="w-full py-4 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold uppercase text-xs flex justify-center items-center gap-2 hover:bg-zinc-800">
              <RefreshCcw className="w-4 h-4" /> Upload New Photo
            </button>
          </div>
        )}

      </main>

      <style jsx global>{`
        @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-reverse-spin { animation: reverse-spin 1s linear infinite; }
        @keyframes bg-pan { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .animate-bg-pan { animation: bg-pan 3s linear infinite; }
      `}</style>
    </div>
  );
}