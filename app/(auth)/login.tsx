"use client";

import Input from "@/components/global/Input";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set());

  const router = useRouter();
  const params = useLocalSearchParams<{
    redirect?: string;
    open?: string;
    ticketId?: string;
    source?: string;
  }>();
  const pathname = usePathname();

  // Auth context (single source of truth)
  const {
    currentUser,
    loading: authLoading,
    signInWithPassword,
    refreshProfile,
  } = useAuthContext();

  // Local redirect guard flags
  const [redirecting, setRedirecting] = useState(false);
  const hasNavigatedRef = useRef(false);

  // Compute target destination from URL params
  const computeDest = () => {
    const rawDest = params.redirect || "/";
    const dest =
      typeof rawDest === "string" && rawDest.startsWith("/") ? rawDest : "/";

    const src = Array.isArray(params.source) ? params.source[0] : params.source;
    const open = Array.isArray(params.open) ? params.open[0] : params.open;
    const ticketId = Array.isArray(params.ticketId)
      ? params.ticketId[0]
      : params.ticketId;

    const shouldCarry = src === "guard" && !!open && !!ticketId;
    return {
      dest,
      open: shouldCarry ? open : undefined,
      ticketId: shouldCarry ? ticketId : undefined,
    };
  };

  const destInfo = useMemo(computeDest, [
    params.redirect,
    params.source,
    params.open,
    params.ticketId,
  ]);

  // If already logged in (including after hard reload), redirect once
  useEffect(() => {
    if (authLoading) return; // wait for bootstrap
    if (!currentUser.isLoggedIn) return; // only when logged in
    if (redirecting || hasNavigatedRef.current) return;

    const { dest, open, ticketId } = destInfo;
    const isAuthRoute = dest.startsWith("/(auth)");
    const isSameRoute = dest === pathname;

    hasNavigatedRef.current = true;
    setRedirecting(true);

    router.replace(
      isAuthRoute || isSameRoute
        ? "/"
        : ({
            pathname: dest,
            params: open && ticketId ? { open, ticketId } : {},
          } as never)
    );
  }, [
    authLoading,
    currentUser.isLoggedIn,
    redirecting,
    destInfo,
    router,
    pathname,
  ]);

  // Backstop: if redirecting gets stuck, clear it
  useEffect(() => {
    if (!redirecting) return;
    const t = setTimeout(() => setRedirecting(false), 800);
    return () => clearTimeout(t);
  }, [redirecting]);

  // Allow future redirects again when user becomes logged out
  useEffect(() => {
    if (!currentUser.isLoggedIn) {
      hasNavigatedRef.current = false;
      setRedirecting(false);
    }
  }, [currentUser.isLoggedIn]);

  if (redirecting) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setEmptyFields((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (redirecting) return; // avoid double submit

    setError("");
    setSubmitting(true);

    try {
      const missing = new Set<string>();
      const email = form.email.trim().toLowerCase();
      const password = form.password;

      if (!email) missing.add("email");
      if (!password.trim()) missing.add("password");

      if (missing.size) {
        setEmptyFields(missing);
        setError("Please fill in all fields.");
        return;
      }

      const { error: loginError } = await signInWithPassword(email, password);
      // Note: signInWithPassword triggers a hard reload on success.
      // The effect above will redirect after the reload since query params persist.

      if (loginError) {
        setError(loginError.message);

        const msg = loginError.message.toLowerCase();
        if (msg.includes("invalid") || msg.includes("credentials")) {
          setEmptyFields(new Set(["email", "password"]));
        } else if (msg.includes("confirm") || msg.includes("verify")) {
          setEmptyFields(new Set(["email"]));
        } else {
          setEmptyFields(new Set(["password"]));
        }
        return;
      }

      // Fire-and-forget profile refresh (safe even if reload occurs first)
      refreshProfile().catch(() => {});
      setEmptyFields(new Set());
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || redirecting) {
    return (
      <div className="form-container">
        <h1 className="form-title">Loading…</h1>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h1 className="form-title" style={{ marginBottom: "0.5rem" }}>
        Sign in
      </h1>
      <div className="text-link">
        or{" "}
        <span
          className="text-link-action"
          onClick={() => router.push("/(auth)/signup")}
        >
          create an account
        </span>
      </div>

      <form onSubmit={handleLogin}>
        <Input
          name="email"
          type="text"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className={
            emptyFields.has("email") ? "form-input-error" : "form-input"
          }
        />

        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className={
            emptyFields.has("password") ? "form-input-error" : "form-input"
          }
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="form-button" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>

        <div
          className="text-link"
          style={{ marginTop: "15px", color: "#2c74e2", cursor: "pointer" }}
          onClick={() => {
            alert("This feature doesn't work right now.");
          }}
        >
          Forgot your password?
        </div>
      </form>
    </div>
  );
}
