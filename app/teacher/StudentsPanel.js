"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { attachLiveRefresh } from "@/lib/liveRefresh";

export default function StudentsPanel({ subjects, classes, classSlug }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState("");

  async function loadStudents(silent) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      const inThisClass = (data.students || []).filter(
        (s) => s.class === classSlug || s.pendingClass === classSlug
      );
      setStudents(inThisClass);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
    const id = setInterval(() => loadStudents(true), 10000);
    const detach = attachLiveRefresh(() => loadStudents(true));
    return () => {
      clearInterval(id);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSlug]);

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
        body: JSON.stringify({ name, email, subjects: selectedSubjects, class: classSlug }),
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

  function className(slug) {
    return classes.find((c) => c.slug === slug)?.name || slug;
  }

  async function handleClassAction(studentId, action) {
    await fetch(`/api/students/${studentId}/class`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    loadStudents();
  }

  return (
    <>
      <div className="card-block">
        <h3>Add a student to {className(classSlug)}</h3>
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
            {adding ? "Adding..." : `Add to ${className(classSlug)}`}
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
        <h3>
          {className(classSlug)} Students ({students.length})
        </h3>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <div className="empty-state">No students in {className(classSlug)} yet.</div>
      ) : (
        <div className="resource-list">
          {students.map((s) => (
            <div className="resource-item" key={s.id}>
              <div>
                <h4>{s.name}</h4>
                <p>{s.email}</p>
                <div className="resource-meta">
                  {s.activated ? "Active" : "Waiting for student to set a password"}
                  {s.class && s.class !== classSlug && ` · Currently ${className(s.class)}`}
                  {s.subjects?.length > 0 && ` · ${s.subjects.map(subjectName).join(", ")}`}
                </div>
                {s.pendingClass && (
                  <div style={{ marginTop: 8 }}>
                    <span className="badge badge-info">
                      Requested: {className(s.pendingClass)}
                    </span>
                  </div>
                )}
              </div>
              <div className="resource-actions">
                {s.pendingClass && (
                  <>
                    <button
                      className="btn btn-small"
                      onClick={() => handleClassAction(s.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleClassAction(s.id, "reject")}
                    >
                      Reject
                    </button>
                  </>
                )}
                <Link href={`/teacher/students/${s.id}`} className="btn btn-secondary btn-small">
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
