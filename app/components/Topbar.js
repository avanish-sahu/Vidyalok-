import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Topbar({ name, roleLabel, classLabel, homeHref }) {
  return (
    <div className="topbar">
      <Link href={homeHref} className="brand">
        TutorHub
      </Link>
      <nav>
        <span>
          {name} · {roleLabel}
          {classLabel && (
            <>
              {" "}
              ·{" "}
              <Link href="/select-class" className="badge badge-success">
                {classLabel}
              </Link>
            </>
          )}
        </span>
        <LogoutButton />
      </nav>
    </div>
  );
}
