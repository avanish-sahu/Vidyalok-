"use client";

import { useEffect, useState } from "react";

export default function FeesPanel({ classSlug }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ totalRequired: 0, totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);

  async function loadFees() {
    if (!classSlug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/fees?class=${classSlug}`);
      const data = await res.json();
      setStudents(data.students || []);
      setSummary(data.summary || { totalRequired: 0, totalPaid: 0, totalPending: 0 });
    } catch {
      setSubmitError("Failed to load fee details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFees();
    setPdfUrl(null);
    setSubmitError("");
    setSubmittedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSlug]);

  async function handleGeneratePdf() {
    setSubmitting(true);
    setSubmitError("");
    setPdfUrl(null);
    try {
      const res = await fetch("/api/teacher/fees/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: classSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Could not generate fees report.");
        return;
      }
      setPdfUrl(data.pdfUrl);
      setSubmittedAt(data.submittedAt);
      if (data.summary) setSummary(data.summary);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    try {
      const absoluteUrl = `${window.location.origin}${pdfUrl}`;
      const response = await fetch(absoluteUrl);
      const blob = await response.blob();
      const file = new File([blob], "fees-report.pdf", { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Class Fees Report", text: "Class fees summary report" });
        return;
      }
    } catch {
      // fallback
    }
    const absoluteUrl = `${window.location.origin}${pdfUrl}`;
    const text = `Class Fees Report\n${absoluteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (loading) return <p>Loading fee details...</p>;

  if (students.length === 0) {
    return <div className="empty-state">No students in this class yet.</div>;
  }

  return (
    <>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div className="card-block" style={{ flex: "1 1 180px", padding: "16px", margin: 0, textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Fees Required</span>
          <h2 style={{ margin: "6px 0 0 0", color: "var(--primary-dark)" }}>₹{summary.totalRequired}</h2>
        </div>
        <div className="card-block" style={{ flex: "1 1 180px", padding: "16px", margin: 0, textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Collected</span>
          <h2 style={{ margin: "6px 0 0 0", color: "var(--success)" }}>₹{summary.totalPaid}</h2>
        </div>
        <div className="card-block" style={{ flex: "1 1 180px", padding: "16px", margin: 0, textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Pending</span>
          <h2 style={{ margin: "6px 0 0 0", color: summary.totalPending > 0 ? "var(--danger)" : "var(--muted)" }}>
            ₹{summary.totalPending}
          </h2>
        </div>
      </div>

      <div className="resource-list" style={{ marginBottom: "24px" }}>
        {students.map((s) => (
          <div className="resource-item" key={s.id}>
            <div style={{ flex: 1 }}>
              <h4>{s.name}</h4>
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>{s.email}</p>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", fontSize: "13px" }}>
              <span>
                <span style={{ color: "var(--muted)" }}>Fee: </span>
                <strong>₹{s.totalFee}</strong>
              </span>
              <span>
                <span style={{ color: "var(--muted)" }}>Paid: </span>
                <strong style={{ color: "var(--success)" }}>₹{s.amountPaid}</strong>
              </span>
              <span>
                <span style={{ color: "var(--muted)" }}>Due: </span>
                <strong style={{ color: s.pending > 0 ? "var(--danger)" : "var(--muted)" }}>₹{s.pending}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card-block" style={{ marginTop: 8 }}>
        {submitError && <div className="error-banner">{submitError}</div>}

        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
          Generate a PDF summary of all student fees for this class — download it or share it on WhatsApp.
        </p>

        <button className="btn" onClick={handleGeneratePdf} disabled={submitting}>
          {submitting ? "Generating..." : "Generate Fees Report PDF"}
        </button>

        <button className="btn btn-secondary" style={{ marginLeft: 12 }} onClick={loadFees} disabled={loading}>
          Refresh
        </button>

        {pdfUrl && (
          <div
            className="error-banner"
            style={{ background: "#eef1fb", color: "var(--primary-dark)", borderColor: "var(--border)", marginTop: 16 }}
          >
            ✅ Fees report generated!{" "}
            {submittedAt && (
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Generated: {new Date(submittedAt).toLocaleString()}
              </span>
            )}
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
    </>
  );
}
