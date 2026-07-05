// File: app/pricing/page.tsx
"use client";
import UpgradeButton from "@/components/UpgradeButton";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">GlowryAI Pro</h1>
      <p className="mb-8 text-gray-400">Unlock all premium features including Geometry & Ratio Map.</p>
      
      <UpgradeButton
        title="Upgrade to Pro - $9.99"
        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
      />
    </div>
  );
}
