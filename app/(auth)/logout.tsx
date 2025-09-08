"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

export default function LogoutPage() {
  const { logout } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [err, setErr] = useState<string | null>(null);

  // track whether we've already performed logout for the current visit
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Only run when actually on /logout
    if (pathname !== "/logout") {
      // leaving the route -> allow running next time we come back
      attemptedRef.current = false;
      return;
    }
    if (attemptedRef.current) return; // already ran for this visit
    attemptedRef.current = true;

    // do not await network here; logout() should clear locally and resolve immediately
    try {
      logout().catch(() => {}); // fire-and-forget; we already flip UI locally

      // defer navigation so header can re-render to "Guest" first
      const goHome = () => {
        try {
          router.replace("/");
        } catch {
          if (typeof window !== "undefined") window.location.assign("/");
        }
      };

      // next microtask + next frame + small timeout as belts-and-suspenders
      Promise.resolve().then(() => requestAnimationFrame(goHome));
      setTimeout(goHome, 250);
    } catch (e: any) {
      setErr(e?.message || "Sign out failed");
      // still leave the page
      try {
        router.replace("/");
      } catch {}
    }
  }, [pathname, logout, router]);

  return (
    <div className="form-container">
      <h1 className="form-title">Signing out…</h1>
      {err && <p className="form-error">{err}</p>}
    </div>
  );
}
