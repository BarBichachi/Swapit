"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

// auto sign-out on mount, then redirect home
export default function LogoutPage() {
  const { user, logout, hydrated } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;

    // if already logged out, just go home
    if (!user) {
      router.replace("/");
      return;
    }

    (async () => {
      try {
        await logout(); // provider handles supabase signOut + state
        if (!active) return;
        router.replace("/");
      } catch (e: any) {
        if (!active) return;
        setErr(e?.message || "Sign out failed");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, logout, router, hydrated]);

  if (!hydrated) {
    return (
      <div className="form-container">
        <h1 className="form-title">Preparing sign out…</h1>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h1 className="form-title">{loading ? "Signing out…" : "Signed out"}</h1>
      {err && <p className="form-error">{err}</p>}
      {!loading && (
        <button className="form-button" onClick={() => router.replace("/")}>
          Go Home
        </button>
      )}
    </div>
  );
}
