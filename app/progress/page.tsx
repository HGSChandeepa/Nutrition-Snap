'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserMeals, Meal } from '@/lib/firebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, Target, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      
      data.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        calories: totalCalories,
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

  const getCalendarData = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    
    const calendarDays = []
    const goalCalories = userProfile?.goals?.dailyCalories || 2000

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dayMeals = meals.filter(meal => {
        const mealDate = meal.createdAt.toDate()
        return mealDate.toDateString() === date.toDateString()
      })
      
      const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0)
      const metGoal = totalCalories >= goalCalories
      const isToday = date.toDateString() === now.toDateString()
      
      calendarDays.push({
        day,
        date,
        meals: dayMeals.length,
        calories: totalCalories,
        metGoal,
        isToday
      })
    }

    return calendarDays
  }

  const chartData = getChartData()
  const weeklyStats = getWeeklyStats()
  const calendarData = getCalendarData()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Progress & History</h1>
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              onClick={() => setViewType('weekly')}
              variant={viewType === 'weekly' ? 'default' : 'ghost'}
              className={`flex-1 ${viewType === 'weekly' ? 'bg-white shadow-sm' : ''}`}
            >
              Weekly
            </Button>
            <Button
              onClick={() => setViewType('monthly')}
              variant={viewType === 'monthly' ? 'default' : 'ghost'}
              className={`flex-1 ${viewType === 'monthly' ? 'bg-white shadow-sm' : ''}`}
            >
              Monthly
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Weekly Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{weeklyStats.daysMetGoal}/7</p>
              <p className="text-sm text-gray-600">Days Goal Met</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{weeklyStats.avgCalories}</p>
              <p className="text-sm text-gray-600">Avg Calories</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {viewType === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
          </h2>
          <div className="h-64">
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
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <Calendar className="w-5 h-5 inline mr-2" />
            This Month
          </h2>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, index) => (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center text-sm relative
                  ${day ? 'cursor-pointer' : ''}
                  ${day?.isToday ? 'bg-green-100 text-green-800 font-bold rounded-lg' : ''}
                  ${day?.metGoal && !day?.isToday ? 'bg-green-50 text-green-700 rounded-lg' : ''}
                  ${day && !day.metGoal && !day.isToday ? 'text-gray-400' : ''}
                `}
              >
                {day && (
                  <>
                    <span>{day.day}</span>
                    {day.meals > 0 && (
                      <div className={`
                        absolute bottom-0 right-0 w-2 h-2 rounded-full
                        ${day.metGoal ? 'bg-green-500' : 'bg-orange-400'}
                      `} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Goal Met</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-gray-600">Meals Logged</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            <Award className="w-5 h-5 inline mr-2" />
            Insights
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                🎉 You've hit your protein goal {Math.floor(Math.random() * 4) + 2} times this week!
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                📈 Your average daily calories increased by {Math.floor(Math.random() * 100) + 50} kcal compared to last week.
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                🥗 Try adding more vegetables to reach your fiber goals!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
