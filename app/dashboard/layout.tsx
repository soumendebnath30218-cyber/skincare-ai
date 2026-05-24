"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Headset } from "lucide-react"; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: "📊" },
    { name: "Preparation Steps", href: "/dashboard/routine", icon: "🌿" }, 
    { name: "Daily Analysis", href: "/dashboard/protocol", icon: "✨" }, 
    { name: "Progress Map", href: "/dashboard/progress", icon: "📈" },
    { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-[#030306] text-zinc-100 overflow-hidden print:h-auto print:overflow-visible print:block">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col print:hidden">
        <div className="p-6">
          <span className="text-xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            GlowryAI Pro
          </span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname === item.href 
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
          
          <Link
            href="/privacy"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === "/privacy"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <Shield className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-medium">Legal & Policies</span>
          </Link>

          <Link
            href="/support"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === "/support"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <Headset className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-medium">Customer Support</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-900/20 to-transparent border border-cyan-500/10">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              S
            </div>
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-tighter">Premium Member</p>
              <p className="text-[10px] text-cyan-400/70">Verified Bio-Data</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar print:h-auto print:overflow-visible print:block">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-[#030306]/80 backdrop-blur-md px-8 flex items-center justify-between print:hidden">
          <h1 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            {navItems.find(i => i.href === pathname)?.name || "Dashboard"}
          </h1>

          {/* 🌟 🌟 🌟 এই দেখো, তোমার অরিজিনাল ল্যান্ডিং পেজের লিংক (/) বসিয়ে দিয়েছি 🌟 🌟 🌟 */}
          <Link 
            href="/" 
            className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            Scan Again
          </Link>
        </header>

        <div className="p-8 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}