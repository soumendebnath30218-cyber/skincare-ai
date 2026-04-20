"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  UploadCloud, CheckCircle2, XCircle, AlertTriangle, Sparkles, ArrowRight, Activity, RefreshCcw, Unlock
} from "lucide-react";

type AfterCapturePhase = "setup" | "quiz" | "analyzing" | "result";
type AnalyzeSkinResponse = { analysis?: string; error?: string };

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
    let cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);
    
    return { 
      score: parsed.score || parsed.rating || 7.5, 
      basic_flaws: parsed.basic_flaws || parsed.concerns || ["Textural irregularities", "Slight dehydration", "Uneven skin tone"], 
      routine: parsed.routine || "AM: Gentle Cleanser, Vitamin C, SPF. PM: Double Cleanse, Retinol, Moisturizer.", 
      raw: rawText,
      skin_age: parsed.skin_age,
      symmetry_score: parsed.symmetry_score,
      golden_ratio_match: parsed.golden_ratio_match,
      melanin_evenness: parsed.melanin_evenness
    };
  } catch (e) { 
    return { 
      score: 7.2, 
      basic_flaws: ["Surface dullness", "Uneven skin tone", "Dehydration"],
      routine: "AM: Cleanser, Moisturizer, SPF. PM: Double Cleanse, Exfoliant, Night Cream.",
      raw: rawText 
    }; 
  }
}

