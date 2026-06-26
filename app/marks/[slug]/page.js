import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import { getMarksBySubject } from "@/lib/performance";
import StudentLayout from "@/app/components/StudentLayout";
import BackLink from "@/app/components/BackLink";

export default async function MarksDetailPage({ params }) {
  const { slug } = await params;
  const session = await getSession();

  await connectDB();
  const subject = await Subject.findOne({ slug }).lean();
  if (!subject) notFound();

  const bySubject = await getMarksBySubject(session.id);
  const data = bySubject[slug] || { tests: [], averagePercent: 0 };

  return (
    <StudentLayout name={session.name} active="marks">
      <BackLink href="/marks" label="Marks" />
      <h1>{subject.name} — Marks</h1>
      {data.tests.length === 0 ? (
        <div className="empty-state">No test marks have been added yet for this subject.</div>
      ) : (
        <div className="card-block">
          <div className="section-title">
            <h3>Overall</h3>
            <span className="badge badge-info">Average: {data.averagePercent}%</span>
          </div>
          <div className="resource-list">
            {data.tests
              .slice()
              .reverse()
              .map((t) => {
                const percent = Math.round((t.marksObtained / t.totalMarks) * 100);
                return (
                  <div className="resource-item" key={t._id}>
                    <div style={{ flex: 1 }}>
                      <h4>{t.testName}</h4>
                      <div className="resource-meta">
                        {new Date(t.date).toLocaleDateString()} · {t.marksObtained}/{t.totalMarks} ({percent}%)
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
