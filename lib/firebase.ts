import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, User, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, Timestamp, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics, Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyDRt8NZn8fpETdkKuo6zfMwNOSSsweYGwE",
  authDomain: "one-tender.firebaseapp.com",
  databaseURL: "https://one-tender-default-rtdb.firebaseio.com",
  projectId: "one-tender",
  storageBucket: "one-tender.appspot.com",
  messagingSenderId: "341328188165",
  appId: "1:341328188165:web:bc81c6516aed06f4b7dd6c",
  measurementId: "G-TS3V9SSX3C"
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize analytics only on client side
let analytics: Analytics | null = null
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
  } catch (error) {
    console.warn('Analytics initialization failed:', error)
  }
}
export { analytics }

// Types
export interface UserProfile {
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active'
}

export interface UserGoals {
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFats: number
}

export interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs?: number
  fats?: number
}

export interface Meal {
  id?: string
  uid: string
  createdAt: Timestamp
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  foodItems: FoodItem[]
  totalNutrition: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
  imageUrl?: string
  notes?: string
}

// Auth functions with better error handling
export const signInAnonymouslyUser = async (): Promise<User | null> => {
  try {
    console.log('Attempting anonymous sign in...')
    const result = await signInAnonymously(auth)
    console.log('Anonymous sign in successful:', result.user.uid)
    return result.user
  } catch (error: any) {
    console.error('Error signing in anonymously:', error)
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/admin-restricted-operation') {
      console.error('Anonymous authentication is not enabled. Please enable it in Firebase Console.')
      // For now, create a mock user for development
      return {
        uid: `mock-user-${Date.now()}`,
        isAnonymous: true,
        email: null,
        displayName: null,
        photoURL: null,
        phoneNumber: null,
        providerId: 'anonymous',
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      } as User
    }
    
    return null
  }
}

// User functions
export const createUserProfile = async (uid: string, profile: UserProfile, goals: UserGoals) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      createdAt: Timestamp.now(),
      profile,
      goals
    })
  } catch (error) {
    console.error('Error creating user profile:', error)
  }
}

export const getUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? docSnap.data() : null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

export const updateUserProfile = async (uid: string, profile: UserProfile, goals: UserGoals) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      profile,
      goals
    }, { merge: true })
  } catch (error) {
    console.error('Error updating user profile:', error)
  }
}

// Meal functions
export const saveMeal = async (meal: Omit<Meal, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'meals'), meal)
    return docRef.id
  } catch (error) {
    console.error('Error saving meal:', error)
    return null
  }
}

export const getUserMeals = async (uid: string, date?: Date) => {
  try {
    let q = query(
      collection(db, 'meals'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    )

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      q = query(
        collection(db, 'meals'),
        where('uid', '==', uid),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('createdAt', 'desc')
      )
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Meal[]
  } catch (error) {
    console.error('Error getting user meals:', error)
    return []
  }
}

// Storage functions
export const uploadMealImage = async (uid: string, mealId: string, imageFile: File): Promise<string | null> => {
  try {
    const imageRef = ref(storage, `userMeals/${uid}/${mealId}.jpg`)
    await uploadBytes(imageRef, imageFile)
    return await getDownloadURL(imageRef)
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

// Mocked AI Analysis Function
export const analyzeImage = async (imageFile: File): Promise<{ success: boolean; items: FoodItem[] }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2500))
  
  // Mock Sri Lankan meal analysis
  const mockResponses = [
    {
      success: true,
      items: [
        { name: "Basmati Rice", quantity: "1 cup", calories: 205, protein: 4, carbs: 45, fats: 0.5 },
        { name: "Dhal Curry (Parippu)", quantity: "1 bowl", calories: 150, protein: 9, carbs: 20, fats: 5 },
        { name: "Chicken Curry", quantity: "2 pieces", calories: 240, protein: 25, carbs: 8, fats: 12 }
      ]
    },
    {
      success: true,
      items: [
        { name: "String Hoppers", quantity: "4 pieces", calories: 160, protein: 3, carbs: 32, fats: 2 },
        { name: "Coconut Sambol", quantity: "2 tbsp", calories: 80, protein: 1, carbs: 3, fats: 8 },
        { name: "Fish Curry", quantity: "1 piece", calories: 180, protein: 20, carbs: 5, fats: 9 }
      ]
    },
    {
      success: true,
      items: [
        { name: "Kottu Roti", quantity: "1 portion", calories: 350, protein: 15, carbs: 40, fats: 15 },
        { name: "Egg", quantity: "1 whole", calories: 70, protein: 6, carbs: 1, fats: 5 }
      ]
    }
  ]
  
  return mockResponses[Math.floor(Math.random() * mockResponses.length)]
}
