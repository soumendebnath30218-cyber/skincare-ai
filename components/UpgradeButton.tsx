"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradeButton({ title = "Upgrade to Pro", className = "" }: { title?: string, className?: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // State for hover effect

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/sign-in');
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

  // Define base colors
  const defaultPink = '#e91e63'; // Default/idle pink
  const lighterPink = '#f06292'; // Slightly lighter for hover
  const darkerPink = '#c2185b'; // Darker for loading/disabled

  // Determine background color based on state
  let backgroundColor = defaultPink;
  if (loading) {
    backgroundColor = darkerPink;
  } else if (isHovered) {
    backgroundColor = lighterPink;
  }

  const buttonInlineStyle = {
    backgroundColor: backgroundColor,
    color: 'white', // Text color always white
  };

  return (
    <button 
      onClick={handleUpgrade} 
      disabled={loading}
      onMouseEnter={() => setIsHovered(true)} // Handle hover state
      onMouseLeave={() => setIsHovered(false)}
      style={buttonInlineStyle} // Apply inline styles for background and text color
      className={`px-6 py-2 rounded-lg font-semibold transition-all ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} // className for layout
    >
      {loading ? "Please wait..." : title}
    </button>
  );
}