
"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        setMessage(result.error.message || "Login failed. Check your details.");
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setMessage("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-orange-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-7 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Welcome Back!
          </h1>
          <p className="mt-3 text-base font-medium text-gray-600">
            Log in to your DineDesk account.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-800">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-800">
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 pr-20 text-base font-medium text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />

              
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-500 hover:text-orange-600"
  aria-label={showPassword ? "Hide password" : "Show password"}
>
  {showPassword ? (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.2A11 11 0 0112 5c5 0 9 7 9 7a15 15 0 01-4 4.8" />
      <path d="M6.2 6.2C3.5 8 2 12 2 12s3 7 10 7a10 10 0 003.1-.5" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )}
</button>

            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 px-4 py-3.5 text-base font-extrabold text-white shadow-md transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {message && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm font-medium text-gray-700">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-extrabold text-orange-700 hover:underline">
            Sign up
          </Link>
        </p>

        <Link href="/" className="mt-4 block text-center text-sm font-semibold text-gray-500 hover:text-orange-700 hover:underline">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
