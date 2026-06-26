"use client";

import { useState } from "react";
import Link from "next/link";

export default function Sidebar({ links, active }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        &#8942;
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`sidebar-link ${active === link.key ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </aside>
    </>
  );
}
