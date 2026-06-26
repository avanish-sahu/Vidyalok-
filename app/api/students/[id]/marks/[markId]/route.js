import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/studentAccess";
import Mark from "@/models/Mark";

export async function DELETE(request, { params }) {
  const { id, markId } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Only the student's teacher can delete marks." }, { status: 403 });
  }

  await connectDB();
  const mark = await Mark.findOne({ _id: markId, student: id });
  if (!mark) {
    return Response.json({ error: "Mark not found." }, { status: 404 });
  }

  await Mark.deleteOne({ _id: markId });
  return Response.json({ ok: true });
}
