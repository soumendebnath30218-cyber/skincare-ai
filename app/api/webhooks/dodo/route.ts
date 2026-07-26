import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';
import crypto from "node:crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// একই event দুইবার process যাতে না হয় (Dodo at-least-once delivery করে, duplicate পাঠাতে পারে)
const processedWebhookIds = new Set<string>();

function verifySignature(
  rawBody: string,
  webhookId: string,
  timestamp: string,
  signatureHeader: string,
  secret: string
): boolean {
  const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("base64");

  // Header ফরম্যাট: "v1,<signature>" (একাধিক signature space দিয়ে আলাদা করা থাকতে পারে)
  const providedSignatures = signatureHeader
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter(Boolean);

  return providedSignatures.some((sig) =>
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const webhookId = req.headers.get("webhook-id") || "";
    const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
    const webhookSignature = req.headers.get("webhook-signature") || "";
    const secret = process.env.DODO_WEBHOOK_SECRET;

    if (!secret) {
      console.error("DODO_WEBHOOK_SECRET is not set.");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("Missing webhook headers — rejecting request.");
      return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
    }

    const isValid = verifySignature(rawBody, webhookId, webhookTimestamp, webhookSignature, secret);
    if (!isValid) {
      console.error("Invalid webhook signature — rejecting request.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Duplicate event guard
    if (processedWebhookIds.has(webhookId)) {
      console.log(`Webhook ${webhookId} already processed, skipping.`);
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }
    processedWebhookIds.add(webhookId);

    const payload = JSON.parse(rawBody);
    console.log("Dodo Webhook Payload:", JSON.stringify(payload, null, 2));

    const data = payload.data || {};
    const eventType = payload.type as string;
    const userId = data.metadata?.clerkUserId;

    if (!userId) {
      console.error("Error: clerkUserId not found in metadata!", eventType);
      return NextResponse.json({ message: "No user id in metadata" }, { status: 200 });
    }

    // Subscription active রাখা উচিত এমন events
    const activeEvents = [
      "payment.succeeded",
      "subscription.active",
      "subscription.renewed",
    ];

    // Subscription বন্ধ করা উচিত এমন events
    const inactiveEvents = [
      "subscription.cancelled",
      "subscription.expired",
      "payment.failed",
      "refund.succeeded",
    ];

    let shouldBeSubscribed: boolean | null = null;

    if (activeEvents.includes(eventType) || data.status === "active") {
      shouldBeSubscribed = true;
    } else if (inactiveEvents.includes(eventType) || data.status === "cancelled" || data.status === "expired") {
      shouldBeSubscribed = false;
    } else {
      // subscription.updated এর মতো event — status field দিয়ে সিদ্ধান্ত নাও
      if (data.status === "active") shouldBeSubscribed = true;
      else if (data.status) shouldBeSubscribed = false;
    }

    if (shouldBeSubscribed === null) {
      console.log(`Event ${eventType} — no subscription state change needed.`);
      return NextResponse.json({ message: "No action needed" }, { status: 200 });
    }

    // Clerk আপডেট
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { isPro: shouldBeSubscribed },
    });
    console.log(`Clerk: User ${userId} isPro = ${shouldBeSubscribed}`);

    // Supabase আপডেট — কতগুলো row আপডেট হলো সেটাও চেক করা হচ্ছে
    const { data: updatedRows, error } = await supabase
      .from('users')
      .update({ is_subscribed: shouldBeSubscribed })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error("Supabase Update Error:", error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.error(`No user row found for user_id ${userId} — nothing updated!`);
    } else {
      console.log(`Supabase: user_id ${userId} is_subscribed = ${shouldBeSubscribed}`);
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook Error:", error.message, error.stack);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}