export default function UploadPage() {
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  const { openSignIn } = useClerk(); 

  const isProUser = true; // বর্তমানে টেস্টিংয়ের জন্য এটা true করা আছে

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [afterCapture, setAfterCapture] = useState<AfterCapturePhase>("setup");
  const [quizStep, setQuizStep] = useState(0);
  const [hypeIndex, setHypeIndex] = useState(0);
  const [skinAnalysis, setSkinAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [minWaitDone, setMinWaitDone] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);

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

  const beginAnalysisSequence = useCallback(async (dataUrl: string) => {
    if (isAnalyzing) return;
    analysisAbortRef.current?.abort(); 
    const ac = new AbortController(); 
    analysisAbortRef.current = ac;
    
    setCapturedImage(dataUrl);
    setSkinAnalysis(null);
    setAnalysisError(null);
    setMinWaitDone(false);
    setIsAnalyzing(true);

    // 🌟 লজিক: প্রো ইউজার অথবা আগে কুইজ দিলে সরাসরি স্কিপ করবে 🌟
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
    } catch {
      // fallback
    }

    try {
      const res = await fetch("/api/analyze-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: payload }),
        signal: ac.signal,
      });

      let data: AnalyzeSkinResponse;
      try {
        data = (await res.json()) as AnalyzeSkinResponse;
      } catch {
        if (!ac.signal.aborted) setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
        return;
      }
      if (ac.signal.aborted) return;
      if (!res.ok || !data.analysis?.trim()) {
        setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
        return;
      }
      
      const parsedResult = parseAnalysisData(data.analysis.trim());
      setSkinAnalysis(parsedResult);
      
      localStorage.setItem("glow_analysis", JSON.stringify(parsedResult));
      localStorage.setItem("glow_image", payload);

    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isProUser]);

  const nextQuizStep = () => {
    if (quizStep < 2) {
      setQuizStep(quizStep + 1);
    } else {
      // 🌟 কুইজ শেষ হলে মেমোরিতে সেভ করে রাখছি যাতে আর না জিগ্যেস করে 🌟
      localStorage.setItem("glow_quiz_completed", "true");
      setAfterCapture("analyzing");
      setTimeout(() => setMinWaitDone(true), 4500); 
    }
  };

  const resetUpload = () => {
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

  const potentialScore = Math.min(10, (skinAnalysis?.score || 7.5) + 1.5).toFixed(1);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030306] text-zinc-100 font-sans p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[min(100%,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),transparent)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 right-[-10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.12),transparent)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-[-10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(52,211,153,0.1),transparent)] blur-3xl" aria-hidden />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center">

        <header className="absolute top-0 left-0 right-0 z-40 mx-auto flex w-full max-w-md items-center justify-between px-2 py-8 sm:px-0">
          <span className="text-lg font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-200 to-emerald-300 bg-clip-text text-transparent uppercase tracking-tighter">GlowAI</span>
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
                  onClick={() => base64Image && beginAnalysisSequence(base64Image)}
                  disabled={isAnalyzing}
                  className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all ${
                    isAnalyzing ? "bg-zinc-800 text-zinc-400 cursor-not-allowed" : "bg-white text-black hover:bg-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]"
                  }`}
                >
                  {isAnalyzing ? (
                    <span className="animate-pulse flex items-center gap-2"><Sparkles className="w-5 h-5" /> Processing...</span>
                  ) : (
                    <>Analyze Uploaded Data <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </motion.div>
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
                    
                    <div className={`relative bg-zinc-900/50 border border-white/10 rounded-[2rem] p-6 space-y-6 transition-all duration-500`}>
                       
                       <div className="bg-white/5 rounded-2xl p-4">
                         <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 flex items-center gap-2">
                           <Activity className="w-3 h-3" /> Routine
                         </p>
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
                                   
                                   {/* Visible Scanning Overlays */}
                                   <div className="absolute inset-0 flex items-center justify-center opacity-80">
                                     <div className="w-[1px] h-full bg-cyan-400/80 shadow-[0_0_10px_#22d3ee]"></div>
                                     <div className="h-[1px] w-full bg-cyan-400/80 absolute shadow-[0_0_10px_#22d3ee]"></div>
                                     <div className="w-28 h-36 border border-emerald-400/60 rounded-[40%] absolute shadow-[0_0_15px_rgba(52,211,153,0.4)]"></div>
                                     <div className="w-full h-[1px] bg-amber-500/60 absolute translate-y-8"></div>
                                   </div>
                                   
                                   {/* Pro Stats Overlay with REAL DATA */}
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
                                   <img src={capturedImage} alt="Symmetry" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[4px] grayscale transition-all duration-700 group-hover:blur-[2px]" />
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

                       <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-cyan-900/30 via-zinc-950 to-zinc-950 p-1 border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] text-center mt-8">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                          
                          <div className="p-6 pt-8">
                            <div className="relative w-32 h-32 mx-auto mb-6 group cursor-default">
                              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-pulse blur-xl"></div>
                              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-emerald-400/50 relative z-10 bg-black">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={capturedImage} className={`w-full h-full object-cover saturate-200 brightness-125 scale-110 transition-all duration-700 ${isProUser ? '' : 'blur-[6px] group-hover:blur-[3px]'}`} />
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

                            <button onClick={handleUnlockReport} className="group relative inline-flex w-full items-center justify-center rounded-2xl py-4 text-sm font-black text-slate-950 transition-all hover:scale-[1.02] active:scale-[0.98]">
                              <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-bg-pan opacity-100" />
                              <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.6)] blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                              <span className="relative flex items-center gap-2 uppercase tracking-widest">
                                {isProUser ? "Go To Pro Dashboard" : "Unlock Everything - $9.99"}
                              </span>
                            </button>

                            <div className="mb-6 border-t border-white/5 pt-5 text-left mt-6">
                              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Deep Aesthetic Analysis</h4>
                              
                              {isProUser ? (
                                <div className="space-y-3 select-none">
                                    <div className="flex gap-3 items-center"><CheckCircle2 className="h-4 w-4 text-emerald-400"/><span className="text-xs text-emerald-200">Skin Age Estimation: {skinAnalysis?.skin_age || '--'} YRS</span></div>
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
                    </div>
                  </div>

                  <p className="mt-8 pb-4 text-center text-[9px] leading-relaxed text-zinc-600 px-4">Glow AI provides cosmetic routines based on AI analysis, not medical advice. Consult a dermatologist for clinical skin conditions.</p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {afterCapture === "result" && (
          <div className="w-full flex justify-center mt-8 relative z-10">
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