import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import DashboardUI from './DashboardUI';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ১. ইউজারের তথ্য নেওয়া
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  // ২. Supabase-এর সাথে কানেকশন
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ৩. ডাটাবেসে ইউজার আছে কি না চেক করা
  const { data: userRecord } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  // ৪. ইউজার না থাকলে ডাটাবেসে সেভ করা এবং Pricing পেজে পাঠানো
  if (!userRecord) {
    await supabase.from('users').insert([
      {
        user_id: userId,
        email: user?.emailAddresses[0]?.emailAddress,
        is_subscribed: false
      }
    ]);
    redirect('/pricing');
  }

  // ৫. ইউজার আছে কিন্তু পেমেন্ট করেনি (Free User), তাকেও Pricing পেজে পাঠানো
  if (userRecord && !userRecord.is_subscribed) {
    redirect('/pricing');
  }

  // ৬. সব ঠিক থাকলে তোমার সেই সুন্দর ডিজাইনের UI টা রেন্ডার করা
  return <DashboardUI>{children}</DashboardUI>;
}