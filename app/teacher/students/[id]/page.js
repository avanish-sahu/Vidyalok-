import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import { getAllClasses } from "@/lib/classes";
import Topbar from "@/app/components/Topbar";
import BackLink from "@/app/components/BackLink";
import StudentDetailManager from "./StudentDetailManager";

export default async function TeacherStudentDetailPage({ params }) {
  const { id } = await params;
  const session = await getSession();

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  const student = await User.findOne({ _id: id, role: "student" }).lean();

  if (!student || student.addedBy?.toString() !== session.id) {
    notFound();
  }

  const teacherSubjectDocs = await Subject.find({ slug: { $in: teacher.subjects || [] } })
    .sort({ name: 1 })
    .lean();
  const allSubjects = teacherSubjectDocs.map((s) => ({ slug: s.slug, name: s.name }));
  const enrolledSlugs = (student.subjects || []).filter((s) => teacher.subjects?.includes(s));
  const allClasses = await getAllClasses();
  const studentClassName = student.class
    ? allClasses.find((c) => c.slug === student.class)?.name || student.class
    : "Class not set";

  return (
    <>
      <Topbar name={session.name} roleLabel="Teacher" homeHref="/teacher" />
      <div className="page">
        <BackLink href="/teacher" label="Teacher Dashboard" />
        <h1>{student.name}</h1>
        <p style={{ color: "var(--muted)", marginTop: -8 }}>
          {student.email} · {studentClassName}
        </p>
        <StudentDetailManager
          studentId={id}
          allSubjects={allSubjects}
          initialEnrolledSlugs={enrolledSlugs}
        />
      </div>
    </>
  );
}
