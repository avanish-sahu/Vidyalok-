import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ user: null });

  await connectDB();
  const user = await User.findById(session.id).lean();
  if (!user) return Response.json({ user: null });

  return Response.json({
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      subjects: user.subjects,
    },
  });
}
