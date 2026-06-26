"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const DESTINATIONS = { teacher: "/teacher", admin: "/admin", student: "/subjects" };

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "teacher" ? "teacher" : "student";

  // step: "email" -> "set-password" (first time) or "password" (returning)
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function goToDestination(userRole) {
    router.push(DESTINATIONS[userRole] || "/subjects");
    router.refresh();
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.exists) {
        setError("No account found with this email.");
        return;
      }
      setStep(data.needsPassword ? "set-password" : "password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      goToDestination(data.user.role);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPasswordSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not set password.");
        return;
      }
      goToDestination(data.user.role);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeEmail() {
    setStep("email");
    setPassword("");
    setConfirm("");
    setError("");
  }

  return (
    <div className="center-screen">
      <div className="auth-card">
        <h2>{role === "teacher" ? "Teacher Login" : "Student Login"}</h2>
        {error && <div className="error-banner">{error}</div>}

        {step === "email" && (
          <form onSubmit={handleEmailSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit}>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
              {email} (<button type="button" onClick={changeEmail} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, font: "inherit" }}>change</button>)
            </p>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        )}

        {step === "set-password" && (
          <form onSubmit={handleSetPasswordSubmit}>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
              Welcome! Set a password for {email} (
              <button type="button" onClick={changeEmail} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, font: "inherit" }}>change</button>
              )
            </p>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Setting password..." : "Set Password & Log In"}
            </button>
          </form>
        )}

        <p className="muted-link">
          {role === "teacher" ? (
            <>
              New here? <Link href="/signup?role=teacher">Apply to teach</Link>
            </>
          ) : (
            "Don't have an account? Ask your teacher to add you."
          )}
        </p>
      </div>
    </div>
  );
}
