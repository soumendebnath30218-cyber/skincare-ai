"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: "📊" },
    { name: "Glow Protocol", href: "/dashboard/routine", icon: "✨" },
    { name: "Progress Map", href: "/dashboard/progress", icon: "📈" },
    { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-[#030306] text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col">
        <div className="p-6">
          <span className="text-xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            GlowAI Pro
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
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-[#030306]/80 backdrop-blur-md px-8 flex items-center justify-between">
          <h1 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            {navItems.find(i => i.href === pathname)?.name || "Dashboard"}
          </h1>
          
          {/* 🌟 FIX: বাটনটাকে Link এ কনভার্ট করে /upload এ পাঠানো হলো 🌟 */}
          <Link href="/upload" className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">
            Scan Again
          </Link>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}