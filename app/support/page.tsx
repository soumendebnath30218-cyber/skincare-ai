"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Send, ChevronDown, ShieldCheck, Zap } from "lucide-react";

const faqs = [
  {
    q: "How accurate is the GlowryAI facial scan?",
    a: "Our AI model is trained on over 100,000 dermatological points, providing highly accurate mapping for surface-level aesthetic analysis, symmetry, and skin texture."
  },
  {
    q: "Is my biometric data stored safely?",
    a: "Absolutely. All facial scans are processed with End-to-End Encryption. We strictly DO NOT sell your biometric data to third-party advertisers or cosmetic companies."
  },
  {
    q: "How do I cancel my Pro subscription?",
    a: "You can cancel anytime directly from your Dashboard Settings. Cancellations take effect immediately at the end of your current billing cycle."
  },
  {
    q: "Does GlowryAI provide medical advice?",
    a: "No. GlowryAI is an aesthetic intelligence tool designed for cosmetic routines and tracking. It is not a medical diagnostic device. Always consult a dermatologist for clinical concerns."
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "technical",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("Message sent successfully! Our support team will get back to you within 24 hours.");
        setFormData({ name: "", email: "", subject: "technical", message: "" });
      } else {
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      alert("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030306] text-zinc-300 font-sans selection:bg-cyan-500/30">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0" aria-hidden />
      <div className="absolute top-0 left-1/2 w-[800px] h-[300px] -translate-x-1/2 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-cyan-400 transition-colors mb-12 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-16 md:text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-6">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">24/7 Priority Support</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            How can we <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">help you?</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto md:text-lg">
            Whether you have a question about your Glow Index, billing, or technical issues, our aesthetic intelligence team is here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="bg-zinc-950/80 border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
              
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-cyan-400" /> Send a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors" placeholder="john@example.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Subject</label>
                  <select name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none">
                    <option value="technical" className="bg-zinc-900">Technical Issue</option>
                    <option value="billing" className="bg-zinc-900">Billing & Subscription</option>
                    <option value="scan" className="bg-zinc-900">Scan Results Feedback</option>
                    <option value="other" className="bg-zinc-900">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none" placeholder="Describe your issue in detail..."></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-zinc-950 transition-all hover:brightness-110 disabled:opacity-70">
                  {isSubmitting ? <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span> : <>Send Request <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {/* Email Us Box - Updated with Mailto link */}
              <a 
                href="mailto:soumendebnath702@gmail.com" 
                className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <Mail className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-bold text-sm">Email Us</h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 break-all px-2">soumendebnath702@gmail.com</p>
              </a>

              {/* Secure Portal Box */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors cursor-pointer">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
                <h3 className="text-white font-bold text-sm">Secure Portal</h3>
                <p className="text-xs text-zinc-500 mt-1">AES-256 Encrypted</p>
              </div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-right-8 duration-1000">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Zap className="w-6 h-6 text-emerald-400" /> Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'bg-zinc-900/80 border-cyan-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                  <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none">
                    <span className={`font-semibold text-sm sm:text-base pr-4 ${openFaq === index ? 'text-cyan-400' : 'text-zinc-200'}`}>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Enterprise Support</p>
              <p className="text-sm text-zinc-400">
                Are you a dermatology clinic looking to integrate GlowAI? <a href="#" className="text-cyan-400 hover:underline">Contact our sales team</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}