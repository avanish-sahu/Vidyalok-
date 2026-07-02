import PDFDocument from "pdfkit";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Fee from "@/models/Fee";
import FeesSubmission from "@/models/FeesSubmission";
import { getAllClasses } from "@/lib/classes";

export const runtime = "nodejs";

function buildPdfBuffer({ className, submittedAt, students, summary }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).fillColor("#1a1a1a").text("Class Fees Report", { align: "center", underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#666666").text(`Class: ${className}   |   Generated: ${new Date(submittedAt).toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor("#000000").text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333333");
    doc.text(`Total Fees Required: Rs. ${summary.totalRequired}`);
    doc.text(`Total Amount Collected: Rs. ${summary.totalPaid}`);
    doc.text(`Total Pending: Rs. ${summary.totalPending}`);
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor("#000000");
    const tableTop = doc.y;
    doc.text("S.No", 50, tableTop, { width: 35 });
    doc.text("Student Name", 90, tableTop, { width: 190 });
    doc.text("Course Fee", 290, tableTop, { width: 90, align: "right" });
    doc.text("Paid", 390, tableTop, { width: 70, align: "right" });
    doc.text("Pending", 465, tableTop, { width: 80, align: "right" });

    doc.moveDown(0.3);
    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(550, lineY).strokeColor("#cccccc").lineWidth(1).stroke();
    doc.moveDown(0.5);

    let currentY = doc.y + 4;
    students.forEach((s, i) => {
      if (currentY > 700) { doc.addPage(); currentY = 50; }
      const pendingColor = s.pending > 0 ? "#cc0000" : "#444444";
      doc.fontSize(10).fillColor("#444444");
      doc.text(`${i + 1}`, 50, currentY, { width: 35 });
      doc.text(`${s.name}`, 90, currentY, { width: 190 });
      doc.text(`Rs. ${s.totalFee}`, 290, currentY, { width: 90, align: "right" });
      doc.text(`Rs. ${s.amountPaid}`, 390, currentY, { width: 70, align: "right" });
      doc.fillColor(pendingColor).text(`Rs. ${s.pending}`, 465, currentY, { width: 80, align: "right" });
      currentY += 20;
    });

    currentY += 10;
    if (currentY > 700) { doc.addPage(); currentY = 50; }
    doc.moveTo(50, currentY).lineTo(550, currentY).strokeColor("#999999").lineWidth(1.5).stroke();
    currentY += 8;
    doc.fontSize(11).fillColor("#1a1a1a");
    doc.text("TOTALS", 50, currentY, { width: 230 });
    doc.text(`Rs. ${summary.totalRequired}`, 290, currentY, { width: 90, align: "right" });
    doc.text(`Rs. ${summary.totalPaid}`, 390, currentY, { width: 70, align: "right" });
    doc.fillColor("#cc0000").text(`Rs. ${summary.totalPending}`, 465, currentY, { width: 80, align: "right" });

    doc.end();
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Submission ID is required." }, { status: 400 });

    await connectDB();
    const submission = await FeesSubmission.findById(id).lean();
    if (!submission) return Response.json({ error: "Fees report not found." }, { status: 404 });

    const { class: classSlug, teacher: teacherId, submittedAt } = submission;

    const students = await User.find({ role: "student", addedBy: teacherId, class: classSlug })
      .select("name email").sort({ name: 1 }).lean();

    const fees = await Fee.find({ student: { $in: students.map((s) => s._id) } }).lean();
    const feesByStudent = Object.fromEntries(fees.map((f) => [f.student.toString(), f]));

    const classes = await getAllClasses();
    const className = classes.find((c) => c.slug === classSlug)?.name || classSlug;

    let totalRequired = 0, totalPaid = 0, totalPending = 0;
    const studentsData = students.map((s) => {
      const f = feesByStudent[s._id.toString()];
      const totalFee = f?.totalFee || 0;
      const amountPaid = f?.amount || 0;
      const pending = Math.max(0, totalFee - amountPaid);
      totalRequired += totalFee; totalPaid += amountPaid; totalPending += pending;
      return { name: s.name, totalFee, amountPaid, pending };
    });

    const pdfBuffer = await buildPdfBuffer({
      className, submittedAt,
      students: studentsData,
      summary: { totalRequired, totalPaid, totalPending },
    });

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fees-report-${classSlug}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Fees PDF generation failed:", err);
    return Response.json({ error: `PDF generation failed: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return Response.json({ error: "Only teachers can do this." }, { status: 403 });
    }

    const { class: classSlug } = await request.json();
    if (!classSlug) return Response.json({ error: "class is required." }, { status: 400 });

    await connectDB();

    const students = await User.find({ role: "student", addedBy: session.id, class: classSlug })
      .select("name").sort({ name: 1 }).lean();

    if (students.length === 0) {
      return Response.json({ error: "No students in this class to report." }, { status: 400 });
    }

    const fees = await Fee.find({ student: { $in: students.map((s) => s._id) } }).lean();
    const feesByStudent = Object.fromEntries(fees.map((f) => [f.student.toString(), f]));

    let totalRequired = 0, totalPaid = 0, totalPending = 0;
    students.forEach((s) => {
      const f = feesByStudent[s._id.toString()];
      const totalFee = f?.totalFee || 0;
      const amountPaid = f?.amount || 0;
      totalRequired += totalFee; totalPaid += amountPaid;
      totalPending += Math.max(0, totalFee - amountPaid);
    });

    let submission = await FeesSubmission.findOneAndUpdate(
      { teacher: session.id, class: classSlug },
      { teacher: session.id, class: classSlug, pdfUrl: "temp", totalRequired, totalPaid, totalPending, totalCount: students.length, submittedAt: new Date() },
      { upsert: true, returnDocument: "after" }
    );

    const pdfUrl = `/api/teacher/fees/pdf?id=${submission._id}`;
    submission = await FeesSubmission.findByIdAndUpdate(submission._id, { pdfUrl }, { new: true });

    return Response.json({ pdfUrl, submittedAt: submission.submittedAt, summary: { totalRequired, totalPaid, totalPending } });
  } catch (err) {
    console.error("fees pdf error:", err);
    return Response.json({ error: `PDF generation failed: ${err.message}` }, { status: 500 });
  }
}
