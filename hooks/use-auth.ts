'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'

// Lazy import Firebase to avoid SSR issues
const getFirebaseAuth = async () => {
  const { auth, signInAnonymouslyUser, getUserProfile } = await import('@/lib/firebase')
  return { auth, signInAnonymouslyUser, getUserProfile }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  userProfile: { profile: UserProfile; goals: UserGoals } | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  refreshProfile: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<{ profile: UserProfile; goals: UserGoals } | null>(null)
  const [firebaseReady, setFirebaseReady] = useState(false)

  const refreshProfile = async () => {
    if (user && firebaseReady) {
      try {
        const { getUserProfile } = await getFirebaseAuth()
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
      } catch (error) {
        console.error('Error refreshing profile:', error)
      }
    }
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        const { auth, signInAnonymouslyUser } = await getFirebaseAuth()
        setFirebaseReady(true)

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUser(user)
            await refreshProfile()
          } else {
            // Auto sign in anonymously
            try {
              const anonymousUser = await signInAnonymouslyUser()
              if (anonymousUser) {
                setUser(anonymousUser)
              }
            } catch (error) {
              console.error('Error signing in anonymously:', error)
            }
          }
          setLoading(false)
        })
      } catch (error) {
        console.error('Error initializing Firebase auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (user && !userProfile && firebaseReady) {
      refreshProfile()
    }
  }, [user, firebaseReady])

  return (
    <AuthContext.Provider value={{ user, loading, userProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
