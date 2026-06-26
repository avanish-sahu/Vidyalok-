"use client";

import { useEffect, useState } from "react";

export default function MessagesPanel({ subjects }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState("all");
  const [subject, setSubject] = useState(subjects[0]?.slug || "");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, subject: audience === "subject" ? subject : undefined, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send message.");
        return;
      }
      setResult(data);
      setText("");
      load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function subjectName(slug) {
    return subjects.find((s) => s.slug === slug)?.name || slug;
  }

  return (
    <>
      <div className="card-block">
        <h3>Send a message</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSend}>
          <div className="field">
            <label>Send to</label>
            <div className="checkbox-row">
              <label className="checkbox-pill">
                <input
                  type="radio"
                  name="audience"
                  checked={audience === "all"}
                  onChange={() => setAudience("all")}
                />
                All my students
              </label>
              <label className="checkbox-pill">
                <input
                  type="radio"
                  name="audience"
                  checked={audience === "subject"}
                  onChange={() => setAudience("subject")}
                />
                Students of one subject
              </label>
            </div>
          </div>

          {audience === "subject" && (
            <div className="field">
              <label htmlFor="message-subject">Subject</label>
              <select id="message-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="message-text">Message</label>
            <textarea
              id="message-text"
              rows={3}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Message"}
          </button>
        </form>
        {result && (
          <div
            className="error-banner"
            style={{ background: "#eef1fb", color: "var(--primary-dark)", borderColor: "var(--border)", marginTop: 16 }}
          >
            Sent to {result.recipientCount} student{result.recipientCount === 1 ? "" : "s"} ·{" "}
            {result.notified} push notification{result.notified === 1 ? "" : "s"} delivered.
          </div>
        )}
      </div>

      <div className="section-title">
        <h3>Sent Messages</h3>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : messages.length === 0 ? (
        <div className="empty-state">You haven&apos;t sent any messages yet.</div>
      ) : (
        <div className="resource-list">
          {messages.map((m) => (
            <div className="resource-item" key={m._id}>
              <div>
                <h4>{m.text}</h4>
                <div className="resource-meta">
                  {m.audience === "all" ? "All students" : `${subjectName(m.subject)} students`} ·{" "}
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
