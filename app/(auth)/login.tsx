"use client";

import Input from "@/components/global/Input";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set());
  const router = useRouter();
  const params = useLocalSearchParams<{
    redirect?: string;
    open?: string;
    ticketId?: string;
    source?: string;
  }>();
  const [redirecting, setRedirecting] = useState(false);
  const hasNavigatedRef = useRef(false);
  const { user } = useAuthContext();

  // Helper to sanitize + compute destination once
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
  const pathname = usePathname();

  // Redirects whenever we're logged in
  useEffect(() => {
    if (!user || redirecting || hasNavigatedRef.current) return;

    const { dest, open, ticketId } = destInfo;

    // --- SAFETY GUARDS: do not "redirect" to the same page or an auth route ---
    const isAuthRoute = dest.startsWith("/(auth)");
    const isSameRoute = dest === pathname;

    if (isAuthRoute || isSameRoute) {
      // we're already here or it's an auth screen — don't enter the "blank" state
      return;
    }

    hasNavigatedRef.current = true;
    setRedirecting(true);

    router.replace({
      pathname: dest,
      params: open && ticketId ? { open, ticketId } : {},
    } as never);
  }, [user, redirecting, destInfo, router, pathname]);

  // Backstop: if redirecting stays true but no navigation happens, clear it
  useEffect(() => {
    if (!redirecting) return;
    const t = setTimeout(() => setRedirecting(false), 800);
    return () => clearTimeout(t);
  }, [redirecting]);

  // When user becomes null (logged out), allow future redirects again
  useEffect(() => {
    if (!user) {
      hasNavigatedRef.current = false;
      setRedirecting(false);
    }
  }, [user]);

  // Don't render while redirecting or before we've checked auth state
  if (redirecting) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setEmptyFields((prev) => {
      const updated = new Set(prev);
      updated.delete(name);
      return updated;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (redirecting) return; // avoid double submit during navigation

    setError("");
    setLoading(true);

    try {
      // --- validate & highlight missing fields ---
      const missing = new Set<string>();
      const email = form.email.trim().toLowerCase();
      const password = form.password;

      if (!email) missing.add("email");
      if (!password.trim()) missing.add("password");

      if (missing.size) {
        setEmptyFields(missing);
        setError("Please fill in all fields.");
        return; // finally will run
      }

      // --- sign in ---
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);

        // Highlight likely-problem fields based on the error text
        const msg = loginError.message.toLowerCase();
        if (msg.includes("invalid") || msg.includes("credentials")) {
          setEmptyFields(new Set(["email", "password"]));
        } else if (msg.includes("confirm") || msg.includes("verify")) {
          setEmptyFields(new Set(["email"]));
        } else {
          // generic highlight: password
          setEmptyFields(new Set(["password"]));
        }
        return; // finally will run
      }

      // --- post-signin verification fallback (rare event-miss) ---
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        await new Promise((r) => setTimeout(r, 50));
      }

      // success: clear any previous highlights
      setEmptyFields(new Set());
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // TODO: TO BE USED IN THE FUTURE
  const handleResetPassword = async () => {
    if (!form.email.trim()) {
      setError("Enter your email to reset password.");
      setEmptyFields((prev) => new Set(prev).add("email"));
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      form.email,
      {
        redirectTo: "OUR RESET PASSWORD URL", // Replace with real URL
      }
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      alert("Password reset email sent!");
    }
  };

  if (user) {
    return (
      <div className="form-container">
        <h1 className="form-title" style={{ marginBottom: "0.5rem" }}>
          You are already logged in!
        </h1>
        {/* Optional: a link to go back */}
        <button className="form-button" onClick={() => router.replace("/")}>
          Go Home
        </button>
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

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div
          className="text-link"
          style={{ marginTop: "15px", color: "#2c74e2", cursor: "pointer" }}
          onClick={() => {
            // TODO: Implement password reset functionality
            alert("This feature doesn't work right now.");
          }}
        >
          Forgot your password?
        </div>
      </form>
    </div>
  );
}
