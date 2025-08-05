"use client";

import Input from "@/components/Input";
import { birthYears, cities, genders } from "@/lib/constants/registration";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import Select from "react-select";

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    birthYear: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Clear field error as user types
    setEmptyFields((prev) => {
      const updated = new Set(prev);
      updated.delete(e.target.name);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const newEmptyFields = new Set<string>();
    const { email, phone, ...rest } = form;

    // 1. Check required fields
    for (const [key, value] of Object.entries(form)) {
      if (!value.trim()) {
        newEmptyFields.add(key);
      }
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setError("Invalid email format");
      setEmptyFields((prev) => new Set(prev).add("email"));
      setLoading(false);
      return;
    }

    // 3. Validate phone format
    const phoneRegex = /^05\d{8}$/;
    if (phone && !phoneRegex.test(phone)) {
      setError("Phone must start with 05 and be 10 digits");
      setEmptyFields((prev) => new Set(prev).add("phone"));
      setLoading(false);
      return;
    }

    // 4. If missing fields
    if (newEmptyFields.size > 0) {
      setEmptyFields(newEmptyFields);
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // 5. Submit
    setEmptyFields(new Set());

    const { email: eMail, password, ...profile } = form;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: eMail,
      password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || "Signup failed.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email: email,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        city: profile.city,
        birth_year: parseInt(profile.birthYear),
        gender: profile.gender,
      },
    ]);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.replace("/");
  };
  return (
    <div className="form-container">
      <h1 className="form-title">Create Your Account</h1>
      <div className="text-link">
        Already have an account?{" "}
        <span
          className="text-link-action"
          onClick={() => router.push("/(auth)/login")}
        >
          Sign in
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          onChange={handleChange}
          className={`form-input ${
            emptyFields.has("firstName") ? "form-input-error" : ""
          }`}
        />

        <Input
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          onChange={handleChange}
          className={
            emptyFields.has("lastName") ? "form-input-error" : "form-input"
          }
        />

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

        <Input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className={
            emptyFields.has("phone") ? "form-input-error" : "form-input"
          }
        />

        <div className="form-group">
          <Select
            options={genders.map(({ label, value }) => ({ label, value }))}
            placeholder="Select Gender"
            onChange={(selectedOption) =>
              setForm({ ...form, gender: selectedOption?.value || "" })
            }
            value={
              form.gender
                ? genders
                    .map((g) => ({ label: g.label, value: g.value }))
                    .find((g) => g.value === form.gender)
                : null
            }
            isSearchable
          />
        </div>

        <div className="form-group">
          <Select
            options={cities.map((city) => ({ label: city, value: city }))}
            placeholder="Select a City"
            onChange={(selectedOption) =>
              setForm({ ...form, city: selectedOption?.value || "" })
            }
            value={
              cities.includes(form.city)
                ? { label: form.city, value: form.city }
                : null
            }
            isSearchable
          />
        </div>

        <div className="form-group">
          <Select
            options={birthYears.map((year) => ({
              label: String(year),
              value: String(year),
            }))}
            placeholder="Select Birth Year"
            onChange={(selectedOption) =>
              setForm({ ...form, birthYear: selectedOption?.value || "" })
            }
            value={
              form.birthYear
                ? { label: form.birthYear, value: form.birthYear }
                : null
            }
            isSearchable
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
