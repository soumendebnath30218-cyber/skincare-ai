import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

// ১. Supabase-এর সাথে অ্যাডমিন কানেকশন তৈরি করা হচ্ছে (Service Role Key ব্যবহার করে)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // ২. Dodo Payments থেকে পেমেন্ট সফল হওয়ার সিগন্যাল আসছে কি না চেক করছি
    if (payload.event === "payment_success" || payload.status === "completed") {
      const userId = payload.metadata.clerkUserId; 

      if (userId) {
        // ৩. Clerk-এর metadata আপডেট করে ইউজারকে 'Pro' বানিয়ে দেওয়া হচ্ছে
        const client = await clerkClient();
        await client.users.updateUser(userId, {
          publicMetadata: {
            isPro: true,
          },
        });
        console.log(`Clerk: User ${userId} is now PRO!`);

        // ৪. Supabase ডাটাবেসে ইউজারের সাবস্ক্রিপশন স্ট্যাটাস আপডেট করা হচ্ছে
        const { error } = await supabase
          .from('users') // তোমার Supabase-এর টেবিলের নাম
          .update({ is_subscribed: true })
          .eq('user_id', userId); // যে কলামে Clerk-এর ID সেভ করা আছে

        if (error) {
          console.error("Supabase Update Error:", error);
        } else {
          console.log(`Supabase: User subscription updated successfully!`);
        }
      }
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}