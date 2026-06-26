import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getAllSubjects } from "@/lib/subjects";
import { subjectEmoji } from "@/lib/subjectEmoji";
import StudentLayout from "@/app/components/StudentLayout";

export default async function AttendancePage() {
  const session = await getSession();
  const subjects = await getAllSubjects();

  return (
    <StudentLayout name={session.name} active="attendance">
      <h1>Attendance</h1>
      <p style={{ color: "var(--muted)" }}>Pick a subject to see its attendance record.</p>
      <div className="subjects-grid">
        {subjects.map((s) => (
          <Link key={s.slug} href={`/attendance/${s.slug}`} className="subject-card">
            <span className="emoji">{subjectEmoji(s.slug)}</span>
            <h3>{s.name}</h3>
          </Link>
        ))}
      </div>
    </StudentLayout>
  );
}
