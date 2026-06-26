"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch(() => {});
  }, []);

  function toggleSubject(slug) {
    setSelectedSubjects((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, subjects: selectedSubjects }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="center-screen">
        <div className="auth-card">
          <h2>Application submitted</h2>
          <p>
            Thanks! Your teacher application is pending admin approval. You&apos;ll be able to
            log in once it&apos;s approved.
          </p>
          <p className="muted-link">
            <Link href="/login?role=teacher">Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="auth-card">
        <h2>Apply to teach</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: -8, marginBottom: 16 }}>
          Your account will need admin approval before you can log in.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
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
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Which subjects do you teach?</label>
            <div className="checkbox-row">
              {subjects.map((s) => (
                <label className="checkbox-pill" key={s.slug}>
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(s.slug)}
                    onChange={() => toggleSubject(s.slug)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
        <p className="muted-link">
          Already approved? <Link href="/login?role=teacher">Log in</Link>
        </p>
      </div>
    </div>
  );
}
