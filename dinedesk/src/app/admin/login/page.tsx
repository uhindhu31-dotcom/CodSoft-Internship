
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(
          result.error.message || "Invalid email or password."
        );
        return;
      }

      window.location.href = "/admin/dashboard";
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8f1] px-5 py-10">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg"
      >
        <a
          href="/"
          className="font-semibold text-orange-600 hover:underline"
        >
          ← Back to DineDesk
        </a>

        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-orange-600">
          DineDesk Management
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-900">
          Admin Login
        </h1>

        <p className="mt-2 text-gray-600">
          Sign in with your admin account.
        </p>

        <label
          htmlFor="email"
          className="mt-6 block text-sm font-semibold text-gray-800"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-orange-500"
          placeholder="admin@example.com"
        />

        <label
          htmlFor="password"
          className="mt-4 block text-sm font-semibold text-gray-800"
        >
          Password
        </label>

        <div className="mt-2 flex items-center rounded-xl border-2 border-gray-300 bg-white focus-within:border-orange-500">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-w-0 flex-1 rounded-l-xl bg-white px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Enter your password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-orange-100 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={22} strokeWidth={2} />
            ) : (
              <Eye size={22} strokeWidth={2} />
            )}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
