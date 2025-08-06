'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserMeals, Meal } from '@/lib/firebase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Target, Calendar, Award, Activity, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/dashboard-layout'

export default function Analytics() {
  const { user, userProfile } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadMeals()
    }
  }, [user])

  const loadMeals = async () => {
    if (!user) return
    
    const allMeals = await getUserMeals(user.uid)
    setMeals(allMeals)
    setLoading(false)
  }

  const getMealTypeDistribution = () => {
    const distribution = meals.reduce((acc, meal) => {
      acc[meal.mealType] = (acc[meal.mealType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(distribution).map(([type, count]) => ({
      name: type,
      value: count,
      color: {
        'Breakfast': '#FF6B6B',
        'Lunch': '#4ECDC4',
        'Dinner': '#45B7D1',
        'Snack': '#96CEB4'
      }[type] || '#95A5A6'
    }))
  }

  const getTopFoods = () => {
    const foodCounts = meals.reduce((acc, meal) => {
      meal.foodItems.forEach(item => {
        acc[item.name] = (acc[item.name] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    return Object.entries(foodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }

  const getWeeklyTrends = () => {
    const now = new Date()
    const data = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayMeals = meals.filter(meal => {
        const mealDate = meal.createdAt.toDate()
        return mealDate >= date && mealDate < nextDate
      })

      const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0)
      const totalProtein = dayMeals.reduce((sum, meal) => sum + meal.totalNutrition.protein, 0)
      const totalCarbs = dayMeals.reduce((sum, meal) => sum + meal.totalNutrition.carbs, 0)
      const totalFats = dayMeals.reduce((sum, meal) => sum + meal.totalNutrition.fats, 0)
      
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fats: totalFats,
        meals: dayMeals.length
      })
    }

    return data
  }

  const getAnalyticsStats = () => {
    const totalMeals = meals.length
    const totalCalories = meals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0)
    const avgCaloriesPerMeal = totalMeals > 0 ? Math.round(totalCalories / totalMeals) : 0
    const avgMealsPerDay = totalMeals > 0 ? Math.round(totalMeals / 30) : 0 // Assuming 30 days of data
    
    const goals = userProfile?.goals || { dailyCalories: 2000 }
    const last7Days = meals.filter(meal => {
      const mealDate = meal.createdAt.toDate()
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return mealDate >= weekAgo
    })
    
    const weeklyCalories = last7Days.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0)
    const avgDailyCalories = Math.round(weeklyCalories / 7)
    const goalAchievementRate = Math.round((avgDailyCalories / goals.dailyCalories) * 100)

    return {
      totalMeals,
      avgCaloriesPerMeal,
      avgMealsPerDay,
      goalAchievementRate
    }
  }

  const mealTypeData = getMealTypeDistribution()
  const topFoods = getTopFoods()
  const weeklyTrends = getWeeklyTrends()
  const stats = getAnalyticsStats()

  if (loading) {
    return (
      <DashboardLayout title="Analytics" subtitle="Loading your detailed insights...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Analytics" subtitle="Detailed insights into your nutrition patterns">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMeals}</div>
              <p className="text-xs text-muted-foreground">
                meals logged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Calories/Meal</CardTitle>
              <Zap className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCaloriesPerMeal}</div>
              <p className="text-xs text-muted-foreground">
                calories per meal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgMealsPerDay}</div>
              <p className="text-xs text-muted-foreground">
                meals per day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goal Achievement</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.goalAchievementRate}%</div>
              <p className="text-xs text-muted-foreground">
                of calorie goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meal Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Meal Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of your meals by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mealTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mealTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Nutrition Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Nutrition Trends</CardTitle>
              <CardDescription>
                Your macro intake over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="protein" stroke="#FF6B6B" strokeWidth={2} />
                    <Line type="monotone" dataKey="carbs" stroke="#4ECDC4" strokeWidth={2} />
                    <Line type="monotone" dataKey="fats" stroke="#45B7D1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Foods */}
        <Card>
          <CardHeader>
            <CardTitle>Most Frequently Logged Foods</CardTitle>
            <CardDescription>
              Your top 10 most logged food items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFoods} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-600" />
              <span>Personalized Insights</span>
            </CardTitle>
            <CardDescription>
              AI-powered insights based on your eating patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">🎯 Consistency</h4>
                <p className="text-sm text-green-700">
                  You're most consistent with logging {mealTypeData[0]?.name || 'meals'} - keep it up!
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📈 Trending</h4>
                <p className="text-sm text-blue-700">
                  Your favorite food is {topFoods[0]?.name || 'not determined yet'} - logged {topFoods[0]?.count || 0} times.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">⚡ Energy</h4>
                <p className="text-sm text-purple-700">
                  Your average meal contains {stats.avgCaloriesPerMeal} calories - perfect for sustained energy!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
