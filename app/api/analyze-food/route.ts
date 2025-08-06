import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);

    console.log("Image Response Status:", imageResponse.status);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
    const MODEL_ID = "gemma-3-27b-it";
    const GENERATE_CONTENT_API = "streamGenerateContent";

    const nutritionSchema = `
final nutritionSchema = {
  "type": "OBJECT",
  "properties": {
    "dishName": {"type": "STRING"},
    "servingSize": {"type": "STRING", "description": "e.g., 100g, 1 cup, 1 serving"},
    "calories": {"type": "NUMBER"},
    "protein": {"type": "NUMBER", "description": "in grams"},
    "carbohydrates": {"type": "NUMBER", "description": "in grams"},
    "fat": {"type": "NUMBER", "description": "in grams"},
    "sugar": {"type": "NUMBER", "description": "in grams", "nullable": true},
    "fiber": {"type": "NUMBER", "description": "in grams", "nullable": true},
    "sodium": {"type": "NUMBER", "description": "in milligrams", "nullable": true},
    "keyVitamins": {"type": "ARRAY", "items": {"type": "STRING"}, "nullable": true},
    "keyMinerals": {"type": "ARRAY", "items": {"type": "STRING"}, "nullable": true},
    "ingredientsGuess": {"type": "ARRAY", "items": {"type": "STRING"}, "nullable": true},
    "healthTips": {"type": "ARRAY", "items": {"type": "STRING"}, "nullable": true},
    "disclaimer": {
      "type": "STRING",
      "default": "Nutritional information is an estimate and may vary based on specific ingredients and preparation."
    }
  },
  "required": ["dishName", "servingSize", "calories", "protein", "carbohydrates", "fat"]
};
`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Provide detailed estimated nutritional information for a standard serving of;\n${nutritionSchema} always your response in JSON format.`,
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            text: `Here is the image encoded in base64:\n[mimeType: ${mimeType}]\n[data: ${base64Image}]`,
          },
        ],
      },
    ];

    const body = JSON.stringify({
      contents,
      generationConfig: {},
    });

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return NextResponse.json(
        { error: "Gemini API error", detail: errorText },
        { status: geminiResponse.status }
      );
    }

    const geminiData = await geminiResponse.text();
    console.log("Gemini Response:", geminiData);

    return NextResponse.json({ data: geminiData }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: String(error) },
      { status: 500 }
    );
  }
}
