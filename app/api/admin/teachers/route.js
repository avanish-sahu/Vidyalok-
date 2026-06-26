import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  await connectDB();
  const teachers = await User.find({ role: "teacher" })
    .select("name email status subjects createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return Response.json({ teachers });
}
