import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  const { email } = await request.json();
  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (
    process.env.ADMIN_EMAIL &&
    normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase().trim()
  ) {
    return Response.json({ exists: true, needsPassword: false });
  }

  await connectDB();
  const user = await User.findOne({ email: normalizedEmail }).select("passwordHash").lean();

  if (!user) {
    return Response.json({ exists: false });
  }

  return Response.json({ exists: true, needsPassword: !user.passwordHash });
}
