import { clerkMiddleware } from "@clerk/nextjs/server";

// এই ছোট্ট কোডটাই তোমার রিডাইরেক্ট লুপ ভেঙে দেবে এবং অ্যাপ ফাস্ট করবে
export default clerkMiddleware();

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};