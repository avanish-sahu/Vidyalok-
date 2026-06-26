"use client";

import { useEffect, useState } from "react";

export default function NotePanel({ studentId, subject }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/students/${studentId}/performance-note?subject=${subject}`)
      .then((res) => res.json())
      .then((data) => setNote(data.note || ""))
      .finally(() => setLoading(false));
  }, [studentId, subject]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/students/${studentId}/performance-note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, note }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="card-block">
      <h3>Performance Note</h3>
      <form onSubmit={handleSave}>
        <div className="field">
          <textarea
            rows={3}
            placeholder="e.g. Strong in algebra, needs work on geometry..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button className="btn btn-small" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Note"}
        </button>
      </form>
    </div>
  );
}
