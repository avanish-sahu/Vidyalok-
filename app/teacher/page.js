import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Topbar from "@/app/components/Topbar";
import TeacherDashboard from "./TeacherDashboard";

export default async function TeacherPage() {
  const session = await getSession();

  await connectDB();
  const User = (await import("@/models/User")).default;
  const user = await User.findById(session.id).lean();

  if (!user || user.status !== "approved") {
    return (
      <>
        <Topbar name={session.name} roleLabel="Teacher" homeHref="/teacher" />
        <div className="page">
          <h1>Teacher Dashboard</h1>
          <p>Your access has been revoked. Contact the admin if you think this is a mistake.</p>
        </div>
      </>
    );
  }

  const subjectDocs = await Subject.find({ slug: { $in: user.subjects || [] } })
    .sort({ name: 1 })
    .lean();
  const subjects = subjectDocs.map((s) => ({ slug: s.slug, name: s.name }));

  return (
    <>
      <Topbar name={session.name} roleLabel="Teacher" homeHref="/teacher" />
      <div className="page">
        <h1>Teacher Dashboard</h1>
        {subjects.length === 0 ? (
          <p>You don&apos;t have any subjects assigned yet.</p>
        ) : (
          <TeacherDashboard subjects={subjects} userId={session.id} />
        )}
      </div>
    </>
  );
}
