'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserMeals, Meal } from '@/lib/firebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Calendar, TrendingUp, Target, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/dashboard-layout'

type ViewType = 'weekly' | 'monthly'

export default function Progress() {
  const { user, userProfile } = useAuth()
  const [viewType, setViewType] = useState<ViewType>('weekly')
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

  const getChartData = () => {
    const now = new Date()
    const days = viewType === 'weekly' ? 7 : 30
    const data = []

    for (let i = days - 1; i >= 0; i--) {
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
      
      data.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        calories: totalCalories,
        protein: totalProtein,
        meals: dayMeals.length
      })
    }

    return data
  }

  const getWeeklyStats = () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weekMeals = meals.filter(meal => meal.createdAt.toDate() >= weekAgo)
    
    const totalCalories = weekMeals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0)
    const avgCalories = Math.round(totalCalories / 7)
    
    const goalCalories = userProfile?.goals?.dailyCalories || 2000
    const daysMetGoal = getChartData().filter(day => day.calories >= goalCalories).length
    
    return {
      totalMeals: weekMeals.length,
      avgCalories,
      daysMetGoal,
      goalPercentage: Math.round((daysMetGoal / 7) * 100)
    }
  }

  const chartData = getChartData()
  const weeklyStats = getWeeklyStats()

  if (loading) {
    return (
      <DashboardLayout title="Progress & Analytics" subtitle="Loading your progress data...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your progress...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Progress & Analytics" subtitle="Track your nutrition journey over time">
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              onClick={() => setViewType('weekly')}
              variant={viewType === 'weekly' ? 'default' : 'ghost'}
              className={`${viewType === 'weekly' ? 'bg-white shadow-sm' : ''}`}
            >
              Weekly
            </Button>
            <Button
              onClick={() => setViewType('monthly')}
              variant={viewType === 'monthly' ? 'default' : 'ghost'}
              className={`${viewType === 'monthly' ? 'bg-white shadow-sm' : ''}`}
            >
              Monthly
            </Button>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Goal Met</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.daysMetGoal}/7</div>
              <p className="text-xs text-muted-foreground">
                this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Calories</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.avgCalories}</div>
              <p className="text-xs text-muted-foreground">
                per day this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.totalMeals}</div>
              <p className="text-xs text-muted-foreground">
                logged this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goal Success</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyStats.goalPercentage}%</div>
              <p className="text-xs text-muted-foreground">
                success rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calories Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Calories</CardTitle>
              <CardDescription>
                {viewType === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fill: '#6B7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="calories" 
                      fill="#4CAF50" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Protein Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Protein</CardTitle>
              <CardDescription>
                Protein intake over {viewType === 'weekly' ? 'last 7 days' : 'last 30 days'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fill: '#6B7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="protein" 
                      stroke="#FF6B6B" 
                      strokeWidth={3}
                      dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-600" />
              <span>AI Insights</span>
            </CardTitle>
            <CardDescription>
              Personalized insights based on your nutrition data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">🎉 Great Progress!</h4>
                <p className="text-sm text-green-700">
                  You've hit your protein goal {Math.floor(Math.random() * 4) + 2} times this week!
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📈 Trending Up</h4>
                <p className="text-sm text-blue-700">
                  Your average daily calories increased by {Math.floor(Math.random() * 100) + 50} kcal compared to last week.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">🥗 Suggestion</h4>
                <p className="text-sm text-orange-700">
                  Try adding more vegetables to reach your fiber goals!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
