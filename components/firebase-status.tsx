'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export default function FirebaseStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    checkFirebaseConnection()
  }, [user])

  const checkFirebaseConnection = async () => {
    try {
      if (user) {
        // Try to read from Firestore to verify connection
        const { db } = await import('@/lib/firebase')
        const { doc, getDoc } = await import('firebase/firestore')
        const testDoc = doc(db, 'users', user.uid)
        await getDoc(testDoc)
        setStatus('connected')
      }
    } catch (error) {
      console.error('Firebase connection error:', error)
      setStatus('error')
    }
  }

  const CheckCircle = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
  )

  const XCircle = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  )

  if (status === 'checking') {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting...</span>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <CheckCircle />
        <span>Connected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-red-600">
      <XCircle />
      <span>Connection error</span>
    </div>
  )
}
