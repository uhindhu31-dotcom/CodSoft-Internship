"use client";

import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AccountType = "candidate" | "recruiter";
type IntegrationStatus = { ai: boolean; email: boolean };

function PasswordInput(props: ComponentProps<"input">) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input {...props} type={isVisible ? "text" : "password"} />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        className="password-visibility-toggle"
        onClick={() => setIsVisible((visible) => !visible)}
        type="button"
      >
        {isVisible
          ? <EyeOff aria-hidden="true" size={17} />
          : <Eye aria-hidden="true" size={17} />}
      </button>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("candidate");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatus | null>(null);
  const [integrationError, setIntegrationError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/integrations", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !isRecord(body) || !isRecord(body.ai) || !isRecord(body.email)) {
          throw new Error("Integration configuration could not be checked.");
        }
        if (
          typeof body.ai.configured !== "boolean" ||
          typeof body.email.configured !== "boolean"
        ) {
          throw new Error("Integration configuration could not be checked.");
        }
        if (active) {
          setIntegrationStatus({
            ai: body.ai.configured,
            email: body.email.configured,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setIntegrationError(
            error instanceof Error
              ? error.message
              : "Integration configuration could not be checked.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsPending(true);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) {
          setMessage(result.error.message ?? "Account creation failed.");
          return;
        }

        if (accountType === "recruiter") {
          const response = await fetch("/api/recruiter/company", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: companyName, website }),
          });
          const body: unknown = await response.json();
          if (!response.ok) {
            const error =
              typeof body === "object" &&
              body !== null &&
              "error" in body &&
              typeof body.error === "string"
                ? body.error
                : "Company setup failed.";
            setMessage(`Account created, but company setup needs attention: ${error}`);
            return;
          }
        }
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setMessage(result.error.message ?? "Sign in failed.");
          return;
        }
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The request could not be completed. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-back" href="/">
          <ArrowLeft size={15} /> Back to jobs
        </Link>
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark">
            <BriefcaseBusiness size={19} strokeWidth={2.5} />
          </span>
          <span>career<span className="brand-accent">hub</span></span>
        </Link>
        <span className="section-kicker">A thoughtful next step</span>
        <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-description">
          {isSignUp
            ? "Build your profile, keep track of opportunities, and move forward."
            : "Sign in to pick up where your next career chapter begins."}
        </p>

        {isSignUp && (
          <div className="account-type-switch" role="group" aria-label="Account type">
            <button
              type="button"
              className={accountType === "candidate" ? "is-selected" : ""}
              onClick={() => setAccountType("candidate")}
            >
              I’m looking for work
            </button>
            <button
              type="button"
              className={accountType === "recruiter" ? "is-selected" : ""}
              onClick={() => setAccountType("recruiter")}
            >
              I’m hiring
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {isSignUp && (
            <label>
              Your name
              <input
                autoComplete="name"
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          )}
          {isSignUp && accountType === "recruiter" && (
            <>
              <label>
                Company name
                <input
                  autoComplete="organization"
                  maxLength={120}
                  onChange={(event) => setCompanyName(event.target.value)}
                  required
                  value={companyName}
                />
              </label>
              <label>
                Company website <span>(optional)</span>
                <input
                  autoComplete="url"
                  maxLength={255}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://example.com"
                  type="url"
                  value={website}
                />
              </label>
            </>
          )}
          <label>
            Email address
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <PasswordInput
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {message && (
            <p className="auth-message" role="alert">
              {message}
            </p>
          )}
          <button className="button button-primary auth-submit" disabled={isPending}>
            {isPending
              ? "Please wait…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="auth-assurance">
          <CheckCircle2 size={15} />
          <span>Your details stay private and are never shown on public profiles.</span>
        </div>
        <div className="auth-integration-status" aria-live="polite">
          {integrationStatus ? (
            <>
              <p>
                AI resume analysis: {integrationStatus.ai
                  ? "OpenAI configured"
                  : "unavailable; administrator must set OPENAI_API_KEY"}
              </p>
              <p>
                Account and workflow emails: {integrationStatus.email
                  ? "Resend configured"
                  : "unavailable; administrator must set RESEND_API_KEY and EMAIL_FROM"}
              </p>
            </>
          ) : (
            <p>{integrationError || "Checking AI and email configuration…"}</p>
          )}
        </div>
        <p className="auth-switch">
          {isSignUp ? "Already have an account?" : "New to CareerHub?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp((current) => !current);
              setMessage("");
            }}
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}
