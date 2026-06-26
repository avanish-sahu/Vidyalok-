import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User";
import PushSubscription from "@/models/PushSubscription";
import { sendPushToSubscriptions } from "@/lib/push";
import { getMessagesForStudent } from "@/lib/messages";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectDB();

  if (session.role === "teacher") {
    const messages = await Message.find({ teacher: session.id }).sort({ createdAt: -1 }).lean();
    return Response.json({ messages });
  }

  if (session.role === "student") {
    const messages = await getMessagesForStudent(session.id);
    return Response.json({ messages });
  }

  return Response.json({ messages: [] });
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can send messages." }, { status: 403 });
  }

  await connectDB();
  const teacher = await User.findById(session.id).lean();
  if (!teacher || teacher.status !== "approved") {
    return Response.json({ error: "Your teacher account is not approved." }, { status: 403 });
  }

  const { audience, subject, text } = await request.json();
  if (!audience || !text) {
    return Response.json({ error: "audience and text are required." }, { status: 400 });
  }
  if (!["all", "subject"].includes(audience)) {
    return Response.json({ error: "Invalid audience." }, { status: 400 });
  }
  if (audience === "subject") {
    if (!subject || !teacher.subjects?.includes(subject)) {
      return Response.json({ error: "Pick one of your subjects." }, { status: 400 });
    }
  }

  const message = await Message.create({
    teacher: session.id,
    teacherName: teacher.name,
    audience,
    subject: audience === "subject" ? subject : null,
    text,
  });

  const studentFilter =
    audience === "all"
      ? { role: "student", addedBy: session.id }
      : { role: "student", addedBy: session.id, subjects: subject };
  const students = await User.find(studentFilter).select("_id").lean();
  const studentIds = students.map((s) => s._id);

  const subscriptions = await PushSubscription.find({ student: { $in: studentIds } }).lean();

  let notified = 0;
  if (subscriptions.length > 0) {
    const { successCount, deadEndpoints } = await sendPushToSubscriptions(subscriptions, {
      title: `Message from ${teacher.name}`,
      body: text,
      url: "/notifications",
    });
    notified = successCount;
    if (deadEndpoints.length > 0) {
      await PushSubscription.deleteMany({ endpoint: { $in: deadEndpoints } });
    }
  }

  return Response.json({ message, recipientCount: studentIds.length, notified });
}
