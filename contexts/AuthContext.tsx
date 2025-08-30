import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/profile";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type CurrentUser = {
  // unified, safe-to-use fields (always present with sensible defaults)
  id: string | null;
  email: string | null;
  phone: string | null;

  first_name: string | null;
  last_name: string | null;
  fullName: string; // derived: "First Last" or "" when not ready
  balance: number; // derived: 0 when unknown

  city: string | null;
  birth_year: number | null;
  gender: string | null;

  isLoggedIn: boolean;

  // access to raw sources if you ever need them
  raw: {
    authUser: any | null;
    profile: Profile | null;
  };
};

type AuthContextValue = {
  currentUser: CurrentUser;
  loading: boolean; // single flag (bootstrap/profile ops)

  refreshProfile: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error?: Error }>;
  updateProfile: (
    patch: Partial<Profile & { email?: string; phone?: string }>
  ) => Promise<{ error?: Error }>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // internal sources of truth
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const reloadOnNextAuthChangeRef = useRef(false);
  const mountedRef = useRef(true);
  const reloadingRef = useRef(false);
  const hardReload = () => {
    if (typeof window !== "undefined" && !reloadingRef.current) {
      reloadingRef.current = true;
      window.location.reload();
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, email, phone, balance, city, birth_year, gender"
      )
      .eq("id", userId)
      .single();

    if (!mountedRef.current) return;
    if (error || !data) setProfile(null);
    else setProfile(data as Profile);
  };

  // bootstrap once
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user ?? null;
      if (!mountedRef.current) return;

      setAuthUser(sessionUser);
      if (sessionUser) await fetchProfile(sessionUser.id);
      setLoading(false);
    })();

    // auth changes (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (evt, session) => {
        if (!mountedRef.current) return;

        const nextUser = session?.user ?? null;
        setAuthUser(nextUser);

        switch (evt) {
          case "SIGNED_IN":
          case "SIGNED_OUT": {
            // Only reload if this tab triggered it
            if (reloadOnNextAuthChangeRef.current) {
              reloadOnNextAuthChangeRef.current = false;
              hardReload();
              return;
            }
            // Cross-tab or passive event: just update profile state
            if (nextUser) await fetchProfile(nextUser.id);
            else setProfile(null);
            return;
          }

          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
          case "PASSWORD_RECOVERY":
          case "INITIAL_SESSION":
          default: {
            // Never reload on these; just hydrate profile if signed in
            if (nextUser) await fetchProfile(nextUser.id);
            else setProfile(null);
            return;
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // realtime updates for my profile row
  useEffect(() => {
    if (!authUser?.id) return;
    const ch = supabase
      .channel("auth-profile-live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${authUser.id}`,
        },
        () => fetchProfile(authUser.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [authUser?.id]);

  const refreshProfile = async () => {
    if (authUser?.id) await fetchProfile(authUser.id);
  };

  const signInWithPassword = async (email: string, password: string) => {
    reloadOnNextAuthChangeRef.current = true; // this tab initiated
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) reloadOnNextAuthChangeRef.current = false; // cancel if failed
    return { error: error ?? undefined };
  };

  const updateProfile = async (
    patch: Partial<Profile & { email?: string; phone?: string }>
  ) => {
    if (!authUser?.id) return { error: new Error("No user") };
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", authUser.id)
      .select(
        "id, first_name, last_name, email, phone, balance, city, birth_year, gender"
      )
      .single();

    if (!error && data) setProfile(data as Profile);
    return { error: error ?? undefined };
  };

  const logout = async () => {
    setLoading(true);
    reloadOnNextAuthChangeRef.current = true;
    await supabase.auth.signOut();
    setLoading(false);
  };

  // --- unified view exposed to the app ---
  const currentUser = useMemo<CurrentUser>(() => {
    const id = authUser?.id ?? profile?.id ?? null;
    const email = authUser?.email ?? profile?.email ?? null;
    const phone = profile?.phone ?? null;

    const first_name = profile?.first_name ?? null;
    const last_name = profile?.last_name ?? null;
    const fullName = [first_name?.trim(), last_name?.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();

    const balance = Number(profile?.balance ?? 0);
    const city = profile?.city ?? null;
    const birth_year = (profile?.birth_year as number | null) ?? null;
    const gender = profile?.gender ?? null;

    const isLoggedIn = !!authUser?.id;

    return {
      id,
      email,
      phone,
      first_name,
      last_name,
      fullName,
      balance,
      city,
      birth_year,
      gender,
      isLoggedIn,
      raw: { authUser, profile },
    };
  }, [authUser, profile]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        refreshProfile,
        signInWithPassword,
        updateProfile,
        logout,
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
