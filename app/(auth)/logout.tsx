"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

// Auto sign-out on mount, then redirect home
export default function LogoutPage() {
  const { currentUser, loading, logout } = useAuthContext();
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth bootstrap to finish
    if (loading) return;

    let active = true;

    // If already logged out, just go home
    if (!currentUser.isLoggedIn) {
      router.replace("/");
      return;
    }

    (async () => {
      try {
        await logout(); // AuthContext handles Supabase signOut + hard reload
        if (!active) return;
        router.replace("/");
      } catch (e: any) {
        if (!active) return;
        setErr(e?.message || "Sign out failed");
      } finally {
        if (active) setLocalLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, currentUser.isLoggedIn, logout, router]);

  if (loading) {
    return (
      <div className="form-container">
        <h1 className="form-title">Preparing sign out…</h1>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h1 className="form-title">
        {localLoading ? "Signing out…" : "Signed out"}
      </h1>
      {err && <p className="form-error">{err}</p>}
      {!localLoading && (
        <button className="form-button" onClick={() => router.replace("/")}>
          Go Home
        </button>
      )}
    </div>
  );
}
