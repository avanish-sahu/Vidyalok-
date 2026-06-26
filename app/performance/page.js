import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getAttendanceBySubject, getMarksBySubject, getNotesBySubject } from "@/lib/performance";
import { getAllSubjects } from "@/lib/subjects";
import StudentLayout from "@/app/components/StudentLayout";

export default async function PerformancePage() {
  const session = await getSession();

  await connectDB();
  const [attendance, marks, notes] = await Promise.all([
    getAttendanceBySubject(session.id),
    getMarksBySubject(session.id),
    getNotesBySubject(session.id),
  ]);
  const subjects = await getAllSubjects();
  const nameBySlug = Object.fromEntries(subjects.map((s) => [s.slug, s.name]));

  const slugs = [...new Set([...Object.keys(attendance), ...Object.keys(marks), ...Object.keys(notes)])];

  return (
    <StudentLayout name={session.name} active="performance">
      <h1>Performance</h1>
      {slugs.length === 0 ? (
        <div className="empty-state">No performance data yet.</div>
      ) : (
        slugs.map((slug) => (
          <div className="card-block" key={slug}>
            <h3>{nameBySlug[slug] || slug}</h3>
            <div className="resource-list" style={{ marginTop: 12 }}>
              <div className="resource-item">
                <div>Attendance</div>
                <span className="badge badge-info">{attendance[slug]?.percentage ?? 0}%</span>
              </div>
              <div className="resource-item">
                <div>Average Marks</div>
                <span className="badge badge-info">{marks[slug]?.averagePercent ?? 0}%</span>
              </div>
            </div>
            {notes[slug] && (
              <div className="error-banner" style={{ background: "#eef1fb", color: "var(--text)", borderColor: "var(--border)", marginTop: 16 }}>
                <strong>Teacher&apos;s note:</strong> {notes[slug]}
              </div>
            )}
          </div>
        ))
      )}
    </StudentLayout>
  );
}
