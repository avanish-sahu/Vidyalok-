import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getMessagesForStudent } from "@/lib/messages";
import StudentLayout from "@/app/components/StudentLayout";
import SubscribeButton from "./SubscribeButton";

export default async function NotificationsPage() {
  const session = await getSession();

  await connectDB();
  const messages = await getMessagesForStudent(session.id);

  return (
    <StudentLayout name={session.name} active="notifications">
      <h1>Notifications</h1>
      <SubscribeButton />

      {messages.length === 0 ? (
        <div className="empty-state">No messages from your teacher yet.</div>
      ) : (
        <div className="resource-list">
          {messages.map((m) => (
            <div className="resource-item" key={m._id}>
              <div>
                <h4>{m.text}</h4>
                <div className="resource-meta">
                  {m.teacherName} · {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
