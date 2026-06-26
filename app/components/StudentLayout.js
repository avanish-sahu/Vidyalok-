import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { STUDENT_NAV_LINKS } from "./studentNav";

export default function StudentLayout({ name, active, children }) {
  return (
    <>
      <Topbar name={name} roleLabel="Student" homeHref="/subjects" />
      <div className="app-layout">
        <Sidebar links={STUDENT_NAV_LINKS} active={active} />
        <div className="page">{children}</div>
      </div>
    </>
  );
}
