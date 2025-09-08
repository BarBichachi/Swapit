"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function LogoutPage() {
  const { logout, waitForSignedOut } = useAuthContext();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isFocused) return; // only when user actually navigates here
    let cancelled = false;

    (async () => {
      try {
        // robust logout (global revoke with timeout, then local clear)
        await logout(1500);
        // wait for the provider to observe SIGNED_OUT (or give up after ~1.2s)
        await waitForSignedOut(1200);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Sign out failed");
      } finally {
        if (!cancelled) router.replace("/");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isFocused, logout, waitForSignedOut, router]);

  return (
    <div className="form-container">
      <h1 className="form-title">Signing out…</h1>
      {err && <p className="form-error">{err}</p>}
    </div>
  );
}
