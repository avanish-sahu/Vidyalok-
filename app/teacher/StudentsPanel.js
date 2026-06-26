"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentsPanel({ subjects }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState("");

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function toggleSubject(slug) {
    setSelectedSubjects((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subjects: selectedSubjects }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add student.");
        return;
      }
      setJustAdded(data.student.email);
      setName("");
      setEmail("");
      setSelectedSubjects([]);
      loadStudents();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function subjectName(slug) {
    return subjects.find((s) => s.slug === slug)?.name || slug;
  }

  return (
    <>
      <div className="card-block">
        <h3>Add a student</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="student-name">Name</label>
            <input id="student-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="student-email">Email</label>
            <input
              id="student-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Which of your subjects is this student taking?</label>
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
          <button className="btn" type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Student"}
          </button>
        </form>
        {justAdded && (
          <div
            className="error-banner"
            style={{ background: "#eef1fb", color: "var(--primary-dark)", borderColor: "var(--border)", marginTop: 16 }}
          >
            Added! Tell {justAdded} to go to the login page, enter that email, and set their own
            password the first time.
          </div>
        )}
      </div>

      <div className="section-title">
        <h3>Your Students ({students.length})</h3>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <div className="empty-state">You haven&apos;t added any students yet.</div>
      ) : (
        <div className="resource-list">
          {students.map((s) => (
            <div className="resource-item" key={s.id}>
              <div>
                <h4>{s.name}</h4>
                <p>{s.email}</p>
                <div className="resource-meta">
                  {s.activated ? "Active" : "Waiting for student to set a password"}
                  {s.subjects?.length > 0 && ` · ${s.subjects.map(subjectName).join(", ")}`}
                </div>
              </div>
              <Link href={`/teacher/students/${s.id}`} className="btn btn-secondary btn-small">
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
