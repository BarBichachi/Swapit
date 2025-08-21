import { supabase } from "@/lib/supabase";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type Profile = { first_name?: string | null; last_name?: string | null };
type AuthContextValue = {
  user: ReturnType<typeof supabase.auth.getUser> extends Promise<infer _>
    ? any
    : any; // keep simple
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  userName: string;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // fetch the user's profile from 'profiles' and set profile + user name
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", userId)
      .single();
    if (!mountedRef.current) return;
    if (error) {
      setProfile(null);
      return;
    }
    setProfile({ first_name: data?.first_name, last_name: data?.last_name });
  };

  // bootstrap on app load: check session, set user, fetch profile if logged in
  const bootstrap = async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data?.session?.user ?? null;
    if (!mountedRef.current) return;
    setUser(sessionUser);
    if (sessionUser) await fetchProfile(sessionUser.id);
    setLoading(false);
  };

  // listen to auth state changes (login/logout/refresh)
  useEffect(() => {
    mountedRef.current = true;
    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_evt, session) => {
        if (!mountedRef.current) return;
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) await fetchProfile(sessionUser.id);
        else setProfile(null);
      }
    );

    return () => {
      mountedRef.current = false;
      sub?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  const userName = user
    ? [profile?.first_name?.trim(), profile?.last_name?.trim()]
        .filter(Boolean)
        .join(" ")
        .trim() || "User"
    : "Guest";

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, logout, refreshProfile, userName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuthContext must be used within <AuthProvider>");
  return ctx;
}
