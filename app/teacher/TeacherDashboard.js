"use client";

import { useState } from "react";
import ResourcesPanel from "./ResourcesPanel";
import StudentsPanel from "./StudentsPanel";
import MessagesPanel from "./MessagesPanel";
import AttendancePanel from "./AttendancePanel";

const TABS = [
  { key: "resources", label: "Resources" },
  { key: "students", label: "My Students" },
  { key: "attendance", label: "Attendance" },
  { key: "messages", label: "Messages" },
];

export default function TeacherDashboard({ subjects, userId }) {
  const [activeTab, setActiveTab] = useState("resources");

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <div
            key={t.key}
            className={`tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </div>
        ))}
      </div>

      {activeTab === "resources" && <ResourcesPanel subjects={subjects} userId={userId} />}
      {activeTab === "students" && <StudentsPanel subjects={subjects} />}
      {activeTab === "attendance" && <AttendancePanel subjects={subjects} />}
      {activeTab === "messages" && <MessagesPanel subjects={subjects} />}
    </>
  );
}
