import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User";
import PushSubscription from "@/models/PushSubscription";
import { sendPushToSubscriptions } from "@/lib/push";
import { getMessagesForStudent } from "@/lib/messages";
import { getAllClasses } from "@/lib/classes";

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

  const { audience, subject, class: classField, text } = await request.json();
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

  let messageClass = null;
  if (classField && classField !== "general") {
    const classes = await getAllClasses();
    if (!classes.some((c) => c.slug === classField)) {
      return Response.json({ error: "Invalid class." }, { status: 400 });
    }
    messageClass = classField;
  }

  const message = await Message.create({
    teacher: session.id,
    teacherName: teacher.name,
    audience,
    subject: audience === "subject" ? subject : null,
    class: messageClass,
    text,
  });

  const studentFilter = { role: "student", addedBy: session.id };
  if (audience === "subject") studentFilter.subjects = subject;
  if (messageClass) studentFilter.class = messageClass;
  const students = await User.find(studentFilter).select("_id email name").lean();
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

  // Send email notifications — awaited so Vercel doesn't kill them before they complete
  const { sendEmail } = await import("@/lib/email");
  await Promise.allSettled(
    students
      .filter((s) => s.email)
      .map((student) =>
        sendEmail({
          to: student.email,
          subject: `New Message from ${teacher.name}`,
          text: `Hello ${student.name},\n\nYou have received a new message from your teacher ${teacher.name}:\n\n"${text}"\n\nLog in to TutorHub to view.\n\nBest regards,\nTutorHub Team`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h2 style="color: #0070f3;">New Message from ${teacher.name}</h2>
              <p>Hello <strong>${student.name}</strong>,</p>
              <p>You have received a new message from your teacher <strong>${teacher.name}</strong>:</p>
              <blockquote style="background-color: #f9f9f9; border-left: 4px solid #0070f3; padding: 15px; margin: 20px 0; font-style: italic;">
                "${text}"
              </blockquote>
              <p>Log in to the portal to view the details.</p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">This is an automated notification from TutorHub. Please do not reply directly to this email.</p>
            </div>
          `,
        })
      )
  );

  return Response.json({ message, recipientCount: studentIds.length, notified });
}
