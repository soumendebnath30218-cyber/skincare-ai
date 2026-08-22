import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("WEBHOOK_SECRET is not set in environment variables");
    return NextResponse.json({ error: 'Please add WEBHOOK_SECRET from Clerk Dashboard to .env or Vercel' }, { status: 500 });
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers");
    return NextResponse.json({ error: 'Error occurred -- no svix headers' }, { status: 400 });
  }

  // IMPORTANT: raw text body use koro, json() na — signature raw bytes er upor verify hoy
  const body = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    console.log("New user created in Clerk. Inserting/Updating into Supabase...");

    const { id, email_addresses } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // .insert() এর বদলে .upsert() ব্যবহার করা হলো যাতে ডুপ্লিকেট এরর না আসে
    const { error } = await supabase.from('users').upsert({
      user_id: id,
      email: primaryEmail,
      is_subscribed: false
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase Upsert Error:', error);
      return NextResponse.json({ error: 'Failed to insert/update user into database' }, { status: 500 });
    }

    console.log(`User ${id} successfully processed in Supabase!`);
  }

  return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });
}