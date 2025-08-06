'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Send, Bot, User, Image, Loader2 } from 'lucide-react'
import { UploadDropzone } from '@/lib/uploadthing'

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  imageUrl?: string
}

export default function ChatPage() {
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your nutrition assistant. I can help you with meal planning, food analysis, and nutrition advice. Feel free to ask me anything about your diet or upload a photo of your meal for analysis!',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (message: string, imageData?: string) => {
    if (!message.trim() && !imageData) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message || 'Analyze this image',
      timestamp: new Date(),
      imageUrl: imageData
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setShowImageUpload(false)

    try {
      const response = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message || 'Please analyze this food image and provide nutritional insights.',
          imageData,
          userContext: {
            profile: userProfile?.profile,
            goals: userProfile?.goals
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageData = e.target?.result as string
          sendMessage('', imageData)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      sendMessage('', imageData)
    }
    reader.readAsDataURL(file)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout 
      title="Nutrition Chat" 
      subtitle="Ask questions about your meals and get personalized nutrition advice"
    >
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && (
                    <Bot className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  )}
                  {message.type === 'user' && (
                    <User className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl || "/placeholder.svg"}
                        alt="Uploaded meal"
                        className="w-full max-w-xs rounded-lg mb-2"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-green-600" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Image Upload Section */}
        {showImageUpload && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Upload Food Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={handleImageCapture}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                
                <Button
                  variant="outline"
                  onClick={() => setShowImageUpload(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Section */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className="flex-shrink-0"
            >
              <Image className="w-4 h-4" />
            </Button>
            
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about nutrition, meals, or health advice..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(inputMessage)
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            
            <Button
              onClick={() => sendMessage(inputMessage)}
              disabled={isLoading || (!inputMessage.trim())}
              className="flex-shrink-0 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
