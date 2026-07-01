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
      ? {
          amount: fee.amount,
          paymentDate: fee.paymentDate,
          validUntil: fee.validUntil,
          totalFee: fee.totalFee || 0,
          installments: fee.installments || [],
        }
      : { amount: 0, paymentDate: null, validUntil: null, totalFee: 0, installments: [] },
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

  const { totalFee, newInstallment, validUntil, deleteInstallmentId } = await request.json();

  await connectDB();
  const Fee = (await import("@/models/Fee")).default;

  let fee = await Fee.findOne({ student: id });
  if (!fee) {
    fee = new Fee({
      student: id,
      totalFee: Number(totalFee) || 0,
      validUntil: validUntil ? new Date(validUntil) : null,
      updatedBy: session.id,
      installments: [],
    });
  }

  if (totalFee !== undefined) {
    fee.totalFee = Number(totalFee) || 0;
  }
  if (validUntil !== undefined) {
    fee.validUntil = validUntil ? new Date(validUntil) : null;
  }

  if (newInstallment) {
    const amountPaid = Number(newInstallment.amountPaid);
    const paymentDate = newInstallment.paymentDate ? new Date(newInstallment.paymentDate) : new Date();
    const remark = newInstallment.remark || "";
    
    if (amountPaid > 0) {
      fee.installments.push({ amountPaid, paymentDate, remark });
    }
  }

  if (deleteInstallmentId) {
    fee.installments = fee.installments.filter((inst) => inst._id.toString() !== deleteInstallmentId);
  }

  // Recalculate amount (total paid) and latest paymentDate
  const totalPaid = fee.installments.reduce((sum, inst) => sum + inst.amountPaid, 0);
  fee.amount = totalPaid;

  if (fee.installments.length > 0) {
    const dates = fee.installments.map((inst) => new Date(inst.paymentDate).getTime());
    fee.paymentDate = new Date(Math.max(...dates));
  } else {
    fee.paymentDate = null;
  }

  fee.updatedBy = session.id;
  await fee.save();

  return Response.json({
    fee: {
      amount: fee.amount,
      paymentDate: fee.paymentDate,
      validUntil: fee.validUntil,
      totalFee: fee.totalFee,
      installments: fee.installments,
    },
  });
}
