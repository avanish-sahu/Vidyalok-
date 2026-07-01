"use client";

import { useEffect, useState } from "react";
import { attachLiveRefresh } from "@/lib/liveRefresh";

const TYPES = [
  { key: "notes", label: "Notes" },
  { key: "dpp", label: "Daily Practice Problems" },
  { key: "lecture", label: "Lectures" },
  { key: "testseries", label: "Test Series" },
];

export default function ResourcesPanel({ subjects, classSlug, userId }) {
  const [activeSubject, setActiveSubject] = useState(subjects[0].slug);
  const [activeType, setActiveType] = useState("notes");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [lectureFormat, setLectureFormat] = useState("link"); // "link" or "file"
  const [videoUrl, setVideoUrl] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadResources(silent) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/resources?subject=${activeSubject}&type=${activeType}&class=${classSlug}`
      );
      const data = await res.json();
      setResources(data.resources || []);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    setError("");
    setTitle("");
    setDescription("");
    setFile(null);
    setVideoUrl("");
    setLectureFormat("link");
  }, [activeType]);

  useEffect(() => {
    loadResources();
    const id = setInterval(() => loadResources(true), 10000);
    const detach = attachLiveRefresh(() => loadResources(true));
    return () => {
      clearInterval(id);
      detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject, classSlug, activeType]);

  async function handleUpload(e) {
    e.preventDefault();
    if (activeType === "lecture" && lectureFormat === "link" && !videoUrl) {
      setError("Please enter a video URL.");
      return;
    }
    if ((activeType !== "lecture" || lectureFormat === "file") && !file) {
      setError("Please choose a file to upload.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("subject", activeSubject);
      formData.append("class", classSlug);
      formData.append("type", activeType);
      formData.append("title", title);
      formData.append("description", description);
      if (activeType === "lecture" && lectureFormat === "link") {
        formData.append("videoUrl", videoUrl);
      } else {
        formData.append("file", file);
      }

      const res = await fetch("/api/resources", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      setTitle("");
      setDescription("");
      setFile(null);
      setVideoUrl("");
      e.target.reset();
      loadResources();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this resource?")) return;
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    loadResources();
  }

  function startEdit(r) {
    setEditingId(r._id);
    setEditTitle(r.title);
    setEditDescription(r.description || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleEditSave(id) {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      if (res.ok) {
        setEditingId(null);
        loadResources();
      }
    } finally {
      setSavingEdit(false);
    }
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

      <div className="tabs">
        {TYPES.map((t) => (
          <div
            key={t.key}
            className={`tab ${activeType === t.key ? "active" : ""}`}
            onClick={() => setActiveType(t.key)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="card-block">
        <h3>Upload {TYPES.find((t) => t.key === activeType).label}</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleUpload}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {activeType === "lecture" && (
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Lecture Format</label>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "normal", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="lectureFormat"
                    checked={lectureFormat === "link"}
                    onChange={() => setLectureFormat("link")}
                  />
                  Video Link (YouTube, Drive, etc.)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "normal", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="lectureFormat"
                    checked={lectureFormat === "file"}
                    onChange={() => setLectureFormat("file")}
                  />
                  Upload Video File (Max 4.5MB)
                </label>
              </div>
            </div>
          )}

          {activeType === "lecture" && lectureFormat === "link" ? (
            <div className="field">
              <label htmlFor="videoUrl">Video URL</label>
              <input
                id="videoUrl"
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="file">{activeType === "lecture" ? "Video File" : "File"}</label>
              <input
                id="file"
                type="file"
                required
                accept={activeType === "lecture" ? "video/*,.pdf" : undefined}
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          )}
          <button className="btn" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      <div className="section-title">
        <h3>Uploaded {TYPES.find((t) => t.key === activeType).label}</h3>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : resources.length === 0 ? (
        <div className="empty-state">Nothing uploaded yet for this subject and class.</div>
      ) : (
        <div className="resource-list">
          {resources.map((r) =>
            editingId === r._id ? (
              <div className="resource-item" key={r._id} style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div className="field">
                  <label>Title</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="resource-actions">
                  <button
                    className="btn btn-small"
                    disabled={savingEdit}
                    onClick={() => handleEditSave(r._id)}
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="resource-item" key={r._id}>
                <div>
                  <h4>{r.title}</h4>
                  {r.description && <p>{r.description}</p>}
                  <div className="resource-meta">
                    By {r.uploadedByName} · {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="resource-actions">
                  <a className="btn btn-secondary btn-small" href={r.fileUrl} target="_blank" rel="noopener noreferrer">
                    Open
                  </a>
                  {r.uploadedBy === userId && (
                    <>
                      <button className="btn btn-secondary btn-small" onClick={() => startEdit(r)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDelete(r._id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}
