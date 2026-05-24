"use client";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Header() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  return (
    <header className="relative z-40 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-8">
      <span className="text-lg font-semibold tracking-tight">
        <span className="bg-gradient-to-r from-cyan-200 to-emerald-300 bg-clip-text text-transparent uppercase tracking-tighter font-bold">GlowryAI</span>
      </span>

      <div className="flex items-center gap-4">
        {!isLoaded && <span className="text-zinc-500 text-sm animate-pulse">Checking Gateway...</span>}
        
        {isLoaded && !isSignedIn && (
          <SignInButton>
            <button className="text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer px-6 py-2 border border-cyan-400/20 rounded-full bg-cyan-400/10">
              Sign In
            </button>
          </SignInButton>
        )}

        {isLoaded && isSignedIn && (
          <>
            <button onClick={() => router.push("/dashboard")} className="hidden sm:block px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all cursor-pointer">
              Go to Dashboard
            </button>
            <UserButton />
          </>
        )}
      </div>
    </header>
  );
}