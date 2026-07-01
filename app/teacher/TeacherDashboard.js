"use client";

import { useState } from "react";
import ResourcesPanel from "./ResourcesPanel";
import StudentsPanel from "./StudentsPanel";
import MessagesPanel from "./MessagesPanel";
import AttendancePanel from "./AttendancePanel";
import MarksPanel from "./MarksPanel";

export default function TeacherDashboard({ subjects, classes, classSlug, userId }) {
  const isGeneral = classSlug === "general";
  const TABS = [
    { key: "resources", label: "Resources" },
    ...(isGeneral ? [] : [{ key: "students", label: "My Students" }]),
    ...(isGeneral ? [] : [{ key: "attendance", label: "Attendance" }]),
    ...(isGeneral ? [] : [{ key: "marks", label: "Marks" }]),
    { key: "messages", label: "Messages" },
  ];

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

      {activeTab === "resources" && (
        <ResourcesPanel subjects={subjects} classSlug={classSlug} userId={userId} />
      )}
      {activeTab === "students" && !isGeneral && (
        <StudentsPanel subjects={subjects} classes={classes} classSlug={classSlug} />
      )}
      {activeTab === "attendance" && !isGeneral && (
        <AttendancePanel subjects={subjects} classSlug={classSlug} />
      )}
      {activeTab === "marks" && !isGeneral && (
        <MarksPanel subjects={subjects} classSlug={classSlug} />
      )}
      {activeTab === "messages" && <MessagesPanel subjects={subjects} classSlug={classSlug} />}
    </>
  );
}
