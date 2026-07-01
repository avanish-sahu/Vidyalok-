import * as bcrypt from "@node-rs/bcrypt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// Only teachers apply for an account here; they stay "pending" until an
// admin approves them. Students never self-signup — see /api/students.
export async function POST(request) {
  const body = await request.json();
  const { name, email, password, subjects } = body;

  if (!name || !email || !password) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return Response.json({ error: "Select at least one subject you teach." }, { status: 400 });
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role: "teacher",
    status: "pending",
    subjects,
  });

  return Response.json({
    pending: true,
    message: "Your application has been submitted. You'll be able to log in once an admin approves your account.",
  });
}
