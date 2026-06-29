import Link from "next/link";

export default function CheckoutRedirectPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="p-8 bg-gray-900 rounded-2xl shadow-xl text-center border border-gray-800">
        <h1 className="text-3xl font-bold text-green-400 mb-4">Payment Successful! 🎉</h1>
        <p className="text-gray-300 mb-8">
          Welcome to Pro! Your account has been upgraded successfully.
        </p>
        <Link 
          href="/dashboard" 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}