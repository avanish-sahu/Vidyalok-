import * as bcrypt from "@node-rs/bcrypt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";

const STATUS_MESSAGES = {
  pending: "Your teacher account is awaiting admin approval.",
  rejected: "Your teacher signup was rejected. Contact the admin for details.",
};

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (
    process.env.ADMIN_EMAIL &&
    normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase().trim()
  ) {
    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await setSessionCookie({ id: "admin", name: "Admin", role: "admin" });
    return Response.json({ user: { id: "admin", name: "Admin", role: "admin", subjects: [] } });
  }

  const t0 = performance.now();
  await connectDB();
  const t1 = performance.now();
  console.log(`[Login Profile] connectDB took ${(t1 - t0).toFixed(2)}ms`);

  const user = await User.findOne({ email: normalizedEmail });
  const t2 = performance.now();
  console.log(`[Login Profile] User findOne took ${(t2 - t1).toFixed(2)}ms`);

  if (!user || !user.passwordHash) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  const t3 = performance.now();
  console.log(`[Login Profile] bcrypt.compare took ${(t3 - t2).toFixed(2)}ms`);

  if (!valid) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.role === "teacher" && user.status !== "approved") {
    return Response.json(
      { error: STATUS_MESSAGES[user.status] || STATUS_MESSAGES.pending },
      { status: 403 }
    );
  }

  await setSessionCookie({ id: user._id.toString(), name: user.name, role: user.role });

  return Response.json({
    user: { id: user._id, name: user.name, role: user.role, subjects: user.subjects },
  });
}
