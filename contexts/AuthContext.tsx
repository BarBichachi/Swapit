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
  waitForProfileReady: (timeoutMs?: number) => Promise<void>;
  profileReady: boolean;
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
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, email, phone, balance, birth_year, gender"
      )
      .eq("id", userId)
      .maybeSingle();

    if (!mountedRef.current) return;

    if (error) {
      setProfile(null);
      return;
    }

    if (!data) {
      setProfile(null);
      return;
    }

    setProfile(data as Profile);
  };

  const withTimeout = <T,>(p: Promise<T>, ms = 1500) =>
    Promise.race<T>([
      p,
      new Promise<T>((_, rej) =>
        setTimeout(() => rej(new Error("pf-timeout")), ms)
      ),
    ]);

  const safeFetchProfile = async (uid: string) => {
    await withTimeout(fetchProfile(uid), 1500);
  };

  // bootstrap once
  useEffect(() => {
    mountedRef.current = true;

    // One path to rule them all
    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      const nextUser = session?.user ?? null;
      setAuthUser(nextUser);

      if (nextUser) safeFetchProfile(nextUser.id); // <-- no await
      else setProfile(null);

      if (loading) setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const profileReady = !!(authUser?.id && profile?.id === authUser.id);

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
    try {
      // use latest session in case authUser isn't set yet
      const id =
        authUser?.id ?? (await supabase.auth.getUser()).data.user?.id ?? null;
      if (!id) return;
      await fetchProfile(id);
    } catch (e) {
      console.error("Failed to refresh profile:", e);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error ?? undefined };
    }
    if (data?.user?.id) {
      setAuthUser(data.user);
      await fetchProfile(data.user.id);
    }
    return { error: undefined };
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

  const logout = (_timeoutMs?: number): Promise<void> => {
    // Fire-and-forget: never await here
    supabase.auth.signOut({ scope: "local" }).catch(() => {});
    // Flip UI now
    setAuthUser(null);
    setProfile(null);
    // Best-effort server revoke, also fire-and-forget
    supabase.auth.signOut().catch(() => {});
    // Resolve immediately
    return Promise.resolve();
  };

  const waitForSignedIn = async (timeoutMs = 1200) => {
    if (authUser?.id) return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return;

    await new Promise<void>((resolve) => {
      let settled = false;
      let unsub: (() => void) | null = null;

      const to = setTimeout(() => {
        if (settled) return;
        settled = true;
        unsub?.();
        resolve();
      }, timeoutMs);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (settled) return;
        if (session?.user) {
          settled = true;
          clearTimeout(to);
          unsub?.();
          resolve();
        }
      });

      unsub = () => sub.subscription.unsubscribe();
    });
  };

  const waitForSignedOut = async (timeoutMs = 1200) => {
    if (!authUser?.id) return;
    await new Promise<void>((resolve) => {
      let settled = false;
      let unsub: (() => void) | null = null;

      const to = setTimeout(() => {
        if (settled) return;
        settled = true;
        unsub?.();
        resolve();
      }, timeoutMs);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (settled) return;
        if (!session?.user) {
          settled = true;
          clearTimeout(to);
          unsub?.();
          resolve();
        }
      });

      unsub = () => sub.subscription.unsubscribe();
    });
  };

  const profileReadyWaiters = useRef<(() => void)[]>([]);

  // call all waiters when profile matches current auth user
  useEffect(() => {
    if (authUser?.id && profile?.id === authUser.id) {
      const ws = profileReadyWaiters.current.splice(0);
      ws.forEach((fn) => fn());
    }
  }, [authUser?.id, profile?.id]);

  const waitForProfileReady = (timeoutMs = 1200) =>
    new Promise<void>((resolve) => {
      // already ready
      if (authUser?.id && profile?.id === authUser.id) return resolve();

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      profileReadyWaiters.current.push(finish);
      setTimeout(finish, timeoutMs);
    });

  // --- unified view exposed to the app ---
  const currentUser = useMemo<CurrentUser>(() => {
    const id = authUser?.id ?? profile?.id ?? null;
    const email = authUser?.email ?? profile?.email ?? null;

    const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;

    const asString = (v: unknown): string | null =>
      typeof v === "string" && v.trim() ? v : null;

    const asNumber = (v: unknown): number | null => {
      const n =
        typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      return Number.isFinite(n) ? n : null;
    };

    const phone = asString(profile?.phone) ?? asString(meta.phone);

    const first_name =
      asString(profile?.first_name) ??
      asString((meta as any).first_name) ??
      asString((meta as any).firstName);

    const last_name =
      asString(profile?.last_name) ??
      asString((meta as any).last_name) ??
      asString((meta as any).lastName);

    //let fullName = [first_name, last_name].filter(Boolean).join(" ").trim();
    //if (!fullName) {
    //  const handle = email?.split("@")[0] ?? "";
    //  fullName = handle || "";
    //}
    let fullName = [first_name, last_name].filter(Boolean).join(" ").trim();
    let nameSource: "profile" | "metadata" | "email" | "empty" = "empty";
    if (first_name || last_name) {
      nameSource =
        profile?.first_name || profile?.last_name ? "profile" : "metadata";
    } else if (email) {
      const handle = email.split("@")[0] ?? "";
      if (handle) {
        fullName = handle;
        nameSource = "email";
      }
    }

    const balance = Number(profile?.balance ?? 0);

    const birth_year =
      asNumber(profile?.birth_year as unknown) ??
      asNumber((meta as any).birth_year) ??
      asNumber((meta as any).birthYear);

    // Ensure gender is ALWAYS string | null (never number)
    const genderRaw = profile?.gender ?? ((meta as any).gender as unknown);
    const gender =
      typeof genderRaw === "string"
        ? genderRaw
        : typeof genderRaw === "number"
        ? String(genderRaw)
        : null;

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
        waitForProfileReady,
        profileReady,
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
