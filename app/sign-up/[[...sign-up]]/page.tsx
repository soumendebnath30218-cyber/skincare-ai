import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-white to-teal-100">
      <SignUp appearance={{
        elements: {
          formButtonPrimary:
            "bg-black hover:bg-gray-800 text-white",
          card:
            "shadow-xl rounded-2xl",
        }
      }} />
    </div>
  );
}