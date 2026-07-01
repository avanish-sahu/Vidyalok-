"use client";

import { useEffect, useState } from "react";

export default function FeeCard({ studentId }) {
  const [totalFee, setTotalFee] = useState(0);
  const [amount, setAmount] = useState(0); // This is total paid calculated
  const [installments, setInstallments] = useState([]);
  const [validUntil, setValidUntil] = useState("");
  
  // New payment input states
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newRemark, setNewRemark] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function loadFeeDetails() {
    fetch(`/api/students/${studentId}/fee`)
      .then((res) => res.json())
      .then((data) => {
        setTotalFee(data.fee?.totalFee || 0);
        setAmount(data.fee?.amount || 0);
        setInstallments(data.fee?.installments || []);
        setValidUntil(data.fee?.validUntil ? data.fee.validUntil.slice(0, 10) : "");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFeeDetails();
  }, [studentId]);

  async function handleUpdateConfig(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalFee, validUntil }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save configurations.");
        return;
      }
      setTotalFee(data.fee.totalFee);
      setValidUntil(data.fee.validUntil ? data.fee.validUntil.slice(0, 10) : "");
      setSaved(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPayment(e) {
    e.preventDefault();
    if (!newAmount || Number(newAmount) <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newInstallment: {
            amountPaid: Number(newAmount),
            paymentDate: newDate,
            remark: newRemark,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add payment.");
        return;
      }
      setAmount(data.fee.amount);
      setInstallments(data.fee.installments || []);
      setNewAmount("");
      setNewRemark("");
      setSaved(true);
    } catch {
      setError("Something went wrong adding payment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteInstallment(id) {
    if (!confirm("Are you sure you want to delete this payment record?")) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteInstallmentId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not delete payment.");
        return;
      }
      setAmount(data.fee.amount);
      setInstallments(data.fee.installments || []);
    } catch {
      setError("Something went wrong deleting payment.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading fees...</p>;

  const remainingFee = Math.max(0, totalFee - amount);

  return (
    <div className="card-block">
      <h3>Fees Summary</h3>
      {error && <div className="error-banner">{error}</div>}
      
      <div style={{ display: "flex", gap: "24px", margin: "16px 0", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Course Fee</span>
          <h2 style={{ margin: 0, color: "var(--primary-dark)" }}>₹{totalFee}</h2>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Total Amount Paid</span>
          <h2 style={{ margin: 0, color: "var(--success)" }}>₹{amount}</h2>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Remaining Balance</span>
          <h2 style={{ margin: 0, color: remainingFee > 0 ? "var(--danger)" : "var(--muted)" }}>₹{remainingFee}</h2>
        </div>
      </div>

      <form onSubmit={handleUpdateConfig} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "20px" }}>
        <h4>Edit Fee Structure</h4>
        <div style={{ display: "flex", gap: "16px", marginTop: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="total-fee">Total Fee (₹)</label>
            <input
              id="total-fee"
              type="number"
              min="0"
              value={totalFee}
              onChange={(e) => {
                setTotalFee(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="valid-until">Access Valid Until</label>
            <input
              id="valid-until"
              type="date"
              value={validUntil}
              onChange={(e) => {
                setValidUntil(e.target.value);
                setSaved(false);
              }}
            />
          </div>
        </div>
        <button className="btn btn-small" type="submit" disabled={saving}>
          Save Configurations
        </button>
        {saved && <span className="badge badge-success" style={{ marginLeft: 12 }}>Saved</span>}
      </form>

      <form onSubmit={handleAddPayment} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "20px" }}>
        <h4>Record New Payment</h4>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: 12 }}>
          <div className="field" style={{ flex: "1 1 120px" }}>
            <label htmlFor="pay-amount">Amount Received (₹)</label>
            <input
              id="pay-amount"
              type="number"
              min="1"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="e.g. 3000"
            />
          </div>
          <div className="field" style={{ flex: "1 1 150px" }}>
            <label htmlFor="pay-date">Payment Date</label>
            <input
              id="pay-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: "2 1 200px" }}>
            <label htmlFor="pay-remark">Remarks / Receipt Info</label>
            <input
              id="pay-remark"
              type="text"
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder="e.g. Cash, GPay, Installment 1"
            />
          </div>
        </div>
        <button className="btn btn-secondary btn-small" type="submit" disabled={saving}>
          Add Payment
        </button>
      </form>

      <div>
        <h4>Payment Installments History</h4>
        {installments.length === 0 ? (
          <p style={{ color: "var(--muted)", fontStyle: "italic", marginTop: 12 }}>No payments recorded yet.</p>
        ) : (
          <div className="resource-list" style={{ marginTop: 12 }}>
            {installments.slice().reverse().map((inst) => (
              <div className="resource-item" key={inst._id}>
                <div>
                  <h4>₹{inst.amountPaid}</h4>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                    Paid on: {new Date(inst.paymentDate).toLocaleDateString()} {inst.remark ? `· ${inst.remark}` : ""}
                  </p>
                </div>
                <button
                  className="btn btn-danger btn-small"
                  type="button"
                  style={{ padding: "4px 8px" }}
                  onClick={() => handleDeleteInstallment(inst._id)}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
