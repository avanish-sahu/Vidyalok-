import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/studentAccess";
import { getAttendanceBySubject } from "@/lib/performance";
import Attendance from "@/models/Attendance";
import User from "@/models/User";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const bySubject = await getAttendanceBySubject(id);

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  if (subject) {
    return Response.json({ attendance: bySubject[subject] || { records: [], presentCount: 0, totalCount: 0, percentage: 0 } });
  }
  return Response.json({ attendance: bySubject });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Only the student's teacher can mark attendance." }, { status: 403 });
  }

  const { subject, date, present } = await request.json();
  if (!subject || !date || typeof present !== "boolean") {
    return Response.json({ error: "subject, date and present are required." }, { status: 400 });
  }

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  if (!teacher.subjects?.includes(subject)) {
    return Response.json({ error: "You are not assigned to this subject." }, { status: 403 });
  }
  if (!access.student.subjects?.includes(subject)) {
    return Response.json({ error: "This student isn't enrolled in that subject." }, { status: 400 });
  }

  const record = await Attendance.findOneAndUpdate(
    { student: id, subject, date: new Date(date) },
    { student: id, subject, date: new Date(date), present, markedBy: session.id },
    { upsert: true, returnDocument: "after" }
  );

  return Response.json({ record });
}
