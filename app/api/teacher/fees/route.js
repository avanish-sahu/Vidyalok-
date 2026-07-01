import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Fee from "@/models/Fee";

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return Response.json({ error: "Only teachers can view this." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classParam = searchParams.get("class");

  if (!classParam) {
    return Response.json({ error: "class parameter is required." }, { status: 400 });
  }

  await connectDB();

  const studentFilter = { role: "student", addedBy: session.id };
  if (classParam !== "all") {
    studentFilter.class = classParam;
  }

  const students = await User.find(studentFilter)
    .select("name email")
    .sort({ name: 1 })
    .lean();

  const fees = await Fee.find({
    student: { $in: students.map((s) => s._id) },
  }).lean();

  const feesByStudent = Object.fromEntries(
    fees.map((f) => [
      f.student.toString(),
      {
        totalFee: f.totalFee || 0,
        amountPaid: f.amount || 0,
        pending: Math.max(0, (f.totalFee || 0) - (f.amount || 0)),
      },
    ])
  );

  let totalRequired = 0;
  let totalPaid = 0;
  let totalPending = 0;

  const studentsWithFees = students.map((s) => {
    const feeData = feesByStudent[s._id.toString()] || { totalFee: 0, amountPaid: 0, pending: 0 };
    totalRequired += feeData.totalFee;
    totalPaid += feeData.amountPaid;
    totalPending += feeData.pending;
    return {
      id: s._id,
      name: s.name,
      email: s.email,
      totalFee: feeData.totalFee,
      amountPaid: feeData.amountPaid,
      pending: feeData.pending,
    };
  });

  return Response.json({
    students: studentsWithFees,
    summary: {
      totalRequired,
      totalPaid,
      totalPending,
    },
  });
}
