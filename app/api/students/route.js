import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAllClasses } from "@/lib/classes";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can view their students." }, { status: 403 });
  }

  await connectDB();
  const students = await User.find({ role: "student", addedBy: session.id })
    .select("name email passwordHash subjects class pendingClass createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return Response.json({
    students: students.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      activated: !!s.passwordHash,
      subjects: s.subjects || [],
      class: s.class || null,
      pendingClass: s.pendingClass || null,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can add students." }, { status: 403 });
  }

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  if (!teacher || teacher.status !== "approved") {
    return Response.json({ error: "Your teacher account is not approved." }, { status: 403 });
  }

  const { name, email, subjects, class: studentClass } = await request.json();
  if (!name || !email) {
    return Response.json({ error: "Name and email are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const enrolledSubjects = Array.isArray(subjects)
    ? subjects.filter((s) => teacher.subjects?.includes(s))
    : [];

  let approvedClass = null;
  if (studentClass) {
    const classes = await getAllClasses();
    if (!classes.some((c) => c.slug === studentClass)) {
      return Response.json({ error: "Invalid class." }, { status: 400 });
    }
    approvedClass = studentClass;
  }

  const student = await User.create({
    name,
    email: normalizedEmail,
    role: "student",
    addedBy: session.id,
    subjects: enrolledSubjects,
    class: approvedClass,
  });

  return Response.json({
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      subjects: student.subjects,
      class: student.class,
    },
  });
}
