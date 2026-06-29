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
    
    // 🌟 1. RECEIVE MEDIAPIPE DATA FROM FRONTEND 🌟
    const { image, previousScore, previousIssues, mediaPipeScore = 8.5, mediaPipeSymmetry = 90.0 } = body;

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    let masterPlan = null;

    // --- User Authorization & Limits Logic ---
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

    // --- Image Processing Logic ---
    let mimeType = "image/jpeg";
    let base64Data = image;
    
    if (image.includes(";base64,")) {
        mimeType = image.split(";")[0].replace("data:", "");
        base64Data = image.split(",")[1];
    }
    
    // --- Prompt Generation Logic ---
    let trackingData = previousScore ? `\nPrevious Final Score: ${previousScore}` : "";
    if (previousIssues) trackingData += `\nPrevious Issues: ${JSON.stringify(previousIssues)}`;

    let promptText = ``;

    if (!masterPlan) {
      promptText = `
        You are a world-class Holistic Dermatologist analyzing a face.
        
        🚨 CRITICAL RULES FOR 100% NATURAL, HOMEMADE & AFFORDABLE 🚨:
        1. HUMAN FACE VALIDATION: First, strictly check if the image is a clear HUMAN face. If it is an animal (like a dog/cat), an object, a cartoon, or unclear, you MUST set "is_valid_human": false and keep all other fields empty or dummy.
        2. NO COMMERCIAL WORDS: You are STRICTLY FORBIDDEN from using words like "Toner", "Moisturizer", "Mist", "Balm", "Serum", "Cream", "Cleanser".
        3. SUPER CHEAP & ACCESSIBLE: Use ONLY everyday, extremely affordable kitchen ingredients (e.g., Turmeric, Raw Milk, Honey, Cucumber, Gram Flour/Besan, Coconut Oil, Tomato, Aloe Vera).
        4. SHORT & PUNCHY ISSUES (UI/UX RULE): The "issues" array MUST contain exactly 4 to 5 short, specific facial skin problems (max 10-15 words).
        5. 🚨 SCORE RULE (NEW): DO NOT GUESS OVERALL SCORE. Give a "skin_health_score" out of 10 evaluating ONLY acne, texture, and blemishes. (Geometry and symmetry are handled externally).
        6. 🚨 COMPARISON & EXTRA CARE: Since this is Day 1, for "improvement_status" write exactly "Day 1: Baseline established. Your 30-Day journey begins today!". For "recommendations" (which must be an array with one string), make a SMART decision: If you see a severe/active issue (like active acne, dark circles, or extreme dryness), provide ONE short, specific natural home-remedy tip (e.g., ["Apply raw honey on the active breakout for 10 mins"]). If the skin looks mostly fine or has only minor issues, write exactly: ["Stick strictly to your 30-Day Natural Protocol below. Hydration and natural ingredients are your primary goals for today."]
        7. Detailed steps for routines and diet.
        
        Return EXACTLY this JSON structure:
        {
          "is_valid_human": true,
          "success": true,
          "skin_health_score": 7.5,
          "improvement_status": "Day 1: Baseline established. Your 30-Day journey begins today!",
          "issues": ["<Short issue 1>", "<Short issue 2>", "<Short issue 3>", "<Short issue 4>"],
          "recommendations": ["<Smart Extra Care tip OR Generic Message>"],
          "routine": {
            "morning": { "title": "Morning Routine", "description": "<Long desc>", "steps": ["<step 1>", "<step 2>"] },
            "afternoon": { "title": "Afternoon Routine", "description": "<Long desc>", "steps": ["<step 1>"] },
            "night": { "title": "Night Routine", "description": "<Long desc>", "steps": ["<step 1>", "<step 2>"] }
          },
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
        1. HUMAN FACE VALIDATION: First, strictly check if the image is a clear HUMAN face. If it is an animal (like a dog/cat), an object, a cartoon, or unclear, you MUST set "is_valid_human": false and keep all other fields empty or dummy.
        2. NEVER use cosmetic words. Use ONLY super cheap kitchen ingredients.
        3. SHORT & PUNCHY ISSUES (max 10-15 words per issue).
        4. 🚨 SCORE RULE (NEW): Provide a "skin_health_score" out of 10 evaluating ONLY skin health (acne, glow, texture). DO NOT calculate overall structure.
        5. 🚨 COMPARISON & EXTRA CARE: Look at the "Previous Score" and "Previous Issues" provided below. Compare them with your current analysis. In "improvement_status", write 2-3 short, natural sentences explaining what improved, what got worse, or what stayed the same. CRITICAL: Analyze the real data, but DO NOT copy example texts verbatim. You MUST use the REAL previous score and the REAL current score. If the score dropped, you must explicitly state that it decreased. 
        For "recommendations" (which must be an array with one string), make a SMART decision: If the current analysis shows a new or worsening specific issue, provide ONE short, specific natural home remedy in an array. If the skin is improving or stable, write exactly: ["Stick strictly to your 30-Day Natural Protocol below. Hydration and natural ingredients are your primary goals for today."]
        
        Return EXACTLY this JSON structure:
        {
          "is_valid_human": true,
          "success": true,
          "skin_health_score": 7.5,
          "improvement_status": "<Detailed comparison between Yesterday and Today>",
          "issues": ["<Short specific issue 1>", "<Short specific issue 2>", "<Short specific issue 3>"],
          "recommendations": ["<Smart Extra Care tip OR Generic Message>"],
          "routine": {
            "morning": { "title": "Morning", "steps": ["<step>", "<step>"] },
            "afternoon": { "title": "Afternoon", "steps": ["<step>"] },
            "night": { "title": "Night", "steps": ["<step>", "<step>"] }
          },
          "golden_ratio_match": 1.62,
          "melanin_evenness": "85%",
          "skin_age": 25
        }
        ${trackingData}
      `;
    }

    // 🚀 Multi-Model Fallback Logic 🚀
    console.log("📡 Starting Multi-Model AI Analysis...");
    
    const AI_MODELS = [
      "gemma-4-31b-it",      
      "gemma-4-26b-a4b-it",      
      "gemini-3.5-flash",    
      "gemini-3-flash",      
      "gemini-2.5-flash"     
    ];
    let aiResult = null;
    let textResponse = "";
    let successfulModel = "";

    for (const modelName of AI_MODELS) {
      try {
        console.log(`🔄 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent([promptText, { inlineData: { data: base64Data, mimeType: mimeType } }]);
        textResponse = result.response.text().replace(/[\`]{3}json/gi, "").replace(/[\`]{3}/g, "").trim();

        const firstBrace = textResponse.indexOf('{');
        const lastBrace = textResponse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            textResponse = textResponse.substring(firstBrace, lastBrace + 1);
        }
          
        aiResult = JSON.parse(textResponse);
        
        if (aiResult) {
           
           // 🌟 2. THE MAGICAL ENSEMBLE MATH & AI/ML CLAMPING 🌟
           const geminiHealthScore = aiResult.skin_health_score || aiResult.score || 7.0;
           const rawCombinedScore = (mediaPipeScore * 0.4) + (geminiHealthScore * 0.6);
           
           let finalScore = rawCombinedScore;

           // 🧠 AI/ML DELTA CLAMPING & DEADZONE LOGIC 🧠
           if (!previousScore) {
               // DAY 1 (Baseline): 6.5 - 8.2 Range
               finalScore = Math.max(6.5, Math.min(rawCombinedScore, 8.2));
           } else {
               // DAY 2+ (Tracking)
               const delta = rawCombinedScore - previousScore;

               // 🎯 THE DEADZONE: বেশিরভাগ দিন স্কিন সেম থাকে 🎯
               if (Math.abs(delta) < 0.15) {
                   finalScore = previousScore;
               } 
               else if (delta > 0) {
                   // Improvement: +0.1 to +0.3
                   const boost = Math.max(0.1, Math.min(delta * 0.3, 0.3)); 
                   finalScore = previousScore + boost;
               } 
               else if (delta < 0) {
                   // Degradation: -0.1 to -0.5
                   const drop = Math.max(0.1, Math.min(Math.abs(delta) * 0.4, 0.5));
                   finalScore = previousScore - drop;
               } 
               
               // Maximum Limit Cap (পুরো ৩০ দিনের আল্টিমেট লিমিট)
               finalScore = Math.min(finalScore, 9.1);
           }
           
           aiResult.score = Number(finalScore.toFixed(1));
           aiResult.symmetry_score = mediaPipeSymmetry;
           
           successfulModel = modelName;
           console.log(`✅ Success! Model: ${successfulModel} | MediaPipe: ${mediaPipeScore} | Gemini: ${geminiHealthScore} | Final Score: ${aiResult.score}`);
           break; 
        }
      } catch (error: any) {
        console.error(`🚨 ACTUAL ERROR FOR ${modelName}:`, error?.message || error); 
        console.warn(`⚠️ Model ${modelName} failed or returned invalid format. Switching to next model...`);
      }
    }

    if (!aiResult) {
      console.error("🔴 ALL MODELS FAILED! Rate limits exhausted or parsing failed.");
      return NextResponse.json({ success: false, error: "Our AI servers are super busy right now! Please try scanning again in 1 minute." }, { status: 500 });
    }

    // 🛑 The Ultimate Block for Non-Human Faces 🛑
    if (aiResult.is_valid_human === false) {
      console.log("🚫 Animal/Object Detected! Blocking scan.");
      return NextResponse.json({ 
          success: false, 
          error: "Invalid image! Please upload a clear picture of a HUMAN face." 
      }, { status: 400 });
    }

    // --- Database Saving Logic ---
    if (userId) {
      const todayDate = new Date().toISOString().split('T')[0]; 
      
      if (!masterPlan) {
        console.log("💾 Saving Master Plan & Daily Scan to DB...");
        const { error: masterErr } = await supabase.from("master_glow_plans").insert([{ user_id: userId, cosmetic_routine: aiResult.premium_30_day_cosmetic, diet_plan: aiResult.premium_30_day_diet }]);
        if (masterErr) console.error("🚨 Master Plan DB Error:", masterErr); 

        const { error: dailyErr } = await supabase.from("daily_scans").insert([{ user_id: userId, scan_date: todayDate, analysis_result: JSON.stringify(aiResult), improvement_status: aiResult.improvement_status }]);
        if (dailyErr) console.error("🚨 Daily Scan DB Error:", dailyErr); 
        
      } else {
        console.log("💾 Saving Daily Scan to DB...");
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