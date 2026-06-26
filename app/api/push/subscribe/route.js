import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "student") {
    return Response.json({ error: "Only students can subscribe to notifications." }, { status: 403 });
  }

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Invalid subscription." }, { status: 400 });
  }

  await connectDB();
  await PushSubscription.findOneAndUpdate(
    { student: session.id, endpoint },
    { student: session.id, endpoint, keys },
    { upsert: true }
  );

  return Response.json({ ok: true });
}
