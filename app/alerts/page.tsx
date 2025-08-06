'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserMeals, Meal } from '@/lib/firebase'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Heart, Activity, TrendingUp, Zap, Shield, Target, Calendar, RefreshCw } from 'lucide-react'

interface HealthAnalysis {
  nutritionalAssessment?: string
  healthRisks?: string
  recommendations?: string
  workoutPlan?: string
  cuisineAdvice?: string
  fullAnalysis?: string
}

export default function AlertsPage() {
  const { user, userProfile } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)

  useEffect(() => {
    if (user) {
      loadUserMeals()
    }
  }, [user])

  const loadUserMeals = async () => {
    if (!user) return
    
    // Load last 30 days of meals for comprehensive analysis
    const userMeals = await getUserMeals(user.uid)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentMeals = userMeals.filter(meal => 
      meal.createdAt.toDate() >= thirtyDaysAgo
    )
    
    setMeals(recentMeals)
  }

  const generateHealthReport = async () => {
    if (!user || meals.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/health-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meals: meals.map(meal => ({
            mealType: meal.mealType,
            foodItems: meal.foodItems,
            totalNutrition: meal.totalNutrition,
            createdAt: meal.createdAt.toDate().toISOString()
          })),
          userProfile: userProfile?.profile,
          userGoals: userProfile?.goals
        }),
      })

      const data = await response.json()

      if (data.success) {
        setHealthAnalysis(data.analysis)
        setLastAnalysis(new Date())
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Health analysis error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthScore = () => {
    if (!meals.length) return 0
    
    const totalCalories = meals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0)
    const avgDailyCalories = totalCalories / Math.max(1, Math.ceil(meals.length / 3)) // Assuming 3 meals per day
    const targetCalories = userProfile?.goals?.dailyCalories || 2000
    
    const calorieScore = Math.min(100, (avgDailyCalories / targetCalories) * 100)
    return Math.round(calorieScore)
  }

  const getQuickInsights = () => {
    if (!meals.length) return []

    const insights = []
    const totalMeals = meals.length
    const daysTracked = Math.ceil(totalMeals / 3)
    
    // Meal frequency insight
    if (totalMeals / daysTracked < 2.5) {
      insights.push({
        type: 'warning',
        title: 'Low Meal Frequency',
        description: 'You\'re logging fewer meals than recommended. Try to log at least 3 meals per day.',
        icon: AlertTriangle
      })
    }

    // Nutrition balance
    const avgCalories = meals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0) / totalMeals
    const targetCalories = (userProfile?.goals?.dailyCalories || 2000) / 3 // Per meal average
    
    if (avgCalories < targetCalories * 0.7) {
      insights.push({
        type: 'warning',
        title: 'Low Caloric Intake',
        description: 'Your average meal calories are below recommended levels.',
        icon: TrendingUp
      })
    }

    // Positive insights
    if (totalMeals >= 21) { // Week of consistent logging
      insights.push({
        type: 'success',
        title: 'Consistent Tracking',
        description: 'Great job maintaining consistent meal logging!',
        icon: Target
      })
    }

    return insights
  }

  const workoutRecommendations = [
    {
      day: 'Monday',
      type: 'Cardio',
      exercises: ['30 min brisk walking', '15 min cycling', '10 min stretching'],
      duration: '55 minutes'
    },
    {
      day: 'Tuesday',
      type: 'Strength',
      exercises: ['Push-ups (3 sets of 10)', 'Squats (3 sets of 15)', 'Planks (3 sets of 30s)'],
      duration: '45 minutes'
    },
    {
      day: 'Wednesday',
      type: 'Active Recovery',
      exercises: ['Yoga flow', 'Light stretching', 'Meditation'],
      duration: '30 minutes'
    },
    {
      day: 'Thursday',
      type: 'Cardio',
      exercises: ['20 min jogging', '15 min stairs', '10 min cool down'],
      duration: '45 minutes'
    },
    {
      day: 'Friday',
      type: 'Strength',
      exercises: ['Lunges (3 sets of 12)', 'Arm circles', 'Core exercises'],
      duration: '40 minutes'
    },
    {
      day: 'Saturday',
      type: 'Fun Activity',
      exercises: ['Dancing', 'Sports', 'Outdoor activities'],
      duration: '60 minutes'
    },
    {
      day: 'Sunday',
      type: 'Rest',
      exercises: ['Light walking', 'Gentle stretching'],
      duration: '20 minutes'
    }
  ]

  const healthScore = getHealthScore()
  const quickInsights = getQuickInsights()

  return (
    <DashboardLayout 
      title="Health Alerts & Analysis" 
      subtitle="Comprehensive health insights based on your nutrition data"
    >
      <div className="space-y-6">
        {/* Health Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthScore}%</div>
              <p className="text-xs text-muted-foreground">
                Based on nutrition goals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meals Tracked</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meals.length}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Daily Calories</CardTitle>
              <Zap className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(meals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0) / Math.max(1, Math.ceil(meals.length / 3)))}
              </div>
              <p className="text-xs text-muted-foreground">
                kcal per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Low</div>
              <p className="text-xs text-muted-foreground">
                Overall health risk
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>Immediate observations from your recent meals</CardDescription>
          </CardHeader>
          <CardContent>
            {quickInsights.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Log more meals to get personalized insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quickInsights.map((insight, index) => {
                  const Icon = insight.icon
                  return (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-4 rounded-lg ${
                        insight.type === 'warning' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-1 ${
                        insight.type === 'warning' ? 'text-orange-600' : 'text-green-600'
                      }`} />
                      <div>
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Health Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>AI Health Analysis</CardTitle>
              <CardDescription>
                Comprehensive analysis of your nutrition patterns
                {lastAnalysis && (
                  <span className="block text-xs text-gray-500 mt-1">
                    Last updated: {lastAnalysis.toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              onClick={generateHealthReport}
              disabled={loading || meals.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {!healthAnalysis && meals.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No meal data available for analysis</p>
                <p className="text-sm text-gray-500 mt-2">Start logging meals to get your health report</p>
              </div>
            )}

            {!healthAnalysis && meals.length > 0 && (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600">Ready to analyze your nutrition data</p>
                <p className="text-sm text-gray-500 mt-2">Click "Generate Report" to get personalized insights</p>
              </div>
            )}

            {healthAnalysis && (
              <div className="space-y-6">
                {healthAnalysis.nutritionalAssessment && (
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Nutritional Assessment</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{healthAnalysis.nutritionalAssessment}</p>
                  </div>
                )}

                {healthAnalysis.healthRisks && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">Health Risks & Concerns</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{healthAnalysis.healthRisks}</p>
                  </div>
                )}

                {healthAnalysis.recommendations && (
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Improvement Recommendations</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{healthAnalysis.recommendations}</p>
                  </div>
                )}

                {healthAnalysis.cuisineAdvice && (
                  <div>
                    <h4 className="font-semibold text-purple-700 mb-2">Sri Lankan Cuisine Advice</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{healthAnalysis.cuisineAdvice}</p>
                  </div>
                )}

                {healthAnalysis.fullAnalysis && !healthAnalysis.nutritionalAssessment && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Complete Analysis</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{healthAnalysis.fullAnalysis}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personalized Workout Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Personalized Workout Plan</CardTitle>
            <CardDescription>Weekly exercise recommendations based on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workoutRecommendations.map((workout, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{workout.day}</h4>
                    <span className="text-sm text-gray-500">{workout.duration}</span>
                  </div>
                  
                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      workout.type === 'Cardio' ? 'bg-red-100 text-red-800' :
                      workout.type === 'Strength' ? 'bg-blue-100 text-blue-800' :
                      workout.type === 'Active Recovery' ? 'bg-green-100 text-green-800' :
                      workout.type === 'Fun Activity' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {workout.type}
                    </span>
                  </div>
                  
                  <ul className="space-y-1">
                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <li key={exerciseIndex} className="text-sm text-gray-600">
                        • {exercise}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
