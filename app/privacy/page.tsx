"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, Database, ArrowLeft, FileText, RefreshCcw, Cookie, AlertTriangle, EyeOff } from "lucide-react";

export default function LegalPoliciesPage() {
  const [activeTab, setActiveTab] = useState("privacy");

  return (
    <div className="min-h-screen bg-[#030306] text-zinc-300 font-sans selection:bg-cyan-500/30 p-6 md:p-12 lg:p-20">
      
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-cyan-400 transition-colors mb-12 font-bold text-sm uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight">Legal & Policies</h1>
          </div>
          <p className="text-zinc-500 uppercase tracking-widest font-bold text-xs">Last Updated: May 2026 • GlowryAI Protocol</p>
        </div>

        {/* 🌟 Interactive Navigation Tabs 🌟 */}
        <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white/5 border border-white/5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab("privacy")}
            className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === "privacy" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"}`}
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setActiveTab("terms")}
            className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === "terms" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"}`}
          >
            Terms of Service
          </button>
          <button 
            onClick={() => setActiveTab("refunds")}
            className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === "refunds" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"}`}
          >
            Refunds
          </button>
          <button 
            onClick={() => setActiveTab("cookies")}
            className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === "cookies" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"}`}
          >
            Cookies
          </button>
        </div>

        {/* 🌟 Dynamic Content Box 🌟 */}
        <div className="p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-zinc-950/80 shadow-2xl relative overflow-hidden min-h-[400px]">
          {/* Top Glow Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>

          {/* 1. PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <Database className="w-8 h-8 text-cyan-400" />
                <h2 className="text-2xl font-black text-white italic uppercase">Privacy Policy</h2>
              </div>
              
              {/* Purono Text */}
              <p className="text-sm leading-relaxed text-zinc-400">
                We collect minimum data via Clerk Identity (Email, Name) and facial images uploaded strictly for aesthetic analysis. All biometric data is processed with <strong className="text-white">End-to-End Encryption</strong>.
              </p>

              {/* 🌟 NOTUN ADDITION: Image Storage Policy (Kono kichu delete kora hoyni) 🌟 */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-5 rounded-2xl flex items-start gap-4">
                <EyeOff className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-sm text-cyan-50 leading-relaxed">
                  <strong className="text-cyan-400 uppercase tracking-widest text-[10px] block mb-1">Zero Image Storage</strong>
                  Facial images are processed in real-time and <strong className="text-white">deleted immediately</strong> after analysis. We <strong className="text-white">NEVER store or save</strong> your photos on our servers.
                </p>
              </div>

              {/* Purono Highlight Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-start gap-4">
                <EyeOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-400 font-bold">
                  We DO NOT sell your biometric signatures or data to third-party cosmetic companies or advertisers. Your data belongs to you.
                </p>
              </div>
            </div>
          )}

          {/* 2. TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <FileText className="w-8 h-8 text-cyan-400" />
                <h2 className="text-2xl font-black text-white italic uppercase">Terms of Service</h2>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                By using GlowAI, you agree to not upload any offensive, illegal, or non-human images. Our AI is explicitly trained and designed strictly for facial aesthetic analysis.
              </p>
              <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl">
                <h4 className="text-rose-400 font-black italic uppercase mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Medical Disclaimer
                </h4>
                <p className="text-sm leading-relaxed text-zinc-400">
                  GlowryAI is an aesthetic tracking tool, <strong className="text-rose-400">NOT a medical diagnostic device</strong>. Our AI suggestions do not replace professional dermatological advice.
                </p>
              </div>
            </div>
          )}

          {/* 3. REFUNDS */}
          {activeTab === "refunds" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <RefreshCcw className="w-8 h-8 text-cyan-400" />
                <h2 className="text-2xl font-black text-white italic uppercase">Refund Policy</h2>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                You can cancel your GlowryAI Pro subscription at any time from your billing dashboard. Cancellations take effect at the end of your current billing cycle.
              </p>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <p className="text-sm leading-relaxed text-zinc-300">
                  <strong className="text-white uppercase tracking-widest text-xs">Strict No-Refund Rule:</strong> Because our AI incurs high immediate server costs for biometric rendering and GPU usage, we do not offer refunds for partial months or unused scans after a billing cycle has started.
                </p>
              </div>
            </div>
          )}

          {/* 4. COOKIES */}
          {activeTab === "cookies" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <Cookie className="w-8 h-8 text-cyan-400" />
                <h2 className="text-2xl font-black text-white italic uppercase">Cookie Policy</h2>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                We only use strictly essential cookies required for the app to function properly (for example, maintaining your secure login session via Clerk Identity). 
              </p>
              <p className="text-sm leading-relaxed text-zinc-500 italic">
                We do not use intrusive tracking cookies for third-party advertising. By using the app, you consent to these essential functional cookies.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center flex flex-col items-center gap-4">
          <a href="mailto:support@glowai.com" className="text-[10px] text-zinc-500 hover:text-cyan-400 uppercase tracking-widest font-bold transition-colors">
            Contact Legal Support
          </a>
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.3em] font-bold">
            © {new Date().getFullYear()} GlowryAI Protocol.
          </p>
        </div>

      </div>
    </div>
  );
}