import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Topbar({ name, roleLabel, homeHref }) {
  return (
    <div className="topbar">
      <Link href={homeHref} className="brand">
        TutorHub
      </Link>
      <nav>
        <span>
          {name} · {roleLabel}
        </span>
        <LogoutButton />
      </nav>
    </div>
  );
}
