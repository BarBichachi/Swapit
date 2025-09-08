import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/profile";
import type { User } from "@supabase/supabase-js";
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
  logout: (timeoutMs?: number) => Promise<void>;
  waitForSignedIn: (timeoutMs?: number) => Promise<void>;
  waitForSignedOut: (timeoutMs?: number) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // internal sources of truth
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, email, phone, balance, birth_year, gender"
      )
      .eq("id", userId)
      .single();

    if (!mountedRef.current) return;
    if (!userId) return;
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

        if (nextUser) await fetchProfile(nextUser.id);
        else setProfile(null);
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
      .channel(`auth-profile-live-${authUser.id}`)
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
    if (authUser?.id) {
      try {
        await fetchProfile(authUser.id);
      } catch (e) {
        console.error("Failed to refresh profile:", e);
      }
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
        "id, first_name, last_name, email, phone, balance, birth_year, gender"
      )
      .single();

    if (!error && data) setProfile(data as Profile);
    return { error: error ?? undefined };
  };

  const logout = async (timeoutMs = 1500) => {
    // Try global revoke, but don't hang forever
    const globalRevoke = supabase.auth.signOut();

    let timedOut = false;
    await Promise.race([
      globalRevoke,
      new Promise<void>((resolve) =>
        setTimeout(() => {
          timedOut = true;
          resolve();
        }, timeoutMs)
      ),
    ]);

    if (timedOut) {
      // Force local signout if global revoke stalled
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    }

    // Ensure UI flips immediately regardless of server revoke result
    setAuthUser(null);
    setProfile(null);
  };

  const waitForSignedIn = async (timeoutMs = 1200) => {
    // Fast paths
    if (authUser?.id) return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return;

    // Otherwise, wait for the next SIGNED_IN (or timeout)
    await new Promise<void>((resolve) => {
      let settled = false;

      const to = setTimeout(() => {
        if (settled) return;
        settled = true;
        sub?.subscription?.unsubscribe();
        resolve();
      }, timeoutMs);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (settled) return;
        if (session?.user) {
          settled = true;
          clearTimeout(to);
          sub.subscription.unsubscribe();
          resolve();
        }
      });
    });
  };

  const waitForSignedOut = async (timeoutMs = 1200) => {
    if (!authUser?.id) return; // already signed out

    await new Promise<void>((resolve) => {
      let settled = false;

      const to = setTimeout(() => {
        if (settled) return;
        settled = true;
        sub?.subscription?.unsubscribe();
        resolve();
      }, timeoutMs);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (settled) return;
        if (!session?.user) {
          settled = true;
          clearTimeout(to);
          sub.subscription.unsubscribe();
          resolve();
        }
      });
    });
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
        waitForSignedIn,
        waitForSignedOut,
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
