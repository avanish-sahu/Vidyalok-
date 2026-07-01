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

  if (existing) {
    // If the existing account is a student, we can register them for more subjects
    // even if added by a different teacher. We add the new teacher to their addedBy list.
    if (existing.role === "student") {
      let addedByArray = [];
      if (existing.addedBy) {
        if (Array.isArray(existing.addedBy)) {
          addedByArray = existing.addedBy.map((id) => id.toString());
        } else {
          addedByArray = [existing.addedBy.toString()];
        }
      }
      if (!addedByArray.includes(session.id)) {
        addedByArray.push(session.id);
      }
      existing.addedBy = addedByArray;

      const currentSubjects = existing.subjects || [];
      const merged = [...new Set([...currentSubjects, ...enrolledSubjects])];
      existing.subjects = merged;

      if (approvedClass) {
        existing.class = approvedClass;
      }
      await existing.save();

      return Response.json({
        student: {
          id: existing._id,
          name: existing.name,
          email: existing.email,
          subjects: existing.subjects,
          class: existing.class,
        },
      });
    }

    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const student = await User.create({
    name,
    email: normalizedEmail,
    role: "student",
    addedBy: [session.id],
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
