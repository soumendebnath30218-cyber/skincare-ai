"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useState } from "react";

export default function UpgradeButton({ title = "Upgrade to Pro", className = "" }: { title?: string, className?: string }) {
  const { user } = useUser();
      const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert("Please login first to upgrade!");
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url; 
      else alert("Payment link generation failed!");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleUpgrade} disabled={loading} className={`transition-all ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {loading ? "Please wait..." : title}
    </button>
  );
}


