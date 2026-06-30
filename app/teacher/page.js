import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAllClasses } from "@/lib/classes";
import Topbar from "@/app/components/Topbar";

export default async function TeacherPage() {
  const session = await getSession();

  await connectDB();
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

  const classDocs = await getAllClasses();
  const classes = classDocs.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <>
      <Topbar name={session.name} roleLabel="Teacher" homeHref="/teacher" />
      <div className="page">
        <h1>Which class do you want to manage?</h1>
        <p style={{ color: "var(--muted)" }}>
          Everything you upload, mark, or message after this is scoped to the class you pick —
          choose carefully so content stays separated between classes.
        </p>
        <div className="subjects-grid">
          {classes.map((c) => (
            <Link key={c.slug} href={`/teacher/${c.slug}`} className="subject-card">
              <span className="emoji">🎓</span>
              <h3>{c.name}</h3>
            </Link>
          ))}
          <Link href="/teacher/general" className="subject-card">
            <span className="emoji">📢</span>
            <h3>General</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
              Content for every class
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
