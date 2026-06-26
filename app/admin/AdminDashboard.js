"use client";

import { useEffect, useState } from "react";

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id, action) {
    setActingId(id);
    try {
      await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setActingId(null);
    }
  }

  if (loading) return <p>Loading...</p>;

  const pending = teachers.filter((t) => t.status === "pending");
  const others = teachers.filter((t) => t.status !== "pending");

  return (
    <>
      <div className="section-title">
        <h3>Pending ({pending.length})</h3>
      </div>
      {pending.length === 0 ? (
        <div className="empty-state">No pending teacher applications.</div>
      ) : (
        <div className="resource-list">
          {pending.map((t) => (
            <div className="resource-item" key={t._id}>
              <div>
                <h4>{t.name}</h4>
                <p>{t.email}</p>
                <div className="resource-meta">Subjects: {t.subjects.join(", ") || "none"}</div>
              </div>
              <div className="resource-actions">
                <button
                  className="btn btn-small"
                  disabled={actingId === t._id}
                  onClick={() => act(t._id, "approve")}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger btn-small"
                  disabled={actingId === t._id}
                  onClick={() => act(t._id, "reject")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title" style={{ marginTop: 32 }}>
        <h3>All Teachers</h3>
      </div>
      {others.length === 0 ? (
        <div className="empty-state">No other teacher accounts yet.</div>
      ) : (
        <div className="resource-list">
          {others.map((t) => (
            <div className="resource-item" key={t._id}>
              <div>
                <h4>{t.name}</h4>
                <p>{t.email}</p>
                <div className="resource-meta">
                  Subjects: {t.subjects.join(", ") || "none"} · {STATUS_LABEL[t.status]}
                </div>
              </div>
              <div className="resource-actions">
                {t.status === "approved" ? (
                  <button
                    className="btn btn-danger btn-small"
                    disabled={actingId === t._id}
                    onClick={() => act(t._id, "reject")}
                  >
                    Revoke
                  </button>
                ) : (
                  <button
                    className="btn btn-small"
                    disabled={actingId === t._id}
                    onClick={() => act(t._id, "approve")}
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
