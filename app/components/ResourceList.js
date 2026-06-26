export default function ResourceList({ resources, emptyLabel }) {
  if (!resources || resources.length === 0) {
    return <div className="empty-state">{emptyLabel || "Nothing here yet."}</div>;
  }

  return (
    <div className="resource-list">
      {resources.map((r) => (
        <div className="resource-item" key={r.id}>
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
            <a className="btn btn-secondary btn-small" href={r.fileUrl} download={r.originalName || true}>
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
