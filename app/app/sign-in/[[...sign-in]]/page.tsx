import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#030306] p-6">
      <SignIn 
        appearance={{
          baseTheme: dark,
          variables: { colorPrimary: '#22d3ee' },
          elements: {
            card: "bg-zinc-950 border border-white/10 shadow-2xl",
          }
        }} 
      />
    </div>
  );
}