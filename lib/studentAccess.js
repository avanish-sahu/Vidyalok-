import { connectDB } from "@/lib/db";
import User from "@/models/User";

// A student can read their own data; the teacher who added them can read+write it.
export async function resolveStudentAccess(session, studentId) {
  if (!session) return { ok: false, status: 401, error: "Not authenticated." };

  await connectDB();
  const student = await User.findById(studentId).lean();
  if (!student || student.role !== "student") {
    return { ok: false, status: 404, error: "Student not found." };
  }

  const isSelf = session.id === studentId;
  const isOwner = session.role === "teacher" && student.addedBy?.toString() === session.id;

  if (!isSelf && !isOwner) {
    return { ok: false, status: 403, error: "Not authorized." };
  }

  return { ok: true, student, isSelf, isOwner };
}
