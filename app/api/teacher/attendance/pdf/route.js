import { mkdir, writeFile } from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import AttendanceSubmission from "@/models/AttendanceSubmission";
import { getAllSubjects } from "@/lib/subjects";
import { getAllClasses } from "@/lib/classes";

export const runtime = "nodejs";

function buildPdfBuffer({ subjectName, className, dateStr, students }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Attendance Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Class: ${className}`);
    doc.text(`Subject: ${subjectName}`);
    doc.text(`Date: ${dateStr}`);
    doc.moveDown();

    const presentCount = students.filter((s) => s.present === true).length;
    doc.text(`Present: ${presentCount} / ${students.length}`);
    doc.moveDown();

    students.forEach((s, i) => {
      const status = s.present === true ? "Present" : s.present === false ? "Absent" : "Not marked";
      doc.fontSize(11).text(`${i + 1}. ${s.name}  —  ${status}`);
    });

    doc.end();
  });
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return Response.json({ error: "Only teachers can do this." }, { status: 403 });
    }

    const { subject, class: classSlug, date } = await request.json();
    if (!subject || !classSlug || !date) {
      return Response.json({ error: "subject, class and date are required." }, { status: 400 });
    }

    await connectDB();
    const teacher = await User.findById(session.id).lean();
    if (!teacher.subjects?.includes(subject)) {
      return Response.json({ error: "You are not assigned to this subject." }, { status: 403 });
    }

    const students = await User.find({
      role: "student",
      addedBy: session.id,
      subjects: subject,
      class: classSlug,
    })
      .select("name")
      .sort({ name: 1 })
      .lean();

    if (students.length === 0) {
      return Response.json({ error: "No students to report for this subject and class." }, { status: 400 });
    }

    const records = await Attendance.find({
      subject,
      date: new Date(date),
      student: { $in: students.map((s) => s._id) },
    }).lean();
    const presentByStudent = Object.fromEntries(records.map((r) => [r.student.toString(), r.present]));

    const [subjects, classes] = await Promise.all([getAllSubjects(), getAllClasses()]);
    const subjectName = subjects.find((s) => s.slug === subject)?.name || subject;
    const className = classes.find((c) => c.slug === classSlug)?.name || classSlug;

    const pdfBuffer = await buildPdfBuffer({
      subjectName,
      className,
      dateStr: new Date(date).toLocaleDateString(),
      students: students.map((s) => ({ name: s.name, present: presentByStudent[s._id.toString()] ?? null })),
    });

    const filename = `${date}-${Date.now()}.pdf`;
    const dir = path.join(process.cwd(), "public", "uploads", "attendance", classSlug, subject);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), pdfBuffer);

    const pdfUrl = `/uploads/attendance/${classSlug}/${subject}/${filename}`;
    const presentCount = students.filter((s) => presentByStudent[s._id.toString()] === true).length;

    // One submission per teacher+subject+class+date — resubmitting updates it
    // in place rather than creating a duplicate entry.
    const submission = await AttendanceSubmission.findOneAndUpdate(
      { teacher: session.id, subject, class: classSlug, date: new Date(date) },
      {
        teacher: session.id,
        subject,
        class: classSlug,
        date: new Date(date),
        pdfUrl,
        presentCount,
        totalCount: students.length,
        submittedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );

    return Response.json({ pdfUrl, submittedAt: submission.submittedAt });
  } catch (err) {
    console.error("attendance pdf error:", err);
    return Response.json({ error: `PDF generation failed: ${err.message}` }, { status: 500 });
  }
}
