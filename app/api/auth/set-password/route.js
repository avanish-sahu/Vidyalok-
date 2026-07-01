import * as bcrypt from "@node-rs/bcrypt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || user.passwordHash) {
    return Response.json({ error: "This account can't set a password this way." }, { status: 400 });
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();

  await setSessionCookie({ id: user._id.toString(), name: user.name, role: user.role });

  return Response.json({ user: { id: user._id, name: user.name, role: user.role } });
}
