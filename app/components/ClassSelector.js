"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClassSelector({ approvedClass, pendingClass, classes }) {
  const [draftValue, setDraftValue] = useState(pendingClass || approvedClass || "");
  const [pending, setPending] = useState(pendingClass || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Server re-renders this with fresh data on each AutoRefresh tick; keep local
  // state in sync so an approval/rejection from the teacher shows up live.
  useEffect(() => {
    setDraftValue(pendingClass || approvedClass || "");
    setPending(pendingClass || null);
  }, [approvedClass, pendingClass]);

  function className(slug) {
    return classes.find((c) => c.slug === slug)?.name || slug;
  }

  function handleSelect(e) {
    setDraftValue(e.target.value);
    setError("");
  }

  async function handleSendRequest() {
    if (!draftValue || draftValue === pending) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/account/class", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: draftValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit request.");
        return;
      }
      setPending(data.pendingClass);
    } finally {
      setSaving(false);
    }
  }

  const canSend = draftValue && draftValue !== pending && draftValue !== approvedClass;

  return (
    <div className="card-block">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label htmlFor="my-class" style={{ fontWeight: 600 }}>
          Your Class:
        </label>
        <select id="my-class" value={draftValue} onChange={handleSelect} style={{ maxWidth: 220 }}>
          <option value="">Select your class</option>
          {classes.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-small"
          disabled={saving || !canSend}
          onClick={handleSendRequest}
        >
          {saving ? "Sending..." : "Send Request to Teacher"}
        </button>
        {!saving && approvedClass && <span className="badge badge-success">{className(approvedClass)} approved</span>}
      </div>
      {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}
      {!saving && pending && (
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12, marginBottom: 0 }}>
          Waiting for your teacher to approve <strong>{className(pending)}</strong>. You&apos;ll only see
          general content until then.
        </p>
      )}
      {!saving && approvedClass && !pending && (
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12, marginBottom: 0 }}>
          <Link href="/subjects" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Continue to Subjects →
          </Link>
        </p>
      )}
    </div>
  );
}
