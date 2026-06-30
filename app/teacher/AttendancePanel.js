"use client";

import { useEffect, useState } from "react";
import { attachLiveRefresh } from "@/lib/liveRefresh";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePanel({ subjects, classSlug }) {
  const [activeSubject, setActiveSubject] = useState(subjects[0]?.slug);
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  async function load(silent) {
    if (!activeSubject) return;
    if (silent && savingId) return; // don't clobber an in-flight mark action
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/attendance?subject=${activeSubject}&date=${date}&class=${classSlug}`
      );
      const data = await res.json();
      setStudents(data.students || []);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadSubmissions() {
    if (!activeSubject) return;
    setSubmissionsLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/attendance/submissions?subject=${activeSubject}&class=${classSlug}`
      );
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } finally {
      setSubmissionsLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadSubmissions();
    setPdfUrl(null);
    setSubmitError("");
    const id = setInterval(() => load(true), 10000);
    const detach = attachLiveRefresh(() => load(true));
    return () => {
      clearInterval(id);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject, classSlug, date]);

  const existingSubmission = submissions.find((s) => s.date.slice(0, 10) === date);

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

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    setPdfUrl(null);
    try {
      const res = await fetch("/api/teacher/attendance/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeSubject, class: classSlug, date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Could not submit attendance.");
        return;
      }
      setPdfUrl(data.pdfUrl);
      loadSubmissions();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function whatsappShareUrl() {
    const absoluteUrl = `${window.location.origin}${pdfUrl}`;
    const text = `Attendance report — ${date}\n${absoluteUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  async function handleShare() {
    // On phones, try the native share sheet so the actual PDF file gets
    // attached (WhatsApp included). Desktop browsers don't support sharing
    // files this way, so fall back to a WhatsApp link with the URL instead.
    try {
      const absoluteUrl = `${window.location.origin}${pdfUrl}`;
      const response = await fetch(absoluteUrl);
      const blob = await response.blob();
      const file = new File([blob], "attendance-report.pdf", { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Attendance Report", text: `Attendance report — ${date}` });
        return;
      }
    } catch {
      // ignore and fall back to the link below
    }
    window.open(whatsappShareUrl(), "_blank");
  }

  if (subjects.length === 0) {
    return <p>You don&apos;t have any subjects assigned yet.</p>;
  }

  const unmarkedCount = students.filter((s) => s.present === null).length;

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
        <div className="empty-state">No students are enrolled in this subject and class yet.</div>
      ) : (
        <>
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

          <div className="card-block" style={{ marginTop: 16 }}>
            {unmarkedCount > 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
                {unmarkedCount} student{unmarkedCount === 1 ? "" : "s"} not marked yet — they&apos;ll show
                as &quot;Not marked&quot; on the report if you submit now.
              </p>
            )}
            {existingSubmission && !pdfUrl && (
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
                Already submitted on {new Date(existingSubmission.submittedAt).toLocaleString()}
                {" "}({existingSubmission.presentCount}/{existingSubmission.totalCount} present). Submitting
                again will update that report with the latest marks — it won&apos;t create a new one.
              </p>
            )}
            {submitError && <div className="error-banner">{submitError}</div>}
            <button className="btn" onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Submitting..."
                : existingSubmission
                ? "Update Attendance Report"
                : "Submit Attendance"}
            </button>

            {pdfUrl && (
              <div
                className="error-banner"
                style={{ background: "#eef1fb", color: "var(--primary-dark)", borderColor: "var(--border)", marginTop: 16 }}
              >
                Attendance submitted! Your report is ready.
                <div className="resource-actions" style={{ marginTop: 8 }}>
                  <a className="btn btn-secondary btn-small" href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    Download PDF
                  </a>
                  <button className="btn btn-small" onClick={handleShare}>
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card-block" style={{ marginTop: 16 }}>
            <h3>Submitted Attendance History</h3>
            {submissionsLoading ? (
              <p>Loading...</p>
            ) : submissions.length === 0 ? (
              <div className="empty-state">No attendance has been submitted for this subject and class yet.</div>
            ) : (
              <div className="resource-list">
                {submissions.map((sub) => (
                  <div className="resource-item" key={sub._id}>
                    <div>
                      <h4>{new Date(sub.date).toLocaleDateString()}</h4>
                      <p>
                        {sub.presentCount}/{sub.totalCount} present · Submitted{" "}
                        {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="resource-actions">
                      <a className="btn btn-secondary btn-small" href={sub.pdfUrl} target="_blank" rel="noopener noreferrer">
                        Download PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
