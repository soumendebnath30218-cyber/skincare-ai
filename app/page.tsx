"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, Activity, TrendingUp, Lock, CheckCircle2, ArrowRight, X, XCircle, Info } from "lucide-react";

// ==========================================
// 🌟 INLINE COMPONENTS 🌟
// ==========================================

function Footer() {
  return (
    <footer className="relative z-10 w-full bg-black/80 backdrop-blur-xl text-gray-400 py-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm">
        <p className="mb-6 text-xs text-gray-500">
          Disclaimer: The AI analysis and skincare routines provided by GlowryAI are for informational and natural wellness purposes only. This is not medical advice. Please consult a certified dermatologist for severe skin conditions.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <Link className="hover:text-[#39ff14] transition-colors" href="/public-privacy">Privacy Policy</Link>
          <Link className="hover:text-[#39ff14] transition-colors" href="/terms">Terms of Service</Link>
          <a href="mailto:support@yourdomain.com" className="hover:text-[#39ff14] transition-colors">Contact Us</a>
        </div>
        <p>© {new Date().getFullYear()} GlowryAI. All rights reserved.</p>
      </div>
    </footer>
  );
}

function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setShowBanner(true);
  }, []);
  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowBanner(false);
  };
  if (!showBanner) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-white/10 p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-300 text-sm text-center sm:text-left">
          We use cookies to improve your experience. By continuing, you agree to our <Link className="text-[#39ff14] underline hover:text-green-400" href="/public-privacy">Privacy Policy</Link>.
        </p>
        <button onClick={handleAccept} className="bg-[#39ff14] text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-green-500 transition-all hover:scale-105 whitespace-nowrap shadow-[0_0_15px_rgba(57,255,20,0.4)]">
          Got it!
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 🌟 THREE.JS 3D ANIMATED BACKGROUND 🌟
// ==========================================

