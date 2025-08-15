"use client";

import Input from "@/components/global/Input";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setForm({ email: "", password: "" });
    setError("");
    setLoading(false);
    setEmptyFields(new Set());

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session?.user);
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setLoading(false); // תאפס טעינה בכל שינוי התחברות
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

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

    const newEmptyFields = new Set<string>();
    if (!form.email.trim()) newEmptyFields.add("email");
    if (!form.password.trim()) newEmptyFields.add("password");

    if (newEmptyFields.size > 0) {
      setEmptyFields(newEmptyFields);
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

    setIsLoggedIn(true);
    setLoading(false);
    router.replace("/");
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
        <button className="form-button" onClick={handleLogout} disabled={loading}>
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