// File: app/api/checkout/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email } = body; 

    // ✅ Dodo API Key environment variable থেকে লোড করা হচ্ছে
    const dodoApiKey = process.env.DODO_API_KEY;

    if (!dodoApiKey) {
      console.error("Dodo API Key is not set in environment variables.");
      return NextResponse.json({ error: 'Server configuration error: Dodo API Key missing.' }, { status: 500 });
    }

    console.log("Sending request to Dodo Payments...");
    console.log("--- DEBUG START ---");
    console.log("Sending Key:", process.env.DODO_API_KEY ? "YES (Starts with " + process.env.DODO_API_KEY.substring(0, 7) + ")" : "NO KEY");
    console.log("Using Product ID:", "pdt_0NhPHbZJ8Y9jhfmkRl7Mr");

    const response = await fetch('https://test.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: 'pdt_0NhPHbZJ8Y9jhfmkRI7Mr',
            quantity: 1
          }
        ],
        customer: {
          email: email,
        },
        return_url: 'http://localhost:3000/dashboard?payment=success',
      }),
    });

    // ⚠️ JSON-এর বদলে আগে Text হিসেবে পড়ছি যাতে অ্যাপ ক্র্যাশ না করে
    const textResponse = await response.text();
    console.log("Dodo Raw Response:", textResponse, "| Status:", response.status);

    if (!response.ok) {
      // Dodo থেকে কোনো এরর এলে সেটা সরাসরি ফ্রন্টএন্ডে পাঠিয়ে দেব
      return NextResponse.json({ error: textResponse }, { status: response.status });
    }

    // রেসপন্স ঠিক থাকলে তবেই JSON-এ কনভার্ট করব
    const data = JSON.parse(textResponse);
    const checkoutLink = data.checkout_url;

    return NextResponse.json({ url: checkoutLink });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}