function ThreeJSBackground() {
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = threeCanvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    script.onload = () => {
      const THREE = (window as any).THREE;
      if (!THREE) return;

      const W = window.innerWidth;
      const H = window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
      camera.position.set(0, 0, 5);

      const mouse = { x: 0, y: 0 };
      const onMouseMove = (e: MouseEvent) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener("mousemove", onMouseMove);

      const particleCount = 350;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const colorPalette = [
        new THREE.Color(0x34d399),
        new THREE.Color(0x22d3ee),
        new THREE.Color(0x06b6d4),
        new THREE.Color(0xa78bfa),
        new THREE.Color(0x2dd4bf),
      ];
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 18;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3]     = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const pMat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      const lineMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.07 });
      const lineGroup = new THREE.Group();
      for (let j = 0; j < 70; j++) {
        const i1 = Math.floor(Math.random() * particleCount);
        const i2 = Math.floor(Math.random() * particleCount);
        const lGeo = new THREE.BufferGeometry();
        lGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
          positions[i1*3], positions[i1*3+1], positions[i1*3+2],
          positions[i2*3], positions[i2*3+1], positions[i2*3+2],
        ]), 3));
        lineGroup.add(new THREE.Line(lGeo, lineMat));
      }
      scene.add(lineGroup);

      const orbDefs = [
        { x: -3, y: 2,  z: -3, color: 0x34d399, size: 0.45, speed: 0.4, phase: 0 },
        { x: 4,  y: -1, z: -2, color: 0x22d3ee, size: 0.32, speed: 0.3, phase: 1.2 },
        { x: 0,  y: -3, z: -4, color: 0xa78bfa, size: 0.55, speed: 0.5, phase: 2.5 },
        { x: -5, y: 0,  z: -5, color: 0x2dd4bf, size: 0.28, speed: 0.6, phase: 0.7 },
      ];
      const orbs: any[] = [];
      orbDefs.forEach(d => {
        const geo = new THREE.SphereGeometry(d.size, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(d.x, d.y, d.z);
        mesh.userData = { ox: d.x, oy: d.y, speed: d.speed, phase: d.phase };
        scene.add(mesh);

        const rGeo = new THREE.RingGeometry(d.size + 0.06, d.size + 0.18, 32);
        const rMat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.position.set(d.x, d.y, d.z);
        mesh.userData.ring = ring;
        scene.add(ring);
        orbs.push(mesh);
      });

      const torusGeo = new THREE.TorusGeometry(2, 0.015, 8, 120);
      const torusMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.13 });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.position.set(3.5, -0.5, -3);
      torus.rotation.x = Math.PI / 3;
      scene.add(torus);

      const torus2Geo = new THREE.TorusGeometry(1.4, 0.01, 8, 80);
      const torus2Mat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.1 });
      const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
      torus2.position.set(-4, 1.5, -4);
      torus2.rotation.y = Math.PI / 4;
      scene.add(torus2);

      let animId: number;
      let startTime = performance.now();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = (performance.now() - startTime) / 1000;

        particles.rotation.y = t * 0.04;
        particles.rotation.x = t * 0.018;
        lineGroup.rotation.y = t * 0.04;
        lineGroup.rotation.x = t * 0.018;

        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
        camera.position.y += (mouse.y * 0.35 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        orbs.forEach(orb => {
          const d = orb.userData;
          orb.position.y = d.oy + Math.sin(t * d.speed + d.phase) * 0.6;
          orb.position.x = d.ox + Math.cos(t * d.speed * 0.7 + d.phase) * 0.35;
          if (d.ring) {
            d.ring.position.copy(orb.position);
            d.ring.rotation.z = t * 0.5;
          }
        });

        torus.rotation.z  = t * 0.15;
        torus.rotation.x  = Math.PI / 3 + Math.sin(t * 0.2) * 0.12;
        torus2.rotation.z = -t * 0.1;
        torus2.rotation.x = t * 0.08;

        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const nW = window.innerWidth;
        const nH = window.innerHeight;
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
      };
      window.addEventListener("resize", onResize);

      (canvas as any).__threeCleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    };
    document.head.appendChild(script);

    return () => {
      if ((canvas as any).__threeCleanup) (canvas as any).__threeCleanup();
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <canvas
      ref={threeCanvasRef}
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

function ThreeDBackground() {
  return (
    <>
      <video
        autoPlay loop muted playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-20 pointer-events-none mix-blend-screen"
      >
        <source src="/3d-bg.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full"
          style={{ background: "radial-gradient(circle at 40% 40%, rgba(52,211,153,0.14) 0%, rgba(6,182,212,0.08) 40%, transparent 70%)", animation: "orb1 18s ease-in-out infinite alternate", filter: "blur(70px)" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: "radial-gradient(circle at 60% 60%, rgba(168,85,247,0.12) 0%, rgba(34,211,238,0.06) 50%, transparent 70%)", animation: "orb2 22s ease-in-out infinite alternate", filter: "blur(90px)" }} />
        <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.09) 0%, transparent 60%)", animation: "orb3 14s ease-in-out infinite alternate", filter: "blur(60px)" }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(52,211,153,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.8) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)" }} />
      </div>
      <div className="fixed inset-0 bg-black/55 z-0 pointer-events-none" aria-hidden="true" />
    </>
  );
}

function FloatingBeautyElements() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <div key={i}
          className="absolute rounded-full"
          style={{
            width: `${6 + i * 3}px`,
            height: `${6 + i * 3}px`,
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`,
            background: i % 2 === 0
              ? "radial-gradient(circle, rgba(52,211,153,0.9), rgba(34,211,238,0.4))"
              : "radial-gradient(circle, rgba(168,85,247,0.8), rgba(34,211,238,0.3))",
            boxShadow: i % 2 === 0
              ? "0 0 20px rgba(52,211,153,0.6), 0 0 40px rgba(52,211,153,0.2)"
              : "0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)",
            animation: `floatDot${i % 3} ${5 + i * 1.2}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }} />
      ))}
      <div className="absolute top-0 left-[-20%] w-[1px] h-[130%] origin-top-left"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(52,211,153,0.3) 40%, rgba(34,211,238,0.15) 70%, transparent 100%)",
          transform: "rotate(25deg)",
          animation: "streak 8s ease-in-out infinite",
        }} />
      <div className="absolute top-0 right-[10%] w-[1px] h-[130%] origin-top-right"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(168,85,247,0.2) 40%, rgba(34,211,238,0.1) 70%, transparent 100%)",
          transform: "rotate(-18deg)",
          animation: "streak 11s ease-in-out infinite",
          animationDelay: "3s",
        }} />
    </div>
  );
}

