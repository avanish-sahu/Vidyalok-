import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Mark from "@/models/Mark";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can view this." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");
  const classParam = searchParams.get("class");
  const testName = searchParams.get("testName");

  if (!subject) {
    return Response.json({ error: "subject is required." }, { status: 400 });
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

  let marksByStudent = {};
  let totalMarks = "";
  let date = "";

  if (testName && testName.trim()) {
    const records = await Mark.find({
      subject,
      testName: testName.trim(),
      student: { $in: students.map((s) => s._id) },
    }).lean();

    marksByStudent = Object.fromEntries(records.map((r) => [r.student.toString(), r.marksObtained]));
    if (records.length > 0) {
      totalMarks = records[0].totalMarks;
      date = records[0].date.toISOString().slice(0, 10);
    }
  }

  return Response.json({
    students: students.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      marksObtained: marksByStudent[s._id.toString()] ?? "",
    })),
    totalMarks,
    date,
  });
}
