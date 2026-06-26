"use client";

import { useEffect, useState } from "react";

export default function FeeCard({ studentId }) {
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${studentId}/fee`)
      .then((res) => res.json())
      .then((data) => {
        setAmount(data.fee?.amount || 0);
        setPaymentDate(data.fee?.paymentDate ? data.fee.paymentDate.slice(0, 10) : "");
        setValidUntil(data.fee?.validUntil ? data.fee.validUntil.slice(0, 10) : "");
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentDate, validUntil }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save fee details.");
        return;
      }
      setAmount(data.fee.amount);
      setPaymentDate(data.fee.paymentDate ? data.fee.paymentDate.slice(0, 10) : "");
      setValidUntil(data.fee.validUntil ? data.fee.validUntil.slice(0, 10) : "");
      setSaved(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="card-block">
      <h3>Fees</h3>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSave}>
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="payment-date">Payment Date (when it was paid)</label>
          <input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => {
              setPaymentDate(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="valid-until">Valid Until (subscription covers up to)</label>
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
        <button className="btn btn-small" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && (
          <span className="badge badge-success" style={{ marginLeft: 12 }}>
            Saved
          </span>
        )}
      </form>
    </div>
  );
}
