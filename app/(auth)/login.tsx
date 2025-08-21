"use client";

import Input from "@/components/global/Input";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{
    redirect?: string;
    open?: string;
    ticketId?: string;
    source?: string;
  }>();
  const [redirecting, setRedirecting] = useState(false);
  const [checked, setChecked] = useState(false);
  const hasNavigatedRef = useRef(false);

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

    const shouldCarry = src === "guard" && !!open && !!ticketId; // <--- only guard path carries
    return {
      dest,
      open: shouldCarry ? open : undefined,
      ticketId: shouldCarry ? ticketId : undefined,
    };
  };

  // 1) Bounce immediately if already logged in (server-validated)
  useEffect(() => {
    const doBounce = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user && !error) {
        setIsLoggedIn(true);
      }
      setChecked(true); // we've checked; allow UI/effects to proceed
    };
    doBounce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Init listener (keeps isLoggedIn in sync)
  useEffect(() => {
    if (redirecting) return;
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evt, session) => {
        setIsLoggedIn(!!session?.user);
        setLoading(false);
      }
    );
    return () => listener?.subscription?.unsubscribe();
  }, [redirecting]);

  // 3) Single place that redirects whenever we're logged in
  useEffect(() => {
    if (!checked) return; // wait until initial getUser() completes
    if (!isLoggedIn) return; // only when logged in
    if (redirecting || hasNavigatedRef.current) return;

    const { dest, open, ticketId } = computeDest();
    hasNavigatedRef.current = true;
    setRedirecting(true);
    router.replace({
      pathname: dest,
      params: open && ticketId ? { open, ticketId } : {}, // only when source === "guard"
    } as never);
  }, [checked, isLoggedIn, redirecting, params, router]);

  // Don't render while redirecting or before we've checked auth state
  if (redirecting || !checked) return null;

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
    setError("");
    setLoading(true);

    const missing = new Set<string>();
    if (!form.email.trim()) missing.add("email");
    if (!form.password.trim()) missing.add("password");
    if (missing.size) {
      setEmptyFields(missing);
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
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

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setIsLoggedIn(false);
      setForm({ email: "", password: "" });
      setError("");
      setLoading(false);
      router.replace("/"); // מעבר לעמוד הבית אחרי התנתקות
    }
  };

  if (isLoggedIn) {
    return (
      <div className="form-container">
        <h1 className="form-title" style={{ marginBottom: "0.5rem" }}>
          You are already logged in!
        </h1>
        <button
          className="form-button"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Logging out..." : "Logout"}
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
