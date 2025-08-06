"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Heart,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  Target,
  Calendar,
  RefreshCcw,
} from "lucide-react";

// Mock data and types for demonstration
interface Meal {
  id: string;
  mealType: string;
  foodItems: Array<{ name: string; quantity: string; calories: number }>;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: Date;
}

interface UserProfile {
  profile: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
  };
  goals: {
    dailyCalories: number;
    targetWeight: number;
    goalType: string;
  };
}

interface HealthAnalysis {
  nutritionalAssessment?: string | string[] | Record<string, any>;
  healthRisks?: string | string[] | Record<string, any>;
  recommendations?: string | string[] | Record<string, any>;
  workoutPlan?: string | string[] | Record<string, any>;
  cuisineAdvice?: string | string[] | Record<string, any>;
  fullAnalysis?: any;
}

// Mock data
const mockMeals: Meal[] = [
  {
    id: "1",
    mealType: "breakfast",
    foodItems: [
      { name: "Rice & Curry", quantity: "1 plate", calories: 450 },
      { name: "Coconut Sambol", quantity: "2 tbsp", calories: 80 },
    ],
    totalNutrition: { calories: 530, protein: 15, carbs: 75, fat: 18 },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    mealType: "lunch",
    foodItems: [
      { name: "Hoppers", quantity: "3 pieces", calories: 300 },
      { name: "Dhal Curry", quantity: "1 cup", calories: 150 },
    ],
    totalNutrition: { calories: 450, protein: 12, carbs: 60, fat: 15 },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    mealType: "dinner",
    foodItems: [
      { name: "Kottu Roti", quantity: "1 portion", calories: 650 },
      { name: "Mixed Salad", quantity: "1 bowl", calories: 50 },
    ],
    totalNutrition: { calories: 700, protein: 25, carbs: 80, fat: 28 },
    createdAt: new Date(),
  },
];

const mockUserProfile: UserProfile = {
  profile: {
    age: 28,
    gender: "male",
    height: 175,
    weight: 70,
    activityLevel: "moderate",
  },
  goals: {
    dailyCalories: 2200,
    targetWeight: 68,
    goalType: "weight_loss",
  },
};

