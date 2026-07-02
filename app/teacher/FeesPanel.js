"use client";

import { useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function FeesPanel({ classSlug }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ totalRequired: 0, totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);

  // PDF generation state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);

  // Submissions history
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  // Inline edit state (fee setup)
  const [editingId, setEditingId] = useState(null);
  const [editTotalFee, setEditTotalFee] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Quick payment entry state (separate from edit)
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(todayStr());
  const [payRemark, setPayRemark] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState("");

  // Expanded installments view
  const [expandedId, setExpandedId] = useState(null);

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

  async function loadSubmissions() {
    if (!classSlug) return;
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`/api/teacher/fees/submissions?class=${classSlug}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } finally {
      setSubmissionsLoading(false);
    }
  }

  useEffect(() => {
    loadFees();
    loadSubmissions();
    setPdfUrl(null);
    setSubmitError("");
    setSubmittedAt(null);
    setEditingId(null);
    setPayingId(null);
    setExpandedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSlug]);

  // ─── Set/Update total fee ─────────────────────────────────────────────────
  function startEdit(student) {
    setEditingId(student.id);
    setEditTotalFee(student.totalFee > 0 ? student.totalFee : "");
    setEditError("");
    setPayingId(null);
  }

  async function handleEditSave(studentId) {
    if (!editTotalFee || isNaN(Number(editTotalFee)) || Number(editTotalFee) < 0) {
      setEditError("Please enter a valid fee amount.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalFee: Number(editTotalFee) }),
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

  // ─── Record a new payment ─────────────────────────────────────────────────
  function startPay(student) {
    setPayingId(student.id);
    setPayAmount("");
    setPayDate(todayStr());
    setPayRemark("");
    setPayError("");
    setEditingId(null);
  }

  async function handlePaySave(studentId) {
    const amt = Number(payAmount);
    if (!payAmount || isNaN(amt) || amt <= 0) {
      setPayError("Please enter a valid amount greater than 0.");
      return;
    }
    setPaySaving(true);
    setPayError("");
    try {
      const res = await fetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newInstallment: {
            amountPaid: amt,
            paymentDate: payDate,
            remark: payRemark,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || "Could not save payment.");
        return;
      }
      setPayingId(null);
      setExpandedId(studentId); // auto-expand to show new installment
      await loadFees();
    } catch {
      setPayError("Something went wrong. Please try again.");
    } finally {
      setPaySaving(false);
    }
  }

  // ─── Generate / Share PDF ─────────────────────────────────────────────────
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
      loadSubmissions();
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
        <div className="card-block" style={{ flex: "1 1 160px", padding: "16px", margin: 0, textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Fees Required</span>
          <h2 style={{ margin: "6px 0 0 0", color: "var(--primary-dark)" }}>₹{summary.totalRequired}</h2>
        </div>
        <div className="card-block" style={{ flex: "1 1 160px", padding: "16px", margin: 0, textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Collected</span>
          <h2 style={{ margin: "6px 0 0 0", color: "var(--success)" }}>₹{summary.totalPaid}</h2>
        </div>
        <div className="card-block" style={{ flex: "1 1 160px", padding: "16px", margin: 0, textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Pending</span>
          <h2 style={{ margin: "6px 0 0 0", color: summary.totalPending > 0 ? "var(--danger)" : "var(--muted)" }}>
            ₹{summary.totalPending}
          </h2>
        </div>
      </div>

      {/* Student Fee List */}
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
            {/* Student Summary Row */}
            <div
              className="resource-item"
              style={{ margin: 0, border: "none", borderRadius: 0, background: "transparent" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0 }}>{s.name}</h4>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0 0" }}>{s.email}</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px" }}>
                  <span style={{ color: "var(--muted)" }}>Fee: </span>
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
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="btn btn-small"
                    style={{ padding: "4px 10px", fontSize: "12px" }}
                    onClick={() => (payingId === s.id ? setPayingId(null) : startPay(s))}
                  >
                    {payingId === s.id ? "Cancel" : "Record Payment"}
                  </button>
                  <button
                    className={`btn btn-small ${editingId === s.id ? "btn-secondary" : "btn-secondary"}`}
                    style={{ padding: "4px 10px", fontSize: "12px" }}
                    onClick={() => (editingId === s.id ? setEditingId(null) : startEdit(s))}
                  >
                    {editingId === s.id ? "Cancel" : "Set Fee"}
                  </button>
                  {(s.installments || []).length > 0 && (
                    <button
                      className="btn btn-small btn-secondary"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    >
                      History ({s.installments.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Record Payment Form */}
            {payingId === s.id && (
              <div
                style={{
                  padding: "14px 20px",
                  background: "#f0f7ff",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 600, color: "var(--primary-dark)" }}>
                  Record a Payment for {s.name}
                </p>
                {payError && (
                  <div className="error-banner" style={{ marginBottom: "10px" }}>
                    {payError}
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div className="field" style={{ flex: "1 1 120px", marginBottom: 0 }}>
                    <label htmlFor={`pay-amt-${s.id}`} style={{ fontSize: "12px" }}>Amount Received (₹)</label>
                    <input
                      id={`pay-amt-${s.id}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 3000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      style={{ padding: "7px 10px" }}
                    />
                  </div>
                  <div className="field" style={{ flex: "1 1 140px", marginBottom: 0 }}>
                    <label htmlFor={`pay-date-${s.id}`} style={{ fontSize: "12px" }}>Payment Date</label>
                    <input
                      id={`pay-date-${s.id}`}
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      style={{ padding: "7px 10px" }}
                    />
                  </div>
                  <div className="field" style={{ flex: "2 1 180px", marginBottom: 0 }}>
                    <label htmlFor={`pay-rem-${s.id}`} style={{ fontSize: "12px" }}>Remark (optional)</label>
                    <input
                      id={`pay-rem-${s.id}`}
                      type="text"
                      placeholder="e.g. Cash, GPay, Installment 1"
                      value={payRemark}
                      onChange={(e) => setPayRemark(e.target.value)}
                      style={{ padding: "7px 10px" }}
                    />
                  </div>
                  <button
                    className="btn btn-small"
                    style={{ alignSelf: "flex-end", padding: "8px 18px" }}
                    onClick={() => handlePaySave(s.id)}
                    disabled={paySaving}
                  >
                    {paySaving ? "Saving..." : "Save Payment"}
                  </button>
                </div>
              </div>
            )}

            {/* Set Total Fee Form */}
            {editingId === s.id && (
              <div
                style={{
                  padding: "14px 20px",
                  background: "#f8f9fa",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 600 }}>
                  Update Total Course Fee for {s.name}
                </p>
                {editError && (
                  <div className="error-banner" style={{ marginBottom: "10px" }}>
                    {editError}
                  </div>
                )}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div className="field" style={{ flex: "1 1 180px", marginBottom: 0 }}>
                    <label htmlFor={`total-fee-${s.id}`} style={{ fontSize: "12px" }}>Total Course Fee (₹)</label>
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
                  <button
                    className="btn btn-small"
                    style={{ alignSelf: "flex-end", padding: "8px 18px" }}
                    onClick={() => handleEditSave(s.id)}
                    disabled={editSaving}
                  >
                    {editSaving ? "Saving..." : "Save Fee"}
                  </button>
                </div>
              </div>
            )}

            {/* Payment History (installments) */}
            {expandedId === s.id && (s.installments || []).length > 0 && (
              <div
                style={{
                  padding: "12px 20px 14px",
                  background: "#fafbfc",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
                  Payment History
                </p>
                {[...s.installments].reverse().map((inst, i) => (
                  <div
                    key={inst._id || i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: i < s.installments.length - 1 ? "1px dashed var(--border)" : "none",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "var(--success)", fontSize: "14px" }}>
                        ₹{inst.amountPaid}
                      </span>
                      {inst.remark && (
                        <span style={{ marginLeft: 8, color: "var(--muted)", fontSize: "12px" }}>
                          — {inst.remark}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      {new Date(inst.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Generate Fees Report PDF */}
      <div className="card-block" style={{ marginTop: 8 }}>
        {submitError && <div className="error-banner">{submitError}</div>}
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>
          Generate a PDF summary of all student fees for this class — download it or share it on WhatsApp.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn" onClick={handleGeneratePdf} disabled={submitting}>
            {submitting ? "Generating..." : "Generate Fees Report PDF"}
          </button>
          <button className="btn btn-secondary" onClick={() => { loadFees(); loadSubmissions(); }} disabled={loading}>
            Refresh
          </button>
        </div>
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

      {/* Fees Submissions History */}
      <div className="card-block" style={{ marginTop: 16 }}>
        <h3>Fees Reports History</h3>
        {submissionsLoading ? (
          <p>Loading history...</p>
        ) : submissions.length === 0 ? (
          <div className="empty-state">No fees reports have been generated for this class yet.</div>
        ) : (
          <div className="resource-list">
            {submissions.map((sub) => (
              <div className="resource-item" key={sub._id}>
                <div>
                  <h4>Fees Report</h4>
                  <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "2px" }}>
                    Generated: {new Date(sub.submittedAt).toLocaleString()} · Collected: ₹{sub.totalPaid} / ₹{sub.totalRequired} · Pending: ₹{sub.totalPending}
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
  );
}
