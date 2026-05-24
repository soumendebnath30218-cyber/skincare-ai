import Link from 'next/link';

export default function PublicPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030306] text-zinc-300 font-sans py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-cyan-400 hover:underline text-sm mb-8 inline-block">← Back to Glow AI</Link>
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="space-y-6 leading-relaxed">
          
          <section>
            <h2 className="text-xl font-semibold text-emerald-400 mb-3">1. Data Storage for Progress</h2>
            <p>To provide you with progress graphs, historical comparisons, and daily achievements, Glow AI securely stores your analysis data (scores, detected flaws, and metrics). We prioritize your security and do not share this data with third-party advertisers.</p>
          </section>

          <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold text-cyan-400 mb-3">2. Facial Image Policy</h2>
            <p>Facial images are processed in real-time and deleted from our servers immediately after analysis to ensure maximum privacy. Your most recent scan is temporarily stored <strong className="text-white">locally on your own device's browser</strong> so you can view your results, and it is automatically deleted and replaced the next time you take a new scan.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-emerald-400 mb-3">3. Achievement Tracking</h2>
            <p>We track your scanning consistency to award achievement badges (Bronze, Silver, Gold). This data is used solely to enhance your &quot;Glow-up&quot; journey.</p>
          </section>

        </div>
      </div>
    </div>
  );
}