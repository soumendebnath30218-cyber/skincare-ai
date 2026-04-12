import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    // গোয়েন্দা ১: চাবি আছে কিনা চেক করা
    console.log("API Key Check:", process.env.GEMINI_API_KEY ? "Key Found! ✅" : "KEY MISSING! ❌");
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const { image } = await req.json();
    const base64Data = image.split(",")[1];

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
      "Act as a professional dermatologist. Analyze this skin image and provide a 3-line report.",
    ]);

    const response = await result.response;
    return new Response(JSON.stringify({ analysis: response.text() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });



// ✅ ডামি রেসপন্স (API লিমিট এড়ানোর জন্য)
// return new Response(JSON.stringify({ 
//     analysis: "এটি একটি ডামি রেজাল্ট। স্কিন ইমেজে হালকা ব্রণ দেখা যাচ্ছে, পরিমিত জল পান করুন। আপাতত ফ্রন্টএন্ডের ডিজাইন টেস্টিং চলছে..." 
//   }), { 
//     status: 200,
//     headers: { 'Content-Type': 'application/json' }
//   });

















  } catch (error: any) {
    // গোয়েন্দা ২: আসল সমস্যাটা টার্মিনালে ছাপানো
    console.error("🔥 ERROR DETAILS:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  }
}