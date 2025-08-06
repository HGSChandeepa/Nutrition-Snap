'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { analyzeImage, saveMeal, uploadMealImage, FoodItem, Timestamp } from '@/lib/firebase'
import { Camera, Upload, Edit3, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trackMealLogged, trackImageAnalyzed } from '@/lib/analytics'

type Step = 'input-method' | 'analyzing' | 'confirmation'

export default function LogMeal() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<Step>('input-method')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([])
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleManualEntry = () => {
    setAnalyzedItems([
      { name: '', quantity: '', calories: 0, protein: 0, carbs: 0, fats: 0 }
    ])
    setStep('confirmation')
  }

  const analyzeSelectedImage = async () => {
    if (!selectedImage) return

    setStep('analyzing')
    setLoading(true)

    try {
      const result = await analyzeImage(selectedImage)
      if (result.success) {
        setAnalyzedItems(result.items)
        setStep('confirmation')
        trackImageAnalyzed(true, result.items.length)
      }
    } catch (error) {
      console.error('Error analyzing image:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFoodItem = (index: number, field: keyof FoodItem, value: string | number) => {
    const updated = [...analyzedItems]
    updated[index] = { ...updated[index], [field]: value }
    setAnalyzedItems(updated)
  }

  const removeFoodItem = (index: number) => {
    setAnalyzedItems(analyzedItems.filter((_, i) => i !== index))
  }

  const addFoodItem = () => {
    setAnalyzedItems([
      ...analyzedItems,
      { name: '', quantity: '', calories: 0, protein: 0, carbs: 0, fats: 0 }
    ])
  }

  const calculateTotalNutrition = () => {
    return analyzedItems.reduce(
      (total, item) => ({
        calories: total.calories + (item.calories || 0),
        protein: total.protein + (item.protein || 0),
        carbs: total.carbs + (item.carbs || 0),
        fats: total.fats + (item.fats || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  }

  const saveMealData = async () => {
    if (!user || analyzedItems.length === 0) return

    setLoading(true)

    try {
      const totalNutrition = calculateTotalNutrition()
      const mealId = Date.now().toString()
      
      let imageUrl = ''
      if (selectedImage) {
        const uploadedUrl = await uploadMealImage(user.uid, mealId, selectedImage)
        imageUrl = uploadedUrl || ''
      }

      const mealData = {
        uid: user.uid,
        createdAt: Timestamp.now(),
        mealType,
        foodItems: analyzedItems.filter(item => item.name.trim() !== ''),
        totalNutrition,
        imageUrl,
        notes: notes.trim()
      }

      await saveMeal(mealData)
      trackMealLogged(mealType, analyzedItems.length, totalNutrition.calories)
      router.push('/')
    } catch (error) {
      console.error('Error saving meal:', error)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'input-method') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-md mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Log New Meal</h1>
            <p className="text-gray-600 mt-1">How would you like to add your meal?</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-8 space-y-4">
          <Button
            onClick={handleCameraCapture}
            className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center space-x-3"
          >
            <Camera className="w-6 h-6" />
            <span className="text-lg font-medium">Take Photo</span>
          </Button>

          <Button
            onClick={handleFileUpload}
            variant="outline"
            className="w-full h-16 border-2 border-green-200 hover:border-green-300 rounded-xl flex items-center justify-center space-x-3"
          >
            <Upload className="w-6 h-6 text-green-600" />
            <span className="text-lg font-medium text-green-600">Upload Image</span>
          </Button>

          <Button
            onClick={handleManualEntry}
            variant="outline"
            className="w-full h-16 border-2 border-gray-200 hover:border-gray-300 rounded-xl flex items-center justify-center space-x-3"
          >
            <Edit3 className="w-6 h-6 text-gray-600" />
            <span className="text-lg font-medium text-gray-600">Enter Manually</span>
          </Button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleImageSelect(file)
                analyzeSelectedImage()
              }
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleImageSelect(file)
                analyzeSelectedImage()
              }
            }}
          />
        </div>
      </div>
    )
  }

  if (step === 'analyzing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {imagePreview && (
            <div className="mb-6">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Selected meal"
                className="w-48 h-48 object-cover rounded-xl mx-auto shadow-lg"
              />
            </div>
          )}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing your meal...</h2>
          <p className="text-gray-600">Our AI is identifying the food items and calculating nutrition.</p>
        </div>
      </div>
    )
  }

  const totalNutrition = calculateTotalNutrition()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Confirm Meal Details</h1>
          <p className="text-gray-600 mt-1">Review and edit the detected items</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Image Preview */}
        {imagePreview && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Selected meal"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Meal Type Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meal Type
          </label>
          <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Breakfast">🌅 Breakfast</SelectItem>
              <SelectItem value="Lunch">☀️ Lunch</SelectItem>
              <SelectItem value="Dinner">🌙 Dinner</SelectItem>
              <SelectItem value="Snack">🍎 Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Food Items */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Food Items</h2>
            <Button
              onClick={addFoodItem}
              size="sm"
              variant="outline"
              className="text-green-600 border-green-200 hover:border-green-300"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {analyzedItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Food name"
                      value={item.name}
                      onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Quantity (e.g., 1 cup, 2 pieces)"
                      value={item.quantity}
                      onChange={(e) => updateFoodItem(index, 'quantity', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Calories"
                        value={item.calories || ''}
                        onChange={(e) => updateFoodItem(index, 'calories', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="Protein (g)"
                        value={item.protein || ''}
                        onChange={(e) => updateFoodItem(index, 'protein', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  {analyzedItems.length > 1 && (
                    <Button
                      onClick={() => removeFoodItem(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Nutrition */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Total Nutrition</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{totalNutrition.calories}</p>
              <p className="text-sm text-gray-600">Calories</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totalNutrition.protein}g</p>
              <p className="text-sm text-gray-600">Protein</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <Textarea
            placeholder="Add any notes about this meal..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={saveMealData}
          disabled={loading || analyzedItems.every(item => !item.name.trim())}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Save className="w-5 h-5" />
              <span>Save Meal</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
