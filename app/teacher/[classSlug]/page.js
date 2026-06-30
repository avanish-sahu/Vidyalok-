import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import { getAllClasses } from "@/lib/classes";
import Topbar from "@/app/components/Topbar";
import TeacherDashboard from "../TeacherDashboard";

export default async function TeacherClassDashboard({ params }) {
  const { classSlug } = await params;
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
  const classNameBySlug = Object.fromEntries(classes.map((c) => [c.slug, c.name]));
  if (classSlug !== "general" && !classNameBySlug[classSlug]) {
    notFound();
  }
  const className = classSlug === "general" ? "General" : classNameBySlug[classSlug];

  const subjectDocs = await Subject.find({ slug: { $in: user.subjects || [] } })
    .sort({ name: 1 })
    .lean();
  const subjects = subjectDocs.map((s) => ({ slug: s.slug, name: s.name }));

  return (
    <>
      <Topbar name={session.name} roleLabel="Teacher" homeHref="/teacher" />
      <div className="page">
        <div className="section-title">
          <h1 style={{ margin: 0 }}>Managing: {className}</h1>
          <Link href="/teacher" className="btn btn-secondary btn-small">
            Switch Class
          </Link>
        </div>
        {subjects.length === 0 ? (
          <p>You don&apos;t have any subjects assigned yet.</p>
        ) : (
          <TeacherDashboard
            subjects={subjects}
            classes={classes}
            classSlug={classSlug}
            userId={session.id}
          />
        )}
      </div>
    </>
  );
}
