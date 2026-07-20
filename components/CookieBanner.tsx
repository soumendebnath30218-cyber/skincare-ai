"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // চেক করবে আগে থেকে কুকি অ্যাকসেপ্ট করা আছে কি না
    const consent = localStorage.getItem("glow_cookie_consent");
    if (!consent) {
      // একটু দেরি করে ব্যানারটা দেখাবে যাতে পেজ লোড স্মুথ হয়
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("glow_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("glow_cookie_consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[999] md:max-w-sm"
        >
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-50"></div>
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full"></div>

            <button 
              onClick={handleDecline} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-cyan-500/10 p-3 rounded-full shrink-0">
                <Cookie className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">We value your privacy</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  We use strictly necessary cookies and device fingerprinting to ensure security, limit free scans, and provide you with a personalized aesthetic journey. 
                  <Link href="/public-privacy" className="text-cyan-400 hover:underline ml-1">Learn more.</Link>
                </p>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleAccept}
                    className="flex-1 bg-white text-black text-xs font-bold px-4 py-2.5 rounded-full hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  >
                    Accept All
                  </button>
                  <button 
                    onClick={handleDecline}
                    className="flex-1 bg-white/5 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}