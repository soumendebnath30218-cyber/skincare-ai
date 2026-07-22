import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // ডেটা লগে প্রিন্ট করছি, যাতে পেমেন্ট হলে আমরা Vercel-এ ডেটা দেখতে পাই
    console.log("Dodo Webhook Payload:", JSON.stringify(payload, null, 2));

    // Dodo Payments ডেটা 'data' অবজেক্টের ভেতরেও পাঠাতে পারে
    const paymentData = payload.data || payload; 
    
// ইভেন্টের নাম চেক করছি (নতুন subscription.active যোগ করা হলো)
const isSuccess = payload.type === "payment.succeeded" || 
                  payload.event === "payment_success" || 
                  payload.type === "subscription.active" || // <-- এই লাইনটা যোগ হলো
                  paymentData.status === "succeeded" || 
                  paymentData.status === "completed" ||
                  paymentData.status === "active"; // <-- এই লাইনটাও যোগ হলো
    if (isSuccess) {
      // মেটাডেটা থেকে Clerk ইউজার আইডি বের করা
      const metadata = paymentData.metadata || payload.metadata || {};
      const userId = metadata.clerkUserId; 

      if (userId) {
        // Clerk আপডেট
        const client = await clerkClient();
        await client.users.updateUser(userId, {
          publicMetadata: { isPro: true },
        });
        console.log(`Clerk: User ${userId} is now PRO!`);

        // Supabase আপডেট (এখানেই FALSE টা TRUE হবে)
        const { error } = await supabase
          .from('users')
          .update({ is_subscribed: true })
          .eq('user_id', userId);

        if (error) {
          console.error("Supabase Update Error:", error);
        } else {
          console.log(`Supabase: User subscription updated successfully! (is_subscribed = TRUE)`);
        }
      } else {
        console.log("Error: User ID not found in metadata!");
      }
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}