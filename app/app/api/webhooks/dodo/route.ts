import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Dodo Payments থেকে পেমেন্ট সফল হওয়ার সিগন্যাল আসছে কি না চেক করছি
    // (Dodo-র ডকুমেন্টেশন অনুযায়ী ইভেন্ট টাইপ 'payment_success' বা similar হবে)
    if (payload.event === "payment_success" || payload.status === "completed") {
      const userId = payload.metadata.clerkUserId; // পেমেন্ট করার সময় আমরা এই userId-টা পাঠাব

      if (userId) {
        // Clerk-এর metadata আপডেট করে ইউজারকে 'Pro' বানিয়ে দেওয়া হচ্ছে
        const client = await clerkClient();
        await client.users.updateUser(userId, {
          publicMetadata: {
            isPro: true,
          },
        });
        console.log(`User ${userId} is now PRO!`);
      }
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}