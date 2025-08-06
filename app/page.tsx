'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserMeals, Meal } from '@/lib/firebase'
import ProgressCircle from '@/components/progress-circle'
import MacroBar from '@/components/macro-bar'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import FirebaseStatus from '@/components/firebase-status'

export default function Dashboard() {
  const { user, userProfile } = useAuth()
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTodayMeals()
    }
  }, [user])

  const loadTodayMeals = async () => {
    if (!user) return
    
    const meals = await getUserMeals(user.uid, new Date())
    setTodayMeals(meals)
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

  const todayNutrition = calculateTodayNutrition()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your nutrition data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Today's Summary</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">{formatDate(new Date())}</span>
            </div>
            <FirebaseStatus />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Calories Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-center mb-6">
            <ProgressCircle
              value={todayNutrition.calories}
              max={goals.dailyCalories}
              label="Calories"
              unit="kcal"
              size={140}
            />
          </div>
        </div>

        {/* Macros */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Macronutrients</h2>
          <MacroBar
            label="Protein"
            value={todayNutrition.protein}
            max={goals.dailyProtein}
            unit="g"
            color="#FF6B6B"
          />
          <MacroBar
            label="Carbs"
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
        </div>

        {/* Today's Meals */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Meals</h2>
          {todayMeals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🍽️</div>
              <p className="text-gray-500 mb-4">No meals logged today</p>
              <Link
                href="/log-meal"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Log your first meal
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getMealTypeIcon(meal.mealType)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{meal.mealType}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {meal.createdAt.toDate().toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {meal.totalNutrition.calories} kcal
                    </p>
                    <p className="text-sm text-gray-500">
                      {meal.foodItems.length} item{meal.foodItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {todayMeals.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{todayMeals.length}</p>
                <p className="text-sm text-gray-600">Meals Logged</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((todayNutrition.calories / goals.dailyCalories) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Goal Reached</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