// ==========================================
// 🌟 SNEAK PEEK SECTION 🌟
// ==========================================

function SneakPeekSection({ onOpenPricing, onCheckout }: { onOpenPricing: () => void, onCheckout: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-center py-20 border-t border-white/5 bg-black/40 backdrop-blur-sm overflow-hidden pointer-events-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 uppercase tracking-widest backdrop-blur-md shadow-lg">
            <Lock className="w-3 h-3 text-emerald-400"/> Unlock the Pro Experience
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter italic drop-shadow-lg">
            YOUR AESTHETIC <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">COMMAND CENTER</span>
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            Stop guessing. Start tracking. Go PRO to unlock a personalized 30-Day Master Plan, daily AI analysis, and deep biometric tracking.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 perspective-[1000px]">
          {/* CARD 1 */}
          <div className="group relative flex flex-col rounded-[2rem] bg-zinc-950/80 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:border-emerald-500/50 hover:shadow-[0_0_50px_rgba(16,185,129,0.2)] hover:-translate-y-2 cursor-default overflow-hidden">
            <div className="relative h-60 w-full bg-[#09090b]/80 border-b border-white/5 p-6 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full transition-transform group-hover:scale-125"></div>
              <div className="relative z-10 flex items-center gap-6 transition-transform duration-700 group-hover:scale-105">
                <div className="relative flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-zinc-800" />
                    <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="289" strokeDashoffset="43" className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
                  </svg>
                  <div className="absolute flex flex-col items-center mt-1">
                    <span className="text-3xl font-black text-white tracking-tighter">8.5</span>
                    <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-emerald-400 mt-1">Glow Index</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Symmetry</div>
                    <div className="text-base font-black text-white">92.0<span className="text-[10px] text-zinc-500">%</span></div>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-lg">
                    <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Golden Ratio</div>
                    <div className="text-base font-black text-white">1.62</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Activity className="w-5 h-5" /></div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Deep Biometrics</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">Track your exact Glow Index, facial symmetry (Golden Ratio), and melanin evenness with beautiful live charts.</p>
              <ul className="space-y-2 text-xs text-zinc-400 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80"/> Facial Symmetry Analysis</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/80"/> Golden Ratio Measurements</li>
              </ul>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="group relative flex flex-col rounded-[2rem] bg-zinc-950/80 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_50px_rgba(6,182,212,0.2)] hover:-translate-y-2 cursor-default overflow-hidden lg:-mt-8">
            <div className="absolute top-0 right-8 px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-[10px] font-black uppercase tracking-widest rounded-b-lg z-20 shadow-lg">Most Popular</div>
            <div className="relative h-60 w-full bg-[#09090b]/80 border-b border-white/5 p-6 flex flex-col justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/15 blur-[60px] rounded-full transition-transform group-hover:scale-150"></div>
              <div className="relative z-10 space-y-3 w-full">
                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/30 p-4 rounded-2xl flex items-start gap-4 transform transition-all duration-500 group-hover:translate-x-2 shadow-lg backdrop-blur-sm">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)] animate-pulse shrink-0"></div>
                  <div>
                    <div className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">Morning</div>
                    <div className="text-sm font-bold text-white mb-1 tracking-tight">Raw Honey Cleanser</div>
                    <div className="text-[11px] text-cyan-100/60 leading-tight">Naturally antibacterial, cleanses without stripping natural oils.</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-4 opacity-50 transform transition-all duration-500 group-hover:translate-x-4 backdrop-blur-sm">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-zinc-600 shrink-0"></div>
                  <div>
                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Afternoon</div>
                    <div className="text-sm font-bold text-zinc-300 tracking-tight">Cucumber Facial Mist</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"><Sparkles className="w-5 h-5" /></div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">AI Daily Protocol</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">Get a 100% natural 30-Day Master Plan featuring step-by-step homemade skincare routines and healing diets.</p>
              <ul className="space-y-2 text-xs text-zinc-400 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-500/80"/> Step-by-step preparation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-500/80"/> Healing Diet Plan</li>
              </ul>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="group relative flex flex-col rounded-[2rem] bg-zinc-950/80 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:border-purple-500/50 hover:shadow-[0_0_50px_rgba(168,85,247,0.2)] hover:-translate-y-2 cursor-default overflow-hidden">
            <div className="relative h-60 w-full bg-[#09090b]/80 border-b border-white/5 p-6 flex flex-col justify-end overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-purple-500/15 blur-[60px] rounded-full -translate-x-1/2 transition-transform group-hover:scale-125"></div>
              <div className="relative z-10 w-full h-28 mt-auto transition-transform duration-700 group-hover:scale-[1.02] group-hover:-translate-y-1">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                  <path d="M0,35 L10,32 L20,33 L30,18 L40,22 L50,12 L60,15 L75,5 L85,8 L100,2 L100,40 L0,40 Z" fill="url(#area-gradient)" />
                  <path d="M0,35 L10,32 L20,33 L30,18 L40,22 L50,12 L60,15 L75,5 L85,8 L100,2" fill="none" stroke="url(#line-gradient)" strokeWidth="1.5" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <circle cx="100" cy="2" r="2" fill="#2dd4bf" className="shadow-[0_0_15px_rgba(45,212,191,1)] animate-pulse" />
                </svg>
              </div>
              <div className="relative z-10 flex justify-between mt-3 border-t border-white/10 pt-3">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Day 1</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Day 15</span>
                <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest drop-shadow-md">Day 30</span>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400"><TrendingUp className="w-5 h-5" /></div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Evolution Tracker</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">Visualize your 30-day journey trajectory, track active scan streaks, and unlock exclusive aesthetic badges.</p>
              <ul className="space-y-2 text-xs text-zinc-400 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500/80"/> Live Trajectory Area Chart</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500/80"/> Premium Achievement Badges</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 🌟 ACTION BUTTONS (UPGRADE & COMPARE) 🌟 */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
          <button onClick={onCheckout} className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            Upgrade to Pro <ArrowRight className="w-4 h-4"/>
          </button>
          
          <button 
            onClick={onOpenPricing}
            className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900/60 border border-white/10 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-full hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-md"
          >
            Compare Plans <Info className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 🌟 TYPES & CONSTANTS 🌟
// ==========================================

type AfterCapturePhase = "setup" | "quiz" | "analyzing" | "result";
type AnalyzeSkinResponse = { analysis?: string; error?: string; success?: boolean };
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
    let cleanText = rawText.replace(/\x60\x60\x60json/gi, "").replace(/\x60\x60\x60/g, "").trim();
    const parsed = JSON.parse(cleanText);
    if (parsed.score && parsed.basic_flaws) return parsed;
    return { raw: rawText };
  } catch (e) { return { raw: rawText }; }
}

