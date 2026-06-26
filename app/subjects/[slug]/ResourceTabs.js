"use client";

import { useState } from "react";
import ResourceList from "@/app/components/ResourceList";

const TABS = [
  { key: "notes", label: "Notes" },
  { key: "dpp", label: "Daily Practice Problems" },
  { key: "lecture", label: "Lectures" },
];

export default function ResourceTabs({ resources }) {
  const [active, setActive] = useState("notes");
  const list = resources[active] || [];

  return (
    <>
      <div className="tabs">
        {TABS.map((tab) => (
          <div
            key={tab.key}
            className={`tab ${active === tab.key ? "active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label} ({resources[tab.key]?.length || 0})
          </div>
        ))}
      </div>

      <ResourceList
        resources={list}
        emptyLabel={`No ${TABS.find((t) => t.key === active).label.toLowerCase()} uploaded yet.`}
      />
    </>
  );
}
