'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import { Camera, Upload, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MealImageUploaderProps {
  onImageUploaded: (url: string, file?: File) => void
  onImageRemoved: () => void
  currentImageUrl?: string
  disabled?: boolean
}

export default function MealImageUploader({ 
  onImageUploaded, 
  onImageRemoved, 
  currentImageUrl,
  disabled = false 
}: MealImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleCameraCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Create a preview URL for immediate display
        const previewUrl = URL.createObjectURL(file)
        onImageUploaded(previewUrl, file)
      }
    }
    input.click()
  }

  if (currentImageUrl) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <img
              src={currentImageUrl || "/placeholder.svg"}
              alt="Meal"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                onClick={onImageRemoved}
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {currentImageUrl.startsWith('blob:') && (
              <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs">
                Preview - Will upload when saving
              </div>
            )}
            {currentImageUrl.startsWith('https://') && (
              <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
                <Check className="w-3 h-3 mr-1" />
                Uploaded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Camera Button */}
          <Button
            onClick={handleCameraCapture}
            disabled={disabled || isUploading}
            className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center space-x-3"
          >
            <Camera className="w-6 h-6" />
            <span className="text-lg font-medium">Take Photo</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg">
            <UploadDropzone
              endpoint="mealImageUploader"
              onClientUploadComplete={(res) => {
                console.log("Files: ", res);
                if (res && res[0]) {
                  onImageUploaded(res[0].url);
                  setIsUploading(false);
                  setUploadError(null);
                }
              }}
              onUploadError={(error: Error) => {
                console.error("Upload error:", error);
                setUploadError(error.message);
                setIsUploading(false);
              }}
              onUploadBegin={() => {
                setIsUploading(true);
                setUploadError(null);
              }}
              appearance={{
                container: "border-none bg-transparent",
                uploadIcon: "text-green-600",
                label: "text-green-600 font-medium",
                allowedContent: "text-gray-500 text-sm",
                button: "bg-green-600 hover:bg-green-700 text-white ut-ready:bg-green-600 ut-uploading:bg-green-400"
              }}
              content={{
                uploadIcon: () => <Upload className="w-8 h-8" />,
                label: "Choose image or drag and drop",
                allowedContent: "PNG, JPG, JPEG up to 4MB"
              }}
            />
          </div>

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">Upload failed: {uploadError}</p>
            </div>
          )}

          {isUploading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Uploading image...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
