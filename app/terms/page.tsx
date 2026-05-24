import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#030306] text-zinc-300 font-sans py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-cyan-400 hover:underline text-sm mb-8 inline-block">← Back to Glow AI</Link>
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service & Disclaimers</h1>
        <div className="space-y-6 leading-relaxed">
          <section className="border-l-4 border-red-500 pl-6 py-2 bg-red-500/5">
            <h2 className="text-xl font-semibold text-white mb-3">Allergy & Homemade Skincare Warning</h2>
            <p className="text-zinc-400 italic font-bold">Glow AI suggests natural, homemade ingredients. ALWAYS perform a patch test on a small area of skin before full application. We are not responsible for allergic reactions, skin irritation, or any adverse effects from these natural remedies.</p>
          </section>
          <section className="border-l-4 border-yellow-500 pl-6 py-2 bg-yellow-500/5">
            <h2 className="text-xl font-semibold text-white mb-3">Dietary Disclaimer</h2>
            <p>The 30-day natural diet plans are general suggestions. Consult a doctor or nutritionist before starting any new diet, especially if you have pre-existing health conditions or allergies.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-emerald-400 mb-3">Result Guarantee</h2>
            <p>Glow AI provides routines to help you improve. However, physical changes depend on consistency, genetics, and lifestyle. We do not guarantee a specific score improvement (e.g., reaching 9.5) within a set timeframe.</p>
          </section>
        </div>
      </div>
    </div>
  );
}