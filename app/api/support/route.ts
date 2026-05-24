import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Resend সেটআপ করা হলো
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "সব ফিল্ড পূরণ করা আবশ্যক!" }, { status: 400 });
    }

    // ১. Supabase-এ ডেটা সেভ করা
    const { error } = await supabase
      .from("support_tickets")
      .insert([
        { 
          user_id: userId || 'guest', 
          name, 
          email, 
          subject, 
          message 
        }
      ]);

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // ২. তোমার কাছে ইমেইল নোটিফিকেশন পাঠানো
    try {
      await resend.emails.send({
        from: 'GlowryAI Alert <onboarding@resend.dev>', // ডোমেইন না কেনা পর্যন্ত এটাই থাকবে
        to: ['soumendebnath30218@gmail.com'], // ⚠️ এখানে তোমার নিজের আসল জিমেইল আইডিটা লিখে দাও ⚠️
        subject: `New Ticket: ${subject} (from ${name})`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #f4f4f5; border-radius: 10px;">
            <h2 style="color: #0ea5e9;">GlowryAI Pro - New Support Request 🚨</h2>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 1px solid #e4e4e7; my: 15px;" />
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 8px; font-style: italic;">${message}</p>
            <hr style="border: 1px solid #e4e4e7; my: 15px;" />
            <p><em>Note: You can click "Reply" directly in your email client to respond to ${name}.</em></p>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Email Send Error:", emailError);
      // ইমেইল যেতে সমস্যা হলেও ডেটাবেসে ঠিকই সেভ হবে
    }

    return NextResponse.json({ success: true, message: "মেসেজ সফলভাবে পাঠানো হয়েছে!" });

  } catch (error: any) {
    console.error("🚨 Support API ERROR:", error);
    return NextResponse.json({ success: false, error: "মেসেজ পাঠাতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}