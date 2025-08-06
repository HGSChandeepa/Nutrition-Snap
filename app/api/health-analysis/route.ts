import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { meals, userProfile, userGoals } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Analyze user's meal data and generate comprehensive health report
    const analysisPrompt = `
    As a certified nutritionist and health expert, analyze this user's meal data and provide a comprehensive health report.

    User Profile:
    - Age: ${userProfile?.age || 'Not specified'}
    - Weight: ${userProfile?.weight || 'Not specified'} kg
    - Height: ${userProfile?.height || 'Not specified'} cm
    - Gender: ${userProfile?.gender || 'Not specified'}
    - Activity Level: ${userProfile?.activityLevel || 'Not specified'}

    Daily Goals:
    - Calories: ${userGoals?.dailyCalories || 2000}
    - Protein: ${userGoals?.dailyProtein || 150}g
    - Carbs: ${userGoals?.dailyCarbs || 250}g
    - Fats: ${userGoals?.dailyFats || 65}g

    Recent Meals Data:
    ${JSON.stringify(meals, null, 2)}

    Please provide a detailed analysis including:

    1. **Nutritional Assessment**
       - Current intake vs goals
       - Macro and micronutrient balance
       - Caloric distribution analysis

    2. **Health Risks & Concerns**
       - Potential deficiencies
       - Overconsumption warnings
       - Disease risk factors based on diet

    3. **Improvement Recommendations**
       - Specific dietary changes
       - Food substitutions
       - Meal timing suggestions

    4. **Personalized Workout Plan**
       - Exercise recommendations based on goals
       - Weekly workout schedule
       - Activity suggestions for current fitness level

    5. **Sri Lankan Cuisine Specific Advice**
       - Healthier preparation methods
       - Traditional foods to include/avoid
       - Portion control for local dishes

    Format the response as a structured JSON with clear sections and actionable advice.
    `

    const result = await model.generateContent(analysisPrompt)
    const response = await result.response
    const analysisText = response.text()

    // Try to parse as JSON, fallback to structured text
    let structuredAnalysis
    try {
      structuredAnalysis = JSON.parse(analysisText)
    } catch {
      // If not valid JSON, structure the text response
      structuredAnalysis = {
        nutritionalAssessment: analysisText.split('**Nutritional Assessment**')[1]?.split('**Health Risks')[0]?.trim(),
        healthRisks: analysisText.split('**Health Risks & Concerns**')[1]?.split('**Improvement')[0]?.trim(),
        recommendations: analysisText.split('**Improvement Recommendations**')[1]?.split('**Personalized')[0]?.trim(),
        workoutPlan: analysisText.split('**Personalized Workout Plan**')[1]?.split('**Sri Lankan')[0]?.trim(),
        cuisineAdvice: analysisText.split('**Sri Lankan Cuisine Specific Advice**')[1]?.trim(),
        fullAnalysis: analysisText
      }
    }

    return NextResponse.json({
      success: true,
      analysis: structuredAnalysis,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Health analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate health analysis. Please try again.' 
      },
      { status: 500 }
    )
  }
}
