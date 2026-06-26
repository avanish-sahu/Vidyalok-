import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import { getAttendanceBySubject } from "@/lib/performance";
import StudentLayout from "@/app/components/StudentLayout";
import BackLink from "@/app/components/BackLink";

export default async function AttendanceDetailPage({ params }) {
  const { slug } = await params;
  const session = await getSession();

  await connectDB();
  const subject = await Subject.findOne({ slug }).lean();
  if (!subject) notFound();

  const bySubject = await getAttendanceBySubject(session.id);
  const data = bySubject[slug] || { records: [], percentage: 0 };

  return (
    <StudentLayout name={session.name} active="attendance">
      <BackLink href="/attendance" label="Attendance" />
      <h1>{subject.name} — Attendance</h1>
      {data.records.length === 0 ? (
        <div className="empty-state">No attendance has been recorded yet for this subject.</div>
      ) : (
        <div className="card-block">
          <div className="section-title">
            <h3>Overall</h3>
            <span className={`badge ${data.percentage >= 75 ? "badge-success" : "badge-danger"}`}>
              {data.percentage}% present
            </span>
          </div>
          <div className="resource-list">
            {data.records
              .slice()
              .reverse()
              .map((r) => (
                <div className="resource-item" key={r._id}>
                  <div>{new Date(r.date).toLocaleDateString()}</div>
                  <span className={`badge ${r.present ? "badge-success" : "badge-danger"}`}>
                    {r.present ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
