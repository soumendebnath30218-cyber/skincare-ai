"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation"; 
import { useUser, useClerk, SignInButton, UserButton } from "@clerk/nextjs";

type AfterCapturePhase = "setup" | "quiz" | "analyzing" | "result";
type AnalyzeSkinResponse = { analysis?: string; error?: string };
type AnalysisResult = {
  score?: number;
  basic_flaws?: string[];
  locked_flaws?: number;
  raw?: string;
};

const SKIN_ANALYSIS_FAILURE_MESSAGE = "Analysis failed due to high server traffic. Please try again or check your internet connection.";
const HYPE_STEPS = ["Detecting facial thirds...", "Analyzing skin texture & tone...", "Evaluating golden ratio symmetry...", "Identifying dermal patterns...", "Checking hydration levels...", "Finalizing your aesthetic profile..."];

function compressImageDataUrl(dataUrl: string, maxDimension = 1280, quality = 0.85): Promise<string> {
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

async function hasVideoInputDevice(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return true;
  try { const devices = await navigator.mediaDevices.enumerateDevices(); return devices.some((d) => d.kind === "videoinput"); } 
  catch { return true; }
}

function parseAnalysisData(rawText: string): AnalysisResult {
  try {
    let cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);
    if (parsed.score && parsed.basic_flaws) return parsed;
    return { raw: rawText };
  } catch (e) { return { raw: rawText }; }
}