// ==========================================
// 🌟 MAIN HOME COMPONENT 🌟
// ==========================================

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
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
  const [heroVisible, setHeroVisible] = useState(false);
  
  const [showPricing, setShowPricing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🌟 DODO PAYMENTS CHECKOUT FUNCTION 🌟
  const handleCheckout = async () => {
    try {
      console.log("Requesting payment link...");
      
      const userEmail = user?.primaryEmailAddress?.emailAddress || 'test@glowryai.com';
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }), 
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; 
      } else {
        console.error("Error connecting to Dodo:", data);
        alert("Payment link generation failed. Check console.");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };

  // 🌟 AUTO-CHECKOUT MAGIC 🌟
  useEffect(() => {
    if (isLoaded && isSignedIn && typeof window !== "undefined" && window.location.search.includes("checkout=true")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (user?.publicMetadata?.isPro) {
        router.push("/dashboard");
      } else {
        handleCheckout();
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // 🌟 MASTER UPGRADE FUNCTION 🌟
  const triggerProUpgrade = () => {
    setShowPricing(false); 
    if (!isSignedIn) {
      openSignIn({ 
        forceRedirectUrl: "/checkout-redirect",
        signUpForceRedirectUrl: "/checkout-redirect"
      });
    } else {
      if (user?.publicMetadata?.isPro) {
        router.push("/dashboard");
      } else {
        handleCheckout();
      }
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

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
      const res = await fetch("/api/analyze-skin", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ image: payload }), 
        signal: ac.signal 
      });
      
      const data = await res.json();
      if (ac.signal.aborted) return;
      
      if (!res.ok || data.success === false) {
        setAnalysisError(data.error || SKIN_ANALYSIS_FAILURE_MESSAGE);
        setIsAnalyzing(false);
        setAfterCapture("result"); 
        return;
      }
      
      if (!data.analysis) {
        setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
        setIsAnalyzing(false);
        setAfterCapture("result");
        return;
      }

      setSkinAnalysis(parseAnalysisData(JSON.stringify(data.analysis)));
    } catch (e) { 
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setAnalysisError(SKIN_ANALYSIS_FAILURE_MESSAGE);
      }
    } finally { 
      setIsAnalyzing(false); 
    }
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
        openSignIn({ 
          forceRedirectUrl: "/checkout-redirect",
          signUpForceRedirectUrl: "/checkout-redirect"
        }); 
      }
      else { triggerProUpgrade(); }
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
    if (!scannerOpen && !showPricing) return; 
    const onKeyDown = (e: KeyboardEvent) => { 
      if (e.key === "Escape") {
        if(scannerOpen) closeScanner(); 
        if(showPricing) setShowPricing(false);
      }
    }; 
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = prevOverflow; };
  }, [scannerOpen, closeScanner, showPricing]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;
    let particles: { x: number; y: number; radius: number; vx: number; vy: number; z: number }[] = [];
    const particleCount = 80;
    let mouse = { x: -1000, y: -1000 };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; initParticles(); };
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, z: Math.random() * 100 });
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        const dx = mouse.x - p.x; const dy = mouse.y - p.y; const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) { p.x -= dx * 0.01; p.y -= dy * 0.01; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${0.4 + (p.z / 300)})`; ctx.fill();
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j]; const dx2 = p.x - p2.x; const dy2 = p.y - p2.y; const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (distance2 < 120) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = `rgba(52, 211, 153, ${0.6 - distance2 / 120})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseLeave = () => { mouse.x = -1000; mouse.y = -1000; };
    window.addEventListener("resize", resize); window.addEventListener("mousemove", handleMouseMove); window.addEventListener("mouseleave", handleMouseLeave);
    resize(); draw();
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseleave", handleMouseLeave); cancelAnimationFrame(animationFrameId); };
  }, []);

  const showLiveCamera = stream && !uploadFallback && afterCapture === "setup";
  const showUploadPanel = afterCapture === "setup" && (uploadFallback || !stream) && !isStartingCamera;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030306] text-zinc-100 font-sans">

      <ThreeJSBackground />
      <ThreeDBackground />
      <FloatingBeautyElements />

      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 w-full h-full pointer-events-none opacity-60 mix-blend-screen"
        aria-hidden="true"
      />

      <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" aria-hidden tabIndex={-1} onChange={onFileSelected} />

      {/* =================== HEADER =================== */}
      <header className="relative z-40 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-8"
        style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(-20px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
        <span className="text-lg font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-cyan-200 to-emerald-300 bg-clip-text text-transparent tracking-tighter font-bold drop-shadow-md">GlowryAI</span>
        </span>
        <div className="flex items-center gap-4">
          {!isLoaded && <span className="text-zinc-500 text-sm animate-pulse">Loading Gateway...</span>}
          {isLoaded && !isSignedIn && (
            <SignInButton fallbackRedirectUrl="/dashboard">
              <button className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer px-6 py-2 border border-cyan-400/20 rounded-full bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] backdrop-blur-md">
                Sign In
              </button>
            </SignInButton>
          )}
          {isLoaded && isSignedIn && (
            <>
              <button onClick={() => router.push("/dashboard")} className="hidden sm:block px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer backdrop-blur-md">
                Go to Dashboard
              </button>
              <UserButton/>
            </>
          )}
        </div>
      </header>

      {/* =================== HERO MAIN =================== */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16 pt-8 sm:px-8 pointer-events-auto min-h-[90vh]">
        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
          transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s"
        }}>
          <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-300 backdrop-blur-md shadow-lg"
            style={{ boxShadow: "0 0 30px rgba(52,211,153,0.12), inset 0 0 20px rgba(52,211,153,0.04)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
            AI Skincare Mapping
          </p>
        </div>

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0) perspective(800px) rotateX(0deg)" : "translateY(50px) perspective(800px) rotateX(8deg)",
          transition: "opacity 1s ease 0.2s, transform 1s ease 0.2s"
        }}>
          <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl drop-shadow-2xl">
            See your skin clearly.
            <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">Act with confidence.</span>
          </h1>
        </div>

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 1s ease 0.35s, transform 1s ease 0.35s"
        }}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl drop-shadow-md">
            GlowryAI reads texture, tone, and trouble spots from a single scan—then turns insight into a routine that actually fits your face.
          </p>
        </div>

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 1s ease 0.5s, transform 1s ease 0.5s"
        }}>
          <div className="mt-12 flex flex-col items-start gap-3">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button type="button" onClick={() => router.push("/scanner")}
                className="group relative inline-flex cursor-pointer items-center justify-center rounded-full px-10 py-4 text-base font-bold text-slate-950 transition-transform hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 overflow-hidden"
                style={{ filter: "drop-shadow(0 0 24px rgba(52,211,153,0.45))" }}>
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 transition-transform duration-500 group-hover:scale-110" aria-hidden />
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 shadow-[0_0_40px_rgba(34,211,238,0.5)] blur-md opacity-80" aria-hidden />
                <span className="relative uppercase tracking-widest text-sm flex items-center gap-2">
                  Scan Your Face
                </span>
              </button>
            </div>
            <button type="button" onClick={() => router.push("/upload")} className="text-sm text-cyan-400/80 underline-offset-4 transition hover:text-cyan-300 hover:underline mt-2">
              Don&apos;t have a camera? Upload instead
            </button>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-6"
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 1s ease 0.65s, transform 1s ease 0.65s"
          }}>
          {[
            { label: "Analysis Engine", value: "Advanced AI", color: "text-emerald-400" },
            { label: "Cosmetic Plans", value: "100% Natural", color: "text-cyan-400" },
            { label: "Protocol Updates", value: "Daily Sync", color: "text-purple-400" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-start px-5 py-3 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
              <span className={`text-2xl font-black tracking-tighter ${stat.color}`}>{stat.value}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* 🌟 SNEAK PEEK SECTION (Passes master upgrade function down) 🌟 */}
      <SneakPeekSection onOpenPricing={() => setShowPricing(true)} onCheckout={triggerProUpgrade} />

      <Footer/>

      {/* =================== PRICING / COMPARE MODAL =================== */}
      {showPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2 py-3 sm:p-6" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-300" onClick={() => setShowPricing(false)} />
          <div className="relative z-10 w-full max-w-[min(100%,1000px)] overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/90 shadow-[0_0_100px_rgba(16,185,129,0.15)] backdrop-blur-2xl animate-in zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between border-b border-white/5 px-8 py-6">
              <h2 className="text-xl font-black uppercase tracking-[0.1em] text-white flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-400" /> Choose Your Aesthetic Journey
              </h2>
              <button type="button" onClick={() => setShowPricing(false)} className="rounded-full p-2 bg-white/5 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 md:p-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Basic / Free Tier */}
                <div className="rounded-[2rem] border border-white/10 bg-zinc-900/50 p-8 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-white mb-2">Basic Scan</h3>
                    <p className="text-sm text-zinc-400">Discover your baseline aesthetics.</p>
                    <div className="mt-6 flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">$0</span>
                        <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">/ Forever</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1 mt-4">
                    <ul className="space-y-4 text-sm font-medium text-zinc-300">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                        <span>Biometric face scan & generation.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                        <span>Exact Glow Index score out of 10.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                        <span>Basic skin flaw & problem detection.</span>
                      </li>
                      
                      {/* Negative Features */}
                      <li className="flex items-start gap-3 opacity-40 pt-4">
                        <XCircle className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                        <span className="line-through">Personalized max potential roadmap.</span>
                      </li>
                      <li className="flex items-start gap-3 opacity-40">
                        <XCircle className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                        <span className="line-through">Facial Symmetry & Ratio details.</span>
                      </li>
                      <li className="flex items-start gap-3 opacity-40">
                        <XCircle className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                        <span className="line-through">30-Day Natural Diet & Skin Routine.</span>
                      </li>
                      <li className="flex items-start gap-3 opacity-40">
                        <XCircle className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                        <span className="line-through">Daily improvement tracking graph.</span>
                      </li>
                    </ul>
                  </div>

                  <button onClick={() => { setShowPricing(false); setScannerOpen(true); }} className="mt-10 w-full py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs transition-all">
                    Start Free Scan
                  </button>
                </div>

                {/* GlowryAI Pro Tier */}
                <div className="relative rounded-[2rem] border border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-zinc-950 p-8 flex flex-col shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                  <div className="absolute top-0 right-8 px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-[10px] font-black uppercase tracking-widest rounded-b-lg shadow-lg">
                    Recommended
                  </div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-2">GlowryAI Pro</h3>
                    <p className="text-sm text-zinc-400">Unlock your ultimate aesthetic potential.</p>
                    <div className="mt-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-zinc-500 font-bold line-through">$14.99</span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">60% Off Limited Time</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">$5.99</span>
                        <span className="text-emerald-500/70 text-sm font-bold uppercase tracking-widest">/ 30 Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 mt-4">
                    <ul className="space-y-4 text-sm font-medium text-zinc-200">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Everything in Basic Scan.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Max Potential Roadmap:</strong> Exact biological strategies to help you reach your skin's maximum potential of <strong>9.6/10</strong>.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Facial Symmetry:</strong> Precise % structural breakdown.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>100% Natural Master Plan:</strong> 30 days of bespoke diet & homemade skincare routine.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>30-Day Strict Journey:</strong> Exactly 30 scans for 30 consecutive days (1 scan/24 hrs). Miss a day, lose that day's scan forever.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Yesterday vs Today:</strong> Daily comparison graphs & improvement metrics.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Gamified Consistency:</strong> Unlock Bronze (3 days), Silver (14 days), and Gold (21 days) badges.</span>
                      </li>
                    </ul>
                  </div>

                  <button onClick={triggerProUpgrade} className="mt-10 w-full py-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]">
                    Upgrade to Pro Now
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================== SCANNER MODAL =================== */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-2 py-3 sm:p-6" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={closeScanner} />
          <div className="relative z-10 w-full max-w-[min(100%,calc(100vw-1rem))] sm:max-w-md md:max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/95 shadow-[0_0_80px_rgba(34,211,238,0.15)] backdrop-blur-xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Biometric Facial Mapping</h2>
              <button type="button" onClick={closeScanner} className="rounded-full p-2 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

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
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center"><p className="text-sm font-bold text-red-300">{analysisError}</p></div>
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
                                  <img src={capturedImage} alt="Symmetry" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px] grayscale transition-all duration-700 group-hover:blur-[2px]" />
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
                                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-emerald-400 to-cyan-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest z-20 shadow-[0_4px_15px_rgba(52,211,153,0.5)]">9.6/10 POTENTIAL</div>
                                </div>
                                <h3 className="text-xl font-extrabold text-white mb-2 bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">Reveal Your Potential Face</h3>
                                <p className="text-xs text-zinc-400 mb-6 leading-relaxed px-2">Unlock your personalized 30-Day Glow-Up Plan, view your full symmetry report, and reveal your highest aesthetic potential.</p>
                                <div className="mb-6 border-t border-white/5 pt-5 text-left">
                                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Deep Aesthetic Analysis</h4>
                                  <div className="space-y-3 blur-[2px] opacity-40 select-none pointer-events-none">
                                      <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-3/4"></div></div>
                                      <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-5/6"></div></div>
                                      <div className="flex gap-3 items-center"><div className="h-4 w-4 rounded-full bg-white/40"></div><div className="h-2 bg-white/30 rounded w-2/3"></div></div>
                                  </div>
                                </div>
                                <button onClick={handleUnlockDashboard} className="group relative inline-flex w-full items-center justify-center rounded-2xl py-4 text-sm font-black text-slate-950 transition-all hover:scale-[1.02] active:scale-[0.98]"><span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-[length:200%_auto] animate-bg-pan opacity-100" /><span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.6)] blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-500" /><span className="relative flex items-center gap-2 uppercase tracking-widest">Unlock Everything - $5.99</span></button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90 mb-3">Your Aesthetic Profile</h3>
                            <div className="max-h-[min(280px,45vh)] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">{skinAnalysis?.raw}</div>
                            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
                              <p className="text-sm font-medium text-emerald-200/90">Want the 30-Day Glow-Up Blueprint?</p><p className="text-xs text-zinc-500">Unlock step-by-step AM/PM routines and product suggestions.</p>
                              <button onClick={handleUnlockDashboard} className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_rgba(52,211,153,0.25)] hover:brightness-110">$5.99 Unlock Report</button>
                            </div>
                          </div>
                        )}
                        <p className="mt-8 pb-4 text-center text-[9px] leading-relaxed text-zinc-600 px-4">Glow AI provides 100% natural and home made routines based on AI analysis, not medical advice. Consult a dermatologist for clinical skin conditions.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CookieBanner/>

      <style jsx global>{`
        @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-reverse-spin { animation: reverse-spin 1s linear infinite; }
        @keyframes bg-pan { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .animate-bg-pan { animation: bg-pan 3s linear infinite; }

        /* 3D Orb animations */
        @keyframes orb1 {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(8vw, 6vh) scale(1.12); }
          100% { transform: translate(3vw, 12vh) scale(0.95); }
        }
        @keyframes orb2 {
          0% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-6vw, -8vh) scale(1.08); }
          100% { transform: translate(-3vw, -4vh) scale(1.15); }
        }
        @keyframes orb3 {
          0% { transform: translate(0,0) scale(1) rotate(0deg); }
          100% { transform: translate(-5vw, 8vh) scale(1.2) rotate(15deg); }
        }

        /* Floating dots */
        @keyframes floatDot0 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.7; }
          50% { transform: translateY(-20px) translateX(8px); opacity: 1; }
        }
        @keyframes floatDot1 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.5; }
          50% { transform: translateY(-30px) scale(1.3); opacity: 0.9; }
        }
        @keyframes floatDot2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-15px) translateX(-10px) rotate(45deg); opacity: 1; }
        }

        /* Light streaks */
        @keyframes streak {
          0% { opacity: 0; transform: rotate(25deg) translateY(-10%); }
          30% { opacity: 1; }
          70% { opacity: 0.6; }
          100% { opacity: 0; transform: rotate(25deg) translateY(10%); }
        }

        /* Custom Scrollbar for popups */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.6); }

        .perspective-\\[1000px\\] { perspective: 1000px; }
      `}</style>
    </div>
  );
}