"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AfterCapturePhase = "setup" | "analyzing" | "payment";

async function hasVideoInputDevice(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return true;
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((d) => d.kind === "videoinput");
  } catch {
    return true;
  }
}

export default function Home() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [uploadFallback, setUploadFallback] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [afterCapture, setAfterCapture] = useState<AfterCapturePhase>("setup");

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopStream = useCallback(() => {
    setStream((prev) => {
      prev?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  const clearAnalysisTimer = useCallback(() => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  }, []);

  const closeScanner = useCallback(() => {
    clearAnalysisTimer();
    stopStream();
    setScannerOpen(false);
    setCameraError(null);
    setIsStartingCamera(false);
    setUploadFallback(false);
    setCapturedImage(null);
    setAfterCapture("setup");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [clearAnalysisTimer, stopStream]);

  const beginAnalysisSequence = useCallback(
    (dataUrl: string) => {
      clearAnalysisTimer();
      stopStream();
      setCapturedImage(dataUrl);
      setAfterCapture("analyzing");
      analysisTimerRef.current = setTimeout(() => {
        setAfterCapture("payment");
        analysisTimerRef.current = null;
      }, 3000);
    },
    [clearAnalysisTimer, stopStream],
  );

  const openScannerUploadOnly = useCallback(() => {
    clearAnalysisTimer();
    setScannerOpen(true);
    setCameraError(null);
    setStream(null);
    setIsStartingCamera(false);
    setUploadFallback(true);
    setCapturedImage(null);
    setAfterCapture("setup");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [clearAnalysisTimer]);

  const openScannerWithCamera = useCallback(async () => {
    clearAnalysisTimer();
    setScannerOpen(true);
    setCameraError(null);
    setCapturedImage(null);
    setAfterCapture("setup");
    setUploadFallback(false);
    setIsStartingCamera(true);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const canTryCamera =
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

    if (!canTryCamera) {
      setCameraError("Camera API not available in this environment.");
      setUploadFallback(true);
      setIsStartingCamera(false);
      return;
    }

    const hasCamera = await hasVideoInputDevice();
    if (!hasCamera) {
      setCameraError("No camera was detected on this device.");
      setUploadFallback(true);
      setIsStartingCamera(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn’t access your camera. Check permissions or try upload.";
      setCameraError(message);
      setUploadFallback(true);
    } finally {
      setIsStartingCamera(false);
    }
  }, [clearAnalysisTimer]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    el.play().catch(() => {});
    return () => {
      el.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    if (!scannerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeScanner();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [scannerOpen, closeScanner]);

  useEffect(() => {
    return () => clearAnalysisTimer();
  }, [clearAnalysisTimer]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    beginAnalysisSequence(canvas.toDataURL("image/jpeg", 0.92));
  }, [beginAnalysisSequence]);

  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        beginAnalysisSequence(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [beginAnalysisSequence],
  );

  const showLiveCamera = stream && !uploadFallback && afterCapture === "setup";
  const showUploadPanel =
    afterCapture === "setup" && (uploadFallback || !stream) && !isStartingCamera;
  const showResultStages = afterCapture === "analyzing" || afterCapture === "payment";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030306] text-zinc-100">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onFileSelected}
      />

      {/* Ambient glow + grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[min(100%,900px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),transparent)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 right-[-10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.12),transparent)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-[-10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,rgba(52,211,153,0.1),transparent)] blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-8">
        <span className="text-lg font-semibold tracking-tight">
          <span className="bg-linear-to-r from-cyan-200 to-emerald-300 bg-clip-text text-transparent">
            GlowAI
          </span>
        </span>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="#how" className="transition hover:text-zinc-200">
            How it works
          </a>
          <a href="#trust" className="transition hover:text-zinc-200">
            Science
          </a>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-8 sm:px-8">
        <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          AI skincare analysis
        </p>

        <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
          See your skin clearly.
          <span className="mt-2 block bg-linear-to-r from-cyan-200 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
            Act with confidence.
          </span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          GlowAI reads texture, tone, and trouble spots from a single scan—then
          turns insight into a routine that actually fits your face.
        </p>

        <div className="mt-12 flex flex-col items-start gap-3">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={openScannerWithCamera}
              className="group relative inline-flex cursor-pointer items-center justify-center rounded-full px-10 py-4 text-base font-semibold text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030306]"
            >
              <span
                className="absolute inset-0 rounded-full bg-linear-to-r from-cyan-400 via-emerald-400 to-teal-400 opacity-70 blur-xl transition group-hover:opacity-90"
                aria-hidden
              />
              <span
                className="absolute inset-0 rounded-full bg-linear-to-r from-cyan-400 via-emerald-400 to-teal-400 shadow-[0_0_32px_rgba(34,211,238,0.45),0_0_64px_rgba(52,211,153,0.25)]"
                aria-hidden
              />
              <span className="relative">Scan Your Face</span>
            </button>
            <p className="max-w-xs text-sm text-zinc-500">
              Private by design. No photos stored without your consent.
            </p>
          </div>
          <button
            type="button"
            onClick={openScannerUploadOnly}
            className="text-sm text-cyan-400/90 underline-offset-4 transition hover:text-cyan-300 hover:underline"
          >
            Don&apos;t have a camera? Upload instead
          </button>
        </div>

        <section
          id="how"
          className="mt-24 grid gap-8 border-t border-white/10 pt-16 sm:grid-cols-3"
        >
          {[
            {
              title: "Scan",
              body: "Guided capture in soft light for consistent results.",
            },
            {
              title: "Analyze",
              body: "Models map hydration, redness, texture, and more.",
            },
            {
              title: "Glow",
              body: "Get a concise routine with ingredients that matter.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                {item.title}
              </h2>
              <p className="mt-2 text-zinc-400">{item.body}</p>
            </div>
          ))}
        </section>

        <p id="trust" className="mt-16 text-center text-sm text-zinc-600">
          GlowAI — dermatology-inspired signals, not a medical diagnosis.
        </p>
      </main>

      {/* Scanner modal */}
      {scannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scanner-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            aria-label="Close scanner"
            onClick={closeScanner}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 id="scanner-title" className="text-lg font-semibold text-white">
                Face scan
              </h2>
              <button
                type="button"
                onClick={closeScanner}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {/* Setup: live camera or upload */}
              {afterCapture === "setup" && (
                <>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                    {isStartingCamera && !uploadFallback && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900/90">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                        <p className="text-sm text-zinc-400">Requesting camera access…</p>
                      </div>
                    )}

                    {showLiveCamera && (
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        playsInline
                        muted
                        autoPlay
                      />
                    )}

                    {showUploadPanel && !showLiveCamera && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.08),#09090b)] p-8 text-center">
                        {cameraError && (
                          <p className="max-w-xs text-xs text-zinc-500">{cameraError}</p>
                        )}
                        <p className="text-sm font-medium text-zinc-300">
                          {uploadFallback
                            ? "Use a clear, front-facing photo for best results."
                            : ""}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="group relative inline-flex min-w-[220px] items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                        >
                          <span
                            className="absolute inset-0 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 opacity-80 blur-lg transition group-hover:opacity-100"
                            aria-hidden
                          />
                          <span
                            className="absolute inset-0 rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_28px_rgba(168,85,247,0.35)]"
                            aria-hidden
                          />
                          <span className="relative">Upload Photo</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showLiveCamera && (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={takePhoto}
                        className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                      >
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-center text-xs text-cyan-400/90 underline-offset-2 hover:underline sm:text-left"
                      >
                        Or upload from files
                      </button>
                    </div>
                  )}

                  {showUploadPanel && !showLiveCamera && (
                    <p className="mt-4 text-center text-xs text-zinc-500">
                      JPG, PNG, or WebP · Press Esc to close
                    </p>
                  )}
                </>
              )}

              {/* Photo + analyzing / payment */}
              {showResultStages && capturedImage && (
                <div className="space-y-5">
                  <div className="relative overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
                    <img
                      src={capturedImage}
                      alt="Your scan"
                      className="max-h-[min(360px,50vh)] w-full object-contain"
                    />
                    {afterCapture === "analyzing" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/65 backdrop-blur-[2px]">
                        <div className="flex gap-1.5" aria-hidden>
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                        <p className="text-sm font-medium tracking-wide text-white">
                          AI Analyzing…
                        </p>
                        <p className="max-w-[240px] text-center text-xs text-zinc-400">
                          Mapping tone, texture, and zones
                        </p>
                      </div>
                    )}
                  </div>

                  {afterCapture === "payment" && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                      <p className="text-sm font-medium text-emerald-200/90">
                        Your snapshot is ready
                      </p>
                      <p className="text-xs text-zinc-500">
                        Unlock the full AI report and personalized routine.
                      </p>
                      <a
                        href="https://gumroad.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(52,211,153,0.25)] transition hover:brightness-110 sm:max-w-xs"
                      >
                        $9.99 Unlock Report
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
