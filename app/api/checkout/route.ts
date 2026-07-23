import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { userId } = await auth(); 
    const body = await request.json();
    const { email } = body; 

    console.log("Checkout API called.");
    console.log("User ID:", userId);
    console.log("Customer Email received:", email);

    if (!userId) {
      console.error("Unauthorized: No user ID found.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      console.error("Bad Request: Email is missing from the request body.");
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: userRecord, error: supabaseError } = await supabase.from('users').select('is_subscribed').eq('user_id', userId).single();

    if (supabaseError) {
      console.error("Supabase Error fetching user record:", supabaseError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (userRecord?.is_subscribed) {
      console.log("User is already subscribed, redirecting to pro-dashboard.");
      return NextResponse.json({ url: '/pro-dashboard' });
    }

    const dodoApiKey = process.env.DODO_API_KEY;
    if (!dodoApiKey) {
      console.error("Server Error: DODO_API_KEY is not set.");
      return NextResponse.json({ error: 'Server configuration error: Dodo API key missing' }, { status: 500 });
    }

    const productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || 'pdt_0NhPHbZJ8Y9jhfmkRl7Mr';
    console.log("Using Dodo Product ID:", productId);
    const returnUrl = process.env.NEXT_PUBLIC_DODO_RETURN_URL || 'http://localhost:3000/checkout-redirect';
    console.log("Using Dodo Return URL:", returnUrl);

    // Dodo-র সঠিক পেলোড স্ট্রাকচার
    const dodoPayload = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: email },
      return_url: returnUrl,
      metadata: { clerkUserId: userId } // <-- এই জাদুকরী লাইনটা যোগ করো
    };

    console.log("Sending payload to Dodo:", JSON.stringify(dodoPayload, null, 2));
    console.log("API Key starts with:", dodoApiKey.substring(0, 10));

    // Cursor-এর ভুল লিঙ্কটা পাল্টে আবার আসল লিঙ্ক বসানো হয়েছে
    const response = await fetch('https://test.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dodoPayload),
    });

    const textResponse = await response.text();
    console.log("Response from Dodo (status", response.status, "):", textResponse);

    if (!response.ok) {
      let errorMessage = "Unknown Dodo API error.";
      try {
        const errorData = JSON.parse(textResponse);
        errorMessage = errorData.message || errorData.error || textResponse;
      } catch (parseError) {
        errorMessage = textResponse;
      }
      console.error(`🚨 DODO API ERROR: ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = JSON.parse(textResponse);
    console.log("Parsed Dodo response data:", data);
    return NextResponse.json({ url: data.checkout_url });

  } catch (error: any) {
    console.error("Internal Server Error in checkout API:", error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}