import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { FoodItem } from "@/lib/firebase";

interface AIAnalysisResultProps {
  nutritionData: {
    dishName: string;
    servingSize: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    sugar?: number;
    fiber?: number;
    sodium?: number;
    keyVitamins?: string[];
    keyMinerals?: string[];
    ingredientsGuess?: string[];
    healthTips?: string[];
    disclaimer: string;
  };
  onBack: () => void;
  onConfirm: (items: FoodItem[]) => void;
  loading?: boolean;
}

export function AIAnalysisResult({
  nutritionData,
  onBack,
  onConfirm,
  loading,
}: AIAnalysisResultProps) {
  const handleConfirm = () => {
    // Convert nutrition data to FoodItem format
    const foodItems: FoodItem[] = [
      {
        name: nutritionData.dishName,
        quantity: nutritionData.servingSize,
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        carbs: nutritionData.carbohydrates,
        fats: nutritionData.fat,
      },
    ];
    onConfirm(foodItems);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Nutrition Card */}
        <Card>
          <CardHeader>
            <CardTitle>{nutritionData.dishName}</CardTitle>
            <CardDescription>
              Serving Size: {nutritionData.servingSize}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {nutritionData.calories}
                </p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {nutritionData.protein}g
                </p>
                <p className="text-sm text-gray-600">Protein</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {nutritionData.carbohydrates}g
                </p>
                <p className="text-sm text-gray-600">Carbs</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {nutritionData.fat}g
                </p>
                <p className="text-sm text-gray-600">Fats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nutritionData.ingredientsGuess && (
              <div>
                <h4 className="font-medium mb-2">Ingredients</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {nutritionData.ingredientsGuess.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            )}

            {nutritionData.healthTips && (
              <div>
                <h4 className="font-medium mb-2">Health Tips</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {nutritionData.healthTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrients Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detailed Nutrients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nutritionData.sugar !== undefined && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold">
                    {nutritionData.sugar}g
                  </p>
                  <p className="text-sm text-gray-600">Sugar</p>
                </div>
              )}
              {nutritionData.fiber !== undefined && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold">
                    {nutritionData.fiber}g
                  </p>
                  <p className="text-sm text-gray-600">Fiber</p>
                </div>
              )}
              {nutritionData.sodium !== undefined && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold">
                    {nutritionData.sodium}mg
                  </p>
                  <p className="text-sm text-gray-600">Sodium</p>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {nutritionData.keyVitamins && (
                <div>
                  <h4 className="font-medium mb-2">Key Vitamins</h4>
                  <div className="flex flex-wrap gap-2">
                    {nutritionData.keyVitamins.map((vitamin, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {vitamin}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {nutritionData.keyMinerals && (
                <div>
                  <h4 className="font-medium mb-2">Key Minerals</h4>
                  <div className="flex flex-wrap gap-2">
                    {nutritionData.keyMinerals.map((mineral, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {mineral}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Continue to Log Meal
            </>
          )}
        </Button>
      </div>

      <p className="text-sm text-gray-500 italic mt-4">
        {nutritionData.disclaimer}
      </p>
    </div>
  );
}
