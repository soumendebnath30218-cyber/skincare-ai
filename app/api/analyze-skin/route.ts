import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Same copy the client shows — never return technical details to the browser. */
const PUBLIC_ANALYSIS_ERROR =
  "Analysis failed due to high server traffic. Please try again or check your internet connection.";

const DERMATOLOGIST_PROMPT = `You are a professional dermatologist assistant analyzing a facial photograph for educational skincare purposes only. This is NOT a medical diagnosis and you must not claim to diagnose disease.

Examine the visible skin for concerns such as: acne or blemishes, dark circles or periorbital pigment, fine lines or wrinkles, redness or irritation, uneven tone or texture, and any dryness or oiliness that is reasonably visible in the photo.

Respond with a SHORT, realistic report (about 120–200 words), using this structure:
- **Summary:** one clear sentence.
- **Observations:** several brief bullet points (start each line with "• ").
- **Gentle tips:** 2–3 practical, non-prescriptive skincare suggestions anyone could discuss with a clinician.

Use cautious wording ("may appear", "could suggest"). If the face is unclear, heavily filtered, obscured, or the image is not a face, say so briefly and do not invent details.

Do not prescribe medications. Do not state certainty.`;

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: "image/jpeg", base64: dataUrl };
}

function jsonError(status: number) {
  return NextResponse.json({ error: PUBLIC_ANALYSIS_ERROR }, { status });
}

export async function POST(req: NextRequest) {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("[analyze-skin] Missing API key in environment");
    return jsonError(500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.error("[analyze-skin] Invalid JSON body");
    return jsonError(400);
  }

  const image =
    body && typeof body === "object" && "image" in body
      ? (body as { image: unknown }).image
      : undefined;
  if (typeof image !== "string" || image.length < 100) {
    console.error("[analyze-skin] Missing or too-short image payload");
    return jsonError(400);
  }

  const { mimeType, base64 } = parseDataUrl(image);
  const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(mimeType);
  if (!allowed) {
    console.error("[analyze-skin] Unsupported mime type:", mimeType);
    return jsonError(400);
  }

  const modelId = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent([
      { text: DERMATOLOGIST_PROMPT },
      {
        inlineData: {
          mimeType:
            mimeType.toLowerCase() === "image/jpg" ? "image/jpeg" : mimeType,
          data: base64,
        },
      },
    ]);

    const text = result.response.text();
    if (!text?.trim()) {
      console.error("[analyze-skin] Empty model response");
      return jsonError(502);
    }

    return NextResponse.json({ analysis: text.trim() });
  } catch (e) {
    console.error("[analyze-skin] Upstream or runtime error:", e);
    return jsonError(502);
  }
}
