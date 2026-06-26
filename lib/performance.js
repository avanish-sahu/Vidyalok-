import Attendance from "@/models/Attendance";
import Mark from "@/models/Mark";
import PerformanceNote from "@/models/PerformanceNote";
import Fee from "@/models/Fee";

export async function getAttendanceBySubject(studentId) {
  const records = await Attendance.find({ student: studentId }).sort({ date: 1 }).lean();
  const bySubject = {};
  for (const r of records) {
    bySubject[r.subject] ??= { records: [], presentCount: 0, totalCount: 0 };
    bySubject[r.subject].records.push(r);
    bySubject[r.subject].totalCount += 1;
    if (r.present) bySubject[r.subject].presentCount += 1;
  }
  for (const s of Object.values(bySubject)) {
    s.percentage = s.totalCount ? Math.round((s.presentCount / s.totalCount) * 100) : 0;
  }
  return bySubject;
}

export async function getMarksBySubject(studentId) {
  const records = await Mark.find({ student: studentId }).sort({ date: 1 }).lean();
  const bySubject = {};
  for (const r of records) {
    bySubject[r.subject] ??= { tests: [] };
    bySubject[r.subject].tests.push(r);
  }
  for (const s of Object.values(bySubject)) {
    const percents = s.tests.map((t) => (t.marksObtained / t.totalMarks) * 100);
    s.averagePercent = percents.length
      ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
      : 0;
  }
  return bySubject;
}

export async function getNotesBySubject(studentId) {
  const notes = await PerformanceNote.find({ student: studentId }).lean();
  const bySubject = {};
  for (const n of notes) bySubject[n.subject] = n.note;
  return bySubject;
}

export async function getFee(studentId) {
  return Fee.findOne({ student: studentId }).lean();
}
