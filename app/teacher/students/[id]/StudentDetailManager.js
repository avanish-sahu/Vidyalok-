"use client";

import { useState } from "react";
import EnrolledSubjectsCard from "./EnrolledSubjectsCard";
import FeeCard from "./FeeCard";
import MarksPanel from "./MarksPanel";
import NotePanel from "./NotePanel";

const TABS = [
  { key: "fees", label: "Fees" },
  { key: "marks", label: "Marks" },
  { key: "performance", label: "Performance" },
];

export default function StudentDetailManager({ studentId, allSubjects, initialEnrolledSlugs }) {
  const [activeTab, setActiveTab] = useState("fees");
  const [enrolledSlugs, setEnrolledSlugs] = useState(initialEnrolledSlugs);
  const enrolledSubjects = allSubjects.filter((s) => enrolledSlugs.includes(s.slug));
  const [activeSubject, setActiveSubject] = useState(enrolledSubjects[0]?.slug);

  function handleSubjectsSaved(newSlugs) {
    setEnrolledSlugs(newSlugs);
    if (!newSlugs.includes(activeSubject)) {
      setActiveSubject(newSlugs[0]);
    }
  }

  return (
    <>
      <EnrolledSubjectsCard
        studentId={studentId}
        allSubjects={allSubjects}
        initialSubjects={initialEnrolledSlugs}
        onSaved={handleSubjectsSaved}
      />

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

      {activeTab === "fees" && <FeeCard studentId={studentId} />}

      {(activeTab === "marks" || activeTab === "performance") &&
        (enrolledSubjects.length === 0 ? (
          <p>Enroll this student in a subject above to add {activeTab}.</p>
        ) : (
          <>
            <div className="subject-pills">
              {enrolledSubjects.map((s) => (
                <div
                  key={s.slug}
                  className={`subject-pill ${activeSubject === s.slug ? "active" : ""}`}
                  onClick={() => setActiveSubject(s.slug)}
                >
                  {s.name}
                </div>
              ))}
            </div>
            {activeTab === "marks" ? (
              <MarksPanel studentId={studentId} subject={activeSubject} />
            ) : (
              <NotePanel studentId={studentId} subject={activeSubject} />
            )}
          </>
        ))}
    </>
  );
}