export default function HealthAlertsPage() {
  const [meals] = useState<Meal[]>(mockMeals);
  const [userProfile] = useState<UserProfile>(mockUserProfile);
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const generateHealthReport = async () => {
    if (meals.length === 0) return;

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const mockAnalysis: HealthAnalysis = {
        nutritionalAssessment: [
          "Your average daily caloric intake is approximately 1,680 calories, which is below your target of 2,200 calories.",
          "Protein intake appears adequate at around 52g per day (12% of calories).",
          "Carbohydrate intake is high at 215g per day (51% of calories), mainly from rice-based meals.",
          "Fat intake is moderate at 61g per day (33% of calories), with significant coconut-based fats.",
        ],
        healthRisks: [
          "Caloric deficit may lead to muscle mass loss if sustained long-term.",
          "High carbohydrate intake from refined sources may affect blood sugar stability.",
          "Limited meal variety may result in micronutrient deficiencies.",
          "Irregular meal timing could impact metabolic efficiency.",
        ],
        recommendations: [
          "Increase daily caloric intake by 300-400 calories through healthy sources.",
          "Add more protein-rich foods like fish, lentils, and lean meats to meals.",
          "Include more vegetables and fruits for better micronutrient profile.",
          "Consider meal timing optimization with smaller, frequent meals.",
          "Incorporate healthy snacks like nuts, yogurt, or fresh fruits.",
        ],
        workoutPlan: [
          "Monday: 30 minutes moderate cardio + 15 minutes stretching",
          "Tuesday: Full body strength training (bodyweight exercises)",
          "Wednesday: Active recovery - yoga or light walking",
          "Thursday: High intensity interval training (20 minutes)",
          "Friday: Strength training focusing on core and lower body",
          "Saturday: Outdoor activity or sports (60 minutes)",
          "Sunday: Rest day with gentle stretching",
        ],
        cuisineAdvice: [
          "Opt for brown rice or red rice instead of white rice for better nutrition.",
          "Use coconut milk in moderation - try diluting with water for curries.",
          "Include more steamed or grilled preparations alongside traditional curries.",
          "Add green leafy vegetables like gotukola, mukunuwenna to daily meals.",
          "Choose grilled fish over fried fish varieties.",
          "Incorporate traditional healthy foods like kurakkan (finger millet) and unpolished grains.",
        ],
      };

      setHealthAnalysis(mockAnalysis);
      setLastAnalysis(new Date());
      setLoading(false);
    }, 2000);
  };

  const getHealthScore = () => {
    if (!meals.length) return 0;

    const totalCalories = meals.reduce(
      (sum, meal) => sum + meal.totalNutrition.calories,
      0
    );
    const avgDailyCalories =
      totalCalories / Math.max(1, Math.ceil(meals.length / 3));
    const targetCalories = userProfile?.goals?.dailyCalories || 2000;

    const calorieScore = Math.min(
      100,
      (avgDailyCalories / targetCalories) * 100
    );
    return Math.round(calorieScore);
  };

  const getQuickInsights = () => {
    if (!meals.length) return [];

    const insights = [];
    const totalMeals = meals.length;
    const daysTracked = Math.ceil(totalMeals / 3);

    // Meal frequency insight
    if (totalMeals / daysTracked < 2.5) {
      insights.push({
        type: "warning" as const,
        title: "Low Meal Frequency",
        description:
          "You're logging fewer meals than recommended. Try to log at least 3 meals per day.",
        icon: AlertTriangle,
      });
    }

    // Nutrition balance
    const avgCalories =
      meals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0) /
      totalMeals;
    const targetCalories = (userProfile?.goals?.dailyCalories || 2000) / 3;

    if (avgCalories < targetCalories * 0.7) {
      insights.push({
        type: "warning" as const,
        title: "Low Caloric Intake",
        description: "Your average meal calories are below recommended levels.",
        icon: TrendingUp,
      });
    }

    // Positive insights
    if (totalMeals >= 21) {
      insights.push({
        type: "success" as const,
        title: "Consistent Tracking",
        description: "Great job maintaining consistent meal logging!",
        icon: Target,
      });
    }

    return insights;
  };

  const renderAnalysisSection = (
    title: string,
    data: string | string[] | Record<string, any> | undefined,
    iconComponent: any,
    colorClass: string
  ) => {
    if (!data) return null;

    const Icon = iconComponent;

    return (
      <div className={`p-4 rounded-lg border ${colorClass}`}>
        <div className="flex items-center mb-3">
          <Icon className="w-5 h-5 mr-2" />
          <h4 className="font-semibold">{title}</h4>
        </div>
        <div className="space-y-2">
          {typeof data === "string" ? (
            <div className="prose prose-sm max-w-none">
              {data.split("\n").map((line, idx) => (
                <p key={idx} className="text-sm text-gray-700 mb-2">
                  {line.trim()}
                </p>
              ))}
            </div>
          ) : Array.isArray(data) ? (
            <div className="pl-4 space-y-2">
              {data.map((item: string, idx: number) => (
                <p key={idx} className="text-sm text-gray-700">
                  • {item}
                </p>
              ))}
            </div>
          ) : (
            <div className="pl-4 space-y-2">
              {Object.entries(data || {}).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="text-gray-600 ml-1">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const workoutRecommendations = [
    {
      day: "Monday",
      type: "Cardio",
      exercises: [
        "30 min brisk walking",
        "15 min cycling",
        "10 min stretching",
      ],
      duration: "55 minutes",
    },
    {
      day: "Tuesday",
      type: "Strength",
      exercises: [
        "Push-ups (3 sets of 10)",
        "Squats (3 sets of 15)",
        "Planks (3 sets of 30s)",
      ],
      duration: "45 minutes",
    },
    {
      day: "Wednesday",
      type: "Active Recovery",
      exercises: ["Yoga flow", "Light stretching", "Meditation"],
      duration: "30 minutes",
    },
    {
      day: "Thursday",
      type: "Cardio",
      exercises: ["20 min jogging", "15 min stairs", "10 min cool down"],
      duration: "45 minutes",
    },
    {
      day: "Friday",
      type: "Strength",
      exercises: ["Lunges (3 sets of 12)", "Arm circles", "Core exercises"],
      duration: "40 minutes",
    },
    {
      day: "Saturday",
      type: "Fun Activity",
      exercises: ["Dancing", "Sports", "Outdoor activities"],
      duration: "60 minutes",
    },
    {
      day: "Sunday",
      type: "Rest",
      exercises: ["Light walking", "Gentle stretching"],
      duration: "20 minutes",
    },
  ];

  const healthScore = getHealthScore();
  const quickInsights = getQuickInsights();

  return (
    <DashboardLayout
      title="Health Alerts & Analysis"
      subtitle="Comprehensive health insights based on your nutrition data"
    >
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Health Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Health Score
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Meals Tracked
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{meals.length}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Daily Calories
                </CardTitle>
                <Zap className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    meals.reduce(
                      (sum, meal) => sum + meal.totalNutrition.calories,
                      0
                    ) / Math.max(1, Math.ceil(meals.length / 3))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">kcal per day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Risk Level
                </CardTitle>
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
              <CardDescription>
                Immediate observations from your recent meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quickInsights.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Log more meals to get personalized insights
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quickInsights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <div
                        key={index}
                        className={`flex items-start space-x-3 p-4 rounded-lg ${
                          insight.type === "warning"
                            ? "bg-orange-50 border border-orange-200"
                            : "bg-green-50 border border-green-200"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mt-1 ${
                            insight.type === "warning"
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        />
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-gray-600">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    );
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
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
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
                  <p className="text-gray-600">
                    No meal data available for analysis
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start logging meals to get your health report
                  </p>
                </div>
              )}

              {!healthAnalysis && meals.length > 0 && (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Ready to analyze your nutrition data
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click "Generate Report" to get personalized insights
                  </p>
                </div>
              )}

              {healthAnalysis && (
                <div className="space-y-6">
                  {renderAnalysisSection(
                    "Nutritional Assessment",
                    healthAnalysis.nutritionalAssessment,
                    Activity,
                    "bg-green-50 border-green-200 text-green-700"
                  )}

                  {renderAnalysisSection(
                    "Health Risks & Concerns",
                    healthAnalysis.healthRisks,
                    AlertTriangle,
                    "bg-red-50 border-red-200 text-red-700"
                  )}

                  {renderAnalysisSection(
                    "Improvement Recommendations",
                    healthAnalysis.recommendations,
                    TrendingUp,
                    "bg-blue-50 border-blue-200 text-blue-700"
                  )}

                  {renderAnalysisSection(
                    "AI-Generated Workout Plan",
                    healthAnalysis.workoutPlan,
                    Zap,
                    "bg-orange-50 border-orange-200 text-orange-700"
                  )}

                  {renderAnalysisSection(
                    "Sri Lankan Cuisine Advice",
                    healthAnalysis.cuisineAdvice,
                    Heart,
                    "bg-purple-50 border-purple-200 text-purple-700"
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Static Workout Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Workout Template</CardTitle>
              <CardDescription>
                General exercise recommendations - customize based on AI
                analysis above
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workoutRecommendations.map((workout, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {workout.day}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {workout.duration}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          workout.type === "Cardio"
                            ? "bg-red-100 text-red-800"
                            : workout.type === "Strength"
                            ? "bg-blue-100 text-blue-800"
                            : workout.type === "Active Recovery"
                            ? "bg-green-100 text-green-800"
                            : workout.type === "Fun Activity"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {workout.type}
                      </span>
                    </div>

                    <ul className="space-y-1">
                      {workout.exercises.map((exercise, exerciseIndex) => (
                        <li
                          key={exerciseIndex}
                          className="text-sm text-gray-600"
                        >
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
      </div>
    </DashboardLayout>
  );
}
