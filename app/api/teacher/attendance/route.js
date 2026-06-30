import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Attendance from "@/models/Attendance";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can view this." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const date = searchParams.get("date");
  const classParam = searchParams.get("class");
  if (!subject || !date) {
    return Response.json({ error: "subject and date are required." }, { status: 400 });
  }

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  if (!teacher.subjects?.includes(subject)) {
    return Response.json({ error: "You are not assigned to this subject." }, { status: 403 });
  }

  const studentFilter = { role: "student", addedBy: session.id, subjects: subject };
  if (classParam && classParam !== "all") {
    studentFilter.class = classParam;
  }

  const students = await User.find(studentFilter)
    .select("name email")
    .sort({ name: 1 })
    .lean();

  const records = await Attendance.find({
    subject,
    date: new Date(date),
    student: { $in: students.map((s) => s._id) },
  }).lean();
  const presentByStudent = Object.fromEntries(records.map((r) => [r.student.toString(), r.present]));

  return Response.json({
    students: students.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      present: presentByStudent[s._id.toString()] ?? null,
    })),
  });
}
