'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserMeals, Meal } from '@/lib/firebase'
import { Calendar, Clock, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DashboardLayout from '@/components/dashboard-layout'

export default function MealHistory() {
  const { user } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('all')

  useEffect(() => {
    if (user) {
      loadMeals()
    }
  }, [user])

  useEffect(() => {
    filterMeals()
  }, [meals, searchQuery, mealTypeFilter])

  const loadMeals = async () => {
    if (!user) return
    
    const allMeals = await getUserMeals(user.uid)
    setMeals(allMeals)
    setLoading(false)
  }

  const filterMeals = () => {
    let filtered = meals

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(meal =>
        meal.foodItems.some(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) || meal.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by meal type
    if (mealTypeFilter !== 'all') {
      filtered = filtered.filter(meal => meal.mealType === mealTypeFilter)
    }

    setFilteredMeals(filtered)
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <DashboardLayout title="Meal History" subtitle="Loading your meal history...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your meals...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Meal History" subtitle="View and search through all your logged meals">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search meals, foods..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Meals</SelectItem>
                    <SelectItem value="Breakfast">🌅 Breakfast</SelectItem>
                    <SelectItem value="Lunch">☀️ Lunch</SelectItem>
                    <SelectItem value="Dinner">🌙 Dinner</SelectItem>
                    <SelectItem value="Snack">🍎 Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal List */}
        {filteredMeals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || mealTypeFilter !== 'all' ? 'No meals found' : 'No meals logged yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || mealTypeFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start tracking your nutrition by logging your first meal'
                }
              </p>
              {!searchQuery && mealTypeFilter === 'all' && (
                <Button className="bg-green-600 hover:bg-green-700">
                  Log Your First Meal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map((meal) => (
              <Card key={meal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getMealTypeIcon(meal.mealType)}</span>
                      <CardTitle className="text-lg">{meal.mealType}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatDate(meal.createdAt.toDate())}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {meal.createdAt.toDate().toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Meal Image */}
                  {meal.imageUrl && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={meal.imageUrl || "/placeholder.svg"}
                        alt="Meal"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Food Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Food Items</h4>
                    <div className="space-y-1">
                      {meal.foodItems.slice(0, 3).map((item, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {item.name} ({item.quantity})
                        </p>
                      ))}
                      {meal.foodItems.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{meal.foodItems.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nutrition Summary */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {meal.totalNutrition.calories}
                      </p>
                      <p className="text-xs text-gray-500">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {meal.totalNutrition.protein}g
                      </p>
                      <p className="text-xs text-gray-500">Protein</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {meal.notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">
                        "{meal.notes}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {filteredMeals.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredMeals.length} of {meals.length} meals
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