export default function Home() {
  const router = useRouter(); 
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [uploadFallback, setUploadFallback] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [afterCapture, setAfterCapture] = useState<AfterCapturePhase>("setup");
  const [quizStep, setQuizStep] = useState(0); 
  const [hypeIndex, setHypeIndex] = useState(0);
  const [skinAnalysis, setSkinAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (afterCapture === "analyzing") interval = setInterval(() => setHypeIndex((prev) => (prev + 1) % HYPE_STEPS.length), 1800);
    return () => clearInterval(interval);
  }, [afterCapture]);

  const stopStream = useCallback(() => { setStream((prev) => { prev?.getTracks().forEach((track) => track.stop()); return null; }); }, []);

  const closeScanner = useCallback(() => {
    analysisAbortRef.current?.abort(); analysisAbortRef.current = null; stopStream(); setScannerOpen(false); setCameraError(null); setIsStartingCamera(false); setUploadFallback(false); setCapturedImage(null); setAfterCapture("setup"); setQuizStep(0); setHypeIndex(0); setSkinAnalysis(null); setAnalysisError(null); setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [stopStream]);

  const beginAnalysisSequence = useCallback(async (dataUrl: string) => {
    if (isAnalyzing) return;
    analysisAbortRef.current?.abort(); const ac = new AbortController(); analysisAbortRef.current = ac;
    stopStream(); setCapturedImage(dataUrl); setSkinAnalysis(null); setAnalysisError(null); setAfterCapture("quiz"); setQuizStep(1); setIsAnalyzing(true);
    let payload = dataUrl;
    try { payload = await compressImageDataUrl(dataUrl); } catch { /* fallback */ }
    try {
      const res = await fetch("/api/analyze-skin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: payload }), signal: ac.signal });
      let data: AnalyzeSkinResponse;
      try { data = (await res.json()) as AnalyzeSkinResponse; } 
      catch { if (!ac.signal.aborted) setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE); return; }
      if (ac.signal.aborted) return;
      if (!res.ok || !data.analysis?.trim()) { setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE); return; }
      setSkinAnalysis(parseAnalysisData(data.analysis.trim()));
    } catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE); } 
    finally { setIsAnalyzing(false); }
  }, [isAnalyzing, stopStream]);

  const nextQuizStep = () => {
    if (quizStep < 2) setQuizStep(quizStep + 1);
    else { setAfterCapture("analyzing"); setTimeout(() => setAfterCapture("result"), 4500); }
  };

  const handleUnlockDashboard = () => {
    if (skinAnalysis && capturedImage) { 
      localStorage.setItem("glow_analysis", JSON.stringify(skinAnalysis)); 
      localStorage.setItem("glow_image", capturedImage); 
      
      if (!isSignedIn) {
        openSignIn({ forceRedirectUrl: "/dashboard" });
      } else {
        router.push("/dashboard"); 
      }
    }
  };

  const openScannerUploadOnly = useCallback(() => {
    analysisAbortRef.current?.abort(); analysisAbortRef.current = null; setScannerOpen(true); setCameraError(null); setStream(null); setIsStartingCamera(false); setUploadFallback(true); setCapturedImage(null); setAfterCapture("setup"); setSkinAnalysis(null); setAnalysisError(null); setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const openScannerWithCamera = useCallback(async () => {
    analysisAbortRef.current?.abort(); analysisAbortRef.current = null; setScannerOpen(true); setCameraError(null); setCapturedImage(null); setAfterCapture("setup"); setSkinAnalysis(null); setAnalysisError(null); setUploadFallback(false); setIsStartingCamera(true); setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) { setCameraError("Camera API not available."); setUploadFallback(true); setIsStartingCamera(false); return; }
    const hasCamera = await hasVideoInputDevice();
    if (!hasCamera) { setCameraError("No camera detected."); setUploadFallback(true); setIsStartingCamera(false); return; }
    try { const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); setStream(mediaStream); } 
    catch (err) { setCameraError(err instanceof Error ? err.message : "Camera error."); setUploadFallback(true); } 
    finally { setIsStartingCamera(false); }
  }, []);

  useEffect(() => {
    const el = videoRef.current; if (!el || !stream) return; el.srcObject = stream; el.play().catch(() => {});
    return () => { el.srcObject = null; };
  }, [stream]);

  useEffect(() => {
    if (!scannerOpen) return; const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") closeScanner(); }; window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = prevOverflow; };
  }, [scannerOpen, closeScanner]);

  useEffect(() => { return () => analysisAbortRef.current?.abort(); }, []);

  const takePhoto = useCallback(() => {
    const video = videoRef.current; if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) return; ctx.drawImage(video, 0, 0);
    beginAnalysisSequence(canvas.toDataURL("image/jpeg", 0.92));
  }, [beginAnalysisSequence]);

  const onFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader(); reader.onload = () => beginAnalysisSequence(reader.result as string); reader.readAsDataURL(file);
  }, [beginAnalysisSequence]);

  const showLiveCamera = stream && !uploadFallback && afterCapture === "setup";
  const showUploadPanel = afterCapture === "setup" && (uploadFallback || !stream) && !isStartingCamera;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030306] text-zinc-100 font-sans">
      <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" aria-hidden tabIndex={-1} onChange={onFileSelected} />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[min(100%,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),transparent)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 right-[-10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.12),transparent)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-[-10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(52,211,153,0.1),transparent)] blur-3xl" aria-hidden />

      {/* 🌟 নতুন হেডার সেকশন 🌟 */}
      <header className="relative z-40 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-8">
        <span className="text-lg font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-cyan-200 to-emerald-300 bg-clip-text text-transparent uppercase tracking-tighter">GlowAI</span>
        </span>

        <div className="flex items-center gap-4">
          {!isLoaded && <span className="text-zinc-500 text-sm animate-pulse">Loading Gateway...</span>}
          {isLoaded && !isSignedIn && (
            <SignInButton>
              <button className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer px-6 py-2 border border-cyan-400/20 rounded-full bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                Sign In
              </button>
            </SignInButton>
          )}
          {isLoaded && isSignedIn && (
            <>
              <button onClick={() => router.push("/dashboard")} className="hidden sm:block px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer">
                Go to Dashboard
              </button>
              <UserButton />
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16 pt-8 sm:px-8">
        <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          AI skincare analysis
        </p>
        <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
          See your skin clearly.
          <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-emerald-200 to-teal-300 bg-clip-text text-transparent">Act with confidence.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          GlowAI reads texture, tone, and trouble spots from a single scan—then turns insight into a routine that actually fits your face.
        </p>
        <div className="mt-12 flex flex-col items-start gap-3">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button type="button" onClick={() => router.push("/scanner")} className="group relative inline-flex cursor-pointer items-center justify-center rounded-full px-10 py-4 text-base font-semibold text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80">
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 opacity-70 blur-xl transition group-hover:opacity-90" aria-hidden />
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 shadow-[0_0_32px_rgba(34,211,238,0.45),0_0_64px_rgba(52,211,153,0.25)]" aria-hidden />
              <span className="relative">Scan Your Face</span>
            </button>
          </div>
          <button type="button" onClick={() => router.push("/upload")} className="text-sm text-cyan-400/90 underline-offset-4 transition hover:text-cyan-300 hover:underline">
            Don't have a camera? Upload instead
          </button>
        </div>
      </main>

      <footer className="relative z-10 mt-auto py-8 text-center border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <p className="text-[10px] tracking-widest uppercase text-zinc-600">© 2026 GlowAI — Aesthetic Intelligence</p>
        <p className="mt-2 mx-auto max-w-xs text-[9px] leading-relaxed text-zinc-500 px-6">Glow AI provides cosmetic routines based on AI analysis, not medical advice. Consult a dermatologist for clinical skin conditions.</p>
      </footer>

      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2 py-3 sm:p-6" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={closeScanner} />
          <div className="relative z-10 w-full max-w-[min(100%,calc(100vw-1rem))] sm:max-w-md md:max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur-xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Biometric Facial Mapping</h2>
              <button type="button" onClick={closeScanner} className="rounded-full p-2 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {afterCapture === "setup" && (
                <div className="animate-in fade-in duration-500">
                  <div className="relative mx-auto aspect-[3/4] w-full max-h-[60vh] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
                    {isStartingCamera && !uploadFallback && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-900/90">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-400" />
                        <p className="text-xs font-bold text-cyan-400 tracking-widest uppercase animate-pulse mt-2">Calibrating lenses…</p>
                      </div>
                    )}
                    {showLiveCamera && <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover object-center" playsInline muted autoPlay />}
                    {showUploadPanel && !showLiveCamera && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.08),#09090b)] p-8 text-center">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative inline-flex min-w-[220px] items-center justify-center rounded-full px-8 py-4 text-sm font-bold text-slate-950 bg-white hover:scale-[1.02] transition-transform">Upload Front-Facing Photo</button>
                      </div>
                    )}
                  </div>
                  {showLiveCamera && (
                    <div className="mt-5 flex flex-col gap-3">
                      <button type="button" onClick={takePhoto} className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/20 shadow-lg">Capture Biometrics</button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-center text-xs text-cyan-400/90 hover:underline uppercase tracking-wider mt-2">Or upload file</button>
                    </div>
                  )}
                </div>
              )}

              {afterCapture === "quiz" && (
                <div className="py-6 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="mb-8 px-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2"><span>Scan Status: Processing</span><span>Step {quizStep} of 2</span></div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500" style={{ width: `${(quizStep/2)*100}%` }} /></div>
                   </div>
                   {quizStep === 1 ? (
                     <div className="space-y-5">
                        <h3 className="text-xl font-bold text-white tracking-tight">What is your primary skin concern?</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {["Acne & Blemishes", "Fine Lines & Wrinkles", "Dark Spots & Pigmentation", "Dryness & Texture"].map((opt) => (
                            <button key={opt} onClick={nextQuizStep} className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/50 hover:bg-white/10"><span className="relative z-10 text-sm font-medium text-zinc-300 group-hover:text-white">{opt}</span></button>
                          ))}
                        </div>
                     </div>
                   ) : (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="text-xl font-bold text-white tracking-tight">How does your skin feel by midday?</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {["Oily or Shiny", "Tight and Dry", "Oily on T-Zone only", "Balanced and Normal"].map((opt) => (
                          <button key={opt} onClick={nextQuizStep} className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/50 hover:bg-white/10"><span className="relative z-10 text-sm font-medium text-zinc-300 group-hover:text-white">{opt}</span></button>
                        ))}
                      </div>
                    </div>
                   )}
                </div>
              )}

              {afterCapture === "analyzing" && (
                <div className="py-12 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                   <div className="relative h-24 w-24">
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10" />
                      <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                      <div className="absolute inset-4 rounded-full border-b-4 border-emerald-400 animate-reverse-spin" />
                   </div>
                   <div className="text-center space-y-3">
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 animate-pulse transition-all duration-500 h-6">{HYPE_STEPS[hypeIndex]}</p>
                      <p className="text-xs text-zinc-500">Our neural network is mapping your facial features...</p>
                   </div>
                </div>
              )}

              {afterCapture === "result" && capturedImage && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="relative overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 flex justify-center max-h-[30vh] aspect-[4/3] w-2/3 mx-auto mt-2">
                    <img src={capturedImage} alt="Your scan" className="w-full h-full object-cover opacity-50 grayscale" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent"></div>
                  </div>
                  <div className="-mt-12 relative z-10 space-y-5">
                    {analysisError ? (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center"><p className="text-sm text-red-300">{analysisError}</p></div>
                    ) : (
                      <>
                        {skinAnalysis?.score !== undefined ? (
                          <div className="space-y-6">
                             <div className="flex flex-col items-center justify-center">
                                <div className="relative flex items-center justify-center bg-zinc-950 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.15)] p-2">
                                  <svg className="w-36 h-36 transform -rotate-90">
                                      <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                                      <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={2 * Math.PI * 64} strokeDashoffset={(2 * Math.PI * 64) - ((skinAnalysis.score / 10) * (2 * Math.PI * 64))} className="text-cyan-400 transition-all duration-[2000ms] ease-out drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                                  </svg>
                                  <div className="absolute flex flex-col items-center"><span className="text-4xl font-black text-white tracking-tighter">{skinAnalysis.score}</span><span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mt-1">Rating</span></div>
                                </div>
                             </div>
                             <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl shadow-inner">
                                <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>Initial Detection</h3>
                                <ul className="space-y-4">
                                   {skinAnalysis.basic_flaws?.map((flaw, idx) => (
                                     <li key={idx} className="flex items-center gap-3 text-sm text-zinc-300 font-medium"><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>{flaw}</li>
                                   ))}
                                </ul>
                             </div>
                             <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-1 mt-6 shadow-[0_0_20px_rgba(245,158,11,0.1)] group cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                <div className="bg-zinc-950/80 rounded-xl p-5 backdrop-blur-sm h-full w-full">
                                   <div className="flex justify-between items-center mb-4 relative z-10">
                                      <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2"><svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>Geometry & Ratio Map</h3>
                                      <span className="px-2 py-1 rounded bg-amber-500/20 text-[9px] text-amber-300 font-bold tracking-widest border border-amber-500/30">LOCKED</span>
                                   </div>
                                   <div className="relative h-44 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                      <img src={capturedImage} alt="Symmetry" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[4px] grayscale transition-all duration-700 group-hover:blur-[2px]" />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-60"><div className="w-[1px] h-full bg-cyan-400/50"></div><div className="h-[1px] w-full bg-cyan-400/50 absolute"></div><div className="w-28 h-36 border border-amber-400/40 rounded-[40%] absolute"></div><div className="w-16 h-20 border border-emerald-400/30 rounded-full absolute -translate-y-6"></div><div className="w-full h-[1px] bg-amber-500/40 absolute translate-y-8"></div></div>
                                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center"><div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(251,191,36,0.3)]"><svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><span className="text-[10px] text-zinc-300 font-bold tracking-widest uppercase">Facial Geometry Hidden</span></div>
                                   </div>
                                </div>
                             </div>
                             <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-cyan-900/30 via-zinc-950 to-zinc-950 p-1 border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)] text-center mt-8">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/20 blur-[60px] rounded-full pointer-events-none"></div>
                                <div className="p-6 pt-8">
                                  <div className="relative w-32 h-32 mx-auto mb-6 group cursor-pointer">
                                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-pulse blur-xl"></div>
                                    <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-emerald-400/50 relative z-10 bg-black">
                                      <img src={capturedImage} className="w-full h-full object-cover saturate-200 brightness-125 blur-[6px] scale-110 transition-all duration-700 group-hover:blur-[3px]" />
                                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><svg className="w-8 h-8 text-white/60 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm3 7H7V7a3 3 0 016 0v2z" /></svg></div>
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-emerald-400 to-cyan-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest z-20 shadow-[0_4px_15px_rgba(52,211,153,0.5)]">9.5/10 POTENTIAL</div>
                                  </div>
                                  <h3 className="text-xl font-extrabold text-white mb-2 bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">Reveal Your Potential Face</h3>
                                  <p className="text-xs text-zinc-400 mb-6 leading-relaxed px-2">Unlock your personalized 30-Day Glow-Up Plan, view your full symmetry report, and reveal your highest aesthetic potential.</p>
                                  <div className="mb-6 border-t border-white/5 pt-5 text-left">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Deep Aesthetic Analysis</h4>
                                    <div className="space-y-3 blur-[4px] opacity-40 select-none pointer-events-none">
                                        <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-3/4"></div></div>
                                        <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-5/6"></div></div>
                                        <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-2/3"></div></div>
                                    </div>
                                  </div>
                                  <button onClick={handleUnlockDashboard} className="group relative inline-flex w-full items-center justify-center rounded-2xl py-4 text-sm font-black text-slate-950 transition-all hover:scale-[1.02] active:scale-[0.98]"><span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-bg-pan opacity-100" /><span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.6)] blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-500" /><span className="relative flex items-center gap-2 uppercase tracking-widest">Unlock Everything - $9.99</span></button>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5">
                             <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90 mb-3">Your Aesthetic Profile</h3>
                             <div className="max-h-[min(280px,45vh)] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">{skinAnalysis?.raw}</div>
                             <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                               <p className="text-sm font-medium text-emerald-200/90">Want the 30-Day Glow-Up Blueprint?</p><p className="text-xs text-zinc-500">Unlock step-by-step AM/PM routines and product suggestions.</p>
                               <button onClick={handleUnlockDashboard} className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(52,211,153,0.25)] hover:brightness-110">$9.99 Unlock Report</button>
                             </div>
                          </div>
                        )}
                        <p className="mt-8 pb-4 text-center text-[9px] leading-relaxed text-zinc-600 px-4">Glow AI provides cosmetic routines based on AI analysis, not medical advice. Consult a dermatologist for clinical skin conditions.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-reverse-spin { animation: reverse-spin 1s linear infinite; }
        @keyframes bg-pan { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .animate-bg-pan { animation: bg-pan 3s linear infinite; }
      `}</style>
    </div>
  );
}