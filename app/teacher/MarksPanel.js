"use client";

import { useEffect, useState } from "react";
import { attachLiveRefresh } from "@/lib/liveRefresh";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MarksPanel({ subjects, classSlug }) {
  const [activeSubject, setActiveSubject] = useState(subjects[0]?.slug);
  const [testName, setTestName] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [date, setDate] = useState(todayStr());

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { [studentId]: marksObtained }
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  // Load students and potentially their existing marks for this testName
  async function loadStudentsAndMarks() {
    if (!activeSubject) return;
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch(
        `/api/teacher/marks?subject=${activeSubject}&class=${classSlug}&testName=${encodeURIComponent(testName)}`
      );
      const data = await res.json();
      setStudents(data.students || []);
      
      // Prefill marks obtained
      const initialMarks = {};
      data.students?.forEach((s) => {
        initialMarks[s.id] = s.marksObtained;
      });
      setMarks(initialMarks);
      
      // If we looked up a test and got totalMarks/date, set them
      if (data.totalMarks) {
        setTotalMarks(data.totalMarks);
      }
      if (data.date) {
        setDate(data.date);
      }
    } catch (err) {
      setSubmitError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissions() {
    if (!activeSubject) return;
    setSubmissionsLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/marks/submissions?subject=${activeSubject}&class=${classSlug}`
      );
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } finally {
      setSubmissionsLoading(false);
    }
  }

  // Load submissions and students when active tab / class changes
  useEffect(() => {
    loadStudentsAndMarks();
    loadSubmissions();
    setPdfUrl(null);
    setSubmitError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject, classSlug]);

  // Load when testName input changes (debounce or on blur/submit lookup)
  // Let's do a manual lookup button or lookup on blur of testName to load existing marks
  function handleTestNameBlur() {
    if (testName.trim()) {
      loadStudentsAndMarks();
    }
  }

  const existingSubmission = submissions.find(
    (s) => s.testName.toLowerCase() === testName.trim().toLowerCase()
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!testName.trim()) {
      setSubmitError("Test Name is required.");
      return;
    }
    if (!totalMarks || Number(totalMarks) <= 0) {
      setSubmitError("Total Marks must be greater than 0.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setPdfUrl(null);

    try {
      const res = await fetch("/api/teacher/marks/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject,
          class: classSlug,
          testName: testName.trim(),
          date,
          totalMarks: Number(totalMarks),
          marks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Could not submit marks.");
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

  function handleMarkChange(studentId, val) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: val,
    }));
  }

  function whatsappShareUrl() {
    const absoluteUrl = `${window.location.origin}${pdfUrl}`;
    const text = `Test Marks Report - ${testName} (${activeSubject})\n${absoluteUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  async function handleShare() {
    try {
      const absoluteUrl = `${window.location.origin}${pdfUrl}`;
      const response = await fetch(absoluteUrl);
      const blob = await response.blob();
      const file = new File([blob], `marks-report-${testName}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Test Marks Report",
          text: `Test Marks Report - ${testName} (${activeSubject})`,
        });
        return;
      }
    } catch {
      // fallback
    }
    window.open(whatsappShareUrl(), "_blank");
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

      <div className="card-block" style={{ marginBottom: 20 }}>
        <h3>Test Configuration</h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: 12 }}>
          <div className="field" style={{ flex: "1 1 200px" }}>
            <label htmlFor="test-name">Test Name</label>
            <input
              id="test-name"
              type="text"
              placeholder="e.g. Unit Test 1, Midterm"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              onBlur={handleTestNameBlur}
            />
          </div>
          <div className="field" style={{ flex: "1 1 120px" }}>
            <label htmlFor="total-marks">Total Marks</label>
            <input
              id="total-marks"
              type="number"
              placeholder="e.g. 50, 100"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: "1 1 150px" }}>
            <label htmlFor="test-date">Date</label>
            <input
              id="test-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        {testName.trim() && (
          <button className="btn btn-secondary btn-small" style={{ marginTop: 8 }} onClick={loadStudentsAndMarks}>
            Load/Lookup Test
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : students.length === 0 ? (
        <div className="empty-state">No students are enrolled in this subject and class yet.</div>
      ) : (
        <>
          <div className="resource-list">
            {students.map((s) => (
              <div className="resource-item" key={s.id} style={{ alignItems: "center" }}>
                <div>
                  <h4>{s.name}</h4>
                  <p>{s.email}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    style={{
                      width: "80px",
                      padding: "6px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      textAlign: "center"
                    }}
                    placeholder="Marks"
                    value={marks[s.id] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                        handleMarkChange(s.id, val);
                      }
                    }}
                  />
                  <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                    / {totalMarks || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="card-block" style={{ marginTop: 16 }}>
            {existingSubmission && !pdfUrl && (
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
                Already submitted marks for this test on {new Date(existingSubmission.submittedAt).toLocaleString()}
                {" "}(Class Average: {existingSubmission.averageMarks}/{existingSubmission.totalMarks}). 
                Submitting again will update the scores and regenerate the PDF.
              </p>
            )}
            {submitError && <div className="error-banner">{submitError}</div>}
            
            <button className="btn" onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Submitting Marks..."
                : existingSubmission
                ? "Update Marks Report"
                : "Submit Marks Report"}
            </button>

            {pdfUrl && (
              <div
                className="error-banner"
                style={{ background: "#eef1fb", color: "var(--primary-dark)", borderColor: "var(--border)", marginTop: 16 }}
              >
                Marks submitted successfully! Your PDF report is ready.
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
            <h3>Submitted Marks History</h3>
            {submissionsLoading ? (
              <p>Loading history...</p>
            ) : submissions.length === 0 ? (
              <div className="empty-state">No marks reports have been submitted for this subject yet.</div>
            ) : (
              <div className="resource-list">
                {submissions.map((sub) => (
                  <div className="resource-item" key={sub._id}>
                    <div>
                      <h4>{sub.testName}</h4>
                      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "2px" }}>
                        Date: {new Date(sub.date).toLocaleDateString()} · Class Avg: {sub.averageMarks}/{sub.totalMarks}
                      </p>
                    </div>
                    <div className="resource-actions">
                      <a
                        className="btn btn-secondary btn-small"
                        href={sub.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
