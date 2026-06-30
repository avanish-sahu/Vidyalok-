import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAllClasses } from "@/lib/classes";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import AutoRefresh from "./AutoRefresh";
import { STUDENT_NAV_LINKS } from "./studentNav";

export default async function StudentLayout({ name, active, children }) {
  const session = await getSession();

  let classLabel = null;
  if (session?.role === "student") {
    await connectDB();
    const student = await User.findById(session.id).select("class pendingClass").lean();

    // A student must pick a class before they can use any other section.
    if (!student?.class && !student?.pendingClass) {
      redirect("/select-class");
    }

    if (student?.class) {
      const classes = await getAllClasses();
      classLabel = classes.find((c) => c.slug === student.class)?.name || student.class;
    }
  }

  return (
    <>
      <AutoRefresh />
      <Topbar name={name} roleLabel="Student" classLabel={classLabel} homeHref="/subjects" />
      <div className="app-layout">
        <Sidebar links={STUDENT_NAV_LINKS} active={active} />
        <div className="page">{children}</div>
      </div>
    </>
  );
}
