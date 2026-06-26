import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getAllSubjects } from "@/lib/subjects";
import { subjectEmoji } from "@/lib/subjectEmoji";
import StudentLayout from "@/app/components/StudentLayout";

export default async function SubjectsPage() {
  const session = await getSession();
  const subjects = await getAllSubjects();

  return (
    <StudentLayout name={session.name} active="subjects">
      <h1>Choose a subject</h1>
      <p style={{ color: "var(--muted)" }}>
        Pick a subject to view its notes, daily practice problems and lectures.
      </p>
      <div className="subjects-grid">
        {subjects.map((s) => (
          <Link key={s.slug} href={`/subjects/${s.slug}`} className="subject-card">
            <span className="emoji">{subjectEmoji(s.slug)}</span>
            <h3>{s.name}</h3>
          </Link>
        ))}
      </div>
    </StudentLayout>
  );
}
