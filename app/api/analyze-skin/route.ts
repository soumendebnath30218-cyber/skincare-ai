import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export async function POST(req: Request) {
  try {
    console.log("--- 🚀 NEW API CALL: ANALYZE SKIN ---");
    
    // Clerk থেকে ইউজার আইডি নেওয়ার চেষ্টা করবে
    const { userId } = await auth();
    console.log("1. Clerk User ID:", userId || "NULL (⚠️ GUEST MODE!)");

    const body = await req.json();
    const { image } = body;

    if (!image) {
      console.log("❌ Error: No image provided");
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let historyContext = "This is the user's FIRST scan. Give an honest baseline skin health score out of 10. Also, provide a beginner 30-day AM/PM routine.";
    let aiResult;

    const promptText = `CRITICAL STEP 0 (FRAUD & CHEAT DETECTION): Before doing any skin analysis, you MUST verify if the image is a genuine, clear, natural human face. If the face is covered in ink, heavy paint, wearing a mask, extremely blurry, or is not a human face at all, you must IMMEDIATELY return ONLY this JSON: {"error": "Invalid photo or face obscured. Please try again with a natural, clean face."}. DO NOT proceed with any further analysis or scoring.
    IF GENUINE: You are a world-class AI Dermatologist. Analyze this facial image carefully.
    Context: {HISTORY_PLACEHOLDER}
    
    Identify exactly 3 visible basic flaws.
    Additionally, calculate professional aesthetic metrics.
    Output ONLY a valid JSON object. Do NOT use markdown (like \`\`\`json). Just the raw JSON format.
    Format must be exactly like this:
    {
      "score": 7.5,
      "basic_flaws": ["Flaw 1", "Flaw 2", "Flaw 3"],
      "solution": "Quick advice",
      "routine": "AM/PM Routine",
      "skin_age": 24,
      "symmetry_score": 92.5,
      "golden_ratio_match": 1.61,
      "melanin_evenness": "High",
      "raw": "Summary"
    }`;

    // ========================================================
    // 🌟 সিনেরিও ১: ইউজার লগইন করে আছে 🌟
    // ========================================================
    if (userId) {
      console.log("2. Valid User found. Checking today's scan limit...");
      const today = new Date().toISOString().split('T')[0];

      // START: Temporarily commented out daily scan limit check for testing
      /*
      // ১. চেক করবে আজকে স্ক্যান হয়েছে কি না
      const { data: todayScan } = await supabase
        .from("user_scans")
        .select("id")
        .eq("user_id", userId)
        .eq("scan_date", today);

      if (todayScan && todayScan.length > 0) {
        console.log("❌ User already scanned today! Blocked.");
        return NextResponse.json({ 
          success: false, 
          error: "You have already completed today's scan! Come back tomorrow for your next check-in." 
        }, { status: 400 });
      }
      */
      // END: Temporarily commented out daily scan limit check for testing

      // ২. আগের হিস্ট্রি চেক করবে
      console.log("3. Fetching past scan history...");
      const { data: pastScans } = await supabase
        .from("user_scans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastScan = pastScans && pastScans.length > 0 ? pastScans[0] : null;

      if (lastScan) {
        console.log("👉 Found previous scan. Adjusting AI prompt...");
        historyContext = `The user's LAST skin score was ${lastScan.score}/10. 
        Their last recommended routine was: ${lastScan.routine}.
        Compare this new image with their history. 
        You must NOT change the score drastically. If improved, increase score by a maximum of +0.1 or +0.2. If worsened (naturally, not due to ink/paint), decrease by max -0.1 or -0.2.
        Ensure the new routine builds logically upon the previous day's routine for consistency.`;
      }

      // ৩. এআই-কে কল করা
      console.log("4. Calling Gemini AI...");
      const finalPrompt = promptText.replace("{HISTORY_PLACEHOLDER}", historyContext);
      const result = await model.generateContent([finalPrompt, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }]);
      const aiResponseText = result.response.text().replace(/```json/g, '').replace(/```/g, '');

      try {
        aiResult = JSON.parse(aiResponseText);
        console.log("✅ AI Response parsed successfully. Score:", aiResult.score);
      } catch (parseError: any) {
        console.error("❌ AI Response JSON Parse Error:", parseError, "Raw AI Response:", aiResponseText);
        return NextResponse.json({ success: false, error: "AI returned an invalid JSON format." }, { status: 500 });
      }

      if (aiResult.error) {
        console.log("⚠️ AI detected fraud/invalid image:", aiResult.error);
        return NextResponse.json({ success: false, error: aiResult.error }, { status: 400 });
      }

      // ৪. ডেটাবেসে সেভ করা
      console.log("5. Attempting to save data to Supabase 'user_scans' table...");
      const { error: insertError } = await supabase.from("user_scans").insert([{
        user_id: userId,
        score: aiResult.score,
        problems: aiResult.basic_flaws,
        solution: aiResult.solution,
        routine: aiResult.routine,
        raw: aiResult.raw,
        skin_age: aiResult.skin_age,
        symmetry_score: aiResult.symmetry_score,
        golden_ratio_match: aiResult.golden_ratio_match,
        melanin_evenness: aiResult.melanin_evenness,
      }]);

      if (insertError) {
        console.error("🚨 SUPABASE INSERT ERROR:", insertError);
      } else {
        console.log("🎉 DATA SAVED SUCCESSFULLY IN SUPABASE!");
      }

    } 
    // ========================================================
    // 🌟 সিনেরিও ২: ইউজার ফ্রি/লগইন ছাড়াই এসেছে (Guest) 🌟
    // ========================================================
    else {
      console.log("⚠️ Guest Mode: Skipping DB checks and saves.");
      const finalPrompt = promptText.replace("{HISTORY_PLACEHOLDER}", historyContext);
      const result = await model.generateContent([finalPrompt, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }]);
      const aiResponseText = result.response.text().replace(/```json/g, '').replace(/```/g, '');

      try {
        aiResult = JSON.parse(aiResponseText);
        console.log("✅ Guest AI Response parsed successfully.");
      } catch (parseError: any) {
        console.error("❌ Guest AI Parse Error:", aiResponseText);
        return NextResponse.json({ success: false, error: "AI returned an invalid JSON format." }, { status: 500 });
      }

      if (aiResult.error) {
        return NextResponse.json({ success: false, error: aiResult.error }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, analysis: JSON.stringify(aiResult), isGuest: !userId });

  } catch (error: any) {
    console.error("🚨 SEVERE API/DB ERROR:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process scan." }, { status: 500 });
  }
}