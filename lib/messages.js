import Message from "@/models/Message";
import User from "@/models/User";

export async function getMessagesForStudent(studentId) {
  const student = await User.findById(studentId).lean();
  const teacherFilter = Array.isArray(student.addedBy)
    ? { $in: student.addedBy }
    : student.addedBy;
  return Message.find({
    teacher: teacherFilter,
    $and: [
      { $or: [{ audience: "all" }, { audience: "subject", subject: { $in: student.subjects || [] } }] },
      { $or: [{ class: null }, { class: student.class || null }] },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();
}
