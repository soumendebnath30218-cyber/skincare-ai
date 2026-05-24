"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import { 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  LogOut, 
  Sparkles,
  Mail
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  
  // 🗂️ Tab System State
  const [activeTab, setActiveTab] = useState("profile");
  
  // 🔔 Notification States
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  // 💾 পেজ লোড হলে ইউজারের সেভ করা নোটিফিকেশন সেটিংস মনে রাখার লজিক
  useEffect(() => {
    const savedPush = localStorage.getItem("glow_push_notif");
    const savedEmail = localStorage.getItem("glow_email_notif");
    if (savedPush !== null) setPushNotif(savedPush === "true");
    if (savedEmail !== null) setEmailNotif(savedEmail === "true");
  }, []);

  if (!isLoaded || !isSignedIn) return null;

  // 🔘 পুশ নোটিফিকেশন টগল হ্যান্ডলার
  const handlePushToggle = () => {
    const newVal = !pushNotif;
    setPushNotif(newVal);
    localStorage.setItem("glow_push_notif", String(newVal));
  };

  // 🔘 ইমেইল নোটিফিকেশন টগল হ্যান্ডলার
  const handleEmailToggle = () => {
    const newVal = !emailNotif;
    setEmailNotif(newVal);
    localStorage.setItem("glow_email_notif", String(newVal));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 p-6 md:p-10">
      
      {/* 🚀 Page Header */}
      <header className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Settings</h2>
           <p className="text-zinc-500 mt-2 text-sm uppercase tracking-widest font-bold text-[10px]">Manage your aesthetic profile & preferences</p>
        </div>
        <UserButton />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ⬅️ Left Sidebar (Navigation) */}
        <div className="space-y-2">
           <button 
             onClick={() => setActiveTab("profile")}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === "profile" ? "bg-cyan-500/10 text-white border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:bg-white/5 border-transparent"}`}
           >
             <User className={`w-4 h-4 ${activeTab === "profile" ? "text-cyan-400" : ""}`} /> Profile
           </button>
           
           <button 
             onClick={() => setActiveTab("billing")}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === "billing" ? "bg-cyan-500/10 text-white border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:bg-white/5 border-transparent"}`}
           >
             <CreditCard className={`w-4 h-4 ${activeTab === "billing" ? "text-cyan-400" : ""}`} /> Subscription
           </button>
           
           <button 
             onClick={() => setActiveTab("notifications")}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === "notifications" ? "bg-cyan-500/10 text-white border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:bg-white/5 border-transparent"}`}
           >
             <Bell className={`w-4 h-4 ${activeTab === "notifications" ? "text-cyan-400" : ""}`} /> Notifications
           </button>
           
           <button 
             onClick={() => setActiveTab("security")}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all border ${activeTab === "security" ? "bg-cyan-500/10 text-white border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]" : "text-zinc-500 hover:bg-white/5 border-transparent"}`}
           >
             <Shield className={`w-4 h-4 ${activeTab === "security" ? "text-cyan-400" : ""}`} /> Privacy
           </button>

           <div className="pt-4 border-t border-white/5 mt-4">
              <SignOutButton>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-rose-500 hover:bg-rose-500/10 transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </SignOutButton>
           </div>
        </div>

        {/* ➡️ Right Content Area */}
        <div className="md:col-span-2 space-y-8">
          
          {/* --- PROFILE TAB --- */}
          {activeTab === "profile" && (
            <div className="p-8 rounded-[2.5rem] border border-white/5 bg-zinc-950/50 shadow-xl animate-in fade-in duration-500">
               <div className="flex items-center gap-6 mb-8">
                  <img src={user.imageUrl} className="w-20 h-20 rounded-full border-2 border-cyan-500/20" />
                  <div>
                    <h3 className="text-xl font-black text-white">{user.fullName}</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-1">Free Tier Explorer</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest block mb-2 ml-1">Full Name</label>
                      <div className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-zinc-300 flex items-center gap-3">
                        <User className="w-4 h-4 text-zinc-600" />
                        {user.fullName}
                      </div>
                  </div>
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest block mb-2 ml-1">Email Identity</label>
                      <div className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-zinc-300 flex items-center gap-3">
                        <Mail className="w-4 h-4 text-zinc-600" />
                        {user.primaryEmailAddress?.emailAddress}
                      </div>
                  </div>
               </div>
               
               {/* 💡 Guidance on how to update profile */}
               <div className="mt-8 p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <p className="text-xs text-zinc-400">Profile data is strictly secured by <span className="text-white font-bold">Clerk Identity</span>.</p>
                  </div>
                  <p className="text-[10px] text-cyan-500/70 ml-8 uppercase font-bold tracking-widest">
                    👉 To update your name, email, or photo, click your Avatar at the top right corner.
                  </p>
               </div>
            </div>
          )}

          {/* --- SUBSCRIPTION TAB --- */}
          {activeTab === "billing" && (
            <div className="p-8 rounded-[2.5rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-zinc-950 shadow-xl animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Subscription Status</h3>
                 <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Trial Active</span>
               </div>
               <div className="space-y-6">
                  <div>
                    <p className="text-3xl font-black text-white italic">Free Evolution</p>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">You are currently on the free version. Upgrade to <span className="text-white font-bold">GlowryAI Pro</span> to unlock unlimited biometric scans and detailed AI skincare routines.</p>
                  </div>
                  <button className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-cyan-400 transition-colors shadow-[0_10px_20px_rgba(255,255,255,0.05)]">
                     Upgrade to Pro ($9.99/mo)
                  </button>
               </div>
            </div>
          )}

          {/* --- NOTIFICATIONS TAB --- */}
          {activeTab === "notifications" && (
            <div className="p-8 rounded-[2.5rem] border border-white/5 bg-zinc-950/50 shadow-xl animate-in fade-in duration-500 space-y-4">
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Engagement Preferences</h3>
               
               <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-black/40">
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">Daily Protocol Alerts</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-1">Push notifications for routines</p>
                  </div>
                  <button 
                    onClick={handlePushToggle} 
                    className={`w-12 h-6 rounded-full transition-all relative flex items-center ${pushNotif ? 'bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${pushNotif ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
               </div>

               <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-black/40">
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">Weekly Skin Insights</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-1">Deep analysis via email</p>
                  </div>
                  <button 
                    onClick={handleEmailToggle} 
                    className={`w-12 h-6 rounded-full transition-all relative flex items-center ${emailNotif ? 'bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${emailNotif ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
               </div>
            </div>
          )}

          {/* --- PRIVACY TAB --- */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="p-8 rounded-[2.5rem] border border-white/5 bg-zinc-950/50">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Biometric Data Policy</h3>
                 <p className="text-sm text-zinc-400 leading-relaxed">
                    All skin analysis photos are processed with <span className="text-white font-bold">End-to-End Encryption</span>. We do not sell your biometric signatures to third parties. Your aesthetic data belongs entirely to you and is highly secured.
                 </p>
                 
                 <div className="mt-8 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-2xl w-fit">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">100% Privacy Protected</span>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
      
      <footer className="pt-10">
        <p className="text-center text-[9px] text-zinc-800 uppercase tracking-[0.5em] font-black">
           GlowryAI Protocol v1.5 • Secure Biometric ID: {user.id.slice(0,10)}...
        </p>
      </footer>
    </div>
  );
}