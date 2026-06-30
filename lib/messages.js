import Message from "@/models/Message";
import User from "@/models/User";

export async function getMessagesForStudent(studentId) {
  const student = await User.findById(studentId).lean();
  return Message.find({
    teacher: student.addedBy,
    $and: [
      { $or: [{ audience: "all" }, { audience: "subject", subject: { $in: student.subjects || [] } }] },
      { $or: [{ class: null }, { class: student.class || null }] },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();
}
