import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/studentAccess";
import { getMarksBySubject } from "@/lib/performance";
import Mark from "@/models/Mark";
import User from "@/models/User";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const bySubject = await getMarksBySubject(id);

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  if (subject) {
    return Response.json({ marks: bySubject[subject] || { tests: [], averagePercent: 0 } });
  }
  return Response.json({ marks: bySubject });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Only the student's teacher can add marks." }, { status: 403 });
  }

  const { subject, testName, date, marksObtained, totalMarks } = await request.json();
  if (!subject || !testName || !date || marksObtained == null || !totalMarks) {
    return Response.json({ error: "subject, testName, date, marksObtained and totalMarks are required." }, { status: 400 });
  }
  if (Number(marksObtained) > Number(totalMarks)) {
    return Response.json({ error: "Marks obtained can't exceed total marks." }, { status: 400 });
  }

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  if (!teacher.subjects?.includes(subject)) {
    return Response.json({ error: "You are not assigned to this subject." }, { status: 403 });
  }
  if (!access.student.subjects?.includes(subject)) {
    return Response.json({ error: "This student isn't enrolled in that subject." }, { status: 400 });
  }

  const mark = await Mark.create({
    student: id,
    subject,
    testName,
    date: new Date(date),
    marksObtained: Number(marksObtained),
    totalMarks: Number(totalMarks),
    addedBy: session.id,
  });

  return Response.json({ mark });
}
