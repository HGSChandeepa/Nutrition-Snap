import { AIInsights } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AIInsightsDisplayProps {
  insights: AIInsights;
}

export function AIInsightsDisplay({ insights }: AIInsightsDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Additional Nutrients */}
        {(insights.sugar !== undefined ||
          insights.fiber !== undefined ||
          insights.sodium !== undefined) && (
          <div>
            <h4 className="font-medium mb-3">Additional Nutrients</h4>
            <div className="grid grid-cols-3 gap-4">
              {insights.sugar !== undefined && (
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <p className="text-lg font-semibold text-pink-600">
                    {insights.sugar}g
                  </p>
                  <p className="text-sm text-gray-600">Sugar</p>
                </div>
              )}
              {insights.fiber !== undefined && (
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-lg font-semibold text-amber-600">
                    {insights.fiber}g
                  </p>
                  <p className="text-sm text-gray-600">Fiber</p>
                </div>
              )}
              {insights.sodium !== undefined && (
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <p className="text-lg font-semibold text-indigo-600">
                    {insights.sodium}mg
                  </p>
                  <p className="text-sm text-gray-600">Sodium</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ingredients */}
        {insights.ingredientsGuess && insights.ingredientsGuess.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Detected Ingredients</h4>
            <div className="flex flex-wrap gap-2">
              {insights.ingredientsGuess.map((ingredient, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Vitamins and Minerals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.keyVitamins && insights.keyVitamins.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Key Vitamins</h4>
              <div className="flex flex-wrap gap-2">
                {insights.keyVitamins.map((vitamin, index) => (
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

          {insights.keyMinerals && insights.keyMinerals.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Key Minerals</h4>
              <div className="flex flex-wrap gap-2">
                {insights.keyMinerals.map((mineral, index) => (
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

        {/* Health Tips */}
        {insights.healthTips && insights.healthTips.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Health Tips</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              {insights.healthTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        {insights.disclaimer && (
          <p className="text-xs text-gray-500 italic mt-4">
            {insights.disclaimer}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
