import Link from "next/link";

export default function CheckoutRedirectPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="bg-gray-900/50 p-8 rounded-2xl border border-teal-500/30 text-center max-w-md w-full shadow-[0_0_20px_rgba(20,184,166,0.1)]">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <svg className="w-20 h-20 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3 text-white">Payment Successful!</h1>
        
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          Welcome to GlowryAI Pro. Your premium features have been unlocked. It might take a few seconds for the changes to reflect.
        </p>

        <Link 
          href="/dashboard"
          className="inline-block w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all"
        >
          Go to Pro Dashboard
        </Link>

      </div>
    </div>
  );
}