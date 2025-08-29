import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/profile";
import { createContext, useContext, useEffect, useRef, useState } from "react";

type AuthContextValue = {
  user: any;
  profile: Profile | null;
  loading: boolean; // keep for profile ops/spinners
  hydrated: boolean; // auth has initialized (user can be null)
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  userName: string;

  // Unify auth actions here (pages should not call supabase direct)
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error?: Error }>;
  updateProfile: (
    patch: Partial<Profile & { email?: string; phone?: string }>
  ) => Promise<{ error?: Error }>;
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
      .select(
        "id, first_name, last_name, email, phone, balance, city, birth_year, gender"
      )
      .eq("id", userId)
      .single();

    if (!mountedRef.current) return;

    if (error || !data) {
      setProfile(null);
      return;
    }

    // store everything; pages can pick what they need
    setProfile({
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      balance: data.balance,
      city: data.city,
      birth_year: data.birth_year,
      gender: data.gender,
    });
  };

  // bootstrap on app load: check session, set user, fetch profile if logged in
  const [hydrated, setHydrated] = useState(false);

  const bootstrap = async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data?.session?.user ?? null;
    if (!mountedRef.current) return;

    setUser(sessionUser);
    if (sessionUser) await fetchProfile(sessionUser.id);
    setLoading(false);
    setHydrated(true);
  };

  // listen to auth state changes (login/logout/refresh)
  useEffect(() => {
    mountedRef.current = true;
    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (evt, session) => {
        if (!mountedRef.current) return;

        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (evt === "SIGNED_OUT" || !nextUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // signed in / token refreshed
        setLoading(true);
        await fetchProfile(nextUser.id);
        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      sub?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile when tab/window focus or visibility changes
  useEffect(() => {
    const reconcile = async () => {
      const { data } = await supabase.auth.getSession();
      const nextUser = data?.session?.user ?? null;

      setUser((prev: any) => (prev?.id === nextUser?.id ? prev : nextUser));
      if (nextUser) await fetchProfile(nextUser.id);
      else setProfile(null);
    };

    const onFocus = () => reconcile();
    const onVisibility = () => {
      if (document.visibilityState === "visible") reconcile();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ?? undefined };
  };

  const updateProfile = async (patch: Partial<Omit<Profile, "id">>) => {
    if (!user?.id) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select(
        "id, first_name, last_name, email, phone, balance, city, birth_year, gender"
      )
      .single();

    if (!error && data) {
      setProfile(data); // data is a full Profile with id present
    }

    return { error: error ?? undefined };
  };

  const logout = async () => {
    setLoading(true);
    // Use default signOut (revokes refresh token); scope:"local" can leave server state lingering
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const userName = user
    ? [profile?.first_name?.trim(), profile?.last_name?.trim()]
        .filter(Boolean)
        .join(" ")
        .trim() || "" // ← empty while profile not ready
    : "Guest";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        hydrated,
        logout,
        refreshProfile,
        userName,
        signInWithPassword,
        updateProfile,
      }}
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
