"use client";

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User, UserProfile, onAuthStateChanged } from "firebase/auth";
import { UserGoals } from "@/lib/firebase";

// Lazy import Firebase to avoid SSR issues
const getFirebaseAuth = async () => {
  const { auth, signInAnonymouslyUser, getUserProfile } = await import(
    "@/lib/firebase"
  );
  return { auth, signInAnonymouslyUser, getUserProfile };
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: { profile: UserProfile; goals: UserGoals } | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({
  children,
}: AuthProviderProps): React.ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    profile: UserProfile;
    goals: UserGoals;
  } | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const refreshProfile = async () => {
    if (user && firebaseReady) {
      try {
        const { getUserProfile } = await getFirebaseAuth();
        const profileData = await getUserProfile(user.uid);
        if (profileData?.profile && profileData?.goals) {
          setUserProfile({
            profile: profileData.profile,
            goals: profileData.goals,
          });
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        const { auth, signInAnonymouslyUser } = await getFirebaseAuth();
        setFirebaseReady(true);

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUser(user);
            await refreshProfile();
          } else {
            try {
              const anonymousUser = await signInAnonymouslyUser();
              if (anonymousUser) {
                setUser(anonymousUser);
              }
            } catch (error) {
              console.error("Error signing in anonymously:", error);
            }
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error initializing Firebase auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (user && !userProfile && firebaseReady) {
      refreshProfile();
    }
  }, [user, firebaseReady]);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        userProfile,
        refreshProfile,
      },
    },
    children
  );
};
