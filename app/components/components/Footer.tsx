import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-black text-gray-400 py-8 border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm">
        <p className="mb-6 text-xs text-gray-500">
          Disclaimer: The AI analysis and skincare routines provided by Glow AI are for informational and cosmetic purposes only. This is not medical advice. Please consult a certified dermatologist for severe skin conditions.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <Link href="/privacy" className="hover:text-[#39ff14] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#39ff14] transition-colors">Terms of Service</Link>
          <a href="mailto:support@yourdomain.com" className="hover:text-[#39ff14] transition-colors">Contact Us</a>
        </div>
        <p>© {new Date().getFullYear()} Glow AI. All rights reserved.</p>
      </div>
    </footer>
  );
}