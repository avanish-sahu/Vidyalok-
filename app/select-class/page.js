import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAllClasses } from "@/lib/classes";
import Topbar from "@/app/components/Topbar";
import AutoRefresh from "@/app/components/AutoRefresh";
import ClassSelector from "@/app/components/ClassSelector";

export default async function SelectClassPage() {
  const session = await getSession();

  await connectDB();
  const [student, classDocs] = await Promise.all([
    User.findById(session.id).select("class pendingClass").lean(),
    getAllClasses(),
  ]);
  const classes = classDocs.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <>
      <AutoRefresh />
      <Topbar name={session.name} roleLabel="Student" homeHref="/select-class" />
      <div className="page" style={{ maxWidth: 640 }}>
        <h1>{student?.class ? "Your Class" : "Select your class"}</h1>
        <p style={{ color: "var(--muted)" }}>
          {student?.class
            ? "Want to switch? Pick a different class below — it needs your teacher's approval before it takes effect."
            : "Pick your class to get started. Your teacher needs to approve it before you can see its content."}
        </p>
        <ClassSelector
          approvedClass={student?.class}
          pendingClass={student?.pendingClass}
          classes={classes}
        />
      </div>
    </>
  );
}
