import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI("AIzaSyCHFpqWcY0byc6LbcAI5rU1_DznXWiDJCc");

export async function POST(request: NextRequest) {
  try {
    const { message, imageData, userContext } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create context-aware prompt for nutrition and meal guidance
    const systemPrompt = `You are a nutrition expert specializing in Sri Lankan cuisine. You help users with:
    - Meal planning and nutrition advice
    - Food identification and nutritional analysis
    - Health recommendations based on dietary habits
    - Sri Lankan food culture and traditional dishes
    
    User Context: ${
      userContext ? JSON.stringify(userContext) : "No user data available"
    }
    
    Provide helpful, accurate, and culturally relevant advice. Keep responses concise but informative.`;

    let prompt = `${systemPrompt}\n\nUser Question: ${message}`;

    let result;
    if (imageData) {
      // Handle image analysis
      const imagePart = {
        inlineData: {
          data: imageData.split(",")[1], // Remove data:image/jpeg;base64, prefix
          mimeType: imageData.split(";")[0].split(":")[1],
        },
      };

      result = await model.generateContent([
        `${prompt}\n\nPlease analyze this food image and provide nutritional insights, identify the dishes if possible, and give relevant advice.`,
        imagePart,
      ]);
    } else {
      // Handle text-only chat
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process your request. Please try again.",
      },
      { status: 500 }
    );
  }
}
