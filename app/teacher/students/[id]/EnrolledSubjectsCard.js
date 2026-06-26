"use client";

import { useState } from "react";

export default function EnrolledSubjectsCard({ studentId, allSubjects, initialSubjects, onSaved }) {
  const [selected, setSelected] = useState(initialSubjects);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(slug) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/subjects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects: selected }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        onSaved?.(data.subjects);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-block">
      <h3>Enrolled Subjects</h3>
      <div className="checkbox-row" style={{ marginBottom: 12 }}>
        {allSubjects.map((s) => (
          <label className="checkbox-pill" key={s.slug}>
            <input type="checkbox" checked={selected.includes(s.slug)} onChange={() => toggle(s.slug)} />
            {s.name}
          </label>
        ))}
      </div>
      <button className="btn btn-small" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
      {saved && (
        <span className="badge badge-success" style={{ marginLeft: 12 }}>
          Saved
        </span>
      )}
    </div>
  );
}
