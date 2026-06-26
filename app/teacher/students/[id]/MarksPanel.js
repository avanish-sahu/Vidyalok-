"use client";

import { useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MarksPanel({ studentId, subject }) {
  const [tests, setTests] = useState([]);
  const [averagePercent, setAveragePercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [testName, setTestName] = useState("");
  const [date, setDate] = useState(todayStr());
  const [marksObtained, setMarksObtained] = useState("");
  const [totalMarks, setTotalMarks] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/marks?subject=${subject}`);
      const data = await res.json();
      setTests(data.marks?.tests || []);
      setAveragePercent(data.marks?.averagePercent || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    setTestName("");
    setMarksObtained("");
    setTotalMarks("");
    setDate(todayStr());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, subject]);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, testName, date, marksObtained, totalMarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add marks.");
        return;
      }
      setTestName("");
      setMarksObtained("");
      setTotalMarks("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(markId) {
    if (!confirm("Delete this test entry?")) return;
    await fetch(`/api/students/${studentId}/marks/${markId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="card-block">
      <div className="section-title">
        <h3>Marks</h3>
        <span className="badge badge-info">Average: {averagePercent}%</span>
      </div>

      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleAdd} style={{ marginBottom: 16 }}>
        <div className="field">
          <label htmlFor="test-name">Test Name</label>
          <input id="test-name" required value={testName} onChange={(e) => setTestName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="test-date">Date</label>
          <input id="test-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="marks-obtained">Marks Obtained</label>
            <input
              id="marks-obtained"
              type="number"
              min="0"
              required
              value={marksObtained}
              onChange={(e) => setMarksObtained(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="total-marks">Total Marks</label>
            <input
              id="total-marks"
              type="number"
              min="1"
              required
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-small" type="submit" disabled={saving}>
          {saving ? "Adding..." : "Add Test"}
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : tests.length === 0 ? (
        <div className="empty-state">No tests recorded yet for this subject.</div>
      ) : (
        <div className="resource-list">
          {tests
            .slice()
            .reverse()
            .map((t) => (
              <div className="resource-item" key={t._id}>
                <div>
                  <h4>{t.testName}</h4>
                  <div className="resource-meta">
                    {new Date(t.date).toLocaleDateString()} · {t.marksObtained}/{t.totalMarks}
                  </div>
                </div>
                <button className="btn btn-danger btn-small" onClick={() => handleDelete(t._id)}>
                  Delete
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
