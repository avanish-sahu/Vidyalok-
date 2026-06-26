import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/studentAccess";
import { getNotesBySubject } from "@/lib/performance";
import PerformanceNote from "@/models/PerformanceNote";
import User from "@/models/User";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const bySubject = await getNotesBySubject(id);

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  if (subject) {
    return Response.json({ note: bySubject[subject] || "" });
  }
  return Response.json({ notes: bySubject });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Only the student's teacher can write feedback." }, { status: 403 });
  }

  const { subject, note } = await request.json();
  if (!subject) {
    return Response.json({ error: "subject is required." }, { status: 400 });
  }

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  if (!teacher.subjects?.includes(subject)) {
    return Response.json({ error: "You are not assigned to this subject." }, { status: 403 });
  }
  if (!access.student.subjects?.includes(subject)) {
    return Response.json({ error: "This student isn't enrolled in that subject." }, { status: 400 });
  }

  await PerformanceNote.findOneAndUpdate(
    { student: id, subject },
    { student: id, subject, note: note || "", updatedBy: session.id },
    { upsert: true }
  );

  return Response.json({ ok: true });
}
