import { logEvent } from 'firebase/analytics'

// Analytics helper functions for tracking user interactions
export const trackEvent = async (eventName: string, parameters?: Record<string, any>) => {
  try {
    if (typeof window !== 'undefined') {
      const { analytics } = await import('./firebase')
      if (analytics) {
        const { logEvent } = await import('firebase/analytics')
        logEvent(analytics, eventName, parameters)
      }
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error)
  }
}

// Specific tracking functions for Nutrition Snap
export const trackMealLogged = (mealType: string, itemCount: number, calories: number) => {
  trackEvent('meal_logged', {
    meal_type: mealType,
    item_count: itemCount,
    calories: calories
  })
}

export const trackImageAnalyzed = (success: boolean, itemCount?: number) => {
  trackEvent('image_analyzed', {
    success: success,
    item_count: itemCount || 0
  })
}

export const trackGoalUpdated = (goalType: string, newValue: number) => {
  trackEvent('goal_updated', {
    goal_type: goalType,
    new_value: newValue
  })
}

export const trackProfileUpdated = () => {
  trackEvent('profile_updated')
}
