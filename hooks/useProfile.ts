import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  balance: number | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const refetchProfile = async () => {
    setLoading(true);
    const {
      data: { user },
      error: uErr,
    } = await supabase.auth.getUser();
    if (uErr) console.warn("[useProfile] getUser error:", uErr);
    if (!user) {
      userIdRef.current = null;
      setProfile(null);
      setLoading(false);
      return;
    }
    userIdRef.current = user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, balance")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[useProfile] fetch error:", error);
      setProfile(null);
    } else {
      setProfile(data ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // initial fetch + refresh on login/logout
    refetchProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() =>
      refetchProfile()
    );

    // optional realtime: update when my own profile balance changes
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel("profile-balance-live")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          () => refetchProfile()
        )
        .subscribe();
    })();

    return () => {
      sub?.subscription?.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return {
    loading,
    profile,
    balance: profile?.balance ?? 0,
    firstName: profile?.first_name ?? null,
    userId: profile?.id ?? null,
    refetchProfile, // 👈 call this after purchase
  };
}

export default useProfile;
