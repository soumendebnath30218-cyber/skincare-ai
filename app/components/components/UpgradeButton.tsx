"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function UpgradeButton({ title = "Upgrade to Pro", className = "" }: { title?: string, className?: string }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert("Please login first to upgrade!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress })
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Something went wrong!");
        setLoading(false);
      }
    } catch (error) {
      console.error("Payment routing failed:", error);
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={handleUpgrade} 
      disabled={loading}
      className={`bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold transition-all ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? "Please wait..." : title}
    </button>
  );
}