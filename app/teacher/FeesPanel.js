"use client";

import { useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function FeesPanel({ classSlug }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ totalRequired: 0, totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editTotalFee, setEditTotalFee] = useState("");
  const [editPayAmount, setEditPayAmount] = useState("");
  const [editPayDate, setEditPayDate] = useState(todayStr());
  const [editPayRemark, setEditPayRemark] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

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
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSlug]);

  function startEdit(student) {
    setEditingId(student.id);
    setEditTotalFee(student.totalFee > 0 ? student.totalFee : "");
    setEditPayAmount("");
    setEditPayDate(todayStr());
    setEditPayRemark("");
    setEditError("");
  }

  async function handleEditSave(studentId) {
    setEditSaving(true);
    setEditError("");
    try {
      const body = {};
      if (editTotalFee !== "" && editTotalFee !== null) {
        body.totalFee = Number(editTotalFee);
      }
      if (editPayAmount && Number(editPayAmount) > 0) {
        body.newInstallment = {
          amountPaid: Number(editPayAmount),
          paymentDate: editPayDate,
          remark: editPayRemark,
        };
      }
      if (!body.totalFee && !body.newInstallment) {
        setEditError("Please enter a total fee or a payment amount.");
        setEditSaving(false);
        return;
      }

      const res = await fetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Could not save.");
        return;
      }
      setEditingId(null);
      await loadFees();
    } catch {
      setEditError("Something went wrong. Please try again.");
    } finally {
      setEditSaving(false);
    }
  }

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
    window.open(`https://wa.me/?text=${encodeURIComponent(`Class Fees Report\n${absoluteUrl}`)}`, "_blank");
  }

  if (loading) return <p>Loading fee details...</p>;

  if (students.length === 0) {
    return <div className="empty-state">No students in this class yet.</div>;
  }

  return (
    <>
      {/* Summary Cards */}
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

      {/* Student Fee List with Inline Edit */}
      <div style={{ marginBottom: "24px" }}>
        {students.map((s) => (
          <div
            key={s.id}
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              marginBottom: "12px",
              overflow: "hidden",
            }}
          >
            {/* Student Row */}
            <div
              className="resource-item"
              style={{ margin: 0, border: "none", borderRadius: 0, background: "transparent" }}
            >
              <div style={{ flex: 1 }}>
                <h4>{s.name}</h4>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>{s.email}</p>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px" }}>
                  <span style={{ color: "var(--muted)" }}>Total Fee: </span>
                  <strong>₹{s.totalFee}</strong>
                </span>
                <span style={{ fontSize: "13px" }}>
                  <span style={{ color: "var(--muted)" }}>Paid: </span>
                  <strong style={{ color: "var(--success)" }}>₹{s.amountPaid}</strong>
                </span>
                <span style={{ fontSize: "13px" }}>
                  <span style={{ color: "var(--muted)" }}>Due: </span>
                  <strong style={{ color: s.pending > 0 ? "var(--danger)" : "var(--muted)" }}>₹{s.pending}</strong>
                </span>
                <button
                  className={`btn btn-small ${editingId === s.id ? "btn-secondary" : ""}`}
                  style={{ padding: "4px 12px" }}
                  onClick={() => editingId === s.id ? setEditingId(null) : startEdit(s)}
                >
                  {editingId === s.id ? "Cancel" : "Edit"}
                </button>
              </div>
            </div>

            {/* Inline Edit Form */}
            {editingId === s.id && (
              <div
                style={{
                  padding: "16px 20px",
                  background: "#f8f9fa",
                  borderTop: "1px solid var(--border)",
                }}
              >
                {editError && (
                  <div className="error-banner" style={{ marginBottom: "12px" }}>
                    {editError}
                  </div>
                )}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div className="field" style={{ flex: "1 1 150px", marginBottom: 0 }}>
                    <label htmlFor={`total-fee-${s.id}`} style={{ fontSize: "12px" }}>
                      Total Course Fee (₹)
                    </label>
                    <input
                      id={`total-fee-${s.id}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 20000"
                      value={editTotalFee}
                      onChange={(e) => setEditTotalFee(e.target.value)}
                      style={{ padding: "7px 10px" }}
                    />
                  </div>
                  <div style={{ flex: "0 0 auto", alignSelf: "flex-end", paddingBottom: "2px", color: "var(--muted)", fontSize: "12px" }}>
                    — Record a payment —
                  </div>
                  <div className="field" style={{ flex: "1 1 130px", marginBottom: 0 }}>
                    <label htmlFor={`pay-amt-${s.id}`} style={{ fontSize: "12px" }}>
                      Amount Received (₹)
                    </label>
                    <input
                      id={`pay-amt-${s.id}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 3000"
                      value={editPayAmount}
                      onChange={(e) => setEditPayAmount(e.target.value)}
                      style={{ padding: "7px 10px" }}
                    />
                  </div>
                  <div className="field" style={{ flex: "1 1 140px", marginBottom: 0 }}>
                    <label htmlFor={`pay-date-${s.id}`} style={{ fontSize: "12px" }}>Payment Date</label>
                    <input
                      id={`pay-date-${s.id}`}
                      type="date"
                      value={editPayDate}
                      onChange={(e) => setEditPayDate(e.target.value)}
                      style={{ padding: "7px 10px" }}
                    />
                  </div>
                  <div className="field" style={{ flex: "2 1 180px", marginBottom: 0 }}>
                    <label htmlFor={`pay-rem-${s.id}`} style={{ fontSize: "12px" }}>Remark</label>
                    <input
                      id={`pay-rem-${s.id}`}
                      type="text"
                      placeholder="e.g. Cash, GPay, Installment 1"
                      value={editPayRemark}
                      onChange={(e) => setEditPayRemark(e.target.value)}
                      style={{ padding: "7px 10px" }}
                    />
                  </div>
                  <button
                    className="btn btn-small"
                    style={{ alignSelf: "flex-end", padding: "8px 18px" }}
                    onClick={() => handleEditSave(s.id)}
                    disabled={editSaving}
                  >
                    {editSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Generate PDF */}
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
                {new Date(submittedAt).toLocaleString()}
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
