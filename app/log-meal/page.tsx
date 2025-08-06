"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { analyzeImage, saveMeal, FoodItem, Timestamp } from "@/lib/firebase";
import {
  Camera,
  Upload,
  Edit3,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout";
import MealImageUploader from "@/components/meal-image-uploader";
import { trackMealLogged, trackImageAnalyzed } from "@/lib/analytics";
import React from "react";
import { AIAnalysisResult } from "@/components/ai-analysis-result";
import { AIInsightsDisplay } from "@/components/ai-insights-display";

export default function LogMeal() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<
    "Breakfast" | "Lunch" | "Dinner" | "Snack"
  >("Breakfast");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Auto-trigger camera if method=camera in URL
  React.useEffect(() => {
    if (searchParams.get("method") === "camera") {
      // Camera will be triggered by the MealImageUploader component
    }
  }, [searchParams]);

  const uploadImageToUploadThing = async (
    file: File
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/uploadthing", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response:", response);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      return result[0]?.url || null;
    } catch (error) {
      console.error("Error uploading to UploadThing:", error);
      return null;
    }
  };

  const handleImageUploaded = async (url: string, file?: File) => {
    setSelectedImageUrl(url);
    setAnalysisError(null);

    if (file) {
      setSelectedImageFile(file);
      // Wait a bit for the image to be properly uploaded
      setTimeout(() => {
        analyzeSelectedImage(file, url);
      }, 500);
    }
  };

  const handleImageRemoved = () => {
    setSelectedImageUrl(null);
    setSelectedImageFile(null);
    setAiAnalysisResult(null);
    setAnalyzedItems([]);
    setIsAnalyzing(false);
    setAnalysisError(null);
  };

  const handleManualEntry = () => {
    setAnalyzedItems([
      { name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fats: 0 },
    ]);
  };

  const analyzeSelectedImage = async (imageFile?: File, imageUrl?: string) => {
    const fileToAnalyze = imageFile || selectedImageFile;
    let urlToAnalyze = imageUrl || selectedImageUrl;

    if (!fileToAnalyze && !urlToAnalyze) {
      console.error("No image file or URL available for analysis");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // If we have a blob URL, we need to upload it first
      if (urlToAnalyze?.startsWith("blob:") && fileToAnalyze) {
        console.log("Uploading blob image to UploadThing...");
        urlToAnalyze = await uploadImageToUploadThing(fileToAnalyze);
        if (!urlToAnalyze) {
          throw new Error("Failed to upload image");
        }
        // Update the selected image URL with the uploaded URL
        setSelectedImageUrl(urlToAnalyze);
      }

      console.log("Analyzing image with URL:", urlToAnalyze);

      // Call the analyze-food API
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: urlToAnalyze }),
      });

      console.log("Response status:", response.status);
      console.log("Response OK:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const nutritionData = await response.json();
      console.log("Nutrition data received:", nutritionData);

      setAiAnalysisResult(nutritionData);

      // Automatically set analyzedItems from AI results
      const foodItems: FoodItem[] = [
        {
          name: nutritionData.dishName || "Unknown Dish",
          quantity: nutritionData.servingSize || "1 serving",
          calories: nutritionData.calories || 0,
          protein: nutritionData.protein || 0,
          carbs: nutritionData.carbohydrates || 0,
          fats: nutritionData.fat || 0,
        },
      ];
      setAnalyzedItems(foodItems);
      trackImageAnalyzed(true, foodItems.length);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Analysis failed"
      );

      // Fallback to mock analysis
      try {
        if (fileToAnalyze) {
          const result = await analyzeImage(fileToAnalyze);
          if (result.success) {
            setAnalyzedItems(result.items);
            trackImageAnalyzed(true, result.items.length);
          }
        }
      } catch (fallbackError) {
        console.error("Error in fallback analysis:", fallbackError);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateFoodItem = (
    index: number,
    field: keyof FoodItem,
    value: string | number
  ) => {
    const updated = [...analyzedItems];
    updated[index] = { ...updated[index], [field]: value };
    setAnalyzedItems(updated);
  };

  const removeFoodItem = (index: number) => {
    setAnalyzedItems(analyzedItems.filter((_, i) => i !== index));
  };

  const addFoodItem = () => {
    setAnalyzedItems([
      ...analyzedItems,
      { name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fats: 0 },
    ]);
  };

  const calculateTotalNutrition = () => {
    return analyzedItems.reduce(
      (total, item) => ({
        calories: total.calories + (item.calories || 0),
        protein: total.protein + (item.protein || 0),
        carbs: total.carbs + (item.carbs || 0),
        fats: total.fats + (item.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const saveMealData = async () => {
    if (!user || analyzedItems.length === 0) return;

    setLoading(true);

    try {
      const totalNutrition = calculateTotalNutrition();

      let finalImageUrl = selectedImageUrl;

      if (selectedImageFile && selectedImageUrl?.startsWith("blob:")) {
        const uploadedUrl = await uploadImageToUploadThing(selectedImageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const aiInsights = aiAnalysisResult
        ? {
            keyVitamins: aiAnalysisResult.keyVitamins || [],
            keyMinerals: aiAnalysisResult.keyMinerals || [],
            ingredientsGuess: aiAnalysisResult.ingredientsGuess || [],
            healthTips: aiAnalysisResult.healthTips || [],
            disclaimer:
              aiAnalysisResult.disclaimer ||
              "Nutritional information is an estimate",
            sugar: aiAnalysisResult.sugar || 0,
            fiber: aiAnalysisResult.fiber || 0,
            sodium: aiAnalysisResult.sodium || 0,
          }
        : null;

      const mealData = {
        uid: user.uid,
        createdAt: Timestamp.now(),
        mealType,
        foodItems: analyzedItems.filter((item) => item.name.trim() !== ""),
        totalNutrition,
        imageUrl: finalImageUrl || "",
        notes: notes.trim(),
        aiInsights,
      };

      await saveMeal(mealData);
      trackMealLogged(mealType, analyzedItems.length, totalNutrition.calories);
      router.push("/");
    } catch (error) {
      console.error("Error saving meal:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalNutrition = calculateTotalNutrition();

  return (
    <DashboardLayout
      title="Log New Meal"
      subtitle={
        selectedImageUrl
          ? "Review and edit the detected items"
          : "Choose how you'd like to add your meal"
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {!selectedImageUrl && !isAnalyzing && !aiAnalysisResult && (
          <div className="max-w-2xl mx-auto space-y-6">
            <MealImageUploader
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemoved}
              currentImageUrl={selectedImageUrl ?? undefined}
              disabled={loading}
            />
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={handleManualEntry}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Edit3 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Manual Entry</h3>
                <p className="text-sm text-gray-500">
                  Type in your food items manually
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {(selectedImageUrl || isAnalyzing || aiAnalysisResult) && (
          <>
            <div className="flex items-center space-x-4 mb-6">
              <Button variant="outline" onClick={handleImageRemoved}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                {selectedImageUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Meal Photo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={selectedImageUrl || "/placeholder.svg"}
                        alt="Selected meal"
                        className="w-full h-48 object-cover rounded-lg"
                      />

                      {/* Analysis status - appears directly under the image */}
                      {isAnalyzing && (
                        <div className="mt-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-green-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">
                            Analyzing food with AI...
                          </p>
                        </div>
                      )}

                      {/* {analysisError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm">
                            Analysis failed: {analysisError}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => analyzeSelectedImage()}
                          >
                            Retry Analysis
                          </Button>
                        </div>
                      )} */}

                      {aiAnalysisResult && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">
                            AI Analysis Complete
                          </h4>
                          <p className="text-sm text-green-600">
                            Detected: {aiAnalysisResult.dishName}
                          </p>
                          <p className="text-sm text-green-600">
                            Calories: {aiAnalysisResult.calories}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Meal Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meal Type
                      </label>
                      <Select
                        value={mealType}
                        onValueChange={(value: any) => setMealType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Breakfast">
                            🌅 Breakfast
                          </SelectItem>
                          <SelectItem value="Lunch">☀️ Lunch</SelectItem>
                          <SelectItem value="Dinner">🌙 Dinner</SelectItem>
                          <SelectItem value="Snack">🍎 Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Nutrition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {totalNutrition.calories}
                        </p>
                        <p className="text-sm text-gray-600">Calories</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {totalNutrition.protein}g
                        </p>
                        <p className="text-sm text-gray-600">Protein</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {totalNutrition.carbs}g
                        </p>
                        <p className="text-sm text-gray-600">Carbs</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {totalNutrition.fats}g
                        </p>
                        <p className="text-sm text-gray-600">Fats</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {aiAnalysisResult && (
                  <AIInsightsDisplay insights={aiAnalysisResult} />
                )}
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Food Items</CardTitle>
                      <CardDescription>
                        Review and edit the detected food items
                      </CardDescription>
                    </div>
                    <Button onClick={addFoodItem} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyzedItems.map((item, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-900">
                              Item {index + 1}
                            </h4>
                            {analyzedItems.length > 1 && (
                              <Button
                                onClick={() => removeFoodItem(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Food Name
                              </label>
                              <Input
                                placeholder="e.g., Basmati Rice"
                                value={item.name}
                                onChange={(e) =>
                                  updateFoodItem(index, "name", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity
                              </label>
                              <Input
                                placeholder="e.g., 1 cup, 2 pieces"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateFoodItem(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Calories
                              </label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.calories || ""}
                                onChange={(e) =>
                                  updateFoodItem(
                                    index,
                                    "calories",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Protein (g)
                              </label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.protein || ""}
                                onChange={(e) =>
                                  updateFoodItem(
                                    index,
                                    "protein",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Carbs (g)
                              </label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.carbs || ""}
                                onChange={(e) =>
                                  updateFoodItem(
                                    index,
                                    "carbs",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fats (g)
                              </label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.fats || ""}
                                onChange={(e) =>
                                  updateFoodItem(
                                    index,
                                    "fats",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                      <Button variant="outline" onClick={handleImageRemoved}>
                        Cancel
                      </Button>
                      <Button
                        onClick={saveMealData}
                        disabled={
                          loading ||
                          analyzedItems.every((item) => !item.name.trim())
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Meal
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
