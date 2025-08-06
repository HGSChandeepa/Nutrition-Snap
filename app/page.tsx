'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserMeals, Meal } from '@/lib/firebase'
import ProgressCircle from '@/components/progress-circle'
import MacroBar from '@/components/macro-bar'
import DashboardLayout from '@/components/dashboard-layout'
import { Calendar, Clock, TrendingUp, Target, Zap, Award } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { user, userProfile } = useAuth()
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [weekMeals, setWeekMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadMealsData()
    }
  }, [user])

  const loadMealsData = async () => {
    if (!user) return
    
    // Load today's meals
    const todayMealsData = await getUserMeals(user.uid, new Date())
    setTodayMeals(todayMealsData)

    // Load this week's meals
    const weekMealsData = await getUserMeals(user.uid)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const thisWeekMeals = weekMealsData.filter(meal => 
      meal.createdAt.toDate() >= weekAgo
    )
    setWeekMeals(thisWeekMeals)
    
    setLoading(false)
  }

  const calculateTodayNutrition = () => {
    return todayMeals.reduce(
      (total, meal) => ({
        calories: total.calories + meal.totalNutrition.calories,
        protein: total.protein + meal.totalNutrition.protein,
        carbs: total.carbs + meal.totalNutrition.carbs,
        fats: total.fats + meal.totalNutrition.fats
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  }

  const getWeeklyStats = () => {
    const totalCalories = weekMeals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0)
    const avgCalories = Math.round(totalCalories / 7)
    const totalMeals = weekMeals.length
    
    return { avgCalories, totalMeals }
  }

  const todayNutrition = calculateTodayNutrition()
  const weeklyStats = getWeeklyStats()
  const goals = userProfile?.goals || {
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 250,
    dailyFats: 65
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  const getMealTypeIcon = (mealType: string) => {
    const icons = {
      'Breakfast': '🌅',
      'Lunch': '☀️',
      'Dinner': '🌙',
      'Snack': '🍎'
    }
    return icons[mealType as keyof typeof icons] || '🍽️'
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading your nutrition data...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your nutrition data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle={`Welcome back! Today is ${formatDate(new Date())}`}
    >
      <div className="space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayNutrition.calories}</div>
              <p className="text-xs text-muted-foreground">
                of {goals.dailyCalories} goal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meals Today</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMeals.length}</div>
              <p className="text-xs text-muted-foreground">
                meals logged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.avgCalories}</div>
              <p className="text-xs text-muted-foreground">
                calories per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((todayNutrition.calories / goals.dailyCalories) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                of daily goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calories Progress */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Daily Calories</CardTitle>
              <CardDescription>Your calorie intake progress for today</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ProgressCircle
                value={todayNutrition.calories}
                max={goals.dailyCalories}
                label="Calories"
                unit="kcal"
                size={160}
              />
            </CardContent>
          </Card>

          {/* Macronutrients */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Macronutrients</CardTitle>
              <CardDescription>Your macro breakdown for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <MacroBar
                label="Protein"
                value={todayNutrition.protein}
                max={goals.dailyProtein}
                unit="g"
                color="#FF6B6B"
              />
              <MacroBar
                label="Carbohydrates"
                value={todayNutrition.carbs}
                max={goals.dailyCarbs}
                unit="g"
                color="#4ECDC4"
              />
              <MacroBar
                label="Fats"
                value={todayNutrition.fats}
                max={goals.dailyFats}
                unit="g"
                color="#45B7D1"
              />
            </CardContent>
          </Card>
        </div>

        {/* Today's Meals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Meals</CardTitle>
              <CardDescription>Your meal log for today</CardDescription>
            </div>
            <Link href="/log-meal">
              <Button>
                <Clock className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayMeals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meals logged today</h3>
                <p className="text-gray-500 mb-6">Start tracking your nutrition by logging your first meal</p>
                <Link href="/log-meal">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Log Your First Meal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getMealTypeIcon(meal.mealType)}</span>
                        <h4 className="font-medium text-gray-900">{meal.mealType}</h4>
                      </div>
                      <span className="text-sm text-gray-500">
                        {meal.createdAt.toDate().toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Calories</span>
                        <span className="text-sm font-medium">{meal.totalNutrition.calories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Protein</span>
                        <span className="text-sm font-medium">{meal.totalNutrition.protein}g</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {meal.foodItems.length} item{meal.foodItems.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/log-meal">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Log New Meal</h3>
                  <p className="text-sm text-gray-500">Add your latest meal</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/progress">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">View Progress</h3>
                  <p className="text-sm text-gray-500">Check your trends</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Update Goals</h3>
                  <p className="text-sm text-gray-500">Adjust your targets</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
