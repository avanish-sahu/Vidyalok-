import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAllClasses } from "@/lib/classes";

export async function PUT(request) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return Response.json({ error: "Only students can set their class." }, { status: 403 });
  }

  const { class: studentClass } = await request.json();

  await connectDB();
  const classes = await getAllClasses();
  if (!classes.some((c) => c.slug === studentClass)) {
    return Response.json({ error: "Invalid class." }, { status: 400 });
  }

  await User.updateOne({ _id: session.id }, { pendingClass: studentClass });

  return Response.json({ pendingClass: studentClass });
}
