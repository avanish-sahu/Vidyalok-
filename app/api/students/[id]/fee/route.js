import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { resolveStudentAccess } from "@/lib/studentAccess";
import { getFee } from "@/lib/performance";
import Fee from "@/models/Fee";

export async function GET(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }

  const fee = await getFee(id);
  return Response.json({
    fee: fee
      ? { amount: fee.amount, paymentDate: fee.paymentDate, validUntil: fee.validUntil }
      : { amount: 0, paymentDate: null, validUntil: null },
  });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  const access = await resolveStudentAccess(session, id);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  if (!access.isOwner) {
    return Response.json({ error: "Only the student's teacher can edit fees." }, { status: 403 });
  }

  const { amount, paymentDate, validUntil } = await request.json();

  await connectDB();
  const fee = await Fee.findOneAndUpdate(
    { student: id },
    {
      student: id,
      amount: Number(amount) || 0,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      updatedBy: session.id,
    },
    { upsert: true, returnDocument: "after" }
  );

  return Response.json({
    fee: { amount: fee.amount, paymentDate: fee.paymentDate, validUntil: fee.validUntil },
  });
}
