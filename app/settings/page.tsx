'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { updateUserProfile, createUserProfile, UserProfile, UserGoals } from '@/lib/firebase'
import { User, Target, Shield, Globe, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import DashboardLayout from '@/components/dashboard-layout'
import { trackGoalUpdated, trackProfileUpdated } from '@/lib/analytics'

export default function Settings() {
  const { user, userProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    weight: 70,
    height: 170,
    gender: 'male',
    activityLevel: 'moderate'
  })
  const [goals, setGoals] = useState<UserGoals>({
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 250,
    dailyFats: 65
  })

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile.profile)
      setGoals(userProfile.goals)
    }
  }, [userProfile])

  const calculateRecommendedCalories = () => {
    // Basic BMR calculation using Mifflin-St Jeor Equation
    let bmr
    if (profile.gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age)
    }

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    }

    return Math.round(bmr * activityMultipliers[profile.activityLevel])
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      if (userProfile) {
        await updateUserProfile(user.uid, profile, goals)
      } else {
        await createUserProfile(user.uid, profile, goals)
      }
      await refreshProfile()
      trackProfileUpdated()
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRecommendedGoals = () => {
    const recommendedCalories = calculateRecommendedCalories()
    setGoals({
      dailyCalories: recommendedCalories,
      dailyProtein: Math.round(profile.weight * 2.2), // 2.2g per kg
      dailyCarbs: Math.round(recommendedCalories * 0.5 / 4), // 50% of calories from carbs
      dailyFats: Math.round(recommendedCalories * 0.25 / 9) // 25% of calories from fats
    })
  }

  return (
    <DashboardLayout title="Settings & Profile" subtitle="Manage your personal information and nutrition goals">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-green-600" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              This information helps us calculate your nutritional needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={profile.gender} onValueChange={(value: any) => setProfile({ ...profile, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) || 0 })}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) || 0 })}
                    placeholder="170"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="activity">Activity Level</Label>
              <Select value={profile.activityLevel} onValueChange={(value: any) => setProfile({ ...profile, activityLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                  <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Nutritional Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Daily Goals</span>
            </CardTitle>
            <CardDescription>
              Set your daily nutritional targets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calculator className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Recommended Calories</p>
                  <p className="text-sm text-green-600">Based on your profile: {calculateRecommendedCalories()} kcal</p>
                </div>
              </div>
              <Button
                onClick={updateRecommendedGoals}
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-100"
              >
                Use Recommended
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="calories">Daily Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={goals.dailyCalories}
                  onChange={(e) => setGoals({ ...goals, dailyCalories: parseInt(e.target.value) || 0 })}
                  placeholder="2000"
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={goals.dailyProtein}
                  onChange={(e) => setGoals({ ...goals, dailyProtein: parseInt(e.target.value) || 0 })}
                  placeholder="150"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbohydrates (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={goals.dailyCarbs}
                  onChange={(e) => setGoals({ ...goals, dailyCarbs: parseInt(e.target.value) || 0 })}
                  placeholder="250"
                />
              </div>
              <div>
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  value={goals.dailyFats}
                  onChange={(e) => setGoals({ ...goals, dailyFats: parseInt(e.target.value) || 0 })}
                  placeholder="65"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-600" />
              <span>Language & Region</span>
            </CardTitle>
            <CardDescription>
              Choose your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="english">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="sinhala" disabled>සිංහල (Coming Soon)</SelectItem>
                  <SelectItem value="tamil" disabled>தமிழ் (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Privacy & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🔒 Your Privacy Matters</h4>
                <p className="text-blue-700">
                  Nutrition Snap uses Firebase Anonymous Authentication to protect your identity. No personal information like email or phone number is required.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">🛡️ Data Security</h4>
                <p className="text-green-700">
                  All your meal data and photos are stored securely in Firebase with industry-standard encryption.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">🤖 AI Processing</h4>
                <p className="text-purple-700">
                  In future updates, meal analysis will happen directly on your device, ensuring your food photos never leave your phone.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">📊 Data Control</h4>
                <p className="text-orange-700">
                  Your data belongs to you. You can delete your account and all associated data at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-8"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
