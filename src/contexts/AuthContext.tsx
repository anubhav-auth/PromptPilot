import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { showLoading, dismissToast, showError } from "@/utils/toast";

interface Profile {
  tier: string;
  trial_ends_at: string | null;
  subscription_status: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("tier, trial_ends_at, subscription_status")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error.message);
      return null;
    }
    return data;
  };

  useEffect(() => {
    const setupSession = async (session: Session | null) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await fetchProfile(currentUser.id);
        setProfile(userProfile);
        chrome.storage.local.set({ user_profile: userProfile });
      } else {
        setProfile(null);
        chrome.storage.local.remove("user_profile");
      }
      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setupSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setupSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const loadingToast = showLoading("Logging out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showError(error.message);
      } else {
        // Also clear daily usage on sign out
        chrome.storage.local.remove(["user_profile", "daily_usage"]);
      }
    } catch (error) {
      showError("An unexpected error occurred during logout.");
    } finally {
      dismissToast(loadingToast);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};