import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json();
  if (!["approve", "reject"].includes(action)) {
    return Response.json({ error: "Invalid action." }, { status: 400 });
  }

  await connectDB();
  const teacher = await User.findOne({ _id: id, role: "teacher" });
  if (!teacher) {
    return Response.json({ error: "Teacher not found." }, { status: 404 });
  }

  teacher.status = action === "approve" ? "approved" : "rejected";
  await teacher.save();

  return Response.json({ teacher: { id: teacher._id, status: teacher.status } });
}
