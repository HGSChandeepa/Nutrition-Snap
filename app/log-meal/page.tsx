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

type Step = "input-method" | "analyzing" | "confirmation";

export default function LogMeal() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("input-method");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<
    "Breakfast" | "Lunch" | "Dinner" | "Snack"
  >("Breakfast");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-trigger camera if method=camera in URL
  React.useEffect(() => {
    if (searchParams.get("method") === "camera") {
      // Camera will be triggered by the MealImageUploader component
    }
  }, [searchParams]);

  const handleImageUploaded = (url: string, file?: File) => {
    setSelectedImageUrl(url);
    if (file) {
      setSelectedImageFile(file);
      // If it's a local file (blob URL), analyze it immediately
      if (url.startsWith("blob:")) {
        analyzeSelectedImage(file);
      }
    }
  };

  const handleImageRemoved = () => {
    setSelectedImageUrl(null);
    setSelectedImageFile(null);
    setStep("input-method");
  };

  const handleManualEntry = () => {
    setAnalyzedItems([
      { name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fats: 0 },
    ]);
    setStep("confirmation");
  };

  const analyzeSelectedImage = async (imageFile?: File) => {
    const fileToAnalyze = imageFile || selectedImageFile;
    if (!fileToAnalyze) return;

    setStep("analyzing");
    setLoading(true);

    try {
      const result = await analyzeImage(fileToAnalyze);
      if (result.success) {
        setAnalyzedItems(result.items);
        setStep("confirmation");
        trackImageAnalyzed(true, result.items.length);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
    } finally {
      setLoading(false);
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

  const saveMealData = async () => {
    if (!user || analyzedItems.length === 0) return;

    setLoading(true);

    try {
      const totalNutrition = calculateTotalNutrition();

      let finalImageUrl = selectedImageUrl;

      // If we have a local file (blob URL), upload it to UploadThing
      if (selectedImageFile && selectedImageUrl?.startsWith("blob:")) {
        const uploadedUrl = await uploadImageToUploadThing(selectedImageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const mealData = {
        uid: user.uid,
        createdAt: Timestamp.now(),
        mealType,
        foodItems: analyzedItems.filter((item) => item.name.trim() !== ""),
        totalNutrition,
        imageUrl: finalImageUrl || "",
        notes: notes.trim(),
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

  if (step === "input-method") {
    return (
      <DashboardLayout
        title="Log New Meal"
        subtitle="Choose how you'd like to add your meal"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Image Upload Section */}
          <MealImageUploader
            onImageUploaded={handleImageUploaded}
            onImageRemoved={handleImageRemoved}
            currentImageUrl={selectedImageUrl ?? undefined}
            disabled={loading}
          />

          {/* Manual Entry Option */}
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
      </DashboardLayout>
    );
  }

  if (step === "analyzing") {
    return (
      <DashboardLayout
        title="Analyzing Meal"
        subtitle="Our AI is identifying your food items"
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              {selectedImageUrl && (
                <div className="mb-8">
                  <img
                    src={selectedImageUrl || "/placeholder.svg"}
                    alt="Selected meal"
                    className="w-64 h-64 object-cover rounded-xl shadow-lg"
                  />
                </div>
              )}
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mb-6"></div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Analyzing your meal...
              </h2>
              <p className="text-gray-600">
                Our AI is identifying the food items and calculating nutrition
                information.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalNutrition = calculateTotalNutrition();

  return (
    <DashboardLayout
      title="Confirm Meal Details"
      subtitle="Review and edit the detected items"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={() => setStep("input-method")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image and Settings */}
          <div className="space-y-6">
            {/* Image Preview */}
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
                </CardContent>
              </Card>
            )}

            {/* Meal Settings */}
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
                      <SelectItem value="Breakfast">🌅 Breakfast</SelectItem>
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

            {/* Total Nutrition */}
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
          </div>

          {/* Right Column - Food Items */}
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
                              updateFoodItem(index, "quantity", e.target.value)
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
                  <Button
                    variant="outline"
                    onClick={() => setStep("input-method")}
                  >
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
      </div>
    </DashboardLayout>
  );
}
