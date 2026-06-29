// File: app/pricing/page.tsx
"use client";
import { useState } from 'react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: "test_user_123", // টেস্টিংয়ের জন্য ডামি আইডি
          email: "test@glowryai.com" // টেস্টিংয়ের জন্য ডামি ইমেইল
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // পেমেন্ট পেজে নিয়ে যাবে
      } else {
        alert("পেমেন্ট লিঙ্ক তৈরি হয়নি! ব্যাকএন্ড চেক করো।");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">GlowryAI Pro</h1>
      <p className="mb-8 text-gray-400">Unlock all premium features including Geometry & Ratio Map.</p>
      
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
      >
        {loading ? 'Please wait...' : 'Upgrade to Pro - $9.99'}
      </button>
    </div>
  );
}