import Link from "next/link";

export default function HomePage() {
  return (
    <div className="center-screen">
      <div className="hero">
        <h1>TutorHub</h1>
        <p>Notes, daily practice problems and lectures, organized by subject.</p>
        <div className="role-choices">
          <Link href="/login?role=student" className="role-card">
            <span className="emoji">🎓</span>
            <h3>I&apos;m a Student</h3>
            <p>Access notes, DPPs and lectures for your subjects</p>
          </Link>
          <Link href="/login?role=teacher" className="role-card">
            <span className="emoji">🧑‍🏫</span>
            <h3>I&apos;m a Teacher</h3>
            <p>Upload notes, DPPs and lectures for your students</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
