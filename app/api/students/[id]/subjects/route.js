import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/studentAccess";
import User from "@/models/User";

export async function PUT(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Only the student's teacher can edit enrollment." }, { status: 403 });
  }

  const { subjects } = await request.json();
  if (!Array.isArray(subjects)) {
    return Response.json({ error: "subjects must be an array." }, { status: 400 });
  }

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  const enrolledSubjects = subjects.filter((s) => teacher.subjects?.includes(s));

  await User.updateOne({ _id: id }, { subjects: enrolledSubjects });

  return Response.json({ subjects: enrolledSubjects });
}
