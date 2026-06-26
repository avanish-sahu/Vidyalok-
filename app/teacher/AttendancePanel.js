"use client";

import { useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePanel({ subjects }) {
  const [activeSubject, setActiveSubject] = useState(subjects[0]?.slug);
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  async function load() {
    if (!activeSubject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/attendance?subject=${activeSubject}&date=${date}`);
      const data = await res.json();
      setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject, date]);

  async function mark(studentId, present) {
    setSavingId(studentId);
    try {
      await fetch(`/api/students/${studentId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeSubject, date, present }),
      });
      load();
    } finally {
      setSavingId(null);
    }
  }

  if (subjects.length === 0) {
    return <p>You don&apos;t have any subjects assigned yet.</p>;
  }

  return (
    <>
      <div className="subject-pills">
        {subjects.map((s) => (
          <div
            key={s.slug}
            className={`subject-pill ${activeSubject === s.slug ? "active" : ""}`}
            onClick={() => setActiveSubject(s.slug)}
          >
            {s.name}
          </div>
        ))}
      </div>

      <div className="field" style={{ maxWidth: 220 }}>
        <label htmlFor="class-attendance-date">Date</label>
        <input
          id="class-attendance-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : students.length === 0 ? (
        <div className="empty-state">No students are enrolled in this subject yet.</div>
      ) : (
        <div className="resource-list">
          {students.map((s) => (
            <div className="resource-item" key={s.id}>
              <div>
                <h4>{s.name}</h4>
                <p>{s.email}</p>
              </div>
              <div className="resource-actions">
                <button
                  className={`btn btn-small ${s.present === true ? "" : "btn-secondary"}`}
                  disabled={savingId === s.id}
                  onClick={() => mark(s.id, true)}
                >
                  Present
                </button>
                <button
                  className={`btn btn-small ${s.present === false ? "btn-danger" : "btn-secondary"}`}
                  disabled={savingId === s.id}
                  onClick={() => mark(s.id, false)}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
