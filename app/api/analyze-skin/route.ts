import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const IS_TESTING = true; 
const SUBSCRIPTION_DURATION_MS = IS_TESTING ? 60 * 1000 : 32 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

    const { userId } = await auth(); 
    const body = await req.json();
    const { image, previousScore, previousIssues } = body;

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    let masterPlan = null;

    if (userId) {
      const { count: scanCount } = await supabase.from("daily_scans").select("*", { count: 'exact', head: true }).eq("user_id", userId);

      if (scanCount && scanCount >= 30) {
        return NextResponse.json({ success: false, error_type: "limit_reached", error: "30-day journey completed." }, { status: 403 });
      }

      const { data: lastScan } = await supabase.from("daily_scans").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();

      if (lastScan) {
        const lastScanTime = new Date(lastScan.created_at).getTime();
        const nextAllowedScan = lastScanTime + (24 * 60 * 60 * 1000); 
        const now = Date.now();

        if (now < nextAllowedScan && !IS_TESTING) {
          const remainingMs = nextAllowedScan - now;
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          return NextResponse.json({ success: false, error_type: "wait_time", error: `Wait ${hours}h ${minutes}m.` }, { status: 429 });
        }
      }

      const { data: planData } = await supabase.from("master_glow_plans").select("*").eq("user_id", userId).single();
      if (planData) masterPlan = planData;
    }

    let mimeType = "image/jpeg";
    let base64Data = image;
    
    if (image.includes(";base64,")) {
        mimeType = image.split(";")[0].replace("data:", "");
        base64Data = image.split(",")[1];
    }

    console.log("📡 Sending request to Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // 🚨 Passing Yesterday's data to AI for real comparison 🚨
    let trackingData = previousScore ? `\nPrevious Score: ${previousScore}` : "";
    if (previousIssues) trackingData += `\nPrevious Issues: ${JSON.stringify(previousIssues)}`;

    let promptText = ``;

    if (!masterPlan) {
      promptText = `
        You are a world-class Holistic Dermatologist analyzing a face.
        
        🚨 CRITICAL RULES FOR 100% NATURAL, HOMEMADE & AFFORDABLE 🚨:
        1. NO COMMERCIAL WORDS: You are STRICTLY FORBIDDEN from using words like "Toner", "Moisturizer", "Mist", "Balm", "Serum", "Cream", "Cleanser".
        2. SUPER CHEAP & ACCESSIBLE: Use ONLY everyday, extremely affordable kitchen ingredients (e.g., Turmeric, Raw Milk, Honey, Cucumber, Gram Flour/Besan, Coconut Oil, Tomato, Aloe Vera).
        3. SHORT & PUNCHY ISSUES (UI/UX RULE): The "issues" array MUST contain exactly 4 to 5 short, specific facial skin problems (max 10-15 words).
        4. 🚨 NEW: COMPARISON & EXTRA CARE: Since this is Day 1, for "improvement_status" write exactly "Day 1: Baseline established. Your 30-Day journey begins today!". For "recommendations", provide 1 or 2 specific "Extra Care" tips for today based on the most severe issue you see.
        5. Detailed steps for routines and diet.
        
        Return EXACTLY this JSON structure:
        {
          "success": true,
          "score": 7.8,
          "improvement_status": "Day 1: Baseline established. Your 30-Day journey begins today!",
          "issues": ["<Short issue 1>", "<Short issue 2>", "<Short issue 3>", "<Short issue 4>"],
          "recommendations": ["<Specific Extra Care tip for today>"],
          "routine": {
            "morning": { "title": "Morning Routine", "description": "<Long desc>", "steps": ["<step 1>", "<step 2>"] },
            "afternoon": { "title": "Afternoon Routine", "description": "<Long desc>", "steps": ["<step 1>"] },
            "night": { "title": "Night Routine", "description": "<Long desc>", "steps": ["<step 1>", "<step 2>"] }
          },
          "symmetry_score": 90.5,
          "golden_ratio_match": 1.62,
          "melanin_evenness": "88%",
          "skin_age": 25,
          "premium_30_day_cosmetic": [
            { "step": "Morning", "product_type": "<Raw Natural Name>", "reason": "<Reason>", "preparation_steps": ["<Step 1>", "<Step 2>"] },
            { "step": "Afternoon", "product_type": "<Raw Natural Name>", "reason": "<Reason>", "preparation_steps": ["<Step 1>", "<Step 2>"] },
            { "step": "Night", "product_type": "<Raw Natural Name>", "reason": "<Reason>", "preparation_steps": ["<Step 1>", "<Step 2>"] }
          ],
          "premium_30_day_diet": [
            { "time": "Wake Up", "food": "<Drink>", "benefit": "<Benefit>" },
            { "time": "Breakfast", "food": "<Meal>", "benefit": "<Benefit>" },
            { "time": "Lunch", "food": "<Meal>", "benefit": "<Benefit>" },
            { "time": "Dinner", "food": "<Meal>", "benefit": "<Benefit>" }
          ]
        }
        ${trackingData}
      `;
    } else {
      promptText = `
        You are tracking daily holistic progress. Provide highly detailed advice.
        
        🚨 STRICT RULES: 
        1. NEVER use cosmetic words. Use ONLY super cheap kitchen ingredients.
        2. SHORT & PUNCHY ISSUES (max 10-15 words per issue).
        3. 🚨 NEW: COMPARISON & EXTRA CARE: Look at the "Previous Score" and "Previous Issues" provided below. Compare them with your current analysis. In "improvement_status", write 2-3 short, natural sentences explaining what improved, what got worse, or what stayed the same (e.g., "Your glow improved from 7.5 to 7.8! Hydration looks better, but under-eye dark circles still need attention."). In "recommendations", provide a specific "Extra Care" tip for today based on the comparison.
        
        Return EXACTLY this JSON structure:
        {
          "success": true,
          "score": 7.5,
          "improvement_status": "<Detailed comparison between Yesterday and Today>",
          "issues": ["<Short specific issue 1>", "<Short specific issue 2>", "<Short specific issue 3>"],
          "recommendations": ["<Specific Extra Care tip based on comparison>"],
          "routine": {
            "morning": { "title": "Morning", "steps": ["<step>", "<step>"] },
            "afternoon": { "title": "Afternoon", "steps": ["<step>"] },
            "night": { "title": "Night", "steps": ["<step>", "<step>"] }
          },
          "symmetry_score": 90.5,
          "golden_ratio_match": 1.62,
          "melanin_evenness": "85%",
          "skin_age": 25
        }
        ${trackingData}
      `;
    }

    const result = await model.generateContent([promptText, { inlineData: { data: base64Data, mimeType: mimeType } }]);
    
    let textResponse = result.response.text().replace(/[\`]{3}json/gi, "").replace(/[\`]{3}/g, "").trim();

    const firstBrace = textResponse.indexOf('{');
    const lastBrace = textResponse.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        textResponse = textResponse.substring(firstBrace, lastBrace + 1);
    }
      
    let aiResult;
    try {
      aiResult = JSON.parse(textResponse);
      console.log("✅ AI Response Parsed successfully");
    } catch (parseError) {
      console.error("🔴 AI PARSING FAILED:", textResponse);
      return NextResponse.json({ success: false, error: "AI returned invalid format." }, { status: 500 });
    }

    if (aiResult.success === false) return NextResponse.json(aiResult, { status: 400 });

    if (userId) {
      const todayDate = new Date().toISOString().split('T')[0]; 
      
      if (!masterPlan) {
        console.log("💾 Saving Master Plan & Daily Scan to DB...");
        const { error: masterErr } = await supabase.from("master_glow_plans").insert([{ user_id: userId, cosmetic_routine: aiResult.premium_30_day_cosmetic, diet_plan: aiResult.premium_30_day_diet }]);
        if (masterErr) console.error("🚨 Master Plan DB Error:", masterErr); 

        // 🚨 Using AI generated improvement_status 🚨
        const { error: dailyErr } = await supabase.from("daily_scans").insert([{ user_id: userId, scan_date: todayDate, analysis_result: JSON.stringify(aiResult), improvement_status: aiResult.improvement_status }]);
        if (dailyErr) console.error("🚨 Daily Scan DB Error:", dailyErr); 
        
      } else {
        console.log("💾 Saving Daily Scan to DB...");
        // 🚨 Using AI generated comparison 🚨
        const { error: dailyErr } = await supabase.from("daily_scans").insert([{ user_id: userId, scan_date: todayDate, analysis_result: JSON.stringify(aiResult), improvement_status: aiResult.improvement_status }]);
        if (dailyErr) console.error("🚨 Daily Scan DB Error:", dailyErr); 
      }
    }

    console.log("🚀 Request Completed!");
    return NextResponse.json({ success: true, analysis: aiResult });

  } catch (error: any) {
    console.error("🔴 CRITICAL ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to process scan." }, { status: 500 });
  }
}