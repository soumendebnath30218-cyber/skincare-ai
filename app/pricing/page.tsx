// File: app/pricing/page.tsx
"use client";

import { useState, useRef } from "react";
import { Fraunces, Inter } from "next/font/google";
import UpgradeButton from "@/components/UpgradeButton";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path
          d="M4 20L20 4M4 4h6M4 4v6M20 20h-6M20 20v-6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Geometry & Ratio Map",
    desc: "Exact facial proportions, mapped in seconds.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path
          d="M18.6 6.4a5 5 0 0 0-7.1 0L11 6.9l-.5-.5a5 5 0 1 0-7.1 7.1L11 21l7.6-7.5a5 5 0 0 0 0-7.1Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Unlimited AI Generations",
    desc: "Scan as often as your routine changes.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path
          d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Priority Processing",
    desc: "Your results, first in line — always.",
  },
];

const BOKEH = [
  { left: 12, top: 20, size: 6, duration: 7, delay: 0, color: "#E8A94C" },
  { left: 85, top: 15, size: 4, duration: 9, delay: 1, color: "#4FBF8B" },
  { left: 20, top: 75, size: 5, duration: 8, delay: 2, color: "#FFD98A" },
  { left: 78, top: 70, size: 7, duration: 10, delay: 0.5, color: "#4FBF8B" },
  { left: 50, top: 10, size: 3, duration: 6, delay: 1.5, color: "#E8A94C" },
  { left: 90, top: 45, size: 4, duration: 8.5, delay: 2.5, color: "#FFD98A" },
];

const AVATARS = [
  { letter: "R", color: "#E8A94C" },
  { letter: "M", color: "#4FBF8B" },
  { letter: "S", color: "#FFD98A" },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const price = billing === "monthly" ? "9.99" : "79";
  const cadence = billing === "monthly" ? "/mo" : "/yr";
  const ctaLabel =
    billing === "monthly"
      ? "Start your Pro glow — $9.99/mo"
      : "Start your Pro glow — $79/yr";

  return (
    <div
      className={`${fraunces.variable} ${inter.variable} relative min-h-screen w-full overflow-hidden bg-[#0B0F0D] font-[family-name:var(--font-body)] text-[#F5F0E8] flex items-center justify-center px-4 py-16`}
    >
      {/* Ambient botanical glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-[#E8A94C] opacity-[0.14] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-140px] right-[-80px] w-[420px] h-[420px] rounded-full bg-[#4FBF8B] opacity-[0.12] blur-[130px]" />

      {/* Drifting bokeh particles */}
      <div className="pointer-events-none absolute inset-0">
        {BOKEH.map((b, i) => (
          <span
            key={i}
            className="bokeh"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              background: b.color,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* 3D glass orb */}
        <div className="orb-scene mb-2">
          <div className="orb" />
          <div className="orb-ring" />
          <div className="orb-highlight" />
        </div>

        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          style={{
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
          className="tilt-card relative w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 sm:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
        >
          {/* Kicker */}
          <p className="text-center text-xs tracking-[0.25em] uppercase text-[#E8A94C] mb-3">
            GlowryAI Pro
          </p>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-display)] italic text-center text-[2.1rem] leading-[1.15] mb-3 text-[#F5F0E8]">
            See your skin the way our AI does.
          </h1>
          <p className="text-center text-sm text-[#9CA79D] mb-6">
            Precise ratios, unlimited scans, zero waiting.
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 mb-7">
            <div className="flex -space-x-2">
              {AVATARS.map((a, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-[#0B0F0D] flex items-center justify-center text-[10px] font-semibold"
                  style={{ background: a.color }}
                >
                  {a.letter}
                </div>
              ))}
            </div>
            <span className="text-xs text-[#8B9A91]">
              12,400+ users already glowing
            </span>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-7">
            <div className="relative flex bg-white/5 border border-white/10 rounded-full p-1 text-xs">
              <button
                onClick={() => setBilling("monthly")}
                className={`relative z-10 px-4 py-1.5 rounded-full transition-colors ${
                  billing === "monthly" ? "text-[#0B0F0D]" : "text-[#9CA79D]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`relative z-10 px-4 py-1.5 rounded-full transition-colors ${
                  billing === "yearly" ? "text-[#0B0F0D]" : "text-[#9CA79D]"
                }`}
              >
                Yearly · save 34%
              </button>
              <span
                className="absolute top-1 bottom-1 rounded-full bg-[#E8A94C] transition-all duration-300"
                style={{
                  left: billing === "monthly" ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                }}
              />
            </div>
          </div>

          {/* Price */}
          <div className="flex items-end justify-center gap-1 mb-8">
            <span className="text-lg text-[#9CA79D] mb-2">$</span>
            <span className="font-[family-name:var(--font-display)] text-6xl font-semibold text-[#F5F0E8] tabular-nums">
              {price}
            </span>
            <span className="text-sm text-[#9CA79D] mb-2">{cadence}</span>
          </div>

          {/* Features */}
          <ul className="space-y-4 mb-8">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-[#E8A94C]/10 text-[#E8A94C] flex items-center justify-center">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#F5F0E8]">
                    {f.title}
                  </p>
                  <p className="text-xs text-[#8B9A91]">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="cta-glow rounded-xl">
            <UpgradeButton
              title={ctaLabel}
              className="w-full bg-gradient-to-r from-[#E8A94C] to-[#FFD98A] hover:from-[#FFD98A] hover:to-[#E8A94C] text-[#0B0F0D] px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300"
            />
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-[#8B9A91] uppercase tracking-wide">
            <span>🔒 Secure checkout</span>
            <span className="w-1 h-1 rounded-full bg-[#8B9A91]/40" />
            <span>Cancel anytime</span>
            <span className="w-1 h-1 rounded-full bg-[#8B9A91]/40" />
            <span>30-day guarantee</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .orb-scene {
          position: relative;
          width: 140px;
          height: 140px;
        }
        .orb {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle at 32% 28%,
            #ffe3a3 0%,
            #e8a94c 38%,
            #4fbf8b 78%,
            #0b0f0d 100%
          );
          box-shadow: 0 0 70px rgba(232, 169, 76, 0.45),
            inset -18px -18px 36px rgba(0, 0, 0, 0.45),
            inset 12px 12px 26px rgba(255, 255, 255, 0.25);
          animation: orbFloat 6s ease-in-out infinite;
        }
        .orb-ring {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 1px solid rgba(232, 169, 76, 0.25);
          animation: orbSpin 14s linear infinite;
        }
        .orb-ring::before {
          content: "";
          position: absolute;
          top: -3px;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffe3a3;
          box-shadow: 0 0 10px 2px rgba(255, 217, 138, 0.8);
        }
        .orb-highlight {
          position: absolute;
          top: 18%;
          left: 24%;
          width: 34%;
          height: 22%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          filter: blur(6px);
          mix-blend-mode: screen;
          animation: orbFloat 6s ease-in-out infinite;
        }
        @keyframes orbFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes orbSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .tilt-card {
          transition: transform 0.15s ease-out;
        }
        .cta-glow {
          transition: filter 0.3s ease;
        }
        .cta-glow:hover {
          filter: drop-shadow(0 0 18px rgba(232, 169, 76, 0.5));
        }
        :global(.bokeh) {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          opacity: 0.5;
          animation-name: drift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes drift {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-24px) translateX(10px);
            opacity: 0.7;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .orb,
          .orb-ring,
          .orb-highlight,
          :global(.bokeh) {
            animation: none !important;
          }
          .tilt-card {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}