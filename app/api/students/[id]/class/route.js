import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/studentAccess";
import User from "@/models/User";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Only the student's teacher can approve a class." }, { status: 403 });
  }

  const { action } = await request.json();
  if (!["approve", "reject"].includes(action)) {
    return Response.json({ error: "Invalid action." }, { status: 400 });
  }

  await connectDB();
  const student = await User.findById(id);
  if (!student.pendingClass) {
    return Response.json({ error: "There's no pending class request for this student." }, { status: 400 });
  }

  if (action === "approve") {
    student.class = student.pendingClass;
  }
  student.pendingClass = null;
  await student.save();

  return Response.json({ class: student.class, pendingClass: student.pendingClass });
}
