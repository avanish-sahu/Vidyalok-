import PDFDocument from "pdfkit";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Mark from "@/models/Mark";
import MarksSubmission from "@/models/MarksSubmission";
import { getAllSubjects } from "@/lib/subjects";
import { getAllClasses } from "@/lib/classes";

export const runtime = "nodejs";

function buildPdfBuffer({ subjectName, className, testName, dateStr, totalMarks, students }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title / Header
    doc.fontSize(22).fillColor("#1a1a1a").text("Test Marks Report", { align: "center", underline: true });
    doc.moveDown(1.5);

    // Meta Info Block
    doc.fontSize(12).fillColor("#333333");
    doc.text(`Subject: ${subjectName}`, { bold: true });
    doc.text(`Class: ${className}`);
    doc.text(`Test Name: ${testName}`);
    doc.text(`Total Marks: ${totalMarks}`);
    doc.text(`Date: ${dateStr}`);
    doc.moveDown(1.5);

    // Table Header
    doc.fontSize(12).fillColor("#000000");
    const tableTop = doc.y;
    doc.text("S.No", 50, tableTop, { width: 40 });
    doc.text("Student Name", 100, tableTop, { width: 250 });
    doc.text("Marks Obtained", 380, tableTop, { width: 120, align: "right" });
    
    // Draw line under header
    doc.moveDown(0.2);
    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(550, lineY).strokeColor("#cccccc").lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Table Rows
    let currentY = doc.y + 5;
    students.forEach((s, i) => {
      // Prevent overflow
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const score = s.marksObtained !== null && s.marksObtained !== undefined && s.marksObtained !== "" 
        ? `${s.marksObtained} / ${totalMarks}` 
        : "Absent / Not marked";
      
      doc.fontSize(11).fillColor("#444444");
      doc.text(`${i + 1}`, 50, currentY, { width: 40 });
      doc.text(`${s.name}`, 100, currentY, { width: 250 });
      doc.text(`${score}`, 380, currentY, { width: 120, align: "right" });
      
      currentY += 22;
    });

    // Summary statistics at bottom
    const markedStudents = students.filter((s) => s.marksObtained !== null && s.marksObtained !== undefined && s.marksObtained !== "");
    const totalObtained = markedStudents.reduce((sum, s) => sum + Number(s.marksObtained), 0);
    const averageMarks = markedStudents.length > 0 ? (totalObtained / markedStudents.length).toFixed(2) : 0;

    currentY += 15;
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }
    doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor("#999999").lineWidth(1.5).stroke();
    currentY += 10;
    doc.fontSize(12).fillColor("#1a1a1a");
    doc.text(`Total Enrolled Students: ${students.length}`, 50, currentY);
    doc.text(`Average Class Performance: ${averageMarks} / ${totalMarks}`, 300, currentY, { align: "right" });

    doc.end();
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Submission ID is required." }, { status: 400 });
    }

    await connectDB();
    const submission = await MarksSubmission.findById(id).lean();
    if (!submission) {
      return Response.json({ error: "Marks report not found." }, { status: 404 });
    }

    const { subject, class: classSlug, testName, date, totalMarks, teacher: teacherId } = submission;

    const students = await User.find({
      role: "student",
      addedBy: teacherId,
      subjects: subject,
      class: classSlug,
    })
      .select("name")
      .sort({ name: 1 })
      .lean();

    const records = await Mark.find({
      subject,
      testName,
      student: { $in: students.map((s) => s._id) },
    }).lean();
    const marksByStudent = Object.fromEntries(records.map((r) => [r.student.toString(), r.marksObtained]));

    const [subjects, classes] = await Promise.all([getAllSubjects(), getAllClasses()]);
    const subjectName = subjects.find((s) => s.slug === subject)?.name || subject;
    const className = classes.find((c) => c.slug === classSlug)?.name || classSlug;

    const pdfBuffer = await buildPdfBuffer({
      subjectName,
      className,
      testName,
      dateStr: new Date(date).toLocaleDateString(),
      totalMarks,
      students: students.map((s) => ({ name: s.name, marksObtained: marksByStudent[s._id.toString()] })),
    });

    let safeDateStr = "report";
    try {
      safeDateStr = new Date(date).toISOString().slice(0, 10);
    } catch (e) {
      // ignore formatting issues
    }

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="marks-${safeDateStr}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation on-the-fly failed:", err);
    return Response.json({ error: `PDF generation failed: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return Response.json({ error: "Only teachers can do this." }, { status: 403 });
    }

    const { subject, class: classSlug, testName, date, totalMarks, marks } = await request.json();
    if (!subject || !classSlug || !testName || !date || !totalMarks || !marks) {
      return Response.json({ error: "All fields are required." }, { status: 400 });
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

    let totalObtained = 0;
    let count = 0;

    for (const student of students) {
      const obtainedStr = marks[student._id.toString()];
      if (obtainedStr !== undefined && obtainedStr !== null && obtainedStr !== "") {
        const marksObtained = Number(obtainedStr);
        if (marksObtained > Number(totalMarks)) {
          return Response.json({ error: `Marks obtained for ${student.name} can't exceed total marks.` }, { status: 400 });
        }

        await Mark.findOneAndUpdate(
          { student: student._id, subject, testName: testName.trim() },
          {
            student: student._id,
            subject,
            testName: testName.trim(),
            date: new Date(date),
            marksObtained,
            totalMarks: Number(totalMarks),
            addedBy: session.id,
          },
          { upsert: true }
        );
        totalObtained += marksObtained;
        count++;
      }
    }

    const averageMarks = count > 0 ? Number((totalObtained / count).toFixed(2)) : 0;

    // Create/update submission document (temporary pdfUrl as we need the ID)
    let submission = await MarksSubmission.findOneAndUpdate(
      { teacher: session.id, subject, class: classSlug, testName: testName.trim() },
      {
        teacher: session.id,
        subject,
        class: classSlug,
        testName: testName.trim(),
        date: new Date(date),
        pdfUrl: "temp",
        totalMarks: Number(totalMarks),
        averageMarks,
        totalCount: students.length,
        submittedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );

    const pdfUrl = `/api/teacher/marks/pdf?id=${submission._id}`;

    submission = await MarksSubmission.findByIdAndUpdate(
      submission._id,
      { pdfUrl },
      { new: true }
    );

    return Response.json({ pdfUrl, submittedAt: submission.submittedAt });
  } catch (err) {
    console.error("marks pdf error:", err);
    return Response.json({ error: `PDF generation failed: ${err.message}` }, { status: 500 });
  }
}
