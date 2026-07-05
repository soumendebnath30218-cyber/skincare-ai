import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { userId } = await auth(); 
    const body = await request.json();
    const { email } = body; 

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: userRecord } = await supabase.from('users').select('is_subscribed').eq('user_id', userId).single();

    if (userRecord?.is_subscribed) {
      return NextResponse.json({ url: '/pro-dashboard' }); 
    }

    const dodoApiKey = process.env.DODO_API_KEY;
    const response = await fetch('https://test.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: 'pdt_0NhPHbZJ8Y9jhfmkRl7Mr', quantity: 1 }],
        customer: { email: email },
        return_url: 'http://localhost:3000/checkout-redirect', 
      }),
    });

    const textResponse = await response.text();
    if (!response.ok) return NextResponse.json({ error: textResponse }, { status: response.status });
    
    const data = JSON.parse(textResponse);
    return NextResponse.json({ url: data.checkout_url });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
